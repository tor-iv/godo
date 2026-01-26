# Screenshot-to-Event & Calendar Integration Design

## Overview

Enable users to add events via screenshots (AI extraction) and sync with native calendars (Apple/Google). Inspired by Rodeo's approach to frictionless event capture.

---

## Feature 1: Screenshot-to-Event

### User Flow

```
1. User taps "Add Event" → Options: "From Screenshot" / "Manual Entry"
2. User selects/captures screenshot (Instagram story, text, flyer, etc.)
3. AI extracts event details → Shows editable preview card
4. User confirms/edits fields
5. Choose visibility: "Just me" / "Share with friends" / "Submit to feed"
6. Event saved to calendar + optionally shared
```

### AI Extraction Pipeline

**Input**: Image (screenshot, photo of flyer, etc.)

**Output**:
```typescript
{
  title: string;
  description?: string;
  date_time?: string;      // ISO 8601
  end_time?: string;
  location_name?: string;
  location_address?: string;
  price_min?: number;
  price_max?: number;
  source_url?: string;     // If visible in screenshot
  confidence: number;      // 0-1, overall extraction confidence
  fields_confidence: {     // Per-field confidence
    title: number;
    date_time: number;
    location: number;
  };
}
```

**Implementation Options**:

| Option | Pros | Cons |
|--------|------|------|
| Claude Vision API | High accuracy, handles messy layouts | Cost per image (~$0.01-0.05) |
| GPT-4V | Similar quality | Similar cost |
| On-device (Apple Vision) | Free, fast, private | Lower accuracy for complex layouts |
| Hybrid | Best of both | More complexity |

**Recommendation**: Claude Vision API via backend endpoint. On-device OCR as fallback for simple text.

### Backend Endpoint

```
POST /api/v1/events/extract-from-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: { image: File }

Response: {
  extracted: ExtractedEventData,
  suggestions: {
    similar_events: Event[],  // Deduplication check
    venue_match?: Venue,      // Known venue detected
  }
}
```

### Deduplication

Before saving user-submitted events:
1. Check `external_url` if extracted
2. Fuzzy match on title + date + location
3. If duplicate found → prompt user: "This event may already exist. View it?"

### Moderation (for public submissions)

```
moderation_status: "pending" | "approved" | "rejected"
```

- Personal/friends-only events: Auto-approved
- Public feed submissions: Queue for review OR auto-approve with confidence > 0.8

---

## Feature 2: Apple Calendar Integration

### Capabilities

| Feature | Direction | Notes |
|---------|-----------|-------|
| Read iOS events | iOS → Godo | Find free time, suggest events |
| Write Godo events | Godo → iOS | Swiped "Going" syncs to calendar |
| Real-time sync | Bidirectional | Optional, battery consideration |

### Required Permissions

```xml
<!-- Info.plist -->
<key>NSCalendarsUsageDescription</key>
<string>Godo uses your calendar to find the best times for events and sync your plans.</string>
```

### React Native Implementation

**Option A: expo-calendar (Recommended for Expo)**
```typescript
import * as Calendar from 'expo-calendar';

// Request permission
const { status } = await Calendar.requestCalendarPermissionsAsync();

// Get calendars
const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

// Read events
const events = await Calendar.getEventsAsync(
  [calendarId],
  startDate,
  endDate
);

// Create event
await Calendar.createEventAsync(calendarId, {
  title: event.title,
  startDate: new Date(event.date_time),
  endDate: new Date(event.end_time),
  location: event.location_address,
  notes: `Added from Godo\n${event.external_url || ''}`,
});
```

**Option B: react-native-calendar-events**
- More features but requires bare workflow or config plugin

### Sync Strategy

**On swipe "Going" (RIGHT/UP):**
1. Create calendar event in default/Godo calendar
2. Store `calendar_event_id` in `event_attendance` table
3. If user removes from Godo → delete from calendar

**Free time detection:**
```typescript
// Find gaps in user's calendar for event suggestions
async function findFreeSlots(date: Date): Promise<TimeSlot[]> {
  const events = await Calendar.getEventsAsync([...], startOfDay, endOfDay);
  // Return gaps between events
}
```

### Data Model Addition

```sql
-- Add to event_attendance table
ALTER TABLE event_attendance
ADD COLUMN calendar_event_id TEXT,
ADD COLUMN calendar_source TEXT; -- 'apple' | 'google' | 'godo_only'
```

