from pydantic import BaseModel, Field, UUID4, validator
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

class SwipeDirection(str, Enum):
    RIGHT = "right"  # Going (Private)
    LEFT = "left"    # Not interested
    UP = "up"        # Going (Share with Friends)  
    DOWN = "down"    # Maybe Later

class SwipeAction(str, Enum):
    GOING_PRIVATE = "going_private"
    GOING_SHARED = "going_shared"
    NOT_INTERESTED = "not_interested"
    MAYBE_LATER = "maybe_later"

class CalendarType(str, Enum):
    PRIVATE = "private"
    SHARED = "shared"
    PUBLIC = "public"

class VisibilityLevel(str, Enum):
    PRIVATE = "private"
    FRIENDS = "friends"
    PUBLIC = "public"

class SwipeBase(BaseModel):
    """Base swipe model"""
    event_id: UUID4
    direction: SwipeDirection

class SwipeCreate(SwipeBase):
    """Enhanced swipe creation model"""
    action: SwipeAction
    visibility: VisibilityLevel = VisibilityLevel.PRIVATE
    calendar_type: CalendarType = CalendarType.PRIVATE
    invite_friends: Optional[List[UUID4]] = []
    notes: Optional[str] = Field(None, max_length=500)
    confidence_score: Optional[float] = Field(1.0, ge=0, le=1)
    context_data: Optional[Dict[str, Any]] = {}
    
    @validator('action')
    def validate_action_direction_match(cls, v, values):
        """Ensure action matches direction"""
        direction_action_map = {
            SwipeDirection.RIGHT: SwipeAction.GOING_PRIVATE,
            SwipeDirection.UP: SwipeAction.GOING_SHARED,
            SwipeDirection.LEFT: SwipeAction.NOT_INTERESTED,
            SwipeDirection.DOWN: SwipeAction.MAYBE_LATER
        }
        expected_action = direction_action_map.get(values.get('direction'))
        if v != expected_action:
            raise ValueError(f'Action {v} does not match direction {values.get("direction")}')
        return v
    
    @validator('calendar_type')
    def validate_calendar_type_for_action(cls, v, values):
        """Set appropriate calendar type based on action"""
        action = values.get('action')
        if action == SwipeAction.GOING_SHARED and v == CalendarType.PRIVATE:
            return CalendarType.SHARED
        elif action == SwipeAction.GOING_PRIVATE and v == CalendarType.SHARED:
            return CalendarType.PRIVATE
        return v
    
    @validator('visibility')
    def validate_visibility_for_action(cls, v, values):
        """Set appropriate visibility based on action"""
        action = values.get('action')
        if action == SwipeAction.GOING_SHARED and v == VisibilityLevel.PRIVATE:
            return VisibilityLevel.FRIENDS
        elif action == SwipeAction.GOING_PRIVATE and v == VisibilityLevel.FRIENDS:
            return VisibilityLevel.PRIVATE
        return v
    
    @validator('invite_friends')
    def validate_invite_friends_limit(cls, v, values):
        """Limit number of friends that can be invited"""
        if v and len(v) > 10:
            raise ValueError('Cannot invite more than 10 friends per event')
        
        # Only allow friend invitations for shared actions
        action = values.get('action')
        if v and action not in [SwipeAction.GOING_SHARED]:
            raise ValueError('Friend invitations only allowed for shared events')
        
        return v

class SwipeUpdate(BaseModel):
    """Swipe update model (rarely used)"""
    direction: Optional[SwipeDirection] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)

class Swipe(SwipeBase):
    """Full swipe model"""
    id: UUID4
    user_id: UUID4
    confidence_score: float = 1.0
    context_data: Dict[str, Any] = {}
    created_at: datetime
    
    class Config:
        from_attributes = True

class SwipeWithEvent(Swipe):
    """Swipe model with event details"""
    event: Optional[Dict[str, Any]] = None  # Event data from join

class SwipeStats(BaseModel):
    """User swipe statistics"""
    user_id: UUID4
    total_swipes: int = 0
    right_swipes: int = 0
    left_swipes: int = 0
    up_swipes: int = 0
    down_swipes: int = 0
    accuracy_score: Optional[float] = None  # ML accuracy if available
    last_swipe: Optional[datetime] = None
    
class SwipeAnalytics(BaseModel):
    """Swipe analytics for events"""
    event_id: UUID4
    total_swipes: int = 0
    right_swipe_rate: float = 0.0
    left_swipe_rate: float = 0.0
    up_swipe_rate: float = 0.0
    down_swipe_rate: float = 0.0
    popularity_score: float = 0.0
    demographic_breakdown: Dict[str, Any] = {}

class SwipeRecommendationFeedback(BaseModel):
    """Feedback on ML recommendation accuracy"""
    user_id: UUID4
    event_id: UUID4
    predicted_direction: SwipeDirection
    actual_direction: SwipeDirection
    prediction_confidence: float
    was_accurate: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced models for invitations and calendar management

class SwipeContext(BaseModel):
    """Context data for ML feature extraction"""
    id: UUID4
    swipe_id: UUID4
    swipe_speed_ms: Optional[int] = None
    hesitation_time_ms: Optional[int] = None
    friends_attending_count: int = 0
    weather_condition: Optional[str] = None
    time_of_day: Optional[str] = None
    day_of_week: Optional[str] = None
    user_calendar_density: float = 0.0
    created_at: datetime
    
    class Config:
        from_attributes = True

class SwipeWithInvitations(Swipe):
    """Swipe model with invitation details"""
    action: SwipeAction
    visibility: VisibilityLevel
    calendar_type: CalendarType
    notes: Optional[str] = None
    invited_friends: List[UUID4] = []
    invitations_sent: int = 0
    context: Optional[SwipeContext] = None

# Calendar management models

class CalendarEvent(BaseModel):
    """Calendar event model"""
    event_id: UUID4
    event_title: str
    event_description: Optional[str] = None
    event_date_time: datetime
    event_location_name: str
    event_category: str
    event_image_url: Optional[str] = None
    attendance_status: str
    calendar_type: CalendarType
    visibility: VisibilityLevel
    notes: Optional[str] = None
    invited_friends_count: int = 0
    last_edited: datetime
    
    class Config:
        from_attributes = True

class CalendarEventUpdate(BaseModel):
    """Update calendar event model"""
    attendance_status: Optional[str] = Field(None, pattern="^(going|maybe|not_going)$")
    calendar_type: Optional[CalendarType] = None
    visibility: Optional[VisibilityLevel] = None
    notes: Optional[str] = Field(None, max_length=500)
    
class CalendarFilters(BaseModel):
    """Calendar filtering options"""
    calendar_type: Optional[str] = Field(None, pattern="^(private|shared|public|all)$")
    status: Optional[str] = Field(None, pattern="^(going|maybe|saved|all)$")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)