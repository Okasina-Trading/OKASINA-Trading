# Environment Configuration Guide

## Your Supabase Instance
**URL**: `https://drnqpbyptyyuacmrvdrr.supabase.co`

---

## Required Steps to Fix Backend Issues

### Step 1: Get Your Supabase Service Role Key

1. Go to: https://supabase.com/dashboard/project/drnqpbyptyyuacmrvdrr/settings/api
2. Scroll to **Project API keys** section
3. Find the **`service_role`** key (NOT the `anon` key)
4. Click the eye icon to reveal it
5. Copy the entire key

### Step 2: Update Your `.env` File

Open your `.env` file in the project root and update/add these lines:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://drnqpbyptyyuacmrvdrr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # ← UPDATE THIS!

# Google AI (for AI Stylist)
GOOGLE_AI_KEY=your_gemini_api_key_here  # ← ADD THIS (optional)
# OR
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary (for Media Manager)
CLOUDINARY_CLOUD_NAME=dw86lrpv6
CLOUDINARY_API_KEY=121943449379972
CLOUDINARY_API_SECRET=uVWGCQ4jKjQWo5xZMCdRMs7rdLo
```

### Step 3: Get Gemini API Key (Optional - for AI Stylist)

1. Go to: https://makersuite.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key
4. Add to `.env` as shown above

### Step 4: Restart Your Development Server

After updating `.env`:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## What This Will Fix

✅ **Product Editing** - Admin panel will be able to update products  
✅ **AI Stylist** - Gemini-powered chat will work  
✅ **Media Manager** - Image uploads will work  
✅ **Facebook Import** - Album imports will work  

---

## Verification

After updating and restarting:

1. **Test Product Edit**:
   - Go to Admin → Products
   - Click edit on any product
   - Make a change and save
   - Should see "Product updated successfully"

2. **Test AI Stylist**:
   - Click the chat widget
   - Ask "Show me lehengas"
   - Should get a response from Gemini

3. **Test Media Manager**:
   - Go to Admin → Media
   - Try uploading an image
   - Should upload successfully

---

## Security Notes

⚠️ **NEVER commit your `.env` file to git!**  
✅ It's already in `.gitignore`, so you're safe  
✅ Service Role Key has full database access - keep it secret  
✅ Only use Service Role Key on the backend (server.js)

---

## Need Help?

If you're still having issues after updating the keys:

1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify the keys are correct (no extra spaces)
4. Make sure you restarted the dev server
