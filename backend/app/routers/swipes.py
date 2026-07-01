from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from datetime import datetime
import logging

import asyncpg

from app.database import acquire
from app.models.swipe import SwipeCreate, Swipe, SwipeDirection, SwipeAction
from app.models.common import ErrorResponse
from app.middleware.auth import get_auth_middleware
from app.tasks.calendar_tasks import sync_event_to_google_calendar

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=Swipe, status_code=status.HTTP_201_CREATED)
async def create_swipe(
    swipe_data: SwipeCreate,
    current_user = Depends(get_auth_middleware().get_current_user)
):
    """
    Record a user swipe on an event.
    """
    now = datetime.utcnow()

    async with acquire() as conn:
        # 1. Record the swipe
        try:
            created_swipe = await conn.fetchrow(
                """
                INSERT INTO swipes
                    (user_id, event_id, direction, action, confidence_score, context_data, created_at)
                VALUES
                    ($1, $2, $3::swipe_direction, $4::swipe_action, $5, $6, $7)
                RETURNING *
                """,
                current_user.id,
                swipe_data.event_id,
                swipe_data.direction.value,
                swipe_data.action.value,
                swipe_data.confidence_score,
                swipe_data.context_data,
                now,
            )
        except asyncpg.PostgresError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {e}"
            )

        # 2. If action is GOING (Right/Up), add to calendar/attendance
        if swipe_data.action in [SwipeAction.GOING_PRIVATE, SwipeAction.GOING_SHARED]:
            # Upsert attendance
            # Note: In a real app, you might want to check if it already exists
            try:
                await conn.execute(
                    """
                    INSERT INTO event_attendance
                        (user_id, event_id, status, visibility, created_at, updated_at)
                    VALUES
                        ($1, $2, 'going'::attendance_status, $3::visibility_level, $4, $5)
                    ON CONFLICT (user_id, event_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        visibility = EXCLUDED.visibility,
                        updated_at = EXCLUDED.updated_at
                    """,
                    current_user.id,
                    swipe_data.event_id,
                    swipe_data.visibility.value,
                    now,
                    now,
                )
            except asyncpg.PostgresError as e:
                # Log error but don't fail the swipe? Or fail?
                # For now, let's fail to ensure consistency
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to update attendance: {e}"
                )

        going = swipe_data.action in [SwipeAction.GOING_PRIVATE, SwipeAction.GOING_SHARED]

    # Best-effort, fire-and-forget sync to the user's Google Calendar if
    # they've connected one (no-op otherwise). This runs async in Celery and
    # must never fail the swipe response: the swipe + attendance rows are
    # already committed above, so even a broker outage here (.delay() can
    # raise if Redis is unreachable) should only be logged, not surfaced.
    if going:
        try:
            sync_event_to_google_calendar.delay(str(current_user.id), str(swipe_data.event_id))
        except Exception as e:
            logger.warning(f"Failed to enqueue Google Calendar sync: {e}")

    return Swipe(**dict(created_swipe))
