-- ─────────────────────────────────────────────────────────────────────────────
-- FitCheck — Schema Additions
-- New tables only. Do not modify or repeat existing research_papers table.
-- Run: psql -U postgres -d fitcheck -f database/schema_additions.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- Synced from Supabase Auth. Created on first login.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,

    -- User health profile (collected once at onboarding)
    age_group VARCHAR(20) CHECK (age_group IN (
        'under_18', '18_35', '36_55', '55_plus'
    )),
    biological_sex VARCHAR(20) CHECK (biological_sex IN (
        'male', 'female', 'prefer_not_to_say'
    )),
    -- Array of condition strings
    -- Valid values: 'pregnant', 'postpartum', 'cardiovascular',
    -- 'diabetes', 'kidney_liver', 'osteoporosis', 'none'
    conditions TEXT[] DEFAULT '{}',
    additional_context TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSCRIPTS
-- Cache layer for URL-based submissions.
-- Audio is deleted immediately after transcription.
-- Transcript is stored and reused for the same URL.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    url_hash VARCHAR(64) UNIQUE NOT NULL,   -- SHA256 of normalized URL
    transcript TEXT NOT NULL,
    platform VARCHAR(20),                   -- 'tiktok', 'instagram', 'youtube'
    word_count INTEGER,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_transcripts_url_hash
    ON transcripts(url_hash);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATIONS
-- Every claim verification tied to a user.
-- Stores the full result for history display.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim TEXT NOT NULL,
    result JSONB NOT NULL,
    input_type VARCHAR(10) CHECK (input_type IN ('text', 'url')),
    source_url TEXT,
    transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verifications_user_id
    ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_created_at
    ON verifications(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER FOR USERS
-- reuses the existing update_updated_at_column() function
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
