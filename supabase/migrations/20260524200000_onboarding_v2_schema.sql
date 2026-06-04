-- Onboarding V2: life-stage, language, data-source tracking, interest categories
-- Safe to re-run (all statements are idempotent).

-- 1. New columns on user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS life_stage      TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT,
  ADD COLUMN IF NOT EXISTS data_sources    JSONB DEFAULT '{}';

-- 2. Seed 12 program-oriented interest categories for the onboarding chips.
--    Uses ON CONFLICT to avoid duplicates if re-run.
INSERT INTO public.islamic_interest_categories (category_key, category_name, icon_name, display_order)
VALUES
  ('daily_prayers',        'Daily prayers',            'prayer-times',    100),
  ('jummah_khutbah',       'Jummah & khutbah',         'mosque',          101),
  ('quran_study_tafseer',  'Quran study & tafseer',    'book-open',       102),
  ('halaqas_study_circles','Halaqas & study circles',  'users',           103),
  ('kids_programs',        'Kids programs',            'child',           104),
  ('youth_programs',       'Youth programs',           'graduation-cap',  105),
  ('community_events',     'Community events',         'calendar',        106),
  ('sisters_programs',     'Sisters'' programs',       'heart',           107),
  ('volunteering_service', 'Volunteering & service',   'hand-holding',    108),
  ('new_muslim_support',   'New Muslim support',       'star',            109),
  ('marriage_family',      'Marriage & family',        'rings',           110),
  ('seniors_community',    'Seniors'' community',      'elderly',         111)
ON CONFLICT (category_key) DO NOTHING;
