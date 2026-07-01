"""
OpenTable scraper (Playwright + DeepSeek).

OpenTable surfaces restaurant reservation availability rather than classic
ticketed events -- there's no fixed "the show starts at 8pm" date_time for a
restaurant the way there is for a concert. We model "you could book a dinner
reservation right now" as a discoverable FOOD event in the swipe feed: one
synthetic event per (restaurant, specific bookable time slot) found on the
page.

Why this scraper overrides `fetch()` (most `PlaywrightDeepSeekScraper`
subclasses don't need to, see eventbrite.py/meetup.py/bandsintown.py for the
minimal-override norm): the base class's `transform()` contract is strictly
one-raw-dict -> one-EventCreate (see `BaseScraper.run()`, which calls
`transform()` once per item returned by `fetch()`). A single OpenTable
restaurant card can have *several* bookable time slots, so the "one
restaurant -> many events" fan-out has to happen before `transform()` ever
sees the data, i.e. in `fetch()`. We extract restaurant-level dicts (with an
`available_times` list) using a bespoke DeepSeek prompt -- the shared
`extract_events_with_deepseek` helper's prompt is fixed to the generic
single-event schema and has no field for "this one listing has N bookable
times" -- then expand each restaurant into zero or more already
event-shaped dicts that the inherited default `transform()` can consume
completely unmodified (no `transform()` override needed at all).

Known limitation (intentional, not a bug): OpenTable's availability widget
is interactive -- real bookable times are normally only revealed after
picking a date/time/party size, which is explicitly out of scope for this
best-effort scraper (no clicking/picker automation here, per the project's
"keep this simple" guidance). We only extract time-slot chips that happen
to already be visible on a plain page load. Restaurants with no visible
specific times are skipped entirely rather than inventing a placeholder
time -- showing a fabricated "7:00 PM" that may not actually be bookable
would be worse than just not surfacing that restaurant today (a user
swiping "Going" on a reservation that doesn't really exist is a bad
experience). This means yield from this scraper can reasonably be zero on
a given run; that's an accepted tradeoff of staying simple here rather than
driving OpenTable's search widget. (During development, both a plain `curl`
and a fetch-based tool both timed out against OpenTable's listing page --
consistent with it being behind bot-detection/a heavy JS challenge -- so
real-world yield should be verified once this runs against a real headless
Chromium in its actual environment.)
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo
import asyncio
import json
import logging

from playwright.async_api import Browser, async_playwright

from app.config import settings
from app.models.event import EventCategory, EventSource
from .playwright_base import (
    MAX_EXTRACTION_INPUT_CHARS,
    PAGE_LOAD_DELAY_SECONDS,
    PlaywrightDeepSeekScraper,
)

logger = logging.getLogger(__name__)

NYC_TZ = ZoneInfo("America/New_York")

# OpenTable's public NYC search-results listing page. Kept to a single URL
# -- this is personal-scale scraping, not an attempt to crawl every
# neighborhood/cuisine filter combination.
NYC_LISTING_URLS = [
    "https://www.opentable.com/new-york-restaurant-listings",
]

DEEPSEEK_MODEL = "deepseek-chat"

# Cap fan-out per restaurant so a single mis-extracted card (e.g. DeepSeek
# echoing back an unexpectedly long list of times) can't blow up event
# volume for one restaurant.
MAX_TIME_SLOTS_PER_RESTAURANT = 6

OPENTABLE_EXTRACTION_SYSTEM_PROMPT = """You are a data extraction engine. You will be given raw scraped visible-text \
content from an OpenTable restaurant search-results listing page. Extract every \
distinct restaurant card you can find and return them as JSON.

Respond with a single JSON object of the form:
{"restaurants": [ <restaurant>, <restaurant>, ... ]}

Each <restaurant> object must have exactly these fields:
- name: string, required. The restaurant's name.
- description: string or null. Cuisine type / neighborhood / short blurb if shown.
- location_address: string or null. Street address or neighborhood text, if shown.
- price_min: number. Lowest price implied by any price-range badge (e.g. "$30 and \
  under" -> 0; "$31 to $50" -> 31; "$50 and over" -> 51). Use 0 if no price badge \
  is shown.
- price_max: number or null. Highest price implied by the badge (e.g. "$30 and \
  under" -> 30; "$31 to $50" -> 50; "$50 and over" -> null). Use null if no price \
  badge is shown or it has no upper bound.
- cuisines: array of strings. Cuisine/category tags shown for the restaurant \
  (e.g. "Italian", "Steakhouse"). Empty array if none.
- rating: number or null. Star rating out of 5, if shown.
- review_count: number or null. Number of reviews, if shown.
- available_times: array of strings. Every distinct bookable reservation time \
  shown as a clickable time chip/button for this restaurant (e.g. ["6:00 PM", \
  "6:30 PM", "8:45 PM"]), using the exact displayed time text. Use an empty array \
  if no specific times are shown for this restaurant (e.g. only a "Booked N times \
  today" badge with no times) -- do not guess or invent times.
