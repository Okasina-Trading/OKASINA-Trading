-- OKASINA - Complete Database Setup for New Supabase
-- Run this ENTIRE file in new Supabase SQL Editor (hthkrbtwfymaxtnvshfz)

-- ============================================================
-- 1. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    price_mur DECIMAL(10,2),
    category TEXT NOT NULL,
    image_url TEXT,
    images TEXT[],
    stock_qty INTEGER DEFAULT 0,
    sizes TEXT[],
    sku TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ============================================================
-- 2. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- ============================================================
-- 3. WISHLISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- RLS Policies for wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlists FOR DELETE
  USING ( auth.uid() = user_id );

-- ============================================================
-- 4. REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- ============================================================
-- 5. COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ============================================================
-- 6. FEEDBACK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_url TEXT,
    feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature', 'improvement', 'other')),
    message TEXT NOT NULL,
    screenshot_url TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- ============================================================
-- 7. TITAN COMMAND TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL UNIQUE,
    agent_name TEXT NOT NULL,
    mission_id UUID,
    status TEXT NOT NULL CHECK (status IN ('success', 'soft_fail', 'hard_fail')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000
    ) STORED,
    error_code TEXT,
    error_message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON az_agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON az_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON az_agent_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS public.az_auto_fix_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type TEXT NOT NULL,
    project TEXT DEFAULT 'okasina',
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    agent_name TEXT,
    details JSONB,
    before_state JSONB,
    after_state JSONB,
    changes_made TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_auto_fix_attempts_recent ON az_auto_fix_attempts(error_type, attempted_at DESC);

-- Retry limit function
CREATE OR REPLACE FUNCTION check_auto_fix_retry_limit(
    p_error_type TEXT,
    p_max_retries INT DEFAULT 3
) RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INT;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM az_auto_fix_attempts
    WHERE error_type = p_error_type
      AND attempted_at > NOW() - INTERVAL '24 hours';
    
    RETURN attempt_count < p_max_retries;
END;
$$ LANGUAGE plpgsql;

-- Agent activity view
CREATE OR REPLACE VIEW az_agent_activity AS
SELECT 
    agent_name,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'success') as successes,
    COUNT(*) FILTER (WHERE status = 'soft_fail') as soft_fails,
    COUNT(*) FILTER (WHERE status = 'hard_fail') as hard_fails,
    AVG(duration_ms) as avg_duration_ms,
    MAX(started_at) as last_run
FROM az_agent_runs
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY agent_name
ORDER BY last_run DESC;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;
