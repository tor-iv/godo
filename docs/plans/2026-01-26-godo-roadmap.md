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

## Phase 2: Event Data Pipeline & Scrapers

Comprehensive event ingestion from multiple sources. Each scraper follows a standard pattern:
1. Fetch raw data from source
2. Transform to Godo Event schema
3. Deduplicate by external_id + fuzzy matching
4. Enrich (geocode, categorize, images)
5. Store with source tracking for updates

### 2.1 Scraper Architecture

```
backend/
├── scripts/
│   └── scrapers/
│       ├── base_scraper.py      # Abstract base class
│       ├── nyc_parks.py
│       ├── nyc_open_data.py
│       ├── eventbrite.py
│       ├── ticketmaster.py
│       ├── resy.py
│       ├── beli.py
│       ├── dice.py
│       ├── partiful.py          # If feasible
│       └── run_all.py           # Orchestrator
├── app/
│   └── tasks/
│       └── scraper_tasks.py     # Celery scheduled tasks
```

**Base Scraper Interface:**
```python
class BaseScraper:
    source: EventSource
    rate_limit: int  # requests per minute

    async def fetch_events(self, params) -> List[RawEvent]
    async def transform(self, raw: RawEvent) -> EventCreate
    async def deduplicate(self, event: EventCreate) -> bool
    async def run(self) -> ScraperResult
```

---

### 2.2 NYC Parks Events
**Source:** NYC Parks Department
**URL:** https://www.nycgovparks.org/events
**API:** RSS feed + HTML scraping (no official API)
**Data Available:**
- Free outdoor events, fitness classes, concerts
- Nature walks, workshops, kids activities
- ~100-200 events at any time

**Implementation:**
- [ ] Parse RSS feed: https://www.nycgovparks.org/rss/events
- [ ] Scrape event detail pages for full info
- [ ] Extract: title, date, time, park name, borough, description
- [ ] Map park names → coordinates (maintain lookup table)
- [ ] Category mapping: fitness, outdoor, culture, family
- [ ] Schedule: Daily sync at 6am

**Fields extracted:**
```
title, description, date_time, end_time
location_name (park name), location_address
neighborhood (from borough), category
price_min=0, price_max=0 (always free)
external_url, image_url (if available)
```

---

### 2.3 NYC Open Data
**Source:** NYC Open Data Portal
**URL:** https://opendata.cityofnewyork.us/
**API:** Socrata Open Data API (SODA) - FREE
**Relevant Datasets:**

| Dataset | ID | Content |
|---------|-----|---------|
| Street Fair Permits | `2c6b-59wx` | Street fairs, festivals |
| Film Permits | `tg4x-b46p` | Movie shoots (not events, but interesting) |
| Special Events | Varies | Parades, marathons |
| Farmers Markets | `8vwk-6iz2` | Weekly markets |

**Implementation:**
- [ ] Register for NYC Open Data API token
- [ ] Build SODA query for each dataset
- [ ] Filter to upcoming events only
- [ ] Geocode addresses using NYC geocoder or Google
- [ ] Auto-categorize based on permit type
- [ ] Schedule: Daily sync

**Example Query:**
```
https://data.cityofnewyork.us/resource/2c6b-59wx.json?
$where=start_date >= '2026-01-26'
&$limit=100
&$$app_token=YOUR_TOKEN
```

---

### 2.4 Eventbrite API
**Source:** Eventbrite
**URL:** https://www.eventbrite.com/platform/api
**API:** REST API with OAuth
**Cost:** Free tier: 1000 requests/day
**Data Available:**
- Massive event catalog: concerts, classes, networking, workshops
- Ticket pricing, capacity, organizer info
- High-quality images

**Setup:**
- [ ] Create Eventbrite developer account
- [ ] Register application for API key
- [ ] Request "events:read" scope

