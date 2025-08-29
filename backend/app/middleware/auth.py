from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

from app.config import settings
from app.models.user import User
from app.services.user_service import UserService
from app.utils.exceptions import APIException

# Configure logging
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

class AuthMiddleware:
    """Authentication middleware for JWT token handling"""
    
    def __init__(self, user_service: UserService):
        self.user_service = user_service
        self.secret_key = settings.jwt_secret
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "iat": datetime.utcnow()})
        
        try:
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating access token: {e}")
            raise APIException(
                message="Failed to create access token",
                status_code=500,
                error_code="TOKEN_CREATION_FAILED"
            )
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create JWT refresh token with longer expiration"""
        expire = datetime.utcnow() + timedelta(days=30)  # 30 days for refresh token
        to_encode = {
            "user_id": str(user_id),
            "token_type": "refresh",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        try:
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating refresh token: {e}")
            raise APIException(
                message="Failed to create refresh token",
                status_code=500,
                error_code="TOKEN_CREATION_FAILED"
            )
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise APIException(
                message="Token has expired",
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code="TOKEN_EXPIRED"
            )
        except jwt.JWTClaimsError:
            raise APIException(
                message="Invalid token claims",
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code="INVALID_TOKEN_CLAIMS"
            )
        except JWTError:
            raise APIException(
                message="Invalid token",
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code="INVALID_TOKEN"
            )
    
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """Get current authenticated user from token"""
        try:
            payload = self.verify_token(credentials.credentials)
            user_id = payload.get("user_id")
            
            if user_id is None:
                raise APIException(
                    message="Invalid token payload",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    error_code="INVALID_TOKEN_PAYLOAD"
                )
            
            # Get user from database
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise APIException(
                    message="User not found",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    error_code="USER_NOT_FOUND"
                )
            
            if not user.is_active:
                raise APIException(
                    message="Inactive user",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    error_code="USER_INACTIVE"
                )
            
            return user
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error getting current user: {e}")
            raise APIException(
                message="Authentication failed",
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code="AUTHENTICATION_FAILED"
            )
    
    async def get_current_user_optional(self, 
                                      credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
        """Get current user if authenticated, None otherwise"""
        if not credentials:
            return None
        
        try:
            return await self.get_current_user(credentials)
        except APIException:
            return None
    
    def require_roles(self, allowed_roles: list):
        """Decorator to require specific roles"""
        async def role_checker(current_user: User = Depends(self.get_current_user)):
            # For now, we don't have roles in the user model
            # This is a placeholder for future role-based access control
            return current_user
        return role_checker
    
    async def rate_limit_check(self, request: Request, user: User) -> bool:
        """Check rate limits for user"""
        # This would integrate with Redis for rate limiting
        # For now, return True (no rate limiting)
        return True

# Initialize auth middleware (will be dependency injected)
auth_middleware = None

def get_auth_middleware() -> AuthMiddleware:
    """Get auth middleware instance"""
    global auth_middleware
    if auth_middleware is None:
        from app.services.user_service import get_user_service
        auth_middleware = AuthMiddleware(get_user_service())
    return auth_middleware

# Common dependencies
def get_current_user(auth: AuthMiddleware = Depends(get_auth_middleware)):
    """Dependency for getting current authenticated user"""
    return auth.get_current_user

def get_current_user_optional(auth: AuthMiddleware = Depends(get_auth_middleware)):
    """Dependency for getting current user optionally"""
    return auth.get_current_user_optional