-- GoDo App Database Schema
-- This script creates the complete Supabase database schema for the GoDo event discovery app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ENUMS
-- =============================================

-- User enums
CREATE TYPE privacy_level AS ENUM ('private', 'friends_only', 'public');

-- Event enums
CREATE TYPE event_category AS ENUM (
    'networking', 'culture', 'fitness', 'food',
    'nightlife', 'outdoor', 'professional'
);

CREATE TYPE event_source AS ENUM (
    'eventbrite', 'resy', 'opentable', 'partiful',
    'nyc_parks', 'nyc_cultural', 'meetup',
    'facebook_events', 'user_generated', 'manual'
);

CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');

-- Swipe enums
CREATE TYPE swipe_direction AS ENUM ('right', 'left', 'up', 'down');
CREATE TYPE swipe_action AS ENUM ('going_private', 'going_shared', 'not_interested', 'maybe_later');
CREATE TYPE calendar_type AS ENUM ('private', 'shared', 'public');
CREATE TYPE visibility_level AS ENUM ('private', 'friends', 'public');

-- Attendance enums
CREATE TYPE attendance_status AS ENUM ('interested', 'going', 'maybe', 'not_going');

-- Group enums
CREATE TYPE group_type AS ENUM ('friend_group', 'interest_group', 'event_group');
CREATE TYPE group_role AS ENUM ('owner', 'admin', 'member');

-- Notification enums
CREATE TYPE notification_type AS ENUM (
    'friend_request', 'event_invitation', 'event_reminder',
    'friend_attending', 'new_event_recommendation', 'group_invitation'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 50),
    location_neighborhood TEXT,
    privacy_level privacy_level DEFAULT 'private',
    preferences JSONB DEFAULT '{}',
    ml_preference_vector REAL[] DEFAULT '{}',
    phone_hash TEXT, -- Hashed phone number for privacy
    profile_image_url TEXT,
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 255),
    description TEXT,
    date_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location_name TEXT NOT NULL CHECK (length(location_name) <= 255),
    location_address TEXT CHECK (length(location_address) <= 500),
    location_point GEOGRAPHY(POINT, 4326), -- PostGIS geometry for lat/lng
    neighborhood TEXT CHECK (length(neighborhood) <= 100),
    category event_category NOT NULL,
    source event_source NOT NULL,
    external_id TEXT CHECK (length(external_id) <= 255),
    external_url TEXT,
    image_url TEXT,
    price_min INTEGER DEFAULT 0 CHECK (price_min >= 0),
    price_max INTEGER CHECK (price_max >= 0),
    capacity INTEGER CHECK (capacity > 0),
    current_attendees INTEGER DEFAULT 0 CHECK (current_attendees >= 0),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_user_generated BOOLEAN DEFAULT false,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    moderation_status moderation_status DEFAULT 'approved',
    accessibility_info JSONB DEFAULT '{}',
    transit_score INTEGER CHECK (transit_score >= 1 AND transit_score <= 10),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    popularity_score REAL DEFAULT 0.0,
    friend_attendance_count INTEGER DEFAULT 0,
    similar_user_attendance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_end_time CHECK (end_time IS NULL OR end_time > date_time),
    CONSTRAINT valid_price_range CHECK (price_max IS NULL OR price_max >= price_min)
);

-- User swipes table
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    direction swipe_direction NOT NULL,
    action swipe_action NOT NULL,
    visibility visibility_level DEFAULT 'private',
    calendar_type calendar_type DEFAULT 'private',
    notes TEXT CHECK (length(notes) <= 500),
    confidence_score REAL DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one swipe per user per event
    UNIQUE(user_id, event_id)
);

-- Event attendance table
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    visibility visibility_level DEFAULT 'private',
    group_id UUID, -- References groups table (defined later)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one attendance record per user per event
    UNIQUE(user_id, event_id)
);

-- =============================================
-- SOCIAL FEATURES
-- =============================================