---

## Feature 3: Google Calendar Integration

### OAuth Flow

```
1. User taps "Connect Google Calendar"
2. OAuth redirect → Google consent screen
3. Callback with auth code
4. Exchange for access + refresh tokens
5. Store tokens securely (Supabase vault or encrypted)
```

### Required Scopes

```
https://www.googleapis.com/auth/calendar.readonly  // Read events
https://www.googleapis.com/auth/calendar.events    // Create/modify events
```

### Backend Endpoints

```
GET  /api/v1/integrations/google/auth-url     → Returns OAuth URL
POST /api/v1/integrations/google/callback     → Handles OAuth callback
GET  /api/v1/integrations/google/calendars    → List user's calendars
GET  /api/v1/integrations/google/events       → Fetch events (with caching)
POST /api/v1/integrations/google/sync         → Push Godo event to Google
DELETE /api/v1/integrations/google/disconnect → Revoke access
```

### Token Storage

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google_calendar' | 'apple_calendar'
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT, -- Selected calendar for sync
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

---

## Content Types: Events vs Activities vs Seasonal

### Schema Extension

```sql
ALTER TABLE events ADD COLUMN content_type TEXT DEFAULT 'event';
-- Values: 'event' | 'activity' | 'seasonal'

ALTER TABLE events ADD COLUMN recurrence_rule TEXT;
-- iCal RRULE format: "FREQ=WEEKLY;BYDAY=SA"

ALTER TABLE events ADD COLUMN season_start DATE;
ALTER TABLE events ADD COLUMN season_end DATE;
-- For seasonal: available Nov 15 - Mar 15

ALTER TABLE events ADD COLUMN availability_hours JSONB;
-- For activities: {"monday": ["10:00-18:00"], "tuesday": ["10:00-18:00"], ...}
```

### Content Type Behavior

| Type | date_time | Expiration | Example |
|------|-----------|------------|---------|
| Event | Required, specific | After end_time | "Jazz concert Jan 30 8pm" |
| Activity | Optional (next occurrence) | Never | "Knitting at Brooklyn Yarn" |
| Seasonal | Optional | After season_end | "Ice skating at Rockefeller" |

### Feed Logic

```python
def get_feed_events(user, time_filter):
    if time_filter == "happening_now":
        # Events starting within 6 hours
        # Activities open right now (check availability_hours)
        # Seasonal items currently in season
    else:
        # Future events
        # Activities (always show)
        # Seasonal coming up
```

---

## Implementation Phases

### Phase 1: Calendar Sync (Foundation)
- [ ] Add `expo-calendar` to project
- [ ] Request calendar permissions on onboarding
- [ ] Write "Going" events to iOS calendar
- [ ] Store calendar_event_id in event_attendance
- [ ] Delete from calendar when user removes from Godo

### Phase 2: Screenshot Extraction
- [ ] Backend endpoint for image upload
- [ ] Claude Vision API integration
- [ ] Extraction prompt engineering
- [ ] Frontend UI: capture/select image
- [ ] Preview & edit extracted data
- [ ] Deduplication check
- [ ] Save as user-generated event

### Phase 3: Google Calendar
- [ ] Google OAuth setup (Cloud Console)
- [ ] Backend OAuth flow endpoints
- [ ] Token storage & refresh logic
- [ ] Read Google events for free time
- [ ] Write Godo events to Google Calendar
- [ ] Settings UI for connect/disconnect

### Phase 4: Content Types
- [ ] Schema migration for content_type, recurrence, seasons
- [ ] Update feed query logic
- [ ] UI indicators for activities vs events
- [ ] Admin/scraper support for activity imports

---

## Open Questions

1. **Calendar selection**: Let user pick which calendar to sync to, or create a "Godo" calendar?
2. **Conflict handling**: What if user deletes event from native calendar? Detect & update Godo?
3. **Screenshot privacy**: Process on-device vs send to backend? (Backend needed for Claude Vision)
4. **Activity discovery**: How do users find activities? Separate tab, or mixed in feed?
5. **Seasonal boundaries**: Hard dates or weather-dependent?

---

## References

- [Rodeo App](https://www.tryrodeo.com/) — Calendar sharing startup
- [expo-calendar docs](https://docs.expo.dev/versions/latest/sdk/calendar/)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Claude Vision API](https://docs.anthropic.com/claude/docs/vision)
