-- mosques.reels_setup_mode: how a masjid populates its Reels feed during
-- onboarding.
--   'self'  → the admin uploads their own reels (default, existing behavior)
--   'sahla' → the admin opted out of uploading and asked the Sahla team to
--             curate + upload reels on their behalf (fulfilled post-onboarding)
-- Orthogonal to reels_scope (which controls what plays: own vs global feed).

alter table public.mosques
  add column if not exists reels_setup_mode text not null default 'self'
    check (reels_setup_mode in ('self', 'sahla'));

comment on column public.mosques.reels_setup_mode is
  'Reels population choice: self = admin uploads their own; sahla = admin asked the Sahla team to curate/upload reels for them.';
