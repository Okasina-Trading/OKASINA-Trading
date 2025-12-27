-- Fix 'total' column constraint in orders table
-- The 'total' column exists but is enforcing NOT NULL, causing failures when only 'total_amount' is sent.
-- We make it NULLABLE to be safe, and also default it to 0.

ALTER TABLE public.orders ALTER COLUMN total DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total SET DEFAULT 0;

-- Optional: If 'total' is intended to be same as 'total_amount', we can create a trigger to sync them, 
-- but correctly populating it from frontend (as done in the code fix) is the immediate solution.
-- This migration ensures that if frontend misses it, the DB won't crash.

NOTIFY pgrst, 'reload config';
