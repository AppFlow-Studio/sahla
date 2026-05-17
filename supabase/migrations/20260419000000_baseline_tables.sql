-- =============================================================================
-- Sahla Baseline: Extensions + All Tables
-- Generated: 2026-04-19
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Phase 1: No FK dependencies
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mosques (
  id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  city text,
  state text,
  address text,
  timezone text DEFAULT 'America/New_York'::text,
  app_name text,
  logo_url text,
  brand_color text DEFAULT '#0D7C5F'::text,
  accent_color text,
  secondary_color text,
  masjidal_id text,
  masjidal_sync_enabled boolean DEFAULT false,
  stripe_account_id text,
  subscription_status text DEFAULT 'setup'::text,
  subscription_id text,
  onboarding_status text DEFAULT 'in_progress'::text,
  onboarding_progress jsonb DEFAULT '{}'::jsonb,
  launched_at timestamptz,
  bundle_id text,
  package_name text,
  apple_team_id text,
  apple_merchant_id text,
  eas_project_id text,
  calculation_method integer DEFAULT 2,
  school integer DEFAULT 0,
  clerk_org_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT mosques_slug_key UNIQUE (slug)
);

COMMENT ON COLUMN public.mosques.clerk_org_id IS
  'Clerk Organization ID for this mosque tenant.';

CREATE TABLE IF NOT EXISTS profiles (
  id text NOT NULL,
  first_name text,
  last_name text,
  profile_email text,
  phone_number text,
  profile_pic text,
  stripe_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS islamic_goals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  goal_key text NOT NULL,
  goal_name text NOT NULL,
  display_order integer,
  CONSTRAINT islamic_goals_goal_key_key UNIQUE (goal_key)
);

CREATE TABLE IF NOT EXISTS islamic_interest_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_key text NOT NULL,
  category_name text NOT NULL,
  icon_name text,
  display_order integer,
  parent_category_id bigint REFERENCES islamic_interest_categories(id),
  CONSTRAINT islamic_interest_categories_category_key_key UNIQUE (category_key)
);

CREATE TABLE IF NOT EXISTS onboarding_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  category_label text NOT NULL,
  category_icon text,
  category_order integer NOT NULL,
  task_key text NOT NULL,
  task_name text NOT NULL,
  task_desc text,
  is_required boolean NOT NULL DEFAULT false,
  is_recommended boolean NOT NULL DEFAULT false,
  time_estimate text,
  display_order integer NOT NULL,
  auto_complete_condition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_checklist_items_task_key_key UNIQUE (task_key)
);

CREATE TABLE IF NOT EXISTS sahla_config (
  id text NOT NULL DEFAULT 'singleton'::text PRIMARY KEY,
  org_id text NOT NULL,
  org_name text DEFAULT 'Sahla HQ'::text,
  support_email text DEFAULT 'support@sahla.app'::text,
  platform_fee_pct numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sahla_team (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text,
  is_active boolean NOT NULL DEFAULT true,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  org_id text,
  clerk_org_role text DEFAULT 'org:admin'::text,
  CONSTRAINT sahla_team_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cost numeric NOT NULL,
  frequency text NOT NULL,
  category text DEFAULT 'Platform'::text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Phase 2: FK to mosques / profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS speaker_data (
  speaker_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  speaker_name text,
  speaker_img text,
  speaker_creds text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL REFERENCES mosques(id),
  type text NOT NULL,
  name text,
  description text,
  image text,
  speakers text[],
  days text[],
  start_date timestamptz,
  end_date timestamptz,
  start_time time without time zone,
  gender text DEFAULT 'All'::text,
  has_lectures boolean DEFAULT false,
  is_paid boolean DEFAULT false,
  price double precision DEFAULT 0,
  is_kids boolean DEFAULT false,
  is_fourteen_plus boolean DEFAULT false,
  paid_link text,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  max_capacity integer,
  current_count integer DEFAULT 0,
  CONSTRAINT content_items_content_id_key UNIQUE (content_id)
);

CREATE TABLE IF NOT EXISTS prayers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  "prayerData" jsonb,
  "iqamahData" jsonb
);

CREATE TABLE IF NOT EXISTS todays_prayers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer_name text,
  athan_time time without time zone DEFAULT '08:00:00'::time,
  iqamah_time time without time zone
);

CREATE TABLE IF NOT EXISTS donations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  "amountGiven" double precision,
  project_donated_to text[],
  date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  project_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  project_name text,
  project_goal double precision,
  thumbnail text,
  project_linked_to uuid REFERENCES projects(project_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  token text NOT NULL,
  device_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_user_id_mosque_id_token_key UNIQUE (user_id, mosque_id, token)
);

