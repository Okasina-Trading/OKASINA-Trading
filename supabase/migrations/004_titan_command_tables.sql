-- TITAN Command Standard Tables
-- az_agent_runs: Observability for all autonomous agents

CREATE TABLE IF NOT EXISTS az_agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL UNIQUE,
    agent_name TEXT NOT NULL,
    mission_id UUID,
    status TEXT NOT NULL CHECK (status IN ('success', 'soft_fail', 'hard_fail')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000
    ) STORED,
    error_code TEXT,
    error_message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON az_agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON az_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON az_agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_mission_id ON az_agent_runs(mission_id) WHERE mission_id IS NOT NULL;

-- Auto-Fix Attempt Tracking
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

CREATE INDEX IF NOT EXISTS idx_auto_fix_attempts_recent 
    ON az_auto_fix_attempts(error_type, attempted_at DESC)
    WHERE attempted_at > NOW() - INTERVAL '24 hours';

-- Function to check retry limits
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

-- View for recent agent activity
CREATE OR REPLACE VIEW az_agent_activity AS
SELECT 
    agent_name,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'success') as successes,
    COUNT(*) FILTER (WHERE status = 'soft_fail') as soft_fails,
    COUNT(*) FILTER (WHERE status = 'hard_fail') as hard_fails,
    AVG(duration_ms) as avg_duration_ms,
    MAX(started_at) as last_run
FROM az_agent_runs
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY agent_name
ORDER BY last_run DESC;

-- Verify tables created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('az_agent_runs', 'az_auto_fix_attempts')
ORDER BY table_name;