**Implementation:**
- [ ] `GET /events/search/` with location filter (NYC bbox)
- [ ] Filter by category, date range
- [ ] Paginate through results (max 50 per page)
- [ ] Extract ticket tiers → price_min, price_max
- [ ] Map Eventbrite categories → Godo categories
- [ ] Store organizer info for enrichment
- [ ] Schedule: Every 4 hours

**Category Mapping:**
```python
EVENTBRITE_CATEGORY_MAP = {
    "Music": EventCategory.NIGHTLIFE,
    "Business & Professional": EventCategory.PROFESSIONAL,
    "Food & Drink": EventCategory.FOOD,
    "Community & Culture": EventCategory.CULTURE,
    "Performing & Visual Arts": EventCategory.CULTURE,
    "Film, Media & Entertainment": EventCategory.CULTURE,
    "Sports & Fitness": EventCategory.FITNESS,
    "Health & Wellness": EventCategory.FITNESS,
    "Science & Technology": EventCategory.PROFESSIONAL,
    "Travel & Outdoor": EventCategory.OUTDOOR,
    "Charity & Causes": EventCategory.NETWORKING,
    "Government & Politics": EventCategory.PROFESSIONAL,
    "Fashion & Beauty": EventCategory.CULTURE,
    "Home & Lifestyle": EventCategory.CULTURE,
    "Auto, Boat & Air": EventCategory.OUTDOOR,
    "Hobbies & Special Interest": EventCategory.CULTURE,
    "Other": EventCategory.CULTURE,
    "School Activities": EventCategory.CULTURE,
}
```

**API Response Fields Used:**
```
name.text → title
description.text → description
start.local → date_time
end.local → end_time
venue.name → location_name
venue.address.localized_address_display → location_address
venue.latitude, venue.longitude
ticket_availability.minimum_ticket_price.major_value → price_min
ticket_availability.maximum_ticket_price.major_value → price_max
capacity → capacity
logo.url → image_url
url → external_url
organizer.name → organizer_name
```

---

### 2.5 Ticketmaster Discovery API
**Source:** Ticketmaster
**URL:** https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
**API:** REST API with API key
**Cost:** Free tier: 5000 requests/day
**Data Available:**
- Concerts, sports, theater, comedy
- Major venue events (MSG, Barclays, etc.)
- Presale dates, ticket prices

**Setup:**
- [ ] Register at developer.ticketmaster.com
- [ ] Create app to get API key
- [ ] Note: Rate limited to 5 req/sec

**Implementation:**
- [ ] `GET /discovery/v2/events.json` with NYC DMA (designated market area)
- [ ] Filter: `dmaId=345` (New York DMA)
- [ ] Date range: today → 30 days out
- [ ] Categories: music, sports, arts, film, miscellaneous
- [ ] Handle pagination with `page` and `size` params
- [ ] Extract price ranges from `priceRanges` array
- [ ] Get venue details from embedded `_embedded.venues`
- [ ] Schedule: Every 6 hours

**Category Mapping:**
```python
TICKETMASTER_SEGMENT_MAP = {
    "Music": EventCategory.NIGHTLIFE,
    "Sports": EventCategory.FITNESS,
    "Arts & Theatre": EventCategory.CULTURE,
    "Film": EventCategory.CULTURE,
    "Miscellaneous": EventCategory.CULTURE,
}
```

**NYC Venue IDs to prioritize:**
```python
NYC_MAJOR_VENUES = [
    "KovZpZA7AAEA",  # Madison Square Garden
    "KovZpaFEZe",    # Barclays Center
    "KovZpZAEdFtJ",  # Radio City Music Hall
    "KovZpZAEAl6A",  # Beacon Theatre
    "KovZpZAEAanA",  # Carnegie Hall
    "KovZpZAEdndA",  # Brooklyn Steel
    "KovZpZAJ6nlA",  # Terminal 5
]
```

---

### 2.6 Resy API (Restaurant Experiences)
**Source:** Resy
**URL:** https://resy.com
**API:** Unofficial/undocumented (scraping may be needed)
**Data Available:**
- Restaurant reservations and special experiences
- Chef's tables, tasting menus, wine dinners
- Pop-ups, collaborations