-- Friendships table
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent self-friendship and duplicate friendships
    CHECK (user_id != friend_user_id),
    UNIQUE(user_id, friend_user_id)
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
    description TEXT,
    type group_type DEFAULT 'friend_group',
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 50 CHECK (max_members > 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role group_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one membership per user per group
    UNIQUE(group_id, user_id)
);

-- Add foreign key reference now that groups table exists
ALTER TABLE event_attendance
ADD CONSTRAINT fk_event_attendance_group
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Event invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one invitation per inviter/invitee/event combination
    UNIQUE(event_id, inviter_user_id, invitee_user_id)
);

-- =============================================
-- ML & ANALYTICS TABLES
-- =============================================

-- User preferences for ML
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    preference_score REAL DEFAULT 0.5 CHECK (preference_score >= 0 AND preference_score <= 1),
    neighborhood TEXT,
    time_preference TEXT,
    price_sensitivity REAL DEFAULT 0.5 CHECK (price_sensitivity >= 0 AND price_sensitivity <= 1),
    social_preference REAL DEFAULT 0.5 CHECK (social_preference >= 0 AND social_preference <= 1),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one preference per user per category
    UNIQUE(user_id, category)
);

-- Swipe context for ML feature extraction
CREATE TABLE swipe_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swipe_id UUID NOT NULL REFERENCES swipes(id) ON DELETE CASCADE,
    swipe_speed_ms INTEGER,
    hesitation_time_ms INTEGER,
    friends_attending_count INTEGER DEFAULT 0,
    weather_condition TEXT,
    time_of_day TEXT,
    day_of_week TEXT,
    user_calendar_density REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML event features (for recommendation engine)
CREATE TABLE ml_event_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    feature_vector REAL[] NOT NULL,
    popularity_features JSONB DEFAULT '{}',
    social_features JSONB DEFAULT '{}',
    temporal_features JSONB DEFAULT '{}',
    location_features JSONB DEFAULT '{}',
    computed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one feature set per event
    UNIQUE(event_id)
);

-- Swipe recommendation feedback for ML improvement
CREATE TABLE swipe_recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    predicted_direction swipe_direction NOT NULL,
    actual_direction swipe_direction NOT NULL,
    prediction_confidence REAL NOT NULL CHECK (prediction_confidence >= 0 AND prediction_confidence <= 1),
    was_accurate BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SYSTEM TABLES
-- =============================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Event sources tracking for background sync jobs
CREATE TABLE event_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name event_source NOT NULL UNIQUE,
    last_sync TIMESTAMPTZ,
    next_sync TIMESTAMPTZ,
    sync_frequency INTERVAL DEFAULT '4 hours',
    is_active BOOLEAN DEFAULT true,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'running', 'completed', 'failed')),
    last_error TEXT,
    events_synced INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for important operations
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_attendance_updated_at BEFORE UPDATE ON event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_sources_updated_at BEFORE UPDATE ON event_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(user1_id UUID, user2_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM friendships f1
        JOIN friendships f2 ON f1.friend_user_id = f2.friend_user_id
        WHERE f1.user_id = user1_id
        AND f2.user_id = user2_id
        AND f1.status = 'accepted'
        AND f2.status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 REAL, lng1 REAL, lat2 REAL, lng2 REAL
) RETURNS REAL AS $$
BEGIN
    RETURN ST_DistanceSphere(
        ST_MakePoint(lng1, lat1),
        ST_MakePoint(lng2, lat2)
    ) / 1000.0; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to update event popularity score
