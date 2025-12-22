-- Fix carts table to match Frontend JSON usage
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS email TEXT;

-- Add Unique Constraint for UPSERT (onConflict: 'user_id')
-- We use a safe block to avoid errors if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_user_id_key') THEN
        ALTER TABLE public.carts ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);
    END IF;
END $$;
