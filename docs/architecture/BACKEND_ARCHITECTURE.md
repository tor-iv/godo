# Godo Backend Architecture Plan

## Overview
Event discovery app backend for young professionals in NYC with Tinder-like swipe interface, machine learning recommendations, and social features.

## Technology Stack

### Core Infrastructure
- **Backend Framework**: Python FastAPI
- **Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **ML/Recommendations**: scikit-learn + Redis caching
- **Background Jobs**: Celery + Redis
- **Real-time Features**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage
- **Monitoring**: Supabase Analytics + Sentry

### Key Design Decisions
- **Supabase** for rapid development with built-in auth, realtime, and RLS security
- **FastAPI** for high-performance API with automatic OpenAPI docs
- **Redis** for ML model caching and background job queue
- **Celery** for background event ingestion and ML model training

## Database Schema

### Enhanced Tables (extending existing)

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    age INTEGER CHECK (age >= 18 AND age <= 50),
    location_neighborhood VARCHAR(100), -- NYC neighborhoods
    privacy_level VARCHAR(20) DEFAULT 'private' CHECK (privacy_level IN ('private', 'friends_only', 'public')),
    preferences JSONB DEFAULT '{}',
    ml_preference_vector FLOAT[] DEFAULT '{}', -- ML-generated preference scores
    phone_hash VARCHAR(64), -- For friend discovery (hashed)
    profile_image_url TEXT,
    push_token TEXT, -- For notifications
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Events Table (Enhanced)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location_name VARCHAR(255) NOT NULL,
    location_address VARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    neighborhood VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    price_min INTEGER DEFAULT 0,
    price_max INTEGER,
    image_url TEXT,
    source VARCHAR(50) NOT NULL, -- 'eventbrite', 'user_generated', etc.
    external_id VARCHAR(255),
    external_url TEXT,
    capacity INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_user_generated BOOLEAN DEFAULT false,
    created_by_user_id UUID REFERENCES users(id),
    moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    accessibility_info JSONB DEFAULT '{}',
    transit_score INTEGER, -- NYC transit accessibility (1-10)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Friendships Table
```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    initiated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CHECK (user_id != friend_id),
    UNIQUE(user_id, friend_id)
);
```

#### Groups Table (New)
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    privacy_level VARCHAR(20) DEFAULT 'private' CHECK (privacy_level IN ('private', 'friends_only', 'public')),
    max_members INTEGER DEFAULT 50,
    group_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Group Members Table
```sql
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);
```

#### Event Attendance (Enhanced)
```sql
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'interested' CHECK (status IN ('interested', 'going', 'maybe', 'not_going')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
    group_id UUID REFERENCES groups(id), -- If attending with a group
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, event_id)
);
```

#### User Preferences (ML)
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    preference_score DECIMAL(3,2) DEFAULT 0.5 CHECK (preference_score >= 0 AND preference_score <= 1),
    neighborhood VARCHAR(100),
    time_preference VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
    price_sensitivity DECIMAL(3,2) DEFAULT 0.5,
    social_preference DECIMAL(3,2) DEFAULT 0.5, -- How much they prefer events friends attend
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, category, neighborhood, time_preference)
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'friend_request', 'event_reminder', 'group_invite', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional notification data
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_notifications_user_unread (user_id, is_read, created_at)
);
```

#### Event Sources (Background Jobs)
```sql
CREATE TABLE event_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(50) NOT NULL, -- 'eventbrite', 'nyc_parks', etc.
    last_sync TIMESTAMP,
    next_sync TIMESTAMP,
    sync_frequency INTERVAL DEFAULT '4 hours',
    is_active BOOLEAN DEFAULT true,
    sync_status VARCHAR(20) DEFAULT 'pending',
    last_error TEXT,
    events_synced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Architecture

### Core Endpoints Structure
```
/api/v1/
├── auth/                    # Authentication
│   ├── signup
│   ├── login
│   ├── refresh
│   └── logout
├── users/                   # User management
│   ├── profile
│   ├── preferences  
│   └── friends/
│       ├── search
│       ├── requests
│       └── list
├── events/                  # Event management
│   ├── feed                 # Personalized feed
│   ├── create               # User-generated events
│   ├── {id}
│   └── trending
├── swipes/                  # Swipe actions
│   ├── /                    # Record swipe
│   ├── calendar             # Right-swiped events
│   ├── saved                # Up-swiped events
│   └── liked                # Down-swiped events
├── groups/                  # Group management
│   ├── /                    # List/create groups
│   ├── {id}/members
│   ├── {id}/events
│   └── invites
├── notifications/           # Notification system
│   ├── /                    # List notifications
│   ├── mark_read
│   └── settings
└── ml/                      # ML endpoints (internal)
    ├── train_model
    ├── update_preferences
    └── recommendations
```

## Machine Learning Recommendation System

### Feature Engineering
- **User Features**: Age, neighborhood, swipe history, friend connections, time preferences
- **Event Features**: Category, location, time, price, capacity, social signals
- **Contextual Features**: Current time, weather, user's recent activity, friend attendance

