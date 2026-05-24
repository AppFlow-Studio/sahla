create table public.saved_reels (
  user_id    text not null,
  reel_id    uuid not null references public.reels(reel_id) on delete cascade,
  mosque_id  text not null references public.mosques(id)    on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, reel_id)
);

alter table public.saved_reels enable row level security;

create policy saved_reels_sahla_select on public.saved_reels for select using (is_sahla_team());
create policy saved_reels_user_select on public.saved_reels for select using (user_id = requesting_user_id());
create policy saved_reels_user_insert on public.saved_reels for insert with check (user_id = requesting_user_id());
create policy saved_reels_user_update on public.saved_reels for update using (user_id = requesting_user_id()) with check (user_id = requesting_user_id());
create policy saved_reels_user_delete on public.saved_reels for delete using (user_id = requesting_user_id());

create index saved_reels_user_id_idx on public.saved_reels (user_id);
create index saved_reels_reel_id_idx on public.saved_reels (reel_id);
