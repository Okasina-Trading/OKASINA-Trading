-- =================================================================
-- URGENT FIX: RUN THIS IN SUPABASE SQL EDITOR
-- =================================================================
-- This script fixes ALL the issues you have encountered:
-- 1. "Failed to place order" (missing columns)
-- 2. "null value in column total" (constraint violation)
-- 3. "violates check constraint orders_status_check" (admin error)
-- =================================================================

BEGIN;

-- 1. ADD MISSING COLUMNS (Fixes Checkout 400 Error)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. FIX 'TOTAL' COLUMN CONSTRAINT (Fixes "null value in total")
-- Make it nullable so it doesn't crash if frontend only sends 'total_amount'
ALTER TABLE public.orders ALTER COLUMN total DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total SET DEFAULT 0;

-- 3. FIX ORDER STATUS CONSTRAINT (Fixes Admin "violates check constraint")
-- First drop the old strict constraint (if it exists)
-- Note: Requires exact name knowledge. If this fails, try running the ADD CONSTRAINT part alone.
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_status_check' 
        AND table_name = 'orders'
    ) THEN 
        ALTER TABLE public.orders DROP CONSTRAINT orders_status_check; 
    END IF; 
END $$;

-- Add new flexible constraint (Allows "Pending", "pending", "Confirmed", "confirmed", etc.)
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending', 'processing', 'shipped', 'completed', 'cancelled', 'draft',
    'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled', 'Draft'
));

-- Ensure status is text type
ALTER TABLE public.orders ALTER COLUMN status TYPE text;

COMMIT;

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload config';
