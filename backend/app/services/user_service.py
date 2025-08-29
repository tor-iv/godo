from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4
from datetime import datetime
from passlib.context import CryptContext
import hashlib
import logging
import aiofiles
import os
from PIL import Image
import io

from app.models.user import (
    User, UserCreate, UserUpdate, UserProfile, UserLogin, 
    UserToken, UserPreferences, PhoneContactSync, FriendSuggestion
)
from app.database import db_manager
from app.config import settings, NYC_NEIGHBORHOODS
from app.utils.exceptions import APIException

# Configure logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """Service class for user management operations"""
    
    def __init__(self):
        self.supabase = db_manager.supabase
    
    # Password utilities
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def hash_phone_number(self, phone: str) -> str:
        """Hash phone number for privacy (used for friend discovery)"""
        # Normalize phone number (remove all non-digits)
        normalized = ''.join(filter(str.isdigit, phone))
        # Hash with salt
        salt = "godo_phone_salt_2024"  # In production, use environment variable
        return hashlib.sha256(f"{normalized}{salt}".encode()).hexdigest()
    
    # User CRUD operations
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user account"""
        try:
            # Check if user already exists
            existing_user = await self.get_user_by_email(user_data.email)
            if existing_user:
                raise APIException(
                    message="User with this email already exists",
                    status_code=400,
                    error_code="USER_ALREADY_EXISTS"
                )
            
            # Validate neighborhood if provided
            if user_data.location_neighborhood and user_data.location_neighborhood not in NYC_NEIGHBORHOODS:
                raise APIException(
                    message="Invalid NYC neighborhood",
                    status_code=400,
                    error_code="INVALID_NEIGHBORHOOD"
                )
            
            # Hash password
            hashed_password = self.hash_password(user_data.password)
            
            # Hash phone number if provided
            phone_hash = None
            if user_data.phone_number:
                phone_hash = self.hash_phone_number(user_data.phone_number)
            
            user_id = str(uuid4())
            now = datetime.utcnow()
            
            # Create user record
            user_record = {
                "id": user_id,
                "email": user_data.email,
                "password_hash": hashed_password,
                "full_name": user_data.full_name,
                "age": user_data.age,
                "location_neighborhood": user_data.location_neighborhood,
                "privacy_level": user_data.privacy_level,
                "phone_hash": phone_hash,
                "preferences": {},
                "ml_preference_vector": [],
                "is_active": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            # Insert into database
            result = self.supabase.table("users").insert(user_record).execute()
            
            if result.data:
                logger.info(f"User created successfully: {user_id}")
                return User(**result.data[0])
            else:
                raise APIException(
                    message="Failed to create user",
                    status_code=500,
                    error_code="USER_CREATION_FAILED"
                )
                
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise APIException(
                message="Failed to create user account",
                status_code=500,
                error_code="USER_CREATION_ERROR",
                details=str(e)
            )
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return None
            
            if not self.verify_password(password, user.password_hash):
                return None
            
            # Update last login
            await self.update_last_login(user.id)
            
            return user
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        try:
            result = self.supabase.table("users").select("*").eq("id", user_id).execute()
            
            if result.data:
                return User(**result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            result = self.supabase.table("users").select("*").eq("email", email).execute()
            
            if result.data:
                return User(**result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def update_user_profile(self, user_id: str, update_data: UserUpdate) -> Optional[User]:
        """Update user profile"""
        try:
            # Validate neighborhood if provided
            if update_data.location_neighborhood and update_data.location_neighborhood not in NYC_NEIGHBORHOODS:
                raise APIException(
                    message="Invalid NYC neighborhood",
                    status_code=400,
                    error_code="INVALID_NEIGHBORHOOD"
                )
            
            # Prepare update data (exclude None values)
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            update_dict["updated_at"] = datetime.utcnow().isoformat()
            
            # Update in database
            result = self.supabase.table("users").update(update_dict).eq("id", user_id).execute()
            
            if result.data:
                logger.info(f"User profile updated: {user_id}")
                return User(**result.data[0])
            return None
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise APIException(
                message="Failed to update user profile",
                status_code=500,
                error_code="PROFILE_UPDATE_ERROR",
                details=str(e)
            )
    
    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate user account"""
        try:
            result = self.supabase.table("users").update({
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
            
            if result.data:
                logger.info(f"User deactivated: {user_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deactivating user: {e}")
            return False
    
    async def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        try:
            self.supabase.table("users").update({
                "last_login": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
    
    # Profile picture handling
    async def save_profile_image(self, user_id: str, image_data: bytes, content_type: str) -> str:
        """Save and process profile image"""
        try:
            # Validate image type
            if content_type not in settings.allowed_image_types:
                raise APIException(
                    message="Invalid image type",
                    status_code=400,
                    error_code="INVALID_IMAGE_TYPE"
                )
            
            # Validate file size
            if len(image_data) > settings.max_file_size:
                raise APIException(
                    message="File too large",
                    status_code=400,
                    error_code="FILE_TOO_LARGE"
                )
            
            # Process image
            image = Image.open(io.BytesIO(image_data))
            
            # Resize and optimize
            image = image.convert('RGB')
            image.thumbnail((800, 800), Image.Resampling.LANCZOS)
            
            # Generate filename
            file_extension = content_type.split('/')[-1]
            if file_extension == 'jpeg':
                file_extension = 'jpg'
            
            filename = f"{user_id}_{datetime.utcnow().timestamp():.0f}.{file_extension}"
            file_path = f"/Users/torcox/godo/backend/uploads/profile_images/{filename}"
            
            # Save image
            image.save(file_path, quality=85, optimize=True)
            
            # Generate URL (this would be a CDN URL in production)
            image_url = f"/api/v1/users/profile-image/{filename}"
            
            # Update user profile with image URL
            await self.update_user_profile(user_id, UserUpdate(profile_image_url=image_url))
            
            logger.info(f"Profile image saved for user: {user_id}")
            return image_url
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error saving profile image: {e}")
            raise APIException(
                message="Failed to save profile image",
                status_code=500,
                error_code="IMAGE_SAVE_ERROR",
                details=str(e)
            )
    
    # User preferences
    async def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences"""
        try:
            user = await self.get_user_by_id(user_id)
            return user.preferences if user else {}
        except Exception as e:
            logger.error(f"Error getting user preferences: {e}")
            return {}
    
    async def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Update user preferences"""
        try:
            result = self.supabase.table("users").update({
                "preferences": preferences,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
            
            if result.data:
                logger.info(f"User preferences updated: {user_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {e}")
            return False
    
    # Friend discovery
    async def find_friends_by_phone(self, phone_hashes: List[str], requesting_user_id: str) -> List[FriendSuggestion]:
        """Find potential friends by phone contact sync"""
        try:
            # Find users with matching phone hashes
            result = self.supabase.table("users").select("id, full_name, location_neighborhood, profile_image_url, privacy_level").in_("phone_hash", phone_hashes).neq("id", requesting_user_id).execute()
            
            suggestions = []
            if result.data:
                for user_data in result.data:
                    user_profile = UserProfile(**user_data)
                    suggestion = FriendSuggestion(
                        user=user_profile,
                        reason="phone_contact",
                        confidence_score=0.9
                    )
                    suggestions.append(suggestion)
            
            logger.info(f"Found {len(suggestions)} friend suggestions by phone for user: {requesting_user_id}")
            return suggestions
            
        except Exception as e:
            logger.error(f"Error finding friends by phone: {e}")
            return []
    
    # Public profile
    async def get_public_profile(self, user_id: str, requesting_user_id: Optional[str] = None) -> Optional[UserProfile]:
        """Get public user profile with privacy filtering"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None
            
            # Apply privacy filtering
            profile_data = {
                "id": user.id,
                "privacy_level": user.privacy_level,
                "mutual_friends_count": 0  # TODO: Calculate mutual friends
            }
            
            # Add fields based on privacy level
            if user.privacy_level == "public" or user_id == requesting_user_id:
                profile_data.update({
                    "full_name": user.full_name,
                    "age": user.age,
                    "location_neighborhood": user.location_neighborhood,
                    "profile_image_url": user.profile_image_url
                })
            elif user.privacy_level == "friends_only":
                # TODO: Check if users are friends
                # For now, show limited info
                profile_data.update({
                    "full_name": user.full_name,
                    "profile_image_url": user.profile_image_url
                })
            
            return UserProfile(**profile_data)
            
        except Exception as e:
            logger.error(f"Error getting public profile: {e}")
            return None

# Global service instance
_user_service = None

def get_user_service() -> UserService:
    """Get user service instance (singleton)"""
    global _user_service
    if _user_service is None:
        _user_service = UserService()
    return _user_service