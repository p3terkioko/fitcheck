-- FitCheck — Follow-up questions persistence
-- Run: psql -U postgres -d fitcheck -f database/schema_followups.sql

CREATE TABLE IF NOT EXISTS follow_up_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    related_evidence JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_followups_verification_id
    ON follow_up_questions(verification_id);
CREATE INDEX IF NOT EXISTS idx_followups_user_id
    ON follow_up_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_followups_created_at
    ON follow_up_questions(created_at ASC);

GRANT SELECT, INSERT, DELETE ON follow_up_questions TO fitcheck_user;
