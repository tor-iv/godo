-- Row Level Security (RLS) Policies for GoDo App
-- This script sets up comprehensive RLS policies to ensure data privacy and security

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_event_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Event sources table doesn't need RLS (system table)
-- Keep it accessible for background jobs

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM friendships
        WHERE ((user_id = user1_id AND friend_user_id = user2_id)
           OR (user_id = user2_id AND friend_user_id = user1_id))
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a member of a group
CREATE OR REPLACE FUNCTION is_group_member(check_user_id UUID, check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_members
        WHERE user_id = check_user_id AND group_id = check_group_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is group owner/admin
CREATE OR REPLACE FUNCTION is_group_admin(check_user_id UUID, check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_members
        WHERE user_id = check_user_id
        AND group_id = check_group_id
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's privacy level
CREATE OR REPLACE FUNCTION get_user_privacy_level(check_user_id UUID)
RETURNS privacy_level AS $$
DECLARE
    user_privacy privacy_level;
BEGIN
    SELECT privacy_level INTO user_privacy
    FROM users WHERE id = check_user_id;
    RETURN COALESCE(user_privacy, 'private'::privacy_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can view their own profile completely
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view other users based on privacy settings
CREATE POLICY "Users can view others based on privacy" ON users
    FOR SELECT USING (
        CASE
            WHEN privacy_level = 'public' THEN true
            WHEN privacy_level = 'friends_only' THEN are_friends(auth.uid(), id)
            ELSE false -- private profiles not visible to others
        END
    );

-- =============================================
-- EVENTS TABLE POLICIES
-- =============================================

-- All authenticated users can view approved, active events
CREATE POLICY "Users can view approved events" ON events
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND is_active = true
        AND moderation_status = 'approved'
    );

-- Users can insert events they create
CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() = created_by_user_id
        AND is_user_generated = true
    );

-- Users can update events they created
CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (auth.uid() = created_by_user_id);

-- Service role can manage all events (for background jobs)
CREATE POLICY "Service role can manage events" ON events
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- SWIPES TABLE POLICIES
-- =============================================

-- Users can only view their own swipes
CREATE POLICY "Users can view own swipes" ON swipes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own swipes
CREATE POLICY "Users can insert own swipes" ON swipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own swipes (rare, but for corrections)
CREATE POLICY "Users can update own swipes" ON swipes
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- EVENT ATTENDANCE POLICIES
-- =============================================

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance" ON event_attendance
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view friends' public/friends-visible attendance
CREATE POLICY "Users can view friends attendance" ON event_attendance
    FOR SELECT USING (
        visibility IN ('friends', 'public')
        AND are_friends(auth.uid(), user_id)
    );

-- Users can view public attendance
CREATE POLICY "Users can view public attendance" ON event_attendance
    FOR SELECT USING (visibility = 'public');

-- Users can manage their own attendance
CREATE POLICY "Users can manage own attendance" ON event_attendance
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FRIENDSHIPS POLICIES
-- =============================================

-- Users can view friendships they're involved in
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = friend_user_id
    );

-- Users can create friendship requests
CREATE POLICY "Users can create friendship requests" ON friendships
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
    );

-- Users can update friendships they're involved in
CREATE POLICY "Users can update own friendships" ON friendships
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = friend_user_id
    );

-- Users can delete friendships they're involved in
CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (
        auth.uid() = user_id OR auth.uid() = friend_user_id
    );

-- =============================================
-- GROUPS POLICIES
-- =============================================

-- Users can view public groups
CREATE POLICY "Users can view public groups" ON groups
    FOR SELECT USING (is_private = false);

-- Users can view private groups they're members of
CREATE POLICY "Users can view member groups" ON groups
    FOR SELECT USING (
        is_private = true
        AND is_group_member(auth.uid(), id)
    );

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);

-- Only group admins can update groups
CREATE POLICY "Group admins can update groups" ON groups
    FOR UPDATE USING (is_group_admin(auth.uid(), id));

-- Only group owners can delete groups
CREATE POLICY "Group owners can delete groups" ON groups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE user_id = auth.uid()
            AND group_id = id
            AND role = 'owner'
        )
    );

