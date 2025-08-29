from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from typing import Optional, Dict, Any, List
import os
import logging

from app.models.user import (
    UserProfile, UserUpdate, UserPreferences, 
    PhoneContactSync, FriendSuggestion
)
from app.services.user_service import UserService, get_user_service
from app.middleware.auth import get_auth_middleware
from app.config import settings
from app.utils.exceptions import APIException

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: str,
    current_user = Depends(get_auth_middleware().get_current_user_optional),
    user_service: UserService = Depends(get_user_service)
):
    """Get public user profile by ID with privacy filtering"""
    try:
        requesting_user_id = str(current_user.id) if current_user else None
        profile = await user_service.get_public_profile(user_id, requesting_user_id)
        
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user profile"
        )

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    update_data: UserUpdate,
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Update current user's profile"""
    try:
        updated_user = await user_service.update_user_profile(str(current_user.id), update_data)
        
        if not updated_user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Return updated profile
        return UserProfile(
            id=updated_user.id,
            full_name=updated_user.full_name,
            age=updated_user.age,
            location_neighborhood=updated_user.location_neighborhood,
            profile_image_url=updated_user.profile_image_url,
            privacy_level=updated_user.privacy_level
        )
        
    except APIException:
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update user profile"
        )

@router.post("/profile-image", response_model=dict)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Upload and update user's profile image"""
    try:
        # Validate file
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        if file.content_type not in settings.allowed_image_types:
            raise HTTPException(
                status_code=400,
                detail=f"Image type not allowed. Allowed types: {', '.join(settings.allowed_image_types)}"
            )
        
        # Read file data
        image_data = await file.read()
        
        # Save image
        image_url = await user_service.save_profile_image(
            str(current_user.id), 
            image_data, 
            file.content_type
        )
        
        logger.info(f"Profile image uploaded for user: {current_user.id}")
        
        return {
            "message": "Profile image uploaded successfully",
            "image_url": image_url
        }
        
    except APIException:
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload profile image"
        )

@router.get("/profile-image/{filename}")
async def get_profile_image(filename: str):
    """Serve profile image file"""
    try:
        file_path = f"/Users/torcox/godo/backend/uploads/profile_images/{filename}"
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="Image not found"
            )
        
        return FileResponse(
            file_path,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=3600"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving profile image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to serve image"
        )

@router.get("/preferences", response_model=Dict[str, Any])
async def get_user_preferences(
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Get current user's preferences"""
    try:
        preferences = await user_service.get_user_preferences(str(current_user.id))
        return preferences
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user preferences"
        )

@router.put("/preferences", response_model=dict)
async def update_user_preferences(
    preferences: Dict[str, Any],
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Update current user's preferences"""
    try:
        # Validate preferences structure
        if not isinstance(preferences, dict):
            raise HTTPException(
                status_code=400,
                detail="Preferences must be a JSON object"
            )
        
        success = await user_service.update_user_preferences(str(current_user.id), preferences)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to update preferences"
            )
        
        logger.info(f"Preferences updated for user: {current_user.id}")
        
        return {
            "message": "Preferences updated successfully",
            "preferences": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update user preferences"
        )

@router.post("/sync-contacts", response_model=List[FriendSuggestion])
async def sync_phone_contacts(
    contact_data: PhoneContactSync,
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Sync phone contacts and find friends"""
    try:
        # Find potential friends by phone contacts
        suggestions = await user_service.find_friends_by_phone(
            contact_data.phone_hashes,
            str(current_user.id)
        )
        
        logger.info(f"Contact sync completed for user: {current_user.id}, found {len(suggestions)} suggestions")
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Error syncing contacts: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to sync contacts"
        )

@router.delete("/account")
async def deactivate_account(
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Deactivate current user's account"""
    try:
        success = await user_service.deactivate_user(str(current_user.id))
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to deactivate account"
            )
        
        logger.info(f"Account deactivated for user: {current_user.id}")
        
        return {
            "message": "Account deactivated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating account: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to deactivate account"
        )

@router.get("/search", response_model=List[UserProfile])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    current_user = Depends(get_auth_middleware().get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Search for users by name or other criteria"""
    try:
        # This is a placeholder implementation
        # In a real app, you'd implement proper search with filters
        
        # For now, return empty list as search is not fully implemented
        logger.info(f"User search performed: '{q}' by user: {current_user.id}")
        
        return []
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search users"
        )

@router.get("/stats", response_model=dict)
async def get_user_stats(
    current_user = Depends(get_auth_middleware().get_current_user)
):
    """Get user statistics and analytics"""
    try:
        # This would fetch various user statistics
        # For now, return basic stats
        
        stats = {
            "profile_completion": 75,  # Percentage
            "events_attended": 0,     # Placeholder
            "friends_count": 0,       # Placeholder
            "swipes_today": 0,        # Placeholder
            "matches_this_week": 0    # Placeholder
        }
        
        logger.info(f"Stats requested for user: {current_user.id}")
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user stats"
        )