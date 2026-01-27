-- Event Sources Table for Scraper Health Tracking
--
-- This migration creates the event_sources table to track the health and status
-- of event scrapers. Each scraper (e.g., Eventbrite, Meetup, Dice.fm) registers
-- as a source and updates its sync status after each run.
--
-- The table tracks:
-- - Last sync time and status (success/partial/failed)
-- - Event counts (found, new, updated) per sync
-- - Error messages for debugging failed syncs
-- - Scheduling info (next_sync_at, is_enabled)
--
-- This enables monitoring dashboards, alerting on scraper failures, and
-- understanding event data freshness across sources.

-- =============================================
-- EVENT_SOURCES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS event_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT UNIQUE NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed')),
    events_found INT DEFAULT 0,
    events_new INT DEFAULT 0,
    events_updated INT DEFAULT 0,
    error_message TEXT,
    next_sync_at TIMESTAMPTZ,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for quick lookups by source name
CREATE INDEX IF NOT EXISTS idx_event_sources_source_name ON event_sources(source_name);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on the table
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage event_sources
-- This ensures scrapers (running with service role) can read/write,
-- but regular users cannot access scraper health data directly
CREATE POLICY "Service role can manage event_sources"
    ON event_sources
    FOR ALL
    USING (auth.role() = 'service_role');
