"""
NYC Open Data permitted events scraper.

Fetches permitted events (street fairs, parades, festivals, etc.) from the
NYC Open Data SODA API.

Dataset: NYC Permitted Event Information
URL: https://data.cityofnewyork.us/resource/tvpp-9vvx.json

All events from this source are free public events (price_min=0, price_max=0).
"""

from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict
import hashlib
import logging

from app.models.event import EventCreate, EventSource, EventCategory
from app.config import settings
from .base import BaseScraper

logger = logging.getLogger(__name__)


# Map NYC Open Data event types to our EventCategory enum
NYC_OPEN_DATA_CATEGORY_MAP: Dict[str, EventCategory] = {
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

# Boroughs we want to include (filter out others)
ALLOWED_BOROUGHS = {"Manhattan", "Brooklyn"}


class NYCOpenDataScraper(BaseScraper):
    """
    Scraper for NYC Open Data permitted events.

    Fetches street fairs, parades, festivals, and other permitted events
    from the NYC Open Data SODA API.

    Filters to Manhattan and Brooklyn only.
    """

    source = EventSource.NYC_OPEN_DATA
    base_url = "https://data.cityofnewyork.us"
    dataset_id = "tvpp-9vvx"

    @property
    def api_url(self) -> str:
        """Build the SODA API endpoint URL."""
        return f"{self.base_url}/resource/{self.dataset_id}.json"

    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch raw event data from NYC Open Data SODA API.

        Returns:
            List of raw event dictionaries, filtered to:
            - Events starting from now
            - Events within the next 30 days
            - Manhattan and Brooklyn only
        """
        if not self.client:
            raise RuntimeError("Scraper must be used as async context manager")

        now = datetime.utcnow()
        cutoff = now + timedelta(days=30)

        # Build SODA query parameters
        # $where clause filters to events starting from now
        where_clause = f"start_date_time >= '{now.strftime('%Y-%m-%dT%H:%M:%S')}'"

        params: Dict[str, Any] = {
            "$where": where_clause,
            "$limit": 500,
            "$order": "start_date_time ASC",
        }

        # Add app token if available (optional, increases rate limits)
        # Skip placeholder values
        api_key = settings.nyc_open_data_api_key
        if api_key and not api_key.startswith("your-"):
            params["$$app_token"] = api_key

        response = await self.client.get(self.api_url, params=params)
        response.raise_for_status()

        raw_events = response.json()

        if not isinstance(raw_events, list):
            logger.warning(f"Unexpected data format from NYC Open Data: {type(raw_events)}")
            return []

        # Filter to next 30 days and allowed boroughs
        filtered_events = []
        for event in raw_events:
            try:
                # Check borough filter
                event_borough = event.get("event_borough", "").strip()
                if event_borough and event_borough not in ALLOWED_BOROUGHS:
                    if self.verbose:
                        logger.debug(f"Skipping event outside Manhattan/Brooklyn: {event_borough}")
                    continue

                # Parse start date and check within 30 days
                start_date_str = event.get("start_date_time")
                if not start_date_str:
                    continue

                event_date = self._parse_datetime(start_date_str)
                if event_date and event_date <= cutoff:
                    filtered_events.append(event)

            except Exception as e:
                if self.verbose:
                    logger.debug(f"Error filtering event: {e}")
                continue

        logger.info(
            f"Filtered to {len(filtered_events)} events in Manhattan/Brooklyn "
            f"within next 30 days (from {len(raw_events)} total)"
        )
        return filtered_events

    def _parse_datetime(self, dt_str: str) -> Optional[datetime]:
        """
        Parse ISO format datetime string from NYC Open Data.

        Handles formats:
        - 2024-01-15T10:00:00.000
        - 2024-01-15T10:00:00
        - 2024-01-15T10:00:00+00:00

        Args:
            dt_str: Datetime string to parse

        Returns:
            datetime object or None if parsing fails
        """
        if not dt_str:
            return None

        # Strip timezone info if present (e.g., +00:00)
        if "+" in dt_str:
            dt_str = dt_str.split("+")[0]
        if "-" in dt_str and dt_str.count("-") > 2:
            # Handle negative timezone offset like -05:00
            parts = dt_str.rsplit("-", 1)
            if ":" in parts[-1]:
                dt_str = parts[0]

        # Remove trailing Z if present
        dt_str = dt_str.rstrip("Z")

        formats = [
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ]

        for fmt in formats:
            try:
                return datetime.strptime(dt_str, fmt)
            except ValueError:
                continue

        logger.debug(f"Could not parse datetime: {dt_str}")
        return None

    def _map_category(self, event: Dict[str, Any]) -> EventCategory:
        """
        Map NYC Open Data event to EventCategory enum.

        Checks event_type and event_name against category map.

        Args:
            event: Raw event dictionary

        Returns:
            EventCategory enum value, defaults to CULTURE
        """
        # Check event_type first
        event_type = event.get("event_type", "").lower().strip()
        if event_type:
            for key, category in NYC_OPEN_DATA_CATEGORY_MAP.items():
                if key in event_type:
                    return category

        # Check event_name as fallback
        event_name = event.get("event_name", "").lower().strip()
        if event_name:
            for key, category in NYC_OPEN_DATA_CATEGORY_MAP.items():
                if key in event_name:
                    return category

        # Default to CULTURE for street events
        return EventCategory.CULTURE

    def _build_location_name(self, event: Dict[str, Any]) -> str:
        """
        Build location name from event data.

        Uses event_street_side, event_location, and from/to streets.

        Args:
            event: Raw event dictionary

        Returns:
            Location name string
        """
        parts = []

        # Primary location info
        event_location = event.get("event_location", "").strip()
        if event_location:
            parts.append(event_location)

        # Street side (e.g., "North side of Broadway")
        street_side = event.get("event_street_side", "").strip()
        if street_side and street_side not in parts:
            parts.append(street_side)

        # From/to streets
        from_street = event.get("from_street", "").strip()
        to_street = event.get("to_street", "").strip()

        if from_street and to_street:
            parts.append(f"from {from_street} to {to_street}")
        elif from_street:
            parts.append(f"at {from_street}")

        if parts:
            return ", ".join(parts)

        return "NYC Street Event"

    def _build_address(self, event: Dict[str, Any]) -> Optional[str]:
        """
        Build address from event data.

        Args:
            event: Raw event dictionary

        Returns:
            Address string or None
        """
        parts = []

        # Location
        event_location = event.get("event_location", "").strip()
        if event_location:
            parts.append(event_location)

        # Borough
        borough = event.get("event_borough", "").strip()
        if borough:
            parts.append(borough)
            parts.append("NY")

        if parts:
            return ", ".join(parts)

        return None

    def _build_description(self, event: Dict[str, Any]) -> str:
        """
        Build description from event data.

        Includes event_type, event_agency, and location details.

        Args:
            event: Raw event dictionary

        Returns:
            Description string
        """
        parts = []

        event_type = event.get("event_type", "").strip()
        if event_type:
            parts.append(f"Event type: {event_type}")

        event_agency = event.get("event_agency", "").strip()
        if event_agency:
            parts.append(f"Sponsored by: {event_agency}")

        # Location details
        location_details = []
        from_street = event.get("from_street", "").strip()
        to_street = event.get("to_street", "").strip()
        if from_street and to_street:
            location_details.append(f"From {from_street} to {to_street}")

        police_precinct = event.get("police_precinct", "").strip()
        if police_precinct:
            location_details.append(f"Police Precinct: {police_precinct}")

        if location_details:
            parts.append(". ".join(location_details))

        if parts:
            return ". ".join(parts)

        return "NYC permitted public event"

    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """
        Transform a raw NYC Open Data event into an EventCreate model.

        Args:
            raw_event: Raw event data from fetch()

        Returns:
            EventCreate model or None if event should be skipped
        """
        # Get title from event_name
        title = raw_event.get("event_name", "").strip()
        if not title:
            logger.warning("Event missing event_name, skipping")
            return None

        # Parse start datetime
        start_date_str = raw_event.get("start_date_time")
        date_time = self._parse_datetime(start_date_str)
        if not date_time:
            logger.warning(f"Could not parse start_date_time for event '{title}': {start_date_str}")
            return None

        # Parse end datetime
        end_date_str = raw_event.get("end_date_time")
        end_time = self._parse_datetime(end_date_str) if end_date_str else None

        # Validate end_time is after start_time
        if end_time and end_time <= date_time:
            end_time = None

        # Build location info
        location_name = self._build_location_name(raw_event)
        location_address = self._build_address(raw_event)

        # Get borough/neighborhood
        borough = raw_event.get("event_borough", "").strip()
        neighborhood = borough.title() if borough else None

        # Build external_id
        event_id = raw_event.get("event_id")
        if event_id:
            external_id = f"nyc_open_data_{event_id}"
        else:
            # Generate hash-based ID from title + date + location
            hash_input = f"{title}_{start_date_str}_{location_name}"
            hash_digest = hashlib.md5(hash_input.encode()).hexdigest()[:12]
            external_id = f"nyc_open_data_{hash_digest}"

        # Map category
        category = self._map_category(raw_event)

        # Build description
        description = self._build_description(raw_event)

        # Build tags
        tags = ["free", "street event", "public"]
        if neighborhood:
            tags.append(neighborhood.lower())

        event_type = raw_event.get("event_type", "").strip().lower()
        if event_type and event_type not in tags:
            tags.append(event_type)

        # Build metadata
        metadata: Dict[str, Any] = {}
        if raw_event.get("event_type"):
            metadata["event_type"] = raw_event["event_type"]
        if raw_event.get("event_agency"):
            metadata["event_agency"] = raw_event["event_agency"]
        if raw_event.get("police_precinct"):
            metadata["police_precinct"] = raw_event["police_precinct"]

        return EventCreate(
            title=title,
            description=description,
            date_time=date_time,
            end_time=end_time,
            location_name=location_name,
            location_address=location_address,
            latitude=None,  # Not always provided in NYC Open Data
            longitude=None,  # Not always provided in NYC Open Data
            neighborhood=neighborhood,
            category=category,
            price_min=0,
            price_max=0,
            source=EventSource.NYC_OPEN_DATA,
            external_id=external_id,
            external_url=None,  # No specific event URL available
            image_url=None,  # No images in this dataset
            tags=tags,
            metadata=metadata,
        )