### Recommendation Algorithm
1. **Collaborative Filtering**: Find similar users based on swipe patterns
2. **Content-Based Filtering**: Match user preferences to event features
3. **Social Signals**: Boost events friends are attending
4. **Location Intelligence**: NYC transit accessibility scoring
5. **Time-based Weighting**: Prefer events at user's preferred times

### Implementation Approach
```python
# ML Pipeline Overview
class RecommendationEngine:
    def __init__(self):
        self.user_similarity_model = NearestNeighbors()
        self.content_model = RandomForestClassifier()
        self.social_model = GraphConvolutionalNetwork()
    
    def generate_recommendations(self, user_id, context):
        # 1. Get user embedding
        user_vector = self.get_user_vector(user_id)
        
        # 2. Collaborative filtering
        similar_users = self.user_similarity_model.kneighbors(user_vector)
        
        # 3. Content-based recommendations
        content_scores = self.content_model.predict_proba(event_features)
        
        # 4. Social signal boosting
        social_scores = self.get_friend_attendance_boost(user_id, events)
        
        # 5. Combine and rank
        final_scores = self.combine_scores(content_scores, social_scores)
        
        return self.rank_events(final_scores, context)
```

## Background Job System

### Celery Tasks
1. **Event Ingestion** (Every 4 hours)
   - Sync from Eventbrite, NYC Parks, cultural venues
   - Update event capacity from external sources
   - Clean up past events

2. **ML Model Training** (Daily)
   - Retrain recommendation models
   - Update user preference vectors
   - Calculate event popularity scores

3. **Notification Processing** (Real-time + Batch)
   - Send push notifications
   - Email reminders
   - Friend activity updates

4. **Data Cleanup** (Weekly)
   - Archive old swipes
   - Clean expired notifications
   - Update user activity scores

## Real-time Features

### Supabase Realtime Subscriptions
- **Event Capacity Updates**: Live attendance tracking
- **Friend Activity**: Real-time friend swipes/attendance
- **Group Chat**: Simple group messaging for event planning
- **Notifications**: Instant push for friend requests, event updates

### WebSocket Connections
- Group event planning sessions
- Live event capacity during popular events
- Real-time friend location sharing (optional)

## Security & Privacy

### Data Protection
- **Row Level Security (RLS)** on all tables
- **Privacy Levels**: Private, friends-only, public for all social features
- **Data Encryption**: Sensitive fields encrypted at rest
- **Phone Number Hashing**: For friend discovery without storing raw numbers

### Authentication & Authorization
- **JWT Tokens** with refresh token rotation
- **Role-based Access Control** for admin features
- **API Rate Limiting** (100 requests/minute per user)
- **Input Validation** with Pydantic models

### Privacy Controls
- Users can hide their calendar from friends
- Location sharing is opt-in only
- Event attendance visibility controlled per event
- Friend recommendations can be disabled

## Deployment & Infrastructure

### Development Environment
- Docker Compose with all services
- Local Supabase instance
- Redis for background jobs
- Hot reloading for development

### Production Architecture
- **FastAPI**: Deployed on Railway/Render (~$20/month)
- **Supabase Pro**: Database + Auth + Realtime (~$25/month)
- **Redis**: Background jobs and caching (~$15/month)
- **CDN**: Supabase Storage for images (included)
- **Monitoring**: Sentry for error tracking (~$0-26/month)

### Estimated Monthly Costs
- **Infrastructure**: $60-85/month
- **External APIs**: $50-100/month (Eventbrite, Google Maps)
- **Push Notifications**: Free (Expo)
- **Total**: $110-185/month

## Implementation Phases

### Phase 1: Core Backend (Week 1-2)
- [ ] FastAPI setup with Supabase integration
- [ ] Enhanced database schema implementation
- [ ] User authentication and profile management
- [ ] Basic event CRUD operations
- [ ] Swipe recording system

### Phase 2: ML & Recommendations (Week 3)
- [ ] User preference tracking system
- [ ] Basic collaborative filtering model
- [ ] Event feature extraction pipeline
- [ ] Background job system with Celery
- [ ] Personalized feed generation

### Phase 3: Social Features (Week 4)
- [ ] Friend system with privacy controls
- [ ] Group creation and management
- [ ] Public calendar sharing
- [ ] Group event planning features
- [ ] Friend activity feeds

### Phase 4: Real-time & Polish (Week 5)
- [ ] Real-time event capacity updates
- [ ] Push notification system
- [ ] Advanced ML model training
- [ ] Performance optimization and caching
- [ ] Security hardening and testing

## Success Metrics

### Technical KPIs
- [ ] API response times < 200ms (95th percentile)
- [ ] Real-time updates < 1 second latency
- [ ] ML recommendation accuracy > 70%
- [ ] System uptime > 99.5%

### Business KPIs
- [ ] User engagement: Average 10+ swipes per session
- [ ] Social adoption: 30% of users add friends
- [ ] Event attendance: 15% of right-swipes result in attendance
- [ ] User retention: 60% weekly active users

This architecture balances feature richness with implementation complexity, leveraging Supabase's strengths while adding sophisticated ML recommendations and real-time social features.