CREATE TABLE IF NOT EXISTS iqamah_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer_name text NOT NULL,
  mode text NOT NULL,
  fixed_time time without time zone,
  offset_minutes integer,
  seasonal_rules jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iqamah_config_mosque_id_prayer_name_key UNIQUE (mosque_id, prayer_name)
);

CREATE TABLE IF NOT EXISTS display_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  name text NOT NULL,
  slug text NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT display_categories_mosque_id_slug_key UNIQUE (mosque_id, slug)
);

CREATE TABLE IF NOT EXISTS prayer_display_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  calculation_method integer NOT NULL,
  school integer DEFAULT 0,
  hijri_adjustment integer DEFAULT 0,
  tv_theme text DEFAULT 'masjid'::text,
  show_sunrise boolean DEFAULT true,
  show_hijri_date boolean DEFAULT true,
  show_jummah_time boolean DEFAULT true,
  custom_message text,
  display_language text DEFAULT 'en'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prayer_display_config_mosque_id_key UNIQUE (mosque_id)
);

CREATE TABLE IF NOT EXISTS prayer_notification_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer text,
  notification_time timestamptz,
  push_notification_token text,
  is_sent boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS prayer_notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer text,
  notification_settings text[],
  CONSTRAINT prayer_notification_settings_user_id_mosque_id_prayer_key UNIQUE (user_id, mosque_id, prayer)
);

CREATE TABLE IF NOT EXISTS mosque_health_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  overall_score integer NOT NULL,
  content_freshness integer NOT NULL,
  user_engagement integer NOT NULL,
  push_coverage integer NOT NULL,
  admin_activity integer NOT NULL,
  business_ads integer NOT NULL,
  payment_health integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mosque_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  author_id text,
  author_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mosque_notification_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer_notif_enabled boolean DEFAULT true,
  program_notif_enabled boolean DEFAULT true,
  event_notif_enabled boolean DEFAULT true,
  default_reminder_min integer DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mosque_notification_config_mosque_id_key UNIQUE (mosque_id)
);

CREATE TABLE IF NOT EXISTS mosque_onboarding_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  checklist_item_id uuid NOT NULL REFERENCES onboarding_checklist_items(id),
  status text NOT NULL DEFAULT 'pending'::text,
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mosque_onboarding_steps_mosque_id_checklist_item_id_key UNIQUE (mosque_id, checklist_item_id)
);

CREATE TABLE IF NOT EXISTS nudge_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text REFERENCES mosques(id),
  nudge_type text NOT NULL,
  nudge_period text NOT NULL,
  dismissed_by text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nudge_dismissals_mosque_id_nudge_type_nudge_period_key UNIQUE (mosque_id, nudge_type, nudge_period)
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  stage text DEFAULT 'lead'::text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pipeline_stages_mosque_id_key UNIQUE (mosque_id)
);

CREATE TABLE IF NOT EXISTS ad_pricing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  pricing_model text NOT NULL,
  onboarding_fee numeric,
  recurring_fee numeric,
  one_time_fee numeric,
  duration_options jsonb,
  placement_options jsonb,
  max_active_ads integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_pricing_config_mosque_id_key UNIQUE (mosque_id)
);

CREATE TABLE IF NOT EXISTS ramadan_quran_tracker (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah numeric DEFAULT 1,
  surah_name text,
  ayah_num numeric DEFAULT 1,
  num_of_ayahs numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text REFERENCES mosques(id),
  actor_id text,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capacity_alert_subscribers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  CONSTRAINT capacity_alert_subscribers_user_id_mosque_id_key UNIQUE (user_id, mosque_id)
);

CREATE TABLE IF NOT EXISTS taraweeh_lineup (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  date text NOT NULL,
  lineup jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT taraweeh_lineup_mosque_id_date_key UNIQUE (mosque_id, date)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  gender text,
  birth_year integer,
  has_children boolean,
  children_ages integer[],
  is_revert boolean,
  islamic_knowledge_level text,
  preferred_days text[],
  preferred_times text[],
  CONSTRAINT user_preferences_user_id_mosque_id_key UNIQUE (user_id, mosque_id)
);

CREATE TABLE IF NOT EXISTS user_bookmarked_ayahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  ayah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_bookmarked_ayahs_user_mosque_surah_ayah_key UNIQUE (user_id, mosque_id, surah_number, ayah_number)
);

CREATE TABLE IF NOT EXISTS user_bookmarked_surahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_bookmarked_surahs_user_mosque_surah_key UNIQUE (user_id, mosque_id, surah_number)
);

CREATE TABLE IF NOT EXISTS user_liked_ayahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  ayah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_liked_ayahs_user_mosque_surah_ayah_key UNIQUE (user_id, mosque_id, surah_number, ayah_number)
);

