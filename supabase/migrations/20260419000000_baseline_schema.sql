-- =============================================================================
-- Sahla Baseline Schema Migration
-- Generated: 2026-04-19
-- Description: Complete idempotent baseline for the Sahla Supabase project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. Phase 1 Tables: No FK dependencies
-- ---------------------------------------------------------------------------

-- mosques (NO clerk_org_id column -- added in a later migration)
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT mosques_slug_key UNIQUE (slug)
);

-- profiles
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

-- islamic_goals
CREATE TABLE IF NOT EXISTS islamic_goals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  goal_key text NOT NULL,
  goal_name text NOT NULL,
  display_order integer,
  CONSTRAINT islamic_goals_goal_key_key UNIQUE (goal_key)
);

-- islamic_interest_categories
CREATE TABLE IF NOT EXISTS islamic_interest_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_key text NOT NULL,
  category_name text NOT NULL,
  icon_name text,
  display_order integer,
  parent_category_id bigint REFERENCES islamic_interest_categories(id),
  CONSTRAINT islamic_interest_categories_category_key_key UNIQUE (category_key)
);

-- onboarding_checklist_items
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

-- sahla_config
CREATE TABLE IF NOT EXISTS sahla_config (
  id text NOT NULL DEFAULT 'singleton'::text PRIMARY KEY,
  org_id text NOT NULL,
  org_name text DEFAULT 'Sahla HQ'::text,
  support_email text DEFAULT 'support@sahla.app'::text,
  platform_fee_pct numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- sahla_team
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

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cost numeric NOT NULL,
  frequency text NOT NULL,
  category text DEFAULT 'Platform'::text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Phase 2 Tables: FK to mosques / profiles
-- ---------------------------------------------------------------------------

-- speaker_data
CREATE TABLE IF NOT EXISTS speaker_data (
  speaker_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  speaker_name text,
  speaker_img text,
  speaker_creds text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- content_items
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

-- prayers
CREATE TABLE IF NOT EXISTS prayers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  "prayerData" jsonb,
  "iqamahData" jsonb
);

-- todays_prayers
CREATE TABLE IF NOT EXISTS todays_prayers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer_name text,
  athan_time time without time zone DEFAULT '08:00:00'::time,
  iqamah_time time without time zone
);

-- donations
CREATE TABLE IF NOT EXISTS donations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  "amountGiven" double precision,
  project_donated_to text[],
  date timestamptz NOT NULL DEFAULT now()
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  project_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  project_name text,
  project_goal double precision,
  thumbnail text,
  project_linked_to uuid REFERENCES projects(project_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- push_tokens
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

-- iqamah_config
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

-- display_categories
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

-- prayer_display_config
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

-- prayer_notification_schedule
CREATE TABLE IF NOT EXISTS prayer_notification_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer text,
  notification_time timestamptz,
  push_notification_token text,
  is_sent boolean DEFAULT false
);

-- prayer_notification_settings
CREATE TABLE IF NOT EXISTS prayer_notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  prayer text,
  notification_settings text[],
  CONSTRAINT prayer_notification_settings_user_id_mosque_id_prayer_key UNIQUE (user_id, mosque_id, prayer)
);

-- mosque_health_scores
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

-- mosque_notes
CREATE TABLE IF NOT EXISTS mosque_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  author_id text,
  author_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- mosque_notification_config
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

-- mosque_onboarding_steps
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

-- nudge_dismissals
CREATE TABLE IF NOT EXISTS nudge_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text REFERENCES mosques(id),
  nudge_type text NOT NULL,
  nudge_period text NOT NULL,
  dismissed_by text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nudge_dismissals_mosque_id_nudge_type_nudge_period_key UNIQUE (mosque_id, nudge_type, nudge_period)
);

-- pipeline_stages
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

-- ad_pricing_config
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

-- ramadan_quran_tracker
CREATE TABLE IF NOT EXISTS ramadan_quran_tracker (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah numeric DEFAULT 1,
  surah_name text,
  ayah_num numeric DEFAULT 1,
  num_of_ayahs numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- activity_log
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

-- capacity_alert_subscribers
CREATE TABLE IF NOT EXISTS capacity_alert_subscribers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  CONSTRAINT capacity_alert_subscribers_user_id_mosque_id_key UNIQUE (user_id, mosque_id)
);

