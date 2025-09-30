# Database Notes

## Platform
- Primary datastore is Supabase (Postgres). Local development can target Supabase-hosted instance or self-hosted Postgres matching schema.
- Extensions required: `uuid-ossp`, `postgis`, `pg_trgm` (see `001_initial_schema.sql`). Ensure they are enabled before running migrations.

## Schema Highlights
- Users: `users` table extends `auth.users`, storing profile data, preferences, ML vectors, hashed phone, push token, etc.
- Events: `events` table tracks event metadata, schedule, location (PostGIS `GEOGRAPHY`), pricing, moderation, tags, and metrics.
- Swipes & Attendance: `swipes`, `event_attendance` encode user interactions, statuses, visibility, and notes.
- Social: `friendships`, `groups`, `group_members`, `group_events`, `notifications`, `friend_recommendations` support social graph and notifications.
- Analytics: tables for event engagement, recommendations, and ML feedback (`event_recommendations`, `user_event_metrics`).

## Security & Policies
- `002_rls_policies.sql` sets Row Level Security for core tables aligned with Supabase auth roles.
- Policies reference Postgres functions for access control (e.g., `auth.role()`, `is_friend`, `is_group_member`). Ensure functions exist before applying policies.

## Indexing & Performance
- `003_indexes.sql` defines GIN/GIST indexes on geo/location, tags, JSONB paths, trigram search on text, and composite indexes for queries (date ranges, categories, popular events).
- Maintain indexes when schema evolves, especially for search performance in NYC region.

## Migration Workflow
1. Enable extensions and run `001_initial_schema.sql` on fresh database.
2. Apply `002_rls_policies.sql` for security.
3. Apply `003_indexes.sql` for performance tuning.
4. Document changes in `docs/database/database.sql` and keep backend ORM models aligned.

## Data Sync With Frontend
- Repositories in `godo-app/src/repositories` assume columns defined in these migrations; update both sides when renaming or adding fields.
- Supabase client keys in frontend `.env` must match the target project where these migrations are deployed.
