-- CRITICAL: Verify tables actually exist in database
-- Run this in Supabase SQL Editor

-- Check if tables exist
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('wishlists', 'az_agent_runs', 'az_auto_fix_attempts', 'products', 'orders')
ORDER BY table_name;

-- If wishlists is missing, create it:
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- If az_agent_runs is missing, create it:
CREATE TABLE IF NOT EXISTS public.az_agent_runs (
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

-- Force schema reload
NOTIFY pgrst, 'reload schema';

-- Verify again
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
