-- reel_islamic_interests: tags reels with islamic interest categories.
-- Direct mirror of content_islamic_interests — same shape, different parent
-- table. This is the bridge between reels and the existing interests catalog;
-- future recommendation work scores reels against the user's interest weights
-- by joining through here.

create table if not exists public.reel_islamic_interests (
  reel_id     uuid        not null references public.reels(reel_id)                  on delete cascade,
  interest_id bigint      not null references public.islamic_interest_categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (reel_id, interest_id)
);

-- Lookup-by-interest gets its own index ("show me all reels tagged Patience").
-- The (reel_id, interest_id) PK already covers lookups by reel_id.
create index if not exists reel_islamic_interests_interest_id_idx
  on public.reel_islamic_interests (interest_id);

alter table public.reel_islamic_interests enable row level security;

-- Tagging is admin-only — writes go through service-role edge functions
-- (reels-upload / reels-actions). End users read tags transitively through
-- the same edge functions, never directly. Mirrors content_islamic_interests.
create policy reel_islamic_interests_sahla_select on public.reel_islamic_interests
  for select using (is_sahla_team());
