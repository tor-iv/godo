# Godo Setup TODOs

Manual setup tasks to complete before running in production.

---

## 1. Environment Variables

### Backend (`backend/.env`)

**Security - MUST change for production:**

| Variable | Current | Action |
|----------|---------|--------|
| `JWT_SECRET` | Placeholder | Generate secure random string (32+ chars) |
| `SUPABASE_SERVICE_KEY` | May be incomplete | Get from Supabase Dashboard → Settings → API |

**External APIs:**

| Variable | Required | How to Get |
|----------|----------|------------|
| `TICKETMASTER_API_KEY` | For Ticketmaster scraper | [developer.ticketmaster.com](https://developer.ticketmaster.com/) - Free: 5000 req/day |
| `NYC_OPEN_DATA_API_KEY` | Optional (higher rate limits) | [data.cityofnewyork.us](https://data.cityofnewyork.us/) → My Profile → App Token |
| `GOOGLE_MAPS_API_KEY` | For geocoding (future) | [Google Cloud Console](https://console.cloud.google.com/) |
| `SENTRY_DSN` | Optional (error monitoring) | [sentry.io](https://sentry.io/) |

### Frontend (`godo-app/.env` or root `.env`)

Currently uses root `.env` for Supabase credentials. These are already configured.

---

## 2. Database Migrations

Run these SQL commands in **Supabase SQL Editor** (Dashboard → SQL Editor):

### Add Event Source Enum Values (Required for scrapers)

```sql
-- Check current enum values
SELECT unnest(enum_range(NULL::event_source)) as source;

-- Add new values if missing
ALTER TYPE event_source ADD VALUE IF NOT EXISTS 'nyc_parks';
ALTER TYPE event_source ADD VALUE IF NOT EXISTS 'nyc_open_data';
ALTER TYPE event_source ADD VALUE IF NOT EXISTS 'ticketmaster';
```

### Create Event Sources Tracking Table

```sql
-- Copy and run contents of:
-- backend/database/migrations/004_add_event_sources.sql
```

### Verify All Migrations Applied

Check these tables exist:
- `users`
- `events`
- `event_attendance`
- `swipes`
- `event_sources` (new)

---

## 3. Event Scrapers

### Test Locally

```bash
# Via Docker (recommended)
npm run backend:up
docker-compose exec godo-backend python -m scripts.scrapers.cli nyc_parks --dry-run

# Or local Python
cd backend && python -m scripts.scrapers.cli nyc_parks --dry-run
```

### Expected Results

| Scraper | Without API Key | Events |
|---------|-----------------|--------|
| NYC Parks | Works | ~400+ |
| NYC Open Data | Works | ~300+ |
| Ticketmaster | Needs key | ~200+ |

### Scheduled Scraping (Celery)

Requires Redis + Celery worker + Celery beat:

```bash
# Local
docker run -d -p 6379:6379 redis:alpine
cd backend && celery -A app.celery worker -Q scrapers &
cd backend && celery -A app.celery beat &
```

Schedule: NYC Parks 6am, NYC Open Data 6:30am, Ticketmaster 7am (EST)

---

## 4. Production Deployment (Railway)

### Services Needed

1. **Web** - FastAPI backend
2. **Worker** - Celery worker for scrapers
3. **Beat** - Celery beat scheduler
4. **Redis** - Message broker (Railway addon or external)

### Environment Variables for Railway

Copy all from `backend/.env` plus:
- `PORT` - Railway sets automatically
- `REDIS_URL` - From Railway Redis addon

### Procfile

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: celery -A app.celery worker --loglevel=info -Q scrapers
beat: celery -A app.celery beat --loglevel=info
```

---

## 5. Optional Enhancements

### Ticketmaster Affiliate Program

Earn commission on ticket sales:
1. Apply at [ticketmaster.com/affiliate-program](https://www.ticketmaster.com/affiliate-program)
2. Update `backend/scripts/scrapers/ticketmaster.py` with affiliate ID

### Sentry Error Monitoring

1. Create project at [sentry.io](https://sentry.io/)
2. Add `SENTRY_DSN` to environment

### Google Maps Integration

For future geocoding/location features:
1. Enable Maps JavaScript API and Geocoding API
2. Add `GOOGLE_MAPS_API_KEY` to environment

---

## Quick Checklist

### Immediate (Before First Run)

- [ ] Generate secure `JWT_SECRET` for production
- [ ] Verify `SUPABASE_SERVICE_KEY` is complete
- [ ] Run enum migration: `ALTER TYPE event_source ADD VALUE...`
- [ ] Run `004_add_event_sources.sql` migration

### For Scrapers

- [ ] Add `TICKETMASTER_API_KEY` (required for Ticketmaster)
- [ ] (Optional) Add `NYC_OPEN_DATA_API_KEY` for higher rate limits
- [ ] Test with `--dry-run` flag
- [ ] Set up Redis + Celery for scheduled scraping

### For Production

- [ ] Set up Railway services (web, worker, beat, redis)
- [ ] Configure all environment variables
- [ ] (Optional) Set up Sentry monitoring
- [ ] (Optional) Register for Ticketmaster affiliate program
