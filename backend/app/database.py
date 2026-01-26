from supabase import create_client, Client
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
import redis
from app.config import settings

# Supabase client for real-time features and auth
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

# Service client for admin operations
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_key)

# SQLAlchemy setup for complex queries (optional, Supabase client handles most cases)
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis client for caching and background jobs (optional)
try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    redis_client.ping()  # Test connection
except Exception:
    redis_client = None  # Redis not available

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase

def get_supabase_admin_client() -> Client:
    """Get Supabase admin client for privileged operations"""
    return supabase_admin

def get_database() -> Generator:
    """Get database session (for SQLAlchemy if needed)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_redis_client() -> redis.Redis | None:
    """Get Redis client instance (may be None if Redis unavailable)"""
    return redis_client

class DatabaseManager:
    """Database operations manager"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.supabase_admin = get_supabase_admin_client()
        self.redis = get_redis_client()
    
    async def health_check(self) -> dict:
        """Check database connectivity"""
        try:
            # Test Supabase connection
            result = self.supabase.table("users").select("id").limit(1).execute()
            supabase_status = "healthy" if result else "unhealthy"

            # Test Redis connection (optional)
            if self.redis:
                try:
                    redis_status = "healthy" if self.redis.ping() else "unhealthy"
                except Exception:
                    redis_status = "unavailable"
            else:
                redis_status = "not_configured"

            # Overall health based on Supabase only (Redis is optional)
            return {
                "supabase": supabase_status,
                "redis": redis_status,
                "overall": "healthy" if supabase_status == "healthy" else "unhealthy"
            }
        except Exception as e:
            return {
                "supabase": "unhealthy",
                "redis": "not_configured",
                "overall": "unhealthy",
                "error": str(e)
            }
    
    def execute_raw_sql(self, query: str, params: dict = None):
        """Execute raw SQL query via Supabase"""
        try:
            if params:
                return self.supabase.rpc("execute_sql", {"query": query, "params": params}).execute()
            else:
                return self.supabase.rpc("execute_sql", {"query": query}).execute()
        except Exception as e:
            raise Exception(f"SQL execution failed: {str(e)}")
    
    def cache_set(self, key: str, value: str, ttl: int = 300):
        """Set cache value with TTL"""
        if self.redis:
            return self.redis.setex(key, ttl, value)
        return None

    def cache_get(self, key: str):
        """Get cache value"""
        if self.redis:
            return self.redis.get(key)
        return None

    def cache_delete(self, key: str):
        """Delete cache key"""
        if self.redis:
            return self.redis.delete(key)
        return None

# Global database manager instance
db_manager = DatabaseManager()