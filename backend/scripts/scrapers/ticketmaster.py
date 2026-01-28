"""
Ticketmaster Discovery API scraper.

Fetches concerts, sports, theater, and other ticketed events from Ticketmaster.
Supports affiliate links for commission on ticket sales.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict, Tuple
import logging

from app.models.event import EventCreate, EventSource, EventCategory
from app.config import settings
from .base import BaseScraper

logger = logging.getLogger(__name__)


# Map Ticketmaster segments to our EventCategory enum
TICKETMASTER_SEGMENT_MAP: Dict[str, EventCategory] = {
    "Music": EventCategory.NIGHTLIFE,
    "Sports": EventCategory.FITNESS,
    "Arts & Theatre": EventCategory.CULTURE,
    "Film": EventCategory.CULTURE,
    "Miscellaneous": EventCategory.CULTURE,
}

# Map Ticketmaster genres for more specific categorization
TICKETMASTER_GENRE_MAP: Dict[str, EventCategory] = {
    "Rock": EventCategory.NIGHTLIFE,
    "Pop": EventCategory.NIGHTLIFE,
    "Hip-Hop/Rap": EventCategory.NIGHTLIFE,
    "R&B": EventCategory.NIGHTLIFE,
    "Electronic": EventCategory.NIGHTLIFE,
    "Country": EventCategory.NIGHTLIFE,
    "Jazz": EventCategory.CULTURE,
    "Classical": EventCategory.CULTURE,
    "Comedy": EventCategory.CULTURE,
    "Theatre": EventCategory.CULTURE,
    "Dance": EventCategory.CULTURE,
    "Basketball": EventCategory.FITNESS,
    "Football": EventCategory.FITNESS,
    "Baseball": EventCategory.FITNESS,
    "Hockey": EventCategory.FITNESS,
    "Soccer": EventCategory.FITNESS,
    "Tennis": EventCategory.FITNESS,
    "Boxing": EventCategory.FITNESS,
    "MMA": EventCategory.FITNESS,
}

# NYC DMA (Designated Market Area) ID
NYC_DMA_ID = "345"

# Major NYC venue IDs for prioritization (optional filtering)
NYC_MAJOR_VENUES = [
    "KovZpZA7AAEA",  # Madison Square Garden
    "KovZpaFEZe",    # Barclays Center
    "KovZpZAEdFtJ",  # Radio City Music Hall
    "KovZpZAEAl6A",  # Beacon Theatre
    "KovZpZAEAanA",  # Carnegie Hall
    "KovZpZAEdndA",  # Brooklyn Steel
    "KovZpZAJ6nlA",  # Terminal 5
]


class TicketmasterScraper(BaseScraper):
    """
    Scraper for Ticketmaster events via Discovery API.

    Fetches concerts, sports, theater, and other ticketed events.
    Filters to New York DMA (covers Manhattan, Brooklyn, and surrounding area).
    """

    source = EventSource.TICKETMASTER
    base_url = "https://app.ticketmaster.com"
    api_url = "https://app.ticketmaster.com/discovery/v2/events.json"

    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch events from Ticketmaster Discovery API.

        Returns:
            List of raw event dictionaries for the next 30 days in NYC area.
        """
        if not settings.ticketmaster_api_key:
            raise RuntimeError("TICKETMASTER_API_KEY not configured")

        now = datetime.utcnow()
        cutoff = now + timedelta(days=30)

        # Build query parameters
        params = {
            "apikey": settings.ticketmaster_api_key,
            "dmaId": NYC_DMA_ID,
            "startDateTime": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "endDateTime": cutoff.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "size": 100,  # Max per page
            "sort": "date,asc",
        }

        all_events = []
        page = 0
        max_pages = 5  # Limit to 500 events to stay within rate limits

        while page < max_pages:
            params["page"] = page

            response = await self.client.get(self.api_url, params=params)
            response.raise_for_status()

            data = response.json()

            # Extract events from response
            embedded = data.get("_embedded", {})
            events = embedded.get("events", [])

            if not events:
                break

            all_events.extend(events)

            # Check if there are more pages
            page_info = data.get("page", {})
            total_pages = page_info.get("totalPages", 1)

            if page >= total_pages - 1:
                break

            page += 1

        logger.info(f"Fetched {len(all_events)} events from Ticketmaster API")
        return all_events

    def _extract_venue(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Extract venue information from event."""
        embedded = event.get("_embedded", {})
        venues = embedded.get("venues", [])

        if not venues:
            return {}

        return venues[0]

    def _extract_price_range(self, event: Dict[str, Any]) -> Tuple[int, Optional[int]]:
        """
        Extract price range from event.

        Returns:
            Tuple of (price_min, price_max) in dollars.
        """
        price_ranges = event.get("priceRanges", [])

        if not price_ranges:
            return (0, None)

        # Get the first price range (usually general admission)
        price = price_ranges[0]

        min_price = int(price.get("min", 0))
        max_price = price.get("max")

        if max_price is not None:
            max_price = int(max_price)

        return (min_price, max_price)

    def _map_category(self, event: Dict[str, Any]) -> EventCategory:
        """
        Map Ticketmaster classification to EventCategory.

        Uses segment (Music, Sports, etc.) and genre for mapping.
        """
        classifications = event.get("classifications", [])

        if not classifications:
            return EventCategory.CULTURE

        classification = classifications[0]

        # Try genre first (more specific)
        genre = classification.get("genre", {})
        genre_name = genre.get("name", "")

        if genre_name in TICKETMASTER_GENRE_MAP:
            return TICKETMASTER_GENRE_MAP[genre_name]

        # Fall back to segment
        segment = classification.get("segment", {})
        segment_name = segment.get("name", "")

        if segment_name in TICKETMASTER_SEGMENT_MAP:
            return TICKETMASTER_SEGMENT_MAP[segment_name]

        return EventCategory.CULTURE

    def _extract_image_url(self, event: Dict[str, Any]) -> Optional[str]:
        """Extract the best quality image URL from event."""
        images = event.get("images", [])

        if not images:
            return None

        # Sort by size (prefer larger images)
        # Ticketmaster images have width/height
        sorted_images = sorted(
            images,
            key=lambda x: (x.get("width", 0) * x.get("height", 0)),
            reverse=True
        )

        # Get the largest image with 16:9 ratio if available
        for img in sorted_images:
            ratio = img.get("ratio", "")
            if ratio == "16_9":
                return img.get("url")

        # Fall back to largest image
        return sorted_images[0].get("url") if sorted_images else None

    def _is_in_target_area(self, venue: Dict[str, Any]) -> bool:
        """
        Check if venue is in Manhattan or Brooklyn.

        Note: Ticketmaster DMA covers wider NYC area, so we filter further.
        """
        city = venue.get("city", {})
        city_name = city.get("name", "").lower()

        state = venue.get("state", {})
        state_code = state.get("stateCode", "")

        # Must be in NY state
        if state_code != "NY":
            return False

        # Check for NYC boroughs
        nyc_areas = ["new york", "manhattan", "brooklyn", "nyc"]

        for area in nyc_areas:
            if area in city_name:
                return True

        # Also check address
        address = venue.get("address", {})
        line1 = address.get("line1", "").lower()

        for area in nyc_areas:
            if area in line1:
                return True

        return False

    def _build_affiliate_url(self, url: str) -> str:
        """
        Add affiliate tracking to Ticketmaster URL.

        TODO: Add actual affiliate ID when registered with Ticketmaster affiliate program.
        """
        # For now, return URL as-is
        # When affiliate ID is available, append: ?affiliate=YOUR_AFFILIATE_ID
        return url

    def transform(self, raw_event: Dict[str, Any]) -> Optional[EventCreate]:
        """
        Transform a Ticketmaster event into an EventCreate model.

        Filters to Manhattan/Brooklyn venues.
        """
        # Extract venue and check location
        venue = self._extract_venue(raw_event)

        if venue and not self._is_in_target_area(venue):
            if self.verbose:
                venue_name = venue.get("name", "unknown")
                logger.debug(f"Skipping event outside Manhattan/Brooklyn: {venue_name}")
            return None

        # Extract basic info
        name = raw_event.get("name")
        if not name:
            return None

        # Parse dates
        dates = raw_event.get("dates", {})
        start = dates.get("start", {})

        date_str = start.get("dateTime") or start.get("localDate")
        if not date_str:
            return None

        # Parse datetime
        try:
            if "T" in date_str:
                # Full datetime format
                date_time = datetime.fromisoformat(date_str.replace("Z", "+00:00").split("+")[0])
            else:
                # Date only
                date_time = datetime.strptime(date_str, "%Y-%m-%d")
                # Add time if available
                local_time = start.get("localTime")
                if local_time:
                    time_parts = local_time.split(":")
                    date_time = date_time.replace(
                        hour=int(time_parts[0]),
                        minute=int(time_parts[1]) if len(time_parts) > 1 else 0
                    )
        except (ValueError, IndexError) as e:
            logger.warning(f"Could not parse date for event '{name}': {date_str} - {e}")
            return None

        # Get venue details
        venue_name = venue.get("name", "TBA") if venue else "TBA"

        address = venue.get("address", {}) if venue else {}
        location_address = address.get("line1")

        location = venue.get("location", {}) if venue else {}
        lat = location.get("latitude")
        lng = location.get("longitude")

        if lat:
            try:
                lat = float(lat)
            except (ValueError, TypeError):
                lat = None
        if lng:
            try:
                lng = float(lng)
            except (ValueError, TypeError):
                lng = None

        # Get city/neighborhood
        city = venue.get("city", {}) if venue else {}
        city_name = city.get("name", "")

        # Map to our neighborhood format
        neighborhood = None
        if "manhattan" in city_name.lower() or city_name.lower() == "new york":
            neighborhood = "Manhattan"
        elif "brooklyn" in city_name.lower():
            neighborhood = "Brooklyn"

        # Extract price range
        price_min, price_max = self._extract_price_range(raw_event)

        # Map category
        category = self._map_category(raw_event)

        # Get description/info
        description = raw_event.get("info") or raw_event.get("pleaseNote")

        # Build external URL with affiliate tracking
        external_url = raw_event.get("url")
        if external_url:
            external_url = self._build_affiliate_url(external_url)

        # Get image
        image_url = self._extract_image_url(raw_event)

        # Build external ID
        event_id = raw_event.get("id")
        external_id = f"ticketmaster_{event_id}" if event_id else None

        if not external_id:
            return None

        # Extract genre/segment for tags
        tags = []
        classifications = raw_event.get("classifications", [])
        if classifications:
            c = classifications[0]
            segment = c.get("segment", {}).get("name")
            genre = c.get("genre", {}).get("name")
            subgenre = c.get("subGenre", {}).get("name")

            if segment:
                tags.append(segment.lower())
            if genre:
                tags.append(genre.lower())
            if subgenre and subgenre != genre:
                tags.append(subgenre.lower())

        if neighborhood:
            tags.append(neighborhood.lower())

        # Build metadata
        metadata = {
            "ticketmaster_id": event_id,
            "segment": classifications[0].get("segment", {}).get("name") if classifications else None,
            "genre": classifications[0].get("genre", {}).get("name") if classifications else None,
            "venue_id": venue.get("id") if venue else None,
        }

        # Add sales info if available
        sales = raw_event.get("sales", {})
        public_sales = sales.get("public", {})
        if public_sales:
            metadata["sales_start"] = public_sales.get("startDateTime")
            metadata["sales_end"] = public_sales.get("endDateTime")

        return EventCreate(
            title=name,
            description=description,
            date_time=date_time,
            end_time=None,  # Ticketmaster doesn't always provide end time
            location_name=venue_name,
            location_address=location_address,
            latitude=lat,
            longitude=lng,
            neighborhood=neighborhood,
            category=category,
            price_min=price_min,
            price_max=price_max,
            source=EventSource.TICKETMASTER,
            external_id=external_id,
            external_url=external_url,
            image_url=image_url,
            tags=tags,
            metadata=metadata,
        )
