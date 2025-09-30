from celery import Celery
from app.config import settings

# Create Celery instance
celery_app = Celery(
    "godo",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
    task_track_started=True,
    task_routes={
        "app.tasks.event_discovery.*": {"queue": "events"},
        "app.tasks.notifications.*": {"queue": "notifications"},
        "app.tasks.ml_recommendations.*": {"queue": "ml"},
    },
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_default_retry_delay=60,
    task_max_retries=3,
)

# Periodic tasks
celery_app.conf.beat_schedule = {
    "discover-new-events": {
        "task": "app.tasks.event_discovery.discover_events",
        "schedule": 3600.0,  # Every hour
    },
    "cleanup-old-events": {
        "task": "app.tasks.event_discovery.cleanup_old_events",
        "schedule": 86400.0,  # Every day
    },
    "send-event-recommendations": {
        "task": "app.tasks.ml_recommendations.send_daily_recommendations",
        "schedule": 86400.0,  # Every day at midnight
    },
    "update-ml-models": {
        "task": "app.tasks.ml_recommendations.update_models",
        "schedule": 604800.0,  # Every week
    },
}