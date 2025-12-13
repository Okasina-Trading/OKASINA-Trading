# Quick Reference: Production Readiness Checklist

## Immediate Actions (Do These Now)

### 1. Fix Wishlist Console Errors
**Option A - Auto (Recommended):**
```bash
# Already attempted - check if it worked
```

**Option B - Manual (If script failed):**
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste: `supabase/migrations/002_create_wishlists_MANUAL.sql`
3. Run it
4. Refresh your site - errors should be gone

### 2. Verify TITAN Products
```bash
node scripts/verify-titan-products.js
```
**Review output and decide:**
- ✅ **Data looks good?** → Publish: `UPDATE products SET status = 'active' WHERE status = 'draft';`
- ❌ **Data is wrong?** → Delete: `node scripts/delete-draft-products.js`

### 3. Test Bulk Delete
1. Go to `/admin/products`
2. Select a few test products
3. Click "Delete Selected"
4. Check browser console for detailed errors (if any)

## Critical Files

### Scripts
- `scripts/verify-titan-products.js` - Check product quality
- `scripts/delete-draft-products.js` - Remove all drafts
- `scripts/apply-wishlists-migration.js` - Fix console errors

### SQL
- `supabase/migrations/002_create_wishlists_MANUAL.sql` - Manual wishlist setup

### Admin
- `/admin/products` - Product management
- `/admin/feedback` - JARVIS feedback tracker

## Common Issues & Fixes

### "Failed to delete products"
- **Cause**: RLS policies or foreign key constraints
- **Fix**: Check console for specific error, may need to delete related data first

### "Error fetching wishlist"
- **Cause**: Wishlist table doesn't exist
- **Fix**: Run manual SQL migration

### "Configuration Error" (Facebook)
- **Cause**: Invalid/expired FB token
- **Fix**: Refresh token or disable feature

### Products not showing on shop
- **Cause**: Status is 'draft' not 'active'
- **Fix**: `UPDATE products SET status = 'active' WHERE status = 'draft';`

## Success Checklist

Before showing to client:
- [ ] No console errors on homepage
- [ ] No console errors on shop page
- [ ] Products display with images
- [ ] Can add to cart
- [ ] Admin can add/edit/delete products
- [ ] Prices show correctly (Rs not $)
- [ ] No "test" or "sample" data visible
- [ ] Mobile responsive
- [ ] Fast page loads (<3s)

## Emergency Contacts

**If something breaks:**
1. Check browser console (F12)
2. Check `scripts/import_report_v2.json` for TITAN errors
3. Check Supabase logs
4. Review `walkthrough.md` for troubleshooting

**Nuclear option (start fresh):**
```sql
DELETE FROM products WHERE status = 'draft';
```
