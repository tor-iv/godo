# Backend Integration Plan - Event Discovery App

## Overview

Comprehensive plan to implement Python FastAPI backend with Supabase integration for the event discovery app. This will replace mock data with real database operations and provide authentication, user management, and event management capabilities.

## Current State Analysis

- ✅ Docker infrastructure with Supabase services configured
- ✅ Frontend React Native app with navigation and UI
- ✅ Mock data implementation with swipe mechanics
- ❌ No Python backend implementation
- ❌ No database schema or real data persistence
- ❌ No authentication system
- ❌ No API endpoints for frontend integration

## Phase 1: Foundation Setup (Week 1)

### 1.1 Backend Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment & settings
│   ├── database.py          # Supabase connection & setup
│   ├── dependencies.py      # Common dependencies (auth, db)
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── user.py          # User models
│   │   ├── event.py         # Event models
│   │   ├── swipe.py         # Swipe action models
│   │   └── common.py        # Shared models
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── events.py        # Event management
│   │   ├── users.py         # User profile management
│   │   ├── swipes.py        # Swipe actions
│   │   └── health.py        # Health check endpoints
│   ├── services/            # Business logic layer
│   │   ├── __init__.py
│   │   ├── event_service.py # Event business logic
│   │   ├── user_service.py  # User management logic
│   │   ├── swipe_service.py # Swipe processing logic
│   │   ├── feed_service.py  # Event feed generation
│   │   └── auth_service.py  # Authentication logic
│   ├── utils/               # Helper functions
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT handling
│   │   ├── validators.py    # Custom validators
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── helpers.py       # General utilities
│   └── middleware/          # Custom middleware
│       ├── __init__.py
│       ├── cors.py          # CORS configuration
│       ├── rate_limit.py    # Rate limiting
│       └── logging.py       # Request logging
├── requirements.txt         # Python dependencies
├── Dockerfile              # Backend container
├── .env.example            # Environment template
├── alembic/                # Database migrations
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
└── tests/                  # Test suite
    ├── __init__.py
    ├── conftest.py
    ├── test_auth.py
    ├── test_events.py
    ├── test_swipes.py
    └── test_users.py
```

### 1.2 Core Dependencies

```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
supabase==2.0.2
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
redis==5.0.1
httpx==0.25.2
python-dotenv==1.0.0
asyncpg==0.29.0
sqlalchemy==2.0.23
alembic==1.13.0
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-httpx==0.26.0
python-dateutil==2.8.2
pillow==10.1.0
celery==5.3.4
```

### 1.3 Environment Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App settings
    app_name: str = "Godo Event Discovery API"
    debug: bool = False
    version: str = "1.0.0"

    # Database
    database_url: str
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    # Authentication
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379"

    # External APIs
    eventbrite_api_key: Optional[str] = None
    google_maps_api_key: Optional[str] = None

    # Rate limiting
    rate_limit_per_minute: int = 100

    class Config:
        env_file = ".env"

settings = Settings()
```

## Phase 2: Database Schema & Models (Week 1-2)

### 2.1 Supabase Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    age INTEGER CHECK (age >= 18 AND age <= 50),
    location_neighborhood VARCHAR(100),
    privacy_level VARCHAR(20) DEFAULT 'private' CHECK (privacy_level IN ('private', 'friends_only', 'public_events')),
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location_name VARCHAR(255) NOT NULL,
    location_address VARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    neighborhood VARCHAR(100),
    category VARCHAR(50) NOT NULL CHECK (category IN ('networking', 'culture', 'fitness', 'food', 'nightlife', 'outdoor', 'professional')),
    price_min INTEGER DEFAULT 0,
    price_max INTEGER,
    image_url VARCHAR(500),
    source VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    external_url VARCHAR(500),
    capacity INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_events_date_time (date_time),
    INDEX idx_events_category (category),
    INDEX idx_events_location (latitude, longitude),
    INDEX idx_events_active (is_active, date_time)
);

-- Swipes table
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('right', 'left', 'up', 'down')),
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure one swipe per user per event
    UNIQUE(user_id, event_id),

    -- Indexes
    INDEX idx_swipes_user_direction (user_id, direction),
    INDEX idx_swipes_event (event_id)
);

-- User preferences tracking
CREATE TABLE user_event_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    preference_score DECIMAL(3,2) DEFAULT 0.5,
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, category)
);

