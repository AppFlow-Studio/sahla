-- Per-user, per-mosque master switches for notifications that are NOT tied to a
-- specific content_id (Event reminders for RSVPs, New programs recommendations,
-- Masjid announcements). The existing prayer_notification_settings and
-- jummah_notifications tables continue to hold the per-prayer / per-jummah
-- preferences.

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  event_reminders_enabled boolean NOT NULL DEFAULT false,
  new_programs_enabled boolean NOT NULL DEFAULT true,
  masjid_announcements_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mosque_id)
);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_notification_preferences_user_select"
  ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_user_select"
  ON public.user_notification_preferences
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

DROP POLICY IF EXISTS "user_notification_preferences_user_insert"
  ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_user_insert"
  ON public.user_notification_preferences
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "user_notification_preferences_user_update"
  ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_user_update"
  ON public.user_notification_preferences
  FOR UPDATE TO public
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "user_notification_preferences_user_delete"
  ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_user_delete"
  ON public.user_notification_preferences
  FOR DELETE TO public
  USING (user_id = requesting_user_id());
