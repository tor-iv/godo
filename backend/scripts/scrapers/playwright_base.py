"""
Shared base for Playwright + DeepSeek-powered event scrapers.

This module is for sources that have no usable public API: we render their
listing pages with a real (headless) browser via Playwright, then hand the
rendered text/HTML to DeepSeek's LLM (an OpenAI-API-compatible endpoint) to
extract structured event data out of the messy page content.

Source-specific scrapers (Eventbrite, Meetup, Bandsintown, OpenTable, ...)
should subclass `PlaywrightDeepSeekScraper` below. They only need to supply:

    - `source`            (class attr, same as BaseScraper -- an EventSource)
    - `get_listing_urls()`           -> list[str] of pages to scrape
    - `get_listing_selector()`       -> optional CSS selector to scope
                                         extraction to (default: whole page)

`fetch()`, `transform()`, `load()`, and `run()` all come for free, same as
every other scraper in this package -- `load()` (DB upsert/dedup by
source + external_id), dry-run support, and `ScraperResult` stats are
inherited unchanged from `BaseScraper`.

Two standalone helpers are also exposed for direct/ad-hoc use:

    - `fetch_page_content(url, ...)`           -- Playwright page fetch
    - `extract_events_with_deepseek(client, ...)` -- DeepSeek extraction

Politeness & resource notes (this is personal-scale scraping, not a
high-volume crawler -- be respectful of target sites' load):
    - A short delay is inserted between consecutive page navigations
      within a single run (see `PAGE_LOAD_DELAY_SECONDS`).
    - Exactly one Chromium browser instance is launched per `fetch()` call
      and listing URLs are processed strictly sequentially (never in
      parallel), since this runs on a memory-constrained box with a single
      Celery worker (concurrency=1). The browser is always closed via
      try/finally, even on error.
"""

from abc import abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin
import asyncio
import hashlib
import json
import logging

from playwright.async_api import (
    Browser,
    Page,
    TimeoutError as PlaywrightTimeoutError,
    async_playwright,
)
from openai import AsyncOpenAI

from app.config import settings
from app.models.event import EventCategory, EventCreate
from .base import BaseScraper

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Playwright fetch helper
# ---------------------------------------------------------------------------

DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000
DEFAULT_SCROLL_WAIT_MS = 1_000

# Politeness: minimum delay between consecutive page navigations within a
# single scraper run. This is a courtesy throttle for personal-scale
# scraping -- not meant to defeat rate limiting, just to avoid hammering
# target sites' servers.
PAGE_LOAD_DELAY_SECONDS = 1.5

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


async def _navigate_and_extract(
    page: Page,
    url: str,
    *,
    selector: Optional[str] = None,
    as_text: bool = True,
    scroll_count: int = 0,
    scroll_wait_ms: int = DEFAULT_SCROLL_WAIT_MS,
    timeout_ms: int = DEFAULT_NAVIGATION_TIMEOUT_MS,
) -> str:
    """
    Navigate an existing Playwright `Page` to `url` and extract its content.

    Args:
        page: An already-created Playwright Page (caller owns its lifecycle).
        url: URL to navigate to.
        selector: CSS selector to scope extraction to. None/omitted means
            "whole page" (falls back to the <body> element).
        as_text: If True, return visible text content (`innerText`). If
            False, return the HTML (`innerHTML`) of the matched element.
        scroll_count: Number of times to scroll to the bottom of the page
            (with a short wait after each scroll) before extracting, useful
            for infinite-scroll listing pages that lazy-load content.
        scroll_wait_ms: Wait time after each scroll, in milliseconds.
        timeout_ms: Navigation timeout, in milliseconds.

    Returns:
        Extracted text or HTML content as a string.
    """
    await page.goto(url, timeout=timeout_ms, wait_until="domcontentloaded")

    for _ in range(max(0, scroll_count)):
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(scroll_wait_ms)

    locator = page.locator(selector) if selector else None

    if locator is not None and await locator.count() > 0:
        target = locator.first
        return await target.inner_html() if not as_text else await target.inner_text()

    # No selector given, or selector matched nothing -- fall back to <body>.
    if as_text:
        return await page.inner_text("body")
    return await page.content()


