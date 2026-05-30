-- Schedule the prayer-notification sender to run every minute.
--
-- The sender (send-prayer-notifications) resolves each mosque's "now" in its own
-- timezone and pushes athan / iqamah / 30-min reminders that land on the current
-- minute. Running every minute keeps delivery within ~60s of the actual time.
--
-- NOTE: the URL is this project's own Functions endpoint (rpepxdgdiqeirdqsazuc).
-- The earlier sync-prayer-times cron (20260523200000) hardcoded a DIFFERENT ref
-- (arlvxsoeecvfhkepalna) — that looks like a copy/paste from the website repo and
-- is almost certainly why prayer sync hasn't been firing. Using the correct ref
-- here. The function must be deployed with verify_jwt = false (see config.toml):
--   supabase functions deploy send-prayer-notifications

SELECT cron.unschedule('send-prayer-notifications-every-minute')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-prayer-notifications-every-minute'
);

SELECT cron.schedule(
  'send-prayer-notifications-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/send-prayer-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