-- taraweeh_lineup
CREATE TABLE IF NOT EXISTS taraweeh_lineup (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  date text NOT NULL,
  lineup jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT taraweeh_lineup_mosque_id_date_key UNIQUE (mosque_id, date)
);

-- user_preferences
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

-- user_bookmarked_ayahs
CREATE TABLE IF NOT EXISTS user_bookmarked_ayahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  ayah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_bookmarked_ayahs_user_mosque_surah_ayah_key UNIQUE (user_id, mosque_id, surah_number, ayah_number)
);

-- user_bookmarked_surahs
CREATE TABLE IF NOT EXISTS user_bookmarked_surahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_bookmarked_surahs_user_mosque_surah_key UNIQUE (user_id, mosque_id, surah_number)
);

-- user_liked_ayahs
CREATE TABLE IF NOT EXISTS user_liked_ayahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  ayah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_liked_ayahs_user_mosque_surah_ayah_key UNIQUE (user_id, mosque_id, surah_number, ayah_number)
);

-- user_liked_surahs
CREATE TABLE IF NOT EXISTS user_liked_surahs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  surah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_liked_surahs_user_mosque_surah_key UNIQUE (user_id, mosque_id, surah_number)
);

-- user_continue_read
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

-- user_islamic_goals
CREATE TABLE IF NOT EXISTS user_islamic_goals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  goal_id bigint NOT NULL REFERENCES islamic_goals(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  priority integer,
  CONSTRAINT user_islamic_goals_user_goal_mosque_key UNIQUE (user_id, goal_id, mosque_id)
);

-- user_islamic_interests
CREATE TABLE IF NOT EXISTS user_islamic_interests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  interest_id bigint NOT NULL REFERENCES islamic_interest_categories(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  interest_level integer,
  CONSTRAINT user_islamic_interests_user_interest_mosque_key UNIQUE (user_id, interest_id, mosque_id)
);

-- business_ads_submissions
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

