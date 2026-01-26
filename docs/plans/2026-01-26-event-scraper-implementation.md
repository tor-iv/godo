# Event Scraper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build automated scrapers to populate Godo's event database from NYC Parks and NYC Open Data APIs.

**Architecture:** Base scraper class with fetch/transform/load pattern. Each source implements the base class. CLI for manual runs, Celery for scheduled runs. Upsert by `source` + `external_id`.

**Tech Stack:** Python, httpx (async HTTP), Celery, Supabase (via db_manager)

---

## Task 1: Add NYC_OPEN_DATA to EventSource enum

**Files:**
- Modify: `backend/app/models/event.py:16-26`

**Step 1: Add enum value**

Add `NYC_OPEN_DATA = "nyc_open_data"` to the EventSource enum:

```python
class EventSource(str, Enum):
    EVENTBRITE = "eventbrite"
    RESY = "resy"
    OPENTABLE = "opentable"
    PARTIFUL = "partiful"
    NYC_PARKS = "nyc_parks"
    NYC_OPEN_DATA = "nyc_open_data"  # Add this line
    NYC_CULTURAL = "nyc_cultural"
    MEETUP = "meetup"
    FACEBOOK_EVENTS = "facebook_events"
    USER_GENERATED = "user_generated"
    MANUAL = "manual"
```

**Step 2: Commit**

```bash
git add backend/app/models/event.py
git commit -m "feat: add NYC_OPEN_DATA to EventSource enum"
```

---

## Task 2: Create base scraper class

**Files:**
- Create: `backend/scripts/scrapers/__init__.py`
- Create: `backend/scripts/scrapers/base.py`

**Step 1: Create directory and __init__.py**

```bash
mkdir -p backend/scripts/scrapers
touch backend/scripts/scrapers/__init__.py
```

**Step 2: Write base scraper**

Create `backend/scripts/scrapers/base.py`:

