import asyncio
import asyncpg
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

import redis

from app.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None
_pool_loop: Optional[asyncio.AbstractEventLoop] = None
_redis_client: Optional[redis.Redis] = None
_redis_checked = False


async def _init_connection(conn: asyncpg.Connection) -> None:
    """Per-connection setup: decode JSON/JSONB columns to dict/list instead of
    raw text, matching the behavior callers previously got from supabase-py."""
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )
    await conn.set_type_codec(
        "json",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def get_pool() -> asyncpg.Pool:
    """Lazily initialize the shared asyncpg connection pool.

    asyncpg pools are bound to the event loop that created them. The FastAPI
    process has one long-lived loop, so this is a non-issue there -- but
    Celery's `run_async()` helper (app/tasks/scraper_tasks.py) creates and
    closes a fresh event loop per task. A pool created on a now-closed loop
    is unusable, so detect that case and transparently recreate the pool on
    the current loop rather than erroring on the second+ scraper task in a
    worker process.
    """
    global _pool, _pool_loop
    current_loop = asyncio.get_running_loop()
    if _pool is not None and _pool_loop is not current_loop:
        logger.info("Event loop changed (new Celery task) -- recreating asyncpg pool")
        _pool = None
    if _pool is None:
        if not settings.database_url:
            raise RuntimeError("DATABASE_URL not configured")
        _pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
            init=_init_connection,
        )
        _pool_loop = current_loop
    return _pool


@asynccontextmanager
async def acquire() -> AsyncGenerator[asyncpg.Connection, None]:
    """Acquire a connection from the pool. Usage: `async with acquire() as conn:`"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


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


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance (may be None if Redis unavailable)"""
    return _get_redis()


def to_point(latitude: Optional[float], longitude: Optional[float]) -> Optional[str]:
    """Build a PostGIS ST_GeogFromText literal for events.location_point from
    lat/lng, or None if either is missing. Pass the result as a query parameter
    cast with `::geography` is not needed -- ST_GeogFromText already returns
    geography."""
    if latitude is None or longitude is None:
        return None
    return f"POINT({longitude} {latitude})"


LOCATION_POINT_SELECT = (
    "ST_Y(location_point::geometry) AS latitude, "
    "ST_X(location_point::geometry) AS longitude"
)


class DatabaseManager:
    """Database operations manager"""

    @property
    def redis(self) -> Optional[redis.Redis]:
        return get_redis_client()

    async def health_check(self) -> dict:
        """Check database connectivity"""
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_status = "unhealthy"

        redis_client = self.redis
        if redis_client is None:
            redis_status = "not_configured"
        else:
            try:
                redis_status = "healthy" if redis_client.ping() else "unhealthy"
            except Exception:
                redis_status = "unavailable"

        overall = "healthy" if db_status == "healthy" else "unhealthy"

        return {
            "database": db_status,
            "redis": redis_status,
            "overall": overall,
        }

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
