-- Add material and colors columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS colors text; -- storing as comma-separated string for simplicity in admin editing

-- Add index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_products_material ON public.products(material);
-- We can't easily index CSV text for search without Full Text Search or Array, but for small scale this is fine.
-- If we wanted array: ADD COLUMN colors text[] ... but UI is simpler with text input "Red, Blue".
