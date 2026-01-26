from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # App Configuration
    app_name: str = "Godo Event Discovery API"
    debug: bool = False
    version: str = "1.0.0"

    # Database Configuration (optional for startup, required for full functionality)
    database_url: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_service_key: Optional[str] = None

    # Authentication
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # External APIs
    eventbrite_api_key: Optional[str] = None
    google_maps_api_key: Optional[str] = None
    nyc_open_data_api_key: Optional[str] = None
    
    # Rate Limiting
    rate_limit_per_minute: int = 100
    
    # NYC Specific Configuration
    nyc_bounds: dict = {
        "north": 40.9176,
        "south": 40.4774,
        "east": -73.7004,
        "west": -74.2591
    }
    
    # Machine Learning
    ml_model_path: str = "/tmp/ml_models"
    recommendation_cache_ttl: int = 300  # 5 minutes
    
    # Background Jobs
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_image_types: list = ["image/jpeg", "image/png", "image/webp"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()

# NYC Neighborhoods for validation
NYC_NEIGHBORHOODS = [
    # Manhattan
    "East Village", "West Village", "SoHo", "Tribeca", "Lower East Side",
    "Chinatown", "Little Italy", "Nolita", "Financial District", "Battery Park City",
    "Chelsea", "Flatiron", "Gramercy", "Murray Hill", "Midtown West",
    "Midtown East", "Hell's Kitchen", "Times Square", "Upper East Side", "Upper West Side",
    "Harlem", "East Harlem", "Washington Heights", "Inwood",
    
    # Brooklyn
    "Williamsburg", "Greenpoint", "DUMBO", "Brooklyn Heights", "Park Slope",
    "Prospect Heights", "Crown Heights", "Bed-Stuy", "Bushwick", "Red Hook",
    "Carroll Gardens", "Cobble Hill", "Fort Greene", "Clinton Hill", "Gowanus",
    
    # Queens
    "Long Island City", "Astoria", "Sunnyside", "Woodside", "Jackson Heights",
    "Elmhurst", "Forest Hills", "Flushing", "Williamsburg Bridge",
    
    # Bronx
    "South Bronx", "Mott Haven", "Port Morris", "Yankee Stadium Area",
    
    # Staten Island
    "St. George", "New Brighton", "Stapleton"
]

# Event Categories
EVENT_CATEGORIES = [
    "networking", "culture", "fitness", "food", 
    "nightlife", "outdoor", "professional"
]

# NYC Transit Accessibility Scoring
TRANSIT_SCORES = {
    "subway_within_2_blocks": 10,
    "subway_within_4_blocks": 8,
    "subway_within_6_blocks": 6,
    "bus_only": 4,
    "limited_transit": 2,
    "no_transit": 1
}