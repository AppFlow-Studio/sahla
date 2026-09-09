-- content_notifications_sent: idempotency ledger for program/event reminders.
--
-- Mirrors `prayer_notifications_sent`. The sender runs every minute and claims
-- a row here BEFORE pushing, so two overlapping cron runs (or a retry) can't
-- double-send the same reminder. One row per occurrence per offset — not per
-- user — because a single claim covers everyone due at that moment.
--
-- `occurrence_date` is the LOCAL date of the occurrence in the mosque's
-- timezone, not the date the row was written: a "1 day before" reminder is
-- claimed against the day the program actually runs.
--
-- Note: `content_notification_schedule` (baseline) was designed for a
-- pre-populated per-user queue and has never been written to by anything. The
-- sender computes occurrences on the fly instead, so a rescheduled program
-- can't leave stale queued rows behind. That table should be dropped once
-- we're sure nothing external reads it.
--
-- Author: Wakeem Widdi
-- Applied to staging: (pending)

CREATE TABLE IF NOT EXISTS public.content_notifications_sent (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_items(content_id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  /* Minutes before the occurrence: 0, 5, 30, 60, 1440. */
  offset_minutes INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_count INT DEFAULT 0,
  CONSTRAINT content_notifications_sent_unique
    UNIQUE (content_id, occurrence_date, offset_minutes)
);

CREATE INDEX IF NOT EXISTS idx_content_notifications_sent_cleanup
  ON public.content_notifications_sent(occurrence_date);

ALTER TABLE public.content_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Service-role only (the sender). Mosque admins read delivery history through
-- the CRM's own endpoints, which use the admin client.
CREATE POLICY content_notifications_sent_sahla
  ON public.content_notifications_sent
  FOR SELECT USING (public.is_sahla_team());
