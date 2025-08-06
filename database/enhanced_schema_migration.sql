-- Enhanced Swipe System Database Migration
-- Adds support for friend invitations, calendar management, and enhanced swipe functionality

-- Begin transaction for atomic migration
BEGIN;

-- Add new columns to existing event_attendance table
ALTER TABLE event_attendance 
ADD COLUMN IF NOT EXISTS calendar_type VARCHAR(20) DEFAULT 'private' 
  CHECK (calendar_type IN ('private', 'shared', 'public')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS invited_friends_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_edited TIMESTAMP DEFAULT NOW();

-- Update existing records to have calendar_type based on visibility
UPDATE event_attendance 
SET calendar_type = CASE 
  WHEN visibility = 'private' THEN 'private'
  WHEN visibility = 'friends' THEN 'shared'
  WHEN visibility = 'public' THEN 'public'
  ELSE 'private'
END
WHERE calendar_type IS NULL;

-- Create event invitations table
CREATE TABLE IF NOT EXISTS event_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    invitation_type VARCHAR(20) DEFAULT 'friend_invite' CHECK (invitation_type IN ('friend_invite', 'group_invite')),
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Constraints
    UNIQUE(event_id, inviter_id, invitee_id),
    CHECK (inviter_id != invitee_id)
);

-- Create invitation responses table for detailed tracking
CREATE TABLE IF NOT EXISTS invitation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES event_invitations(id) ON DELETE CASCADE,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('accepted', 'declined', 'maybe')),
    response_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create swipe contexts table for ML feature tracking
