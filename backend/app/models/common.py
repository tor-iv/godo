from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List, Any, Dict
from datetime import datetime

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    success: bool = True
    message: str = ""
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated API response"""
    success: bool = True
    message: str = ""
    data: List[T] = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    has_next: bool = False
    has_prev: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class LocationData(BaseModel):
    """Location information model"""
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    neighborhood: Optional[str] = None

class PriceRange(BaseModel):
    """Price range model"""
    min: int = Field(0, ge=0)
    max: Optional[int] = Field(None, ge=0)
    currency: str = "USD"

class SocialSignals(BaseModel):
    """Social signals for ML model"""
    friends_attending: int = 0
    friends_interested: int = 0
    similar_users_attending: int = 0
    popularity_score: float = 0.0

class MLFeatures(BaseModel):
    """Machine learning features"""
    user_category_preferences: Dict[str, float] = {}
    time_preferences: Dict[str, float] = {}
    location_preferences: Dict[str, float] = {}
    social_preferences: Dict[str, float] = {}
    price_sensitivity: float = 0.5
    distance_preference: float = 0.5

class ContextData(BaseModel):
    """Context data for recommendations"""
    current_time: datetime
    user_location: Optional[LocationData] = None
    weather: Optional[str] = None
    day_of_week: str
    social_context: Optional[SocialSignals] = None

class ValidationError(BaseModel):
    """Validation error detail"""
    field: str
    message: str
    code: str

class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str
    services: Dict[str, str] = {}
    uptime: float = 0.0