```python
"""Base scraper class for event data sources."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Any, Dict
import logging
import httpx

from app.models.event import EventCreate, EventSource, EventCategory
from app.database import db_manager

logger = logging.getLogger(__name__)


@dataclass
class ScraperResult:
    """Result of a scraper run."""
    source: str
    events_found: int
    events_new: int
    events_updated: int
    events_failed: int
    started_at: datetime
    completed_at: datetime
    error_message: Optional[str] = None

    @property
    def duration_seconds(self) -> float:
        return (self.completed_at - self.started_at).total_seconds()

    def __str__(self) -> str:
        status = "SUCCESS" if not self.error_message else "FAILED"
        return (
            f"[{self.source}] {status} - "
            f"Found: {self.events_found}, New: {self.events_new}, "
            f"Updated: {self.events_updated}, Failed: {self.events_failed} "
            f"({self.duration_seconds:.1f}s)"
        )


class BaseScraper(ABC):
    """Abstract base class for event scrapers."""

    source: EventSource
    base_url: str

    def __init__(self, dry_run: bool = False, verbose: bool = False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.client = httpx.AsyncClient(timeout=30.0)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    @abstractmethod
    async def fetch(self) -> List[Dict[str, Any]]:
        """Fetch raw event data from the source API."""
        pass

    @abstractmethod
    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """Transform raw API data into EventCreate model."""
        pass

    async def load(self, events: List[EventCreate]) -> Dict[str, int]:
        """Upsert events to database. Returns counts."""
        if self.dry_run:
            logger.info(f"[DRY RUN] Would upsert {len(events)} events")
            return {"new": 0, "updated": 0, "failed": 0}

        new_count = 0
        updated_count = 0
        failed_count = 0

        supabase = db_manager.supabase_admin
        if not supabase:
            raise RuntimeError("Supabase client not available")

        for event in events:
            try:
                # Check if event exists
                existing = supabase.table("events").select("id").eq(
                    "source", self.source.value
                ).eq(
                    "external_id", event.external_id
                ).execute()

                event_data = {
                    "title": event.title,
                    "description": event.description,
                    "date_time": event.date_time.isoformat(),
                    "end_time": event.end_time.isoformat() if event.end_time else None,
                    "location_name": event.location_name,
                    "location_address": event.location_address,
                    "latitude": event.latitude,
                    "longitude": event.longitude,
                    "neighborhood": event.neighborhood,
                    "category": event.category.value,
                    "price_min": event.price_min,
                    "price_max": event.price_max,
                    "source": self.source.value,
                    "external_id": event.external_id,
                    "external_url": str(event.external_url) if event.external_url else None,
                    "image_url": str(event.image_url) if event.image_url else None,
                    "metadata": event.metadata or {},
                    "tags": event.tags or [],
                    "is_active": True,
                    "updated_at": datetime.utcnow().isoformat(),
                }

                if existing.data:
                    # Update existing event
                    supabase.table("events").update(event_data).eq(
                        "id", existing.data[0]["id"]
                    ).execute()
                    updated_count += 1
                    if self.verbose:
                        logger.info(f"Updated: {event.title}")
                else:
                    # Insert new event
                    event_data["created_at"] = datetime.utcnow().isoformat()
                    supabase.table("events").insert(event_data).execute()
                    new_count += 1
                    if self.verbose:
                        logger.info(f"New: {event.title}")

            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to upsert event '{event.title}': {e}")

        return {"new": new_count, "updated": updated_count, "failed": failed_count}

    async def run(self) -> ScraperResult:
        """Execute the full scrape pipeline: fetch -> transform -> load."""
        started_at = datetime.utcnow()
        error_message = None
        events_found = 0
        events_new = 0
        events_updated = 0
        events_failed = 0

        try:
            logger.info(f"[{self.source.value}] Starting scrape...")

            # Fetch raw data
            raw_events = await self.fetch()
            events_found = len(raw_events)
            logger.info(f"[{self.source.value}] Fetched {events_found} events from API")

            # Transform to EventCreate models
            events: List[EventCreate] = []
            for raw in raw_events:
                try:
                    event = self.transform(raw)
                    if event:
                        events.append(event)
                except Exception as e:
                    events_failed += 1
                    logger.warning(f"Failed to transform event: {e}")

            # Load to database
            counts = await self.load(events)
            events_new = counts["new"]
            events_updated = counts["updated"]
            events_failed += counts["failed"]

        except Exception as e:
            error_message = str(e)
            logger.error(f"[{self.source.value}] Scrape failed: {e}")

        completed_at = datetime.utcnow()

        result = ScraperResult(
            source=self.source.value,
            events_found=events_found,
            events_new=events_new,
            events_updated=events_updated,
            events_failed=events_failed,
            started_at=started_at,
            completed_at=completed_at,
            error_message=error_message,
        )

        logger.info(str(result))
        return result
```

**Step 3: Commit**

```bash
git add backend/scripts/scrapers/
git commit -m "feat: add base scraper class with fetch/transform/load pattern"
```

---

## Task 3: Create NYC Parks scraper

**Files:**
- Create: `backend/scripts/scrapers/nyc_parks.py`

**Step 1: Write NYC Parks scraper**

Create `backend/scripts/scrapers/nyc_parks.py`:

```python
"""NYC Parks event scraper."""

from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict
import logging

from app.models.event import EventCreate, EventSource, EventCategory
from .base import BaseScraper

logger = logging.getLogger(__name__)

# Category mapping from NYC Parks categories to Godo categories
NYC_PARKS_CATEGORY_MAP = {
    "sports": EventCategory.FITNESS,
    "fitness": EventCategory.FITNESS,
    "nature": EventCategory.OUTDOOR,
    "education": EventCategory.CULTURE,
    "arts": EventCategory.CULTURE,
    "culture": EventCategory.CULTURE,
    "music": EventCategory.NIGHTLIFE,
    "volunteer": EventCategory.NETWORKING,
    "tours": EventCategory.OUTDOOR,
    "kids": EventCategory.CULTURE,
    "seniors": EventCategory.CULTURE,
}


class NYCParksScraper(BaseScraper):
    """Scraper for NYC Parks events."""

    source = EventSource.NYC_PARKS
    base_url = "https://www.nycgovparks.org"

    # NYC Parks BigApps JSON feed
    events_url = "https://www.nycgovparks.org/bigapps/events.json"

    async def fetch(self) -> List[Dict[str, Any]]:
        """Fetch events from NYC Parks BigApps JSON feed."""
        response = await self.client.get(self.events_url)
        response.raise_for_status()
        data = response.json()

        # Filter to events in next 30 days
        now = datetime.utcnow()
        cutoff = now + timedelta(days=30)

        events = []
        for event in data.get("events", data if isinstance(data, list) else []):
            try:
                # Parse start date
                start_date_str = event.get("startdate") or event.get("start_date")
                if not start_date_str:
                    continue

                start_date = self._parse_date(start_date_str)
                if start_date and now <= start_date <= cutoff:
                    events.append(event)
            except Exception as e:
                logger.warning(f"Error filtering event: {e}")
                continue

        return events

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse various date formats from NYC Parks."""
        formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%m/%d/%Y",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str.split(".")[0], fmt)
            except ValueError:
                continue
        return None

    def _parse_time(self, time_str: str) -> tuple[int, int]:
        """Parse time string to (hour, minute)."""
        if not time_str:
            return (12, 0)  # Default to noon

        time_str = time_str.strip().upper()

        # Handle formats like "10:00 AM", "2:30 PM", "10:00", "14:00"
        try:
            if "AM" in time_str or "PM" in time_str:
                is_pm = "PM" in time_str
                time_str = time_str.replace("AM", "").replace("PM", "").strip()
                parts = time_str.split(":")
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
                if is_pm and hour != 12:
                    hour += 12
                elif not is_pm and hour == 12:
                    hour = 0
                return (hour, minute)
            else:
                parts = time_str.split(":")
                return (int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)
        except (ValueError, IndexError):
            return (12, 0)

    def _map_category(self, raw_category: str) -> EventCategory:
        """Map NYC Parks category to Godo category."""
        if not raw_category:
            return EventCategory.OUTDOOR  # Default for parks events

        raw_lower = raw_category.lower()
        for key, category in NYC_PARKS_CATEGORY_MAP.items():
            if key in raw_lower:
                return category
        return EventCategory.OUTDOOR

    def _extract_coordinates(self, event: Dict[str, Any]) -> tuple[Optional[float], Optional[float]]:
        """Extract latitude and longitude from event."""
        lat = event.get("latitude") or event.get("lat")
        lng = event.get("longitude") or event.get("lng") or event.get("lon")

        if lat and lng:
            try:
                return (float(lat), float(lng))
            except (ValueError, TypeError):
                pass
        return (None, None)

    def _extract_borough(self, event: Dict[str, Any]) -> Optional[str]:
        """Extract neighborhood/borough from event."""
        borough = event.get("borough") or event.get("location_borough")
        if borough:
            return borough.title()

        # Try to extract from park name or location
        location = event.get("parknames") or event.get("location") or ""
        if "Manhattan" in location:
            return "Manhattan"
        elif "Brooklyn" in location:
            return "Brooklyn"
        elif "Queens" in location:
            return "Queens"
        elif "Bronx" in location:
            return "Bronx"
        elif "Staten Island" in location:
            return "Staten Island"

        return None

    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """Transform NYC Parks event to EventCreate."""
        title = raw_event.get("title") or raw_event.get("name")
        if not title:
            return None

        # Parse dates and times
        start_date_str = raw_event.get("startdate") or raw_event.get("start_date")
        start_date = self._parse_date(start_date_str)
        if not start_date:
            return None

        start_time_str = raw_event.get("starttime") or raw_event.get("start_time") or ""
        hour, minute = self._parse_time(start_time_str)
        date_time = start_date.replace(hour=hour, minute=minute)

        # End time
        end_time = None
        end_date_str = raw_event.get("enddate") or raw_event.get("end_date")
        end_time_str = raw_event.get("endtime") or raw_event.get("end_time")
        if end_date_str:
            end_date = self._parse_date(end_date_str)
            if end_date:
                end_hour, end_minute = self._parse_time(end_time_str) if end_time_str else (hour + 2, minute)
                end_time = end_date.replace(hour=end_hour, minute=end_minute)

        # Location
        location_name = raw_event.get("parknames") or raw_event.get("park_name") or raw_event.get("location") or "NYC Park"
        location_address = raw_event.get("location") or raw_event.get("address")
        lat, lng = self._extract_coordinates(raw_event)
        neighborhood = self._extract_borough(raw_event)

        # Filter to Manhattan and Brooklyn only
        if neighborhood and neighborhood not in ["Manhattan", "Brooklyn"]:
            return None

        # Category
        raw_category = raw_event.get("category") or raw_event.get("categories") or ""
        if isinstance(raw_category, list):
            raw_category = raw_category[0] if raw_category else ""
        category = self._map_category(raw_category)

        # External URL and ID
        event_id = raw_event.get("id") or raw_event.get("event_id")
        external_id = f"nyc_parks_{event_id}" if event_id else f"nyc_parks_{hash(title + str(date_time))}"

        external_url = raw_event.get("url") or raw_event.get("link")
        if external_url and not external_url.startswith("http"):
            external_url = f"{self.base_url}{external_url}"

        # Image URL
        image_url = raw_event.get("image") or raw_event.get("image_url")
        if image_url and not image_url.startswith("http"):
            image_url = f"{self.base_url}{image_url}"

        return EventCreate(
            title=title,
            description=raw_event.get("description") or raw_event.get("desc"),
            date_time=date_time,
            end_time=end_time,
            location_name=location_name,
            location_address=location_address,
            latitude=lat,
            longitude=lng,
            neighborhood=neighborhood,
            category=category,
            price_min=0,  # NYC Parks events are free
            price_max=0,
            source=self.source,
            external_id=external_id,
            external_url=external_url,
            image_url=image_url,
            metadata={
                "raw_category": raw_category,
                "borough": neighborhood,
            },
            tags=["free", "outdoor", "parks"],
        )
```

