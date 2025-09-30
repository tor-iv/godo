-- Database Indexes for Performance Optimization
-- This script creates comprehensive indexes for the GoDo app to ensure fast queries

-- =============================================
-- USERS TABLE INDEXES
-- =============================================

-- Email lookup (for authentication)
CREATE INDEX idx_users_email ON users(email);

-- Location-based user queries
CREATE INDEX idx_users_neighborhood ON users(location_neighborhood);

-- Privacy level filtering
CREATE INDEX idx_users_privacy_active ON users(privacy_level) WHERE is_active = true;

-- Phone hash lookup for friend discovery
CREATE INDEX idx_users_phone_hash ON users(phone_hash) WHERE phone_hash IS NOT NULL;

-- Last login for user activity analytics
CREATE INDEX idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- =============================================
-- EVENTS TABLE INDEXES
-- =============================================

-- Primary event discovery queries
CREATE INDEX idx_events_active_approved ON events(date_time, category)
    WHERE is_active = true AND moderation_status = 'approved';

-- Location-based event discovery (PostGIS spatial index)
CREATE INDEX idx_events_location_point ON events USING GIST(location_point)
    WHERE is_active = true;

-- Neighborhood-based queries
CREATE INDEX idx_events_neighborhood ON events(neighborhood, date_time)
    WHERE is_active = true AND moderation_status = 'approved';

-- Category filtering
CREATE INDEX idx_events_category_datetime ON events(category, date_time)
    WHERE is_active = true AND moderation_status = 'approved';

-- Price range queries
CREATE INDEX idx_events_price_range ON events(price_min, price_max, date_time)
    WHERE is_active = true AND moderation_status = 'approved';

-- Featured events
CREATE INDEX idx_events_featured ON events(date_time)
    WHERE is_featured = true AND is_active = true AND moderation_status = 'approved';

-- User-generated events
CREATE INDEX idx_events_user_generated ON events(created_by_user_id, date_time)
    WHERE is_user_generated = true;

-- Source-based queries for background jobs
CREATE INDEX idx_events_source_sync ON events(source, updated_at);

-- External ID lookup for deduplication
CREATE INDEX idx_events_external_id ON events(source, external_id)
    WHERE external_id IS NOT NULL;

-- Popularity ranking
CREATE INDEX idx_events_popularity ON events(popularity_score DESC, date_time)
    WHERE is_active = true AND moderation_status = 'approved';

