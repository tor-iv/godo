# Events Discovery App - Complete Frontend Specification

## Overview

A mobile-first events discovery application with an ultra-clean, minimal interface inspired by modern AI assistants. The design prioritizes content over chrome, using typography and spacing rather than colors to create hierarchy.

## Core Design Philosophy

- **95% Grayscale**: Interface uses primarily whites, grays, and blacks
- **Intentional Color**: Color appears only during micro-interactions (200ms flashes)
- **Hidden Complexity**: Gestures reveal actions, keeping the UI uncluttered
- **Content First**: Event information takes precedence over UI elements
- **Generous Whitespace**: Breathing room between all elements

---

## Design System

### Color Palette

```
Primary Palette (Grayscale):
- Background: #FFFFFF (pure white)
- Card Surface: #FAFAFA (barely visible gray)
- Border: #F3F4F6 (subtle lines when needed)
- Text Primary: #111827 (near black)
- Text Secondary: #6B7280 (medium gray)
- Text Tertiary: #9CA3AF (light gray)

Action Colors (Used only for 200ms confirmations):
- Public Calendar: #10B981 (green flash on upward swipe)
- Private Calendar: #3B82F6 (blue flash on downward swipe)
- Save for Later: #9CA3AF (gray flash on right swipe)
- Not Interested: #FCA5A5 (soft red flash on left swipe)
```

### Typography

```
Font Family: System default
(-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)

Hierarchy:
- Screen Title: 24px, regular weight, #111827
- Event Title: 18px, medium weight, #111827
- Time/Date: 14px, regular weight, #111827
- Location: 14px, regular weight, #6B7280
- Price: 14px, medium weight, #111827
- Metadata: 12px, regular weight, #9CA3AF
```

### Spacing System

```
Base unit: 8px

Spacing scale:
- xs: 8px
- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px
- 2xl: 64px

Component spacing:
- Between cards: 16px
- Card padding: 16px
- Between text elements: 8px
- Screen padding: 16px horizontal
```

---

## Main Screens

### Discovery Screen (Home)

#### Header