-- =============================================
-- GROUP MEMBERS POLICIES
-- =============================================

-- Users can view members of groups they belong to
CREATE POLICY "Group members can view other members" ON group_members
    FOR SELECT USING (
        is_group_member(auth.uid(), group_id)
    );

-- Users can view members of public groups
CREATE POLICY "Users can view public group members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_id AND is_private = false
        )
    );

-- Group admins can add members
CREATE POLICY "Group admins can add members" ON group_members
    FOR INSERT WITH CHECK (
        is_group_admin(auth.uid(), group_id)
        OR auth.uid() = user_id -- Users can join public groups themselves
    );

-- Group admins can update member roles
CREATE POLICY "Group admins can update members" ON group_members
    FOR UPDATE USING (is_group_admin(auth.uid(), group_id));

-- Group admins and members themselves can remove members
CREATE POLICY "Group admins and self can remove members" ON group_members
    FOR DELETE USING (
        is_group_admin(auth.uid(), group_id)
        OR auth.uid() = user_id
    );

-- =============================================
-- INVITATIONS POLICIES
-- =============================================

-- Users can view invitations they sent
CREATE POLICY "Users can view sent invitations" ON invitations
    FOR SELECT USING (auth.uid() = inviter_user_id);

-- Users can view invitations they received
CREATE POLICY "Users can view received invitations" ON invitations
    FOR SELECT USING (auth.uid() = invitee_user_id);

-- Users can send invitations
CREATE POLICY "Users can send invitations" ON invitations
    FOR INSERT WITH CHECK (auth.uid() = inviter_user_id);

-- Users can update invitations they received (accept/decline)
CREATE POLICY "Users can respond to invitations" ON invitations
    FOR UPDATE USING (auth.uid() = invitee_user_id);

-- Users can delete invitations they sent or received
CREATE POLICY "Users can delete own invitations" ON invitations
    FOR DELETE USING (
        auth.uid() = inviter_user_id OR auth.uid() = invitee_user_id
    );

-- =============================================
-- USER PREFERENCES POLICIES
-- =============================================

-- Users can only view and manage their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SWIPE CONTEXT POLICIES
-- =============================================

-- Users can view swipe context for their own swipes
CREATE POLICY "Users can view own swipe context" ON swipe_context
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM swipes
            WHERE id = swipe_id AND user_id = auth.uid()
        )
    );

-- Users can insert context for their own swipes
CREATE POLICY "Users can insert own swipe context" ON swipe_context
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM swipes
            WHERE id = swipe_id AND user_id = auth.uid()
        )
    );

-- =============================================
-- ML EVENT FEATURES POLICIES
-- =============================================

-- All authenticated users can view ML features (needed for recommendations)
CREATE POLICY "Authenticated users can view ML features" ON ml_event_features
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can manage ML features
CREATE POLICY "Service role can manage ML features" ON ml_event_features
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- SWIPE RECOMMENDATION FEEDBACK POLICIES
-- =============================================

-- Users can view their own recommendation feedback
CREATE POLICY "Users can view own recommendation feedback" ON swipe_recommendation_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recommendation feedback
CREATE POLICY "Users can insert own recommendation feedback" ON swipe_recommendation_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can view all feedback for ML training
CREATE POLICY "Service role can view all feedback" ON swipe_recommendation_feedback
    FOR SELECT USING (auth.role() = 'service_role');

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- AUDIT LOGS POLICIES
-- =============================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all audit logs
CREATE POLICY "Service role can manage audit logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- VIEWS SECURITY
-- =============================================

-- Note: Views automatically inherit RLS policies from their underlying tables
-- PostgreSQL does not support creating RLS policies directly on views
-- The security is enforced by the RLS policies on the base tables:
-- - user_calendar_events inherits from events, swipes, event_attendance tables
-- - event_recommendations inherits from events table
-- - friend_activity_feed inherits from users, swipes, events tables