-- Friends table (for future social features)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Prevent self-friendship and duplicates
    CHECK (user_id != friend_id),
    UNIQUE(user_id, friend_id)
);

-- Event attendance tracking (for social features)
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'interested' CHECK (status IN ('interested', 'going', 'maybe', 'not_going')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, event_id)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_attendance_updated_at BEFORE UPDATE ON event_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Pydantic Models

```python
# models/user.py
from pydantic import BaseModel, EmailStr, UUID4, Field
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

class PrivacyLevel(str, Enum):
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"
    PUBLIC_EVENTS = "public_events"

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=18, le=50)
    location_neighborhood: Optional[str] = None
    privacy_level: PrivacyLevel = PrivacyLevel.PRIVATE

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=18, le=50)
    location_neighborhood: Optional[str] = None
    privacy_level: Optional[PrivacyLevel] = None
    preferences: Optional[Dict[str, Any]] = None

class User(UserBase):
    id: UUID4
    preferences: Dict[str, Any] = {}
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# models/event.py
from pydantic import BaseModel, UUID4, Field, HttpUrl
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

class EventCategory(str, Enum):
    NETWORKING = "networking"
    CULTURE = "culture"
    FITNESS = "fitness"
    FOOD = "food"
    NIGHTLIFE = "nightlife"
    OUTDOOR = "outdoor"
    PROFESSIONAL = "professional"

class EventBase(BaseModel):
    title: str = Field(..., max_length=255)
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

class EventCreate(EventBase):
    source: str = Field(..., max_length=50)
    external_id: Optional[str] = Field(None, max_length=255)
    external_url: Optional[HttpUrl] = None
    image_url: Optional[HttpUrl] = None
    metadata: Optional[Dict[str, Any]] = {}

class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    date_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location_name: Optional[str] = Field(None, max_length=255)
    location_address: Optional[str] = Field(None, max_length=500)
    category: Optional[EventCategory] = None
    price_min: Optional[int] = Field(None, ge=0)
    price_max: Optional[int] = Field(None, ge=0)
    capacity: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Event(EventBase):
    id: UUID4
    source: str
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    image_url: Optional[str] = None
    current_attendees: int = 0
    is_active: bool = True
    is_featured: bool = False
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# models/swipe.py
from pydantic import BaseModel, UUID4
from datetime import datetime
from enum import Enum

class SwipeDirection(str, Enum):
    RIGHT = "right"      # Want to go
    LEFT = "left"        # Not interested
    UP = "up"           # Save for later
    DOWN = "down"       # Like but can't go

class SwipeBase(BaseModel):
    event_id: UUID4
    direction: SwipeDirection

class SwipeCreate(SwipeBase):
    pass

class Swipe(SwipeBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

# models/common.py
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, List, Any

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: List[T] = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    has_next: bool = False
    has_prev: bool = False

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None
```

## Phase 3: Core API Implementation (Week 2-3)

### 3.1 FastAPI Application Setup

```python
# app/main.py
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import time
import logging

from app.config import settings
from app.routers import auth, events, users, swipes, health
from app.utils.exceptions import APIException
from app.middleware.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "exp://localhost:19000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # Log slow requests
    if process_time > 1.0:
        logger.warning(f"Slow request: {request.method} {request.url} took {process_time:.2f}s")

    return response

# Exception handlers
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "error_code": "VALIDATION_ERROR",
            "details": exc.errors()
        }
    )

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(swipes.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.version,
        "status": "healthy"
    }
```

### 3.2 Authentication System

