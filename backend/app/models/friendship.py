from pydantic import BaseModel, Field, UUID4, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"

class FriendshipBase(BaseModel):
    """Base friendship model"""
    friend_id: UUID4

class FriendshipCreate(FriendshipBase):
    """Create friendship model"""
    message: Optional[str] = Field(None, max_length=200)

class Friendship(FriendshipBase):
    """Full friendship model"""
    id: UUID4
    user_id: UUID4
    status: FriendshipStatus
    initiated_by: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FriendProfile(BaseModel):
    """Friend profile model"""
    id: UUID4
    full_name: Optional[str] = None
    age: Optional[int] = None
    location_neighborhood: Optional[str] = None
    profile_image_url: Optional[str] = None
    privacy_level: str
    mutual_friends_count: int = 0
    friendship_status: Optional[FriendshipStatus] = None
    friendship_created_at: Optional[datetime] = None
    
    # Activity stats
    recent_events_attended: int = 0
    shared_event_categories: List[str] = []
    last_active: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class FriendActivity(BaseModel):
    """Friend activity model for feeds"""
    friend_id: UUID4
    friend_name: str
    friend_profile_image: Optional[str] = None
    activity_type: str  # 'event_swipe', 'event_attendance', 'new_friend'
    activity_description: str
    event_id: Optional[UUID4] = None
    event_title: Optional[str] = None
    event_date_time: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class FriendRequest(BaseModel):
    """Friend request model"""
    id: UUID4
    requester_id: UUID4
    requester_name: str
    requester_profile_image: Optional[str] = None
    message: Optional[str] = None
    mutual_friends_count: int = 0
    mutual_friends: List[FriendProfile] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

class FriendRequestResponse(BaseModel):
    """Response to friend request"""
    accept: bool
    message: Optional[str] = Field(None, max_length=200)

class FriendSearch(BaseModel):
    """Friend search parameters"""
    query: Optional[str] = Field(None, min_length=2, max_length=50)
    neighborhood: Optional[str] = None
    age_min: Optional[int] = Field(None, ge=18, le=50)
    age_max: Optional[int] = Field(None, ge=18, le=50)
    shared_categories: Optional[List[str]] = []
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

class FriendSuggestion(BaseModel):
    """Friend suggestion model"""
    user: FriendProfile
    suggestion_score: float = Field(..., ge=0, le=1)
    suggestion_reasons: List[str] = []
    mutual_friends: List[FriendProfile] = []
    common_interests: List[str] = []

class FriendListFilters(BaseModel):
    """Filters for friend list"""
    status: Optional[FriendshipStatus] = None
    neighborhood: Optional[str] = None
    recent_activity_days: Optional[int] = Field(None, ge=1, le=365)
    shared_categories: Optional[List[str]] = []
    sort_by: str = Field("name", pattern="^(name|recent_activity|mutual_friends|joined_date)$")
    sort_order: str = Field("asc", pattern="^(asc|desc)$")
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)

class FriendsEventActivity(BaseModel):
    """Friends' event activity summary"""
    events_friends_attending: List[Dict[str, Any]] = []
    friends_recent_swipes: List[Dict[str, Any]] = []
    trending_among_friends: List[Dict[str, Any]] = []
    upcoming_friend_events: List[Dict[str, Any]] = []

class FriendshipStats(BaseModel):
    """Friendship statistics"""
    user_id: UUID4
    total_friends: int = 0
    pending_sent: int = 0
    pending_received: int = 0
    blocked_count: int = 0
    mutual_connections: Dict[str, int] = {}
    friend_growth_rate: float = 0.0
    avg_response_time_hours: Optional[float] = None

# Phone contact sync models

class PhoneContact(BaseModel):
    """Phone contact for friend discovery"""
    phone_hash: str = Field(..., min_length=32, max_length=64)
    contact_name: Optional[str] = None

class ContactSyncRequest(BaseModel):
    """Phone contact sync request"""
    contacts: List[PhoneContact] = Field(..., max_items=1000)
    
    @validator('contacts')
    def validate_unique_contacts(cls, v):
        """Ensure no duplicate phone hashes"""
        phone_hashes = [contact.phone_hash for contact in v]
        if len(phone_hashes) != len(set(phone_hashes)):
            raise ValueError('Duplicate phone hashes not allowed')
        return v

class ContactSyncResponse(BaseModel):
    """Phone contact sync response"""
    matches_found: int = 0
    friend_suggestions: List[FriendSuggestion] = []
    already_friends: List[UUID4] = []
    privacy_limited: List[UUID4] = []  # Users who don't allow contact discovery

# Social graph models

class SocialGraph(BaseModel):
    """User's social graph representation"""
    user_id: UUID4
    direct_friends: List[UUID4] = []
    mutual_connections: Dict[str, List[UUID4]] = {}
    friend_of_friends: List[UUID4] = []
    social_circles: List[Dict[str, Any]] = []
    influence_score: float = 0.0

class NetworkMetrics(BaseModel):
    """Social network metrics"""
    user_id: UUID4
    network_size: int = 0
    clustering_coefficient: float = 0.0
    betweenness_centrality: float = 0.0
    closeness_centrality: float = 0.0
    degree_centrality: float = 0.0