-- Views are secured through:
-- 1. RLS on underlying tables (events, swipes, users, etc.)
-- 2. WHERE clauses in view definitions that filter by user context
-- 3. Application-level access control when querying views

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to safely get user profile (respects privacy)
CREATE OR REPLACE FUNCTION get_user_profile(target_user_id UUID)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    age INTEGER,
    location_neighborhood TEXT,
    profile_image_url TEXT,
    privacy_level privacy_level,
    mutual_friends_count INTEGER
) SECURITY DEFINER AS $$
DECLARE
    target_privacy privacy_level;
    current_user_id UUID := auth.uid();
BEGIN
    -- Get target user's privacy level
    SELECT u.privacy_level INTO target_privacy
    FROM users u WHERE u.id = target_user_id;

    -- Check if current user can view this profile
    IF target_user_id = current_user_id THEN
        -- User viewing their own profile
        RETURN QUERY
        SELECT u.id, u.full_name, u.age, u.location_neighborhood,
               u.profile_image_url, u.privacy_level,
               0 as mutual_friends_count
        FROM users u WHERE u.id = target_user_id;
    ELSIF target_privacy = 'public' THEN
        -- Public profile
        RETURN QUERY
        SELECT u.id, u.full_name, u.age, u.location_neighborhood,
               u.profile_image_url, u.privacy_level,
               get_mutual_friends_count(current_user_id, target_user_id)
        FROM users u WHERE u.id = target_user_id;
    ELSIF target_privacy = 'friends_only' AND are_friends(current_user_id, target_user_id) THEN
        -- Friends-only profile and users are friends
        RETURN QUERY
        SELECT u.id, u.full_name, u.age, u.location_neighborhood,
               u.profile_image_url, u.privacy_level,
               get_mutual_friends_count(current_user_id, target_user_id)
        FROM users u WHERE u.id = target_user_id;
    ELSE
        -- Profile not accessible - return minimal info
        RETURN QUERY
        SELECT u.id, NULL::TEXT as full_name, NULL::INTEGER as age,
               NULL::TEXT as location_neighborhood, NULL::TEXT as profile_image_url,
               u.privacy_level, 0 as mutual_friends_count
        FROM users u WHERE u.id = target_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get friend suggestions (security definer to access phone hashes safely)
CREATE OR REPLACE FUNCTION get_friend_suggestions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    full_name TEXT,
    profile_image_url TEXT,
    mutual_friends_count INTEGER,
    suggestion_reason TEXT
) SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH existing_friends AS (
        SELECT friend_user_id as friend_id FROM friendships
        WHERE user_id = current_user_id AND status IN ('accepted', 'pending')
        UNION
        SELECT user_id as friend_id FROM friendships
        WHERE friend_user_id = current_user_id AND status IN ('accepted', 'pending')
    ),
    mutual_friends_suggestions AS (
        SELECT DISTINCT
            u.id,
            u.full_name,
            u.profile_image_url,
            get_mutual_friends_count(current_user_id, u.id) as mutual_count,
            'mutual_friends' as reason
        FROM users u
        JOIN friendships f1 ON (u.id = f1.user_id OR u.id = f1.friend_user_id)
        JOIN friendships f2 ON (
            (f1.user_id = f2.user_id OR f1.user_id = f2.friend_user_id OR
             f1.friend_user_id = f2.user_id OR f1.friend_user_id = f2.friend_user_id)
        )
        WHERE (f2.user_id = current_user_id OR f2.friend_user_id = current_user_id)
        AND f1.status = 'accepted' AND f2.status = 'accepted'
        AND u.id != current_user_id
        AND u.id NOT IN (SELECT friend_id FROM existing_friends)
        AND u.privacy_level IN ('public', 'friends_only')
        AND get_mutual_friends_count(current_user_id, u.id) > 0
    )
    SELECT mfs.id, mfs.full_name, mfs.profile_image_url,
           mfs.mutual_count, mfs.reason
    FROM mutual_friends_suggestions mfs
    ORDER BY mfs.mutual_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION are_friends(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_group_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_privacy_level(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_suggestions(INTEGER) TO authenticated;

-- RLS setup complete!
-- Next: Run 003_indexes.sql to optimize performance