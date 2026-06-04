-- dismissed_reels: per-user "Not interested" tracker.
-- When a user dismisses a reel it should never resurface in their feed, so we
-- persist the dismissal here and filter it out in list_reels_scored. Distinct
-- from liked_reels / saved_reels — a dismissal is a negative signal, the others
-- are positive. Shape mirrors liked_reels (minus the denormalized counter — we
-- don't display a dismiss count anywhere).

create table if not exists public.dismissed_reels (
  user_id    text        not null,
  reel_id    uuid        not null references public.reels(reel_id)   on delete cascade,
  mosque_id  text        not null references public.mosques(id)      on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);

create index if not exists dismissed_reels_user_id_idx   on public.dismissed_reels (user_id);
create index if not exists dismissed_reels_reel_id_idx   on public.dismissed_reels (reel_id);
create index if not exists dismissed_reels_mosque_id_idx on public.dismissed_reels (mosque_id);

-- RLS — mirrors liked_reels exactly.
alter table public.dismissed_reels enable row level security;

create policy dismissed_reels_user_select on public.dismissed_reels
  for select using (user_id = requesting_user_id());

create policy dismissed_reels_user_insert on public.dismissed_reels
  for insert with check (user_id = requesting_user_id());

create policy dismissed_reels_user_update on public.dismissed_reels
  for update using (user_id = requesting_user_id())
              with check (user_id = requesting_user_id());

create policy dismissed_reels_user_delete on public.dismissed_reels
  for delete using (user_id = requesting_user_id());

create policy dismissed_reels_sahla_select on public.dismissed_reels
  for select using (is_sahla_team());
