-- App build tracking for the HQ "Builds" tab.
-- One row per (mosque, platform) holding the app's current store state, plus a
-- child table of version history. Populated by a scheduled sync that reads the
-- App Store Connect API (iOS) and Google Play Developer API (Android). Until
-- those credentials are wired the tables stay empty and the Builds tab falls
-- back to mosque identity + onboarding-derived status.

create table if not exists public.app_builds (
  id uuid primary key default gen_random_uuid(),
  mosque_id text not null references public.mosques(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  -- App Store Connect app id (iOS) or Play package name (Android).
  store_app_id text,
  status text not null default 'unknown'
    check (status in ('live', 'pending_review', 'building', 'rejected', 'unknown')),
  current_version text,
  current_build_number text,
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mosque_id, platform)
);

create table if not exists public.app_build_versions (
  id uuid primary key default gen_random_uuid(),
  app_build_id uuid not null references public.app_builds(id) on delete cascade,
  version text not null,
  build_number text,
  released_at timestamptz,
  notes text,
  -- Raw store state string (e.g. READY_FOR_SALE / inProgress) for debugging.
  store_state text,
  created_at timestamptz not null default now(),
  unique (app_build_id, version)
);

create index if not exists app_builds_mosque_idx on public.app_builds (mosque_id);
create index if not exists app_build_versions_build_idx on public.app_build_versions (app_build_id);

-- HQ/admin-only data: reached through the service-role admin client, which
-- bypasses RLS. Enable RLS with no policies so nothing is exposed to anon/auth
-- roles by default.
alter table public.app_builds enable row level security;
alter table public.app_build_versions enable row level security;

comment on table public.app_builds is
  'Per-mosque, per-platform app store build state for the HQ Builds tab. Synced from App Store Connect / Google Play.';
