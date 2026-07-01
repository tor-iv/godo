"""
Bandsintown scraper.

Bandsintown is the closest available equivalent to "Spotify events" -- Spotify
itself has no public events API, but Bandsintown is a popular concert-listing
service that many artists' Spotify/social profiles link out to, covering live
music (concerts, club shows, etc.) in a given city.

Bandsintown has no public API suitable for this use case, so this scraper
renders its public city listing page(s) with Playwright and extracts
structured events from the rendered content via DeepSeek, using the shared
`PlaywrightDeepSeekScraper` base.
"""

from typing import List, Optional

from app.models.event import EventCategory, EventSource
from .playwright_base import PlaywrightDeepSeekScraper


class BandsintownScraper(PlaywrightDeepSeekScraper):
    """
    Scraper for Bandsintown concert listings.

    Fetches upcoming concerts/live music events from Bandsintown's public
    New York City listing page. Bandsintown's city page is a long
    infinite-scroll list of event cards, so a small `scroll_count` is set to
    load a reasonable number of cards before extraction (kept modest -- this
    is personal-scale scraping, not a bulk crawl).
    """

    source = EventSource.BANDSINTOWN

    # Concerts/live music skew evening/night entertainment, matching how the
    # Ticketmaster scraper maps its "Music" segment to NIGHTLIFE -- use the
    # same default here for consistency across sources.
    default_category: EventCategory = EventCategory.NIGHTLIFE

    # Bandsintown's city page lazy-loads additional event cards as you
    # scroll. A handful of passes is enough to pull in more than the initial
    # page load without turning this into a deep/aggressive crawl.
    scroll_count: int = 3

    def get_listing_urls(self) -> List[str]:
        """Bandsintown's public NYC concert listing page."""
        return [
            "https://www.bandsintown.com/c/new-york-ny",
        ]

    def get_listing_selector(self) -> Optional[str]:
        """
        No reliably stable container selector is known for Bandsintown's
        listing page (it's a client-rendered SPA whose class names are
        unstable/hashed). Fall back to the base class default of whole-page
        text extraction -- DeepSeek's extraction step is designed to be
        resilient to noisy input, so this is fine here.
        """
        return None
