-- Per-minute cron that drains scheduled_notifications via the send-push
-- edge function.
--
-- Captured from prod on 2026-06-28 — applied via MCP without being checked
-- in. Backported here so local + remote chain matches.

SELECT cron.unschedule('drain-scheduled-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drain-scheduled-notifications');

SELECT cron.schedule(
  'drain-scheduled-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
