from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database import db_manager
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
    
    # This is a placeholder query. You'll need to adjust based on your actual DB schema and Supabase client
    response = await db_manager.supabase.table("events").select("*").limit(limit).execute()
    
    if hasattr(response, 'error') and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {response.error.message}"
        )
        
    events_data = response.data
    recommendations = []
    
    for event_data in events_data:
        # Wrap in EventRecommendation
        event = Event(**event_data)
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
    response = await db_manager.supabase.table("events").select("*").eq("id", str(event_id)).single().execute()
    
    if hasattr(response, 'error') and response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
        
    return Event(**response.data)
