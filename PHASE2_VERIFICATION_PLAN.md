# Phase 2 Verification Plan

## Objective
Prove that OKASINA Phase 2 is **truly live, not just on paper** by testing the full autonomous loop with a known error.

---

## Pre-Verification Checklist

### 1. SQL Migrations Applied
- [ ] Opened Supabase SQL Editor
- [ ] Pasted contents of `supabase/migrations/004_titan_command_tables.sql`
- [ ] Executed successfully
- [ ] Verified tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('az_agent_runs', 'az_auto_fix_attempts');
  ```

### 2. Dev Server Running
- [ ] Started: `npm run dev`
- [ ] Accessible at: http://localhost:5173
- [ ] No console errors

### 3. Monitoring Started
- [ ] Ran: `node scripts/jarvis-integrated-monitor.js`
- [ ] Monitor running in terminal
- [ ] First health check completed

---

## Verification Test: Draft Product Auto-Fix

### Test Scenario
Create a draft product → JARVIS detects → Auto-fixes → Verifies

### Step 1: Create Known Error (Draft Product)
```sql
-- In Supabase SQL Editor
INSERT INTO products (name, description, price, price_mur, category, status, stock_qty)
VALUES (
  'TEST-DRAFT-PRODUCT',
  'This is a test product to verify auto-fix',
  10,
  450,
  'CLOTHING',
  'draft',  -- ← This triggers the error
  100
);
```

### Step 2: Wait for Detection (< 5 minutes)
Monitor the terminal running `jarvis-integrated-monitor.js`:
- [ ] Health check runs
- [ ] Error detector identifies `products_all_draft` pattern
- [ ] Auto-fix agent triggered

### Step 3: Verify Logging in az_agent_runs
```sql
-- Check recent agent activity
SELECT 
  agent_name,
  status,
  severity,
  started_at,
  error_message,
  payload
FROM az_agent_runs
WHERE started_at > NOW() - INTERVAL '10 minutes'
ORDER BY started_at DESC
LIMIT 10;
```

**Expected**:
- `Jarvis-OKASINA-Health-Tier1` with status `soft_fail` or `hard_fail`
- `OkasinaAutoFix` with status `success`

### Step 4: Verify Auto-Fix Attempt Logged
```sql
-- Check auto-fix attempts
SELECT 
  error_type,
  success,
  attempted_at,
  changes_made
FROM az_auto_fix_attempts
WHERE attempted_at > NOW() - INTERVAL '10 minutes'
ORDER BY attempted_at DESC;
```

**Expected**:
- `error_type`: `products_all_draft`
- `success`: `true`
- `changes_made`: Array showing what was fixed

### Step 5: Verify Product Published
```sql
-- Check if product was auto-published
SELECT name, status 
FROM products 
WHERE name = 'TEST-DRAFT-PRODUCT';
```

**Expected**:
- `status`: `active` (changed from `draft`)

### Step 6: Verify Next Health Check Passes
Wait for next monitoring cycle (< 5 minutes):
- [ ] Health check shows `HEALTHY`
- [ ] No errors detected
- [ ] No auto-fix triggered

---

## Success Criteria

✅ **Phase 2 is LIVE** if ALL of the following are true:

1. ✅ SQL tables created successfully
2. ✅ Monitoring loop running without crashes
3. ✅ Draft product detected within 5 minutes
4. ✅ Auto-fix executed successfully
5. ✅ Product status changed to `active`
6. ✅ Logged in `az_agent_runs`
7. ✅ Logged in `az_auto_fix_attempts`
8. ✅ Next health check shows `HEALTHY`

---

## Troubleshooting

### Monitor crashes immediately
- Check Node.js version (need v18+)
- Verify all scripts exist
- Check Supabase credentials

### Error not detected
- Verify error patterns file exists: `okasina-error-patterns.json`
- Check health report: `scripts/tier1-health-latest.json`
- Ensure dev server is running

### Auto-fix doesn't run
- Check kill-switch: `okasina-config.json` → `auto_fix_enabled: true`
- Verify `publish_draft_products` in `allowed_auto_fixes`
- Check retry limit not exceeded

### No logs in az_agent_runs
- Verify table exists in Supabase
- Check Supabase service role key is correct
- Look for errors in monitor terminal

---

## Cleanup After Test

```sql
-- Remove test product
DELETE FROM products WHERE name = 'TEST-DRAFT-PRODUCT';

-- Optional: Clear test logs
DELETE FROM az_agent_runs WHERE started_at > NOW() - INTERVAL '1 hour';
DELETE FROM az_auto_fix_attempts WHERE attempted_at > NOW() - INTERVAL '1 hour';
```

---

## Next Steps After Verification

Once Phase 2 is verified live:

1. **Keep monitor running** (or set up as Windows service)
2. **Monitor Supabase** for agent activity
3. **Proceed to Phase 3**: Predictive alerts + TITAN Command integration
4. **Document any issues** for future improvements

---

**Status**: Ready for verification
**Estimated time**: 15 minutes
**Risk**: Low (test product only)