```python
# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import jwt
from datetime import datetime, timedelta

from app.config import settings
from app.models.user import UserCreate, UserLogin, User
from app.models.common import APIResponse
from app.services.auth_service import AuthService
from app.utils.exceptions import APIException

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/signup", response_model=APIResponse[User])
async def signup(user_data: UserCreate, auth_service: AuthService = Depends()):
    """Register a new user"""
    try:
        user = await auth_service.create_user(user_data)
        return APIResponse(
            success=True,
            message="User created successfully",
            data=user
        )
    except Exception as e:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Failed to create user",
            error_code="SIGNUP_FAILED",
            details=str(e)
        )

@router.post("/login", response_model=APIResponse[dict])
async def login(credentials: UserLogin, auth_service: AuthService = Depends()):
    """Authenticate user and return access token"""
    try:
        result = await auth_service.authenticate_user(credentials)
        return APIResponse(
            success=True,
            message="Login successful",
            data=result
        )
    except Exception as e:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid credentials",
            error_code="LOGIN_FAILED"
        )

@router.post("/refresh", response_model=APIResponse[dict])
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends()
):
    """Refresh access token"""
    try:
        result = await auth_service.refresh_token(credentials.credentials)
        return APIResponse(
            success=True,
            message="Token refreshed",
            data=result
        )
    except Exception as e:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid refresh token",
            error_code="REFRESH_FAILED"
        )

@router.post("/logout", response_model=APIResponse[None])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends()
):
    """Logout user and invalidate token"""
    try:
        await auth_service.logout_user(credentials.credentials)
        return APIResponse(
            success=True,
            message="Logged out successfully"
        )
    except Exception as e:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Logout failed",
            error_code="LOGOUT_FAILED"
        )
```

### 3.3 Event Management API

```python
# routers/events.py
from fastapi import APIRouter, Depends, Query, Path
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID

from app.models.event import Event, EventCreate, EventUpdate
from app.models.common import APIResponse, PaginatedResponse
from app.services.event_service import EventService
from app.services.feed_service import FeedService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/feed", response_model=PaginatedResponse[Event])
async def get_event_feed(
    mode: str = Query("happening_now", regex="^(happening_now|planning_ahead)$"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    feed_service: FeedService = Depends()
):
    """Get personalized event feed for user"""
    events, total = await feed_service.get_personalized_feed(
        user_id=current_user.id,
        mode=mode,
        category=category,
        limit=limit,
        offset=offset
    )

    return PaginatedResponse(
        success=True,
        message="Feed retrieved successfully",
        data=events,
        total=total,
        page=(offset // limit) + 1,
        per_page=limit,
        has_next=offset + limit < total,
        has_prev=offset > 0
    )

@router.get("/{event_id}", response_model=APIResponse[Event])
async def get_event(
    event_id: UUID = Path(...),
    event_service: EventService = Depends()
):
    """Get event details by ID"""
    event = await event_service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return APIResponse(
        success=True,
        message="Event retrieved successfully",
        data=event
    )

@router.post("/", response_model=APIResponse[Event])
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    event_service: EventService = Depends()
):
    """Create a new event (admin only)"""
    # TODO: Add admin role check
    event = await event_service.create_event(event_data)
    return APIResponse(
        success=True,
        message="Event created successfully",
        data=event
    )

@router.put("/{event_id}", response_model=APIResponse[Event])
async def update_event(
    event_id: UUID = Path(...),
    event_data: EventUpdate = ...,
    current_user: User = Depends(get_current_user),
    event_service: EventService = Depends()
):
    """Update event (admin only)"""
    # TODO: Add admin role check
    event = await event_service.update_event(event_id, event_data)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return APIResponse(
        success=True,
        message="Event updated successfully",
        data=event
    )

@router.delete("/{event_id}", response_model=APIResponse[None])
async def delete_event(
    event_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    event_service: EventService = Depends()
):
    """Delete event (admin only)"""
    # TODO: Add admin role check
    success = await event_service.delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")

    return APIResponse(
        success=True,
        message="Event deleted successfully"
    )
```

### 3.4 Swipe Management API

