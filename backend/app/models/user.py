from pydantic import BaseModel, EmailStr, Field, UUID4, validator
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

class PrivacyLevel(str, Enum):
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"
    PUBLIC = "public"

class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    age: Optional[int] = Field(None, ge=18, le=50)
    location_neighborhood: Optional[str] = Field(None, max_length=100)
    privacy_level: PrivacyLevel = PrivacyLevel.PRIVATE

class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, max_length=128)
    phone_number: Optional[str] = Field(None, regex=r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$')
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    """User update model"""
    full_name: Optional[str] = Field(None, max_length=255)
    age: Optional[int] = Field(None, ge=18, le=50)
    location_neighborhood: Optional[str] = Field(None, max_length=100)
    privacy_level: Optional[PrivacyLevel] = None
    preferences: Optional[Dict[str, Any]] = None
    profile_image_url: Optional[str] = None
    push_token: Optional[str] = None

class UserProfile(BaseModel):
    """Public user profile model"""
    id: UUID4
    full_name: Optional[str] = None
    age: Optional[int] = None
    location_neighborhood: Optional[str] = None
    profile_image_url: Optional[str] = None
    privacy_level: PrivacyLevel
    mutual_friends_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class User(UserBase):
    """Full user model"""
    id: UUID4
    preferences: Dict[str, Any] = {}
    ml_preference_vector: List[float] = []
    phone_hash: Optional[str] = None
    profile_image_url: Optional[str] = None
    push_token: Optional[str] = None
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserPreferences(BaseModel):
    """User ML preferences model"""
    user_id: UUID4
    category: str
    preference_score: float = Field(0.5, ge=0, le=1)
    neighborhood: Optional[str] = None
    time_preference: Optional[str] = None
    price_sensitivity: float = Field(0.5, ge=0, le=1)
    social_preference: float = Field(0.5, ge=0, le=1)
    updated_at: datetime

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class UserToken(BaseModel):
    """User token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile

class PhoneContactSync(BaseModel):
    """Phone contact sync model for friend discovery"""
    phone_hashes: List[str] = Field(..., max_items=1000)
    
class FriendSuggestion(BaseModel):
    """Friend suggestion model"""
    user: UserProfile
    reason: str  # "phone_contact", "mutual_friends", "similar_interests"
    mutual_friends: List[UserProfile] = []
    confidence_score: float = Field(0.0, ge=0, le=1)