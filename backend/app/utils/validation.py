from typing import Dict, Any, List, Optional
import re
import bleach
from email_validator import validate_email, EmailNotValidError
import logging

from app.config import NYC_NEIGHBORHOODS, EVENT_CATEGORIES
from app.utils.exceptions import APIException

# Configure logging
logger = logging.getLogger(__name__)

class DataValidator:
    """Comprehensive data validation and sanitization utility"""
    
    # Regex patterns
    PHONE_PATTERN = re.compile(r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$')
    PASSWORD_PATTERN = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$')
    USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_]{3,20}$')
    
    # HTML sanitization settings
    ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br']
    ALLOWED_ATTRIBUTES = {}
    
    @staticmethod
    def validate_email_address(email: str) -> str:
        """Validate and normalize email address"""
        try:
            # Use email-validator library
            validation_result = validate_email(email)
            return validation_result.email
        except EmailNotValidError as e:
            raise APIException(
                message=f"Invalid email address: {str(e)}",
                status_code=400,
                error_code="INVALID_EMAIL"
            )
    
    @staticmethod
    def validate_password(password: str) -> bool:
        """Validate password strength"""
        if len(password) < 8:
            raise APIException(
                message="Password must be at least 8 characters long",
                status_code=400,
                error_code="PASSWORD_TOO_SHORT"
            )
        
        if len(password) > 128:
            raise APIException(
                message="Password must be less than 128 characters",
                status_code=400,
                error_code="PASSWORD_TOO_LONG"
            )
        
        if not re.search(r'[a-z]', password):
            raise APIException(
                message="Password must contain at least one lowercase letter",
                status_code=400,
                error_code="PASSWORD_MISSING_LOWERCASE"
            )
        
        if not re.search(r'[A-Z]', password):
            raise APIException(
                message="Password must contain at least one uppercase letter",
                status_code=400,
                error_code="PASSWORD_MISSING_UPPERCASE"
            )
        
        if not re.search(r'\d', password):
            raise APIException(
                message="Password must contain at least one digit",
                status_code=400,
                error_code="PASSWORD_MISSING_DIGIT"
            )
        
        # Check for common weak passwords
        weak_passwords = [
            'password', 'password123', '12345678', 'qwerty', 'abc123',
            'password1', '123456789', 'welcome', 'admin', 'letmein'
        ]
        
        if password.lower() in weak_passwords:
            raise APIException(
                message="Password is too common. Please choose a more secure password",
                status_code=400,
                error_code="PASSWORD_TOO_WEAK"
            )
        
        return True
    
    @staticmethod
    def validate_phone_number(phone: str) -> str:
        """Validate and normalize phone number"""
        if not phone:
            return phone
        
        # Remove all non-digit characters for validation
        digits_only = re.sub(r'\D', '', phone)
        
        # Check if it matches US phone number format
        if not re.match(r'^1?[2-9]\d{2}[2-9]\d{2}\d{4}$', digits_only):
            raise APIException(
                message="Invalid US phone number format",
                status_code=400,
                error_code="INVALID_PHONE_NUMBER"
            )
        
        # Normalize to +1XXXXXXXXXX format
        if len(digits_only) == 10:
            return f"+1{digits_only}"
        elif len(digits_only) == 11 and digits_only[0] == '1':
            return f"+{digits_only}"
        else:
            raise APIException(
                message="Invalid phone number length",
                status_code=400,
                error_code="INVALID_PHONE_LENGTH"
            )
    
    @staticmethod
    def validate_age(age: int) -> bool:
        """Validate user age"""
        if age < 18:
            raise APIException(
                message="Users must be at least 18 years old",
                status_code=400,
                error_code="AGE_TOO_YOUNG"
            )
        
        if age > 100:
            raise APIException(
                message="Invalid age provided",
                status_code=400,
                error_code="AGE_TOO_OLD"
            )
        
        return True
    
    @staticmethod
    def validate_nyc_neighborhood(neighborhood: str) -> bool:
        """Validate NYC neighborhood"""
        if neighborhood not in NYC_NEIGHBORHOODS:
            raise APIException(
                message=f"Invalid NYC neighborhood. Must be one of: {', '.join(NYC_NEIGHBORHOODS[:5])}...",
                status_code=400,
                error_code="INVALID_NEIGHBORHOOD"
            )
        
        return True
    
    @staticmethod
    def validate_event_category(category: str) -> bool:
        """Validate event category"""
        if category not in EVENT_CATEGORIES:
            raise APIException(
                message=f"Invalid event category. Must be one of: {', '.join(EVENT_CATEGORIES)}",
                status_code=400,
                error_code="INVALID_EVENT_CATEGORY"
            )
        
        return True
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        """Sanitize HTML content to prevent XSS"""
        if not text:
            return text
        
        return bleach.clean(
            text,
            tags=DataValidator.ALLOWED_TAGS,
            attributes=DataValidator.ALLOWED_ATTRIBUTES,
            strip=True
        )
    
    @staticmethod
    def sanitize_text_input(text: str, max_length: int = 1000) -> str:
        """Sanitize and validate text input"""
        if not text:
            return text
        
        # Strip whitespace
        text = text.strip()
        
        # Check length
        if len(text) > max_length:
            raise APIException(
                message=f"Text input too long. Maximum {max_length} characters allowed",
                status_code=400,
                error_code="TEXT_TOO_LONG"
            )
        
        # Remove null bytes and other control characters
        text = ''.join(char for char in text if ord(char) >= 32 or char in ['\n', '\r', '\t'])
        
        # Basic sanitization to prevent injection attacks
        text = text.replace('<script', '&lt;script')
        text = text.replace('javascript:', 'javascript_')
        text = text.replace('vbscript:', 'vbscript_')
        text = text.replace('onload=', 'onload_')
        text = text.replace('onerror=', 'onerror_')
        
        return text
    
    @staticmethod
    def validate_user_preferences(preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize user preferences"""
        if not isinstance(preferences, dict):
            raise APIException(
                message="Preferences must be a JSON object",
                status_code=400,
                error_code="INVALID_PREFERENCES_FORMAT"
            )
        
        # Limit preferences size
        if len(str(preferences)) > 10000:  # 10KB limit
            raise APIException(
                message="Preferences data too large",
                status_code=400,
                error_code="PREFERENCES_TOO_LARGE"
            )
        
        # Sanitize string values
        sanitized = {}
        for key, value in preferences.items():
            # Sanitize key
            clean_key = DataValidator.sanitize_text_input(str(key), 100)
            
            # Sanitize value based on type
            if isinstance(value, str):
                clean_value = DataValidator.sanitize_text_input(value, 1000)
            elif isinstance(value, (int, float, bool)):
                clean_value = value
            elif isinstance(value, list):
                # Sanitize list items if they're strings
                clean_value = [
                    DataValidator.sanitize_text_input(str(item), 500) 
                    if isinstance(item, str) else item
                    for item in value[:50]  # Limit list size
                ]
            elif isinstance(value, dict):
                # Recursively sanitize nested objects (limited depth)
                clean_value = DataValidator.validate_user_preferences(value)
            else:
                # Skip unsupported types
                continue
            
            sanitized[clean_key] = clean_value
        
        return sanitized
    
    @staticmethod
    def validate_file_upload(file_data: bytes, content_type: str, max_size: int = None) -> bool:
        """Validate file upload"""
        if max_size is None:
            max_size = 10 * 1024 * 1024  # 10MB default
        
        # Check file size
        if len(file_data) > max_size:
            raise APIException(
                message=f"File too large. Maximum size: {max_size // (1024 * 1024)}MB",
                status_code=400,
                error_code="FILE_TOO_LARGE"
            )
        
        # Check if file is empty
        if len(file_data) == 0:
            raise APIException(
                message="File is empty",
                status_code=400,
                error_code="EMPTY_FILE"
            )
        
        # Validate content type for images
        if content_type.startswith('image/'):
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if content_type not in allowed_types:
                raise APIException(
                    message=f"Invalid image type. Allowed: {', '.join(allowed_types)}",
                    status_code=400,
                    error_code="INVALID_IMAGE_TYPE"
                )
            
            # Check for image headers to prevent fake uploads
            if content_type == 'image/jpeg' and not file_data.startswith(b'\xff\xd8'):
                raise APIException(
                    message="Invalid JPEG file",
                    status_code=400,
                    error_code="INVALID_JPEG"
                )
            elif content_type == 'image/png' and not file_data.startswith(b'\x89PNG'):
                raise APIException(
                    message="Invalid PNG file",
                    status_code=400,
                    error_code="INVALID_PNG"
                )
        
        return True
    
    @staticmethod
    def validate_location_coordinates(latitude: float, longitude: float) -> bool:
        """Validate geographic coordinates for NYC area"""
        # NYC bounds from config
        nyc_bounds = {
            "north": 40.9176,
            "south": 40.4774,
            "east": -73.7004,
            "west": -74.2591
        }
        
        if not (nyc_bounds["south"] <= latitude <= nyc_bounds["north"]):
            raise APIException(
                message="Location must be within NYC area",
                status_code=400,
                error_code="LOCATION_OUT_OF_BOUNDS"
            )
        
        if not (nyc_bounds["west"] <= longitude <= nyc_bounds["east"]):
            raise APIException(
                message="Location must be within NYC area",
                status_code=400,
                error_code="LOCATION_OUT_OF_BOUNDS"
            )
        
        return True
    
    @staticmethod
    def validate_json_structure(data: Any, required_fields: List[str] = None) -> bool:
        """Validate JSON structure and required fields"""
        if required_fields:
            if not isinstance(data, dict):
                raise APIException(
                    message="Data must be a JSON object",
                    status_code=400,
                    error_code="INVALID_JSON_STRUCTURE"
                )
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                raise APIException(
                    message=f"Missing required fields: {', '.join(missing_fields)}",
                    status_code=400,
                    error_code="MISSING_REQUIRED_FIELDS"
                )
        
        return True