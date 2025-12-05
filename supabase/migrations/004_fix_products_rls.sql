-- Fix RLS policies for products table to allow admin updates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to published products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow anon updates for admin" ON products;

-- Create new policies with proper permissions
CREATE POLICY "Allow public read access to published products"
  ON products FOR SELECT
  USING (status = 'published' OR status = 'active');

CREATE POLICY "Allow all operations for authenticated users"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also ensure anon key can update (for admin operations)
CREATE POLICY "Allow anon updates for admin"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);
