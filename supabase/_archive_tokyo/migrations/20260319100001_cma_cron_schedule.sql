-- =====================================================
-- CMA Data Sync — Cron Schedule (pg_cron)
-- מתוזמן לרוץ פעמיים בשבוע: ראשון 06:00 + רביעי 06:00
-- קורא ל-edge function fetch-cma-data
-- =====================================================

-- Enable pg_cron extension (already enabled on Supabase Pro plans)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule: Sunday 06:00 Israel time (03:00 UTC)
SELECT cron.schedule(
  'cma-sync-sunday',
  '0 3 * * 0',  -- At 03:00 UTC every Sunday
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-cma-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule: Wednesday 06:00 Israel time (03:00 UTC)
SELECT cron.schedule(
  'cma-sync-wednesday',
  '0 3 * * 3',  -- At 03:00 UTC every Wednesday
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-cma-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- =====================================================
-- Alternative: If pg_cron is not available, use Supabase
-- Dashboard > Database > Extensions > pg_cron
-- Or use the Supabase Cron UI in the Dashboard
-- =====================================================
-- Manual trigger: POST to /functions/v1/fetch-cma-data
-- curl -X POST https://xddeqljarsswwsslhaoj.supabase.co/functions/v1/fetch-cma-data \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json"
