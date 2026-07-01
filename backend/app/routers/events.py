from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database import acquire, LOCATION_POINT_SELECT
from app.models.event import Event, EventSearch, EventRecommendation
from app.models.common import ErrorResponse
from app.middleware.auth import get_auth_middleware

router = APIRouter()

@router.get("/feed", response_model=List[EventRecommendation])
async def get_event_feed(
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: float = Query(10.0, gt=0, le=50),
    limit: int = Query(20, ge=1, le=50),
    current_user = Depends(get_auth_middleware().get_current_user)
):
    """
    Get personalized event feed for the user.
    """
    # For now, we'll return a simple list of events from the DB
    # In a real implementation, this would call the ML recommendation service

    # This is a placeholder query. You'll need to adjust based on your actual DB schema
    try:
        async with acquire() as conn:
            rows = await conn.fetch(
                f"SELECT *, {LOCATION_POINT_SELECT} FROM events LIMIT $1",
                limit,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e}"
        )

    recommendations = []

    for row in rows:
        # Wrap in EventRecommendation
        event = Event(**dict(row))
        recommendations.append(
            EventRecommendation(
                event=event,
                recommendation_score=0.95, # Placeholder score
                recommendation_reasons=["Popular in your area"]
            )
        )

    return recommendations

@router.get("/{event_id}", response_model=Event)
async def get_event_details(
    event_id: UUID,
    current_user = Depends(get_auth_middleware().get_current_user)
):
    """
    Get details for a specific event.
    """
    try:
        async with acquire() as conn:
            row = await conn.fetchrow(
                f"SELECT *, {LOCATION_POINT_SELECT} FROM events WHERE id = $1",
                event_id,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e}"
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return Event(**dict(row))
