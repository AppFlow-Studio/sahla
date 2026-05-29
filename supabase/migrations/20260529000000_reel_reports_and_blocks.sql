-- reel_reports + blocked_reel_sources: user-safety primitives for the Watch feed.
--
-- Apple App Store guideline 1.2 requires apps with user-generated video to let
-- users (a) report objectionable content and (b) block the account it came
-- from. Reels are masjid-authored — the "account" surfaced to a viewer is the
-- masjid — so a block hides every reel from that mosque_id.
--
-- Both tables mirror dismissed_reels (per-user negative signal, same RLS shape).
-- A report also writes a dismissed_reels row on the edge so the reported reel
-- vanishes from the reporter's feed immediately; the rows here are the durable
-- record an admin can triage.

-- ── reel_reports ────────────────────────────────────────────────────────────
-- One report per (user, reel); re-reporting upserts the latest reason/details.
create table if not exists public.reel_reports (
  user_id    text        not null,
  reel_id    uuid        not null references public.reels(reel_id) on delete cascade,
  mosque_id  text        not null references public.mosques(id)    on delete cascade,
  reason     text        not null,
  details    text,
  status     text        not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);

create index if not exists reel_reports_reel_id_idx   on public.reel_reports (reel_id);
create index if not exists reel_reports_mosque_id_idx on public.reel_reports (mosque_id);
create index if not exists reel_reports_status_idx    on public.reel_reports (status);

alter table public.reel_reports enable row level security;

create policy reel_reports_user_select on public.reel_reports
  for select using (user_id = requesting_user_id());

create policy reel_reports_user_insert on public.reel_reports
  for insert with check (user_id = requesting_user_id());

create policy reel_reports_user_update on public.reel_reports
  for update using (user_id = requesting_user_id())
              with check (user_id = requesting_user_id());

create policy reel_reports_user_delete on public.reel_reports
  for delete using (user_id = requesting_user_id());

create policy reel_reports_sahla_select on public.reel_reports
  for select using (is_sahla_team());

-- ── blocked_reel_sources ──────────────────────────────────────────────────
-- A user blocking a masjid's reels. Feed queries filter these out.
create table if not exists public.blocked_reel_sources (
  user_id    text        not null,
  mosque_id  text        not null references public.mosques(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, mosque_id)
);

create index if not exists blocked_reel_sources_user_id_idx   on public.blocked_reel_sources (user_id);
create index if not exists blocked_reel_sources_mosque_id_idx on public.blocked_reel_sources (mosque_id);

alter table public.blocked_reel_sources enable row level security;

create policy blocked_reel_sources_user_select on public.blocked_reel_sources
  for select using (user_id = requesting_user_id());

create policy blocked_reel_sources_user_insert on public.blocked_reel_sources
  for insert with check (user_id = requesting_user_id());

create policy blocked_reel_sources_user_delete on public.blocked_reel_sources
  for delete using (user_id = requesting_user_id());

create policy blocked_reel_sources_sahla_select on public.blocked_reel_sources
  for select using (is_sahla_team());
