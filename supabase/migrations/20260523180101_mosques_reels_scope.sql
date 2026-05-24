-- mosques.reels_scope: per-masjid switch for the Watch feed.
--   'own'    → users in this masjid only see this masjid's reels (default).
--   'global' → users in this masjid see published reels from every masjid,
--              and this masjid's reels flow into that shared pool too.
-- Toggled by the masjid admin in the CRM (separate webapp). The mobile feed
-- reads it inside reels-actions / list_reels_scored. Interest weights still
-- come from user_islamic_interests for the viewing masjid — scoring stays
-- user-scoped regardless of where each reel was uploaded.

alter table public.mosques
  add column if not exists reels_scope text not null default 'own'
    check (reels_scope in ('own', 'global'));

comment on column public.mosques.reels_scope is
  'Watch-feed scope for this masjid''s users: ''own'' = this masjid only, ''global'' = cross-masjid pool. Managed via masjid CRM.';