**Challenge:** Resy doesn't have a public API. Options:
1. **Scrape web/app** — Legal gray area, may break
2. **Partner integration** — Contact Resy for API access
3. **Manual curation** — Manually add notable experiences

**Implementation (scraping approach):**
- [ ] Reverse engineer Resy web API calls
- [ ] Authenticate with user session (or create bot account)
- [ ] Fetch "experiences" and "events" sections
- [ ] Focus on NYC market only
- [ ] Extract: restaurant, date, time, price, description
- [ ] Schedule: Daily (be gentle with rate limits)
- [ ] **Legal review needed before production**

**Alternative - Resy Notify:**
- [ ] Build email parser for Resy notification emails
- [ ] Users forward Resy confirmations → extract event

**Fields to extract:**
```
restaurant_name → title, location_name
experience_name → append to title
date, time → date_time
price_per_person → price_min, price_max
neighborhood → neighborhood
cuisine_type → tags
booking_url → external_url
```

---

### 2.7 Beli App Integration
**Source:** Beli (restaurant recommendation app)
**URL:** https://beliapp.com
**API:** No public API
**Data Available:**
- Curated restaurant lists
- User ratings and reviews
- "Want to try" lists

**Challenge:** Beli is consumer-focused with no API. Options:
1. **Partnership** — Reach out for data sharing
2. **User import** — Let users connect Beli account to import their lists
3. **Skip for MVP** — Focus on event sources first

**Potential implementation:**
- [ ] Research if Beli has any data export
- [ ] Build OAuth flow if they support it
- [ ] Import user's "want to try" as activities
- [ ] These become activity suggestions, not time-bound events

---

### 2.8 DICE (Music Events)
**Source:** DICE
**URL:** https://dice.fm
**API:** Unofficial (would need scraping)
**Data Available:**
- Electronic music, club nights
- Indie concerts, DJ sets
- Brooklyn/Manhattan venue focus

**Implementation:**
- [ ] Scrape DICE NYC page
- [ ] Extract: artist, venue, date, price, lineup
- [ ] Map venues to coordinates
- [ ] Category: NIGHTLIFE
- [ ] Schedule: Daily

**Target venues:**
```
Elsewhere, Basement, Market Hotel, Brooklyn Steel,
Good Room, Public Records, Nowadays, Jupiter Disco,
Le Poisson Rouge, Baby's All Right, Music Hall of Williamsburg
```

---

### 2.9 Meetup API
**Source:** Meetup.com
**URL:** https://www.meetup.com/api/
**API:** GraphQL API (requires OAuth)
**Cost:** Free for basic, paid for higher limits
**Data Available:**
- Professional networking events
- Hobby groups, tech meetups
- Fitness groups, social clubs

**Setup:**
- [ ] Register OAuth app at meetup.com/api
- [ ] Request `event_read` scope

**Implementation:**
- [ ] GraphQL query for NYC events
- [ ] Filter by category and date
- [ ] Extract RSVP count as social signal
- [ ] Map groups to categories
- [ ] Schedule: Every 4 hours

**GraphQL Query:**
```graphql
query {
  searchEvents(
    filter: {
      lat: 40.7128
      lon: -74.0060
      radius: 25
      startDateRange: { start: "2026-01-26", end: "2026-02-26" }
    }
    first: 100
  ) {
    edges {
      node {
        title
        description
        dateTime
        venue { name address lat lon }
        going
        group { name category }
        eventUrl
        imageUrl
      }
    }
  }
}
```

---

### 2.10 Additional Sources (Future)

| Source | Type | API Status | Priority |
|--------|------|------------|----------|
| **Fever** | Experiences | No public API | Medium |
| **Time Out NYC** | Curated events | Scraping | Medium |
| **The Skint** | Free/cheap events | Email scraping | Low |
| **Nonsense NYC** | Underground events | Email scraping | Low |
| **Resident Advisor** | Club/electronic | Scraping | Medium |
| **Sofar Sounds** | Secret concerts | No API | Low |
| **Yelp Events** | Restaurant events | API available | Medium |
| **Facebook Events** | Social events | Limited API | Low (deprecated) |