async def fetch_page_content(
    url: str,
    *,
    selector: Optional[str] = None,
    as_text: bool = True,
    scroll_count: int = 0,
    scroll_wait_ms: int = DEFAULT_SCROLL_WAIT_MS,
    timeout_ms: int = DEFAULT_NAVIGATION_TIMEOUT_MS,
) -> str:
    """
    Standalone helper: render `url` in headless Chromium and return its
    content. Launches and tears down its own browser instance, so this is
    safe to call ad hoc (not just from within a scraper run).

    Always closes the browser, even if navigation/extraction raises.

    Args:
        url: Page to fetch.
        selector: CSS selector to scope extraction to (None = whole page).
        as_text: Return visible text (True) or HTML (False) of the target.
        scroll_count: Number of lazy-load scroll passes to perform first.
        scroll_wait_ms: Wait after each scroll, in milliseconds.
        timeout_ms: Navigation timeout, in milliseconds.

    Returns:
        Extracted text or HTML content as a string.
    """
    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(headless=True)
        try:
            context = await browser.new_context(user_agent=USER_AGENT)
            try:
                page = await context.new_page()
                page.set_default_navigation_timeout(timeout_ms)
                try:
                    return await _navigate_and_extract(
                        page,
                        url,
                        selector=selector,
                        as_text=as_text,
                        scroll_count=scroll_count,
                        scroll_wait_ms=scroll_wait_ms,
                        timeout_ms=timeout_ms,
                    )
                except PlaywrightTimeoutError as e:
                    logger.warning(f"Timed out loading {url}: {e}")
                    raise
            finally:
                await context.close()
        finally:
            await browser.close()


# ---------------------------------------------------------------------------
# DeepSeek extraction helper
# ---------------------------------------------------------------------------

DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_REQUEST_TIMEOUT_SECONDS = 60.0

# Truncate page content before sending to the LLM -- keeps token usage (and
# cost) bounded for very large/long listing pages. ~60k chars is comfortably
# within DeepSeek's context window with room for the system prompt + output.
MAX_EXTRACTION_INPUT_CHARS = 60_000

VALID_CATEGORIES = ", ".join(c.value for c in EventCategory)

EVENT_EXTRACTION_SYSTEM_PROMPT = f"""You are a data extraction engine. You will be given raw scraped \
content (visible text or HTML) from an event-listing web page. Extract every \
distinct event you can find and return them as JSON.

Respond with a single JSON object of the form:
{{"events": [ <event>, <event>, ... ]}}

Each <event> object must have exactly these fields:
- title: string, required. The event's name.
- description: string or null. A short description/summary if available.
- date_time: string or null. The event's start date/time as ISO8601
  (e.g. "2024-06-15T19:30:00"). Use null if no date can be determined --
  do not guess.
- end_time: string or null. ISO8601 end date/time, if stated.
- location_name: string or null. Venue or place name.
- location_address: string or null. Street address if available.
- latitude: number or null. Only if explicitly present in the content
  (e.g. embedded map data) -- otherwise null. Do not estimate.
- longitude: number or null. Same rule as latitude.
- category: string, required. Must be exactly one of: {VALID_CATEGORIES}.
  Pick whichever single category is the closest fit for the event.
- price_min: number. Lowest ticket/admission price in US dollars. Use 0 if
  the event is free or no price is stated.
- price_max: number or null. Highest ticket/admission price, if a range is
  given.
- external_id: string or null. A stable identifier for this specific event
  from the source page itself (e.g. a listing/event ID found in a URL, data
  attribute, or query string). Use null if nothing stable is available --
  do not invent one.
- external_url: string or null. The URL of the event's own detail page, if
  one is linked from this listing (may be a relative path).
- image_url: string or null. URL of an image representing the event, if one
  is present (may be a relative path).
- tags: array of strings. Short freeform keywords describing the event
  (e.g. genre, vibe, audience). Use an empty array if none apply.

Rules:
- Only extract real events that are actually present in the content. Do not
  invent or hallucinate events.
- If the content contains no events, return {{"events": []}}.
- Every event must include a usable "title" -- skip anything without one.
- Respond with JSON only, no commentary.
"""


def _build_deepseek_client() -> AsyncOpenAI:
    """Construct an AsyncOpenAI client pointed at DeepSeek's API."""
    return AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=DEEPSEEK_BASE_URL,
        timeout=DEEPSEEK_REQUEST_TIMEOUT_SECONDS,
    )


