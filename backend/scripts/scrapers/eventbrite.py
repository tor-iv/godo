"""
Eventbrite scraper.

Eventbrite has no usable public API for general event search (the old v3
search endpoint was deprecated for third-party use), so this scraper renders
Eventbrite's public NYC search results pages with Playwright and hands the
content to DeepSeek for structured extraction, via the shared
`PlaywrightDeepSeekScraper` base.
"""

from typing import List, Optional
import logging

from app.models.event import EventSource, EventCategory
from .playwright_base import PlaywrightDeepSeekScraper

logger = logging.getLogger(__name__)

# Eventbrite's NYC search results page is a long, lazily-loaded scrolling
# list. A base "all events" URL plus a couple of category-filtered variants
# is plenty for personal-scale scraping -- this isn't meant to crawl
# Eventbrite exhaustively.
NYC_LISTING_URLS = [
    "https://www.eventbrite.com/d/ny--new-york/events/",
    "https://www.eventbrite.com/d/ny--new-york/music--events/",
    "https://www.eventbrite.com/d/ny--new-york/food-and-drink--events/",
]


class EventbriteScraper(PlaywrightDeepSeekScraper):
    """
    Scraper for Eventbrite events in NYC via rendered search results pages.

    Eventbrite's search results page is an infinite-scroll list, so we
    perform a handful of scroll passes before extraction to load more event
    cards. The page layout is noisy/frequently changes, so we rely on the
    base class's default whole-page-text extraction (DeepSeek's extraction
    step is designed to be resilient to that) rather than a brittle CSS
    selector.
    """

    source = EventSource.EVENTBRITE
    default_category = EventCategory.CULTURE

    # Eventbrite's listing pages lazy-load additional cards as you scroll;
    # a few passes surfaces noticeably more events without turning this
    # into a heavy scrape.
    scroll_count = 3

    def get_listing_urls(self) -> List[str]:
        return NYC_LISTING_URLS

    def get_listing_selector(self) -> Optional[str]:
        # Eventbrite's event-card container class names are
        # generated/unstable, so we deliberately don't scope to a CSS
        # selector here -- the base class falls back to whole-page text
        # extraction, which DeepSeek's extraction prompt is built to handle.
        return None
