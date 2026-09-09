-- Cal.com booking sync fields on pipeline_stages.
--
-- The cal-webhook edge function receives Cal.com BOOKING_CREATED /
-- BOOKING_RESCHEDULED / BOOKING_CANCELLED events, matches the attendee
-- email to a pipeline_stages row, and stamps the upcoming call's start
-- time here. A separate pg_cron job (below) reads next_booking_at every
-- 5 minutes and promotes stage 'contacted' → 'demo' when the call is
-- within one hour, so the pipeline view naturally reflects the day-of
-- state without anyone touching it.
--
-- cal_booking_uid is Cal.com's stable booking identifier (their `uid`
-- field) — used to correlate reschedule / cancel events with the row
-- that BOOKING_CREATED originally wrote.

ALTER TABLE pipeline_stages
  ADD COLUMN IF NOT EXISTS next_booking_at timestamptz,
  ADD COLUMN IF NOT EXISTS cal_booking_uid text;

-- Partial index — the cron only ever scans rows with a booking scheduled.
CREATE INDEX IF NOT EXISTS pipeline_stages_next_booking_idx
  ON pipeline_stages (next_booking_at)
  WHERE next_booking_at IS NOT NULL;

-- Cron: every 5 minutes, promote stage='contacted' → 'demo' for any row
-- whose booking is within the next hour. The `next_booking_at > now()`
-- guard prevents already-past bookings from being re-promoted on a cron
-- restart. Idempotent — a second run over the same row is a no-op
-- because the stage will already be 'demo'.
SELECT cron.unschedule('promote-pipeline-to-demo')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'promote-pipeline-to-demo'
);

SELECT cron.schedule(
  'promote-pipeline-to-demo',
  '*/5 * * * *',
  $$
  UPDATE pipeline_stages
  SET stage = 'demo',
      updated_at = now()
  WHERE stage = 'contacted'
    AND next_booking_at IS NOT NULL
    AND next_booking_at > now()
    AND next_booking_at <= now() + interval '1 hour';
  $$
);
