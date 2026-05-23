-- Add date column to todays_prayers so we can store a rolling 30-day window
-- of prayer times synced from the Al Adhan API bi-weekly.

-- 1. Add the date column
ALTER TABLE todays_prayers ADD COLUMN IF NOT EXISTS date date;

-- 2. Backfill any existing rows with today's date
UPDATE todays_prayers SET date = CURRENT_DATE WHERE date IS NULL;

-- 3. Make it NOT NULL going forward
ALTER TABLE todays_prayers ALTER COLUMN date SET NOT NULL;

-- 4. Unique constraint: one row per mosque + prayer + date
ALTER TABLE todays_prayers
  ADD CONSTRAINT uq_todays_prayers_mosque_prayer_date
  UNIQUE (mosque_id, prayer_name, date);

-- 5. Index for fast lookups by mosque + date
CREATE INDEX IF NOT EXISTS idx_todays_prayers_mosque_date
  ON todays_prayers (mosque_id, date);

-- 6. Enable pg_cron and pg_net for scheduled edge function calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 7. Schedule bi-weekly sync: 1st and 15th of every month at 3am UTC
-- Calls the sync-prayer-times edge function which fetches 30 days of
-- prayer times from Al Adhan API, upserts into todays_prayers, and
-- cleans up rows older than today.
SELECT cron.schedule(
  'sync-prayer-times-biweekly',
  '0 3 1,15 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-prayer-times',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
