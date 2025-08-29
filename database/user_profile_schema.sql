-- User Profile Management Database Schema
-- Enhanced schema for comprehensive user management with privacy and security

-- Users table with comprehensive profile fields
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile Information
    full_name VARCHAR(255),
    age INTEGER CHECK (age >= 18 AND age <= 100),
    location_neighborhood VARCHAR(100),
    privacy_level VARCHAR(20) DEFAULT 'private' CHECK (privacy_level IN ('private', 'friends_only', 'public')),
    
    -- Contact Information
    phone_hash VARCHAR(64), -- Hashed phone number for privacy
    profile_image_url VARCHAR(500),
    
    -- User Preferences and ML Data
    preferences JSONB DEFAULT '{}',
    ml_preference_vector REAL[] DEFAULT '{}',
    push_token VARCHAR(255),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User Settings table for key-value preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint on user_id + setting_key
    UNIQUE(user_id, setting_key)
);

-- User Sessions table for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    
    -- Session metadata
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    location_info JSONB DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Log for security monitoring
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Additional context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password History for preventing reuse
CREATE TABLE IF NOT EXISTS user_password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Blocked/Reported accounts
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate blocks
    UNIQUE(blocker_id, blocked_id),
    -- Prevent self-blocking
    CHECK (blocker_id != blocked_id)
);

-- Profile Views for analytics
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    view_type VARCHAR(50) DEFAULT 'profile_visit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent self-viewing logs
    CHECK (viewer_id IS NULL OR viewer_id != viewed_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_neighborhood) WHERE location_neighborhood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON user_password_history(user_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (last_accessed_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource VARCHAR(100) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity_log (
        user_id, action, resource, resource_id, ip_address, 
        user_agent, success, error_message, metadata
    ) VALUES (
        p_user_id, p_action, p_resource, p_resource_id, p_ip_address,
        p_user_agent, p_success, p_error_message, p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user profile with privacy filtering
CREATE OR REPLACE FUNCTION get_user_profile(
    p_user_id UUID,
    p_requesting_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    full_name VARCHAR(255),
    age INTEGER,
    location_neighborhood VARCHAR(100),
    profile_image_url VARCHAR(500),
    privacy_level VARCHAR(20),
    mutual_friends_count INTEGER
) AS $$
BEGIN
    -- Get base user data
    SELECT u.id, u.privacy_level INTO id, privacy_level
    FROM users u
    WHERE u.id = p_user_id AND u.is_active = true;
    
    -- If user not found, return empty
    IF id IS NULL THEN
        RETURN;
    END IF;
    
    -- Return data based on privacy level and relationship
    IF privacy_level = 'public' OR p_user_id = p_requesting_user_id THEN
        -- Return full profile for public users or self
        RETURN QUERY
        SELECT u.id, u.full_name, u.age, u.location_neighborhood, 
               u.profile_image_url, u.privacy_level, 0 as mutual_friends_count
        FROM users u
        WHERE u.id = p_user_id;
    ELSIF privacy_level = 'friends_only' THEN
        -- Check if users are friends (placeholder for friends table)
        -- For now, return limited info
        RETURN QUERY
        SELECT u.id, u.full_name, NULL::INTEGER, NULL::VARCHAR(100),
               u.profile_image_url, u.privacy_level, 0 as mutual_friends_count
        FROM users u
        WHERE u.id = p_user_id;
    ELSE
        -- Private: return minimal info
        RETURN QUERY
        SELECT u.id, NULL::VARCHAR(255), NULL::INTEGER, NULL::VARCHAR(100),
               NULL::VARCHAR(500), u.privacy_level, 0 as mutual_friends_count
        FROM users u
        WHERE u.id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Security policies (Row Level Security)
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data by default
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_settings_own_data ON user_settings
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_sessions_own_data ON user_sessions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Initial data: Add privacy levels enum validation
COMMENT ON COLUMN users.privacy_level IS 'User privacy level: private (minimal info), friends_only (limited to friends), public (all info visible)';
COMMENT ON COLUMN users.phone_hash IS 'SHA-256 hash of phone number for friend discovery without storing actual number';
COMMENT ON COLUMN users.ml_preference_vector IS 'Machine learning preference vector for event recommendations';
COMMENT ON COLUMN users.preferences IS 'User preferences as flexible JSON object';

-- Create application user for API access (with limited privileges)
-- This would be done separately in production with proper role management