**Step 2: Commit**

```bash
git add backend/scripts/scrapers/nyc_parks.py
git commit -m "feat: add NYC Parks scraper"
```

---

## Task 4: Create NYC Open Data scraper

**Files:**
- Create: `backend/scripts/scrapers/nyc_open_data.py`

**Step 1: Write NYC Open Data scraper**

Create `backend/scripts/scrapers/nyc_open_data.py`:

```python
"""NYC Open Data permitted events scraper."""

from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict
import logging

from app.models.event import EventCreate, EventSource, EventCategory
from app.config import settings
from .base import BaseScraper

logger = logging.getLogger(__name__)

# Category mapping based on event type
NYC_OPEN_DATA_CATEGORY_MAP = {
    "street fair": EventCategory.CULTURE,
    "festival": EventCategory.CULTURE,
    "parade": EventCategory.CULTURE,
    "block party": EventCategory.NETWORKING,
    "farmers market": EventCategory.FOOD,
    "market": EventCategory.FOOD,
    "marathon": EventCategory.FITNESS,
    "race": EventCategory.FITNESS,
    "run": EventCategory.FITNESS,
    "walk": EventCategory.FITNESS,
    "concert": EventCategory.NIGHTLIFE,
    "music": EventCategory.NIGHTLIFE,
    "rally": EventCategory.PROFESSIONAL,
    "protest": EventCategory.PROFESSIONAL,
}


class NYCOpenDataScraper(BaseScraper):
    """Scraper for NYC Open Data permitted events."""

    source = EventSource.NYC_OPEN_DATA
    base_url = "https://data.cityofnewyork.us"

    # NYC Permitted Event Information dataset
    dataset_id = "tvpp-9vvx"

    @property
    def api_url(self) -> str:
        return f"{self.base_url}/resource/{self.dataset_id}.json"

    async def fetch(self) -> List[Dict[str, Any]]:
        """Fetch permitted events from NYC Open Data SODA API."""
        now = datetime.utcnow()
        cutoff = now + timedelta(days=30)

        # SODA query for events in the next 30 days
        params = {
            "$where": f"start_date_time >= '{now.strftime('%Y-%m-%dT%H:%M:%S')}'",
            "$limit": 500,
            "$order": "start_date_time ASC",
        }

        # Add API token if available
        if settings.nyc_open_data_api_key:
            params["$$app_token"] = settings.nyc_open_data_api_key

        response = await self.client.get(self.api_url, params=params)
        response.raise_for_status()
        events = response.json()

        # Filter to next 30 days and Manhattan/Brooklyn
        filtered = []
        for event in events:
            try:
                start_str = event.get("start_date_time")
                if not start_str:
                    continue

                start_date = datetime.fromisoformat(start_str.replace("Z", "+00:00").split("+")[0])
                if start_date > cutoff:
                    continue

                # Filter to Manhattan and Brooklyn
                borough = (event.get("event_borough") or "").lower()
                if borough and borough not in ["manhattan", "brooklyn"]:
                    continue

                filtered.append(event)
            except Exception as e:
                logger.warning(f"Error filtering event: {e}")
                continue

        return filtered

    def _map_category(self, event: Dict[str, Any]) -> EventCategory:
        """Map event type to Godo category."""
        event_type = (event.get("event_type") or "").lower()
        event_name = (event.get("event_name") or "").lower()

        combined = f"{event_type} {event_name}"

        for key, category in NYC_OPEN_DATA_CATEGORY_MAP.items():
            if key in combined:
                return category

        return EventCategory.CULTURE  # Default for public events

    def _parse_datetime(self, dt_str: str) -> Optional[datetime]:
        """Parse datetime string from NYC Open Data."""
        if not dt_str:
            return None

        try:
            # Handle ISO format with timezone
            dt_str = dt_str.replace("Z", "+00:00").split("+")[0]
            return datetime.fromisoformat(dt_str)
        except ValueError:
            pass

        # Try other formats
        formats = ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"]
        for fmt in formats:
            try:
                return datetime.strptime(dt_str, fmt)
            except ValueError:
                continue

        return None

    def _build_location_name(self, event: Dict[str, Any]) -> str:
        """Build location name from event data."""
        parts = []

        street_name = event.get("event_street_side") or event.get("event_location")
        if street_name:
            parts.append(street_name)

        # Add cross streets if available
        from_street = event.get("event_from_street")
        to_street = event.get("event_to_street")
        if from_street and to_street:
            parts.append(f"({from_street} to {to_street})")
        elif from_street:
            parts.append(f"(at {from_street})")

        return " ".join(parts) if parts else "NYC Street Event"

    def _build_address(self, event: Dict[str, Any]) -> Optional[str]:
        """Build full address from event data."""
        parts = []

        location = event.get("event_location") or event.get("event_street_side")
        if location:
            parts.append(location)

        borough = event.get("event_borough")
        if borough:
            parts.append(borough)
            parts.append("NY")

        return ", ".join(parts) if parts else None

    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """Transform NYC Open Data event to EventCreate."""
        event_name = raw_event.get("event_name")
        if not event_name:
            return None

        # Parse dates
        start_str = raw_event.get("start_date_time")
        date_time = self._parse_datetime(start_str)
        if not date_time:
            return None

        end_str = raw_event.get("end_date_time")
        end_time = self._parse_datetime(end_str)

        # Location
        location_name = self._build_location_name(raw_event)
        location_address = self._build_address(raw_event)

        # Borough/neighborhood
        borough = raw_event.get("event_borough")
        neighborhood = borough.title() if borough else None

        # Category
        category = self._map_category(raw_event)

        # External ID
        event_id = raw_event.get("event_id") or raw_event.get(":id")
        external_id = f"nyc_open_data_{event_id}" if event_id else f"nyc_open_data_{hash(event_name + str(date_time))}"

        return EventCreate(
            title=event_name,
            description=self._build_description(raw_event),
            date_time=date_time,
            end_time=end_time,
            location_name=location_name,
            location_address=location_address,
            latitude=None,  # NYC Open Data doesn't always include coordinates
            longitude=None,
            neighborhood=neighborhood,
            category=category,
            price_min=0,  # Public permitted events are typically free
            price_max=0,
            source=self.source,
            external_id=external_id,
            external_url=None,  # No specific event URL
            image_url=None,  # No images in this dataset
            metadata={
                "event_type": raw_event.get("event_type"),
                "event_agency": raw_event.get("event_agency"),
                "police_precinct": raw_event.get("police_precinct"),
            },
            tags=["free", "street event", "public"],
        )

    def _build_description(self, event: Dict[str, Any]) -> str:
        """Build description from event data."""
        parts = []

        event_type = event.get("event_type")
        if event_type:
            parts.append(f"Type: {event_type}")

        agency = event.get("event_agency")
        if agency:
            parts.append(f"Organized by: {agency}")

        location = event.get("event_location")
        from_street = event.get("event_from_street")
        to_street = event.get("event_to_street")
        if location and from_street and to_street:
            parts.append(f"Location: {location} from {from_street} to {to_street}")

        return "\n".join(parts) if parts else "NYC permitted public event"
```

