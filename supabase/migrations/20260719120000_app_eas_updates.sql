-- EAS Update (OTA) history for the HQ "Builds" tab.
-- EAS Update ships JavaScript/asset bundles over-the-air, independent of the
-- App Store / Play listing — an app can be "live 1.0" on the store while on OTA
-- update N. A single `eas update` publish fans out to one Expo row per platform
-- sharing a `group` id; we collapse those into one row here with a platforms[]
-- array. Populated by the EAS sync that reads Expo's GraphQL API using
-- EXPO_TOKEN + each mosque's eas_project_id.
create table if not exists public.app_eas_updates (
  id uuid primary key default gen_random_uuid(),
  mosque_id text not null references public.mosques(id) on delete cascade,
  -- Expo update group id (one publish; unique per mosque).
  update_group text not null,
  branch text,
  message text,
  runtime_version text,
  -- Platforms this update group targets, e.g. {ios,android}.
  platforms text[] not null default '{}',
  git_commit text,
  published_by text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (mosque_id, update_group)
);

create index if not exists app_eas_updates_mosque_idx on public.app_eas_updates (mosque_id);
create index if not exists app_eas_updates_recent_idx
  on public.app_eas_updates (mosque_id, published_at desc);

-- HQ/admin-only data, reached through the service-role admin client which
-- bypasses RLS. Enable RLS with no policies so nothing is exposed by default.
alter table public.app_eas_updates enable row level security;

comment on table public.app_eas_updates is
  'Per-mosque EAS Update (OTA) history for the HQ Builds tab. Synced from Expo GraphQL by eas_project_id.';
