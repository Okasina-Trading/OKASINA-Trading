-- ============================================================
-- AION-ZERO MESSAGING CORE - Multi-Brand SMS System
-- ============================================================
-- Run this in AION-ZERO Supabase instance
-- Migrated from OKASINA SMS Marketing (008_sms_marketing.sql)
-- 
-- Changes from original:
-- - All tables prefixed with `az_sms_*`
-- - Added `brand_key` column for multi-tenancy
-- - Added compliance features (opt-in, quiet hours, STOP processing)
-- - Added RLS policies for brand isolation
-- - Added metrics and ROI tracking
-- - Added approval workflow
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. AZ SMS CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_key TEXT NOT NULL,                    -- 'okasina', 'jules', etc.
    project_key TEXT,                           -- Optional multi-tenant
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    opt_out_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    revenue_generated NUMERIC(10,2) DEFAULT 0,
    cost_per_message NUMERIC(10,4) DEFAULT 0.02,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_az_sms_campaigns_brand ON az_sms_campaigns(brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_campaigns_status ON az_sms_campaigns(status, brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_campaigns_approval ON az_sms_campaigns(approval_status, brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_campaigns_created_at ON az_sms_campaigns(created_at DESC);

-- ============================================================
-- 2. AZ SMS MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES az_sms_campaigns(id) ON DELETE CASCADE,
    brand_key TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled', 'bounced')),
    gateway_message_id TEXT,
    gateway_type TEXT DEFAULT 'android',
    error_message TEXT,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    opted_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_az_sms_messages_campaign_id ON az_sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_az_sms_messages_brand ON az_sms_messages(brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_messages_status ON az_sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_az_sms_messages_phone ON az_sms_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_az_sms_messages_retry ON az_sms_messages(status, retry_count) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_az_sms_messages_queued ON az_sms_messages(status, created_at) WHERE status = 'queued';

-- ============================================================
-- 3. AZ SMS CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_key TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    name TEXT,
    email TEXT,
    tags TEXT[] DEFAULT '{}',
    opted_in BOOLEAN DEFAULT false,              -- CHANGED: Explicit opt-in required
    opted_in_at TIMESTAMP WITH TIME ZONE,
    opted_out_at TIMESTAMP WITH TIME ZONE,
    opt_out_reason TEXT,
    source TEXT DEFAULT 'manual',
    segment TEXT,                                -- customer/vip/new/etc
    lifetime_value NUMERIC(10,2) DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_key, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_az_sms_contacts_brand ON az_sms_contacts(brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_contacts_phone ON az_sms_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_az_sms_contacts_opted_in ON az_sms_contacts(brand_key, opted_in);
CREATE INDEX IF NOT EXISTS idx_az_sms_contacts_segment ON az_sms_contacts(brand_key, segment);
CREATE INDEX IF NOT EXISTS idx_az_sms_contacts_tags ON az_sms_contacts USING GIN(tags);

-- ============================================================
-- 4. AZ SMS TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_key TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,                               -- order_placed/shipped/marketing
    variables TEXT[] DEFAULT '{}',               -- {{customer_name}}, {{order_number}}
    is_global BOOLEAN DEFAULT false,             -- Shared across brands
    usage_count INTEGER DEFAULT 0,
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_az_sms_templates_brand ON az_sms_templates(brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_templates_category ON az_sms_templates(category);

-- ============================================================
-- 5. AZ SMS GATEWAY CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_gateway_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_key TEXT,                              -- NULL = global gateway
    gateway_type TEXT NOT NULL DEFAULT 'android',
    api_url TEXT,
    api_key TEXT,
    device_id TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,                  -- Failover priority
    rate_limit_per_minute INTEGER DEFAULT 30,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'Indian/Mauritius',
    max_daily_messages INTEGER DEFAULT 1000,
    daily_message_count INTEGER DEFAULT 0,
    daily_reset_at DATE DEFAULT CURRENT_DATE,
    health_check_url TEXT,
    last_health_check TIMESTAMP WITH TIME ZONE,
    is_healthy BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_az_sms_gateway_brand ON az_sms_gateway_config(brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_gateway_active ON az_sms_gateway_config(is_active, priority);

-- Insert default config for OKASINA
INSERT INTO az_sms_gateway_config (brand_key, gateway_type, rate_limit_per_minute, timezone)
VALUES ('okasina', 'android', 30, 'Indian/Mauritius')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. AZ SMS OPT-OUTS TABLE (NEW - Compliance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_opt_outs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_key TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    opted_out_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opt_out_method TEXT,                         -- STOP/UNSUBSCRIBE/manual
    campaign_id UUID REFERENCES az_sms_campaigns(id),
    reason TEXT,
    is_global BOOLEAN DEFAULT false,             -- Opt out from ALL brands
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_key, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_az_sms_opt_outs_brand ON az_sms_opt_outs(brand_key);
CREATE INDEX IF NOT EXISTS idx_az_sms_opt_outs_phone ON az_sms_opt_outs(phone_number);

-- ============================================================
-- 7. AZ SMS METRICS TABLE (NEW - Analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.az_sms_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_key TEXT NOT NULL,
    metric_date DATE NOT NULL,
    campaigns_sent INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    opt_outs INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_generated NUMERIC(10,2) DEFAULT 0,
    cost_total NUMERIC(10,2) DEFAULT 0,
    roi NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_key, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_az_sms_metrics_brand ON az_sms_metrics(brand_key, metric_date DESC);

-- ============================================================
-- 8. RLS POLICIES (Brand Isolation)
-- ============================================================

-- Enable RLS
ALTER TABLE az_sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE az_sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE az_sms_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE az_sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE az_sms_gateway_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE az_sms_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE az_sms_metrics ENABLE ROW LEVEL SECURITY;

-- Campaigns: Brand isolation
CREATE POLICY brand_isolation_campaigns ON az_sms_campaigns
    FOR ALL
    USING (brand_key = current_setting('app.current_brand', true));

-- Messages: Brand isolation
CREATE POLICY brand_isolation_messages ON az_sms_messages
    FOR ALL
    USING (brand_key = current_setting('app.current_brand', true));

-- Contacts: Brand isolation
CREATE POLICY brand_isolation_contacts ON az_sms_contacts
    FOR ALL
    USING (brand_key = current_setting('app.current_brand', true));

-- Templates: Own + global
CREATE POLICY brand_isolation_templates ON az_sms_templates
    FOR ALL
    USING (
        brand_key = current_setting('app.current_brand', true) 
        OR is_global = true
    );

-- Gateway: Own + global (NULL brand_key)
CREATE POLICY brand_isolation_gateway ON az_sms_gateway_config
    FOR ALL
    USING (
        brand_key = current_setting('app.current_brand', true) 
        OR brand_key IS NULL
    );

-- Opt-outs: Brand isolation
CREATE POLICY brand_isolation_opt_outs ON az_sms_opt_outs
    FOR ALL
    USING (brand_key = current_setting('app.current_brand', true));

-- Metrics: Brand isolation
CREATE POLICY brand_isolation_metrics ON az_sms_metrics
    FOR ALL
    USING (brand_key = current_setting('app.current_brand', true));

-- ============================================================
-- 9. COMPLIANCE FUNCTIONS
-- ============================================================

-- Function: Check if phone can receive messages
CREATE OR REPLACE FUNCTION az_can_send_sms(
    p_brand_key TEXT,
    p_phone_number TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_opted_in BOOLEAN;
    v_opted_out BOOLEAN;
    v_quiet_hours BOOLEAN;
BEGIN
    -- Check opt-in status
    SELECT opted_in INTO v_opted_in
    FROM az_sms_contacts
    WHERE brand_key = p_brand_key AND phone_number = p_phone_number;
    
    IF v_opted_in IS NULL OR v_opted_in = false THEN
        RETURN false;
    END IF;
    
    -- Check opt-out list
    SELECT EXISTS(
        SELECT 1 FROM az_sms_opt_outs
        WHERE phone_number = p_phone_number
        AND (brand_key = p_brand_key OR is_global = true)
    ) INTO v_opted_out;
    
    IF v_opted_out THEN
        RETURN false;
    END IF;
    
    -- Check quiet hours
    SELECT CURRENT_TIME BETWEEN 
        (SELECT quiet_hours_start FROM az_sms_gateway_config WHERE brand_key = p_brand_key OR brand_key IS NULL ORDER BY brand_key NULLS LAST LIMIT 1)
        AND
        (SELECT quiet_hours_end FROM az_sms_gateway_config WHERE brand_key = p_brand_key OR brand_key IS NULL ORDER BY brand_key NULLS LAST LIMIT 1)
    INTO v_quiet_hours;
    
    IF v_quiet_hours THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Process STOP keyword
CREATE OR REPLACE FUNCTION az_process_opt_out(
    p_brand_key TEXT,
    p_phone_number TEXT,
    p_campaign_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Add to opt-out list
    INSERT INTO az_sms_opt_outs (brand_key, phone_number, campaign_id, opt_out_method)
    VALUES (p_brand_key, p_phone_number, p_campaign_id, 'STOP')
    ON CONFLICT (brand_key, phone_number) DO NOTHING;
    
    -- Update contact
    UPDATE az_sms_contacts
    SET opted_in = false,
        opted_out_at = NOW(),
        opt_out_reason = 'STOP keyword'
    WHERE brand_key = p_brand_key AND phone_number = p_phone_number;
    
    -- Cancel pending messages
    UPDATE az_sms_messages
    SET status = 'cancelled',
        error_message = 'Contact opted out'
    WHERE brand_key = p_brand_key 
    AND phone_number = p_phone_number 
    AND status IN ('pending', 'queued');
END;
$$ LANGUAGE plpgsql;

-- Function: Update campaign statistics
CREATE OR REPLACE FUNCTION az_update_campaign_stats(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE az_sms_campaigns
    SET 
        sent_count = (SELECT COUNT(*) FROM az_sms_messages WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered')),
        delivered_count = (SELECT COUNT(*) FROM az_sms_messages WHERE campaign_id = p_campaign_id AND status = 'delivered'),
        failed_count = (SELECT COUNT(*) FROM az_sms_messages WHERE campaign_id = p_campaign_id AND status = 'failed'),
        bounce_count = (SELECT COUNT(*) FROM az_sms_messages WHERE campaign_id = p_campaign_id AND status = 'bounced'),
        opt_out_count = (SELECT COUNT(*) FROM az_sms_messages WHERE campaign_id = p_campaign_id AND opted_out_at IS NOT NULL),
        updated_at = NOW()
    WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily metrics
CREATE OR REPLACE FUNCTION az_update_daily_metrics(p_brand_key TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO az_sms_metrics (
        brand_key,
        metric_date,
        campaigns_sent,
        messages_sent,
        messages_delivered,
        messages_failed,
        opt_outs
    )
    SELECT
        p_brand_key,
        CURRENT_DATE,
        COUNT(DISTINCT campaign_id),
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'delivered'),
        COUNT(*) FILTER (WHERE status = 'failed'),
        COUNT(*) FILTER (WHERE opted_out_at::date = CURRENT_DATE)
    FROM az_sms_messages
    WHERE brand_key = p_brand_key
    AND created_at::date = CURRENT_DATE
    ON CONFLICT (brand_key, metric_date) DO UPDATE
    SET messages_sent = EXCLUDED.messages_sent,
        messages_delivered = EXCLUDED.messages_delivered,
        messages_failed = EXCLUDED.messages_failed,
        opt_outs = EXCLUDED.opt_outs,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. VIEWS
-- ============================================================

-- Campaign summary view
CREATE OR REPLACE VIEW az_sms_campaign_summary AS
SELECT 
    c.id,
    c.brand_key,
    c.name,
    c.status,
    c.approval_status,
    c.total_recipients,
    c.sent_count,
    c.delivered_count,
    c.failed_count,
    c.opt_out_count,
    c.conversion_count,
    c.revenue_generated,
    c.cost_per_message * c.sent_count as total_cost,
    ROUND((c.delivered_count::numeric / NULLIF(c.total_recipients, 0) * 100), 2) as delivery_rate,
    CASE 
        WHEN c.revenue_generated > 0 AND c.cost_per_message * c.sent_count > 0 
        THEN ROUND(((c.revenue_generated - (c.cost_per_message * c.sent_count)) / (c.cost_per_message * c.sent_count) * 100), 2)
        ELSE 0
    END as roi,
    c.scheduled_at,
    c.created_at,
    c.approved_at,
    c.completed_at
FROM az_sms_campaigns c
ORDER BY c.created_at DESC;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'az_sms_%'
ORDER BY table_name;

-- Show RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'az_sms_%'
ORDER BY tablename, policyname;
