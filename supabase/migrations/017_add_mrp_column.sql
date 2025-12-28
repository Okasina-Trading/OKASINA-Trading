-- Add mrp column to products table if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS mrp numeric;

-- Ensure it's numeric for calculations
