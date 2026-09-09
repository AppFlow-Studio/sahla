-- ============================================================================
-- User deletion cascade
-- ============================================================================
--
-- When a Clerk account is deleted, the `clerk-webhooks` edge function deletes
-- the user's `profiles` row and expects ON DELETE CASCADE to clean up every
-- per-user table. That cascade never existed: the original profiles FKs were
-- created without `ON DELETE CASCADE` (default NO ACTION / RESTRICT), and most
-- per-user tables had no FK to profiles at all. As a result `profiles.delete()`
-- threw a foreign-key violation for any real user and the webhook swallowed it
-- (returns 200) — so account deletions silently did nothing.
--
-- This migration makes the cascade real:
--   * Re-creates the 8 existing profiles FKs with ON DELETE CASCADE.
--   * Adds ON DELETE CASCADE FKs to profiles(id) on every per-user table that
--     had a bare `user_id text` and no FK.
--   * donations keeps its row but is unlinked (ON DELETE SET NULL) so financial
--     history is preserved after an account is removed.
--
-- New FKs are added NOT VALID: existing rows are not re-scanned (there may be
-- orphaned rows left behind by previously-failed deletions), but the referential
-- action (cascade / set null) still fires on every future delete, which is all
-- we need. Orphaned rows can be swept separately.
--
-- Intentionally NOT cascaded — managed elsewhere or kept for audit:
--   sahla_team (org-membership webhook), activity_log.actor_id,
--   mosque_notes.author_id, nudge_dismissals.dismissed_by, push_tokens
--   are handled by the webhook (push_tokens included below — see note).
-- ============================================================================

-- ── Tables that should be fully removed when the user is deleted ──
-- Each has a `user_id text` column referencing a Clerk user id (= profiles.id).
do $$
declare
  t text;
  cascade_tables text[] := array[
    -- previously had a non-cascading profiles FK
    'business_ads_submissions',
    'capacity_alert_subscribers',
    'jummah_notifications',
    'recommendation_log',
    'user_content_interactions',
    'user_islamic_goals',
    'user_islamic_interests',
    'user_preferences',
    -- previously had no FK at all
    'push_tokens',
    'prayer_notification_schedule',
    'prayer_notification_settings',
    'content_notification_schedule',
    'content_notification_settings',
    'content_notifications',
    'saved_content',
    'liked_lectures',
    'user_cart',
    'user_bookmarked_ayahs',
    'user_bookmarked_surahs',
    'user_liked_ayahs',
    'user_liked_surahs',
    'user_continue_read',
    'user_playlist',
    'user_playlist_lectures',
    'user_notification_preferences',
    'saved_reels',
    'liked_reels',
    'dismissed_reels',
    'reel_reports',
    'blocked_reel_sources'
  ];
begin
  foreach t in array cascade_tables loop
    -- drop any pre-existing FK on user_id (conventional name), then recreate with cascade
    execute format(
      'alter table public.%I drop constraint if exists %I',
      t, t || '_user_id_fkey'
    );
    execute format(
      'alter table public.%I add constraint %I '
      || 'foreign key (user_id) references public.profiles(id) on delete cascade not valid',
      t, t || '_user_id_fkey'
    );
  end loop;
end $$;

-- ── donations: keep the record, unlink the user (preserve financial history) ──
alter table public.donations
  drop constraint if exists donations_user_id_fkey;
alter table public.donations
  add constraint donations_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null not valid;

-- Note: rsvps already has FK (user_id) REFERENCES profiles(id) ON DELETE CASCADE
-- from 20260505214408_rsvps_table.sql — left as-is.
