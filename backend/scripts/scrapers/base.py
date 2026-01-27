"""
Base scraper class for event data ingestion.

Provides the abstract base class that all event scrapers inherit from,
implementing the fetch -> transform -> load pattern.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Any, Dict
import logging
import httpx

from app.models.event import EventCreate, EventSource as EventSourceEnum, EventCategory
from app.database import db_manager

logger = logging.getLogger(__name__)


@dataclass
class ScraperResult:
    """Result of a scraper run with statistics."""

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
        """Calculate the duration of the scraper run in seconds."""
        return (self.completed_at - self.started_at).total_seconds()

    def __str__(self) -> str:
        """Return a nice logging output."""
        status = "SUCCESS" if self.error_message is None else "FAILED"
        return (
            f"ScraperResult[{self.source}] {status}\n"
            f"  Duration: {self.duration_seconds:.2f}s\n"
            f"  Events found: {self.events_found}\n"
            f"  New: {self.events_new}, Updated: {self.events_updated}, Failed: {self.events_failed}"
            + (f"\n  Error: {self.error_message}" if self.error_message else "")
        )


class BaseScraper(ABC):
    """
    Abstract base class for event scrapers.

    Implements the fetch -> transform -> load pattern:
    - fetch(): Retrieve raw data from the source
    - transform(): Convert raw data to EventCreate models
    - load(): Upsert events to Supabase

    Usage:
        async with MyScraper(dry_run=False) as scraper:
            result = await scraper.run()
            print(result)
    """

    # Class attributes to be overridden by subclasses
    source: EventSourceEnum
    base_url: str

    def __init__(self, dry_run: bool = False, verbose: bool = False):
        """
        Initialize the scraper.

        Args:
            dry_run: If True, don't actually write to the database
            verbose: If True, enable verbose logging
        """
        self.dry_run = dry_run
        self.verbose = verbose
        self.client: Optional[httpx.AsyncClient] = None

        if verbose:
            logger.setLevel(logging.DEBUG)

    async def __aenter__(self) -> "BaseScraper":
        """Async context manager entry - creates HTTP client."""
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            follow_redirects=True,
            headers={
                "User-Agent": "Godo Event Scraper/1.0 (contact@godo.app)"
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit - closes HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None

    @abstractmethod
    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch raw event data from the source.

        Returns:
            List of raw event dictionaries from the source API/page.
        """
        pass

    @abstractmethod
    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """
        Transform a raw event dictionary into an EventCreate model.

        Args:
            raw_event: Raw event data from fetch()

        Returns:
            EventCreate model if transformation successful, None if event should be skipped.
        """
        pass

    async def load(self, events: List[EventCreate]) -> tuple[int, int, int]:
        """
        Load events into Supabase via upsert.

        Checks if event exists by source + external_id:
        - If exists: update
        - If not: insert

        Args:
            events: List of EventCreate models to upsert

        Returns:
            Tuple of (new_count, updated_count, failed_count)
        """
        new_count = 0
        updated_count = 0
        failed_count = 0

        supabase = db_manager.supabase_admin
        if supabase is None and not self.dry_run:
            logger.error("Supabase admin client not available")
            return 0, 0, len(events)

        for event in events:
            try:
                # Build event data dict for Supabase
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
                    "capacity": event.capacity,
                    "source": event.source.value,
                    "external_id": event.external_id,
                    "external_url": str(event.external_url) if event.external_url else None,
                    "image_url": str(event.image_url) if event.image_url else None,
                    "metadata": event.metadata or {},
                    "accessibility_info": event.accessibility_info or {},
                    "tags": event.tags or [],
                    "is_active": True,
                    "moderation_status": "approved",  # Scraped events are auto-approved
                }

                if self.dry_run:
                    # Check if event exists (for logging purposes)
                    existing = supabase.table("events").select("id").eq(
                        "source", event.source.value
                    ).eq(
                        "external_id", event.external_id
                    ).execute() if supabase else None

                    exists = existing and existing.data and len(existing.data) > 0
                    action = "UPDATE" if exists else "INSERT"
                    logger.info(f"[DRY RUN] Would {action}: {event.title} ({event.external_id})")

                    if exists:
                        updated_count += 1
                    else:
                        new_count += 1
                else:
                    # Check if event already exists
                    existing = supabase.table("events").select("id").eq(
                        "source", event.source.value
                    ).eq(
                        "external_id", event.external_id
                    ).execute()

                    if existing.data and len(existing.data) > 0:
                        # Update existing event
                        event_id = existing.data[0]["id"]
                        event_data["updated_at"] = datetime.utcnow().isoformat()

                        supabase.table("events").update(event_data).eq(
                            "id", event_id
                        ).execute()

                        updated_count += 1
                        if self.verbose:
                            logger.debug(f"Updated event: {event.title} ({event.external_id})")
                    else:
                        # Insert new event
                        event_data["created_at"] = datetime.utcnow().isoformat()
                        event_data["updated_at"] = datetime.utcnow().isoformat()

                        supabase.table("events").insert(event_data).execute()

                        new_count += 1
                        if self.verbose:
                            logger.debug(f"Inserted event: {event.title} ({event.external_id})")

            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to load event '{event.title}': {e}")
                if self.verbose:
                    logger.exception("Full traceback:")

        return new_count, updated_count, failed_count

    async def run(self) -> ScraperResult:
        """
        Run the full scraper pipeline: fetch -> transform -> load.

        Returns:
            ScraperResult with statistics about the run.
        """
        started_at = datetime.utcnow()
        error_message = None
        events_found = 0
        events_new = 0
        events_updated = 0
        events_failed = 0

        try:
            # Fetch raw data
            logger.info(f"[{self.source.value}] Starting fetch...")
            raw_events = await self.fetch()
            events_found = len(raw_events)
            logger.info(f"[{self.source.value}] Fetched {events_found} raw events")

            # Transform to EventCreate models
            logger.info(f"[{self.source.value}] Transforming events...")
            transformed_events: List[EventCreate] = []
            transform_failed = 0

            for raw_event in raw_events:
                try:
                    event = self.transform(raw_event)
                    if event is not None:
                        transformed_events.append(event)
                    else:
                        if self.verbose:
                            logger.debug(f"Skipped event during transform: {raw_event.get('title', 'unknown')}")
                except Exception as e:
                    transform_failed += 1
                    logger.warning(f"Transform failed for event: {e}")
                    if self.verbose:
                        logger.exception("Full traceback:")

            logger.info(
                f"[{self.source.value}] Transformed {len(transformed_events)} events "
                f"({transform_failed} transform failures)"
            )

            # Load to database
            logger.info(f"[{self.source.value}] Loading events to database...")
            events_new, events_updated, load_failed = await self.load(transformed_events)
            events_failed = transform_failed + load_failed

            logger.info(
                f"[{self.source.value}] Load complete: "
                f"{events_new} new, {events_updated} updated, {events_failed} failed"
            )

        except Exception as e:
            error_message = str(e)
            logger.error(f"[{self.source.value}] Scraper failed: {error_message}")
            if self.verbose:
                logger.exception("Full traceback:")

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