```python
# routers/swipes.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.models.swipe import Swipe, SwipeCreate, SwipeDirection
from app.models.event import Event
from app.models.common import APIResponse, PaginatedResponse
from app.services.swipe_service import SwipeService
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.exceptions import APIException

router = APIRouter(prefix="/swipes", tags=["Swipes"])

@router.post("/", response_model=APIResponse[Swipe])
async def create_swipe(
    swipe_data: SwipeCreate,
    current_user: User = Depends(get_current_user),
    swipe_service: SwipeService = Depends()
):
    """Record a swipe action"""
    try:
        swipe = await swipe_service.create_swipe(
            user_id=current_user.id,
            swipe_data=swipe_data
        )
        return APIResponse(
            success=True,
            message="Swipe recorded successfully",
            data=swipe
        )
    except ValueError as e:
        raise APIException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=str(e),
            error_code="INVALID_SWIPE"
        )
    except Exception as e:
        raise APIException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message="Failed to record swipe",
            error_code="SWIPE_FAILED",
            details=str(e)
        )

@router.get("/calendar", response_model=PaginatedResponse[Event])
async def get_user_calendar(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    swipe_service: SwipeService = Depends()
):
    """Get user's calendar (right-swiped events)"""
    events, total = await swipe_service.get_user_events_by_direction(
        user_id=current_user.id,
        direction=SwipeDirection.RIGHT,
        limit=limit,
        offset=offset
    )

    return PaginatedResponse(
        success=True,
        message="Calendar retrieved successfully",
        data=events,
        total=total,
        page=(offset // limit) + 1,
        per_page=limit,
        has_next=offset + limit < total,
        has_prev=offset > 0
    )

@router.get("/saved", response_model=PaginatedResponse[Event])
async def get_saved_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    swipe_service: SwipeService = Depends()
):
    """Get user's saved events (up-swiped events)"""
    events, total = await swipe_service.get_user_events_by_direction(
        user_id=current_user.id,
        direction=SwipeDirection.UP,
        limit=limit,
        offset=offset
    )

    return PaginatedResponse(
        success=True,
        message="Saved events retrieved successfully",
        data=events,
        total=total,
        page=(offset // limit) + 1,
        per_page=limit,
        has_next=offset + limit < total,
        has_prev=offset > 0
    )

@router.get("/liked", response_model=PaginatedResponse[Event])
async def get_liked_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    swipe_service: SwipeService = Depends()
):
    """Get user's liked but can't go events (down-swiped events)"""
    events, total = await swipe_service.get_user_events_by_direction(
        user_id=current_user.id,
        direction=SwipeDirection.DOWN,
        limit=limit,
        offset=offset
    )

    return PaginatedResponse(
        success=True,
        message="Liked events retrieved successfully",
        data=events,
        total=total,
        page=(offset // limit) + 1,
        per_page=limit,
        has_next=offset + limit < total,
        has_prev=offset > 0
    )

@router.get("/history", response_model=PaginatedResponse[Swipe])
async def get_swipe_history(
    direction: Optional[SwipeDirection] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    swipe_service: SwipeService = Depends()
):
    """Get user's swipe history"""
    swipes, total = await swipe_service.get_user_swipe_history(
        user_id=current_user.id,
        direction=direction,
        limit=limit,
        offset=offset
    )

    return PaginatedResponse(
        success=True,
        message="Swipe history retrieved successfully",
        data=swipes,
        total=total,
        page=(offset // limit) + 1,
        per_page=limit,
        has_next=offset + limit < total,
        has_prev=offset > 0
    )
```

## Phase 4: Service Layer Implementation (Week 3)

### 4.1 Event Service

```python
# services/event_service.py
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from supabase import Client

from app.models.event import Event, EventCreate, EventUpdate
from app.database import get_supabase_client
from app.utils.exceptions import APIException

class EventService:
    def __init__(self, supabase: Client = Depends(get_supabase_client)):
        self.supabase = supabase

    async def get_event_by_id(self, event_id: UUID) -> Optional[Event]:
        """Get event by ID"""
        try:
            result = self.supabase.table("events").select("*").eq("id", str(event_id)).single().execute()
            if result.data:
                return Event(**result.data)
            return None
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to fetch event",
                error_code="EVENT_FETCH_FAILED",
                details=str(e)
            )

    async def create_event(self, event_data: EventCreate) -> Event:
        """Create a new event"""
        try:
            event_dict = event_data.dict()
            event_dict["created_at"] = datetime.utcnow().isoformat()
            event_dict["updated_at"] = datetime.utcnow().isoformat()

            result = self.supabase.table("events").insert(event_dict).execute()
            return Event(**result.data[0])
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to create event",
                error_code="EVENT_CREATE_FAILED",
                details=str(e)
            )

    async def update_event(self, event_id: UUID, event_data: EventUpdate) -> Optional[Event]:
        """Update an existing event"""
        try:
            update_dict = event_data.dict(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow().isoformat()

            result = self.supabase.table("events").update(update_dict).eq("id", str(event_id)).execute()
            if result.data:
                return Event(**result.data[0])
            return None
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to update event",
                error_code="EVENT_UPDATE_FAILED",
                details=str(e)
            )

    async def delete_event(self, event_id: UUID) -> bool:
        """Soft delete an event"""
        try:
            result = self.supabase.table("events").update({
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", str(event_id)).execute()
            return len(result.data) > 0
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to delete event",
                error_code="EVENT_DELETE_FAILED",
                details=str(e)
            )

    async def get_events_by_category(self, category: str, limit: int = 20, offset: int = 0) -> Tuple[List[Event], int]:
        """Get events by category with pagination"""
        try:
            # Get total count
            count_result = self.supabase.table("events").select("id", count="exact").eq("category", category).eq("is_active", True).execute()
            total = count_result.count

            # Get events
            result = self.supabase.table("events").select("*").eq("category", category).eq("is_active", True).order("date_time").range(offset, offset + limit - 1).execute()

            events = [Event(**event) for event in result.data]
            return events, total
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to fetch events by category",
                error_code="EVENTS_FETCH_FAILED",
                details=str(e)
            )
```

