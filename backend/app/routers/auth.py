from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import logging

from app.models.user import UserCreate, UserLogin, UserToken, UserProfile
from app.services.user_service import UserService, get_user_service
from app.middleware.auth import AuthMiddleware, get_auth_middleware
from app.config import settings
from app.utils.exceptions import APIException

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserToken, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service),
    auth: AuthMiddleware = Depends(get_auth_middleware)
):
    """Register a new user account"""
    try:
        # Create user
        user = await user_service.create_user(user_data)
        
        # Create access and refresh tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = auth.create_access_token(
            data={"user_id": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        refresh_token = auth.create_refresh_token(user.id)
        
        # Create user profile for response
        user_profile = UserProfile(
            id=user.id,
            full_name=user.full_name,
            age=user.age,
            location_neighborhood=user.location_neighborhood,
            profile_image_url=user.profile_image_url,
            privacy_level=user.privacy_level
        )
        
        logger.info(f"User registered successfully: {user.email}")
        
        return UserToken(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_profile
        )
        
    except APIException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )

@router.post("/login", response_model=UserToken)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: UserService = Depends(get_user_service),
    auth: AuthMiddleware = Depends(get_auth_middleware)
):
    """User login with email and password"""
    try:
        # Authenticate user
        user = await user_service.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = auth.create_access_token(
            data={"user_id": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        refresh_token = auth.create_refresh_token(user.id)
        
        # Create user profile for response
        user_profile = UserProfile(
            id=user.id,
            full_name=user.full_name,
            age=user.age,
            location_neighborhood=user.location_neighborhood,
            profile_image_url=user.profile_image_url,
            privacy_level=user.privacy_level
        )
        
        logger.info(f"User logged in successfully: {user.email}")
        
        return UserToken(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_profile
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )

@router.post("/refresh", response_model=UserToken)
async def refresh_token(
    refresh_token: str = Form(...),
    user_service: UserService = Depends(get_user_service),
    auth: AuthMiddleware = Depends(get_auth_middleware)
):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        payload = auth.verify_token(refresh_token)
        
        if payload.get("token_type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get user
        user = await user_service.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        new_access_token = auth.create_access_token(
            data={"user_id": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        new_refresh_token = auth.create_refresh_token(user.id)
        
        # Create user profile for response
        user_profile = UserProfile(
            id=user.id,
            full_name=user.full_name,
            age=user.age,
            location_neighborhood=user.location_neighborhood,
            profile_image_url=user.profile_image_url,
            privacy_level=user.privacy_level
        )
        
        logger.info(f"Token refreshed successfully: {user.email}")
        
        return UserToken(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=user_profile
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Token refresh failed"
        )

@router.post("/logout")
async def logout_user(
    current_user = Depends(get_auth_middleware().get_current_user)
):
    """User logout (in a real implementation, you might blacklist the token)"""
    try:
        # In a production app, you would:
        # 1. Add token to blacklist in Redis
        # 2. Clear any server-side session data
        # For now, we just return success
        
        logger.info(f"User logged out: {current_user.email}")
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Logout failed"
        )

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Get current user's profile information"""
    try:
        # Get fresh user data
        user = await user_service.get_user_by_id(str(current_user.id))
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return UserProfile(
            id=user.id,
            full_name=user.full_name,
            age=user.age,
            location_neighborhood=user.location_neighborhood,
            profile_image_url=user.profile_image_url,
            privacy_level=user.privacy_level
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user profile"
        )