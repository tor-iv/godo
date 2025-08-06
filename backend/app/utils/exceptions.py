from typing import Optional, Any

class APIException(Exception):
    """Custom API exception with structured error details"""
    
    def __init__(
        self, 
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(self.message)

# Common exceptions
class AuthenticationError(APIException):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )

class AuthorizationError(APIException):
    """Authorization related errors"""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )

class NotFoundError(APIException):
    """Resource not found errors"""
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details=details
        )

class ValidationError(APIException):
    """Validation errors"""
    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )

class ConflictError(APIException):
    """Conflict errors (e.g., duplicate resources)"""
    def __init__(self, message: str = "Resource conflict", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT_ERROR",
            details=details
        )

class RateLimitError(APIException):
    """Rate limiting errors"""
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_ERROR",
            details=details
        )

class ExternalServiceError(APIException):
    """External service errors"""
    def __init__(self, message: str = "External service error", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=502,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details
        )

# ML specific exceptions
class MLModelError(APIException):
    """Machine learning model errors"""
    def __init__(self, message: str = "ML model error", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="ML_MODEL_ERROR",
            details=details
        )

class RecommendationError(APIException):
    """Recommendation engine errors"""
    def __init__(self, message: str = "Recommendation generation failed", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="RECOMMENDATION_ERROR",
            details=details
        )

# Background job exceptions
class BackgroundJobError(APIException):
    """Background job errors"""
    def __init__(self, message: str = "Background job failed", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="BACKGROUND_JOB_ERROR",
            details=details
        )