- White background
- "Discover" in 24px, regular weight, left-aligned
- Simple time toggle: "Now • Later" as text buttons
- 16px padding all around
- Thin bottom border (#F3F4F6, 1px)

#### Event Cards

```
Structure (top to bottom):
1. Image container (16:9 ratio, 8px rounded corners)
2. Content area (16px padding):
   - Event title (18px, medium, #111827)
   - Date & time (14px, regular, #111827)
   - Location (14px, regular, #6B7280)
   - Price if applicable (14px, medium, #111827)

No overlays, no badges, no category colors
```

#### Navigation

- Bottom border (1px, #F3F4F6)
- Two text buttons: "Discover" and "My Events"
- Active state: text becomes #111827 (from #6B7280)
- No icons, no background colors
- Height: 48px

### My Events Screen

#### View Controls

- Simple text toggles: "List • Day • Week • Month"
- Active view in #111827, others in #6B7280
- No backgrounds, no pills, just text

#### List View (Default)

- White background
- 16px padding per event
- Time (14px, #111827) left-aligned
- Event title (16px, medium, #111827)
- Location (14px, #6B7280)
- Small dot indicator (4px) for calendar status:
  - Green dot: Public calendar
  - Blue dot: Private calendar
  - Gray dot: Saved for later

#### Day View

- Date header: "Thursday, July 31" (16px, #111827)
- Time slots as simple text (14px, #9CA3AF)
- Events as minimal rectangles with 1px border

#### Week View

- Week header: "Jul 28 - Aug 3" (16px, #111827)
- 7 columns with day abbreviations
- Events as small dots with number if multiple

#### Month View

- Month/Year header (16px, #111827)
- Standard calendar grid
- Current date: Bold text
- Events: Small dot under date number

---

## Interactions & Gestures

### Swipe Actions (Main Feature)

#### Visual Feedback During Swipe

- Card tilts slightly (3-5 degrees)
- Subtle shadow appears
- Directional indicator fades in:
  - Up: "→ Public" at 30% opacity
  - Down: "→ Private" at 30% opacity
  - Right: "→ Later" at 30% opacity
  - Left: "→ Skip" at 30% opacity

#### On Release

- Quick color flash (200ms) in swipe direction
- Card animates back to position
- Confirmation toast appears at bottom

### Confirmation Toasts

- Position: Bottom of screen, 16px margin
- Background: #FAFAFA with 1px border
- Duration: 2 seconds fade in/out
- Messages:
  - "Added to public calendar"
  - "Added to private calendar"
  - "Saved for later"
  - "Removed from suggestions"

### Long Press Menu

- Share event
- Hide events from this venue
- Report issue
- Copy event details

---

## Event Detail View

### Trigger

- Tap/click on any event card

### Layout

- Slides up from bottom (mobile) or modal (desktop)
- 90% screen height
- Dismissible via swipe down, X button, or tap outside

### Content Structure

1. Hero image (full width)
2. Title and essential info (sticky header)
3. Description (expandable if > 3 lines)
4. Host information
5. Attendee avatars (if friends attending)
6. Map preview (tappable)
7. Fixed action buttons:
   - Add to Calendar
   - Share
   - Get Directions

---

## Search & Filters

### Search (Hidden by Default)

- Pull down on main feed to reveal
- Simple text input
- Real-time suggestions
- Recent searches below

### Filter Options

Access via "Filter" text button:

- Distance: Slider (1-25 miles)
- Date: Today, Tomorrow, This Week, Custom
- Time: Morning, Afternoon, Evening, Night
- Price: Free, $, $$, $$$, Any

Active filters shown as tags:
"Within 5 miles • This week • Free"

---

## Onboarding Flow

### Screen 1: Welcome

- "Discover local events"
- "Swipe to control"
- Animation showing 4 swipe directions

### Screen 2: Gesture Tutorial

- Interactive practice card
- Ghost hand animations
- Feedback for each action

### Screen 3: Preferences (Optional)

- Simple interest toggles
- Distance preference
- Price range
- Skip option available

No account required initially

---

## Empty States & Errors

### Empty States

```
No Events Found:
- Simple line art illustration
- "No events right now"
- "Check back later or adjust filters"

No Internet:
- "You're offline"
- "Saved events are still available"
```

### Error States

```
Failed to Load:
- "Something went wrong"
- "Tap to retry"

Location Denied:
- "We need your location for nearby events"
- "Enable in Settings"
- "Or enter zip code"
```

---

## Calendar Integration

### Public Calendar

- Visible to friends (if connected)
- Appears in public profile
- Others see you're attending
- Allows event discussion

### Private Calendar

- Only you can see
- No social features
- For professional/personal events
- Can move to public later

### Both Types

- Optional device calendar sync
- Customizable reminders
- Export to Google/Apple Calendar

---

## Settings Menu

### Account

- Sign in/Sign up (optional)
- Profile (if signed in)

### Preferences

- Default calendar (Public/Private)
- Distance units (Miles/Km)
- Price currency
- Week start day

### Notifications

- Event reminders (toggle)
- Reminder time options
- Weekly digest (toggle)

### Privacy

- Location permissions
- Social visibility
- Clear history

---

## Social Features (Optional)

### Friend Activity

- Small avatars on event cards
- "2 friends attending" text
- Completely optional
- Can be disabled

### Sharing

- Clean preview card
- Deep linking
- Copy link option
- No aggressive branding

---

## Performance & Loading

### Loading States

- Skeleton cards (no spinner)
- Progressive content reveal
- Images fade in when loaded

### Infinite Scroll

- Load more at 80% scroll
- Minimal loader at bottom
- "End of events" message

### Background Updates

- Silent refresh every 5 minutes
- New event count badge
- Pull to reveal new events

---

## Offline Behavior

### Works Offline

- View saved/calendar events
- Browse cached feed (last 50)
- See calendar views
- Change preferences

### Requires Internet

- Discovering new events
- Calendar sync
- Event updates
- Social features

---

## Navigation Rules

### Android Back Button

- From detail → returns to feed
- From filters → closes filter
- From main feed → exit confirmation

### Swipe Navigation

- No horizontal swipe between screens
- Only vertical scroll and card swiping
- Prevents gesture conflicts

### Deep Linking

- Events shareable via URL
- Opens directly to detail
- App download prompt if needed

---

## Business Logic

### Event Ordering (Now)

1. Starting within 2 hours
2. Nearest location first
3. Popular events higher
4. Hide if started > 30 min ago

### Event Ordering (Later)

1. Chronological by date
2. Then by time
3. Then by distance

### Duplicate Prevention

- Hidden after "not interested"
- Similar events grouped
- Recurring shown once with badge

---

## Micro-Delights

### Haptic Feedback

- Light tap on swipe action
- Success vibration on calendar add

### Pull-to-Refresh

- Minimal elastic bounce
- Simple spinner

### Achievement Moments

- "You're all caught up" at feed end
- "No events missed" notification
- 1-second confetti on first event

### Weather Integration

- Small icon for outdoor events
- "Great weather expected"
- "Indoor alternative" for rain

---

## Technical Implementation

### Data Structure

```javascript
{
  id: string,
  title: string,
  datetime: Date,
  location: {
    name: string,
    address: string
  },
  price: number | null,
  imageUrl: string,
  status: null | 'public' | 'private' | 'saved'
}
```

### Recommended Stack

```
Core:
- React (or Preact for smaller bundle)
- TypeScript
- CSS Modules or vanilla CSS
- Native fetch API

Styling:
- Custom CSS with variables
- No UI libraries
- System font stack
- CSS Grid/Flexbox only

State:
- React Context
- Local state
- Session storage
- No external state libraries
```

### Performance Targets

- First Contentful Paint: < 1.2s
- Time to Interactive: < 2.5s
- Cumulative Layout Shift: < 0.1
- Bundle size: CSS < 10KB, JS < 50KB

---

## Accessibility

### WCAG 2.1 AA Compliance

- All text meets 4.5:1 contrast minimum
- 2px solid outline for keyboard focus
- Semantic HTML structure
- ARIA labels for actions
- Screen reader announcements

### Inclusive Design

- Respect reduced motion preferences
- High contrast mode support
- Responsive to system font size
- Minimum 44px tap targets

---

## Summary

This app embraces radical minimalism:

- **No persistent colors** except grayscale
- **No visible categories** or badges
- **Hidden actions** revealed through gestures
- **Typography and spacing** create hierarchy
- **Micro-interactions** provide feedback
- **Content is king** - UI disappears

The result is a calm, focused, and sophisticated interface that lets users discover events without distraction.