CREATE OR REPLACE FUNCTION update_event_popularity_score(event_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_swipes INTEGER;
    positive_swipes INTEGER;
    popularity REAL;
BEGIN
    -- Count total swipes for this event
    SELECT COUNT(*) INTO total_swipes
    FROM swipes WHERE event_id = event_uuid;

    -- Count positive swipes (right and up)
    SELECT COUNT(*) INTO positive_swipes
    FROM swipes
    WHERE event_id = event_uuid
    AND direction IN ('right', 'up');

    -- Calculate popularity score
    IF total_swipes > 0 THEN
        popularity := positive_swipes::REAL / total_swipes::REAL;
    ELSE
        popularity := 0.0;
    END IF;

    -- Update the event
    UPDATE events
    SET popularity_score = popularity,
        updated_at = NOW()
    WHERE id = event_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update popularity score when swipes are added
CREATE OR REPLACE FUNCTION trigger_update_event_popularity()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_event_popularity_score(NEW.event_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_popularity_on_swipe
    AFTER INSERT OR UPDATE ON swipes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_event_popularity();

-- =============================================
-- VIEWS
-- =============================================

-- View for user's calendar events
CREATE VIEW user_calendar_events AS
SELECT
    s.user_id, -- Include user_id for filtering
    e.*,
    s.direction as swipe_direction,
    s.action as swipe_action,
    s.visibility as event_visibility,
    s.calendar_type,
    s.notes as user_notes,
    ea.status as attendance_status,
    s.created_at as added_to_calendar
FROM events e
JOIN swipes s ON e.id = s.event_id
LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = s.user_id
WHERE s.direction IN ('right', 'up', 'down') -- Events user is interested in
AND e.is_active = true;

-- View for event recommendations (active events user hasn't swiped on)
CREATE VIEW event_recommendations AS
SELECT DISTINCT e.*
FROM events e
LEFT JOIN swipes s ON e.id = s.event_id
WHERE s.id IS NULL -- User hasn't swiped on this event
AND e.is_active = true
AND e.date_time > NOW()
AND e.moderation_status = 'approved';

-- View for friend activity feed
CREATE VIEW friend_activity_feed AS
SELECT
    u.id as friend_id,
    u.full_name as friend_name,
    u.profile_image_url as friend_avatar,
    e.id as event_id,
    e.title as event_title,
    e.date_time as event_date,
    e.location_name,
    e.category,
    s.action as activity_type,
    s.visibility,
    s.created_at as activity_time
FROM users u
JOIN swipes s ON u.id = s.user_id
JOIN events e ON s.event_id = e.id
WHERE s.visibility IN ('friends', 'public')
AND s.action IN ('going_private', 'going_shared')
AND e.date_time > NOW()
ORDER BY s.created_at DESC;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default event sources
INSERT INTO event_sources (source_name, is_active, sync_frequency) VALUES
('eventbrite', true, '2 hours'),
('nyc_parks', true, '6 hours'),
('nyc_cultural', true, '12 hours'),
('meetup', true, '4 hours'),
('user_generated', true, '1 hour');

-- Insert default notifications types configuration (if needed for reference)
-- This is just for documentation - the enum handles the types

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE events IS 'All events from various sources (APIs, user-generated)';
COMMENT ON TABLE swipes IS 'User swipe actions on events with context';
COMMENT ON TABLE event_attendance IS 'Formal attendance tracking for events';
COMMENT ON TABLE friendships IS 'User friend relationships';
COMMENT ON TABLE groups IS 'User-created groups for social features';
COMMENT ON TABLE group_members IS 'Group membership tracking';
COMMENT ON TABLE invitations IS 'Event invitations between friends';
COMMENT ON TABLE user_preferences IS 'ML preferences for recommendation engine';
COMMENT ON TABLE swipe_context IS 'Additional context for ML feature extraction';
COMMENT ON TABLE ml_event_features IS 'Pre-computed ML features for events';
COMMENT ON TABLE notifications IS 'User notifications for app engagement';
COMMENT ON TABLE event_sources IS 'Background job tracking for event sync';
COMMENT ON TABLE audit_logs IS 'Audit trail for important operations';

-- Schema complete!
-- Next: Run 002_rls_policies.sql to set up Row Level Security