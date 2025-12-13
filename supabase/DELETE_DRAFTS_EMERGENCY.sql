-- EMERGENCY: Delete All Draft Products
-- Run this in Supabase SQL Editor if bulk delete keeps failing

-- Option 1: Delete ALL draft products
DELETE FROM products WHERE status = 'draft';

-- Option 2: Delete specific products by ID (if you have them)
-- DELETE FROM products WHERE id IN ('id1', 'id2', 'id3');

-- Option 3: Delete products by name pattern
-- DELETE FROM products WHERE name LIKE 'AZ-%' OR name LIKE 'L-%' OR name LIKE 'RiSi-%' OR name LIKE 'SAW-%';

-- Verify deletion
SELECT status, COUNT(*) as count FROM products GROUP BY status;
