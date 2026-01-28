# Event Scraper Setup TODOs

Manual setup tasks required to get the event scrapers running in production.

## 1. Environment Variables

Add these to your `.env` file (and Railway/production environment):

```bash
# Required for Ticketmaster scraper
TICKETMASTER_API_KEY=your_key_here

# Optional - increases NYC Open Data rate limits
NYC_OPEN_DATA_API_KEY=your_key_here
```

### Getting API Keys

| Service | URL | Notes |
|---------|-----|-------|
| **Ticketmaster** | [developer.ticketmaster.com](https://developer.ticketmaster.com/) | Free tier: 5000 req/day. Create account → Create app → Get Consumer Key |
| **NYC Open Data** | [data.cityofnewyork.us](https://data.cityofnewyork.us/) | Optional but recommended. Sign up → My Profile → Create App Token |

---

## 2. Database Migration

Run the `event_sources` table migration in Supabase:

```sql
-- Copy contents of: backend/database/migrations/004_add_event_sources.sql
-- Run in Supabase SQL Editor
```

Or run via Supabase CLI:
```bash
supabase db push
```

---

## 3. Test Scrapers Locally

```bash
cd backend

# Test NYC Parks (no API key needed)
python -m scripts.scrapers.cli nyc_parks --dry-run --verbose

# Test NYC Open Data (no API key needed, but optional token helps)
python -m scripts.scrapers.cli nyc_open_data --dry-run --verbose

# Test Ticketmaster (requires API key)
python -m scripts.scrapers.cli ticketmaster --dry-run --verbose

# Run all scrapers for real (writes to database)
python -m scripts.scrapers.cli all --verbose
```

---

## 4. Celery Setup (for Scheduled Scraping)

Scrapers run automatically via Celery Beat. Ensure these services are running:

### Local Development
```bash
# Start Redis (required for Celery)
docker run -d -p 6379:6379 redis:alpine

# Start Celery worker
cd backend && celery -A app.celery worker --loglevel=info -Q scrapers

# Start Celery beat (scheduler)
cd backend && celery -A app.celery beat --loglevel=info
```

### Railway/Production
Add Celery worker and beat as separate services, or use a Procfile:

```yaml
# railway.toml or Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: celery -A app.celery worker --loglevel=info -Q scrapers
beat: celery -A app.celery beat --loglevel=info
```

---

## 5. Schedule Summary

| Scraper | Schedule (EST) | API Key Required |
|---------|----------------|------------------|
| NYC Parks | 6:00 AM | No |
| NYC Open Data | 6:30 AM | No (optional) |
| Ticketmaster | 7:00 AM | **Yes** |

---

## 6. Ticketmaster Affiliate Program (Optional - Revenue)

To earn commission on ticket sales:

1. Apply at [Ticketmaster Affiliate Program](https://www.ticketmaster.com/affiliate-program)
2. Get your affiliate ID
3. Update `backend/scripts/scrapers/ticketmaster.py`:

```python
def _build_affiliate_url(self, url: str) -> str:
    """Add affiliate tracking to Ticketmaster URL."""
    if "?" in url:
        return f"{url}&affiliate=YOUR_AFFILIATE_ID"
    return f"{url}?affiliate=YOUR_AFFILIATE_ID"
```

---

## 7. Monitoring

Check scraper health in the `event_sources` table:

```sql
SELECT
    source_name,
    last_sync_at,
    last_sync_status,
    events_found,
    events_new,
    error_message
FROM event_sources
ORDER BY last_sync_at DESC;
```

---

## Quick Checklist

- [ ] Add `TICKETMASTER_API_KEY` to `.env`
- [ ] (Optional) Add `NYC_OPEN_DATA_API_KEY` to `.env`
- [ ] Run `004_add_event_sources.sql` migration in Supabase
- [ ] Test scrapers locally with `--dry-run`
- [ ] Run scrapers for real to populate database
- [ ] Set up Celery worker + beat for scheduled runs
- [ ] (Optional) Register for Ticketmaster affiliate program
