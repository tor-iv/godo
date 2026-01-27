# Event scrapers package

from .base import BaseScraper, ScraperResult
from .nyc_parks import NYCParksScraper
from .nyc_open_data import NYCOpenDataScraper

__all__ = ["BaseScraper", "ScraperResult", "NYCParksScraper", "NYCOpenDataScraper"]
