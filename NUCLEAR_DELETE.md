# NUCLEAR OPTION - Delete All Products via SQL

If the admin panel delete keeps failing, use this SQL directly in Supabase:

## Step 1: Go to Supabase SQL Editor
https://supabase.com → Your Project → SQL Editor

## Step 2: Run ONE of these commands

### Option A: Delete ALL draft products
```sql
DELETE FROM products WHERE status = 'draft';
```

### Option B: Delete ALL products (nuclear option)
```sql
DELETE FROM products;
```

### Option C: Delete products by supplier
```sql
-- Delete Riddhi Siddhi products
DELETE FROM products WHERE tags @> ARRAY['Riddhi Siddhi'];

-- Delete Azysh products  
DELETE FROM products WHERE tags @> ARRAY['Azysh'];

-- Delete Sawarya products
DELETE FROM products WHERE tags @> ARRAY['Sawarya'];
```

## Step 3: Verify
```sql
SELECT COUNT(*) FROM products;
```

## Why This Works
- Bypasses ALL frontend code
- Bypasses ALL RLS policies (using service role)
- Bypasses ALL API endpoints
- Direct database access
- Cannot fail unless database is down

## If Even SQL Fails
Then you have a foreign key constraint. Run this first:
```sql
-- Delete all cart items
DELETE FROM carts;

-- Delete all wishlist items  
DELETE FROM wishlists;

-- Delete all order items (careful!)
-- DELETE FROM orders;

-- NOW delete products
DELETE FROM products WHERE status = 'draft';
```
