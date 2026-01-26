# Godo Development Roadmap

## Overview

Complete todo list from brainstorming session covering: frontend-backend integration, event data pipeline, calendar sync, screenshot extraction, and content type expansion.

---

## Phase 1: Connect Frontend to Real Backend (NOW)

Get the app working end-to-end with real data flow.

### 1.1 API Service Methods
- [ ] Add `getEventFeed(params)` → `GET /api/v1/events/feed`
- [ ] Add `recordSwipe(eventId, direction, metadata)` → `POST /api/v1/swipes/`
- [ ] Add `getEventById(id)` → `GET /api/v1/events/{id}`
- [ ] Add `getCalendarEvents()` → `GET /api/v1/users/calendar` (need to create endpoint)
- [ ] Add `getSavedEvents()` → `GET /api/v1/users/saved` (need to create endpoint)

### 1.2 EventService Refactor
- [ ] Replace mock data initialization with API call
- [ ] `fetchEventsFeed(timeFilter)` → calls ApiService
- [ ] Cache events locally for offline/performance
- [ ] Handle loading, error, empty states

### 1.3 Swipe Persistence
- [ ] On swipe → call `ApiService.recordSwipe()`
- [ ] Optimistic UI update + rollback on failure
- [ ] Sync local swipe state with backend

### 1.4 Backend Endpoints (New/Modified)
- [ ] `GET /api/v1/events/feed` — Add `time_filter` query param (happening_now vs future)
- [ ] `GET /api/v1/users/calendar` — Return user's "Going" events (RIGHT + UP swipes)
- [ ] `GET /api/v1/users/saved` — Return user's "Maybe Later" events (DOWN swipes)
- [ ] Verify swipe → event_attendance flow works

### 1.5 Auth Integration
- [ ] Ensure login/signup flows work with real backend
- [ ] Handle token refresh
- [ ] Protected routes redirect to login if unauthenticated

### 1.6 Profile Screen
- [ ] Fetch real user profile from API
- [ ] Display actual preferences (not hardcoded)
- [ ] Edit preferences → save to backend

---

## Phase 2: Seed Database with Real Events

Populate the database with actual NYC events.

### 2.1 NYC Parks Events Scraper
- [ ] Research NYC Parks API / data source
- [ ] Build scraper script (`backend/scripts/scrapers/nyc_parks.py`)
- [ ] Map to Event schema
- [ ] Deduplicate by external_id
- [ ] Schedule periodic sync (Celery task)

### 2.2 NYC Open Data Integration
- [ ] Identify relevant datasets (permits, street fairs, festivals)
- [ ] Build scraper for each dataset
- [ ] Geocode addresses → lat/lng
- [ ] Categorize events automatically

### 2.3 Eventbrite API (Optional)
- [ ] Register for Eventbrite API key
- [ ] Build Eventbrite scraper
- [ ] Filter to NYC events only
- [ ] Handle pagination

### 2.4 Manual Seed Data
- [ ] Curate 20-30 real upcoming NYC events
- [ ] Create seed script (`backend/scripts/seed_events.py`)
- [ ] Include variety: free/paid, all categories, multiple neighborhoods
- [ ] Run on Railway to populate production DB

### 2.5 Event Enrichment
- [ ] Geocode missing lat/lng (Google Maps or free alternative)
- [ ] Calculate transit_score based on proximity to subway
- [ ] Add neighborhood from coordinates
- [ ] Fetch/generate images for events without imageUrl

---

## Phase 3: Schema Enhancements

Extend data model for richer content.

### 3.1 Content Types
- [ ] Add migration: `content_type` column ('event' | 'activity' | 'seasonal')
- [ ] Add migration: `recurrence_rule` (iCal RRULE format)
- [ ] Add migration: `season_start`, `season_end` dates
- [ ] Add migration: `availability_hours` JSONB
- [ ] Update Event model in backend
- [ ] Update Event type in frontend

### 3.2 Additional Fields
- [ ] Add `organizer_name`, `organizer_url` for event hosts
- [ ] Add `age_restriction` (null, 18, 21)
- [ ] Add `is_recurring` boolean flag
- [ ] Add `weather_dependent` boolean

### 3.3 Feed Query Updates
- [ ] Modify feed endpoint to handle content_type filtering
- [ ] Activities: always show (check availability_hours for "now")
- [ ] Seasonal: show if current date within season
- [ ] Events: standard date_time filtering

---

## Phase 4: Apple Calendar Integration

Sync Godo events with iOS Calendar.

### 4.1 Setup
- [ ] Install `expo-calendar` package
- [ ] Add calendar permission to Info.plist
- [ ] Request permission during onboarding or first sync

### 4.2 Write to Calendar
- [ ] On swipe RIGHT/UP → create iOS calendar event
- [ ] Store `calendar_event_id` in event_attendance table
- [ ] Add migration for `calendar_event_id`, `calendar_source` columns

### 4.3 Calendar Management
- [ ] Create "Godo" calendar or use default
- [ ] Settings: choose which calendar to sync to
- [ ] Delete from iOS calendar when user removes from Godo

### 4.4 Read from Calendar (Future)
- [ ] Read user's calendar for free time detection
- [ ] Suggest events that fit available slots
- [ ] Show calendar conflicts on event cards