CREATE TABLE IF NOT EXISTS swipe_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swipe_id UUID NOT NULL REFERENCES swipes(id) ON DELETE CASCADE,
    swipe_speed_ms INTEGER,
    hesitation_time_ms INTEGER,
    friends_attending_count INTEGER DEFAULT 0,
    weather_condition VARCHAR(50),
    time_of_day VARCHAR(20),
    day_of_week VARCHAR(20),
    user_calendar_density DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee ON event_invitations(invitee_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_event_invitations_event ON event_invitations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_invitations_inviter ON event_invitations(inviter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_event_invitations_expires ON event_invitations(expires_at, status);

CREATE INDEX IF NOT EXISTS idx_invitation_responses_invitation ON invitation_responses(invitation_id, response_type);
CREATE INDEX IF NOT EXISTS idx_invitation_responses_created ON invitation_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_swipe_contexts_swipe ON swipe_contexts(swipe_id);
CREATE INDEX IF NOT EXISTS idx_swipe_contexts_created ON swipe_contexts(created_at);

CREATE INDEX IF NOT EXISTS idx_event_attendance_calendar_type ON event_attendance(calendar_type, status);
CREATE INDEX IF NOT EXISTS idx_event_attendance_last_edited ON event_attendance(last_edited);

-- Add trigger to update last_edited on event_attendance updates
CREATE OR REPLACE FUNCTION update_event_attendance_last_edited()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_edited = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_event_attendance_last_edited ON event_attendance;
CREATE TRIGGER trigger_update_event_attendance_last_edited 
BEFORE UPDATE ON event_attendance 
FOR EACH ROW EXECUTE FUNCTION update_event_attendance_last_edited();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE event_invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's calendar events with filtering
CREATE OR REPLACE FUNCTION get_user_calendar_events(
    p_user_id UUID,
    p_calendar_type VARCHAR(20) DEFAULT 'all',
    p_status VARCHAR(20) DEFAULT 'all',
    p_date_from TIMESTAMP DEFAULT NOW(),
    p_date_to TIMESTAMP DEFAULT (NOW() + INTERVAL '3 months'),
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    event_id UUID,
    event_title VARCHAR(255),
    event_description TEXT,
    event_date_time TIMESTAMP,
    event_location_name VARCHAR(255),
    event_category VARCHAR(50),
    event_image_url TEXT,
    attendance_status VARCHAR(20),
    calendar_type VARCHAR(20),
    visibility VARCHAR(20),
    notes TEXT,
    invited_friends_count INTEGER,
    last_edited TIMESTAMP
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
        ea.status,
        ea.calendar_type,
        ea.visibility,
        ea.notes,
        ea.invited_friends_count,
        ea.last_edited
    FROM events e
    INNER JOIN event_attendance ea ON e.id = ea.event_id
    WHERE ea.user_id = p_user_id
    AND e.date_time >= p_date_from
    AND e.date_time <= p_date_to
    AND (p_calendar_type = 'all' OR ea.calendar_type = p_calendar_type)
    AND (p_status = 'all' OR ea.status = p_status)
    AND e.is_active = true
    ORDER BY e.date_time ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending invitations for a user
CREATE OR REPLACE FUNCTION get_user_pending_invitations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    invitation_id UUID,
    event_id UUID,
    event_title VARCHAR(255),
    event_date_time TIMESTAMP,
    event_location_name VARCHAR(255),
    inviter_id UUID,
    inviter_name VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ei.id,
        e.id,
        e.title,
        e.date_time,
        e.location_name,
        u.id,
        u.full_name,
        ei.message,
        ei.created_at,
        ei.expires_at
    FROM event_invitations ei
    INNER JOIN events e ON ei.event_id = e.id
    INNER JOIN users u ON ei.inviter_id = u.id
    WHERE ei.invitee_id = p_user_id
    AND ei.status = 'pending'
    AND ei.expires_at > NOW()
    AND e.is_active = true
    ORDER BY ei.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to update invitation response and create attendance record
CREATE OR REPLACE FUNCTION respond_to_invitation(
    p_invitation_id UUID,
    p_response_type VARCHAR(20),
    p_response_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
    attendance_status VARCHAR(20);
    attendance_visibility VARCHAR(20);
BEGIN
    -- Get invitation details
    SELECT ei.*, e.id as event_id INTO invitation_record
    FROM event_invitations ei
    INNER JOIN events e ON ei.event_id = e.id
    WHERE ei.id = p_invitation_id
    AND ei.status = 'pending'
    AND ei.expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update invitation status
    UPDATE event_invitations 
    SET status = p_response_type,
        responded_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Create response record
    INSERT INTO invitation_responses (invitation_id, response_type, response_message)
    VALUES (p_invitation_id, p_response_type, p_response_message);
    
    -- Create or update event attendance based on response
    IF p_response_type = 'accepted' THEN
        attendance_status := 'going';
        attendance_visibility := 'friends';
        
        INSERT INTO event_attendance (
            user_id, event_id, status, visibility, calendar_type, created_at, updated_at
        ) VALUES (
            invitation_record.invitee_id, 
            invitation_record.event_id, 
            attendance_status, 
            attendance_visibility, 
            'shared', 
            NOW(), 
            NOW()
        ) ON CONFLICT (user_id, event_id) 
        DO UPDATE SET 
            status = attendance_status,
            visibility = attendance_visibility,
            calendar_type = 'shared',
            updated_at = NOW();
            
    ELSIF p_response_type = 'maybe' THEN
        attendance_status := 'maybe';
        attendance_visibility := 'private';
        
        INSERT INTO event_attendance (
            user_id, event_id, status, visibility, calendar_type, created_at, updated_at
        ) VALUES (
            invitation_record.invitee_id, 
            invitation_record.event_id, 
            attendance_status, 
            attendance_visibility, 
            'private', 
            NOW(), 
            NOW()
        ) ON CONFLICT (user_id, event_id) 
        DO UPDATE SET 
            status = attendance_status,
            updated_at = NOW();
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for new tables

-- Enable RLS on new tables
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_contexts ENABLE ROW LEVEL SECURITY;

-- Event invitations policies
CREATE POLICY "Users can view invitations they sent or received" ON event_invitations
FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invitations they send" ON event_invitations
FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update invitations they received" ON event_invitations
FOR UPDATE USING (auth.uid() = invitee_id);

-- Invitation responses policies
CREATE POLICY "Users can view responses to their invitations" ON invitation_responses
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM event_invitations ei 
        WHERE ei.id = invitation_responses.invitation_id 
        AND (ei.inviter_id = auth.uid() OR ei.invitee_id = auth.uid())
    )
);

CREATE POLICY "Users can create responses to invitations they received" ON invitation_responses
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM event_invitations ei 
        WHERE ei.id = invitation_responses.invitation_id 
        AND ei.invitee_id = auth.uid()
    )
);

-- Swipe contexts policies
CREATE POLICY "Users can manage their own swipe contexts" ON swipe_contexts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM swipes s 
        WHERE s.id = swipe_contexts.swipe_id 
        AND s.user_id = auth.uid()
    )
);

-- Insert sample data for testing (optional)
-- Uncomment for development/testing

/*
-- Sample invitation data
INSERT INTO event_invitations (event_id, inviter_id, invitee_id, message) 
SELECT 
    e.id,
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM users OFFSET 1 LIMIT 1),
    'Hey! Want to join me for this event?'
FROM events e 
WHERE e.is_active = true 
LIMIT 1;
*/

COMMIT;