### 4.2 Feed Service

```python
# services/feed_service.py
from typing import List, Tuple, Optional
from uuid import UUID
from datetime import datetime, timedelta
from supabase import Client

from app.models.event import Event
from app.database import get_supabase_client
from app.utils.exceptions import APIException

class FeedService:
    def __init__(self, supabase: Client = Depends(get_supabase_client)):
        self.supabase = supabase

    async def get_personalized_feed(
        self,
        user_id: UUID,
        mode: str,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Event], int]:
        """Get personalized event feed for user"""
        try:
            # Define time ranges based on mode
            now = datetime.utcnow()
            if mode == "happening_now":
                start_time = now
                end_time = now + timedelta(hours=48)
            else:  # planning_ahead
                start_time = now + timedelta(days=3)
                end_time = now + timedelta(days=60)

            # Get events user has already swiped
            swiped_result = self.supabase.table("swipes").select("event_id").eq("user_id", str(user_id)).execute()
            swiped_event_ids = [swipe["event_id"] for swipe in swiped_result.data]

            # Build query
            query = self.supabase.table("events").select("*")
            query = query.eq("is_active", True)
            query = query.gte("date_time", start_time.isoformat())
            query = query.lte("date_time", end_time.isoformat())

            if category:
                query = query.eq("category", category)

            if swiped_event_ids:
                query = query.not_.in_("id", swiped_event_ids)

            # Get total count
            count_result = query.select("id", count="exact").execute()
            total = count_result.count

            # Get events with pagination
            result = query.order("date_time").range(offset, offset + limit - 1).execute()

            events = [Event(**event) for event in result.data]
            return events, total

        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to generate personalized feed",
                error_code="FEED_GENERATION_FAILED",
                details=str(e)
            )

    async def get_trending_events(self, limit: int = 10) -> List[Event]:
        """Get trending events based on swipe activity"""
        try:
            # Get events with most right swipes in last 7 days
            seven_days_ago = datetime.utcnow() - timedelta(days=7)

            result = self.supabase.rpc("get_trending_events", {
                "since_date": seven_days_ago.isoformat(),
                "event_limit": limit
            }).execute()

            events = [Event(**event) for event in result.data]
            return events
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to fetch trending events",
                error_code="TRENDING_FETCH_FAILED",
                details=str(e)
            )
```

### 4.3 Swipe Service

