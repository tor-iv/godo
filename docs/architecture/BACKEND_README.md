# Godo Backend

Python FastAPI backend for the Godo event discovery app with machine learning recommendations, social features, and real-time updates.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for workspace scripts)

### Setup

1. **Start the backend services:**
   ```bash
   ./scripts/setup-backend.sh
   ```

2. **Or manually:**
   ```bash
   # Start database and dependencies
   npm run services:up
   
   # Start backend services
   npm run backend:up
   
   # Check health
   curl http://localhost:8000/health
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## 🏗️ Architecture

### Technology Stack
- **FastAPI** - High-performance Python web framework
- **Supabase** - PostgreSQL database with real-time features
- **Redis** - Caching and background job queue
- **Celery** - Background job processing
- **scikit-learn** - Machine learning recommendations

### Services
- **godo-backend** - Main API server (port 8000)
- **godo-worker** - Celery background jobs
- **godo-beat** - Celery scheduled tasks
- **supabase-db** - PostgreSQL database (port 5432)
- **redis** - Redis cache/queue (port 6379)

## 📊 Database Schema

The database includes tables for:
- **Users** - User profiles with NYC neighborhoods and privacy settings
- **Events** - Events from external APIs and user-generated content
- **Swipes** - User interactions with ML feature extraction
- **Friendships** - Social connections with privacy controls
- **Groups** - Event planning groups
- **Event Attendance** - Real-time capacity and friend visibility
- **User Preferences** - ML-generated preference scores
- **Notifications** - Real-time notification system

### Key Features
- Row Level Security (RLS) for data privacy
- Real-time subscriptions via Supabase
- ML preference tracking and recommendations
- NYC-specific location and transit scoring

## 🤖 Machine Learning

### Recommendation System
- **Collaborative Filtering** - Find similar users based on swipe patterns
- **Content-Based Filtering** - Match user preferences to event features
- **Social Signals** - Boost events friends are attending
- **Location Intelligence** - NYC transit accessibility scoring
- **Time-based Weighting** - Prefer events at user's preferred times

### Features Used
- User demographics and preferences
- Event categories, location, time, price
- Social connections and friend activity
- Historical swipe patterns
- NYC transit accessibility scores

## 🔧 Development

### Commands
```bash
# Backend services
npm run backend:up      # Start backend
npm run backend:down    # Stop backend
npm run backend:logs    # View logs
npm run backend:shell   # Access container
npm run backend:test    # Run tests

# Database
npm run db:reset        # Reset database
npm run services:up     # Start DB/Redis only
```

### Project Structure
```
backend/
├── app/
│   ├── models/         # Pydantic data models
│   ├── routers/        # API endpoints (TODO)
│   ├── services/       # Business logic (TODO)
│   ├── utils/          # Utilities
│   ├── middleware/     # Custom middleware (TODO)
│   ├── config.py       # Configuration
│   ├── database.py     # Database connections
│   └── main.py         # FastAPI app
├── tests/              # Test suite (TODO)
├── requirements.txt    # Python dependencies
├── Dockerfile         # Container definition
└── .env.example       # Environment template
```

## 🔒 Security

### Implemented
- JWT token authentication
- Row Level Security (RLS) on all tables
- Input validation with Pydantic
- Rate limiting configuration
- Password hashing
- Privacy levels for all social features

### Privacy Controls
- Private, friends-only, or public visibility for all user data
- Event attendance visibility controls
- Optional location sharing
- Hashed phone numbers for friend discovery

## 📈 Monitoring

### Health Checks
- Database connectivity
- Redis connectivity
- Service health endpoints

### Logging
- Structured logging with timestamps
- Slow request detection (>1s)
- Error tracking ready for Sentry integration

## 🚧 Next Steps (TODO)

### Phase 1: Core APIs
- [ ] Authentication endpoints (`/api/v1/auth/*`)
- [ ] Event management (`/api/v1/events/*`)
- [ ] Swipe recording (`/api/v1/swipes/*`)
- [ ] User profiles (`/api/v1/users/*`)

### Phase 2: ML System
- [ ] Recommendation engine implementation
- [ ] Background job for model training
- [ ] User preference learning
- [ ] Event popularity scoring

### Phase 3: Social Features
- [ ] Friend system (`/api/v1/users/friends/*`)
- [ ] Group management (`/api/v1/groups/*`)
- [ ] Public calendar sharing
- [ ] Real-time friend activity

### Phase 4: Background Jobs
- [ ] Event ingestion from external APIs
- [ ] Notification processing
- [ ] ML model training jobs
- [ ] Data cleanup tasks

### Phase 5: Real-time Features
- [ ] Live event capacity updates
- [ ] Push notifications
- [ ] Real-time friend activity
- [ ] Group chat/planning

## 🌐 External APIs

Ready for integration with:
- **Eventbrite** - Popular events
- **NYC Parks** - Outdoor events
- **NYC Cultural** - Arts and culture
- **Google Maps** - Location and transit data
- **Expo Push** - Mobile notifications

## 💰 Cost Estimation

**Monthly costs (estimated):**
- Supabase Pro: ~$25
- Redis hosting: ~$15
- FastAPI hosting: ~$20
- External APIs: ~$50-100
- **Total: ~$110-160/month**

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use type hints throughout
5. Follow security best practices

## 📝 Environment Variables

Copy `backend/.env.example` to `backend/.env` and update:

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key

# Auth
JWT_SECRET=your-secret-key

# External APIs
EVENTBRITE_API_KEY=your-key
GOOGLE_MAPS_API_KEY=your-key

# Redis
REDIS_URL=redis://localhost:6379
```

---

## 📚 API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.