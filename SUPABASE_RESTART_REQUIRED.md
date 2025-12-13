# EMERGENCY: Supabase Database Restart Required

## Problem
Schema cache is stuck. Tables exist but Supabase API can't see them.

**Errors**:
- "Could not find the table 'public.wishlists' in the schema cache"
- "Could not find the table 'public.az_agent_runs' in the schema cache"
- Album import failing
- Delete failing
- Orders failing

## Solution: Restart Database

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Login if needed

2. **Select OKASINA Project**
   - Click on your project

3. **Navigate to Database Settings**
   - Left sidebar → **Settings**
   - Click **Database**

4. **Restart Connection Pooler**
   - Scroll down to **Connection Pooler** section
   - Click **"Restart"** button
   - Confirm the restart

5. **Wait**
   - Takes ~30-60 seconds
   - Don't refresh during restart

6. **Verify**
   - Go to https://okasinatrading.com
   - Open browser console (F12)
   - Check for errors
   - Should be gone!

## Why This Fixes Everything

The database restart forces PostgREST (Supabase's API layer) to:
- Clear all cached schema information
- Re-read the database structure
- Discover all tables (wishlists, az_agent_runs, etc.)

## Safe Operation

- ✅ No data loss
- ✅ No downtime (< 1 minute)
- ✅ Standard Supabase operation
- ✅ Recommended by Supabase for cache issues

## After Restart

All these will work:
- ✅ Wishlist (no more errors)
- ✅ Album import
- ✅ Product delete
- ✅ Order placement
- ✅ JARVIS monitoring logs

---

**Status**: Waiting for user to restart database
