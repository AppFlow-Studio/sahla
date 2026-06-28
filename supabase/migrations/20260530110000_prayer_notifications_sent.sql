-- prayer_notifications_sent: idempotency ledger for the prayer-notification
-- sender cron (send-prayer-notifications).
--
-- The sender runs every minute. To guarantee at-most-once delivery — even if a
-- cron run overlaps the next, or a function retries — it CLAIMS a row here
-- before sending. The UNIQUE constraint makes the claim atomic: whoever inserts
-- the (mosque, prayer, date, kind) row first owns that send; everyone else skips.
--
--   kind: 'athan' | 'iqamah' | 'reminder_30'
--
-- Only the service-role sender touches this table, so RLS is enabled with no
-- policies (service role bypasses RLS; everyone else is denied).

CREATE TABLE IF NOT EXISTS public.prayer_notifications_sent (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES public.mosques(id),
  prayer_name text NOT NULL,
  date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('athan', 'iqamah', 'reminder_30')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prayer_notifications_sent_unique UNIQUE (mosque_id, prayer_name, date, kind)
);

ALTER TABLE public.prayer_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Housekeeping: drop ledger rows older than 7 days so the table stays small.
-- (The sender also opportunistically cleans up, but this is the safety net.)
CREATE INDEX IF NOT EXISTS idx_prayer_notifications_sent_date
  ON public.prayer_notifications_sent (date);
