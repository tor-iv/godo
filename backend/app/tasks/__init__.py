"""Celery tasks package."""

from .scraper_tasks import (
    scrape_nyc_parks,
    scrape_nyc_open_data,
    scrape_ticketmaster,
    scrape_all,
)

__all__ = [
    "scrape_nyc_parks",
    "scrape_nyc_open_data",
    "scrape_ticketmaster",
    "scrape_all",
]
