# JARVIS OKASINA Monitoring - Quick Start

## What's Running Now

### 1. Health Monitor
**Script**: `scripts/jarvis-okasina-health.js`

**Checks:**
- ✅ Database connectivity
- ✅ Product data (active/draft counts)
- ✅ Delete function
- ❌ Wishlist table (currently missing)
- ✅ Environment variables

**Run manually:**
```bash
node scripts/jarvis-okasina-health.js
```

**Latest Report**: `scripts/jarvis-health-report.json`

### 2. Auto-Fix Agent
**Script**: `scripts/okasina-auto-fix.js`

**Auto-Fixes:**
- ✅ Publish draft products
- ✅ Clean env var whitespace
- ⚠️  Wishlist table (requires manual SQL)

**Run manually:**
```bash
node scripts/okasina-auto-fix.js
```

**Latest Report**: `scripts/auto-fix-report.json`

---

## Current Status (Last Check)

**Overall Health**: CRITICAL ⚠️

**Issues Found:**
1. ❌ **Wishlist table missing** - Requires manual SQL execution

**Auto-Fixed:**
- None (no issues that could be auto-fixed)

**Manual Action Required:**
1. Go to Supabase SQL Editor
2. Run: `supabase/migrations/002_create_wishlists_MANUAL.sql`

---

## Schedule Monitoring (24/7)

### Option A: Windows Task Scheduler (Recommended)
```powershell
# Run health check every 5 minutes
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/jarvis-okasina-health.js" -WorkingDirectory "C:\Users\ICL  ZAMBIA\Desktop\okasina-fashion-store-vite"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "JARVIS-OKASINA-Health" -Action $action -Trigger $trigger
```

### Option B: Node.js Daemon (Alternative)
Create `scripts/jarvis-daemon.js`:
```javascript
import { exec } from 'child_process';

setInterval(() => {
    console.log('Running health check...');
    exec('node scripts/jarvis-okasina-health.js', (err, stdout) => {
        if (err) console.error('Health check failed:', err);
        else console.log(stdout);
    });
}, 5 * 60 * 1000); // Every 5 minutes
```

Run with: `node scripts/jarvis-daemon.js` (keep terminal open)

### Option C: GitHub Actions (Cloud-based)
Create `.github/workflows/jarvis-monitor.yml`:
```yaml
name: JARVIS Health Monitor
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: node scripts/jarvis-okasina-health.js
```

---

## Integration with AION-ZERO

### Send Reports to TITAN Command
Modify `jarvis-okasina-health.js` to save reports to:
```
F:\AION-ZERO\logs\okasina\health-{timestamp}.json
```

### Alert TITAN on Critical Issues
Add webhook/notification to TITAN when `overallHealth === 'CRITICAL'`

---

## Next Steps

1. **Fix Wishlist Table** (Manual - 2 min)
   - Run SQL migration in Supabase

2. **Schedule Monitoring** (Choose one option above)
   - Recommended: Windows Task Scheduler for local
   - Or GitHub Actions for cloud-based

3. **Test Auto-Fix**
   - Create a test error
   - Verify auto-fix resolves it
   - Check reports

4. **Connect to AION-ZERO**
   - Save logs to F:\AION-ZERO\logs
   - Add TITAN Command webhooks
   - Integrate with Citadel dashboard

---

## Commands Reference

```bash
# Run health check
node scripts/jarvis-okasina-health.js

# Run auto-fix
node scripts/okasina-auto-fix.js

# View latest health report
cat scripts/jarvis-health-report.json

# View latest auto-fix report
cat scripts/auto-fix-report.json

# Check if monitoring is scheduled (Windows)
Get-ScheduledTask -TaskName "JARVIS-OKASINA-Health"
```

---

## Success Criteria

✅ Health check runs every 5 minutes  
✅ Auto-fix resolves common issues  
⏳ Manual intervention only for complex issues  
⏳ Reports sent to TITAN Command  
⏳ Citadel dashboard shows OKASINA vitals  

**Current Progress**: 2/5 (40%)
