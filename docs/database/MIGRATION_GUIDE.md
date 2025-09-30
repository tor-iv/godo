# GoDo Database Migration Guide

Complete guide for setting up and migrating the GoDo app database with Supabase.

## 🚀 Quick Start

### Prerequisites

- Supabase account and project
- PostgreSQL client (psql) or Supabase CLI
- Python 3.8+ with required packages
- Environment variables configured

### Environment Setup

Create a `.env` file in the backend directory:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
```

## 📋 Migration Steps

### Step 1: Run Initial Schema Migration

```sql
-- Connect to your Supabase database via psql or SQL Editor
-- Run the following files in order:

-- 1. Create tables, enums, functions, and triggers
\i backend/database/migrations/001_initial_schema.sql

-- 2. Set up Row Level Security policies
\i backend/database/migrations/002_rls_policies.sql

-- 3. Create performance indexes
\i backend/database/migrations/003_indexes.sql
```

### Step 2: Verify Migration

Run the database test suite:

```bash
cd backend
python database/tests/test_database.py --run-all --db-url "your_database_url"
```

Expected output:
```
✅ All tests should pass
📊 Success Rate: 100.0%
```

### Step 3: Seed Development Data

Generate realistic NYC event data:

```bash
cd backend

# For development (200 events, 10 test users)
python database/seeds/nyc_events_seed.py --count 200 --users 10

# For production-like testing (1000 events, 50 users)
python database/seeds/nyc_events_seed.py --production
```

### Step 4: Configure Supabase Auth

In your Supabase dashboard:

1. **Authentication Settings**:
   - Enable email authentication
   - Configure OAuth providers (Google, Apple) if needed
   - Set JWT expiry times

2. **User Management**:
   - Enable email confirmations
   - Set password policies
   - Configure user metadata

### Step 5: Test Database Operations

```bash
# Test basic connectivity
python database/tests/test_database.py --db-url "your_database_url"

# Test with Supabase client
python database/tests/test_database.py \
  --db-url "your_database_url" \
  --supabase-url "your_supabase_url" \
  --supabase-key "your_anon_key" \
  --run-all
```

## 🔧 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|-------------|
| `users` | User profiles | Extends Supabase auth.users, privacy controls |
| `events` | All events | PostGIS location support, ML features |
| `swipes` | User interactions | Calendar integration, social features |
| `event_attendance` | Formal attendance | Privacy levels, group support |
| `friendships` | User relationships | Bidirectional, status tracking |
| `groups` | Social groups | Privacy controls, role-based access |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `group_members` | Group membership tracking |
| `invitations` | Event invitations between friends |
| `user_preferences` | ML preference data |
| `swipe_context` | ML feature extraction data |
| `ml_event_features` | Pre-computed event features |
| `notifications` | User notifications |
| `event_sources` | Background sync job tracking |
| `audit_logs` | Security and compliance audit trail |

### Key Features

- **PostGIS Integration**: Location-based queries with spatial indexing
- **Row Level Security**: Comprehensive privacy controls
- **ML Support**: Feature extraction and recommendation data
- **Real-time Ready**: Optimized for Supabase real-time subscriptions
- **Performance Optimized**: Strategic indexing for common queries

## 🔒 Security & Privacy

### Row Level Security Policies

The database implements comprehensive RLS policies:

- **User Data**: Users can only access their own data
- **Friend Visibility**: Social features respect privacy settings
- **Event Privacy**: Attendance visibility controls
- **Group Access**: Role-based permissions

### Privacy Levels

| Level | Description | Access |
|-------|-------------|--------|
| `private` | User only | No external visibility |
| `friends_only` | Friends can see | Mutual friends required |
| `public` | Everyone can see | Full visibility |

### Data Protection

- Phone numbers are hashed for privacy
- Audit logging for sensitive operations
- Secure functions with SECURITY DEFINER
- Input validation and constraints

## 📊 Performance Optimization

### Indexing Strategy

- **Spatial Indexes**: PostGIS GIST indexes for location queries
- **Temporal Indexes**: Event discovery by date/time
- **Social Indexes**: Friend relationship lookups
- **Text Search**: Full-text search on event content
- **Composite Indexes**: Multi-column queries

### Query Optimization

Common query patterns are optimized:

```sql
-- Event discovery (optimized)
SELECT * FROM events
WHERE is_active = true
  AND moderation_status = 'approved'
  AND date_time > NOW()
  AND category = 'networking'
