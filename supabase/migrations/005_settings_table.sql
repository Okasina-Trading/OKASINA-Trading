-- Create settings table for social media links and other site settings
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to settings"
    ON public.settings FOR SELECT
    USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings"
    ON public.settings FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Insert default social media settings
INSERT INTO public.settings (key, value, description) VALUES
    ('social_media', '{
        "facebook": "",
        "instagram": "",
        "twitter": "",
        "pinterest": "",
        "youtube": "",
        "tiktok": ""
    }'::jsonb, 'Social media platform URLs'),
    ('contact_info', '{
        "email": "info@okasinatrading.com",
        "phone": "",
        "whatsapp": ""
    }'::jsonb, 'Contact information')
ON CONFLICT (key) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