---

### 2.11 Manual Seed Data (Immediate)
For MVP, manually curate events while scrapers are built:

- [ ] Create `backend/scripts/seed_events.py`
- [ ] Research 30-50 real upcoming NYC events across categories:
  - 5 networking/professional
  - 5 cultural (museums, galleries)
  - 5 fitness (yoga, runs, classes)
  - 5 food (tastings, markets, experiences)
  - 5 nightlife (concerts, comedy, bars)
  - 5 outdoor (parks, walks, tours)
- [ ] Include mix of price points ($0 to $100+)
- [ ] Cover multiple neighborhoods
- [ ] Add real images and URLs
- [ ] Run seed script on Railway production DB

---

### 2.12 Event Enrichment Pipeline

After scraping, enrich events with additional data:

**Geocoding:**
- [ ] Use Google Maps Geocoding API or free alternative (Nominatim)
- [ ] Convert addresses → lat/lng
- [ ] Fallback: venue name lookup table

**Neighborhood Detection:**
- [ ] Build NYC neighborhood polygon data
- [ ] Point-in-polygon check for coordinates
- [ ] Or use reverse geocoding

**Transit Score:**
- [ ] Load NYC subway station coordinates
- [ ] Calculate distance to nearest station
- [ ] Score: 10 (< 2 blocks) to 1 (no transit)

**Image Handling:**
- [ ] Validate image URLs are accessible
- [ ] Download and re-host on Supabase Storage (optional)
- [ ] Generate placeholder for events without images

**Category Inference:**
- [ ] Use keywords in title/description
- [ ] ML classifier (future): trained on categorized events
- [ ] Manual override in admin

---

### 2.13 Scraper Monitoring & Health

- [ ] Log scraper runs with results (events found, new, updated, failed)
- [ ] Track per-source metrics in `event_sources` table
- [ ] Alert on scraper failures (Sentry or webhook)
- [ ] Dashboard showing source health (future admin panel)

**event_sources table:**
```sql
CREATE TABLE event_sources (
  id UUID PRIMARY KEY,
  source_name TEXT UNIQUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success' | 'partial' | 'failed'
  events_found INT,
  events_new INT,
  events_updated INT,
  error_message TEXT,
  next_sync_at TIMESTAMPTZ,
  is_enabled BOOLEAN DEFAULT true
);
```

---

## Phase 2B: Business Portal (Event Submission Website)

Web portal for venues, organizers, and businesses to submit events directly.

### 2B.1 Portal Overview

**URL:** events.godo.app or godo.app/submit
**Users:** Venues, event organizers, PR agencies, local businesses
**Goal:** Self-service event submission with review/approval workflow

### 2B.2 Business Account System

**Account Types:**
| Type | Verification | Auto-approve | Limits |
|------|--------------|--------------|--------|
| Individual | Email only | No | 2 events/week |
| Verified Organizer | Email + ID | After 5 approved | 10 events/week |
| Venue Partner | Contract | Yes | Unlimited |
| API Partner | Contract + API key | Yes | Unlimited |

**Database Schema:**
```sql
CREATE TABLE business_accounts (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  business_name TEXT,
  business_type TEXT, -- 'venue' | 'organizer' | 'promoter' | 'pr_agency' | 'individual'
  website_url TEXT,
  phone TEXT,
  verification_status TEXT, -- 'pending' | 'verified' | 'rejected'
  verification_docs JSONB, -- uploaded docs for review
  auto_approve BOOLEAN DEFAULT false,
  events_submitted INT DEFAULT 0,
  events_approved INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_venues (
  id UUID PRIMARY KEY,
  business_account_id UUID REFERENCES business_accounts(id),
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  neighborhood TEXT,
  capacity INT,
  venue_type TEXT, -- 'bar' | 'restaurant' | 'club' | 'theater' | 'outdoor' | 'gallery' | 'other'
  is_verified BOOLEAN DEFAULT false
);
```