**Step 2: Commit**

```bash
git add backend/scripts/scrapers/nyc_open_data.py
git commit -m "feat: add NYC Open Data permitted events scraper"
```

---

## Task 5: Create CLI for manual scraper runs

**Files:**
- Create: `backend/scripts/scrapers/cli.py`

**Step 1: Write CLI**

Create `backend/scripts/scrapers/cli.py`:

```python
"""CLI for running scrapers manually."""

import asyncio
import argparse
import logging
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.scrapers.nyc_parks import NYCParksScraper
from scripts.scrapers.nyc_open_data import NYCOpenDataScraper
from scripts.scrapers.base import ScraperResult

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

SCRAPERS = {
    "nyc_parks": NYCParksScraper,
    "nyc_open_data": NYCOpenDataScraper,
}


async def run_scraper(name: str, dry_run: bool, verbose: bool) -> ScraperResult:
    """Run a single scraper."""
    scraper_class = SCRAPERS.get(name)
    if not scraper_class:
        raise ValueError(f"Unknown scraper: {name}. Available: {list(SCRAPERS.keys())}")

    async with scraper_class(dry_run=dry_run, verbose=verbose) as scraper:
        return await scraper.run()


async def run_all(dry_run: bool, verbose: bool) -> list[ScraperResult]:
    """Run all scrapers."""
    results = []
    for name in SCRAPERS:
        try:
            result = await run_scraper(name, dry_run, verbose)
            results.append(result)
        except Exception as e:
            logger.error(f"Scraper {name} failed: {e}")
    return results


def main():
    parser = argparse.ArgumentParser(description="Run event scrapers")
    parser.add_argument(
        "scraper",
        choices=list(SCRAPERS.keys()) + ["all"],
        help="Which scraper to run",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and transform but don't save to database",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print detailed output",
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.scraper == "all":
        results = asyncio.run(run_all(args.dry_run, args.verbose))
    else:
        result = asyncio.run(run_scraper(args.scraper, args.dry_run, args.verbose))
        results = [result]

    # Print summary
    print("\n" + "=" * 60)
    print("SCRAPER SUMMARY")
    print("=" * 60)
    total_new = 0
    total_updated = 0
    total_failed = 0
    for result in results:
        print(result)
        total_new += result.events_new
        total_updated += result.events_updated
        total_failed += result.events_failed

    print("-" * 60)
    print(f"TOTAL: New: {total_new}, Updated: {total_updated}, Failed: {total_failed}")

    # Exit with error if any scraper failed
    if any(r.error_message for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
```

