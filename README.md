# GoDo

**Stop wondering what to do. Start doing.**

GoDo solves the problem of sitting around wondering what to do by presenting swipeable activity recommendations that get you off the couch, then holds you accountable by automatically adding chosen events to your calendar.

## The Problem

You want to do something, but you don't know what. You scroll through websites, check event listings, text friends asking "what are you up to?" Hours pass. You're still on the couch.

## The Solution

GoDo curates NYC events and activities into a Tinder-like swipe interface. Right swipe what you want to do, and it automatically goes on your calendar. No more decision paralysis. No more "I'll check that out later." Just swipe, commit, and go.

### How It Works

1. **Swipe through curated events** - We find the best NYC activities so you don't have to search
2. **Four-direction gestures** - Right (going), Up (going + share with friends), Left (not interested), Down (maybe later)
3. **Auto-calendar sync** - Events you commit to automatically appear on your calendar
4. **Social accountability** - Share your plans with friends, see what they're doing, hold each other accountable
5. **Smart recommendations** - ML learns what you like and suggests better events over time

### Built For

NYC young professionals who want to get off their phones and actually do things. People tired of endless scrolling and planning paralysis who need a push to make plans happen.

---

## Tech Stack

- **Frontend**: React Native (Expo 53) + TypeScript
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **ML**: scikit-learn + Redis caching
- **Background Jobs**: Celery + Redis

## Quick Start

```bash
# Local development (recommended for frontend)
npm run setup:local
npm start                # Start Expo dev server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator

# Docker environment (for full-stack)
npm run setup:docker
npm run dev              # Start all services
```

See [docs/setup/LOCAL_DEV_README.md](docs/setup/LOCAL_DEV_README.md) for detailed setup instructions.

## Development Commands

```bash
# Code quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier formatting

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:coverage    # Generate coverage report

# Backend
npm run backend:up       # Start backend services
npm run backend:logs     # View backend logs
npm run backend:test     # Run Python tests
```

## Project Structure

```
godo/
├── godo-app/           # React Native frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── screens/    # Main app screens
│   │   ├── navigation/ # React Navigation setup
│   │   ├── design/     # Design system (flat, British Racing Green)
│   │   └── services/   # API clients and business logic
│   └── tests/          # Comprehensive test suite (90%+ coverage)
│
├── backend/            # Python FastAPI backend
│   ├── app/
│   │   ├── routers/    # API endpoints
│   │   ├── models/     # Database models
│   │   ├── services/   # Business logic
│   │   └── main.py     # FastAPI entry point
│   └── database/       # Schema and migrations
│
└── docs/               # Complete documentation
    ├── architecture/   # System design
    ├── design/         # UI/UX specifications
    ├── features/       # Feature guides
    ├── setup/          # Development setup
    └── deployment/     # Production deployment
```

## Key Features

### 4-Direction Swipe System
- **Right**: Add to private calendar (just for you)
- **Up**: Add to shared calendar (friends can see)
- **Left**: Not interested (improves recommendations)
- **Down**: Save for later

See [docs/features/ENHANCED_SWIPE_SYSTEM.md](docs/features/ENHANCED_SWIPE_SYSTEM.md)

### Smart Recommendations
ML-powered event suggestions using:
- Collaborative filtering (similar users' preferences)
- Content-based filtering (event features)
- Social signals (what friends are doing)
- Location intelligence (NYC transit accessibility)

See [docs/architecture/BACKEND_ARCHITECTURE.md](docs/architecture/BACKEND_ARCHITECTURE.md)

### Social Features
- Friend connections via phone number
- Share calendar with friends
- Invite friends to events
- See what friends are doing
- Privacy controls (private, friends only, public)

### Calendar Management
- Automatic calendar sync
- Privacy settings per event
- Friend visibility controls
- Event reminders and notifications

## Documentation

Complete documentation available in [docs/](docs/):

- **Getting Started**: [day-1-setup-guide.md](docs/setup/day-1-setup-guide.md)
- **Architecture**: [BACKEND_ARCHITECTURE.md](docs/architecture/BACKEND_ARCHITECTURE.md)
- **Design System**: [UI_UX_DESIGN_GUIDE.md](docs/design/UI_UX_DESIGN_GUIDE.md)
- **Deployment**: [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)

See [docs/README.md](docs/README.md) for complete documentation index.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript for frontend, Python for backend
- 2-space indentation
- ESLint + Prettier formatting
- Comprehensive tests (90%+ coverage target)
- Follow existing design system patterns

See [.clinerules](.clinerules) for complete coding standards.

## License

MIT

## Support

For questions or issues, open a GitHub issue or check the [docs/](docs/) directory for detailed guides.