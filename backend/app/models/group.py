from pydantic import BaseModel, Field, UUID4, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class GroupMemberRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"

class GroupPrivacyLevel(str, Enum):
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"
    PUBLIC = "public"

class GroupBase(BaseModel):
    """Base group model"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    privacy_level: GroupPrivacyLevel = GroupPrivacyLevel.PRIVATE
    max_members: int = Field(50, ge=2, le=100)

class GroupCreate(GroupBase):
    """Create group model"""
    initial_members: Optional[List[UUID4]] = []
    group_image: Optional[str] = None
    
    @validator('initial_members')
    def validate_initial_members_limit(cls, v):
        """Limit initial members"""
        if v and len(v) > 20:
            raise ValueError('Cannot add more than 20 initial members')
        return v

class GroupUpdate(BaseModel):
    """Update group model"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    privacy_level: Optional[GroupPrivacyLevel] = None
    max_members: Optional[int] = Field(None, ge=2, le=100)
    group_image_url: Optional[str] = None

class Group(GroupBase):
    """Full group model"""
    id: UUID4
    created_by: UUID4
    group_image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    current_member_count: int = 0
    admin_count: int = 0
    recent_activity_count: int = 0
    
    class Config:
        from_attributes = True

class GroupMember(BaseModel):
    """Group member model"""
    id: UUID4
    group_id: UUID4
    user_id: UUID4
    role: GroupMemberRole
    joined_at: datetime
    
    # User details (from join)
    user_name: Optional[str] = None
    user_profile_image: Optional[str] = None
    user_neighborhood: Optional[str] = None
    
    class Config:
        from_attributes = True

class GroupWithMembers(Group):
    """Group with member details"""
    members: List[GroupMember] = []
    creator_name: Optional[str] = None
    creator_profile_image: Optional[str] = None
    user_role: Optional[GroupMemberRole] = None
    user_joined_at: Optional[datetime] = None

class GroupInvite(BaseModel):
    """Group invitation model"""
    group_id: UUID4
    invitee_ids: List[UUID4] = Field(..., min_items=1, max_items=10)
    message: Optional[str] = Field(None, max_length=300)
    role: GroupMemberRole = GroupMemberRole.MEMBER
    
    @validator('invitee_ids')
    def validate_unique_invitees(cls, v):
        """Ensure no duplicate invitee IDs"""
        if len(v) != len(set(v)):
            raise ValueError('Duplicate invitee IDs not allowed')
        return v

class GroupMemberUpdate(BaseModel):
    """Update group member"""
    role: Optional[GroupMemberRole] = None

class GroupEventPlanning(BaseModel):
    """Group event planning model"""
    id: UUID4
    group_id: UUID4
    event_id: UUID4
    planned_by: UUID4
    planning_status: str = Field(..., pattern="^(proposed|voting|confirmed|cancelled)$")
    votes_for: int = 0
    votes_against: int = 0
    votes_maybe: int = 0
    planning_notes: Optional[str] = None
    meeting_point: Optional[str] = None
    meeting_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class GroupEventVote(BaseModel):
    """Group event vote model"""
    planning_id: UUID4
    vote: str = Field(..., pattern="^(for|against|maybe)$")
    notes: Optional[str] = Field(None, max_length=200)

class GroupActivity(BaseModel):
    """Group activity model"""
    id: UUID4
    group_id: UUID4
    user_id: UUID4
    activity_type: str  # 'member_joined', 'event_planned', 'event_attended', 'message_sent'
    activity_description: str
    event_id: Optional[UUID4] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime
    
    # User details (from join)
    user_name: Optional[str] = None
    user_profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class GroupChat(BaseModel):
    """Simple group chat model"""
    id: UUID4
    group_id: UUID4
    sender_id: UUID4
    message: str = Field(..., max_length=1000)
    message_type: str = Field("text", pattern="^(text|event_share|image|system)$")
    event_id: Optional[UUID4] = None  # If sharing an event
    image_url: Optional[str] = None
    created_at: datetime
    
    # Sender details (from join)
    sender_name: Optional[str] = None
    sender_profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True

class GroupChatCreate(BaseModel):
    """Create group chat message"""
    message: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field("text", pattern="^(text|event_share|image)$")
    event_id: Optional[UUID4] = None
    image_url: Optional[str] = None

class GroupDiscovery(BaseModel):
    """Group discovery model"""
    query: Optional[str] = Field(None, min_length=2, max_length=50)
    categories: Optional[List[str]] = []
    neighborhood: Optional[str] = None
    privacy_level: Optional[GroupPrivacyLevel] = None
    min_members: Optional[int] = Field(None, ge=2)
    max_members: Optional[int] = Field(None, le=100)
    sort_by: str = Field("activity", pattern="^(activity|members|created|name)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    limit: int = Field(20, ge=1, le=50)
    offset: int = Field(0, ge=0)

class GroupSuggestion(BaseModel):
    """Group suggestion model"""
    group: Group
    suggestion_score: float = Field(..., ge=0, le=1)
    suggestion_reasons: List[str] = []
    mutual_members: List[GroupMember] = []
    common_interests: List[str] = []
    recent_activity_level: str = Field(..., pattern="^(high|medium|low)$")

class GroupStats(BaseModel):
    """Group statistics"""
    group_id: UUID4
    total_members: int = 0
    active_members_week: int = 0
    events_planned: int = 0
    events_attended: int = 0
    messages_sent: int = 0
    member_retention_rate: float = 0.0
    avg_member_tenure_days: float = 0.0
    activity_score: float = 0.0

class GroupFilters(BaseModel):
    """Group filtering options"""
    user_role: Optional[GroupMemberRole] = None
    privacy_level: Optional[GroupPrivacyLevel] = None
    member_count_min: Optional[int] = None
    member_count_max: Optional[int] = None
    activity_level: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    created_after: Optional[datetime] = None
    has_upcoming_events: Optional[bool] = None
    sort_by: str = Field("activity", pattern="^(activity|members|created|name)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

class GroupEventSummary(BaseModel):
    """Summary of group events"""
    group_id: UUID4
    upcoming_events: List[Dict[str, Any]] = []
    planned_events: List[Dict[str, Any]] = []
    past_events: List[Dict[str, Any]] = []
    total_events: int = 0
    avg_attendance_rate: float = 0.0

class GroupNotification(BaseModel):
    """Group notification model"""
    group_id: UUID4
    notification_type: str
    title: str
    body: str
    data: Dict[str, Any] = {}
    recipient_ids: List[UUID4] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)