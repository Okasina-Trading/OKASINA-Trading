-- OKASINA - Essential Tables Only (New Supabase Setup)
-- Run this in new Supabase SQL Editor: hthkrbtwfymaxtnvshfz

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  description text,
  category text,
  subcategory text,
  price numeric,
  price_mur numeric,
  stock_qty integer DEFAULT 0,
  sku text,
  status text DEFAULT 'active'::text,
  image_url text,
  sizes text[],
  tags text[],
  features text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  design_no character varying,
  fabric character varying,
  color character varying,
  cost_price numeric,
  selling_price numeric,
  mrp numeric,
  currency character varying DEFAULT 'Rs'::character varying,
  care_instructions text,
  seo_title character varying,
  seo_description text,
  ai_generated boolean DEFAULT false,
  ai_confidence numeric,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 2. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY,
  order_number text UNIQUE,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address text,
  items jsonb DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'::text,
  currency text NOT NULL DEFAULT 'MUR'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 3. WISHLISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- 4. REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- ============================================================
-- 5. COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 6. FEEDBACK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  email text,
  subject text,
  message text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 7. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 8. CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  region text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 9. TITAN COMMAND TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_agent_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  run_id uuid,
  agent_name text NOT NULL,
  mission_id uuid,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'soft_fail'::text, 'hard_fail'::text])),
  severity text NOT NULL CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text])),
  started_at timestamp with time zone NOT NULL,
  finished_at timestamp with time zone NOT NULL,
  duration_ms integer,
  error_code text,
  error_message text,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT az_agent_runs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.az_auto_fix_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  error_type text NOT NULL,
  project text DEFAULT 'okasina'::text,
  attempted_at timestamp with time zone DEFAULT now(),
  success boolean NOT NULL,
  agent_name text,
  details jsonb,
  before_state jsonb,
  after_state jsonb,
  changes_made text[],
  CONSTRAINT az_auto_fix_attempts_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON az_agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON az_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_auto_fix_attempts_recent ON az_auto_fix_attempts(error_type, attempted_at DESC);

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