```python
# services/swipe_service.py
from typing import List, Tuple, Optional
from uuid import UUID
from datetime import datetime
from supabase import Client

from app.models.swipe import Swipe, SwipeCreate, SwipeDirection
from app.models.event import Event
from app.database import get_supabase_client
from app.utils.exceptions import APIException

class SwipeService:
    def __init__(self, supabase: Client = Depends(get_supabase_client)):
        self.supabase = supabase

    async def create_swipe(self, user_id: UUID, swipe_data: SwipeCreate) -> Swipe:
        """Record a swipe action"""
        try:
            # Check if user already swiped this event
            existing = self.supabase.table("swipes").select("*").eq("user_id", str(user_id)).eq("event_id", str(swipe_data.event_id)).execute()

            if existing.data:
                raise ValueError("User has already swiped this event")

            # Verify event exists and is active
            event_result = self.supabase.table("events").select("id, is_active").eq("id", str(swipe_data.event_id)).single().execute()

            if not event_result.data:
                raise ValueError("Event not found")

            if not event_result.data["is_active"]:
                raise ValueError("Event is no longer active")

            # Create swipe record
            swipe_dict = {
                "user_id": str(user_id),
                "event_id": str(swipe_data.event_id),
                "direction": swipe_data.direction.value,
                "created_at": datetime.utcnow().isoformat()
            }

            result = self.supabase.table("swipes").insert(swipe_dict).execute()
            swipe = Swipe(**result.data[0])

            # Update user preferences based on swipe
            await self._update_user_preferences(user_id, swipe_data.event_id, swipe_data.direction)

            return swipe

        except ValueError:
            raise
        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to record swipe",
                error_code="SWIPE_CREATE_FAILED",
                details=str(e)
            )

    async def get_user_events_by_direction(
        self,
        user_id: UUID,
        direction: SwipeDirection,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Event], int]:
        """Get user's events by swipe direction"""
        try:
            # Get swipes with event details
            query = self.supabase.table("swipes").select("""
                *,
                events (*)
            """).eq("user_id", str(user_id)).eq("direction", direction.value)

            # Get total count
            count_result = query.select("id", count="exact").execute()
            total = count_result.count

            # Get events with pagination
            result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

            events = []
            for swipe in result.data:
                if swipe["events"]:
                    events.append(Event(**swipe["events"]))

            return events, total

        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to fetch user events",
                error_code="USER_EVENTS_FETCH_FAILED",
                details=str(e)
            )

    async def get_user_swipe_history(
        self,
        user_id: UUID,
        direction: Optional[SwipeDirection] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Swipe], int]:
        """Get user's swipe history"""
        try:
            query = self.supabase.table("swipes").select("*").eq("user_id", str(user_id))

            if direction:
                query = query.eq("direction", direction.value)

            # Get total count
            count_result = query.select("id", count="exact").execute()
            total = count_result.count

            # Get swipes with pagination
            result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

            swipes = [Swipe(**swipe) for swipe in result.data]
            return swipes, total

        except Exception as e:
            raise APIException(
                status_code=500,
                message="Failed to fetch swipe history",
                error_code="SWIPE_HISTORY_FETCH_FAILED",
                details=str(e)
            )

    async def _update_user_preferences(self, user_id: UUID, event_id: UUID, direction: SwipeDirection):
        """Update user preferences based on swipe behavior"""
        try:
            # Get event category
            event_result = self.supabase.table("events").select("category").eq("id", str(event_id)).single().execute()

            if not event_result.data:
                return

            category = event_result.data["category"]

            # Calculate preference adjustment
            if direction == SwipeDirection.RIGHT:
                adjustment = 0.1  # Increase preference
            elif direction == SwipeDirection.UP:
                adjustment = 0.05  # Slight increase
            elif direction == SwipeDirection.DOWN:
                adjustment = 0.02  # Very slight increase (liked but can't go)
            else:  # LEFT
                adjustment = -0.05  # Decrease preference

            # Update or create preference record
            self.supabase.rpc("update_user_preference", {
                "p_user_id": str(user_id),
                "p_category": category,
                "p_adjustment": adjustment
            }).execute()

        except Exception as e:
            # Log error but don't fail the swipe operation
            print(f"Failed to update user preferences: {e}")
```

## Phase 5: Frontend Integration (Week 4)

### 5.1 API Client Setup

```typescript
// services/api/client.ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// API base URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// API client with auth headers
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      };
    }

    return {
      "Content-Type": "application/json",
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 5.2 React Query Hooks

```typescript
// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api/client";
import { Event, SwipeDirection } from "../types";

