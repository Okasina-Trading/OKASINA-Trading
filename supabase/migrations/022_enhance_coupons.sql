-- Add usage tracking and expiry to coupons
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Ensure RLS is permissive for admins (simulating 'authenticated')
DROP POLICY IF EXISTS "Authenticated users can manage coupons" ON public.coupons;

CREATE POLICY "Authenticated users can manage coupons"
ON public.coupons FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
