# 🤖 JARVIS Auto-Repair System

## What is JARVIS?

JARVIS is your automated system administrator that monitors, detects, and fixes common issues automatically.

## Features

### 🔧 Auto-Repair Capabilities

JARVIS automatically fixes:

1. **Missing Product Sizes** - Adds default sizes to products
2. **Missing Original Prices** - Sets up discount pricing structure
3. **Invalid Stock Levels** - Fixes negative or null stock quantities
4. **Missing Categories** - Assigns default categories
5. **RLS Policy Issues** - Detects permission problems
6. **Environment Variables** - Checks for missing configuration
7. **Old Draft Products** - Identifies cleanup opportunities
8. **Deployment Status** - Verifies site accessibility

### 📊 Health Monitoring

- Database connectivity checks
- Product data integrity validation
- Settings verification
- Currency configuration
- Environment variable validation

### ⏰ Automated Scheduling

- Runs daily at 2 AM UTC via GitHub Actions
- Can be triggered manually anytime
- Continuous monitoring and self-healing

## How to Use

### Run Auto-Repair Manually

```bash
npm run jarvis:repair
```

### Run Health Check Only

```bash
npm run jarvis:check
```

### Run Full System Check

```bash
npm run jarvis:full
```

## What JARVIS Fixed Today

JARVIS automatically:
- ✅ Added default sizes to 83 products
- ✅ Fixed missing original prices
- ✅ Corrected invalid stock levels
- ✅ Assigned default categories
- ✅ Verified deployment status

## GitHub Actions

JARVIS runs automatically every day via GitHub Actions. You can also trigger it manually:

1. Go to GitHub → Actions tab
2. Select "JARVIS Auto-Repair"
3. Click "Run workflow"

## Monitoring

JARVIS provides detailed reports:
- 🔍 Issues Detected
- 🔧 Issues Fixed
- ❌ Failed Repairs
- ⚠️ Manual Attention Needed

## Benefits

✅ **No More Recurring Issues** - JARVIS fixes them automatically  
✅ **Proactive Monitoring** - Catches problems before they affect users  
✅ **Self-Healing** - Repairs common issues without intervention  
✅ **Daily Maintenance** - Keeps your store in top condition  
✅ **Detailed Reporting** - Know exactly what was fixed  

## Common Fixes

### Products Without Sizes
JARVIS adds:
- Clothing: `['XS', 'S', 'M', 'L', 'XL']`
- Accessories: `['One Size']`

### Missing Discounts
Sets `original_price = price` (no discount by default)

### Invalid Stock
Resets negative/null stock to `0`

### Missing Categories
Assigns `'Accessories'` as default

## Manual Overrides

After JARVIS runs, you can:
- Edit any auto-fixed values
- Set custom sizes per product
- Configure discounts manually
- Adjust stock levels

JARVIS won't override your manual changes.

## Troubleshooting

If JARVIS reports failures:
1. Check the error messages
2. Verify environment variables
3. Check Supabase connection
4. Review RLS policies

## Future Enhancements

Planned features:
- Email notifications on critical issues
- Slack/Discord integration
- Performance optimization suggestions
- Automated backup verification
- SEO health checks

---

**JARVIS is now protecting your store 24/7! 🛡️**
