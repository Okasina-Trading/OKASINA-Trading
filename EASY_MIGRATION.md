# OKASINA - Supabase Migration (EASIEST METHOD)

## The Simplest Way: Supabase CLI

### 1. Get Database Passwords

**Old Supabase**:
- Go to https://supabase.com/dashboard
- Select old project (drnqpbyptyyuacmrvdrr)
- Settings → Database → Connection String
- Copy the password

**New Supabase**:
- Select new project (hthkrbtwfymaxtnvshfz)  
- Settings → Database → Connection String
- Copy the password

### 2. Run Migration Command

**On Windows (PowerShell)**:
```powershell
# Install pg_dump if needed (comes with PostgreSQL)
# Download from: https://www.postgresql.org/download/windows/

# Set passwords
$OLD_PASS = "your_old_db_password"
$NEW_PASS = "your_new_db_password"

# Export from old
pg_dump --data-only --no-owner --no-privileges "postgresql://postgres.drnqpbyptyyuacmrvdrr:$OLD_PASS@aws-0-us-east-1.pooler.supabase.com:6543/postgres" > okasina_backup.sql

# Import to new
psql "postgresql://postgres.hthkrbtwfymaxtnvshfz:$NEW_PASS@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < okasina_backup.sql
```

**Done in 2 commands!**

---

## Alternative: Supabase Dashboard Method

### Export (Old Supabase):
1. Settings → Database → Backups
2. Click "Create backup"
3. Download backup file

### Import (New Supabase):
1. Settings → Database → Backups
2. Click "Restore from file"
3. Upload backup file

**Even easier!**

---

## Update .env (Automated)

Create `.env` file with new credentials:

```bash
VITE_SUPABASE_URL=https://hthkrbtwfymaxtnvshfz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ1ODMsImV4cCI6MjA4MTIzMDU4M30.EMVEObVRAOe3cuQ7mRGiB4pPqLQwdkuiCQisNlJdiio
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NDU4MywiZXhwIjoyMDgxMjMwNTgzfQ.F4NrM1Bo2yC8tfEeDqgyzAv8LzFqIRRR3EnyYzIHyQs
SUPABASE_URL=https://hthkrbtwfymaxtnvshfz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGtyYnR3ZnltYXh0bnZzaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ1ODMsImV4cCI6MjA4MTIzMDU4M30.EMVEObVRAOe3cuQ7mRGiB4pPqLQwdkuiCQisNlJdiio
```

**Just replace your .env file with this.**

---

## Update Vercel (Automated via CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add VITE_SUPABASE_URL
# Paste: https://hthkrbtwfymaxtnvshfz.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste service role key

# Redeploy
vercel --prod
```

---

## FASTEST METHOD (Recommended)

**Use Supabase Dashboard Backup/Restore**:
1. Old Supabase → Settings → Database → Backups → Download
2. New Supabase → Settings → Database → Backups → Restore
3. Replace .env file
4. Update Vercel env vars
5. Deploy

**Total time: 10 minutes**

---

**Which method do you prefer?**
