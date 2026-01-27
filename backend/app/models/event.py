from pydantic import BaseModel, Field, UUID4, HttpUrl, validator
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from .common import LocationData, PriceRange

class EventCategory(str, Enum):
    NETWORKING = "networking"
    CULTURE = "culture"
    FITNESS = "fitness"
    FOOD = "food"
    NIGHTLIFE = "nightlife"
    OUTDOOR = "outdoor"
    PROFESSIONAL = "professional"

class EventSource(str, Enum):
    EVENTBRITE = "eventbrite"
    RESY = "resy"
    OPENTABLE = "opentable"
    PARTIFUL = "partiful"
    NYC_PARKS = "nyc_parks"
    NYC_OPEN_DATA = "nyc_open_data"
    NYC_CULTURAL = "nyc_cultural"
    MEETUP = "meetup"
    FACEBOOK_EVENTS = "facebook_events"
    USER_GENERATED = "user_generated"
    MANUAL = "manual"

class ModerationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AttendanceStatus(str, Enum):
    INTERESTED = "interested"
    GOING = "going"
    MAYBE = "maybe"
    NOT_GOING = "not_going"

class EventBase(BaseModel):
    """Base event model with common fields"""
    title: str = Field(..., max_length=255, min_length=1)
    description: Optional[str] = None
    date_time: datetime
    end_time: Optional[datetime] = None
    location_name: str = Field(..., max_length=255)
    location_address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    neighborhood: Optional[str] = Field(None, max_length=100)
    category: EventCategory
    price_min: int = Field(0, ge=0)
    price_max: Optional[int] = Field(None, ge=0)
    capacity: Optional[int] = Field(None, gt=0)
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        """Ensure end time is after start time"""
        if v and 'date_time' in values and v <= values['date_time']:
            raise ValueError('End time must be after start time')
        return v
    
    @validator('price_max')
    def validate_price_max(cls, v, values):
        """Ensure max price is greater than min price"""
        if v and 'price_min' in values and v < values['price_min']:
            raise ValueError('Maximum price must be greater than minimum price')
        return v

class EventCreate(EventBase):
    """Event creation model"""
    source: EventSource = EventSource.USER_GENERATED
    external_id: Optional[str] = Field(None, max_length=255)
    external_url: Optional[HttpUrl] = None
    image_url: Optional[HttpUrl] = None
    metadata: Optional[Dict[str, Any]] = {}
    accessibility_info: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []

class EventUpdate(BaseModel):
    """Event update model"""
    title: Optional[str] = Field(None, max_length=255, min_length=1)
    description: Optional[str] = None
    date_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location_name: Optional[str] = Field(None, max_length=255)
    location_address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    neighborhood: Optional[str] = Field(None, max_length=100)
    category: Optional[EventCategory] = None
    price_min: Optional[int] = Field(None, ge=0)
    price_max: Optional[int] = Field(None, ge=0)
    capacity: Optional[int] = Field(None, gt=0)
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    accessibility_info: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class Event(EventBase):
    """Full event model"""
    id: UUID4
    source: EventSource
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    image_url: Optional[str] = None
    current_attendees: int = 0
    is_active: bool = True
    is_featured: bool = False
    is_user_generated: bool = False
    created_by_user_id: Optional[UUID4] = None
    moderation_status: ModerationStatus = ModerationStatus.APPROVED
    accessibility_info: Dict[str, Any] = {}
    transit_score: Optional[int] = Field(None, ge=1, le=10)
    metadata: Dict[str, Any] = {}
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    # Computed fields for ML
    popularity_score: Optional[float] = 0.0
    friend_attendance_count: Optional[int] = 0
    similar_user_attendance: Optional[int] = 0
    
    class Config:
        from_attributes = True

class EventWithAttendance(Event):
    """Event model with user's attendance status"""
    user_attendance_status: Optional[AttendanceStatus] = None
    user_swipe_direction: Optional[str] = None
    friends_attending: List[UUID4] = []
    friends_interested: List[UUID4] = []

class EventAttendance(BaseModel):
    """Event attendance model"""
    id: UUID4
    user_id: UUID4
    event_id: UUID4
    status: AttendanceStatus
    visibility: str = Field(..., regex="^(private|friends|public)$")
    group_id: Optional[UUID4] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EventAttendanceCreate(BaseModel):
    """Create event attendance"""
    event_id: UUID4
    status: AttendanceStatus
    visibility: str = Field("private", regex="^(private|friends|public)$")
    group_id: Optional[UUID4] = None
    notes: Optional[str] = None

class EventAttendanceUpdate(BaseModel):
    """Update event attendance"""
    status: Optional[AttendanceStatus] = None
    visibility: Optional[str] = Field(None, regex="^(private|friends|public)$")
    notes: Optional[str] = None

class EventSearch(BaseModel):
    """Event search parameters"""
    query: Optional[str] = None
    category: Optional[EventCategory] = None
    neighborhood: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    price_min: Optional[int] = Field(None, ge=0)
    price_max: Optional[int] = Field(None, ge=0)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius_km: Optional[float] = Field(None, gt=0, le=50)
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
    sort_by: str = Field("date_time", regex="^(date_time|popularity|distance|created_at)$")
    sort_order: str = Field("asc", regex="^(asc|desc)$")

class EventRecommendation(BaseModel):
    """Event recommendation with score"""
    event: Event
    recommendation_score: float = Field(..., ge=0, le=1)
    recommendation_reasons: List[str] = []
    friend_signals: Dict[str, Any] = {}
    
class EventCapacityUpdate(BaseModel):
    """Real-time event capacity update"""
    event_id: UUID4
    current_attendees: int = Field(..., ge=0)
    capacity: Optional[int] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class EventSource(BaseModel):
    """Event source tracking for background jobs"""
    id: UUID4
    source_name: EventSource
    last_sync: Optional[datetime] = None
    next_sync: Optional[datetime] = None
    sync_frequency: str = "4 hours"  # PostgreSQL interval format
    is_active: bool = True
    sync_status: str = "pending"
    last_error: Optional[str] = None
    events_synced: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True