interface EventFeedResponse {
  success: boolean;
  message: string;
  data: Event[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

interface SwipeEventData {
  event_id: string;
  direction: SwipeDirection;
}

export const useEventFeed = (
  mode: "happening_now" | "planning_ahead",
  category?: string
) => {
  return useQuery({
    queryKey: ["events", "feed", mode, category],
    queryFn: async (): Promise<EventFeedResponse> => {
      const params = new URLSearchParams({ mode });
      if (category) params.append("category", category);

      return apiClient.get(`/events/feed?${params.toString()}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useSwipeEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swipeData: SwipeEventData) => {
      return apiClient.post("/swipes", swipeData);
    },
    onSuccess: () => {
      // Invalidate and refetch feed
      queryClient.invalidateQueries({ queryKey: ["events", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["swipes"] });
    },
    onError: (error) => {
      console.error("Swipe failed:", error);
    },
  });
};

export const useUserCalendar = () => {
  return useQuery({
    queryKey: ["swipes", "calendar"],
    queryFn: async (): Promise<EventFeedResponse> => {
      return apiClient.get("/swipes/calendar");
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSavedEvents = () => {
  return useQuery({
    queryKey: ["swipes", "saved"],
    queryFn: async (): Promise<EventFeedResponse> => {
      return apiClient.get("/swipes/saved");
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useLikedEvents = () => {
  return useQuery({
    queryKey: ["swipes", "liked"],
    queryFn: async (): Promise<EventFeedResponse> => {
      return apiClient.get("/swipes/liked");
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

### 5.3 Authentication Hook

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "../services/api/client";
import { User, Session } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
```

## Phase 6: Docker Integration (Week 4)

### 6.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 6.2 Update docker-compose.yml

```yaml
# Add to existing docker-compose.yml
  godo-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: godo-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@supabase-db:5432/postgres
      - SUPABASE_URL=http://supabase-api:9999
      - SUPABASE_KEY=your-supabase-anon-key
      - SUPABASE_SERVICE_KEY=your-supabase-service-key
      - JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
      - REDIS_URL=redis://redis:6379
      - DEBUG=true
    volumes:
      - ./backend:/app
      - backend-cache:/app/__pycache__
    depends_on:
      - supabase-db
      - supabase-api
      - redis
    networks:
      - godo-network
    restart: unless-stopped

volumes:
  backend-cache:
```

## Phase 7: Testing & Deployment (Week 5)

### 7.1 API Testing

```python
# tests/test_events.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_event_feed():
    response = client.get("/api/v1/events/feed")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "success" in data
    assert data["success"] is True

def test_swipe_event():
    # First create a test user and get auth token
    # Then test swipe functionality
    swipe_data = {
        "event_id": "test-uuid",
        "direction": "right"
    }
    response = client.post("/api/v1/swipes", json=swipe_data)
    assert response.status_code == 200

def test_get_user_calendar():
    response = client.get("/api/v1/swipes/calendar")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
```

### 7.2 Environment Setup

```bash
# backend/.env.example
# App Configuration
DEBUG=true
APP_NAME="Godo Event Discovery API"
VERSION="1.0.0"

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/godo
SUPABASE_URL=http://localhost:9999
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Authentication
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
EVENTBRITE_API_KEY=your-eventbrite-key
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
```

## Implementation Timeline

### Week 1: Foundation

- [ ] Set up backend directory structure
- [ ] Create Pydantic models
- [ ] Set up Supabase database schema
- [ ] Configure FastAPI application
- [ ] Implement basic authentication

### Week 2: Core APIs

- [ ] Implement event management endpoints
- [ ] Create swipe recording system
- [ ] Build feed generation service
- [ ] Add user management APIs
- [ ] Set up error handling and validation

### Week 3: Business Logic

- [ ] Implement personalized feed algorithm
- [ ] Add user preference tracking
- [ ] Create event filtering and search
- [ ] Build social features foundation
- [ ] Add caching with Redis

### Week 4: Frontend Integration

- [ ] Set up API client in React Native
- [ ] Replace mock data with real API calls
- [ ] Implement authentication flow
- [ ] Add error handling and loading states
- [ ] Update Docker configuration

### Week 5: Testing & Polish

- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation updates
- [ ] Deployment preparation

## Success Metrics

- [ ] All API endpoints functional and tested
- [ ] Frontend successfully integrated with backend
- [ ] User authentication working end-to-end
- [ ] Event feed personalization active
- [ ] Swipe actions properly recorded and processed
- [ ] Docker environment fully operational
- [ ] Performance targets met (< 200ms API response times)

## Next Steps After Backend Integration

1. **API Integration**: Connect to external event sources (Eventbrite, NYC Open Data)
2. **Advanced Features**: Push notifications, calendar sync, social features
3. **Performance**: Implement caching strategies and database optimization
4. **Monitoring**: Add logging, metrics, and error tracking
5. **Deployment**: Set up production environment and CI/CD pipeline

This plan provides a comprehensive roadmap for implementing the Python FastAPI backend with Supabase integration, replacing the current mock data system with a fully functional, scalable backend infrastructure.
