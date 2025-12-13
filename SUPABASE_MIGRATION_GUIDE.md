# OKASINA - Supabase Migration Guide

## New Supabase Credentials
- **URL**: https://hthkrbtwfymaxtnvshfz.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ1ODMsImV4cCI6MjA4MTIzMDU4M30.EMVEObVRAOe3cuQ7mRGiB4pPqLQwdkuiCQisNlJdiio
- **Service Role**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NDU4MywiZXhwIjoyMDgxMjMwNTgzfQ.F4NrM1Bo2yC8tfEeDqgyzAv8LzFqIRRR3EnyYzIHyQs

---

## Step 1: Export Data from Old Supabase

### Go to Old Supabase Dashboard
1. https://supabase.com/dashboard
2. Select old project (drnqpbyptyyuacmrvdrr)
3. Go to **Table Editor**

### Export Each Table:
**Products** (most important):
```sql
SELECT * FROM products;
```
- Click "Export" → CSV
- Save as `products_export.csv`

**Orders**:
```sql
SELECT * FROM orders;
```
- Export → CSV
- Save as `orders_export.csv`

**Wishlists** (if exists):
```sql
SELECT * FROM wishlists;
```
- Export → CSV

---

## Step 2: Run Migrations on New Supabase

### Go to New Supabase Dashboard
1. https://supabase.com/dashboard
2. Select new project (hthkrbtwfymaxtnvshfz)
3. Go to **SQL Editor**

### Run These Migrations IN ORDER:

**1. Products Table**:
```sql
-- Paste contents of: supabase/migrations/000_init_products.sql
```

**2. Orders Table**:
```sql
-- Paste contents of: supabase/migrations/003_fix_orders_schema.sql
```

**3. Wishlists Table**:
```sql
-- Paste contents of: supabase/migrations/20251125201800_create_wishlists_table.sql
```

**4. TITAN Tables**:
```sql
-- Paste contents of: supabase/migrations/004_titan_command_tables.sql
```

**5. Other Tables** (if needed):
- Reviews: `20251125180800_create_reviews_table.sql`
- Coupons: `20251125205600_create_coupons_table.sql`
- Feedback: `007_feedback.sql`

---

## Step 3: Import Data

### In New Supabase SQL Editor:

**Import Products**:
1. Table Editor → products
2. Click "Insert" → "Import data from CSV"
3. Select `products_export.csv`
4. Map columns
5. Import

**Import Orders** (same process):
- Use `orders_export.csv`

---

## Step 4: Update .env File

Replace old credentials with new:

```bash
VITE_SUPABASE_URL=https://hthkrbtwfymaxtnvshfz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ1ODMsImV4cCI6MjA4MTIzMDU4M30.EMVEObVRAOe3cuQ7mRGiB4pPqLQwdkuiCQisNlJdiio
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NDU4MywiZXhwIjoyMDgxMjMwNTgzfQ.F4NrM1Bo2yC8tfEeDqgyzAv8LzFqIRRR3EnyYzIHyQs
```

---

## Step 5: Update Vercel Environment Variables

1. Go to https://vercel.com/okasina-tradings-projects
2. Select your project
3. Settings → Environment Variables
4. Update:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Redeploy

---

## Step 6: Test Locally

```bash
npm run dev
```

Check:
- Products load
- No console errors
- Delete works
- Orders work

---

## Step 7: Deploy

```bash
git add .
git commit -m "Migrated to new Supabase instance"
git push origin main
```

---

## Quick Start (If You Don't Need Old Data)

**Just want to start fresh?**

1. Run all migrations in new Supabase (Step 2)
2. Update .env (Step 4)
3. Update Vercel (Step 5)
4. Deploy (Step 7)

**Your 61 products will be gone**, but no schema cache issues!

---

## What Do You Want to Do?

**Option A**: Migrate all data (products, orders) → Follow all steps
**Option B**: Fresh start (lose data, clean slate) → Skip Step 1 & 3

**Tell me which option and I'll help you execute it.**
