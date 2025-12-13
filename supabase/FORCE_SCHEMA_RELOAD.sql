-- EMERGENCY: Force Supabase Schema Cache Reload
-- Run this in Supabase SQL Editor to fix "table not found in schema cache" errors

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: If above doesn't work, restart the connection pool
-- (This requires Supabase dashboard access - Settings → Database → Restart)

-- Verify tables exist after reload:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('wishlists', 'az_agent_runs', 'az_auto_fix_attempts')
ORDER BY table_name;

-- Expected output:
-- az_agent_runs
-- az_auto_fix_attempts  
-- wishlists