async def extract_events_with_deepseek(
    client: AsyncOpenAI,
    raw_content: str,
    *,
    source_url: Optional[str] = None,
    verbose: bool = False,
) -> List[Dict[str, Any]]:
    """
    Use DeepSeek's chat completions API to extract structured event data
    from raw scraped page content (text or HTML) for a single listing page.

    This is best-effort: extraction is over messy real-world pages, so
    individual malformed entries are skipped and logged rather than
    raising. Only outright API failures (network error, auth failure, etc.)
    are caught and logged, returning an empty list -- a single bad page
    should never crash the whole scraper run.

    Args:
        client: An AsyncOpenAI client configured for DeepSeek (see
            `_build_deepseek_client`).
        raw_content: Raw scraped text/HTML for one listing page (or a batch
            of individual event-card snippets concatenated together).
        source_url: The URL this content was scraped from, used only for
            logging context.
        verbose: Enable debug-level logging of skipped entries.

    Returns:
        List of raw extracted event dicts (schema described in
        `EVENT_EXTRACTION_SYSTEM_PROMPT`). May be empty. Never raises for
        malformed model output.
    """
    if not raw_content or not raw_content.strip():
        return []

    content = raw_content[:MAX_EXTRACTION_INPUT_CHARS]

    user_prompt = (
        f"Source URL: {source_url or 'unknown'}\n\n"
        "Extract events from the following page content:\n\n"
        f"{content}"
    )

    try:
        response = await client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": EVENT_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            # Listing pages (especially after scrolling) can yield many events;
            # without an explicit cap the default output limit can truncate the
            # JSON mid-response, which would otherwise silently drop every
            # event on the page (not just the overflow) when json.loads fails.
            max_tokens=8192,
        )
    except Exception as e:
        logger.error(f"DeepSeek extraction request failed for {source_url}: {e}")
        return []

    try:
        raw_json = response.choices[0].message.content
    except (IndexError, AttributeError) as e:
        logger.error(f"DeepSeek returned an unexpected response shape for {source_url}: {e}")
        return []

    try:
        parsed = json.loads(raw_json)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"DeepSeek returned non-JSON content for {source_url}: {e}")
        return []

    events_raw: Optional[List[Any]] = None
    if isinstance(parsed, dict):
        events_raw = parsed.get("events")
    elif isinstance(parsed, list):
        # Tolerate the model returning a bare array despite instructions.
        events_raw = parsed

    if not isinstance(events_raw, list):
        logger.warning(f"DeepSeek JSON response missing an 'events' array for {source_url}")
        return []

    valid_events: List[Dict[str, Any]] = []
    for i, item in enumerate(events_raw):
        if not isinstance(item, dict):
            if verbose:
                logger.debug(f"Skipping non-object extracted item {i} for {source_url}")
            continue

        title = item.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            if verbose:
                logger.debug(f"Skipping extracted item {i} with no title for {source_url}")
            continue

        valid_events.append(item)

    if verbose:
        logger.debug(
            f"DeepSeek extracted {len(valid_events)}/{len(events_raw)} usable events from {source_url}"
        )

    return valid_events


# ---------------------------------------------------------------------------
# Abstract scraper base
# ---------------------------------------------------------------------------


