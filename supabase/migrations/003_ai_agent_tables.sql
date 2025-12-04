-- Migration: Create system_logs and analytics_events tables

-- 1. System Logs Table (Sentinel)
create table if not exists system_logs (
  id uuid default uuid_generate_v4() primary key,
  level text not null, -- 'error', 'warn', 'info'
  message text not null,
  context jsonb, -- stack trace, component stack, etc.
  url text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS but allow inserts from authenticated/anon users (for client-side logging)
alter table system_logs enable row level security;

create policy "Allow insert access to system_logs for all users"
  on system_logs for insert
  with check (true);

create policy "Allow read access to system_logs for admins only"
  on system_logs for select
  using (auth.role() = 'service_role'); -- Or specific admin check

-- 2. Analytics Events Table (Analyst)
create table if not exists analytics_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null, -- 'view_product', 'add_to_cart', 'purchase'
  user_id uuid references auth.users(id), -- Optional, if logged in
  session_id text, -- For anonymous tracking
  product_id uuid references products(id), -- Optional, for product events
  metadata jsonb, -- price, quantity, category, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table analytics_events enable row level security;

create policy "Allow insert access to analytics_events for all users"
  on analytics_events for insert
  with check (true);

create policy "Allow read access to analytics_events for analysis"
  on analytics_events for select
  using (true); -- Open for now to allow 'popular products' queries from client, or restrict to service_role if using backend aggregation

-- Indexes for performance
create index if not exists idx_system_logs_created_at on system_logs(created_at);
create index if not exists idx_analytics_events_product_id on analytics_events(product_id);
create index if not exists idx_analytics_events_event_type on analytics_events(event_type);
