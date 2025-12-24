
-- Enable RLS (Good practice, but ensure we have policies)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Allow Public Read Access (Anon) - Fixes "No Products" on frontend
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.products FOR SELECT 
USING ( true );

-- 2. Allow Admin/Service Role Full Access
CREATE POLICY "Service role can do anything" 
ON public.products 
USING ( auth.role() = 'service_role' ) 
WITH CHECK ( auth.role() = 'service_role' );

-- 3. Allow Authenticated Users (if logged in) to Read
CREATE POLICY "Authenticated users can view products" 
ON public.products FOR SELECT 
TO authenticated 
USING ( true );
