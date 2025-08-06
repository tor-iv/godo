from pydantic import BaseModel, Field, UUID4, validator
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"

class InvitationType(str, Enum):
    FRIEND_INVITE = "friend_invite"
    GROUP_INVITE = "group_invite"

class ResponseType(str, Enum):
    ACCEPTED = "accepted"
    DECLINED = "declined"
    MAYBE = "maybe"

class InvitationBase(BaseModel):
    """Base invitation model"""
    event_id: UUID4
    message: Optional[str] = Field(None, max_length=500)

class InvitationCreate(InvitationBase):
    """Create invitation model"""
    invitee_ids: List[UUID4] = Field(..., min_items=1, max_items=10)
    invitation_type: InvitationType = InvitationType.FRIEND_INVITE
    expires_in_days: int = Field(7, ge=1, le=30)
    
    @validator('invitee_ids')
    def validate_unique_invitees(cls, v):
        """Ensure no duplicate invitee IDs"""
        if len(v) != len(set(v)):
            raise ValueError('Duplicate invitee IDs not allowed')
        return v

class BulkInvitationCreate(BaseModel):
    """Bulk invitation creation for multiple events or friends"""
    event_id: UUID4
    invitee_ids: List[UUID4] = Field(..., min_items=1, max_items=10)
    message: Optional[str] = Field(None, max_length=500)
    invitation_type: InvitationType = InvitationType.FRIEND_INVITE

class EventInvitation(InvitationBase):
    """Full invitation model"""
    id: UUID4
    inviter_id: UUID4
    invitee_id: UUID4
    status: InvitationStatus
    invitation_type: InvitationType
    created_at: datetime
    responded_at: Optional[datetime] = None
    expires_at: datetime
    
    # Event details (from join)
    event_title: Optional[str] = None
    event_date_time: Optional[datetime] = None
    event_location_name: Optional[str] = None
    event_image_url: Optional[str] = None
    
    # Inviter details (from join)
    inviter_name: Optional[str] = None
    inviter_profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class InvitationWithDetails(EventInvitation):
    """Invitation with full event and user details"""
    event: Optional[Dict[str, Any]] = None
    inviter: Optional[Dict[str, Any]] = None
    mutual_friends_count: Optional[int] = 0

class InvitationResponse(BaseModel):
    """Response to invitation"""
    response_type: ResponseType
    response_message: Optional[str] = Field(None, max_length=300)

class InvitationResponseRecord(BaseModel):
    """Invitation response record"""
    id: UUID4
    invitation_id: UUID4
    response_type: ResponseType
    response_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvitationStats(BaseModel):
    """Invitation statistics for users"""
    user_id: UUID4
    invitations_sent: int = 0
    invitations_received: int = 0
    invitations_accepted: int = 0
    invitations_declined: int = 0
    response_rate: float = 0.0
    acceptance_rate: float = 0.0
    average_response_time_hours: Optional[float] = None

class InvitationNotification(BaseModel):
    """Notification model for invitations"""
    invitation_id: UUID4
    notification_type: str  # 'invitation_received', 'invitation_accepted', 'invitation_declined'
    title: str
    body: str
    data: Dict[str, Any] = {}
    recipient_id: UUID4
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvitationFilters(BaseModel):
    """Filters for invitation queries"""
    status: Optional[InvitationStatus] = None
    invitation_type: Optional[InvitationType] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    event_category: Optional[str] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

class InvitationBatch(BaseModel):
    """Batch invitation processing result"""
    total_sent: int = 0
    successful: List[UUID4] = []
    failed: List[Dict[str, Any]] = []
    errors: List[str] = []

# Friend discovery models for invitations

class FriendInvitationSuggestion(BaseModel):
    """Suggested friends for event invitation"""
    user_id: UUID4
    user_name: str
    user_profile_image: Optional[str] = None
    mutual_friends_count: int = 0
    common_event_categories: List[str] = []
    recent_event_attendance: int = 0
    suggestion_score: float = Field(..., ge=0, le=1)
    suggestion_reason: str

class InvitationContext(BaseModel):
    """Context for sending invitations"""
    event_id: UUID4
    suggested_friends: List[FriendInvitationSuggestion] = []
    user_recent_invitations: int = 0
    event_popularity: float = 0.0
    mutual_friend_attendees: List[UUID4] = []

# Validation helpers

def validate_invitation_expiry(expires_at: datetime) -> bool:
    """Validate that invitation hasn't expired"""
    return expires_at > datetime.utcnow()

def calculate_expiry_date(days: int = 7) -> datetime:
    """Calculate expiry date for invitation"""
    return datetime.utcnow() + timedelta(days=days)