ORDER BY date_time;

-- Location-based search (PostGIS)
SELECT * FROM events
WHERE ST_DWithin(
  location_point,
  ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326),
  1000
);

-- Social activity feed
SELECT * FROM friend_activity_feed
WHERE visibility IN ('friends', 'public')
ORDER BY activity_time DESC;
```

## 🔄 Background Jobs & Sync

### Event Sources

The `event_sources` table tracks sync jobs:

| Source | Frequency | Purpose |
|--------|-----------|---------|
| `eventbrite` | 2 hours | Public events |
| `nyc_parks` | 6 hours | NYC Parks events |
| `nyc_cultural` | 12 hours | Cultural institutions |
| `meetup` | 4 hours | Community events |

### Sync Implementation

```python
# Example sync job (implement in your backend)
async def sync_eventbrite_events():
    # Fetch from Eventbrite API
    # Process and deduplicate
    # Insert new events
    # Update sync status
    pass
```

## 🚨 Troubleshooting

### Common Issues

1. **RLS Blocking Queries**
   ```sql
   -- Temporarily disable RLS for debugging (development only!)
   ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
   -- Remember to re-enable: ENABLE ROW LEVEL SECURITY;
   ```

2. **Performance Issues**
   ```sql
   -- Check index usage
   SELECT * FROM index_usage_stats WHERE idx_scan < 100;

   -- Find unused indexes
   SELECT * FROM get_unused_indexes();
   ```

3. **PostGIS Issues**
   ```sql
   -- Verify PostGIS installation
   SELECT PostGIS_Version();

   -- Check spatial indexes
   SELECT * FROM pg_indexes WHERE indexname LIKE '%location%';
   ```

### Migration Rollback

If you need to rollback the migration:

```sql
-- ⚠️ WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Data Recovery

Always backup before migration:

```bash
# Backup
pg_dump your_database_url > backup.sql

# Restore
psql your_database_url < backup.sql
```

## 📈 Monitoring & Maintenance

### Database Health Checks

```python
# Use the database health check function
from app.database import db_manager

health = await db_manager.health_check()
print(health)  # {"supabase": "healthy", "redis": "healthy", "overall": "healthy"}
```

### Performance Monitoring

```sql
-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC;

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Regular Maintenance

```sql
-- Update table statistics (run weekly)
ANALYZE;

-- Vacuum tables (run monthly)
VACUUM;

-- Reindex if needed (rare)
REINDEX DATABASE your_database;
```

## 🔧 Development Workflow

### Local Development

1. **Set up local Supabase**:
   ```bash
   npx supabase init
   npx supabase start
   ```

2. **Run migrations**:
   ```bash
   npx supabase db reset
   # Manually run migration files
   ```

3. **Seed data**:
   ```bash
   python database/seeds/nyc_events_seed.py --count 50
   ```

### Testing

```bash
# Run all tests
python database/tests/test_database.py --run-all

# Test specific functionality
python database/tests/test_database.py --db-url $DATABASE_URL
```

### Production Deployment

1. **Pre-deployment checklist**:
   - [ ] Backup production database
   - [ ] Test migration in staging
   - [ ] Verify all tests pass
   - [ ] Check performance impact

2. **Deploy**:
   ```bash
   # Run migrations in production
   psql $PRODUCTION_DATABASE_URL < migrations/001_initial_schema.sql
   psql $PRODUCTION_DATABASE_URL < migrations/002_rls_policies.sql
   psql $PRODUCTION_DATABASE_URL < migrations/003_indexes.sql
   ```

3. **Post-deployment**:
   - [ ] Run health checks
   - [ ] Verify application functionality
   - [ ] Monitor performance metrics

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostgreSQL Documentation](https://postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the database test suite for diagnostics
3. Review Supabase logs in the dashboard
4. Check PostgreSQL logs for errors

---

**Migration completed successfully! 🎉**

Your GoDo database is now ready for development and production use with:
- ✅ Complete schema with proper relationships
- ✅ Row Level Security for privacy
- ✅ Performance optimizations
- ✅ Real-time capabilities
- ✅ ML/AI support
- ✅ NYC event data