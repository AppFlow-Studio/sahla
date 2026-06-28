-- NT-ENGAGE-01 — Engagement-nudge sender infrastructure + cron schedule.
--
-- Mirrors the prayer-notification pipeline pattern (prayer_notifications_sent
-- + schedule_prayer_notifications) but at a daily cadence: engagement nudges
-- are once-per-day per user per nudge_type, not per-minute per mosque.
--
-- "Nudge type" is a free-text discriminator so adding the next engagement
-- nudge (streaks, re-engagement, etc.) only takes the sender code, not a new
-- ledger table.

-- 1. Per-user toggle. Defaults TRUE so new accounts get nudges out of the
--    box; users can disable via the Notifications settings screen.
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS engagement_nudges_enabled boolean NOT NULL DEFAULT true;

-- 2. Idempotency ledger. Sender CLAIMS a row before pushing — the unique
--    (user, mosque, type, period_key) constraint makes the claim atomic so
--    overlapping cron runs can't double-send. `period_key` is opaque to the
--    table; for the Quran goal nudge it's the user's LOCAL ISO date.
CREATE TABLE IF NOT EXISTS public.engagement_nudges_sent (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mosque_id   text NOT NULL REFERENCES public.mosques(id)  ON DELETE CASCADE,
  nudge_type  text NOT NULL,
  period_key  text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT engagement_nudges_sent_unique UNIQUE (user_id, mosque_id, nudge_type, period_key)
);

-- Same RLS shape as prayer_notifications_sent: only the service-role sender
-- touches this table; no policies = denied for everyone else.
ALTER TABLE public.engagement_nudges_sent ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_engagement_nudges_sent_sent_at
  ON public.engagement_nudges_sent (sent_at);

-- 3. Cron schedule. Engagement nudges are MUCH lower cadence than prayer:
--    once every 15 minutes is plenty since the sender claims-then-skips by
--    `period_key = LOCAL today` so each user gets at most one nudge per day.
--    The 15-minute granularity lets us hit each mosque's send-window edges
--    (08:00 local) precisely enough.
--
-- URL points at the prod project (rpepxdgdiqeirdqsazuc), matching the
-- existing send-prayer-notifications cron convention. When applying to
-- staging, swap the host to mwlhipljkvthhccqodum manually.

SELECT cron.unschedule('send-engagement-nudges-every-15-min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-engagement-nudges-every-15-min'
);

SELECT cron.schedule(
  'send-engagement-nudges-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/send-engagement-nudges',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