- external_id: string or null. A stable identifier for this restaurant from the \
  page itself (e.g. a slug or ID found in its URL). Use null if nothing stable is \
  available.
- external_url: string or null. The URL of the restaurant's own OpenTable page, \
  if linked from this listing (may be a relative path).
- image_url: string or null. URL of an image representing the restaurant, if \
  present (may be a relative path).

Rules:
- Only extract real restaurants actually present in the content. Do not invent or \
  hallucinate restaurants or times.
- If the content contains no restaurants, return {"restaurants": []}.
- Every restaurant must include a usable "name" -- skip anything without one.
- Respond with JSON only, no commentary.
"""


class OpenTableScraper(PlaywrightDeepSeekScraper):
    """
    Scraper for OpenTable restaurant reservation availability in NYC.

    Models each (restaurant, visible bookable time slot) pair as one FOOD
    "event". See the module docstring for why `fetch()` is overridden to
    perform the one-restaurant-to-many-time-slots fan-out, and for the
    documented tradeoff of skipping restaurants with no visible specific
    times rather than inventing placeholder ones.
    """

    source = EventSource.OPENTABLE
    base_url = "https://www.opentable.com"
    default_category = EventCategory.FOOD

    # OpenTable's listing page lazy-loads additional restaurant cards as you
    # scroll. A couple of passes is plenty for personal-scale use.
    scroll_count = 2

    def get_listing_urls(self) -> List[str]:
        return NYC_LISTING_URLS

    def get_listing_selector(self) -> Optional[str]:
        # OpenTable's listing-card container class names are
        # generated/unstable, so (as with the other Playwright+DeepSeek
        # scrapers) we don't scope to a CSS selector here and rely on
        # whole-page text extraction instead.
        return None

    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Render OpenTable's NYC listing page(s), extract restaurant-level
        data (including any visible time-slot chips) via a bespoke DeepSeek
        prompt, then fan each restaurant out into zero or more
        already-event-shaped raw dicts -- one per visible bookable time
        slot -- that the inherited default `transform()` consumes
        unmodified.

        Overrides the base `fetch()` (rather than `transform()`) because
        the fan-out is fundamentally 1-to-many, which doesn't fit
        `transform()`'s 1-to-1 contract (see module docstring). Mirrors the
        base implementation's politeness/resource behavior: one browser
        instance for the whole call, listing URLs processed sequentially,
        a politeness delay between navigations.
        """
        if self._deepseek_client is None:
            raise RuntimeError(
                "Scraper must be used as an async context manager "
                "(DeepSeek client not initialized)"
            )
        if not settings.deepseek_api_key:
            raise RuntimeError("DEEPSEEK_API_KEY not configured")

        urls = self.get_listing_urls()
        if not urls:
            return []

        all_raw_restaurants: List[Dict[str, Any]] = []
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
                        restaurants = await self._extract_restaurants_with_deepseek(content, url)
                    except Exception as e:
                        logger.warning(f"[{self.source.value}] DeepSeek extraction failed for {url}: {e}")
                        continue

                    for restaurant in restaurants:
                        restaurant["_source_url"] = url

                    all_raw_restaurants.extend(restaurants)
            finally:
                await browser.close()

        logger.info(
            f"[{self.source.value}] Extracted {len(all_raw_restaurants)} restaurant(s) "
            f"from {len(urls)} listing page(s)"
        )

        raw_events = self._expand_time_slots(all_raw_restaurants)
        logger.info(
            f"[{self.source.value}] Fanned out to {len(raw_events)} reservation-slot event(s)"
        )
        return raw_events

    async def _extract_restaurants_with_deepseek(
        self, raw_content: str, source_url: str
    ) -> List[Dict[str, Any]]:
        """
        Bespoke DeepSeek extraction for OpenTable's restaurant-card schema
        (notably the `available_times` list field this source's fan-out
        needs) -- see `OPENTABLE_EXTRACTION_SYSTEM_PROMPT`.

        Structurally mirrors `extract_events_with_deepseek` in
        `playwright_base.py` (same input truncation, same "log and return
        empty list" behavior on failure -- a single bad page should never
        crash the whole scraper run) but can't reuse it directly since that
        helper's system prompt is fixed to the generic single-event schema
        shared by every other source.
        """
        if not raw_content or not raw_content.strip():
            return []

        content = raw_content[:MAX_EXTRACTION_INPUT_CHARS]

        user_prompt = (
            f"Source URL: {source_url}\n\n"
            "Extract restaurants from the following OpenTable listing page content:\n\n"
            f"{content}"
        )

        try:
            response = await self._deepseek_client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": OPENTABLE_EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
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

        restaurants_raw: Optional[List[Any]] = None
        if isinstance(parsed, dict):
            restaurants_raw = parsed.get("restaurants")
        elif isinstance(parsed, list):
            # Tolerate the model returning a bare array despite instructions.
            restaurants_raw = parsed

        if not isinstance(restaurants_raw, list):
            logger.warning(f"DeepSeek JSON response missing a 'restaurants' array for {source_url}")
            return []

        valid: List[Dict[str, Any]] = []
        for item in restaurants_raw:
            if not isinstance(item, dict):
                continue
            name = item.get("name")
            if not name or not isinstance(name, str) or not name.strip():
                continue
            valid.append(item)

        return valid

    def _expand_time_slots(self, restaurants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Fan each extracted restaurant dict out into zero or more
        already-event-shaped raw dicts -- the same dict shape the base
        class's default `transform()` expects (see
        `EVENT_EXTRACTION_SYSTEM_PROMPT` in `playwright_base.py`) -- one per
        visible bookable time slot.

        Restaurants with no parseable `available_times` are skipped
        entirely (see module docstring for why we don't invent a
        placeholder time instead).
        """
        now_ny = datetime.now(NYC_TZ)
        raw_events: List[Dict[str, Any]] = []

        for restaurant in restaurants:
            name = (restaurant.get("name") or "").strip()
            if not name:
                continue

            times = restaurant.get("available_times")
            if not isinstance(times, list) or not times:
                if self.verbose:
                    logger.debug(f"Skipping '{name}': no visible reservation time slots")
                continue

            source_url = restaurant.get("_source_url")
            location_address = restaurant.get("location_address") or None
            description = restaurant.get("description") or None
            cuisines = restaurant.get("cuisines")
            tags = [str(c) for c in cuisines if c] if isinstance(cuisines, list) else []

            # Fold rating into tags as a freeform swipe-signal keyword
            # (EventCreate has no dedicated rating field) -- cheap to keep
            # since we already pay the DeepSeek extraction cost for it.
            rating = restaurant.get("rating")
            if isinstance(rating, (int, float)):
                tags.append(f"{rating:g}★")

            base_external_id = restaurant.get("external_id")
            if not base_external_id or not isinstance(base_external_id, str) or not base_external_id.strip():
                base_external_id = name.lower().replace(" ", "_")

            external_url = restaurant.get("external_url")
            image_url = restaurant.get("image_url")
            price_min = restaurant.get("price_min")
            price_max = restaurant.get("price_max")

            seen_slots: set = set()
            slot_count = 0
            for raw_time in times:
                if slot_count >= MAX_TIME_SLOTS_PER_RESTAURANT:
                    break
                if not isinstance(raw_time, str):
                    continue

                slot_dt = self._parse_time_slot(raw_time, now_ny)
                if slot_dt is None:
                    continue

                # De-dupe identical slots (e.g. DeepSeek echoing the same
                # chip text twice for one restaurant).
                if slot_dt in seen_slots:
                    continue
                seen_slots.add(slot_dt)
                slot_count += 1

                # Strip tzinfo before formatting -- the rest of this
                # codebase stores naive datetimes (see ticketmaster.py /
                # `_parse_iso_datetime` in playwright_base.py), so we keep
                # the NYC wall-clock numbers but drop the offset.
                naive_iso = slot_dt.replace(tzinfo=None).isoformat()

                raw_events.append({
                    "title": f"Dinner at {name}",
                    "description": description,
                    "date_time": naive_iso,
                    "end_time": None,
                    "location_name": name,
                    "location_address": location_address,
                    "category": "food",
                    "price_min": price_min,
                    "price_max": price_max,
                    "external_id": f"{base_external_id}_{slot_dt.strftime('%Y%m%d_%H%M')}",
                    "external_url": external_url,
                    "image_url": image_url,
                    "tags": tags,
                    "_source_url": source_url,
                })

        return raw_events

    @staticmethod
    def _parse_time_slot(time_str: str, reference_now: datetime) -> Optional[datetime]:
        """
        Parse a displayed clock-time string (e.g. "6:00 PM", "6:30pm") into
        a concrete NYC-local datetime.

        OpenTable's chips are bare clock times with no date attached --
        since the listing page reflects "today" availability, we anchor to
        today's date in `reference_now`'s timezone, rolling forward to
        tomorrow if that time has already passed (a listing page scraped
        at 9pm showing a "6:00 PM" chip almost certainly means tomorrow's
        6:00 PM, not a slot already in the past).
        """
        cleaned = time_str.strip().upper().replace(" ", "")
        parsed_time = None
        for fmt in ("%I:%M%p", "%I%p"):
            try:
                parsed_time = datetime.strptime(cleaned, fmt)
                break
            except ValueError:
                continue
        if parsed_time is None:
            return None

        candidate = reference_now.replace(
            hour=parsed_time.hour, minute=parsed_time.minute, second=0, microsecond=0
        )
        if candidate <= reference_now:
            candidate += timedelta(days=1)
        return candidate