**Step 2: Test CLI help**

```bash
cd backend && python -m scripts.scrapers.cli --help
```

Expected output:
```
usage: cli.py [-h] [--dry-run] [--verbose] {nyc_parks,nyc_open_data,all}

Run event scrapers

positional arguments:
  {nyc_parks,nyc_open_data,all}
                        Which scraper to run

options:
  -h, --help            show this help message and exit
  --dry-run             Fetch and transform but don't save to database
  --verbose, -v         Print detailed output
```

**Step 3: Commit**

```bash
git add backend/scripts/scrapers/cli.py
git commit -m "feat: add CLI for manual scraper runs"
```

---

## Task 6: Create Celery tasks for scheduled scraping

**Files:**
- Create: `backend/app/tasks/__init__.py`
- Create: `backend/app/tasks/scraper_tasks.py`
- Modify: `backend/app/celery.py`

**Step 1: Create tasks directory**

```bash
mkdir -p backend/app/tasks
touch backend/app/tasks/__init__.py
```

**Step 2: Write scraper tasks**

Create `backend/app/tasks/scraper_tasks.py`:

```python
"""Celery tasks for event scrapers."""

import asyncio
import logging
from datetime import datetime

from app.celery import celery_app
from app.database import db_manager

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in sync Celery task."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_nyc_parks")
def scrape_nyc_parks(self):
    """Scrape NYC Parks events."""
    from scripts.scrapers.nyc_parks import NYCParksScraper

    logger.info("Starting NYC Parks scrape task")

    async def _run():
        async with NYCParksScraper() as scraper:
            result = await scraper.run()
            await _log_scraper_run(scraper.source.value, result)
            return {
                "source": result.source,
                "events_found": result.events_found,
                "events_new": result.events_new,
                "events_updated": result.events_updated,
                "events_failed": result.events_failed,
                "error": result.error_message,
            }

    return run_async(_run())


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_nyc_open_data")
def scrape_nyc_open_data(self):
    """Scrape NYC Open Data permitted events."""
    from scripts.scrapers.nyc_open_data import NYCOpenDataScraper

    logger.info("Starting NYC Open Data scrape task")

    async def _run():
        async with NYCOpenDataScraper() as scraper:
            result = await scraper.run()
            await _log_scraper_run(scraper.source.value, result)
            return {
                "source": result.source,
                "events_found": result.events_found,
                "events_new": result.events_new,
                "events_updated": result.events_updated,
                "events_failed": result.events_failed,
                "error": result.error_message,
            }

    return run_async(_run())


@celery_app.task(bind=True, name="app.tasks.scraper_tasks.scrape_all")
def scrape_all(self):
    """Run all scrapers."""
    logger.info("Starting all scrapers")

    results = []
    results.append(scrape_nyc_parks.delay().get())
    results.append(scrape_nyc_open_data.delay().get())

    return {
        "scrapers_run": len(results),
        "results": results,
    }


async def _log_scraper_run(source: str, result):
    """Log scraper run to event_sources table."""
    try:
        supabase = db_manager.supabase_admin
        if not supabase:
            logger.warning("Supabase not available, skipping scraper log")
            return

        # Check if source exists
        existing = supabase.table("event_sources").select("id").eq(
            "source_name", source
        ).execute()

        data = {
            "source_name": source,
            "last_sync_at": datetime.utcnow().isoformat(),
            "last_sync_status": "success" if not result.error_message else "failed",
            "events_found": result.events_found,
            "events_new": result.events_new,
            "events_updated": result.events_updated,
            "error_message": result.error_message,
            "is_enabled": True,
        }

        if existing.data:
            supabase.table("event_sources").update(data).eq(
                "id", existing.data[0]["id"]
            ).execute()
        else:
            supabase.table("event_sources").insert(data).execute()

    except Exception as e:
        logger.error(f"Failed to log scraper run: {e}")
```

