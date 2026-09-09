-- Drop the promote-pipeline-to-demo cron.
--
-- Original design (added in 20260715120000): every 5 min, promote stage
-- 'contacted' → 'demo' when next_booking_at was within the next hour.
-- The time-based promotion was arbitrary and had two flaws:
--   1. No-shows would still get promoted (the cron doesn't know the call
--      never happened).
--   2. Pipeline said 'demo' before the demo actually took place.
--
-- New design: the cal-webhook edge function handles the MEETING_ENDED
-- Cal.com event, which fires at the meeting's scheduled end time. Only
-- attended meetings result in a promotion — no-shows never fire it
-- (BOOKING_CANCELLED fires first and clears the booking fields).
--
-- The next_booking_at column stays — still useful for CRM display of
-- upcoming calls; just no longer drives auto-promotion.

SELECT cron.unschedule('promote-pipeline-to-demo')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'promote-pipeline-to-demo'
);
