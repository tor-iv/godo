"""
Meetup scraper (Playwright + DeepSeek).

Meetup has no usable public API for event search results, so this renders
Meetup's public "find events" search pages with headless Chromium and hands
the rendered text to DeepSeek for structured extraction, via the shared
`PlaywrightDeepSeekScraper` base (see `playwright_base.py`).
"""

from typing import List, Optional
import logging

from app.models.event import EventCategory, EventSource
from .playwright_base import PlaywrightDeepSeekScraper

logger = logging.getLogger(__name__)


class MeetupScraper(PlaywrightDeepSeekScraper):
    """
    Scraper for Meetup.com events in New York City.

    Renders Meetup's public search results pages (no login required) for a
    small, fixed set of NYC-focused queries, scrolls a few times to load
    additional cards (the results page lazy-loads as you scroll), and lets
    DeepSeek extract structured events from the rendered page text.
    """

    source = EventSource.MEETUP
    base_url = "https://www.meetup.com"
    default_category = EventCategory.NETWORKING

    # Meetup's search results page lazy-loads more cards as you scroll. A
    # handful of passes is enough to pull in a reasonable batch of events
    # without turning this into a long-running, heavy-scroll crawl.
    scroll_count = 3

    def get_listing_urls(self) -> List[str]:
        """
        Public "find events" search results pages for New York City.

        Kept deliberately small (general + a couple of category filters)
        since this is a personal-scale scraper, not an exhaustive crawl.
        """
        return [
            # General NYC events feed.
            "https://www.meetup.com/find/?location=us--ny--new_york&source=EVENTS",
            # Keyword-filtered variants, rather than guessing at Meetup's
            # numeric categoryId values (undocumented and prone to drift) --
            # `keywords` is a stable, documented query param on the find page.
            "https://www.meetup.com/find/?location=us--ny--new_york&source=EVENTS&keywords=networking",
            "https://www.meetup.com/find/?location=us--ny--new_york&source=EVENTS&keywords=social",
        ]

    def get_listing_selector(self) -> Optional[str]:
        """
        Meetup's results page markup/CSS classes change frequently and
        aren't reliably documented, and the DeepSeek extraction step is
        designed to tolerate noisy whole-page text -- so we don't scope
        extraction to a specific container here and just use the default
        (whole page text).
        """
        return None
