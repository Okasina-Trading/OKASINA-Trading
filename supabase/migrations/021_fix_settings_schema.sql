-- 1. Ensure site_settings table exists (Key-Value Store)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add description column if it was missing (for migration from 018)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'site_settings' and column_name = 'description') then
    alter table public.site_settings add column description text;
  end if;
end $$;

-- 3. Fix RLS Policies (Critical Fix for "Failed to Save")
alter table public.site_settings enable row level security;

-- Drop old restricted policies if they exist
drop policy if exists "Allow admin full access to site_settings" on public.site_settings;
drop policy if exists "Allow public read access to site_settings" on public.site_settings;

-- Create new PERMISSIVE policies
-- Read: Public (so footer can read social links)
create policy "Allow public read access to site_settings"
  on public.site_settings for select
  using (true);

-- Write: Any Authenticated User (Admin)
create policy "Allow authenticated insert update"
  on public.site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 4. Migrate old 'settings' data if exists (optional cleanup)
-- (We assume we just want to ensure social_media exists)
insert into public.site_settings (key, value, description)
values 
  ('social_media', '{
    "facebook": "",
    "instagram": "",
    "twitter": "",
    "youtube": "",
    "tiktok": "",
    "whatsapp": ""
  }'::jsonb, 'Social media platform URLs')
on conflict (key) do nothing;
