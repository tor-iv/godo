from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from datetime import datetime

from app.database import db_manager
from app.models.swipe import SwipeCreate, Swipe, SwipeDirection, SwipeAction
from app.models.common import ErrorResponse
from app.middleware.auth import get_auth_middleware

router = APIRouter()

@router.post("/", response_model=Swipe, status_code=status.HTTP_201_CREATED)
async def create_swipe(
    swipe_data: SwipeCreate,
    current_user = Depends(get_auth_middleware().get_current_user)
):
    """
    Record a user swipe on an event.
    """
    # 1. Record the swipe
    swipe_record = {
        "user_id": str(current_user.id),
        "event_id": str(swipe_data.event_id),
        "direction": swipe_data.direction,
        "action": swipe_data.action,
        "confidence_score": swipe_data.confidence_score,
        "context_data": swipe_data.context_data,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Insert into swipes table
    response = await db_manager.supabase.table("swipes").insert(swipe_record).execute()
    
    if hasattr(response, 'error') and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {response.error.message}"
        )
        
    created_swipe = response.data[0]
    
    # 2. If action is GOING (Right/Up), add to calendar/attendance
    if swipe_data.action in [SwipeAction.GOING_PRIVATE, SwipeAction.GOING_SHARED]:
        attendance_record = {
            "user_id": str(current_user.id),
            "event_id": str(swipe_data.event_id),
            "status": "going",
            "visibility": swipe_data.visibility,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Upsert attendance
        # Note: In a real app, you might want to check if it already exists
        att_response = await db_manager.supabase.table("event_attendance").upsert(attendance_record).execute()
        
        if hasattr(att_response, 'error') and att_response.error:
            # Log error but don't fail the swipe? Or fail?
            # For now, let's fail to ensure consistency
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update attendance: {att_response.error.message}"
            )
            
    return Swipe(**created_swipe)
