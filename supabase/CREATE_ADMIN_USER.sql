-- OKASINA - Create Admin User
-- Run this in NEW Supabase SQL Editor (hthkrbtwfymaxtnvshfz)

-- This creates an admin user for the OKASINA dashboard
-- Email: info@okasinatrading.com
-- Password: Letmein2010

-- Step 1: Create the user in auth.users
-- Note: You need to do this via Supabase Dashboard → Authentication → Users → Invite User
-- OR use the Supabase Dashboard UI to create the user manually

-- For now, let's create a SQL function to help with this:

-- First, check if user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'info@okasinatrading.com';

-- If user doesn't exist, you need to create it via Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select project: hthkrbtwfymaxtnvshfz
-- 3. Authentication → Users
-- 4. Click "Invite User" or "Add User"
-- 5. Email: info@okasinatrading.com
-- 6. Password: Letmein2010
-- 7. Auto-confirm user: YES (check this box)
-- 8. Click "Send Invitation" or "Create User"

-- After creating the user, verify:
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'info@okasinatrading.com';

-- The user should now be able to login at:
-- https://okasinatrading.com/admin
