"""
NYC Parks event scraper.

Fetches free outdoor events from the NYC Parks BigApps JSON feed.
All events from this source are free (price_min=0, price_max=0).
"""

from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict, Tuple
import hashlib
import logging

from app.models.event import EventCreate, EventSource, EventCategory
from .base import BaseScraper

logger = logging.getLogger(__name__)


# Map NYC Parks categories to our EventCategory enum
NYC_PARKS_CATEGORY_MAP: Dict[str, EventCategory] = {
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

# Boroughs we want to include (filter out others)
ALLOWED_BOROUGHS = {"Manhattan", "Brooklyn"}


class NYCParksScraper(BaseScraper):
    """
    Scraper for NYC Parks events from their BigApps JSON feed.

    All events are free outdoor activities in NYC parks.
    Filters to Manhattan and Brooklyn only.
    """

    source = EventSource.NYC_PARKS
    base_url = "https://www.nycgovparks.org"
    events_url = "https://www.nycgovparks.org/xml/events_300_rss.json"

    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch raw event data from NYC Parks BigApps JSON feed.

        Returns:
            List of raw event dictionaries, filtered to events in next 30 days.
        """
        if not self.client:
            raise RuntimeError("Scraper must be used as async context manager")

        response = await self.client.get(self.events_url)
        response.raise_for_status()

        data = response.json()

        # Handle both {"events": [...]} and direct array format
        if isinstance(data, dict) and "events" in data:
            raw_events = data["events"]
        elif isinstance(data, list):
            raw_events = data
        else:
            logger.warning(f"Unexpected data format from NYC Parks: {type(data)}")
            raw_events = []

        # Filter to events in next 30 days
        now = datetime.utcnow()
        cutoff = now + timedelta(days=30)

        filtered_events = []
        for event in raw_events:
            try:
                # Try to parse the event date
                date_str = event.get("startdate") or event.get("date") or event.get("start_date")
                if not date_str:
                    continue

                event_date = self._parse_date(date_str)
                if event_date and now <= event_date <= cutoff:
                    filtered_events.append(event)
            except Exception as e:
                if self.verbose:
                    logger.debug(f"Error parsing event date: {e}")
                continue

        logger.info(f"Filtered to {len(filtered_events)} events in next 30 days (from {len(raw_events)} total)")
        return filtered_events

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """
        Parse date string from NYC Parks data.

        Handles formats:
        - %Y-%m-%d (2024-01-15)
        - %Y-%m-%dT%H:%M:%S (2024-01-15T10:00:00)
        - %m/%d/%Y (01/15/2024)

        Args:
            date_str: Date string to parse

        Returns:
            datetime object or None if parsing fails
        """
        if not date_str:
            return None

        formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%SZ",
            "%m/%d/%Y",
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        logger.debug(f"Could not parse date: {date_str}")
        return None

    def _parse_time(self, time_str: str) -> Optional[Tuple[int, int]]:
        """
        Parse time string to (hour, minute) tuple.

        Handles formats:
        - "10:00 AM"
        - "2:30 PM"
        - "14:00"
        - "14:00:00"

        Args:
            time_str: Time string to parse

        Returns:
            Tuple of (hour, minute) in 24-hour format, or None if parsing fails
        """
        if not time_str:
            return None

        time_str = time_str.strip().upper()

        # Handle AM/PM format
        if "AM" in time_str or "PM" in time_str:
            is_pm = "PM" in time_str
            time_str = time_str.replace("AM", "").replace("PM", "").strip()

            parts = time_str.split(":")
            if len(parts) >= 2:
                try:
                    hour = int(parts[0])
                    minute = int(parts[1])

                    # Convert to 24-hour format
                    if is_pm and hour != 12:
                        hour += 12
                    elif not is_pm and hour == 12:
                        hour = 0

                    return (hour, minute)
                except ValueError:
                    pass
        else:
            # 24-hour format
            parts = time_str.split(":")
            if len(parts) >= 2:
                try:
                    hour = int(parts[0])
                    minute = int(parts[1])
                    return (hour, minute)
                except ValueError:
                    pass

        logger.debug(f"Could not parse time: {time_str}")
        return None

    def _map_category(self, raw_category: Optional[str]) -> EventCategory:
        """
        Map NYC Parks category to EventCategory enum.

        Args:
            raw_category: Category string from NYC Parks data

        Returns:
            EventCategory enum value, defaults to OUTDOOR
        """
        if not raw_category:
            return EventCategory.OUTDOOR

        raw_lower = raw_category.lower().strip()

        # Direct match
        if raw_lower in NYC_PARKS_CATEGORY_MAP:
            return NYC_PARKS_CATEGORY_MAP[raw_lower]

        # Partial match
        for key, category in NYC_PARKS_CATEGORY_MAP.items():
            if key in raw_lower:
                return category

        return EventCategory.OUTDOOR

    def _extract_coordinates(self, event: Dict[str, Any]) -> Tuple[Optional[float], Optional[float]]:
        """
        Extract latitude and longitude from event data.

        Args:
            event: Raw event dictionary

        Returns:
            Tuple of (latitude, longitude), either may be None
        """
        lat = None
        lng = None

        # Try various field names
        lat_fields = ["latitude", "lat", "location_lat"]
        lng_fields = ["longitude", "lng", "lon", "location_lng", "location_lon"]

        for field in lat_fields:
            if field in event and event[field]:
                try:
                    lat = float(event[field])
                    break
                except (ValueError, TypeError):
                    continue

        for field in lng_fields:
            if field in event and event[field]:
                try:
                    lng = float(event[field])
                    break
                except (ValueError, TypeError):
                    continue

        # Also try nested location object
        if lat is None or lng is None:
            location = event.get("location", {})
            if isinstance(location, dict):
                if lat is None and "latitude" in location:
                    try:
                        lat = float(location["latitude"])
                    except (ValueError, TypeError):
                        pass
                if lng is None and "longitude" in location:
                    try:
                        lng = float(location["longitude"])
                    except (ValueError, TypeError):
                        pass

        return (lat, lng)

    def _extract_borough(self, event: Dict[str, Any]) -> Optional[str]:
        """
        Extract borough from event data.

        Tries:
        1. "borough" field directly
        2. parkids first character (M=Manhattan, B=Brooklyn, Q=Queens, X=Bronx, R=Staten Island)
        3. Extract from park name (e.g., "Central Park, Manhattan")

        Args:
            event: Raw event dictionary

        Returns:
            Borough name or None
        """
        # Try direct borough field
        borough = event.get("borough")
        if borough:
            return borough.strip()

        # Try parkids - first character indicates borough
        parkids = event.get("parkids") or event.get("parkid")
        if parkids:
            # parkids can be a string like "M010" or list
            if isinstance(parkids, list):
                parkids = parkids[0] if parkids else ""
            if parkids:
                borough_code = parkids[0].upper()
                borough_map = {
                    "M": "Manhattan",
                    "B": "Brooklyn",
                    "Q": "Queens",
                    "X": "Bronx",
                    "R": "Staten Island",
                }
                if borough_code in borough_map:
                    return borough_map[borough_code]

        # Try to extract from park name
        park_name = event.get("parknames") or event.get("park_name") or event.get("location")
        if park_name:
            # Common patterns: "Park Name, Borough" or "Park Name (Borough)"
            for b in ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]:
                if b.lower() in park_name.lower():
                    return b

        return None

    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """
        Transform a raw NYC Parks event into an EventCreate model.

        Filters to Manhattan and Brooklyn only.

        Args:
            raw_event: Raw event data from fetch()

        Returns:
            EventCreate model or None if event should be skipped
        """
        # Extract borough and filter
        borough = self._extract_borough(raw_event)
        if borough and borough not in ALLOWED_BOROUGHS:
            if self.verbose:
                logger.debug(f"Skipping event outside Manhattan/Brooklyn: {borough}")
            return None

        # If borough is unknown, we'll still include it (might be in our target areas)
        # but log for visibility
        if not borough and self.verbose:
            logger.debug(f"Event has unknown borough: {raw_event.get('title', 'unknown')}")

        # Extract title
        title = raw_event.get("title") or raw_event.get("name")
        if not title:
            logger.warning("Event missing title, skipping")
            return None
        title = title.strip()

        # Parse date and time
        date_str = raw_event.get("startdate") or raw_event.get("date") or raw_event.get("start_date")
        time_str = raw_event.get("starttime") or raw_event.get("start_time") or raw_event.get("time")

        event_date = self._parse_date(date_str)
        if not event_date:
            logger.warning(f"Could not parse date for event '{title}': {date_str}")
            return None

        # Add time if available
        if time_str:
            time_parts = self._parse_time(time_str)
            if time_parts:
                event_date = event_date.replace(hour=time_parts[0], minute=time_parts[1])

        # Parse end time if available
        end_time = None
        end_date_str = raw_event.get("enddate") or raw_event.get("end_date")
        end_time_str = raw_event.get("endtime") or raw_event.get("end_time")

        if end_date_str:
            end_time = self._parse_date(end_date_str)
            if end_time and end_time_str:
                time_parts = self._parse_time(end_time_str)
                if time_parts:
                    end_time = end_time.replace(hour=time_parts[0], minute=time_parts[1])
        elif end_time_str:
            # End time without end date means same day
            time_parts = self._parse_time(end_time_str)
            if time_parts:
                end_time = event_date.replace(hour=time_parts[0], minute=time_parts[1])
                # Handle case where end time is before start (means next day)
                if end_time <= event_date:
                    end_time = end_time + timedelta(days=1)

        # Validate end_time is after start_time
        if end_time and end_time <= event_date:
            end_time = None  # Invalid, ignore it

        # Get location
        location_name = (
            raw_event.get("parknames") or
            raw_event.get("park_name") or
            raw_event.get("location") or
            "NYC Park"
        )
        if isinstance(location_name, str):
            location_name = location_name.strip()

        # Get address
        location_address = raw_event.get("address") or raw_event.get("location_address")
        if location_address:
            location_address = location_address.strip()

        # Get coordinates
        lat, lng = self._extract_coordinates(raw_event)

        # Get description
        description = raw_event.get("description") or raw_event.get("desc")
        if description:
            description = description.strip()

        # Build external_id
        event_id = raw_event.get("id") or raw_event.get("event_id") or raw_event.get("uid")
        if event_id:
            external_id = f"nyc_parks_{event_id}"
        else:
            # Generate hash-based ID from title + date
            hash_input = f"{title}_{date_str}_{location_name}"
            hash_digest = hashlib.md5(hash_input.encode()).hexdigest()[:12]
            external_id = f"nyc_parks_{hash_digest}"

        # Build external_url
        external_url = raw_event.get("url") or raw_event.get("link") or raw_event.get("external_url")
        if external_url:
            # Prepend base_url if needed
            if not external_url.startswith("http"):
                external_url = f"{self.base_url}{external_url}" if external_url.startswith("/") else f"{self.base_url}/{external_url}"

        # Get image URL
        image_url = raw_event.get("image") or raw_event.get("image_url") or raw_event.get("photo")
        if image_url and not image_url.startswith("http"):
            image_url = f"{self.base_url}{image_url}" if image_url.startswith("/") else f"{self.base_url}/{image_url}"

        # Map category
        raw_category = raw_event.get("category") or raw_event.get("type") or raw_event.get("categories")
        if isinstance(raw_category, list):
            raw_category = raw_category[0] if raw_category else None
        category = self._map_category(raw_category)

        # Build tags
        tags = ["free", "outdoor", "parks"]
        if borough:
            tags.append(borough.lower())
        if raw_category:
            tag = raw_category.lower().strip() if isinstance(raw_category, str) else str(raw_category)
            if tag not in tags:
                tags.append(tag)

        # Build metadata
        metadata = {}
        if borough:
            metadata["borough"] = borough
        if raw_event.get("contact"):
            metadata["contact"] = raw_event["contact"]
        if raw_event.get("requirements"):
            metadata["requirements"] = raw_event["requirements"]
        if raw_event.get("age_group"):
            metadata["age_group"] = raw_event["age_group"]

        return EventCreate(
            title=title,
            description=description,
            date_time=event_date,
            end_time=end_time,
            location_name=location_name,
            location_address=location_address,
            latitude=lat,
            longitude=lng,
            neighborhood=borough,  # Use borough as neighborhood
            category=category,
            price_min=0,
            price_max=0,
            source=EventSource.NYC_PARKS,
            external_id=external_id,
            external_url=external_url,
            image_url=image_url,
            tags=tags,
            metadata=metadata,
        )