**Step 3: Update __init__.py to export tasks**

Update `backend/app/tasks/__init__.py`:

```python
"""Celery tasks package."""

from .scraper_tasks import scrape_nyc_parks, scrape_nyc_open_data, scrape_all

__all__ = ["scrape_nyc_parks", "scrape_nyc_open_data", "scrape_all"]
```

**Step 4: Commit**

```bash
git add backend/app/tasks/
git commit -m "feat: add Celery tasks for scheduled scraping"
```

---

## Task 7: Update Celery beat schedule

**Files:**
- Modify: `backend/app/celery.py`

**Step 1: Update beat schedule**

Replace the beat_schedule in `backend/app/celery.py` with updated scraper schedule:

```python
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
    timezone="America/New_York",  # NYC timezone
    enable_utc=True,
    result_expires=3600,
    task_track_started=True,
    task_routes={
        "app.tasks.scraper_tasks.*": {"queue": "scrapers"},
        "app.tasks.event_discovery.*": {"queue": "events"},
        "app.tasks.notifications.*": {"queue": "notifications"},
        "app.tasks.ml_recommendations.*": {"queue": "ml"},
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
}
```

**Step 2: Commit**

```bash
git add backend/app/celery.py
git commit -m "feat: update Celery beat schedule for daily scraping at 6am"
```

