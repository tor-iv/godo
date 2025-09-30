# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Godo is a Tinder-like event discovery app for NYC young professionals. Users swipe through events with 4-directional gestures, manage a personal calendar, and share plans with friends. The app combines curated NYC events with ML-powered recommendations and social features.

**Stack:**
- Frontend: React Native (Expo 53) + TypeScript
- Backend: Python FastAPI
- Database: Supabase (PostgreSQL)
- ML: scikit-learn + Redis caching
- Background Jobs: Celery + Redis

## Common Commands

### Development Setup

```bash
# Local development (recommended for frontend work)
npm run setup:local
npm start                    # Start Expo dev server
npm run ios                  # Run on iOS simulator (macOS only)
npm run android              # Run on Android emulator
npm run web                  # Run in web browser

# Docker environment (for full-stack development)
npm run setup:docker
npm run dev                  # Start all services
npm run dev:shell            # Access container shell
```

### Code Quality

```bash
# Frontend (run from root or godo-app/)
npm run typecheck           # TypeScript type checking
npm run lint                # ESLint
npm run lint:fix            # Auto-fix linting issues
npm run format              # Prettier formatting

# Testing
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:accessibility  # Accessibility tests only
npm run test:coverage       # Generate coverage report
npm run test:watch          # Watch mode for development
```

### Backend Services

```bash
# Backend management
npm run backend:up          # Start backend services
npm run backend:down        # Stop backend services
npm run backend:logs        # View backend logs
npm run backend:shell       # Access backend container
npm run backend:test        # Run Python tests
npm run backend:migrate     # Run database migrations

# Service management
npm run services:up         # Start Supabase, Redis, Inbucket
npm run services:down       # Stop all services
npm run services:logs       # View service logs
```

## Architecture

### Frontend Structure

```
godo-app/src/
├── components/          # Reusable UI components
│   ├── base/           # Basic components (Button, Card, Text)
│   ├── calendar/       # Calendar-specific components
│   ├── events/         # Event cards and displays
│   ├── forms/          # Form components
│   └── profile/        # User profile components
├── screens/            # Main app screens
│   ├── discover/       # Event swiping interface
│   ├── calendar/       # User calendar management
│   ├── events/         # Event details
│   └── profile/        # User profile and settings
├── navigation/         # React Navigation setup
├── services/           # API clients and business logic
├── design/             # Design system (flat tokens, British Racing Green palette)
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
└── config/             # App configuration
```

**Key Design System Files:**
- [godo-app/src/design/flatTokens.ts](godo-app/src/design/flatTokens.ts) - Flat design tokens
- [godo-app/src/design/greenPalette.ts](godo-app/src/design/greenPalette.ts) - British Racing Green color palette
- [godo-app/src/design/designSystem.ts](godo-app/src/design/designSystem.ts) - Complete design system

### Backend Structure

```
backend/
├── app/
│   ├── main.py         # FastAPI application entry point
│   ├── config.py       # Configuration and settings
│   ├── database.py     # Database connection management
│   ├── routers/        # API route handlers
│   │   ├── auth.py    # Authentication endpoints
│   │   └── users.py   # User management endpoints
│   ├── models/         # Pydantic models and database schemas
│   ├── services/       # Business logic layer
│   ├── middleware/     # Request/response middleware
│   └── utils/          # Helper utilities
├── database/           # Database migrations and schemas
└── tests/              # Backend test suite
```

**API Structure:**
- `/api/v1/auth/` - Authentication (signup, login, refresh, logout)
- `/api/v1/users/` - User management and profile
- `/api/v1/events/` - Event CRUD and feed (planned)
- `/api/v1/swipes/` - Swipe recording and calendar (planned)
- `/api/v1/groups/` - Group management (planned)
- `/api/v1/notifications/` - Push notifications (planned)

### 4-Direction Swipe System

The core interaction model uses directional swipes:
- **Right**: "Going" (adds to private calendar)
- **Up**: "Going & Share" (adds to shared calendar, visible to friends)
- **Left**: "Not Interested" (removes from feed, negative ML signal)
- **Down**: "Maybe Later" (saves for future consideration)
- **Long Press + Swipe**: Triggers friend invitation flow

Implementation details in [docs/features/ENHANCED_SWIPE_SYSTEM.md](docs/features/ENHANCED_SWIPE_SYSTEM.md)

### Time-Based Discovery Toggle

**NEW**: Discover screen features a toggle between two event modes:
- **"Happening Now"**: Events within next 6 hours (immediate action)
- **"Future Events"**: Events 6+ hours away (planning ahead)

Implemented with:
- `SegmentedControl` component ([godo-app/src/components/base/SegmentedControl.tsx](godo-app/src/components/base/SegmentedControl.tsx))
- `TimeFilter` enum in types
- Time-based filtering methods in `EventService`:
  - `getHappeningNowEvents()` - Today or within 6 hours
  - `getFutureEvents()` - More than 6 hours away
  - `getUnswipedEventsByTime(filter)` - Filtered + unswiped

See [docs/features/DISCOVER_TOGGLE_IMPLEMENTATION.md](docs/features/DISCOVER_TOGGLE_IMPLEMENTATION.md) for complete specification.