### 2B.3 Event Submission Flow

```
1. Business signs up / logs in
2. "Submit Event" form:
   - Event details (title, description, date, time)
   - Select venue (from their saved venues or add new)
   - Category selection
   - Pricing (free, ticket price, price range)
   - Image upload
   - Ticket URL (optional)
   - Recurring options (one-time, weekly, monthly)
3. Preview how event will appear in app
4. Submit for review (or auto-publish if verified)
5. Email notification on approval/rejection
6. Edit/cancel submitted events
```

### 2B.4 Admin Review Queue

- [ ] Admin dashboard at admin.godo.app
- [ ] List pending events with business info
- [ ] Quick actions: Approve, Reject, Request changes
- [ ] Rejection reasons (template messages)
- [ ] Bulk approve for trusted submitters
- [ ] Flag suspicious accounts

### 2B.5 Portal Tech Stack

**Option A: Separate Next.js app**
```
godo-portal/
├── app/
│   ├── (auth)/login, signup, forgot-password
│   ├── dashboard/
│   ├── events/new, [id]/edit
│   ├── venues/
│   └── settings/
├── components/
└── lib/api.ts  # Calls same backend
```

**Option B: Extend existing backend with web routes**
- Add Jinja2 templates or serve React SPA
- Simpler but less flexible

**Recommendation:** Separate Next.js app, shares backend API

### 2B.6 Portal Features

**Event Management:**
- [ ] Create event form with rich text editor
- [ ] Image upload with crop/resize
- [ ] Preview card (how it looks in app)
- [ ] Save as draft
- [ ] Schedule publish date
- [ ] Duplicate past events

**Venue Management:**
- [ ] Add/edit venues
- [ ] Venue verification request
- [ ] Map picker for coordinates
- [ ] Operating hours (for activities)

**Analytics (Future):**
- [ ] Views, swipes, "Going" counts per event
- [ ] Conversion funnel
- [ ] Audience demographics (anonymized)

### 2B.7 API for Partners

For high-volume submitters (PR agencies, venue chains):

```
POST /api/v1/business/events
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "events": [
    {
      "title": "...",
      "date_time": "...",
      "venue_id": "...",  // Pre-registered venue
      ...
    }
  ]
}

Response:
{
  "submitted": 5,
  "auto_approved": 5,
  "pending_review": 0,
  "event_ids": ["uuid1", "uuid2", ...]
}
```

### 2B.8 Implementation Tasks

- [ ] Design portal UI/UX (Figma)
- [ ] Set up Next.js project with auth
- [ ] Business signup/login flow
- [ ] Event submission form
- [ ] Image upload to Supabase Storage
- [ ] Venue management CRUD
- [ ] Admin review dashboard
- [ ] Email notifications (SendGrid/Resend)
- [ ] API key management for partners
- [ ] Analytics dashboard (future)

---

## Phase 2C: Social Media Event Extraction

Extract events from TikTok, Instagram, and other social platforms (like Rodeo).

### 2C.1 Supported Inputs

| Input Type | Example | Extraction Method |
|------------|---------|-------------------|
| Screenshot | Instagram story, DM | Vision AI (Claude) |
| URL/Link | TikTok video, IG post | Fetch + parse metadata |
| Share sheet | User shares to Godo | Deep link handler |
| Copy-paste text | Event details from chat | NLP parsing |

### 2C.2 Screenshot Extraction (Expanded)

**Supported formats:**
- Instagram stories with event details
- Instagram post screenshots
- TikTok video screenshots with text overlay
- iMessage/WhatsApp conversations
- Email invitations
- Physical flyers (photos)
- Partiful/Eventbrite share cards

