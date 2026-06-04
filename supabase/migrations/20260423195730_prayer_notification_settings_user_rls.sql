-- Allow authenticated users to read AND write their own prayer notification
-- settings rows. The baseline schema only granted read access to the sahla
-- team; without these policies the Notification Center modal cannot persist
-- a user's per-prayer toggles.

DROP POLICY IF EXISTS "prayer_notification_settings_user_select" ON prayer_notification_settings;
CREATE POLICY "prayer_notification_settings_user_select" ON prayer_notification_settings
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

DROP POLICY IF EXISTS "prayer_notification_settings_user_insert" ON prayer_notification_settings;
CREATE POLICY "prayer_notification_settings_user_insert" ON prayer_notification_settings
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "prayer_notification_settings_user_update" ON prayer_notification_settings;
CREATE POLICY "prayer_notification_settings_user_update" ON prayer_notification_settings
  FOR UPDATE TO public
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "prayer_notification_settings_user_delete" ON prayer_notification_settings;
CREATE POLICY "prayer_notification_settings_user_delete" ON prayer_notification_settings
  FOR DELETE TO public
  USING (user_id = requesting_user_id());
