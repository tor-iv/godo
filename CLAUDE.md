# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Godo is a Tinder-like event discovery app for NYC young professionals. Users swipe through events with 4-directional gestures, manage a personal calendar, and share plans with friends.

**Stack:**
- Frontend: React Native (Expo 53) + TypeScript
- Backend: Python FastAPI
- Database: Supabase (PostgreSQL)
- Background Jobs: Celery + Redis

## Common Commands

```bash
# Local development (recommended for frontend)
npm run setup:local          # First-time setup
npm start                    # Start Expo dev server
npm run ios                  # iOS simulator
npm run android              # Android emulator

# Docker (for full-stack)
npm run setup:docker
npm run dev                  # Start all services

# Code quality
npm run typecheck            # TypeScript checking
npm run lint                 # ESLint
npm run lint:fix             # Auto-fix linting
npm run format               # Prettier

# Testing
npm test                     # All tests
npm run test:unit            # Unit tests only
npm run test:watch           # Watch mode

# Backend
npm run backend:up           # Start backend services
npm run backend:test         # Run Python tests
npm run backend:migrate      # Database migrations
npm run services:up          # Start Supabase, Redis
```

## Architecture

### Navigation Structure

Three-tab bottom navigation (Calendar, Discover, Profile), each with its own stack navigator:
- `RootNavigator` → `TabNavigator` → Stack navigators per tab
- Tab config in `godo-app/src/navigation/TabNavigator.tsx`

### 4-Direction Swipe System

The core interaction uses directional swipes on event cards:
- **Right**: "Going" (private calendar)
- **Up**: "Going & Share" (visible to friends)
- **Left**: "Not Interested" (ML negative signal)
- **Down**: "Maybe Later" (saved for future)

Frontend swipe state is tracked in `EventService` singleton (`godo-app/src/services/EventService.ts`).
Backend records swipes via `POST /api/v1/swipes/` which also updates `event_attendance` table.

### Time-Based Discovery Toggle

Discover screen toggles between:
- **"Happening Now"**: Events within 6 hours
- **"Future Events"**: Events 6+ hours away

Filtering via `EventService.getUnswipedEventsByTime(TimeFilter)`.

### API Routes (Implemented)

- `/api/v1/auth/` - Authentication (signup, login, refresh, logout)
- `/api/v1/users/` - User management and profile
- `/api/v1/events/` - `GET /feed` (personalized), `GET /{event_id}`
- `/api/v1/swipes/` - `POST /` (creates swipe + updates attendance)

Groups and notifications routers are planned but not implemented.

### Key Services

**Frontend (`godo-app/src/services/`):**
- `EventService.ts` - Singleton managing events and swipe state (currently uses mock data)
- `SwipeInteractionTracker.ts` - Tracks swipe analytics and context
- `ApiService.ts` - HTTP client wrapper
- `BackendAuthService.ts` - Auth token management

**Backend (`backend/app/`):**
- `database.py` - Supabase connection via `db_manager`
- `middleware/auth.py` - JWT authentication middleware
- `routers/` - FastAPI route handlers

## Design System

British Racing Green (#004225) palette with flat design (no gradients/shadows except subtle depth).

Key files:
- `godo-app/src/design/flatTokens.ts` - Design tokens
- `godo-app/src/design/greenPalette.ts` - Color palette
- `godo-app/src/design/designSystem.ts` - Complete system

Design principles:
- Extreme minimalism, generous whitespace
- 4px spacing base unit
- Touch targets minimum 44x44 points
- SF Pro (iOS) / Roboto (Android)

## Code Style

- 2-space indentation
- camelCase for TypeScript, snake_case for Python
- Components should be small and focused
- Maintain 60fps for swipe animations

## Current State

- Frontend uses mock data in `EventService`; backend API integration exists but ML recommendations return placeholder scores
- Real-time features depend on Supabase Realtime configuration
- iOS simulator required for iOS testing (macOS only)

## Key Documentation

- `docs/architecture/BACKEND_ARCHITECTURE.md` - ML pipeline design
- `docs/features/ENHANCED_SWIPE_SYSTEM.md` - Swipe implementation
- `docs/features/DISCOVER_TOGGLE_IMPLEMENTATION.md` - Time toggle spec
- `docs/design/UI_UX_DESIGN_GUIDE.md` - Design specifications
- `docs/setup/day-1-setup-guide.md` - New developer setup