**Vision AI Prompt:**
```
Extract event information from this image. Return JSON:
{
  "title": "event name",
  "date": "date in YYYY-MM-DD or natural language",
  "time": "time in HH:MM or natural language",
  "location": "venue name and/or address",
  "description": "brief description if visible",
  "price": "ticket price if visible",
  "url": "any visible URL or @handle",
  "organizer": "who's hosting if visible",
  "confidence": 0.0-1.0
}

If information is unclear or not visible, omit that field.
Handle messy layouts, overlapping text, and partial information.
```

### 2C.3 URL/Link Extraction

**TikTok:**
- [ ] Accept TikTok video URLs
- [ ] Fetch video metadata (oEmbed or scrape)
- [ ] Extract text from video description
- [ ] Parse for event details (date, location, etc.)
- [ ] Option: Send video thumbnail to Vision AI

**Instagram:**
- [ ] Accept Instagram post/reel URLs
- [ ] Fetch via official API (if user connected) or scrape
- [ ] Extract caption text
- [ ] Parse for event details
- [ ] Use image for Vision AI if text unclear

**Implementation:**
```python
async def extract_from_url(url: str) -> ExtractedEvent:
    if "tiktok.com" in url:
        return await extract_tiktok(url)
    elif "instagram.com" in url:
        return await extract_instagram(url)
    elif "partiful.com" in url:
        return await extract_partiful(url)
    elif "eventbrite.com" in url:
        return await extract_eventbrite_url(url)
    else:
        # Try generic Open Graph extraction
        return await extract_opengraph(url)
```

### 2C.4 Share Sheet Integration (iOS)

Let users share directly to Godo from other apps:

**Setup:**
- [ ] Add Share Extension to Expo app
- [ ] Register for URL types and UTIs
- [ ] Handle incoming shares (images, URLs, text)

**Flow:**
```
1. User sees event on Instagram/TikTok/iMessage
2. Taps Share → selects Godo
3. Godo receives content
4. Extracts event details
5. Shows preview for confirmation
6. Adds to calendar/saves
```

**Share Extension (iOS):**
```swift
// In Share Extension
func handleShare(items: [NSExtensionItem]) {
    for item in items {
        if let image = item as? UIImage {
            // Send to Godo app for processing
        } else if let url = item as? URL {
            // Send URL to Godo app
        } else if let text = item as? String {
            // Parse text for event details
        }
    }
}
```

### 2C.5 Text Parsing (NLP)

For copy-pasted text from messages:

**Input examples:**
```
"hey want to come to this thing friday at 8? its at House of Yes"

"RSVP for Sarah's birthday
Saturday Jan 28th
7pm at Altro Paradiso
$50 prix fixe"

"Free yoga in prospect park tomorrow morning 9am"
```

**Implementation:**
- [ ] Use Claude/GPT for entity extraction
- [ ] Or build lightweight NLP pipeline:
  - Date/time extraction (dateparser library)
  - Location NER (spaCy)
  - Price regex matching
- [ ] Geocode extracted locations
- [ ] Ask user to confirm/edit

### 2C.6 Deduplication & Matching

When user adds from social media:

1. **URL match:** Same Instagram post = same event
2. **Fuzzy match:** Similar title + date + location
3. **Venue match:** Known venue + same date
4. **User prompt:** "This looks similar to [existing event]. Same event?"

**Matching algorithm:**
```python
def find_potential_duplicates(extracted: ExtractedEvent) -> List[Event]:
    candidates = []

    # Exact URL match
    if extracted.source_url:
        exact = db.query(Event).filter(
            Event.external_url == extracted.source_url
        ).first()
        if exact:
            return [exact]

    # Fuzzy title + date
    similar = db.query(Event).filter(
        Event.date_time.between(
            extracted.date - timedelta(hours=2),
            extracted.date + timedelta(hours=2)
        ),
        func.similarity(Event.title, extracted.title) > 0.6
    ).all()

    return similar
```

### 2C.7 Social Account Connection (Optional)

Let users connect Instagram/TikTok for easier extraction:

**Benefits:**
- Access private/friends-only content
- Pull from saved posts
- Import "interested" events

**Privacy considerations:**
- Only access what user explicitly shares
- Don't scrape without permission
- Clear data handling policy

