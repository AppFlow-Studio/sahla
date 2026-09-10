-- Schedule the program/event reminder sender to run every minute.
--
-- Every minute rather than something coarser because the timings the app offers
-- ("5 min before", "At start time") are minute-exact: the sender fires only when
-- an offset lands on the current minute, so a slower cadence would silently drop
-- reminders.
--
-- No Authorization header, matching the prayer-notification cron: the function
-- is deployed with verify_jwt = false (see config.toml) so pg_cron can invoke it
-- without a token. If that entry ever goes missing the function deploys with
-- verify_jwt = true and every one of these calls 401s in silence.
--
-- URL uses THIS project's ref (rpepxdgdiqeirdqsazuc). An earlier cron in this
-- repo hardcoded a different ref and quietly never fired — worth checking twice.
--
-- Author: Wakeem Widdi
-- Applied to staging: (pending)

SELECT cron.unschedule('send-content-notifications-every-minute')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-content-notifications-every-minute'
);

SELECT cron.schedule(
  'send-content-notifications-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/send-content-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
