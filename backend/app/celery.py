from celery import Celery
from celery.schedules import crontab
from app.config import settings

# Create Celery instance
celery_app = Celery(
    "godo",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.scraper_tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/New_York",
    enable_utc=True,
    result_expires=3600,
    task_track_started=True,
    task_routes={
        "app.tasks.event_discovery.*": {"queue": "events"},
        "app.tasks.notifications.*": {"queue": "notifications"},
        "app.tasks.ml_recommendations.*": {"queue": "ml"},
        "app.tasks.scraper_tasks.*": {"queue": "scrapers"},
    },
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_default_retry_delay=60,
    task_max_retries=3,
)

# Periodic tasks - daily scraping at 6am EST
celery_app.conf.beat_schedule = {
    "scrape-nyc-parks-daily": {
        "task": "app.tasks.scraper_tasks.scrape_nyc_parks",
        "schedule": crontab(hour=6, minute=0),
    },
    "scrape-nyc-open-data-daily": {
        "task": "app.tasks.scraper_tasks.scrape_nyc_open_data",
        "schedule": crontab(hour=6, minute=30),
    },
    "scrape-ticketmaster-daily": {
        "task": "app.tasks.scraper_tasks.scrape_ticketmaster",
        "schedule": crontab(hour=7, minute=0),  # Run at 7am to stagger with free sources
    },
}