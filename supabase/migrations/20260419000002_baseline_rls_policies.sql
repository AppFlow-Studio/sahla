-- =============================================================================
-- Sahla Baseline: RLS Enable + All Policies
-- =============================================================================

-- Enable RLS on every table that has policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_business_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_ads_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_islamic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_islamic_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE iqamah_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE jummah ENABLE ROW LEVEL SECURITY;
ALTER TABLE jummah_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_display_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_notification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ramadan_quran_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sahla_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sahla_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE taraweeh_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarked_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarked_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_continue_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_islamic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_islamic_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liked_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liked_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Special policies: activity_log
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT TO public WITH CHECK (is_sahla_team());

DROP POLICY IF EXISTS "activity_log_mosque_select" ON activity_log;
CREATE POLICY "activity_log_mosque_select" ON activity_log FOR SELECT TO public USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "activity_log_sahla_select" ON activity_log;
CREATE POLICY "activity_log_sahla_select" ON activity_log FOR SELECT TO public USING (is_sahla_team());

-- Special policies: mosque_health_scores
DROP POLICY IF EXISTS "mhs_insert" ON mosque_health_scores;
CREATE POLICY "mhs_insert" ON mosque_health_scores FOR INSERT TO public WITH CHECK (is_sahla_team());

DROP POLICY IF EXISTS "mhs_select" ON mosque_health_scores;
CREATE POLICY "mhs_select" ON mosque_health_scores FOR SELECT TO public USING (is_sahla_team());

-- Special policies: mosque_onboarding_steps
DROP POLICY IF EXISTS "mos_mosque_select" ON mosque_onboarding_steps;
CREATE POLICY "mos_mosque_select" ON mosque_onboarding_steps FOR SELECT TO public USING ((mosque_id = requesting_mosque_id()) OR is_sahla_team());

DROP POLICY IF EXISTS "mos_mosque_update" ON mosque_onboarding_steps;
CREATE POLICY "mos_mosque_update" ON mosque_onboarding_steps FOR UPDATE TO public USING ((mosque_id = requesting_mosque_id()) OR is_sahla_team());

DROP POLICY IF EXISTS "mos_sahla_delete" ON mosque_onboarding_steps;
CREATE POLICY "mos_sahla_delete" ON mosque_onboarding_steps FOR DELETE TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "mos_sahla_insert" ON mosque_onboarding_steps;
CREATE POLICY "mos_sahla_insert" ON mosque_onboarding_steps FOR INSERT TO public WITH CHECK (is_sahla_team());

-- Special policies: nudge_dismissals
DROP POLICY IF EXISTS "nd_insert" ON nudge_dismissals;
CREATE POLICY "nd_insert" ON nudge_dismissals FOR INSERT TO public WITH CHECK (is_sahla_team());

DROP POLICY IF EXISTS "nd_select" ON nudge_dismissals;
CREATE POLICY "nd_select" ON nudge_dismissals FOR SELECT TO public USING (is_sahla_team());

-- Special policies: onboarding_checklist_items
DROP POLICY IF EXISTS "oci_manage" ON onboarding_checklist_items;
CREATE POLICY "oci_manage" ON onboarding_checklist_items FOR ALL TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "oci_select" ON onboarding_checklist_items;
CREATE POLICY "oci_select" ON onboarding_checklist_items FOR SELECT TO public USING (true);

-- Special policies: sahla_config
DROP POLICY IF EXISTS "sahla_config_manage" ON sahla_config;
CREATE POLICY "sahla_config_manage" ON sahla_config FOR ALL TO public USING (sahla_team_role() = 'super_admin'::text);

DROP POLICY IF EXISTS "sahla_config_select" ON sahla_config;
CREATE POLICY "sahla_config_select" ON sahla_config FOR SELECT TO public USING (true);

-- Special policies: sahla_team
DROP POLICY IF EXISTS "sahla_team_manage" ON sahla_team;
CREATE POLICY "sahla_team_manage" ON sahla_team FOR ALL TO public USING (sahla_team_role() = 'super_admin'::text);

