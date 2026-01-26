from supabase import create_client, Client
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator, Optional
import redis
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialized clients (avoid crashes at import time)
_supabase: Optional[Client] = None
_supabase_admin: Optional[Client] = None
_engine = None
_SessionLocal = None
_redis_client: Optional[redis.Redis] = None
_redis_checked = False

Base = declarative_base()


def _get_supabase() -> Optional[Client]:
    """Lazily initialize Supabase client"""
    global _supabase
    if _supabase is None:
        if not settings.supabase_url or not settings.supabase_key:
            logger.warning("Supabase URL or key not configured")
            return None
        try:
            _supabase = create_client(settings.supabase_url, settings.supabase_key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
    return _supabase


def _get_supabase_admin() -> Optional[Client]:
    """Lazily initialize Supabase admin client"""
    global _supabase_admin
    if _supabase_admin is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            logger.warning("Supabase URL or service key not configured")
            return None
        try:
            _supabase_admin = create_client(settings.supabase_url, settings.supabase_service_key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase admin client: {e}")
    return _supabase_admin


def _get_engine():
    """Lazily initialize SQLAlchemy engine"""
    global _engine, _SessionLocal
    if _engine is None:
        if not settings.database_url:
            logger.warning("Database URL not configured")
            return None
        try:
            _engine = create_engine(settings.database_url)
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        except Exception as e:
            logger.error(f"Failed to initialize SQLAlchemy engine: {e}")
    return _engine


def _get_redis() -> Optional[redis.Redis]:
    """Lazily initialize Redis client"""
    global _redis_client, _redis_checked
    if not _redis_checked:
        _redis_checked = True
        try:
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
            _redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            _redis_client = None
    return _redis_client

def get_supabase_client() -> Optional[Client]:
    """Get Supabase client instance"""
    return _get_supabase()


def get_supabase_admin_client() -> Optional[Client]:
    """Get Supabase admin client for privileged operations"""
    return _get_supabase_admin()


def get_database() -> Generator:
    """Get database session (for SQLAlchemy if needed)"""
    _get_engine()  # Ensure engine is initialized
    if _SessionLocal is None:
        raise RuntimeError("Database not available")
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance (may be None if Redis unavailable)"""
    return _get_redis()

class DatabaseManager:
    """Database operations manager"""

    @property
    def supabase(self) -> Optional[Client]:
        return get_supabase_client()

    @property
    def supabase_admin(self) -> Optional[Client]:
        return get_supabase_admin_client()

    @property
    def redis(self) -> Optional[redis.Redis]:
        return get_redis_client()

    async def health_check(self) -> dict:
        """Check database connectivity"""
        # Test Supabase connection
        supabase_client = self.supabase
        if supabase_client is None:
            supabase_status = "not_configured"
        else:
            try:
                result = supabase_client.table("users").select("id").limit(1).execute()
                supabase_status = "healthy" if result else "unhealthy"
            except Exception as e:
                logger.error(f"Supabase health check failed: {e}")
                supabase_status = "unhealthy"

        # Test Redis connection (optional)
        redis_client = self.redis
        if redis_client is None:
            redis_status = "not_configured"
        else:
            try:
                redis_status = "healthy" if redis_client.ping() else "unhealthy"
            except Exception:
                redis_status = "unavailable"

        # Overall health - app can start without database for basic endpoints
        # but mark as degraded if Supabase isn't available
        if supabase_status == "healthy":
            overall = "healthy"
        elif supabase_status == "not_configured":
            overall = "degraded"
        else:
            overall = "unhealthy"

        return {
            "supabase": supabase_status,
            "redis": redis_status,
            "overall": overall
        }
    
    def execute_raw_sql(self, query: str, params: dict = None):
        """Execute raw SQL query via Supabase"""
        supabase_client = self.supabase
        if supabase_client is None:
            raise RuntimeError("Supabase client not available")
        try:
            if params:
                return supabase_client.rpc("execute_sql", {"query": query, "params": params}).execute()
            else:
                return supabase_client.rpc("execute_sql", {"query": query}).execute()
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