-- 1. HEAL: Reset any existing negative stock to 0
-- This is necessary because adding the constraint will fail if violations exist.
UPDATE public.products
SET stock_qty = 0
WHERE stock_qty < 0;

-- 2. SHIELD: Add the constraint to prevent future negative stock
ALTER TABLE public.products
ADD CONSTRAINT check_stock_positive CHECK (stock_qty >= 0);

-- 3. NOTIFY: Log the change (Optional, Supabase usually handles logs)
-- This ensures that from now on, any attempt to decrement stock below 0 will throw a database error.
