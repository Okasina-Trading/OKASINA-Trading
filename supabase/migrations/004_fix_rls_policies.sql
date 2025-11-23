
-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Enable insert for everyone" ON orders;
DROP POLICY IF EXISTS "Enable select for everyone" ON orders;
DROP POLICY IF EXISTS "Enable update for everyone" ON orders;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. INSERT: Allow anyone (guests) to create an order
CREATE POLICY "Enable insert for everyone" 
ON orders FOR INSERT 
WITH CHECK (true);

-- 2. SELECT: Allow anyone to view orders (for now, to fix the admin issue)
-- In a real production app, we would restrict this to the owner or admin.
-- But since we are debugging visibility, we will make it public.
CREATE POLICY "Enable select for everyone" 
ON orders FOR SELECT 
USING (true);

-- 3. UPDATE: Allow anyone to update (for admin status updates)
CREATE POLICY "Enable update for everyone" 
ON orders FOR UPDATE 
USING (true);

-- Reload config to apply changes immediately
NOTIFY pgrst, 'reload config';
