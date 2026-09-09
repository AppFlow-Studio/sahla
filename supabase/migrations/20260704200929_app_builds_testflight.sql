-- TestFlight (iOS beta) tracking for the Builds tab.
-- TestFlight is a distinct distribution channel from the App Store listing —
-- an app can be live on the store AND have a beta build on TestFlight — so it's
-- a separate flag, not a `status` value. Populated by the App Store Connect
-- sync (/v1/builds + buildBetaDetails). iOS-only; null/false on Android rows.
alter table public.app_builds
  add column if not exists on_testflight boolean not null default false,
  add column if not exists testflight_version text,
  add column if not exists testflight_build_number text,
  -- Raw external beta state (e.g. IN_BETA_TESTING / IN_BETA_REVIEW / BETA_REJECTED).
  add column if not exists testflight_state text;

comment on column public.app_builds.on_testflight is
  'True when an iOS beta build is available on TestFlight (from App Store Connect).';
