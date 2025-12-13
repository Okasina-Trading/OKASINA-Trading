-- MANUAL DATA MIGRATION VIA SQL
-- Run this in NEW Supabase SQL Editor (hthkrbtwfymaxtnvshfz)
-- This bypasses the schema cache issue

-- You'll need to get the data from old Supabase first:
-- 1. Go to old Supabase → SQL Editor
-- 2. Run: SELECT * FROM products;
-- 3. Export as CSV
-- 4. Then use Table Editor → Import CSV in new Supabase

-- OR use this approach:
-- Copy the INSERT statements generated from old database

-- Example for products (you'll need to fill in actual data):
/*
INSERT INTO products (id, name, description, category, price, price_mur, stock_qty, status, image_url)
VALUES 
  ('uuid-1', 'Product 1', 'Description', 'Category', 100, 5000, 10, 'active', 'url'),
  ('uuid-2', 'Product 2', 'Description', 'Category', 200, 10000, 5, 'active', 'url');
*/

-- Verification after import:
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_settings FROM settings;