-- Full-text search on event title and description
CREATE INDEX idx_events_search ON events USING GIN(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Tags search
CREATE INDEX idx_events_tags ON events USING GIN(tags)
    WHERE array_length(tags, 1) > 0;

-- Temporal queries for recommendations
CREATE INDEX idx_events_recommendation_temporal ON events(date_time, created_at)
    WHERE is_active = true AND moderation_status = 'approved';

-- =============================================
-- SWIPES TABLE INDEXES
-- =============================================

-- User's swipe history
CREATE INDEX idx_swipes_user_datetime ON swipes(user_id, created_at DESC);

-- Event swipe analytics
CREATE INDEX idx_swipes_event_direction ON swipes(event_id, direction, created_at);

-- User preferences analysis
CREATE INDEX idx_swipes_user_direction ON swipes(user_id, direction);

-- Calendar queries (user's saved events)
CREATE INDEX idx_swipes_calendar ON swipes(user_id, direction, calendar_type)
    WHERE direction IN ('right', 'up', 'down');

-- Recommendation feedback queries
CREATE INDEX idx_swipes_confidence ON swipes(user_id, confidence_score);

-- Social swipes (shared events)
CREATE INDEX idx_swipes_social ON swipes(user_id, visibility, created_at)
    WHERE visibility IN ('friends', 'public');

-- Unique constraint index (already created by UNIQUE constraint, but explicitly listing)
-- CREATE UNIQUE INDEX idx_swipes_user_event ON swipes(user_id, event_id);

-- =============================================
-- EVENT ATTENDANCE INDEXES
-- =============================================

-- User's attendance history
CREATE INDEX idx_attendance_user_status ON event_attendance(user_id, status, created_at DESC);

-- Event attendance counts
CREATE INDEX idx_attendance_event_status ON event_attendance(event_id, status);

-- Friend activity queries
CREATE INDEX idx_attendance_visibility ON event_attendance(visibility, created_at DESC)
    WHERE visibility IN ('friends', 'public');

-- Group event attendance
CREATE INDEX idx_attendance_group ON event_attendance(group_id, status)
    WHERE group_id IS NOT NULL;

-- =============================================
-- FRIENDSHIPS TABLE INDEXES
-- =============================================

-- User's friends lookup
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status ON friendships(friend_user_id, status);

-- Friend requests management
CREATE INDEX idx_friendships_pending ON friendships(friend_user_id, created_at)
    WHERE status = 'pending';

-- Mutual friends calculation
CREATE INDEX idx_friendships_accepted ON friendships(user_id, friend_user_id)
    WHERE status = 'accepted';

-- Bidirectional friendship lookup
CREATE INDEX idx_friendships_bidirectional ON friendships(
    LEAST(user_id, friend_user_id),
    GREATEST(user_id, friend_user_id),
    status
);

-- =============================================
-- GROUPS TABLE INDEXES
-- =============================================

-- Group discovery
CREATE INDEX idx_groups_public ON groups(created_at DESC) WHERE is_private = false;

-- User's created groups
CREATE INDEX idx_groups_creator ON groups(created_by_user_id, created_at DESC);

-- Group type filtering
CREATE INDEX idx_groups_type ON groups(type, is_private, created_at DESC);

-- =============================================
-- GROUP MEMBERS INDEXES
-- =============================================

-- Group membership lookup
CREATE INDEX idx_group_members_group ON group_members(group_id, role);

-- User's group memberships
CREATE INDEX idx_group_members_user ON group_members(user_id, joined_at DESC);

-- Admin/owner lookup
CREATE INDEX idx_group_members_admin ON group_members(user_id, group_id)
    WHERE role IN ('owner', 'admin');

-- =============================================
-- INVITATIONS TABLE INDEXES
-- =============================================

-- User's sent invitations
CREATE INDEX idx_invitations_inviter ON invitations(inviter_user_id, status, created_at DESC);

-- User's received invitations
CREATE INDEX idx_invitations_invitee ON invitations(invitee_user_id, status, created_at DESC);

-- Event invitations
CREATE INDEX idx_invitations_event ON invitations(event_id, status);

-- Pending invitations
CREATE INDEX idx_invitations_pending ON invitations(invitee_user_id, created_at DESC)
    WHERE status = 'pending';

-- Group invitations
CREATE INDEX idx_invitations_group ON invitations(group_id, status)
    WHERE group_id IS NOT NULL;

-- =============================================
-- USER PREFERENCES INDEXES
-- =============================================

-- ML preference lookup
CREATE INDEX idx_preferences_user_category ON user_preferences(user_id, category);

-- Preference scoring
CREATE INDEX idx_preferences_score ON user_preferences(category, preference_score);

-- Neighborhood preferences
CREATE INDEX idx_preferences_neighborhood ON user_preferences(user_id, neighborhood)
    WHERE neighborhood IS NOT NULL;

-- Recent preference updates
CREATE INDEX idx_preferences_updated ON user_preferences(user_id, updated_at DESC);

-- =============================================
-- SWIPE CONTEXT INDEXES
-- =============================================

-- Context analysis by swipe
CREATE INDEX idx_swipe_context_swipe ON swipe_context(swipe_id);

-- ML feature extraction
CREATE INDEX idx_swipe_context_features ON swipe_context(
    friends_attending_count,
    user_calendar_density,
    created_at
);

-- Time-based context analysis
CREATE INDEX idx_swipe_context_temporal ON swipe_context(time_of_day, day_of_week);

-- =============================================
-- ML EVENT FEATURES INDEXES
-- =============================================

-- Event feature lookup
CREATE INDEX idx_ml_features_event ON ml_event_features(event_id);

-- Feature computation tracking
CREATE INDEX idx_ml_features_computed ON ml_event_features(computed_at DESC);

-- Feature vector similarity (for future vector similarity searches)
-- Note: For real vector similarity, consider using pgvector extension
CREATE INDEX idx_ml_features_vector_length ON ml_event_features(array_length(feature_vector, 1));

-- =============================================
-- NOTIFICATIONS INDEXES
-- =============================================

-- User's notifications
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Unread notifications
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC)
    WHERE is_read = false;

-- Notification type filtering
CREATE INDEX idx_notifications_type ON notifications(user_id, type, created_at DESC);

-- =============================================
-- AUDIT LOGS INDEXES
-- =============================================

-- User activity audit
CREATE INDEX idx_audit_user_action ON audit_logs(user_id, created_at DESC);

-- Resource audit trail
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- Action-based audit queries
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- Security audit (IP tracking)
CREATE INDEX idx_audit_ip ON audit_logs(ip_address, created_at DESC)
    WHERE ip_address IS NOT NULL;

-- =============================================
-- EVENT SOURCES INDEXES
-- =============================================

-- Background job scheduling
CREATE INDEX idx_event_sources_next_sync ON event_sources(next_sync)
    WHERE is_active = true;

-- Sync status monitoring
CREATE INDEX idx_event_sources_status ON event_sources(sync_status, last_sync DESC);

-- Active sources
CREATE INDEX idx_event_sources_active ON event_sources(source_name) WHERE is_active = true;

-- =============================================
-- SWIPE RECOMMENDATION FEEDBACK INDEXES
-- =============================================

-- ML accuracy tracking
CREATE INDEX idx_feedback_user ON swipe_recommendation_feedback(user_id, created_at DESC);

-- Accuracy analysis
CREATE INDEX idx_feedback_accuracy ON swipe_recommendation_feedback(was_accurate, prediction_confidence);

-- Event feedback
CREATE INDEX idx_feedback_event ON swipe_recommendation_feedback(event_id, was_accurate);

-- =============================================
-- COMPOUND INDEXES FOR COMPLEX QUERIES
-- =============================================

-- Event discovery with multiple filters
CREATE INDEX idx_events_discovery_compound ON events(
    category, neighborhood, date_time, price_min
) WHERE is_active = true AND moderation_status = 'approved';

-- User activity analysis
CREATE INDEX idx_user_activity_compound ON swipes(
    user_id, created_at, direction
);

-- Social activity feed
CREATE INDEX idx_social_activity ON swipes(
    visibility, created_at DESC, user_id
) WHERE visibility IN ('friends', 'public') AND direction IN ('right', 'up');

-- Friend recommendations
CREATE INDEX idx_friend_recommendations ON friendships(
    status, user_id, created_at
) WHERE status = 'accepted';

-- Event popularity calculation
CREATE INDEX idx_event_popularity_calc ON swipes(
    event_id, direction, created_at
) WHERE direction IN ('right', 'up', 'left', 'down');

-- =============================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- =============================================

-- Active users only
CREATE INDEX idx_users_active_only ON users(id, email) WHERE is_active = true;

-- Future events only
CREATE INDEX idx_events_future_only ON events(date_time, category)
    WHERE is_active = true AND moderation_status = 'approved';

-- Recent swipes for analytics
CREATE INDEX idx_swipes_recent ON swipes(user_id, event_id, direction);

-- Pending friend requests
CREATE INDEX idx_friendships_pending_requests ON friendships(friend_user_id, user_id)
    WHERE status = 'pending';

-- Unread notifications count
CREATE INDEX idx_notifications_unread_count ON notifications(user_id)
    WHERE is_read = false;

-- =============================================
-- STATISTICS UPDATE
-- =============================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE events;
ANALYZE swipes;
ANALYZE event_attendance;
ANALYZE friendships;
ANALYZE groups;
ANALYZE group_members;
ANALYZE invitations;
ANALYZE user_preferences;
ANALYZE swipe_context;
ANALYZE ml_event_features;
ANALYZE notifications;
ANALYZE audit_logs;
ANALYZE event_sources;
ANALYZE swipe_recommendation_feedback;

-- =============================================
-- INDEX USAGE MONITORING
-- =============================================

-- View to monitor index usage (for production optimization)
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Function to get unused indexes (for cleanup)
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.nspname::TEXT as schema_name,
        c.relname::TEXT as table_name,
        i.relname::TEXT as index_name,
        pg_size_pretty(pg_relation_size(i.oid))::TEXT as index_size
    FROM
        pg_class i
        JOIN pg_index ix ON i.oid = ix.indexrelid
        JOIN pg_class c ON ix.indrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_stat_user_indexes sui ON i.oid = sui.indexrelid
    WHERE
        n.nspname = 'public'
        AND NOT ix.indisunique
        AND NOT ix.indisprimary
        AND (sui.idx_scan IS NULL OR sui.idx_scan < 50) -- Adjust threshold as needed
    ORDER BY pg_relation_size(i.oid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Indexes complete!
-- These indexes are optimized for:
-- 1. Event discovery and filtering
-- 2. Social features (friends, groups)
-- 3. User preferences and ML
-- 4. Real-time notifications
-- 5. Background job efficiency
-- 6. Security and audit trails

-- Monitor index usage regularly in production and adjust as needed