-- Godo Backend Database Schema
-- Enhanced schema for social features, ML recommendations, and real-time updates

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_sources CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS event_attendance CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS swipes CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table (Enhanced)
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

-- Events Table (Enhanced)
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
    category VARCHAR(50) NOT NULL CHECK (category IN ('networking', 'culture', 'fitness', 'food', 'nightlife', 'outdoor', 'professional')),
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
    transit_score INTEGER CHECK (transit_score >= 1 AND transit_score <= 10), -- NYC transit accessibility
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Swipes Table (Enhanced)
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('right', 'left', 'up', 'down')),
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- ML confidence in swipe prediction
    context_data JSONB DEFAULT '{}', -- Time, location, friends attending, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one swipe per user per event
    UNIQUE(user_id, event_id)
);

-- Friendships Table
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

-- Groups Table
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

-- Group Members Table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Event Attendance (Enhanced)
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

-- User Preferences (ML)
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

-- Notifications Table
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- Event Sources (Background Jobs)
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

-- Create Indexes for Performance
CREATE INDEX idx_users_neighborhood ON users(location_neighborhood);
CREATE INDEX idx_users_active ON users(is_active, last_login);

CREATE INDEX idx_events_date_time ON events(date_time);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_location ON events(latitude, longitude);
CREATE INDEX idx_events_neighborhood ON events(neighborhood);
CREATE INDEX idx_events_active ON events(is_active, date_time);
CREATE INDEX idx_events_user_generated ON events(is_user_generated, moderation_status);

CREATE INDEX idx_swipes_user_direction ON swipes(user_id, direction);
CREATE INDEX idx_swipes_event ON swipes(event_id);
CREATE INDEX idx_swipes_created_at ON swipes(created_at);

CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);

CREATE INDEX idx_event_attendance_user ON event_attendance(user_id, status);
CREATE INDEX idx_event_attendance_event ON event_attendance(event_id, visibility);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_category ON user_preferences(category, preference_score);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for, is_sent);

-- Create Functions and Triggers

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_attendance_updated_at BEFORE UPDATE ON event_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_sources_updated_at BEFORE UPDATE ON event_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user preferences based on swipe
CREATE OR REPLACE FUNCTION update_user_preference(
    p_user_id UUID,
    p_category VARCHAR(50),
    p_adjustment DECIMAL(3,2)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_preferences (user_id, category, preference_score)
    VALUES (p_user_id, p_category, GREATEST(0, LEAST(1, 0.5 + p_adjustment)))
    ON CONFLICT (user_id, category, neighborhood, time_preference)
    DO UPDATE SET
        preference_score = GREATEST(0, LEAST(1, user_preferences.preference_score + p_adjustment)),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get trending events (called via RPC)
CREATE OR REPLACE FUNCTION get_trending_events(
    since_date TIMESTAMP,
    event_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    date_time TIMESTAMP,
    location_name VARCHAR(255),
    category VARCHAR(50),
    image_url TEXT,
    right_swipes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.date_time,
        e.location_name,
        e.category,
        e.image_url,
        COUNT(s.id) as right_swipes
    FROM events e
    LEFT JOIN swipes s ON e.id = s.event_id 
    WHERE 
        e.is_active = true 
        AND e.date_time > NOW()
        AND (s.direction = 'right' OR s.direction IS NULL)
        AND (s.created_at > since_date OR s.created_at IS NULL)
    GROUP BY e.id, e.title, e.description, e.date_time, e.location_name, e.category, e.image_url
    ORDER BY right_swipes DESC, e.date_time ASC
    LIMIT event_limit;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see their own data and public profiles of others
CREATE POLICY "Users can view own profile" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (privacy_level = 'public');
CREATE POLICY "Users can view friends profiles" ON users FOR SELECT USING (
    privacy_level = 'friends_only' AND EXISTS (
        SELECT 1 FROM friendships 
        WHERE (user_id = auth.uid() AND friend_id = users.id OR user_id = users.id AND friend_id = auth.uid()) 
        AND status = 'accepted'
    )
);

-- Events: All users can view active events
CREATE POLICY "Anyone can view active events" ON events FOR SELECT USING (is_active = true AND moderation_status = 'approved');
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = created_by_user_id);

-- Swipes: Users can only manage their own swipes
CREATE POLICY "Users can manage own swipes" ON swipes FOR ALL USING (auth.uid() = user_id);

-- Friendships: Users can manage their own friendships
CREATE POLICY "Users can manage own friendships" ON friendships FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Groups: Users can view groups they're members of
CREATE POLICY "Users can view own groups" ON groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
    OR privacy_level = 'public'
);
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can manage groups" ON groups FOR UPDATE USING (auth.uid() = created_by);

-- Group Members: Users can view members of groups they belong to
CREATE POLICY "Users can view group members" ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Event Attendance: Users can manage their own attendance
CREATE POLICY "Users can manage own attendance" ON event_attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public attendance" ON event_attendance FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can view friends attendance" ON event_attendance FOR SELECT USING (
    visibility = 'friends' AND EXISTS (
        SELECT 1 FROM friendships 
        WHERE (user_id = auth.uid() AND friend_id = event_attendance.user_id) 
        AND status = 'accepted'
    )
);

-- User Preferences: Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Insert default event sources
INSERT INTO event_sources (source_name, sync_frequency, is_active) VALUES
('eventbrite', '4 hours', true),
('nyc_parks', '6 hours', true),
('met_museum', '12 hours', true),
('nyc_cultural', '8 hours', true),
('ticketmaster', '4 hours', true);

-- Insert sample NYC neighborhoods
INSERT INTO users (id, email, full_name, age, location_neighborhood, privacy_level) VALUES
(uuid_generate_v4(), 'demo@godo.app', 'Demo User', 25, 'East Village', 'public');

COMMIT;