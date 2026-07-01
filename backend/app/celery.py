from celery import Celery
from celery.schedules import crontab
from app.config import settings

# Create Celery instance
celery_app = Celery(
    "godo",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.scraper_tasks", "app.tasks.calendar_tasks"]
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
        # Routed to the same "scrapers" queue as the scraper tasks, not
        # "notifications" -- this box runs a single celery-worker process
        # (concurrency capped at 1 to bound Playwright/Chromium memory)
        # consuming only the "scrapers" queue, so anything routed elsewhere
        # would never be picked up.
        "app.tasks.calendar_tasks.*": {"queue": "scrapers"},
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
    "scrape-eventbrite-daily": {
        "task": "app.tasks.scraper_tasks.scrape_eventbrite",
        "schedule": crontab(hour=7, minute=30),  # Run at 7:30am to stagger with other sources
    },
    "scrape-meetup-daily": {
        "task": "app.tasks.scraper_tasks.scrape_meetup",
        "schedule": crontab(hour=8, minute=0),  # Run at 8am to stagger with other sources
    },
    "scrape-bandsintown-daily": {
        "task": "app.tasks.scraper_tasks.scrape_bandsintown",
        "schedule": crontab(hour=8, minute=30),  # Run at 8:30am to stagger with other sources
    },
    "scrape-opentable-daily": {
        "task": "app.tasks.scraper_tasks.scrape_opentable",
        "schedule": crontab(hour=9, minute=0),  # Run at 9am to stagger with other sources
        # NOTE: unlike the other sources here, OpenTable "events" are
        # same-day reservation time slots -- they go stale within hours,
        # not days, since a slot scraped this morning may no longer be
        # bookable (or may no longer even be listed) by evening. A single
        # 9am run/day is a reasonable starting cadence, but this is a
        # good candidate for a tighter sync_frequency than the other
        # sources once we're ready to tune per-source schedules (see
        # `event_sources.sync_frequency` -- not changed here).
    },
}