### 2C.8 Implementation Tasks

- [ ] Backend endpoint: `POST /api/v1/events/extract`
  - Accepts: image file, URL, or text
  - Returns: extracted event + confidence
- [ ] Vision AI integration (Claude Vision)
- [ ] URL metadata fetchers (TikTok, Instagram, etc.)
- [ ] Text parsing with NLP
- [ ] Share Extension for iOS
- [ ] Frontend: share handler in app
- [ ] Frontend: paste URL/text input
- [ ] Deduplication matching
- [ ] User confirmation UI

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

### Infrastructure (Have)
| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Database, Auth, Storage | ✅ Have |
| Railway | Backend hosting | ✅ Have |
| Redis | Caching, Celery broker | ✅ Optional |

### AI & Extraction (Need)
| Service | Purpose | Cost | Priority |
|---------|---------|------|----------|
| Claude API | Screenshot/image extraction | ~$0.01-0.05/image | High |
| OpenAI GPT-4V | Backup vision extraction | ~$0.01-0.03/image | Low |

### Calendar Integration (Need)
| Service | Purpose | Setup Required |
|---------|---------|----------------|
| Google Cloud | Calendar OAuth | Create project, enable Calendar API, OAuth consent |
| Apple | iOS Calendar | Just expo-calendar package, no API key |

### Event Sources (Need)
| Service | API Type | Cost | Rate Limit |
|---------|----------|------|------------|
| NYC Open Data | REST (SODA) | Free | Unlimited with token |
| Eventbrite | REST + OAuth | Free tier | 1000 req/day |
| Ticketmaster | REST | Free tier | 5000 req/day, 5 req/sec |
| Meetup | GraphQL + OAuth | Free | Varies |
| Resy | Unofficial/scrape | Free | Be gentle |
| DICE | Scraping | Free | Be gentle |

### Enrichment (Optional)
| Service | Purpose | Cost |
|---------|---------|------|
| Google Maps Geocoding | Address → coordinates | $5/1000 requests |
| Nominatim (OSM) | Free geocoding alternative | Free, rate limited |
| Mapbox | Alternative geocoding | Free tier available |

### Business Portal (Need)
| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Portal hosting | Free tier |
| Resend/SendGrid | Email notifications | Free tier |
| Stripe | Future: paid listings | Free + transaction fee |

### Monitoring (Recommended)
| Service | Purpose | Cost |
|---------|---------|------|
| Sentry | Error tracking | Free tier |
| PostHog/Mixpanel | Analytics | Free tier |

---

## Immediate Next Steps

1. **Now**: Connect frontend to backend (Phase 1)
2. **Next**: Seed database with real events (Phase 2.4 - manual seed)
3. **Then**: Apple Calendar write sync (Phase 4.2)
4. **After**: Screenshot extraction (Phase 6)

---

## Open Decisions

### User Experience
- [ ] Create dedicated "Godo" calendar or use user's default?
- [ ] Activity discovery: separate tab or mixed in main feed?
- [ ] How to surface user-submitted events vs scraped events?

### Technical
- [ ] Screenshot processing: on-device OCR fallback or backend-only?
- [ ] Image hosting: hotlink source images or re-host on Supabase Storage?
- [ ] Scraper infrastructure: Celery workers on Railway or separate service?

### Business & Moderation
- [ ] Moderation approach: manual review or auto-approve with confidence threshold?
- [ ] Free tier limits: how many screenshot extractions per month?
- [ ] Business portal: free listings or paid promotion options?
- [ ] How to verify business accounts? (ID, business license, etc.)

### Legal & Compliance
- [ ] Resy/DICE scraping: legal review needed before production
- [ ] User data from connected social accounts: privacy policy updates
- [ ] GDPR/CCPA compliance for business accounts

### Prioritization
- [ ] Which scrapers to build first? (NYC Parks + Eventbrite recommended)
- [ ] Business portal: before or after social extraction?
- [ ] When to launch publicly vs private beta?