-- jummah_notifications
CREATE TABLE IF NOT EXISTS jummah_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text REFERENCES profiles(id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  jummah text,
  notification_settings text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Phase 3 Tables: FK to content_items, speaker_data, etc.
-- ---------------------------------------------------------------------------

-- jummah
CREATE TABLE IF NOT EXISTS jummah (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  speaker uuid REFERENCES speaker_data(speaker_id),
  topic text,
  prayer_time text DEFAULT '12:15 PM'::text,
  capacity_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- lectures
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

-- content_islamic_goals
CREATE TABLE IF NOT EXISTS content_islamic_goals (
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  goal_id bigint NOT NULL REFERENCES islamic_goals(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (content_id, goal_id)
);

-- content_islamic_interests
CREATE TABLE IF NOT EXISTS content_islamic_interests (
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  interest_id bigint NOT NULL REFERENCES islamic_interest_categories(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (content_id, interest_id)
);

-- content_forms
CREATE TABLE IF NOT EXISTS content_forms (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  question text,
  question_type text,
  radio_button_prompts text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- content_notifications
CREATE TABLE IF NOT EXISTS content_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT content_notifications_user_id_content_id_key UNIQUE (user_id, content_id)
);

-- content_notification_settings
CREATE TABLE IF NOT EXISTS content_notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  notification_settings text[],
  CONSTRAINT content_notification_settings_user_id_content_id_key UNIQUE (user_id, content_id)
);

-- content_notification_schedule
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

-- content_tags
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

-- saved_content
CREATE TABLE IF NOT EXISTS saved_content (
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

-- user_content_interactions
CREATE TABLE IF NOT EXISTS user_content_interactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES profiles(id),
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  interaction_type text,
  created_at timestamptz DEFAULT now()
);

-- user_cart
CREATE TABLE IF NOT EXISTS user_cart (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  product_price real,
  product_quantity bigint DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- recommendation_log
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

-- ad_subscriptions
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

-- approved_business_ads
CREATE TABLE IF NOT EXISTS approved_business_ads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id uuid REFERENCES business_ads_submissions(submission_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- quran_playlist
CREATE TABLE IF NOT EXISTS quran_playlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  reciter uuid REFERENCES speaker_data(speaker_id),
  surah text,
  youtube_id text,
  video_type text DEFAULT 'Quran'::text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_playlist
CREATE TABLE IF NOT EXISTS user_playlist (
  playlist_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  mosque_id text NOT NULL REFERENCES mosques(id),
  playlist_name text,
  playlist_img text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. Phase 4 Tables: FK to lectures, user_playlist, content_tags
-- ---------------------------------------------------------------------------

-- liked_lectures
CREATE TABLE IF NOT EXISTS liked_lectures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  lecture_id uuid NOT NULL REFERENCES lectures(lecture_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT liked_lectures_user_id_lecture_id_key UNIQUE (user_id, lecture_id)
);

-- content_tag_assignments
CREATE TABLE IF NOT EXISTS content_tag_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES content_items(content_id),
  tag_id bigint NOT NULL REFERENCES content_tags(id),
  relevance_weight double precision,
  created_at timestamptz DEFAULT now()
);

-- user_playlist_lectures
CREATE TABLE IF NOT EXISTS user_playlist_lectures (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  playlist_id uuid NOT NULL REFERENCES user_playlist(playlist_id),
  lecture_id uuid NOT NULL REFERENCES lectures(lecture_id),
  mosque_id text NOT NULL REFERENCES mosques(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_playlist_lectures_playlist_id_lecture_id_key UNIQUE (playlist_id, lecture_id)
);

-- ---------------------------------------------------------------------------
-- 5. Functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.requesting_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.requesting_mosque_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.requesting_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_role',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_sahla_org()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM sahla_config
    WHERE id = 'singleton'
      AND org_id = NULLIF(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        ''
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_sahla_team()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT (
    EXISTS (
      SELECT 1 FROM sahla_team
      WHERE user_id = NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
      )
      AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM sahla_config
      WHERE id = 'singleton'
        AND org_id = NULLIF(
          current_setting('request.jwt.claims', true)::json->>'org_id',
          ''
        )
    )
  )
$function$;

CREATE OR REPLACE FUNCTION public.sahla_team_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM sahla_team
  WHERE user_id = (
    NULLIF(
      current_setting('request.jwt.claims', true)::json->>'sub',
      ''
    )
  )
  AND is_active = true
$function$;

CREATE OR REPLACE FUNCTION public.initialize_mosque_onboarding(p_mosque_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO mosque_onboarding_steps (mosque_id, checklist_item_id)
  SELECT p_mosque_id, id
  FROM onboarding_checklist_items
  ON CONFLICT (mosque_id, checklist_item_id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_content_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, entity_name, metadata)
  VALUES (
    NEW.mosque_id,
    'content_created',
    'content_item',
    NEW.content_id::text,
    NEW.name,
    jsonb_build_object('type', NEW.type, 'is_paid', NEW.is_paid)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_lecture_uploaded()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, entity_name)
  VALUES (
    NEW.mosque_id,
    'lecture_uploaded',
    'lecture',
    NEW.lecture_id::text,
    NEW.name
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_donation_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.mosque_id,
    'donation_received',
    'donation',
    NEW.id::text,
    jsonb_build_object('amount', NEW."amountGiven", 'projects', NEW.project_donated_to)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_ad_submitted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, actor_id, action, entity_type, entity_id, entity_name)
  VALUES (
    NEW.mosque_id,
    NEW.user_id,
    'ad_submitted',
    'business_ad',
    NEW.submission_id::text,
    NEW.business_name
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_mosque_launched()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.launched_at IS NULL AND NEW.launched_at IS NOT NULL THEN
    INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, entity_name)
    VALUES (
      NEW.id,
      'mosque_went_live',
      'mosque',
      NEW.id,
      NEW.name
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_pipeline_stage_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.mosque_id,
      'pipeline_stage_changed',
      'pipeline_stage',
      NEW.id::text,
      jsonb_build_object('from', OLD.stage, 'to', NEW.stage)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 6. Triggers (DROP IF EXISTS + CREATE for idempotency)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS mosques_updated_at ON mosques;
CREATE TRIGGER mosques_updated_at
  BEFORE UPDATE ON mosques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_log_mosque_launched ON mosques;
CREATE TRIGGER trg_log_mosque_launched
  AFTER UPDATE ON mosques
  FOR EACH ROW EXECUTE FUNCTION log_mosque_launched();

DROP TRIGGER IF EXISTS trg_log_content_created ON content_items;
CREATE TRIGGER trg_log_content_created
  AFTER INSERT ON content_items
  FOR EACH ROW EXECUTE FUNCTION log_content_created();

DROP TRIGGER IF EXISTS trg_log_lecture_uploaded ON lectures;
CREATE TRIGGER trg_log_lecture_uploaded
  AFTER INSERT ON lectures
  FOR EACH ROW EXECUTE FUNCTION log_lecture_uploaded();

DROP TRIGGER IF EXISTS trg_log_donation_received ON donations;
CREATE TRIGGER trg_log_donation_received
  AFTER INSERT ON donations
  FOR EACH ROW EXECUTE FUNCTION log_donation_received();

DROP TRIGGER IF EXISTS trg_log_ad_submitted ON business_ads_submissions;
CREATE TRIGGER trg_log_ad_submitted
  AFTER INSERT ON business_ads_submissions
  FOR EACH ROW EXECUTE FUNCTION log_ad_submitted();

DROP TRIGGER IF EXISTS trg_log_pipeline_stage_changed ON pipeline_stages;
CREATE TRIGGER trg_log_pipeline_stage_changed
  AFTER UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION log_pipeline_stage_changed();

DROP TRIGGER IF EXISTS pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS iqamah_config_updated_at ON iqamah_config;
CREATE TRIGGER iqamah_config_updated_at
  BEFORE UPDATE ON iqamah_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ad_pricing_config_updated_at ON ad_pricing_config;
CREATE TRIGGER ad_pricing_config_updated_at
  BEFORE UPDATE ON ad_pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ad_subscriptions_updated_at ON ad_subscriptions;
CREATE TRIGGER ad_subscriptions_updated_at
  BEFORE UPDATE ON ad_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS mos_updated_at ON mosque_onboarding_steps;
CREATE TRIGGER mos_updated_at
  BEFORE UPDATE ON mosque_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sahla_config_updated_at ON sahla_config;
CREATE TRIGGER sahla_config_updated_at
  BEFORE UPDATE ON sahla_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sahla_team_updated_at ON sahla_team;
CREATE TRIGGER sahla_team_updated_at
  BEFORE UPDATE ON sahla_team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS taraweeh_lineup_updated_at ON taraweeh_lineup;
CREATE TRIGGER taraweeh_lineup_updated_at
  BEFORE UPDATE ON taraweeh_lineup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Row Level Security — Enable RLS on ALL tables with policies
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 7a. Special policies: activity_log
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT TO public
  WITH CHECK (is_sahla_team());

DROP POLICY IF EXISTS "activity_log_mosque_select" ON activity_log;
CREATE POLICY "activity_log_mosque_select" ON activity_log
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "activity_log_sahla_select" ON activity_log;
CREATE POLICY "activity_log_sahla_select" ON activity_log
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7b. Special policies: mosque_health_scores
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "mhs_insert" ON mosque_health_scores;
CREATE POLICY "mhs_insert" ON mosque_health_scores
  FOR INSERT TO public
  WITH CHECK (is_sahla_team());

DROP POLICY IF EXISTS "mhs_select" ON mosque_health_scores;
CREATE POLICY "mhs_select" ON mosque_health_scores
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7c. Special policies: mosque_onboarding_steps
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "mos_mosque_select" ON mosque_onboarding_steps;
CREATE POLICY "mos_mosque_select" ON mosque_onboarding_steps
  FOR SELECT TO public
  USING ((mosque_id = requesting_mosque_id()) OR is_sahla_team());

DROP POLICY IF EXISTS "mos_mosque_update" ON mosque_onboarding_steps;
CREATE POLICY "mos_mosque_update" ON mosque_onboarding_steps
  FOR UPDATE TO public
  USING ((mosque_id = requesting_mosque_id()) OR is_sahla_team());

DROP POLICY IF EXISTS "mos_sahla_delete" ON mosque_onboarding_steps;
CREATE POLICY "mos_sahla_delete" ON mosque_onboarding_steps
  FOR DELETE TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "mos_sahla_insert" ON mosque_onboarding_steps;
CREATE POLICY "mos_sahla_insert" ON mosque_onboarding_steps
  FOR INSERT TO public
  WITH CHECK (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7d. Special policies: nudge_dismissals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "nd_insert" ON nudge_dismissals;
CREATE POLICY "nd_insert" ON nudge_dismissals
  FOR INSERT TO public
  WITH CHECK (is_sahla_team());

DROP POLICY IF EXISTS "nd_select" ON nudge_dismissals;
CREATE POLICY "nd_select" ON nudge_dismissals
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7e. Special policies: onboarding_checklist_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "oci_manage" ON onboarding_checklist_items;
CREATE POLICY "oci_manage" ON onboarding_checklist_items
  FOR ALL TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "oci_select" ON onboarding_checklist_items;
CREATE POLICY "oci_select" ON onboarding_checklist_items
  FOR SELECT TO public
  USING (true);

-- ---------------------------------------------------------------------------
-- 7f. Special policies: sahla_config
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sahla_config_manage" ON sahla_config;
CREATE POLICY "sahla_config_manage" ON sahla_config
  FOR ALL TO public
  USING (sahla_team_role() = 'super_admin'::text);

DROP POLICY IF EXISTS "sahla_config_select" ON sahla_config;
CREATE POLICY "sahla_config_select" ON sahla_config
  FOR SELECT TO public
  USING (true);

-- ---------------------------------------------------------------------------
-- 7g. Special policies: sahla_team
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sahla_team_manage" ON sahla_team;
CREATE POLICY "sahla_team_manage" ON sahla_team
  FOR ALL TO public
  USING (sahla_team_role() = 'super_admin'::text);

DROP POLICY IF EXISTS "sahla_team_select" ON sahla_team;
CREATE POLICY "sahla_team_select" ON sahla_team
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7h. expenses — only sahla_write
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "expenses_sahla_write" ON expenses;
CREATE POLICY "expenses_sahla_write" ON expenses
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- ---------------------------------------------------------------------------
-- 7i. mosques — only sahla_write (no sahla_select)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "mosques_sahla_write" ON mosques;
CREATE POLICY "mosques_sahla_write" ON mosques
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- ---------------------------------------------------------------------------
-- 7j. jummah_notifications — only sahla_select
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "jummah_notifications_sahla_select" ON jummah_notifications;
CREATE POLICY "jummah_notifications_sahla_select" ON jummah_notifications
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7k. content_notification_settings — only sahla_select
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "content_notification_settings_sahla_select" ON content_notification_settings;
CREATE POLICY "content_notification_settings_sahla_select" ON content_notification_settings
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7l. content_notifications — only sahla_select
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "content_notifications_sahla_select" ON content_notifications;
CREATE POLICY "content_notifications_sahla_select" ON content_notifications
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7m. Tables with ONLY sahla_select (no write policy)
-- ---------------------------------------------------------------------------

-- capacity_alert_subscribers
DROP POLICY IF EXISTS "capacity_alert_subscribers_sahla_select" ON capacity_alert_subscribers;
CREATE POLICY "capacity_alert_subscribers_sahla_select" ON capacity_alert_subscribers
  FOR SELECT TO public
  USING (is_sahla_team());

-- content_islamic_goals
DROP POLICY IF EXISTS "content_islamic_goals_sahla_select" ON content_islamic_goals;
CREATE POLICY "content_islamic_goals_sahla_select" ON content_islamic_goals
  FOR SELECT TO public
  USING (is_sahla_team());

-- content_islamic_interests
DROP POLICY IF EXISTS "content_islamic_interests_sahla_select" ON content_islamic_interests;
CREATE POLICY "content_islamic_interests_sahla_select" ON content_islamic_interests
  FOR SELECT TO public
  USING (is_sahla_team());

-- liked_lectures
DROP POLICY IF EXISTS "liked_lectures_sahla_select" ON liked_lectures;
CREATE POLICY "liked_lectures_sahla_select" ON liked_lectures
  FOR SELECT TO public
  USING (is_sahla_team());

-- prayer_notification_settings
DROP POLICY IF EXISTS "prayer_notification_settings_sahla_select" ON prayer_notification_settings;
CREATE POLICY "prayer_notification_settings_sahla_select" ON prayer_notification_settings
  FOR SELECT TO public
  USING (is_sahla_team());

-- recommendation_log
DROP POLICY IF EXISTS "recommendation_log_sahla_select" ON recommendation_log;
CREATE POLICY "recommendation_log_sahla_select" ON recommendation_log
  FOR SELECT TO public
  USING (is_sahla_team());

-- saved_content
DROP POLICY IF EXISTS "saved_content_sahla_select" ON saved_content;
CREATE POLICY "saved_content_sahla_select" ON saved_content
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_bookmarked_ayahs
DROP POLICY IF EXISTS "user_bookmarked_ayahs_sahla_select" ON user_bookmarked_ayahs;
CREATE POLICY "user_bookmarked_ayahs_sahla_select" ON user_bookmarked_ayahs
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_bookmarked_surahs
DROP POLICY IF EXISTS "user_bookmarked_surahs_sahla_select" ON user_bookmarked_surahs;
CREATE POLICY "user_bookmarked_surahs_sahla_select" ON user_bookmarked_surahs
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_cart
DROP POLICY IF EXISTS "user_cart_sahla_select" ON user_cart;
CREATE POLICY "user_cart_sahla_select" ON user_cart
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_content_interactions
DROP POLICY IF EXISTS "user_content_interactions_sahla_select" ON user_content_interactions;
CREATE POLICY "user_content_interactions_sahla_select" ON user_content_interactions
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_continue_read
DROP POLICY IF EXISTS "user_continue_read_sahla_select" ON user_continue_read;
CREATE POLICY "user_continue_read_sahla_select" ON user_continue_read
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_islamic_goals
DROP POLICY IF EXISTS "user_islamic_goals_sahla_select" ON user_islamic_goals;
CREATE POLICY "user_islamic_goals_sahla_select" ON user_islamic_goals
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_islamic_interests
DROP POLICY IF EXISTS "user_islamic_interests_sahla_select" ON user_islamic_interests;
CREATE POLICY "user_islamic_interests_sahla_select" ON user_islamic_interests
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_liked_ayahs
DROP POLICY IF EXISTS "user_liked_ayahs_sahla_select" ON user_liked_ayahs;
CREATE POLICY "user_liked_ayahs_sahla_select" ON user_liked_ayahs
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_liked_surahs
DROP POLICY IF EXISTS "user_liked_surahs_sahla_select" ON user_liked_surahs;
CREATE POLICY "user_liked_surahs_sahla_select" ON user_liked_surahs
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_playlist
DROP POLICY IF EXISTS "user_playlist_sahla_select" ON user_playlist;
CREATE POLICY "user_playlist_sahla_select" ON user_playlist
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_playlist_lectures
DROP POLICY IF EXISTS "user_playlist_lectures_sahla_select" ON user_playlist_lectures;
CREATE POLICY "user_playlist_lectures_sahla_select" ON user_playlist_lectures
  FOR SELECT TO public
  USING (is_sahla_team());

-- user_preferences
DROP POLICY IF EXISTS "user_preferences_sahla_select" ON user_preferences;
CREATE POLICY "user_preferences_sahla_select" ON user_preferences
  FOR SELECT TO public
  USING (is_sahla_team());

-- profiles
DROP POLICY IF EXISTS "profiles_sahla_select" ON profiles;
CREATE POLICY "profiles_sahla_select" ON profiles
  FOR SELECT TO public
  USING (is_sahla_team());

-- ---------------------------------------------------------------------------
-- 7n. Tables with standard sahla_select + sahla_write
-- ---------------------------------------------------------------------------

-- ad_pricing_config
DROP POLICY IF EXISTS "ad_pricing_config_sahla_select" ON ad_pricing_config;
CREATE POLICY "ad_pricing_config_sahla_select" ON ad_pricing_config
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "ad_pricing_config_sahla_write" ON ad_pricing_config;
CREATE POLICY "ad_pricing_config_sahla_write" ON ad_pricing_config
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- ad_subscriptions
DROP POLICY IF EXISTS "ad_subscriptions_sahla_select" ON ad_subscriptions;
CREATE POLICY "ad_subscriptions_sahla_select" ON ad_subscriptions
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "ad_subscriptions_sahla_write" ON ad_subscriptions;
CREATE POLICY "ad_subscriptions_sahla_write" ON ad_subscriptions
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- approved_business_ads
DROP POLICY IF EXISTS "approved_business_ads_sahla_select" ON approved_business_ads;
CREATE POLICY "approved_business_ads_sahla_select" ON approved_business_ads
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "approved_business_ads_sahla_write" ON approved_business_ads;
CREATE POLICY "approved_business_ads_sahla_write" ON approved_business_ads
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- business_ads_submissions
DROP POLICY IF EXISTS "business_ads_submissions_sahla_select" ON business_ads_submissions;
CREATE POLICY "business_ads_submissions_sahla_select" ON business_ads_submissions
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "business_ads_submissions_sahla_write" ON business_ads_submissions;
CREATE POLICY "business_ads_submissions_sahla_write" ON business_ads_submissions
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- content_forms
DROP POLICY IF EXISTS "content_forms_sahla_select" ON content_forms;
CREATE POLICY "content_forms_sahla_select" ON content_forms
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "content_forms_sahla_write" ON content_forms;
CREATE POLICY "content_forms_sahla_write" ON content_forms
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- content_items
DROP POLICY IF EXISTS "content_items_sahla_select" ON content_items;
CREATE POLICY "content_items_sahla_select" ON content_items
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "content_items_sahla_write" ON content_items;
CREATE POLICY "content_items_sahla_write" ON content_items
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- content_notification_schedule
DROP POLICY IF EXISTS "content_notification_schedule_sahla_select" ON content_notification_schedule;
CREATE POLICY "content_notification_schedule_sahla_select" ON content_notification_schedule
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "content_notification_schedule_sahla_write" ON content_notification_schedule;
CREATE POLICY "content_notification_schedule_sahla_write" ON content_notification_schedule
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- content_tag_assignments
DROP POLICY IF EXISTS "content_tag_assignments_sahla_select" ON content_tag_assignments;
CREATE POLICY "content_tag_assignments_sahla_select" ON content_tag_assignments
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "content_tag_assignments_sahla_write" ON content_tag_assignments;
CREATE POLICY "content_tag_assignments_sahla_write" ON content_tag_assignments
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- content_tags
DROP POLICY IF EXISTS "content_tags_sahla_select" ON content_tags;
CREATE POLICY "content_tags_sahla_select" ON content_tags
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "content_tags_sahla_write" ON content_tags;
CREATE POLICY "content_tags_sahla_write" ON content_tags
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- display_categories
DROP POLICY IF EXISTS "display_categories_sahla_select" ON display_categories;
CREATE POLICY "display_categories_sahla_select" ON display_categories
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "display_categories_sahla_write" ON display_categories;
CREATE POLICY "display_categories_sahla_write" ON display_categories
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- donations
DROP POLICY IF EXISTS "donations_sahla_select" ON donations;
CREATE POLICY "donations_sahla_select" ON donations
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "donations_sahla_write" ON donations;
CREATE POLICY "donations_sahla_write" ON donations
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- iqamah_config
DROP POLICY IF EXISTS "iqamah_config_sahla_select" ON iqamah_config;
CREATE POLICY "iqamah_config_sahla_select" ON iqamah_config
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "iqamah_config_sahla_write" ON iqamah_config;
CREATE POLICY "iqamah_config_sahla_write" ON iqamah_config
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- jummah
DROP POLICY IF EXISTS "jummah_sahla_select" ON jummah;
CREATE POLICY "jummah_sahla_select" ON jummah
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "jummah_sahla_write" ON jummah;
CREATE POLICY "jummah_sahla_write" ON jummah
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- lectures
DROP POLICY IF EXISTS "lectures_sahla_select" ON lectures;
CREATE POLICY "lectures_sahla_select" ON lectures
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "lectures_sahla_write" ON lectures;
CREATE POLICY "lectures_sahla_write" ON lectures
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- mosque_notes
DROP POLICY IF EXISTS "mosque_notes_sahla_select" ON mosque_notes;
CREATE POLICY "mosque_notes_sahla_select" ON mosque_notes
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "mosque_notes_sahla_write" ON mosque_notes;
CREATE POLICY "mosque_notes_sahla_write" ON mosque_notes
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- mosque_notification_config
DROP POLICY IF EXISTS "mosque_notification_config_sahla_select" ON mosque_notification_config;
CREATE POLICY "mosque_notification_config_sahla_select" ON mosque_notification_config
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "mosque_notification_config_sahla_write" ON mosque_notification_config;
CREATE POLICY "mosque_notification_config_sahla_write" ON mosque_notification_config
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- pipeline_stages
DROP POLICY IF EXISTS "pipeline_stages_sahla_select" ON pipeline_stages;
CREATE POLICY "pipeline_stages_sahla_select" ON pipeline_stages
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "pipeline_stages_sahla_write" ON pipeline_stages;
CREATE POLICY "pipeline_stages_sahla_write" ON pipeline_stages
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- prayer_display_config
DROP POLICY IF EXISTS "prayer_display_config_sahla_select" ON prayer_display_config;
CREATE POLICY "prayer_display_config_sahla_select" ON prayer_display_config
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "prayer_display_config_sahla_write" ON prayer_display_config;
CREATE POLICY "prayer_display_config_sahla_write" ON prayer_display_config
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- prayer_notification_schedule
DROP POLICY IF EXISTS "prayer_notification_schedule_sahla_select" ON prayer_notification_schedule;
CREATE POLICY "prayer_notification_schedule_sahla_select" ON prayer_notification_schedule
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "prayer_notification_schedule_sahla_write" ON prayer_notification_schedule;
CREATE POLICY "prayer_notification_schedule_sahla_write" ON prayer_notification_schedule
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- prayers
DROP POLICY IF EXISTS "prayers_sahla_select" ON prayers;
CREATE POLICY "prayers_sahla_select" ON prayers
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "prayers_sahla_write" ON prayers;
CREATE POLICY "prayers_sahla_write" ON prayers
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- projects
DROP POLICY IF EXISTS "projects_sahla_select" ON projects;
CREATE POLICY "projects_sahla_select" ON projects
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "projects_sahla_write" ON projects;
CREATE POLICY "projects_sahla_write" ON projects
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- push_tokens
DROP POLICY IF EXISTS "push_tokens_sahla_select" ON push_tokens;
CREATE POLICY "push_tokens_sahla_select" ON push_tokens
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "push_tokens_sahla_write" ON push_tokens;
CREATE POLICY "push_tokens_sahla_write" ON push_tokens
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- quran_playlist
DROP POLICY IF EXISTS "quran_playlist_sahla_select" ON quran_playlist;
CREATE POLICY "quran_playlist_sahla_select" ON quran_playlist
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "quran_playlist_sahla_write" ON quran_playlist;
CREATE POLICY "quran_playlist_sahla_write" ON quran_playlist
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- ramadan_quran_tracker
DROP POLICY IF EXISTS "ramadan_quran_tracker_sahla_select" ON ramadan_quran_tracker;
CREATE POLICY "ramadan_quran_tracker_sahla_select" ON ramadan_quran_tracker
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "ramadan_quran_tracker_sahla_write" ON ramadan_quran_tracker;
CREATE POLICY "ramadan_quran_tracker_sahla_write" ON ramadan_quran_tracker
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- speaker_data
DROP POLICY IF EXISTS "speaker_data_sahla_select" ON speaker_data;
CREATE POLICY "speaker_data_sahla_select" ON speaker_data
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "speaker_data_sahla_write" ON speaker_data;
CREATE POLICY "speaker_data_sahla_write" ON speaker_data
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- taraweeh_lineup
DROP POLICY IF EXISTS "taraweeh_lineup_sahla_select" ON taraweeh_lineup;
CREATE POLICY "taraweeh_lineup_sahla_select" ON taraweeh_lineup
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "taraweeh_lineup_sahla_write" ON taraweeh_lineup;
CREATE POLICY "taraweeh_lineup_sahla_write" ON taraweeh_lineup
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- todays_prayers
DROP POLICY IF EXISTS "todays_prayers_sahla_select" ON todays_prayers;
CREATE POLICY "todays_prayers_sahla_select" ON todays_prayers
  FOR SELECT TO public
  USING (is_sahla_team());

DROP POLICY IF EXISTS "todays_prayers_sahla_write" ON todays_prayers;
CREATE POLICY "todays_prayers_sahla_write" ON todays_prayers
  FOR ALL TO public
  USING (is_sahla_team() AND sahla_team_role() = ANY(ARRAY['super_admin'::text, 'admin'::text]));

-- ---------------------------------------------------------------------------
-- 8. Indexes (non-PK, non-unique-constraint)
-- ---------------------------------------------------------------------------

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

-- =============================================================================
-- End of baseline migration
-- =============================================================================