---

## Phase 5: Google Calendar Integration

OAuth-based sync with Google Calendar.

### 5.1 Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Enable Calendar API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth credentials
- [ ] Add authorized redirect URIs

### 5.2 Backend OAuth Flow
- [ ] `GET /api/v1/integrations/google/auth-url` — Generate OAuth URL
- [ ] `GET /api/v1/integrations/google/callback` — Handle OAuth callback
- [ ] Exchange auth code for tokens
- [ ] Create `user_integrations` table
- [ ] Store tokens securely (encrypted)

### 5.3 Token Management
- [ ] Implement token refresh logic
- [ ] Handle expired/revoked tokens gracefully
- [ ] `DELETE /api/v1/integrations/google/disconnect`

### 5.4 Calendar Operations
- [ ] `GET /api/v1/integrations/google/calendars` — List user's calendars
- [ ] `GET /api/v1/integrations/google/events` — Fetch events (cached)
- [ ] `POST /api/v1/integrations/google/sync` — Push Godo event to Google

### 5.5 Frontend Settings
- [ ] "Connect Google Calendar" button in Profile/Settings
- [ ] Show connected status
- [ ] Calendar picker (which calendar to sync to)
- [ ] Disconnect option

---

## Phase 6: Screenshot-to-Event

AI-powered event extraction from images.

### 6.1 Backend Extraction Endpoint
- [ ] `POST /api/v1/events/extract-from-image`
- [ ] Accept multipart/form-data image upload
- [ ] Integrate Claude Vision API
- [ ] Design extraction prompt
- [ ] Return structured event data + confidence scores

### 6.2 Extraction Logic
- [ ] Parse: title, date/time, location, price, description
- [ ] Handle various formats (Instagram story, text message, flyer)
- [ ] Geocode extracted location
- [ ] Detect and extract URLs if visible

### 6.3 Frontend UI
- [ ] "Add Event" button → options sheet
- [ ] "From Screenshot" → image picker (camera roll or capture)
- [ ] Loading state during extraction
- [ ] Preview card with extracted data
- [ ] Edit mode for corrections
- [ ] Visibility picker: "Just me" / "Friends" / "Public"

### 6.4 Deduplication
- [ ] Check for existing events with same external_url
- [ ] Fuzzy match on title + date + location
- [ ] Prompt user if potential duplicate found

### 6.5 Moderation (for public submissions)
- [ ] User-generated events default to `moderation_status: pending`
- [ ] Admin review queue (future)
- [ ] Auto-approve high-confidence extractions

---

## Phase 7: Activity & Seasonal Content

Support non-event content types.

### 7.1 Activity Import
- [ ] Identify sources for NYC activities (Yelp, Google Places, etc.)
- [ ] Build activity scraper/importer
- [ ] Parse operating hours → availability_hours
- [ ] Categorize: fitness, food, culture, outdoor, etc.

### 7.2 Seasonal Content
- [ ] Curate seasonal NYC activities (ice skating, rooftop bars, beaches)
- [ ] Set season_start and season_end
- [ ] Auto-show/hide based on current date

### 7.3 UI Differentiation
- [ ] Visual indicator for activities vs events (icon, badge)
- [ ] "Open now" indicator for activities
- [ ] "In season" badge for seasonal content
- [ ] Filter/toggle in Discover screen

### 7.4 Swipe Behavior
- [ ] Activities: swipe adds to "favorites" (no specific date)
- [ ] Option to "Plan for [date]" → creates calendar entry
- [ ] Seasonal: treat like events but with flexible timing

---

## Phase 8: Polish & Production

Final touches before launch.

### 8.1 Error Handling
- [ ] Graceful degradation when offline
- [ ] Retry logic for failed API calls
- [ ] User-friendly error messages

### 8.2 Performance
- [ ] Event list virtualization
- [ ] Image lazy loading + caching
- [ ] API response caching

### 8.3 Analytics
- [ ] Track swipe patterns
- [ ] Track feature usage (calendar sync, screenshot add)
- [ ] Funnel: signup → first swipe → first "going"

### 8.4 Testing
- [ ] Unit tests for EventService
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows

---

## Dependencies & API Keys Needed

| Service | Purpose | Required |
|---------|---------|----------|
| Supabase | Database, Auth | ✅ Have |
| Railway | Backend hosting | ✅ Have |
| Claude API | Screenshot extraction | Need key |
| Google Cloud | Calendar OAuth | Need setup |
| Google Maps | Geocoding | Optional |
| Eventbrite | Event scraping | Optional |

---

## Immediate Next Steps

1. **Now**: Connect frontend to backend (Phase 1)
2. **Next**: Seed database with real events (Phase 2.4 - manual seed)
3. **Then**: Apple Calendar write sync (Phase 4.2)
4. **After**: Screenshot extraction (Phase 6)

---

## Open Decisions

- [ ] Create dedicated "Godo" calendar or use user's default?
- [ ] Screenshot processing: on-device OCR fallback or backend-only?
- [ ] Activity discovery: separate tab or mixed in main feed?
- [ ] Moderation approach: manual review or auto-approve with confidence threshold?
- [ ] Free tier limits: how many screenshot extractions per month?