CREATE TABLE IF NOT EXISTS user_liked_surahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_liked_surahs_user_mosque_surah_key UNIQUE (user_id, mosque_id, surah_number)
);

CREATE TABLE IF NOT EXISTS user_continue_read (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number integer,
  ayah_number integer,
  juz_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_continue_read_user_id_mosque_id_key UNIQUE (user_id, mosque_id)
);

CREATE TABLE IF NOT EXISTS user_islamic_goals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  goal_id bigint NOT NULL REFERENCES islamic_goals(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  priority integer,
  CONSTRAINT user_islamic_goals_user_goal_mosque_key UNIQUE (user_id, goal_id, mosque_id)
);

CREATE TABLE IF NOT EXISTS user_islamic_interests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  interest_id bigint NOT NULL REFERENCES islamic_interest_categories(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  interest_level integer,
  CONSTRAINT user_islamic_interests_user_interest_mosque_key UNIQUE (user_id, interest_id, mosque_id)
);

CREATE TABLE IF NOT EXISTS business_ads_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES profiles(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  personal_full_name text,
  personal_email text,
  personal_phone text,
  business_name text,
  business_address text,
  business_flyer_img text,
  placement text,
  duration_months integer,
  status text DEFAULT 'submitted'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_ads_submissions_submission_id_key UNIQUE (submission_id)
);

CREATE TABLE IF NOT EXISTS jummah_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text REFERENCES profiles(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  jummah text,
  notification_settings text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Phase 3: FK to content_items, speaker_data
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS jummah (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  speaker uuid REFERENCES speaker_data(speaker_id),
  topic text,
  prayer_time text DEFAULT '12:15 PM'::text,
  capacity_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lectures (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lecture_id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  name text,
  speaker text[],
  date date,
  link text,
  image text,
  ai_summary text,
  key_notes text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'draft'::text,
  CONSTRAINT lectures_lecture_id_key UNIQUE (lecture_id)
);

CREATE TABLE IF NOT EXISTS content_islamic_goals (
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  goal_id bigint NOT NULL REFERENCES islamic_goals(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (content_id, goal_id)
);

CREATE TABLE IF NOT EXISTS content_islamic_interests (
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  interest_id bigint NOT NULL REFERENCES islamic_interest_categories(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (content_id, interest_id)
);

CREATE TABLE IF NOT EXISTS content_forms (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  question text,
  question_type text,
  radio_button_prompts text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT content_notifications_user_id_content_id_key UNIQUE (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS content_notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  notification_settings text[],
  CONSTRAINT content_notification_settings_user_id_content_id_key UNIQUE (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS content_notification_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  title text,
  message text,
  notification_time timestamptz,
  push_notification_token text,
  is_sent boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS content_tags (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text REFERENCES mosques(id),
  tag_key text NOT NULL,
  tag_name text NOT NULL,
  tag_type text,
  display_category_id bigint REFERENCES display_categories(id),
  maps_to_interest_id integer REFERENCES islamic_interest_categories(id),
  CONSTRAINT content_tags_mosque_id_tag_key_key UNIQUE (mosque_id, tag_key)
);

CREATE TABLE IF NOT EXISTS saved_content (
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS user_content_interactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  interaction_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_cart (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  product_price real,
  product_quantity bigint DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  content_id uuid REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  recommendation_score double precision,
  score_breakdown jsonb,
  was_shown boolean,
  was_clicked boolean,
  was_added boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  submission_id uuid NOT NULL REFERENCES business_ads_submissions(submission_id),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  pricing_model text,
  onboarding_amount numeric,
  recurring_amount numeric,
  onboarding_paid boolean DEFAULT false,
  status text DEFAULT 'pending'::text,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approved_business_ads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id uuid REFERENCES business_ads_submissions(submission_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quran_playlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  reciter uuid REFERENCES speaker_data(speaker_id),
  surah text,
  youtube_id text,
  video_type text DEFAULT 'Quran'::text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_playlist (
  playlist_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  playlist_name text,
  playlist_img text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Phase 4: FK to lectures, user_playlist, content_tags
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS liked_lectures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  lecture_id uuid NOT NULL REFERENCES lectures(lecture_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT liked_lectures_user_id_lecture_id_key UNIQUE (user_id, lecture_id)
);

CREATE TABLE IF NOT EXISTS content_tag_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  tag_id bigint NOT NULL REFERENCES content_tags(id),
  relevance_weight double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_playlist_lectures (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  playlist_id uuid NOT NULL REFERENCES user_playlist(playlist_id),
  lecture_id uuid NOT NULL REFERENCES lectures(lecture_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_playlist_lectures_playlist_id_lecture_id_key UNIQUE (playlist_id, lecture_id)
);
