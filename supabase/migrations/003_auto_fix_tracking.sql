-- Auto-Fix Attempt Tracking Table
-- Prevents runaway auto-fixes by limiting retries

CREATE TABLE IF NOT EXISTS az_auto_fix_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type TEXT NOT NULL,
    project TEXT DEFAULT 'okasina',
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    agent_name TEXT,
    details JSONB,
    before_state JSONB,
    after_state JSONB,
    changes_made TEXT[]
);

-- Index for fast 24h lookups
CREATE INDEX IF NOT EXISTS idx_auto_fix_attempts_recent 
    ON az_auto_fix_attempts(error_type, attempted_at DESC)
    WHERE attempted_at > NOW() - INTERVAL '24 hours';

-- Function to check if retry limit exceeded
CREATE OR REPLACE FUNCTION check_auto_fix_retry_limit(
    p_error_type TEXT,
    p_max_retries INT DEFAULT 3
) RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INT;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM az_auto_fix_attempts
    WHERE error_type = p_error_type
      AND attempted_at > NOW() - INTERVAL '24 hours';
    
    RETURN attempt_count < p_max_retries;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT check_auto_fix_retry_limit('env_var_whitespace', 3);
