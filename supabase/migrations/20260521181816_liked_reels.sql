-- liked_reels: per-user, per-reel like tracker.
-- Distinct from saved_reels (bookmark) — a user can like a reel without
-- bookmarking it and vice versa. Shape mirrors saved_reels.

create table if not exists public.liked_reels (
  user_id    text        not null,
  reel_id    uuid        not null references public.reels(reel_id)   on delete cascade,
  mosque_id  text        not null references public.mosques(id)      on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);

create index if not exists liked_reels_user_id_idx   on public.liked_reels (user_id);
create index if not exists liked_reels_reel_id_idx   on public.liked_reels (reel_id);
create index if not exists liked_reels_mosque_id_idx on public.liked_reels (mosque_id);

-- Denormalized counter on reels — same idea as view_count. Keeps the feed
-- query cheap (no join + count) at the cost of one extra UPDATE per like.
alter table public.reels
  add column if not exists like_count integer not null default 0;

-- Backfill from any rows that already exist (none expected, but cheap + safe).
update public.reels r
   set like_count = sub.cnt
  from (select reel_id, count(*)::int as cnt from public.liked_reels group by reel_id) sub
 where r.reel_id = sub.reel_id;

create or replace function public.bump_reel_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.reels
       set like_count = like_count + 1
     where reel_id = new.reel_id;
    return new;
  elsif (tg_op = 'DELETE') then
    -- greatest(...,0) guards against the counter drifting negative if a row
    -- is ever deleted out-of-band (e.g. manual cleanup, FK cascade).
    update public.reels
       set like_count = greatest(like_count - 1, 0)
     where reel_id = old.reel_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists liked_reels_bump_count on public.liked_reels;
create trigger liked_reels_bump_count
  after insert or delete on public.liked_reels
  for each row execute function public.bump_reel_like_count();

-- RLS — mirrors saved_reels exactly.
alter table public.liked_reels enable row level security;

create policy liked_reels_user_select on public.liked_reels
  for select using (user_id = requesting_user_id());

create policy liked_reels_user_insert on public.liked_reels
  for insert with check (user_id = requesting_user_id());

create policy liked_reels_user_update on public.liked_reels
  for update using (user_id = requesting_user_id())
              with check (user_id = requesting_user_id());

create policy liked_reels_user_delete on public.liked_reels
  for delete using (user_id = requesting_user_id());

create policy liked_reels_sahla_select on public.liked_reels
  for select using (is_sahla_team());
