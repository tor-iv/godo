from pydantic import BaseModel, Field, UUID4, validator
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum

class NotificationType(str, Enum):
    # Friend notifications
    FRIEND_REQUEST = "friend_request"
    FRIEND_ACCEPTED = "friend_accepted"
    FRIEND_DECLINED = "friend_declined"
    
    # Event invitations
    EVENT_INVITATION = "event_invitation"
    INVITATION_ACCEPTED = "invitation_accepted"
    INVITATION_DECLINED = "invitation_declined"
    INVITATION_MAYBE = "invitation_maybe"
    
    # Event reminders
    EVENT_REMINDER_2H = "event_reminder_2h"
    EVENT_REMINDER_30M = "event_reminder_30m"
    EVENT_STARTING = "event_starting"
    
    # Group notifications
    GROUP_INVITE = "group_invite"
    GROUP_EVENT_PLANNED = "group_event_planned"
    GROUP_MESSAGE = "group_message"
    
    # Activity notifications
    FRIEND_ACTIVITY = "friend_activity"
    EVENT_CAPACITY_UPDATE = "event_capacity_update"
    TRENDING_EVENT = "trending_event"
    
    # System notifications
    SYSTEM_UPDATE = "system_update"
    PROMOTIONAL = "promotional"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationChannel(str, Enum):
    PUSH = "push"
    EMAIL = "email"
    IN_APP = "in_app"
    SMS = "sms"

class NotificationBase(BaseModel):
    """Base notification model"""
    type: NotificationType
    title: str = Field(..., max_length=100)
    message: str = Field(..., max_length=300)
    data: Optional[Dict[str, Any]] = {}

class NotificationCreate(NotificationBase):
    """Create notification model"""
    recipient_id: UUID4
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channels: List[NotificationChannel] = [NotificationChannel.IN_APP, NotificationChannel.PUSH]
    scheduled_for: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    action_url: Optional[str] = None
    image_url: Optional[str] = None
    
    @validator('expires_at')
    def validate_expires_at(cls, v, values):
        """Ensure expiry is in the future"""
        if v and v <= datetime.utcnow():
            raise ValueError('Expiry time must be in the future')
        return v
    
    @validator('scheduled_for')
    def validate_scheduled_for(cls, v, values):
        """Ensure scheduled time is reasonable"""
        if v and v <= datetime.utcnow():
            raise ValueError('Scheduled time must be in the future')
        if v and v > datetime.utcnow() + timedelta(days=365):
            raise ValueError('Cannot schedule more than 1 year in advance')
        return v

class BulkNotificationCreate(BaseModel):
    """Bulk notification creation"""
    recipient_ids: List[UUID4] = Field(..., min_items=1, max_items=1000)
    type: NotificationType
    title: str = Field(..., max_length=100)
    message: str = Field(..., max_length=300)
    data: Optional[Dict[str, Any]] = {}
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channels: List[NotificationChannel] = [NotificationChannel.IN_APP, NotificationChannel.PUSH]
    scheduled_for: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    @validator('recipient_ids')
    def validate_unique_recipients(cls, v):
        """Ensure no duplicate recipient IDs"""
        if len(v) != len(set(v)):
            raise ValueError('Duplicate recipient IDs not allowed')
        return v

class Notification(NotificationBase):
    """Full notification model"""
    id: UUID4
    recipient_id: UUID4
    priority: NotificationPriority
    channels: List[NotificationChannel]
    is_read: bool = False
    is_sent: bool = False
    scheduled_for: datetime
    expires_at: Optional[datetime] = None
    action_url: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    """Update notification model"""
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None

class NotificationPreferences(BaseModel):
    """User notification preferences"""
    user_id: UUID4
    friend_requests: bool = True
    event_invitations: bool = True
    event_reminders: bool = True
    group_activities: bool = True
    friend_activities: bool = True
    promotional: bool = False
    
    # Channel preferences
    push_enabled: bool = True
    email_enabled: bool = True
    sms_enabled: bool = False
    
    # Timing preferences
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23)  # Hour of day (0-23)
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23)
    timezone: str = "America/New_York"
    
    class Config:
        from_attributes = True