DROP POLICY IF EXISTS "sahla_team_select" ON sahla_team;
CREATE POLICY "sahla_team_select" ON sahla_team FOR SELECT TO public USING (is_sahla_team());

-- expenses — only sahla_write
DROP POLICY IF EXISTS "expenses_sahla_write" ON expenses;
CREATE POLICY "expenses_sahla_write" ON expenses FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- mosques — public read (app config, not sensitive); sahla_write for admins
DROP POLICY IF EXISTS "mosques_public_read" ON mosques;
CREATE POLICY "mosques_public_read" ON mosques FOR SELECT USING (true);
DROP POLICY IF EXISTS "mosques_sahla_write" ON mosques;
CREATE POLICY "mosques_sahla_write" ON mosques FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- Select-only tables
DROP POLICY IF EXISTS "jummah_notifications_sahla_select" ON jummah_notifications;
CREATE POLICY "jummah_notifications_sahla_select" ON jummah_notifications FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_notification_settings_sahla_select" ON content_notification_settings;
CREATE POLICY "content_notification_settings_sahla_select" ON content_notification_settings FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_notifications_sahla_select" ON content_notifications;
CREATE POLICY "content_notifications_sahla_select" ON content_notifications FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "capacity_alert_subscribers_sahla_select" ON capacity_alert_subscribers;
CREATE POLICY "capacity_alert_subscribers_sahla_select" ON capacity_alert_subscribers FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_islamic_goals_sahla_select" ON content_islamic_goals;
CREATE POLICY "content_islamic_goals_sahla_select" ON content_islamic_goals FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_islamic_interests_sahla_select" ON content_islamic_interests;
CREATE POLICY "content_islamic_interests_sahla_select" ON content_islamic_interests FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "liked_lectures_sahla_select" ON liked_lectures;
CREATE POLICY "liked_lectures_sahla_select" ON liked_lectures FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "prayer_notification_settings_sahla_select" ON prayer_notification_settings;
CREATE POLICY "prayer_notification_settings_sahla_select" ON prayer_notification_settings FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "recommendation_log_sahla_select" ON recommendation_log;
CREATE POLICY "recommendation_log_sahla_select" ON recommendation_log FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "saved_content_sahla_select" ON saved_content;
CREATE POLICY "saved_content_sahla_select" ON saved_content FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_bookmarked_ayahs_sahla_select" ON user_bookmarked_ayahs;
CREATE POLICY "user_bookmarked_ayahs_sahla_select" ON user_bookmarked_ayahs FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_bookmarked_surahs_sahla_select" ON user_bookmarked_surahs;
CREATE POLICY "user_bookmarked_surahs_sahla_select" ON user_bookmarked_surahs FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_cart_sahla_select" ON user_cart;
CREATE POLICY "user_cart_sahla_select" ON user_cart FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_content_interactions_sahla_select" ON user_content_interactions;
CREATE POLICY "user_content_interactions_sahla_select" ON user_content_interactions FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_continue_read_sahla_select" ON user_continue_read;
CREATE POLICY "user_continue_read_sahla_select" ON user_continue_read FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_islamic_goals_sahla_select" ON user_islamic_goals;
CREATE POLICY "user_islamic_goals_sahla_select" ON user_islamic_goals FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_islamic_interests_sahla_select" ON user_islamic_interests;
CREATE POLICY "user_islamic_interests_sahla_select" ON user_islamic_interests FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_liked_ayahs_sahla_select" ON user_liked_ayahs;
CREATE POLICY "user_liked_ayahs_sahla_select" ON user_liked_ayahs FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_liked_surahs_sahla_select" ON user_liked_surahs;
CREATE POLICY "user_liked_surahs_sahla_select" ON user_liked_surahs FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_playlist_sahla_select" ON user_playlist;
CREATE POLICY "user_playlist_sahla_select" ON user_playlist FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_playlist_lectures_sahla_select" ON user_playlist_lectures;
CREATE POLICY "user_playlist_lectures_sahla_select" ON user_playlist_lectures FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "user_preferences_sahla_select" ON user_preferences;
CREATE POLICY "user_preferences_sahla_select" ON user_preferences FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "profiles_sahla_select" ON profiles;
CREATE POLICY "profiles_sahla_select" ON profiles FOR SELECT TO public USING (is_sahla_team());

