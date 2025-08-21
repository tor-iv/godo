# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"godo" is an event discovery app for young professionals in NYC that helps users get off their phones and discover local events. The app uses a Tinder-like swipe interface to browse curated events and build personalized calendars with social features. The main goal is to sync with calendar for follow-through on attending events.

## Technology Stack

- **Frontend**: React Native with Expo SDK 53
- **Language**: TypeScript with strict mode
- **Navigation**: React Navigation 6 (Bottom Tabs + Stack)
- **State Management**: TanStack Query (React Query) v5
- **Animations**: React Native Reanimated 3
- **Gestures**: React Native Gesture Handler
- **Calendar**: react-native-calendars
- **Date Handling**: date-fns v4
- **Storage**: AsyncStorage
- **Icons**: Expo Vector Icons

## Development Commands

**Core Commands:**
- `npm start` or `npx expo start` - Start development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run on web
- `npm run clear` - Clear Metro cache
- `npm run tunnel` - Start with tunnel for external device access

**Code Quality:**
- `npm run typecheck` - Run TypeScript type checking (`tsc --noEmit`)
- `npm run lint` - Run ESLint on src/ directory
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

**Dependencies:**
- `npm install` - Install dependencies
- `npx expo install [package]` - Install Expo-compatible package

## Core Architecture

### Event Data System
The app is built around a comprehensive event aggregation system that pulls from multiple NYC data sources:

**Event Adapters Pattern:**
- `BaseEventAdapter` - Abstract class defining the adapter interface
- `EventAggregatorService` - Orchestrates multiple adapters and aggregates results
- Individual adapters: `EventbriteAdapter`, `TicketmasterAdapter`, `NYCParksAdapter`, `MetMuseumAdapter`, `NYCOpenDataAdapter`

**Event Type System:**
```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  datetime: string; // ISO string for compatibility
  location: { name: string; address: string; coordinates: {lat, lng} };
  venue: { name: string; neighborhood?: string };
  category: EventCategory; // NETWORKING, CULTURE, FITNESS, FOOD, NIGHTLIFE, OUTDOOR, PROFESSIONAL
  source: EventSource; // EVENTBRITE, RESY, NYC_PARKS, etc.
  // ... additional metadata
}
```

### Design System Architecture
The app uses a dual design system for backwards compatibility during migration:

**New Design System (Preferred):**
- `src/design/tokens.ts` - Core design tokens (colors, spacing, typography)
- `src/design/types.ts` - TypeScript interfaces for design system
- Access via: `import { typography, colors, spacing } from '../../design'`

**Legacy System (Deprecated):**
- `src/constants/index.ts` - Legacy constants
- Use new system for all new components

**Responsive Utilities:**
- `src/utils/responsive.ts` - Screen size detection and responsive scaling
- Functions always return numbers (never undefined) for type safety

### Swipe Interface System
**Core Swipe Actions:**
- **Up Swipe**: Add to public calendar (green flash #10B981)
- **Down Swipe**: Add to private calendar (blue flash #3B82F6) 
- **Right Swipe**: Save for later (gray flash #9CA3AF)
- **Left Swipe**: Not interested (red flash #FCA5A5)

**Components:**
- `SwipeCard` - Individual event card with gesture handling
- `SwipeStack` - Stack of cards with physics and animations
- `SwipeOverlay` - Visual feedback during swipe gestures

### Navigation Architecture
Two-tab structure with nested stacks:
- **Discover Tab**: Main event feed (`DiscoverScreen` with swipe interface)
- **My Events Tab**: Calendar views (`CalendarScreen` with multiple view modes)

## Event Category System
Events are categorized into:
- `NETWORKING` - Professional networking events
- `CULTURE` - Museums, art, performances
- `FITNESS` - Sports, yoga, outdoor activities  
- `FOOD` - Restaurants, food events
- `NIGHTLIFE` - Bars, clubs, social events
- `OUTDOOR` - Parks, outdoor activities
- `PROFESSIONAL` - Business, conferences

## Important Implementation Notes

**Type Safety:**
- All responsive utility functions return concrete values, never undefined
- Event adapters must implement full Event interface with required datetime and venue fields
- SwipeDirection enum is exported from types/index.ts

**Performance:**
- Animations target 60fps using Reanimated 3
- Card stack optimized with lazy loading
- Image caching implemented for event photos

**API Integration:**
- All external APIs go through adapter pattern
- EventAggregatorService handles multiple simultaneous API calls
- Built-in validation ensures data consistency across sources

**ESLint Configuration:**
- Uses ESLint v9 with flat config format (`eslint.config.js`)
- TypeScript and Prettier integration configured
- Warns on unused variables and missing types