### Testing Architecture

Comprehensive test suite with 90%+ coverage requirements:
- **Unit Tests**: Component rendering, business logic, validation
- **Integration Tests**: API endpoints, auth flows, navigation
- **Accessibility Tests**: WCAG 2.1 compliance, screen reader support

Test structure detailed in [godo-app/tests/README.md](godo-app/tests/README.md)

## Design System

Godo uses a flat design system with a British Racing Green palette, inspired by Anthropic's minimalism and Beli's premium feel.

**Key Principles:**
- Extreme minimalism with generous whitespace
- Content-first design
- High-quality imagery with consistent treatment
- Mobile-first, thumb-friendly layouts
- Purposeful animations that serve function

**Design Tokens:**
- Flat design system with no gradients or shadows (except subtle depth where needed)
- British Racing Green (#004225) as primary brand color
- SF Pro Display/Text on iOS, Roboto on Android
- Consistent spacing scale (4px base unit)
- Touch targets minimum 44x44 points

See [UI_UX_DESIGN_GUIDE.md](UI_UX_DESIGN_GUIDE.md) for complete design specifications.

## Development Workflows

### Local vs Containerized

**Local Development** (recommended for frontend):
- Faster iteration with hot reload
- Direct simulator/device access
- No Docker overhead
- Use for UI work, component development

**Containerized Development** (for full-stack):
- Includes backend, database, Redis, Celery
- Consistent environment across team
- Required for API integration work
- Use for testing full event flow

### Mobile Testing

1. **Expo Go** (recommended): Scan QR code with phone
2. **iOS Simulator**: `npm run ios` (macOS only)
3. **Android Emulator**: `npm run android`
4. **Web Browser**: `npm run web` (limited functionality)

### VS Code Integration

Project includes optimized VS Code settings:
- Auto-format on save with Prettier
- ESLint auto-fix on save
- TypeScript path mapping support
- Recommended extensions auto-suggested

## Important Implementation Notes

### Event Feed & ML Recommendations

The ML recommendation system combines:
- Collaborative filtering (similar users' swipe patterns)
- Content-based filtering (match user preferences to event features)
- Social signals (boost events friends are attending)
- Location intelligence (NYC transit accessibility)
- Time-based weighting (user's preferred times)

See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for ML pipeline details.

### Privacy & Security

- Row Level Security (RLS) on all Supabase tables
- Three privacy levels: Private, Friends Only, Public
- Calendar sharing is opt-in
- Phone numbers hashed for friend discovery
- JWT tokens with refresh rotation

### Real-time Features

Supabase Realtime used for:
- Live event capacity updates
- Friend activity notifications
- Group event planning
- Push notifications

### Background Jobs (Celery)

- Event ingestion from external sources (every 4 hours)
- ML model training (daily)
- Notification processing (real-time + batch)
- Data cleanup (weekly)

## Important Files

### Documentation
- [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) - Backend system architecture and ML design
- [LOCAL_DEV_README.md](LOCAL_DEV_README.md) - Local development environment setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [UI_UX_DESIGN_GUIDE.md](UI_UX_DESIGN_GUIDE.md) - Complete design system specifications
- [ENHANCED_SWIPE_SYSTEM.md](ENHANCED_SWIPE_SYSTEM.md) - Swipe system implementation details
- [day-1-setup-guide.md](day-1-setup-guide.md) - Day-1 setup guide for new developers

### Configuration
- [.clinerules](.clinerules) - Project coding standards and practices
- [package.json](package.json) - Root workspace scripts
- [godo-app/package.json](godo-app/package.json) - Frontend dependencies
- [backend/requirements.txt](backend/requirements.txt) - Python dependencies
- [docker-compose.yml](docker-compose.yml) - Development environment services

### Key Source Files
- [godo-app/App.tsx](godo-app/App.tsx) - React Native entry point
- [godo-app/src/navigation/RootNavigator.tsx](godo-app/src/navigation/RootNavigator.tsx) - Navigation structure
- [backend/app/main.py](backend/app/main.py) - FastAPI application entry point
- [backend/app/database.py](backend/app/database.py) - Database connection manager

## Environment Configuration

### Frontend (.env in godo-app/)
```env
API_BASE_URL=http://localhost:3001
SUPABASE_URL=http://localhost:8000
EXPO_USE_FAST_RESOLVER=1
```

### Backend (.env in backend/)
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
REDIS_URL=redis://localhost:6379
```

See `.env.example` files for complete configurations.

## Known Issues & Limitations

- Backend API routes for events, swipes, groups, and notifications are planned but not yet implemented
- ML recommendation model training pipeline is stubbed out
- Real-time features depend on Supabase Realtime configuration
- iOS simulator required for iOS testing (macOS only)

## Git Workflow

Clean repository with main branch as primary. Recent focus areas:
- UI improvements with flat design system
- Profile functionality with comprehensive testing
- Agenda view bug fixes

When creating PRs, ensure:
- All tests pass (`npm test`)
- TypeScript types are valid (`npm run typecheck`)
- Code is formatted (`npm run format`)
- No linting errors (`npm run lint`)