class PlaywrightDeepSeekScraper(BaseScraper):
    """
    Abstract base for scrapers that render listing pages with Playwright and
    extract structured events from them via DeepSeek's LLM.

    Subclass contract (what concrete scrapers must/should provide):

        - `source` (class attr): same as BaseScraper -- an EventSource enum
          value identifying this source for dedup/storage.
        - `get_listing_urls(self) -> list[str]` (required): the search/
          listing page URL(s) to scrape (e.g. a city+category search URL).
        - `get_listing_selector(self) -> Optional[str]` (optional override):
          a CSS selector scoping extraction to the listing container on the
          page. Defaults to None, meaning "whole page text".
        - `transform(self, raw_event) -> Optional[EventCreate]` (optional
          override): a default implementation is provided here that maps
          the DeepSeek-extracted dict (see `EVENT_EXTRACTION_SYSTEM_PROMPT`
          for its shape) into an `EventCreate`, matching the same shape
          `nyc_parks.py`/`ticketmaster.py` produce. Override if a source
          needs bespoke handling (e.g. better address parsing).

    Everything else -- `fetch()`, `load()`, `run()`, dry-run support,
    dedup-by-`external_id` -- is implemented here or inherited from
    `BaseScraper` and should not need to be touched by subclasses.

    Tunable class attributes (override as needed per source):
        - `scroll_count`: number of infinite-scroll passes per listing page
          before extraction (default 0 -- no scrolling).
        - `extract_as_html`: extract HTML instead of visible text from the
          listing container (default False -- text is cleaner for DeepSeek
          in most cases; flip to True for sources where structure matters).
        - `default_category`: fallback EventCategory used if DeepSeek's
          category value can't be coerced to a valid enum member.
    """

    scroll_count: int = 0
    extract_as_html: bool = False
    default_category: EventCategory = EventCategory.CULTURE

    def __init__(self, dry_run: bool = False, verbose: bool = False):
        super().__init__(dry_run=dry_run, verbose=verbose)
        self._deepseek_client: Optional[AsyncOpenAI] = None

    async def __aenter__(self) -> "PlaywrightDeepSeekScraper":
        await super().__aenter__()
        self._deepseek_client = _build_deepseek_client()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        self._deepseek_client = None
        await super().__aexit__(exc_type, exc_val, exc_tb)

    @abstractmethod
    def get_listing_urls(self) -> List[str]:
        """
        Return the search/listing page URL(s) to scrape for this source
        (e.g. a city+category search URL). Required override.
        """
        raise NotImplementedError

    def get_listing_selector(self) -> Optional[str]:
        """
        CSS selector scoping extraction to the listing container on the
        page. Override for sources where the whole page is too noisy.
        Default: None, meaning "whole page text".
        """
        return None

    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch raw event dicts for all of this source's listing URLs.

        For each URL from `get_listing_urls()`: render it with Playwright,
        run the DeepSeek extraction helper on the rendered content, and
        collect all extracted event dicts across all listing URLs.

        Exactly one Chromium browser instance is launched for this entire
        call, and listing URLs are processed strictly sequentially (never
        concurrently) -- this runs on a memory-constrained box with a
        single Celery worker, so we don't want multiple browser contexts
        open in parallel. A short politeness delay is inserted between
        consecutive page navigations.
        """
        if self._deepseek_client is None:
            raise RuntimeError(
                "Scraper must be used as an async context manager "
                "(DeepSeek client not initialized)"
            )
        if not settings.deepseek_api_key:
            # Raised here (rather than in __aenter__) so that, like the other
            # scrapers in this package (e.g. TicketmasterScraper), a missing
            # API key is captured as a clean failed ScraperResult by run()'s
            # try/except instead of raising out of the `async with` block.
            raise RuntimeError("DEEPSEEK_API_KEY not configured")

        urls = self.get_listing_urls()
        if not urls:
            return []

        all_raw_events: List[Dict[str, Any]] = []
        selector = self.get_listing_selector()

        async with async_playwright() as pw:
            browser: Browser = await pw.chromium.launch(headless=True)
            try:
                for i, url in enumerate(urls):
                    if i > 0:
                        # Politeness: don't hammer the target site back-to-back.
                        await asyncio.sleep(PAGE_LOAD_DELAY_SECONDS)

                    try:
                        content = await self._render_listing_page(browser, url, selector)
                    except Exception as e:
                        logger.warning(f"[{self.source.value}] Failed to render {url}: {e}")
                        continue

                    try:
                        events = await extract_events_with_deepseek(
                            self._deepseek_client,
                            content,
                            source_url=url,
                            verbose=self.verbose,
                        )
                    except Exception as e:
                        logger.warning(f"[{self.source.value}] DeepSeek extraction failed for {url}: {e}")
                        continue

                    for event in events:
                        event["_source_url"] = url

                    all_raw_events.extend(events)
            finally:
                await browser.close()

        logger.info(
            f"[{self.source.value}] Fetched {len(all_raw_events)} raw events "
            f"from {len(urls)} listing page(s)"
        )
        return all_raw_events

    async def _render_listing_page(self, browser: Browser, url: str, selector: Optional[str]) -> str:
        """Render a single listing page using a fresh context/page on the shared browser."""
        context = await browser.new_context(user_agent=USER_AGENT)
        try:
            page = await context.new_page()
            page.set_default_navigation_timeout(DEFAULT_NAVIGATION_TIMEOUT_MS)
            return await _navigate_and_extract(
                page,
                url,
                selector=selector,
                as_text=not self.extract_as_html,
                scroll_count=self.scroll_count,
            )
        finally:
            await context.close()

    # -- transform: default DeepSeek-dict -> EventCreate mapping -----------

    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """
        Map a DeepSeek-extracted event dict (see
        `EVENT_EXTRACTION_SYSTEM_PROMPT`) into an `EventCreate`.

        Provided as a sensible default so subclasses don't have to
        reimplement this from scratch; override for source-specific
        cleanup (e.g. better address/geocoding handling).
        """
        title = (raw_event.get("title") or "").strip()
        if not title:
            return None

        date_time = self._parse_iso_datetime(raw_event.get("date_time"))
        if date_time is None:
            if self.verbose:
                logger.debug(f"Skipping '{title}': no parseable date_time")
            return None

        end_time = self._parse_iso_datetime(raw_event.get("end_time"))
        if end_time is not None and end_time <= date_time:
            end_time = None  # Invalid (would fail EventCreate validation) -- drop it.

        source_url = raw_event.get("_source_url")

        external_url = self._resolve_url(raw_event.get("external_url"), source_url) or source_url
        image_url = self._resolve_url(raw_event.get("image_url"), source_url)

        external_id = raw_event.get("external_id")
        if not external_id or not isinstance(external_id, str):
            hash_input = f"{title}_{raw_event.get('date_time')}_{raw_event.get('location_name')}"
            external_id = hashlib.md5(hash_input.encode()).hexdigest()[:16]
        external_id = f"{self.source.value}_{external_id}"

        tags = raw_event.get("tags")
        if not isinstance(tags, list):
            tags = []
        tags = [str(t) for t in tags if t]

        metadata: Dict[str, Any] = {}
        if source_url:
            metadata["scraped_from"] = source_url

        try:
            return EventCreate(
                title=title,
                description=raw_event.get("description") or None,
                date_time=date_time,
                end_time=end_time,
                location_name=(raw_event.get("location_name") or "TBA").strip(),
                location_address=raw_event.get("location_address") or None,
                latitude=self._coerce_float(raw_event.get("latitude")),
                longitude=self._coerce_float(raw_event.get("longitude")),
                neighborhood=raw_event.get("neighborhood") or None,
                category=self._coerce_category(raw_event.get("category")),
                price_min=self._coerce_int(raw_event.get("price_min"), default=0) or 0,
                price_max=self._coerce_int(raw_event.get("price_max"), default=None),
                source=self.source,
                external_id=external_id,
                external_url=external_url or None,
                image_url=image_url or None,
                tags=tags,
                metadata=metadata,
            )
        except Exception as e:
            logger.warning(f"Failed to build EventCreate for '{title}': {e}")
            return None

    # -- small coercion helpers ---------------------------------------------

    @staticmethod
    def _parse_iso_datetime(value: Any) -> Optional[datetime]:
        if not value or not isinstance(value, str):
            return None
        try:
            # Normalize trailing "Z" (Zulu/UTC) to an offset fromisoformat accepts.
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    @staticmethod
    def _coerce_float(value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _coerce_int(value: Any, default: Optional[int]) -> Optional[int]:
        if value is None:
            return default
        try:
            return int(round(float(value)))
        except (TypeError, ValueError):
            return default

    def _coerce_category(self, value: Any) -> EventCategory:
        if isinstance(value, str):
            normalized = value.strip().lower()
            for category in EventCategory:
                if category.value == normalized:
                    return category
        return self.default_category

    @staticmethod
    def _resolve_url(value: Any, base: Optional[str]) -> Optional[str]:
        """
        Resolve a possibly-relative URL against `base`, and return None if
        the result isn't a plausible http(s) URL. LLM-extracted URL fields
        are unreliable (e.g. "image of concert poster", a bare data URI, a
        string with stray whitespace) -- since these fields are optional on
        EventCreate, a bad value should become None rather than failing
        Pydantic's HttpUrl validation and discarding an otherwise-good event.
        """
        if not value or not isinstance(value, str):
            return None

        value = value.strip()
        if not value or " " in value:
            return None

        resolved = urljoin(base, value) if base else value

        if not resolved.lower().startswith(("http://", "https://")):
            return None

        return resolved