---

## Task 8: Add httpx to requirements

**Files:**
- Modify: `requirements.txt`

**Step 1: Add httpx dependency**

Add to `requirements.txt`:

```
httpx>=0.24.0
```

**Step 2: Commit**

```bash
git add requirements.txt
git commit -m "feat: add httpx for async HTTP requests in scrapers"
```

---

## Task 9: Create event_sources table migration (if needed)

**Files:**
- Create: `backend/database/migrations/XXX_add_event_sources.sql`

**Step 1: Check if table exists**

Query Supabase to check if `event_sources` table exists.

**Step 2: If not exists, create migration**

Create `backend/database/migrations/002_add_event_sources.sql`:

```sql
-- Event sources tracking table for scraper health monitoring
CREATE TABLE IF NOT EXISTS event_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT UNIQUE NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed')),
    events_found INT DEFAULT 0,
    events_new INT DEFAULT 0,
    events_updated INT DEFAULT 0,
    error_message TEXT,
    next_sync_at TIMESTAMPTZ,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_event_sources_source_name ON event_sources(source_name);

-- Enable RLS
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage event_sources"
    ON event_sources
    FOR ALL
    USING (auth.role() = 'service_role');
```

**Step 3: Commit**

```bash
git add backend/database/migrations/
git commit -m "feat: add event_sources table for scraper tracking"
```

---

## Task 10: Test scraper with dry run

**Step 1: Run NYC Parks scraper in dry run mode**

```bash
cd backend && python -m scripts.scrapers.cli nyc_parks --dry-run --verbose
```

Expected: Fetches events, transforms them, prints output, but doesn't save to database.

**Step 2: Run NYC Open Data scraper in dry run mode**

```bash
cd backend && python -m scripts.scrapers.cli nyc_open_data --dry-run --verbose
```

**Step 3: If both work, run without dry-run to populate database**

```bash
cd backend && python -m scripts.scrapers.cli all --verbose
```

**Step 4: Verify events in database**

Query Supabase to confirm events were inserted.

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add NYC_OPEN_DATA to EventSource enum |
| 2 | Create base scraper class |
| 3 | Create NYC Parks scraper |
| 4 | Create NYC Open Data scraper |
| 5 | Create CLI for manual runs |
| 6 | Create Celery tasks |
| 7 | Update Celery beat schedule |
| 8 | Add httpx dependency |
| 9 | Create event_sources migration |
| 10 | Test with dry run |

Total: 10 tasks, ~20 commits
