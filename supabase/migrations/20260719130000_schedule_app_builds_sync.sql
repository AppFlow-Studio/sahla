-- Schedule the app-build + EAS-update sync.
-- ----------------------------------------------------------------------------
-- Calls the `sync-app-builds` edge function once a day (03:00 UTC). It pulls
-- each ready/live mosque's App Store Connect status/versions/TestFlight (iOS)
-- and EAS Update OTA history and upserts them into app_builds /
-- app_build_versions / app_eas_updates for the HQ Builds tab.
--
-- Store/OTA state changes infrequently, so a daily run keeps the Builds tab
-- fresh without hammering the Apple / Expo APIs.
--
-- NOTE: sync-app-builds must be deployed with verify_jwt = false (see
-- config.toml) so this cron can invoke it without an Authorization header, and
-- its secrets (APPSTORE_CONNECT_*, EXPO_TOKEN) set via `supabase secrets set`.
-- Deploy the function BEFORE applying this migration:
--   supabase functions deploy sync-app-builds
--
-- Applied to staging (rpepxdgdiqeirdqsazuc) only.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('sync-app-builds-daily')
where exists (select 1 from cron.job where jobname = 'sync-app-builds-daily');

select cron.schedule(
  'sync-app-builds-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/sync-app-builds',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
