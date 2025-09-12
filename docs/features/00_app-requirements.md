# Event Discovery App - Requirements Document

## Project Overview
A Tinder-like event discovery app for young professionals in NYC, allowing users to swipe through events and build personalized calendars with social features.

## Technical Stack
- **Frontend**: React Native (Expo)
- **Backend**: Python
- **Database**: Supabase
- **Platforms**: iOS (primary), Android (secondary)
- **Target Market**: NYC young professionals

## Core Features

### 1. Event Swiping Interface
**Swipe Mechanics:**
- **Right Swipe**: "Want to go" - adds event to personal calendar
- **Left Swipe**: "Not interested" - removes from feed
- **Up Swipe**: "Save for later" - adds to saved stack for future consideration
- **Down Swipe**: "Like but can't go" - saves for potential future interest/sharing

**Feed Toggle:**
- Switch between "Happening Now" and "Planning Ahead" modes
- Single unified feed per mode
- Smooth transition between timeframes

### 2. Personal Calendar & Saved Events
- Display all right-swiped events in calendar view
- "Saved for Later" stack (up-swiped events) with easy access
- "Liked but Can't Go" collection for sharing/future reference
- Include direct links to event pages/tickets
- Calendar view (daily, weekly, monthly)
- Event details and reminders

### 3. Social Features (MVP)
- Friend connection system
- Icons showing which friends are interested in events
- Basic friend activity visibility
- Share "liked but can't go" events with friends
- Group event interest indicators

## Functional Requirements

### User Authentication & Onboarding
- Social login (Google, Apple, Facebook)
- Profile creation with preferences
- Location verification (NYC focus initially)
- Interest/category selection
- Age and demographic info

### Event Discovery Engine
- Curated event feed based on user preferences
- Location-based filtering
- Category filtering (nightlife, networking, culture, sports, etc.)
- Time-based filtering (today, this week, this month)
- Machine learning recommendations based on swipe history

### Event Data Management
**Initial Data Sources (Manual Curation):**
- Pop-up events and experiences
- Restaurant reservations (Resy/OpenTable integration)
- Concerts and live music venues
- Art galleries and museum exhibitions
- Fitness classes and wellness events
- Networking and professional events
- Food festivals and markets
- Outdoor activities and sports

**Focus Areas:**
- **Phase 1**: Daytime events (brunches, fitness, networking, cultural)
- **Phase 2**: Nightlife integration (bars, clubs, late-night dining)

**Data Management:**
- Manual event curation initially
- Real-time event updates
- Event categorization and tagging
- Image and media handling
- Venue information and maps integration

### User Profile & Preferences
- Swipe history tracking
- Interest categories
- Notification preferences
- **Calendar Privacy Settings:**
  - Private (default) - Only user sees full calendar
  - Friends only - Friends see public events you're attending
  - Public events only - Others see attendance at concerts, festivals, etc.
- Calendar sync options

### Social Privacy Features
**Friend Visibility Rules:**
- Friends can see mutual event interest (when both interested in same event)
- Friends can see your attendance at public events (concerts, festivals)
- Friends CANNOT see: Private dining reservations, personal appointments, saved stacks
- Default privacy setting: Private calendar

## User Experience Requirements

### Onboarding Flow
1. Welcome and app explanation
2. Account creation/login
3. Location permission
4. Interest selection
5. Tutorial on swiping mechanics
6. First curated feed presentation

### Core User Journey
1. Open app to main "Discover" feed
2. Toggle between "Happening Now" and "Planning Ahead" modes
3. Swipe through events with smooth animations
4. Switch to "My Events" tab to view personal calendar
5. Access saved stacks and liked collections within My Events
6. View event details and external links
7. Access profile settings and privacy controls via top-right icon

### Navigation Structure
**2-Tab Layout:**
- **Tab 1**: "Discover" - Main event feed (FYP equivalent)
- **Tab 2**: "My Events" - Personal calendar and saved collections
- **Profile**: Accessible via top-right icon or gesture (not dedicated tab)

**Feed Tab Features:**
- Main swiping interface
- Toggle: "Happening Now" / "Planning Ahead" 
- Filter options (category, time, location)

**My Events Tab Structure:**
- Default view: Calendar of confirmed events (right swipes)
- Secondary sections via top navigation:
  - "Saved for Later" stack (up swipes)
  - "Liked but Can't Go" collection (down swipes)

### Interface Design & Branding
**Color Scheme:**
- Primary: Purple (sophisticated, premium feel)
- Secondary: White/off-white (clean, minimal)
- Supporting: Light purple/lavender for secondary elements
- Text: Dark purple on white, white on purple backgrounds

**Design Principles:**
- Clean, minimal design similar to dating apps
- Large, engaging event imagery with purple overlays/frames
- Clear action buttons with purple CTAs
- Intuitive navigation between feed and calendar
- Purple gradient accents for premium feel
- High contrast for mobile readability

## Technical Requirements

### Performance
- Smooth 60fps swiping animations
- Fast image loading and caching
- Offline capability for saved events
- Push notification system
- Background app refresh for new events

### Data Architecture
- User profiles and preferences
- Event data with rich metadata
- Swipe history and analytics
- Social connections (future)
- Real-time sync across devices

### Security & Privacy
- Secure user authentication
- Data encryption
- Privacy-compliant friend suggestions
- Location data protection
- GDPR/CCPA compliance

## Integration Requirements

### External APIs
**Initial Integrations:**
- Resy API for restaurant reservations
- OpenTable API for dining experiences
- Venue-specific APIs for concerts/events
- Maps integration (Google Maps/Apple Maps)
- Calendar sync (Google Calendar, Apple Calendar)

**Future Integrations:**
- Eventbrite, Facebook Events (automated)
- Social media integration
- Payment processing (future ticketing feature)
- Fitness class booking platforms

### Analytics & Monitoring
- User engagement tracking
- Swipe pattern analysis
- Event popularity metrics
- App performance monitoring
- Crash reporting

## Future Feature Considerations

### Phase 2 Enhancements
- Nightlife events integration
- Advanced group event planning
- Event check-ins and reviews
- In-app messaging
- Event creation for users
- Automated event API integrations

### Phase 3 Possibilities
- Ticket purchasing integration
- Event recommendations for friends
- Location expansion beyond NYC
- Premium subscription features
- Corporate event partnerships

## Success Metrics
- Daily active users
- Events added to calendars (right swipes)
- Event attendance conversion
- User retention rates
- Social engagement levels

## Open Questions for Further Discussion
1. **Saved stack UI** - How should the "Save for Later" stack be organized and accessed?
2. **Friend discovery** - How do users find and connect with friends initially?
3. **Event curation process** - What's the workflow for manually adding events?
4. **Nightlife timeline** - When to introduce evening/nightlife events?
5. **Monetization strategy** - Premium features, venue partnerships, or advertising?
6. **Geographic expansion** - Timeline for other cities after NYC?