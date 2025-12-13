# OKASINA - Complete Data Migration (46 Tables, No PRO Plan)

## The Problem
- 46 tables in old Supabase
- No PRO plan = No backup feature
- Need to migrate ALL data

## The Solution: pg_dump via Connection String

### Step 1: Get Database Connection Strings

**Old Supabase**:
1. Go to https://supabase.com/dashboard
2. Select old project (drnqpbyptyyuacmrvdrr)
3. Settings → Database → Connection String
4. Copy **"Connection pooling"** string
5. It looks like: `postgresql://postgres.drnqpbyptyyuacmrvdrr:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

**New Supabase**:
1. Select new project (hthkrbtwfymaxtnvshfz)
2. Settings → Database → Connection String
3. Copy **"Connection pooling"** string
4. It looks like: `postgresql://postgres.hthkrbtwfymaxtnvshfz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

### Step 2: Install PostgreSQL Tools (if not installed)

**Windows**:
- Download: https://www.postgresql.org/download/windows/
- Install PostgreSQL (includes pg_dump and psql)
- Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

**Or use Supabase CLI**:
```bash
npm install -g supabase
```

### Step 3: Export ALL Data (One Command)

```bash
pg_dump --data-only --no-owner --no-privileges \
  "postgresql://postgres.drnqpbyptyyuacmrvdrr:[OLD_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  > all_data_backup.sql
```

**This exports ALL 46 tables in one SQL file!**

### Step 4: Import to New Database (One Command)

```bash
psql "postgresql://postgres.hthkrbtwfymaxtnvshfz:[NEW_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  < all_data_backup.sql
```

**Done! All 46 tables migrated.**

---

## Alternative: Manual SQL Export (If pg_dump doesn't work)

### Step 1: List All Tables

Run in old Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 2: Export Each Table

For each table, run:
```sql
SELECT * FROM table_name;
```

Copy results → Save as CSV → Import to new Supabase

**But this is tedious for 46 tables!**

---

## Recommended Approach

**Use pg_dump** (Steps 1-4 above):
- ✅ Exports all 46 tables automatically
- ✅ Preserves data types
- ✅ One command
- ✅ Works without PRO plan

**Total time: 5 minutes**

---

## After Migration

1. **Update .env**:
   ```bash
   cp .env.new .env
   ```

2. **Update Vercel**:
   - Settings → Environment Variables
   - Update VITE_SUPABASE_URL
   - Update VITE_SUPABASE_ANON_KEY
   - Update SUPABASE_SERVICE_ROLE_KEY

3. **Deploy**:
   ```bash
   git add .
   git commit -m "Migrated to new Supabase"
   git push origin main
   ```

---

## Need Help?

**If pg_dump is not installed**, I can create a Node.js script to do the migration programmatically.

**Want me to create that script?**
