# Event scrapers package

from .base import BaseScraper, ScraperResult
from .nyc_parks import NYCParksScraper

__all__ = ["BaseScraper", "ScraperResult", "NYCParksScraper"]
