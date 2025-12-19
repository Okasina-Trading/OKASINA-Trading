# 📘 Okasina Fashion Store - Project Documentation
**Version:** 2.1.0 (Recovery & Stability Release)
**Last Updated:** December 18, 2025

---

## 🚀 System Overview
**Okasina Fashion Store** is a premium e-commerce platform built for high-performance retail. It combines a modern React frontend with a robust Supabase backend, featuring AI-powered tools for stock management, media handling, and social media integration.

### Core Stack
- **Frontend:** React 18, Vite, TailwindCSS (Glassmorphism Design)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI Integration:** Google Gemini (Vision & Text) & Ollama (Local LLM)
- **Hosting:** Vercel

---

## ✅ Recent Repair & Recovery Status
The system has undergone a full recovery cycle to resolve critical build and stability issues.

### 1. Build System Repair
- **Issue:** `npm run build` was failing due to a circular dependency/export error in `src/api.js`.
- **Fix:** Refactored `src/components/admin/ProductEditModal.jsx` to import `API_BASE_URL` directly from `config.js`.
- **Status:** ✅ **Fixed** (Build passes with exit code 0).

### 2. Database Integrity
- **Issue:** Critical column `original_price` was missing from the `products` table, causing health checks and discount logic to fail.
- **Fix:** Created and applied migration `supabase/migrations/010_add_original_price.sql`.
- **Status:** ✅ **Fixed** (Health check passed).

### 3. Facebook Integration
- **Issue:** Environment variables for Facebook API were missing/expired.
- **Fix:** Restored `FACEBOOK_APP_ID` and `FACEBOOK_PAGE_ID`. User manually updated `FACEBOOK_ACCESS_TOKEN`.
- **Status:** ✅ **Operational** (Verified connection to "Okasina Trading").

---

## 🛠️ Feature Manual

### 1. Admin Dashboard (`/admin`)
The central command hub for store operations.
- **Key Metrics:** Real-time view of Revenue, Users, Orders, and Stock.
- **Quick Actions:** One-click access to product creation and stock updates.

### 2. Stock Manager (`/admin/stock-manager`)
Advanced bulk product management system.
- **Bulk Import:** Upload CSV files to create/update hundreds of products.
- **AI Enrichment:** Auto-generates descriptions, care instructions, and SEO tags based on minimal input (Category + Color + Fabric).
- **Variants:** Supports complex size/color variants in a single row.

### 3. Media Manager (`/admin/media`)
Centralized asset management.
- **Bulk Upload:** Drag-and-drop upload to Supabase Storage (`product-images` bucket).
- **Organization:** Automatically organizes files by SKU.
- **Export:** Generates CSVs of image URLs for easy bulk product import.

### 4. Facebook Album Import (`/admin/album-import`)
Seamless social syncing.
- **Function:** Connects to your Facebook Page, lists albums, and imports photos as new products.
- **Draft Mode:** Imported items are saved as "Drafts" for review before publishing.

---

## 🔧 Operational Guide

### Database Migrations
If setting up a fresh instance, run these SQL scripts in Supabase in order:
1. `001_bulk_import_schema.sql` (Core Schema)
2. `002_product_variants.sql` (Variants Support)
3. `010_add_original_price.sql` (Price Patch)

### Environment Variables
Required variables for `.env` (Local) and Vercel (Production):
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
FACEBOOK_APP_ID=870341192189921
FACEBOOK_PAGE_ID=1616933558544431
FACEBOOK_ACCESS_TOKEN=... (Secret)
```

---

## 🐛 Troubleshooting Guide

### Issue: "Deployment Not Found" (404) on Vercel
**Cause:** Attempting to access an old deployment URL or DNS cache delay.
**Solution:**
1. Go to **Vercel Dashboard**.
2. Click on the project **Okasina Fashion Store**.
3. Click the **Visit** button on the *latest* deployment card.
4. If the custom domain fails, use the `*.vercel.app` subdomain temporarily.

### Issue: Facebook Import Fails
**Cause:** Expired Access Token.
**Solution:**
1. Generate new token via Graph API Explorer.
2. Update `FACEBOOK_ACCESS_TOKEN` in `.env` (Local) or Vercel Settings (Prod).

### Issue: "Column does not exist" Error
**Cause:** Database schema is out of sync with code.
**Solution:** Run `npm run jarvis:check` to identify missing columns, then check `supabase/migrations` for the fix.

---

## 📞 Support & Maintenance
- **Health Check:** Run `npm run jarvis:check` daily.
- **Auto-Repair:** Run `npm run jarvis:repair` for simple fixes.
- **Backups:** Perform weekly database backups via Supabase.
