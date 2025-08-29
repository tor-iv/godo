from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import time
import logging
import uvicorn

from app.config import settings
from app.database import db_manager
from app.models.common import ErrorResponse
from app.utils.exceptions import APIException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.version}")
    
    # Test database connections
    health = await db_manager.health_check()
    if health["overall"] == "healthy":
        logger.info("Database connections established successfully")
    else:
        logger.warning(f"Database health check failed: {health}")
    
    # Initialize ML models cache
    try:
        # TODO: Load ML models here
        logger.info("ML models initialized")
    except Exception as e:
        logger.warning(f"ML model initialization failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Event discovery app backend for young professionals in NYC",
    debug=settings.debug,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:19000",
        "http://localhost:19001", 
        "http://localhost:19002",
        "exp://localhost:19000",
        "exp://localhost:19001",
        "exp://localhost:19002"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header and log slow requests"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:
        logger.warning(
            f"Slow request: {request.method} {request.url} took {process_time:.2f}s"
        )
    
    return response

# Exception handlers
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            message=exc.message,
            error_code=exc.error_code,
            details=exc.details
        ).dict()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            message="Validation error",
            error_code="VALIDATION_ERROR",
            details=exc.errors()
        ).dict()
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            message="Internal server error",
            error_code="INTERNAL_ERROR",
            details=str(exc) if settings.debug else None
        ).dict()
    )

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    health = await db_manager.health_check()
    return {
        "status": health["overall"],
        "version": settings.version,
        "timestamp": time.time(),
        "services": health
    }

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.version,
        "status": "healthy",
        "docs_url": "/docs" if settings.debug else None
    }

# Import and include routers
from app.routers import auth, users
# TODO: Import additional routers as they are implemented
# from app.routers import events, swipes, groups, notifications

app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
# TODO: Include additional routers
# app.include_router(events.router, prefix="/api/v1", tags=["Events"])
# app.include_router(swipes.router, prefix="/api/v1", tags=["Swipes"])
# app.include_router(groups.router, prefix="/api/v1", tags=["Groups"])
# app.include_router(notifications.router, prefix="/api/v1", tags=["Notifications"])

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )