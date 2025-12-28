-- Create Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to site_settings"
ON site_settings FOR SELECT
TO public
USING (true);

-- Create policy for admin write access
CREATE POLICY "Allow admin full access to site_settings"
ON site_settings FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'info@okasinatrading.com')
WITH CHECK (auth.jwt() ->> 'email' = 'info@okasinatrading.com');

-- Insert default flash sale settings
INSERT INTO site_settings (key, value)
VALUES ('flash_sale', '{
    "text": "Flash Sale: Up to 70% OFF!", 
    "end_date": "2025-12-31T00:00:00Z", 
    "is_active": true,
    "theme": "red-orange"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
