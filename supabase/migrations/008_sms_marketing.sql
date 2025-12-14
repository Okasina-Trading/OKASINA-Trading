-- OKASINA SMS Marketing - Database Schema
-- Run this in Supabase SQL Editor (hthkrbtwfymaxtnvshfz)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SMS CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created_at ON sms_campaigns(created_at DESC);

-- ============================================================
-- 2. SMS MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed')),
    gateway_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign_id ON sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_phone ON sms_messages(phone_number);

-- ============================================================
-- 3. SMS CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    tags TEXT[] DEFAULT '{}',
    opted_in BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_contacts_phone ON sms_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_contacts_opted_in ON sms_contacts(opted_in);
CREATE INDEX IF NOT EXISTS idx_sms_contacts_tags ON sms_contacts USING GIN(tags);

-- ============================================================
-- 4. SMS TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    variables TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. SMS GATEWAY CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_gateway_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_type TEXT NOT NULL DEFAULT 'android',
    api_url TEXT,
    api_key TEXT,
    device_id TEXT,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config
INSERT INTO sms_gateway_config (gateway_type, rate_limit_per_minute)
VALUES ('android', 30)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE sms_campaigns
    SET 
        sent_count = (SELECT COUNT(*) FROM sms_messages WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered')),
        delivered_count = (SELECT COUNT(*) FROM sms_messages WHERE campaign_id = p_campaign_id AND status = 'delivered'),
        failed_count = (SELECT COUNT(*) FROM sms_messages WHERE campaign_id = p_campaign_id AND status = 'failed'),
        updated_at = NOW()
    WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign summary
CREATE OR REPLACE VIEW sms_campaign_summary AS
SELECT 
    c.id,
    c.name,
    c.status,
    c.total_recipients,
    c.sent_count,
    c.delivered_count,
    c.failed_count,
    ROUND((c.delivered_count::numeric / NULLIF(c.total_recipients, 0) * 100), 2) as delivery_rate,
    c.scheduled_at,
    c.created_at
FROM sms_campaigns c
ORDER BY c.created_at DESC;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'sms_%'
ORDER BY table_name;
