-- Fix the bi-weekly prayer-times sync cron.
--
-- The original migration (20260430000003_prayer_times_sync.sql) scheduled a
-- cron that called `current_setting('app.settings.supabase_url')`, but that
-- GUC was never set on this database, so every run since deploy has failed
-- with "unrecognized configuration parameter".
--
-- This migration:
--   1. Unschedules the broken cron job.
--   2. Re-schedules it with the project URL hardcoded.
--
-- NOTE: the sync-prayer-times edge function must be deployed with
-- `verify_jwt = false` (see supabase/config.toml) so the cron can invoke it
-- without an Authorization header. Redeploy after applying this migration:
--   supabase functions deploy sync-prayer-times

SELECT cron.unschedule('sync-prayer-times-biweekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-prayer-times-biweekly');

SELECT cron.schedule(
  'sync-prayer-times-biweekly',
  '0 3 1,15 * *',
  $$
  SELECT net.http_post(
    url := 'https://arlvxsoeecvfhkepalna.supabase.co/functions/v1/sync-prayer-times',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
