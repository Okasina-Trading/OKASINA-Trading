-- Fix 'orders_status_check' constraint
-- The current constraint seems to reject lowercase values or has a mismatch.
-- We will replace it with a comprehensive check that allows both lowercase and Title Case to be safe.

-- First, drop the existing constraint if it exists. 
-- Note: We use valid SQL to drop only if it exists to avoid errors.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- ADD the new constraint allowing diverse casing
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending', 'processing', 'shipped', 'completed', 'cancelled',
    'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'
));

-- Verify: We make sure the column is text
ALTER TABLE public.orders ALTER COLUMN status TYPE text;

-- Reload config
NOTIFY pgrst, 'reload config';