class NotificationTemplate(BaseModel):
    """Notification template model"""
    id: str
    type: NotificationType
    title_template: str
    message_template: str
    default_channels: List[NotificationChannel]
    default_priority: NotificationPriority
    template_variables: List[str] = []
    is_active: bool = True
    
    class Config:
        from_attributes = True

class NotificationFilters(BaseModel):
    """Notification filtering options"""
    type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    is_read: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)
    sort_by: str = Field("created_at", pattern="^(created_at|priority|is_read)$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")

class NotificationStats(BaseModel):
    """Notification statistics"""
    user_id: UUID4
    total_received: int = 0
    total_read: int = 0
    total_unread: int = 0
    read_rate: float = 0.0
    avg_read_time_minutes: Optional[float] = None
    notification_counts_by_type: Dict[str, int] = {}
    recent_activity: List[Dict[str, Any]] = []

class PushNotificationPayload(BaseModel):
    """Push notification payload for mobile"""
    title: str
    body: str
    data: Dict[str, Any] = {}
    badge_count: Optional[int] = None
    sound: str = "default"
    category: Optional[str] = None
    action_buttons: Optional[List[Dict[str, str]]] = []

class EmailNotificationPayload(BaseModel):
    """Email notification payload"""
    subject: str
    html_body: str
    text_body: str
    template_id: Optional[str] = None
    template_variables: Dict[str, Any] = {}
    reply_to: Optional[str] = None

class NotificationDeliveryStatus(BaseModel):
    """Notification delivery status"""
    notification_id: UUID4
    channel: NotificationChannel
    status: str = Field(..., pattern="^(pending|sent|delivered|failed|bounced)$")
    external_id: Optional[str] = None  # Provider's tracking ID
    error_message: Optional[str] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class NotificationBatch(BaseModel):
    """Batch notification processing result"""
    batch_id: UUID4
    total_notifications: int = 0
    successful: int = 0
    failed: int = 0
    pending: int = 0
    errors: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# Pre-defined notification templates

NOTIFICATION_TEMPLATES = {
    NotificationType.FRIEND_REQUEST: {
        "title": "{sender_name} sent you a friend request",
        "message": "Tap to view and respond to the request",
        "channels": [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        "priority": NotificationPriority.MEDIUM
    },
    
    NotificationType.EVENT_INVITATION: {
        "title": "{inviter_name} invited you to {event_title}",
        "message": "{event_date} at {event_location}",
        "channels": [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        "priority": NotificationPriority.HIGH
    },
    
    NotificationType.EVENT_REMINDER_2H: {
        "title": "{event_title} starts in 2 hours",
        "message": "Don't forget about your event at {event_location}",
        "channels": [NotificationChannel.PUSH],
        "priority": NotificationPriority.HIGH
    },
    
    NotificationType.FRIEND_ACTIVITY: {
        "title": "{friend_name} is going to {event_title}",
        "message": "Tap to see the event and join them",
        "channels": [NotificationChannel.IN_APP],
        "priority": NotificationPriority.LOW
    },
    
    NotificationType.GROUP_INVITE: {
        "title": "{inviter_name} invited you to join {group_name}",
        "message": "Tap to view the group and accept the invitation",
        "channels": [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        "priority": NotificationPriority.MEDIUM
    }
}

def create_notification_from_template(
    template_type: NotificationType,
    recipient_id: UUID4,
    variables: Dict[str, str]
) -> NotificationCreate:
    """Create notification from template with variable substitution"""
    template = NOTIFICATION_TEMPLATES.get(template_type)
    if not template:
        raise ValueError(f"No template found for {template_type}")
    
    title = template["title"].format(**variables)
    message = template["message"].format(**variables)
    
    return NotificationCreate(
        type=template_type,
        recipient_id=recipient_id,
        title=title,
        message=message,
        channels=template["channels"],
        priority=template["priority"],
        data={"template_variables": variables}
    )