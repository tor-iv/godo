# Event Scraper Design

## Overview

Build automated scrapers to populate Godo's event database from official NYC data sources. Start with free, reliable city APIs, then expand to commercial sources.

## Decisions

| Decision | Choice |
|----------|--------|
| Sources (Phase 1) | NYC Parks + NYC Open Data |
| Sources (Phase 2) | Ticketmaster (with affiliate program) |
| Coverage | Manhattan + Brooklyn |
| Categories | All (mapped to EventCategory enum) |
| Time horizon | 30 days |
| Update strategy | Upsert on `source` + `external_id` |
| Scheduling | Daily at 6am via Celery |
| Manual trigger | CLI + optional admin API |

## Architecture

```
backend/
├── scripts/
│   └── scrapers/
│       ├── base.py              # Abstract base class
│       ├── nyc_parks.py         # NYC Parks implementation
│       ├── nyc_open_data.py     # NYC Open Data implementation
│       ├── ticketmaster.py      # Ticketmaster (Phase 2)
│       └── cli.py               # Manual trigger commands
├── app/
│   └── tasks/
│       └── scraper_tasks.py     # Celery scheduled tasks
```

### Base Scraper Pattern

```python
class BaseScraper:
    source: EventSource

    async def fetch(self) -> List[RawEvent]
        """Get raw data from API"""

    async def transform(self, raw: RawEvent) -> EventCreate
        """Convert to Godo EventCreate schema"""

    async def load(self, events: List[EventCreate]) -> LoadResult
        """Upsert to database by external_id"""

    async def run(self) -> ScraperResult
        """Orchestrates fetch → transform → load, returns stats"""
```

## Data Sources

### NYC Parks

**Data source:** https://www.nycgovparks.org/bigapps (JSON feed)
**Events page:** https://www.nycgovparks.org/events
**Cost:** Free
**Content:** Free outdoor events, fitness classes, concerts, nature walks, workshops

**Field Mapping:**

| NYC Parks | Godo |
|-----------|------|
| `title` | `title` |
| `description` | `description` |
| `startdate` + `starttime` | `date_time` |
| `enddate` + `endtime` | `end_time` |
| `parknames` | `location_name` |
| `location` | `location_address` |
| `coordinates` | `latitude/longitude` |
| `category` | `category` (mapped) |
| Event URL | `external_url` |
| Unique ID | `external_id` |

**Notes:**
- All events are free (price_min=0, price_max=0)
- Categories: fitness, outdoor, culture, family

### NYC Open Data (Permitted Events)

**Dataset:** https://data.cityofnewyork.us/City-Government/NYC-Permitted-Event-Information/tvpp-9vvx
**API:** SODA (Socrata Open Data API)
**Cost:** Free, no auth required for basic use

**Query example:**
```
https://data.cityofnewyork.us/resource/tvpp-9vvx.json?
$where=start_date_time >= '2026-01-26'
&$limit=200
```

**Content:** Street fairs, parades, festivals, marathons, block parties — public permitted events.

### Ticketmaster (Phase 2)

**API:** Discovery API v2 - https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
**Auth:** API key
**Cost:** Free tier (5000 req/day, 5 req/sec)
**Content:** Concerts, sports, comedy, theater at major venues

**Query params:**
```python
params = {
    "dmaId": "345",           # New York DMA
    "startDateTime": today,
    "endDateTime": today + 30 days,
    "size": 100,
    "apikey": TICKETMASTER_API_KEY
}
```

**Affiliate Program:**
- Sign up at Ticketmaster Affiliate Program
- Add affiliate tag to `external_url`
- Earn commission when users buy tickets

## Deduplication

### Upsert Strategy

Each event gets a composite key: `source` + `external_id`

```python
existing = db.query(Event).filter(
    Event.source == source,
    Event.external_id == external_id
).first()

if existing:
    # Update changed fields
    existing.title = new_data.title
    existing.date_time = new_data.date_time
    existing.updated_at = now()
else:
    # Insert new
    db.add(Event(**new_data))
```

### Handling Removed Events

- Track which `external_id`s seen this scrape
- Events not seen in 2 consecutive scrapes → set `is_active = False`
- Don't hard delete (users may have saved them)

### Cross-Source Deduplication (Future)

Same event might appear in multiple sources. For now, allow duplicates. Later add fuzzy matching on `title + date + location` to merge.

## CLI

```bash
# Run specific scraper
python -m backend.scripts.scrapers.cli nyc_parks

# Dry run (fetch + transform, don't save)
python -m backend.scripts.scrapers.cli nyc_parks --dry-run

# Run all scrapers
python -m backend.scripts.scrapers.cli all

# Verbose output for debugging
python -m backend.scripts.scrapers.cli nyc_open_data --verbose
```

**Output:**
```
[nyc_parks] Starting scrape...
[nyc_parks] Fetched 147 events from API
[nyc_parks] New: 12, Updated: 135, Skipped: 0
[nyc_parks] Completed in 4.2s
```

## Scheduling

```python
# backend/app/tasks/scraper_tasks.py

@celery.task
def scrape_nyc_parks():
    scraper = NYCParksScraper()
    return scraper.run()

@celery.task
def scrape_nyc_open_data():
    scraper = NYCOpenDataScraper()
    return scraper.run()

# Schedule: daily at 6am EST
celery.conf.beat_schedule = {
    'scrape-nyc-parks-daily': {
        'task': 'app.tasks.scraper_tasks.scrape_nyc_parks',
        'schedule': crontab(hour=6, minute=0),
    },
    'scrape-nyc-open-data-daily': {
        'task': 'app.tasks.scraper_tasks.scrape_nyc_open_data',
        'schedule': crontab(hour=6, minute=30),
    },
}
```

## Logging

Each scrape run logs to `event_sources` table:
- `last_sync_at`
- `events_found`, `events_new`, `events_updated`
- `last_sync_status` (success/partial/failed)
- `error_message` if failed

## Optional Admin API

```
POST /api/v1/admin/scrapers/run
Body: { "scraper": "nyc_parks" }
Auth: Admin only
```

## Files to Create

1. `backend/scripts/scrapers/base.py` — Abstract base class
2. `backend/scripts/scrapers/nyc_parks.py` — NYC Parks implementation
3. `backend/scripts/scrapers/nyc_open_data.py` — NYC Open Data implementation
4. `backend/scripts/scrapers/cli.py` — Manual trigger CLI
5. `backend/app/tasks/scraper_tasks.py` — Celery scheduled tasks

## Future Enhancements

- **Eventbrite:** Build venue/org list approach or explore partnership
- **Ticketmaster affiliate integration:** Add tracking tags to URLs
- **Spotify integration:** Connect user's Spotify to personalize concert recommendations
- **Venue/place discovery:** Trending restaurants, bars, clubs (like Corner app)
- **Cross-source deduplication:** Fuzzy matching to merge duplicate events
