-- Add richer analytics columns to page_views
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS device text; -- 'mobile' | 'desktop' | 'tablet'
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS browser text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;

CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views(country);
