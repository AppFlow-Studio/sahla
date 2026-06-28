-- Fix the prayer-times sync cron's target project.
-- ----------------------------------------------------------------------------
-- 20260523200000_fix_prayer_sync_cron.sql hardcoded the WRONG project ref
-- (arlvxsoeecvfhkepalna — the website's old Supabase project), so every
-- bi-weekly run POSTed into the void and `todays_prayers` was never refreshed
-- on staging. That's why prayer times stopped updating. Re-schedule against the
-- correct project (rpepxdgdiqeirdqsazuc).

SELECT cron.unschedule('sync-prayer-times-biweekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-prayer-times-biweekly');

SELECT cron.schedule(
  'sync-prayer-times-biweekly',
  '0 3 1,15 * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/sync-prayer-times',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