-- Standard sahla_select + sahla_write tables
DROP POLICY IF EXISTS "ad_pricing_config_sahla_select" ON ad_pricing_config;
CREATE POLICY "ad_pricing_config_sahla_select" ON ad_pricing_config FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "ad_pricing_config_sahla_write" ON ad_pricing_config;
CREATE POLICY "ad_pricing_config_sahla_write" ON ad_pricing_config FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "ad_subscriptions_sahla_select" ON ad_subscriptions;
CREATE POLICY "ad_subscriptions_sahla_select" ON ad_subscriptions FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "ad_subscriptions_sahla_write" ON ad_subscriptions;
CREATE POLICY "ad_subscriptions_sahla_write" ON ad_subscriptions FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "approved_business_ads_sahla_select" ON approved_business_ads;
CREATE POLICY "approved_business_ads_sahla_select" ON approved_business_ads FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "approved_business_ads_sahla_write" ON approved_business_ads;
CREATE POLICY "approved_business_ads_sahla_write" ON approved_business_ads FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "business_ads_submissions_sahla_select" ON business_ads_submissions;
CREATE POLICY "business_ads_submissions_sahla_select" ON business_ads_submissions FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "business_ads_submissions_sahla_write" ON business_ads_submissions;
CREATE POLICY "business_ads_submissions_sahla_write" ON business_ads_submissions FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "content_forms_sahla_select" ON content_forms;
CREATE POLICY "content_forms_sahla_select" ON content_forms FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_forms_sahla_write" ON content_forms;
CREATE POLICY "content_forms_sahla_write" ON content_forms FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "content_items_sahla_select" ON content_items;
CREATE POLICY "content_items_sahla_select" ON content_items FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_items_sahla_write" ON content_items;
CREATE POLICY "content_items_sahla_write" ON content_items FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "content_notification_schedule_sahla_select" ON content_notification_schedule;
CREATE POLICY "content_notification_schedule_sahla_select" ON content_notification_schedule FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_notification_schedule_sahla_write" ON content_notification_schedule;
CREATE POLICY "content_notification_schedule_sahla_write" ON content_notification_schedule FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "content_tag_assignments_sahla_select" ON content_tag_assignments;
CREATE POLICY "content_tag_assignments_sahla_select" ON content_tag_assignments FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_tag_assignments_sahla_write" ON content_tag_assignments;
CREATE POLICY "content_tag_assignments_sahla_write" ON content_tag_assignments FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "content_tags_sahla_select" ON content_tags;
CREATE POLICY "content_tags_sahla_select" ON content_tags FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "content_tags_sahla_write" ON content_tags;
CREATE POLICY "content_tags_sahla_write" ON content_tags FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "display_categories_sahla_select" ON display_categories;
CREATE POLICY "display_categories_sahla_select" ON display_categories FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "display_categories_sahla_write" ON display_categories;
CREATE POLICY "display_categories_sahla_write" ON display_categories FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "donations_sahla_select" ON donations;
CREATE POLICY "donations_sahla_select" ON donations FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "donations_sahla_write" ON donations;
CREATE POLICY "donations_sahla_write" ON donations FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "iqamah_config_sahla_select" ON iqamah_config;
CREATE POLICY "iqamah_config_sahla_select" ON iqamah_config FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "iqamah_config_sahla_write" ON iqamah_config;
CREATE POLICY "iqamah_config_sahla_write" ON iqamah_config FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "jummah_sahla_select" ON jummah;
CREATE POLICY "jummah_sahla_select" ON jummah FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "jummah_sahla_write" ON jummah;
CREATE POLICY "jummah_sahla_write" ON jummah FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "lectures_sahla_select" ON lectures;
CREATE POLICY "lectures_sahla_select" ON lectures FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "lectures_sahla_write" ON lectures;
CREATE POLICY "lectures_sahla_write" ON lectures FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "mosque_notes_sahla_select" ON mosque_notes;
CREATE POLICY "mosque_notes_sahla_select" ON mosque_notes FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "mosque_notes_sahla_write" ON mosque_notes;
CREATE POLICY "mosque_notes_sahla_write" ON mosque_notes FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "mosque_notification_config_sahla_select" ON mosque_notification_config;
CREATE POLICY "mosque_notification_config_sahla_select" ON mosque_notification_config FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "mosque_notification_config_sahla_write" ON mosque_notification_config;
CREATE POLICY "mosque_notification_config_sahla_write" ON mosque_notification_config FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "pipeline_stages_sahla_select" ON pipeline_stages;
CREATE POLICY "pipeline_stages_sahla_select" ON pipeline_stages FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "pipeline_stages_sahla_write" ON pipeline_stages;
CREATE POLICY "pipeline_stages_sahla_write" ON pipeline_stages FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "prayer_display_config_sahla_select" ON prayer_display_config;
CREATE POLICY "prayer_display_config_sahla_select" ON prayer_display_config FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "prayer_display_config_sahla_write" ON prayer_display_config;
CREATE POLICY "prayer_display_config_sahla_write" ON prayer_display_config FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "prayer_notification_schedule_sahla_select" ON prayer_notification_schedule;
CREATE POLICY "prayer_notification_schedule_sahla_select" ON prayer_notification_schedule FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "prayer_notification_schedule_sahla_write" ON prayer_notification_schedule;
CREATE POLICY "prayer_notification_schedule_sahla_write" ON prayer_notification_schedule FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "prayers_sahla_select" ON prayers;
CREATE POLICY "prayers_sahla_select" ON prayers FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "prayers_sahla_write" ON prayers;
CREATE POLICY "prayers_sahla_write" ON prayers FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "projects_sahla_select" ON projects;
CREATE POLICY "projects_sahla_select" ON projects FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "projects_sahla_write" ON projects;
CREATE POLICY "projects_sahla_write" ON projects FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "push_tokens_sahla_select" ON push_tokens;
CREATE POLICY "push_tokens_sahla_select" ON push_tokens FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "push_tokens_sahla_write" ON push_tokens;
CREATE POLICY "push_tokens_sahla_write" ON push_tokens FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "quran_playlist_sahla_select" ON quran_playlist;
CREATE POLICY "quran_playlist_sahla_select" ON quran_playlist FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "quran_playlist_sahla_write" ON quran_playlist;
CREATE POLICY "quran_playlist_sahla_write" ON quran_playlist FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "ramadan_quran_tracker_sahla_select" ON ramadan_quran_tracker;
CREATE POLICY "ramadan_quran_tracker_sahla_select" ON ramadan_quran_tracker FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "ramadan_quran_tracker_sahla_write" ON ramadan_quran_tracker;
CREATE POLICY "ramadan_quran_tracker_sahla_write" ON ramadan_quran_tracker FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "speaker_data_sahla_select" ON speaker_data;
CREATE POLICY "speaker_data_sahla_select" ON speaker_data FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "speaker_data_sahla_write" ON speaker_data;
CREATE POLICY "speaker_data_sahla_write" ON speaker_data FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "taraweeh_lineup_sahla_select" ON taraweeh_lineup;
CREATE POLICY "taraweeh_lineup_sahla_select" ON taraweeh_lineup FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "taraweeh_lineup_sahla_write" ON taraweeh_lineup;
CREATE POLICY "taraweeh_lineup_sahla_write" ON taraweeh_lineup FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

DROP POLICY IF EXISTS "todays_prayers_sahla_select" ON todays_prayers;
CREATE POLICY "todays_prayers_sahla_select" ON todays_prayers FOR SELECT TO public USING (is_sahla_team());

DROP POLICY IF EXISTS "todays_prayers_sahla_write" ON todays_prayers;
CREATE POLICY "todays_prayers_sahla_write" ON todays_prayers FOR ALL TO public USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));
