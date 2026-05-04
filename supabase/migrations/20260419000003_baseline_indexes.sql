-- =============================================================================
-- Sahla Baseline: Indexes
-- =============================================================================

-- activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log USING btree (action);
CREATE INDEX IF NOT EXISTS idx_activity_log_composite ON activity_log USING btree (mosque_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_mosque ON activity_log USING btree (mosque_id);

-- ad_subscriptions
CREATE INDEX IF NOT EXISTS idx_ad_subs_active ON ad_subscriptions USING btree (mosque_id, status) WHERE (status = 'active'::text);
CREATE INDEX IF NOT EXISTS idx_ad_subs_mosque ON ad_subscriptions USING btree (mosque_id);

-- approved_business_ads
CREATE INDEX IF NOT EXISTS idx_aba_mosque ON approved_business_ads USING btree (mosque_id);

-- business_ads_submissions
CREATE INDEX IF NOT EXISTS idx_bas_mosque ON business_ads_submissions USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_bas_status ON business_ads_submissions USING btree (mosque_id, status);

-- content_forms
CREATE INDEX IF NOT EXISTS idx_content_forms_content ON content_forms USING btree (content_id);

-- content_items
CREATE INDEX IF NOT EXISTS idx_content_items_content_id ON content_items USING btree (content_id);
CREATE INDEX IF NOT EXISTS idx_content_items_mosque ON content_items USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items USING btree (mosque_id, type);

-- content_notification_schedule
CREATE INDEX IF NOT EXISTS idx_cns_pending ON content_notification_schedule USING btree (mosque_id, is_sent, notification_time) WHERE (is_sent = false);

-- content_notifications
CREATE INDEX IF NOT EXISTS idx_content_notif_mosque ON content_notifications USING btree (mosque_id);

-- content_tag_assignments
CREATE INDEX IF NOT EXISTS idx_cta_content ON content_tag_assignments USING btree (content_id);
CREATE INDEX IF NOT EXISTS idx_cta_tag ON content_tag_assignments USING btree (tag_id);

-- content_tags
CREATE INDEX IF NOT EXISTS idx_content_tags_display ON content_tags USING btree (display_category_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_mosque ON content_tags USING btree (mosque_id);

-- display_categories
CREATE INDEX IF NOT EXISTS idx_display_categories_mosque ON display_categories USING btree (mosque_id);

-- donations
CREATE INDEX IF NOT EXISTS idx_donations_mosque ON donations USING btree (mosque_id);

-- jummah
CREATE INDEX IF NOT EXISTS idx_jummah_mosque ON jummah USING btree (mosque_id);

-- jummah_notifications
CREATE INDEX IF NOT EXISTS idx_jummah_notif_mosque ON jummah_notifications USING btree (mosque_id);

-- lectures
CREATE INDEX IF NOT EXISTS idx_lectures_content ON lectures USING btree (content_id);
CREATE INDEX IF NOT EXISTS idx_lectures_mosque ON lectures USING btree (mosque_id);

-- liked_lectures
CREATE INDEX IF NOT EXISTS idx_liked_lectures_mosque ON liked_lectures USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_liked_lectures_user ON liked_lectures USING btree (user_id);

-- mosque_health_scores
CREATE INDEX IF NOT EXISTS idx_mhs_latest ON mosque_health_scores USING btree (mosque_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_mhs_mosque ON mosque_health_scores USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_mhs_score ON mosque_health_scores USING btree (overall_score);

-- mosque_notes
CREATE INDEX IF NOT EXISTS idx_mosque_notes_mosque ON mosque_notes USING btree (mosque_id);

-- mosque_onboarding_steps
CREATE INDEX IF NOT EXISTS idx_mos_mosque ON mosque_onboarding_steps USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_mos_status ON mosque_onboarding_steps USING btree (mosque_id, status);

-- nudge_dismissals
CREATE INDEX IF NOT EXISTS idx_nd_mosque ON nudge_dismissals USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_nd_period ON nudge_dismissals USING btree (nudge_period);

-- prayer_notification_schedule
CREATE INDEX IF NOT EXISTS idx_pns_pending ON prayer_notification_schedule USING btree (mosque_id, is_sent, notification_time) WHERE (is_sent = false);

-- prayers
CREATE INDEX IF NOT EXISTS idx_prayers_mosque ON prayers USING btree (mosque_id);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_mosque ON projects USING btree (mosque_id);

-- push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens USING btree (mosque_id, is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_push_tokens_mosque ON push_tokens USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens USING btree (user_id);

-- quran_playlist
CREATE INDEX IF NOT EXISTS idx_quran_playlist_mosque ON quran_playlist USING btree (mosque_id);

-- recommendation_log
CREATE INDEX IF NOT EXISTS idx_rec_log_mosque ON recommendation_log USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_rec_log_user ON recommendation_log USING btree (user_id);

-- saved_content
CREATE INDEX IF NOT EXISTS idx_saved_content_mosque ON saved_content USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_user ON saved_content USING btree (user_id);

-- speaker_data
CREATE INDEX IF NOT EXISTS idx_speaker_data_mosque ON speaker_data USING btree (mosque_id);

-- todays_prayers
CREATE INDEX IF NOT EXISTS idx_todays_prayers_mosque ON todays_prayers USING btree (mosque_id);

-- user_content_interactions
CREATE INDEX IF NOT EXISTS idx_uci_content ON user_content_interactions USING btree (content_id);
CREATE INDEX IF NOT EXISTS idx_uci_mosque ON user_content_interactions USING btree (mosque_id);
CREATE INDEX IF NOT EXISTS idx_uci_user ON user_content_interactions USING btree (user_id);

-- user_cart
CREATE INDEX IF NOT EXISTS idx_user_cart_user ON user_cart USING btree (user_id, mosque_id);

-- user_playlist
CREATE INDEX IF NOT EXISTS idx_user_playlist_user ON user_playlist USING btree (user_id, mosque_id);

-- user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_mosque ON user_preferences USING btree (mosque_id);
