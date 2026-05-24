-- jummah_notifications was missing two things needed for the user-facing
-- notification settings UI:
--   1. A unique constraint on (user_id, mosque_id, jummah) so the supabase
--      upsert with onConflict='user_id,mosque_id,jummah' has something to
--      conflict on.
--   2. Per-user RLS policies. Previously only is_sahla_team() could SELECT,
--      and there was no INSERT/UPDATE/DELETE policy at all.
--
-- Mirrors the migration that did the same for prayer_notification_settings.

ALTER TABLE public.jummah_notifications
  DROP CONSTRAINT IF EXISTS jummah_notifications_user_mosque_jummah_unique;
ALTER TABLE public.jummah_notifications
  ADD CONSTRAINT jummah_notifications_user_mosque_jummah_unique
  UNIQUE (user_id, mosque_id, jummah);

DROP POLICY IF EXISTS "jummah_notifications_user_select" ON jummah_notifications;
CREATE POLICY "jummah_notifications_user_select" ON jummah_notifications
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

DROP POLICY IF EXISTS "jummah_notifications_user_insert" ON jummah_notifications;
CREATE POLICY "jummah_notifications_user_insert" ON jummah_notifications
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "jummah_notifications_user_update" ON jummah_notifications;
CREATE POLICY "jummah_notifications_user_update" ON jummah_notifications
  FOR UPDATE TO public
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "jummah_notifications_user_delete" ON jummah_notifications;
CREATE POLICY "jummah_notifications_user_delete" ON jummah_notifications
  FOR DELETE TO public
  USING (user_id = requesting_user_id());
