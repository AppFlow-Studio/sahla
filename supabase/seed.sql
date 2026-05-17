-- Seed data for testing the recommendation engine end-to-end.
-- Idempotent: safe to re-run.
--
-- Target user:   user_3Bg53r7ZnLPWAVVTLwYU7BKNOpM (Clerk ID)
-- Target mosque: '12345' (id AND slug — useRecommendation() invokes the
--                edge function with mosque_slug = config.id, so the slug
--                must equal the value the client passes).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Mosque
-- ---------------------------------------------------------------------------
INSERT INTO mosques (id, name, slug, city, state, timezone, created_at, updated_at)
VALUES ('12345', 'Test Masjid', '12345', 'Dallas', 'TX', 'America/Chicago', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Profile (Clerk-synced)
-- ---------------------------------------------------------------------------
INSERT INTO profiles (id, first_name, last_name, profile_email, created_at)
VALUES ('user_3Bg53r7ZnLPWAVVTLwYU7BKNOpM', 'Ahmed', 'Test', 'ahmed+test@sahla.dev', now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Lookup: islamic interest categories
-- ---------------------------------------------------------------------------
INSERT INTO islamic_interest_categories (category_key, category_name, display_order) VALUES
  ('fiqh',       'Fiqh',       1),
  ('tafsir',     'Tafsir',     2),
  ('quran',      'Quran',      3),
  ('hadith',     'Hadith',     4),
  ('seerah',     'Seerah',     5)
ON CONFLICT (category_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Lookup: islamic goals
-- ---------------------------------------------------------------------------
INSERT INTO islamic_goals (goal_key, goal_name, display_order) VALUES
  ('learn_arabic',     'Learn Arabic',      1),
  ('memorize_quran',   'Memorize Quran',    2),
  ('improve_salah',    'Improve Salah',     3),
  ('study_seerah',     'Study Seerah',      4)
ON CONFLICT (goal_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Content items
-- Designed to exercise the filter rules: pass, gender-fail, kids,
-- fourteen-plus, capacity-fail, expired.
-- ---------------------------------------------------------------------------
INSERT INTO content_items
  (content_id, mosque_id, type, name, description, days, start_time, gender,
   is_kids, is_fourteen_plus, max_capacity, current_count, end_date, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '12345', 'class',
   'Fiqh Foundations', 'Weekly fiqh class for adults',
   ARRAY['Monday','Thursday'], '19:00', 'All',
   false, false, NULL, NULL, NULL, now()),

  ('22222222-2222-2222-2222-222222222222', '12345', 'class',
   'Tafsir Halaqa', 'Verse-by-verse tafsir',
   ARRAY['Wednesday'], '19:00', 'All',
   false, false, NULL, NULL, NULL, now() - interval '5 days'),

  ('33333333-3333-3333-3333-333333333333', '12345', 'class',
   'Sisters Quran Circle', 'Sisters-only Quran circle',
   ARRAY['Saturday'], '10:00', 'Female',
   false, false, NULL, NULL, NULL, now() - interval '10 days'),

  ('44444444-4444-4444-4444-444444444444', '12345', 'event',
   'Kids Arabic Camp', 'Arabic camp for ages 6-12',
   ARRAY['Saturday'], '10:00', 'All',
   true, false, NULL, NULL, NULL, now() - interval '2 days'),

  ('55555555-5555-5555-5555-555555555555', '12345', 'event',
   'Teen Halaqa', 'Halaqa for teens',
   ARRAY['Friday'], '18:00', 'All',
   false, true, NULL, NULL, NULL, now() - interval '3 days'),

  ('66666666-6666-6666-6666-666666666666', '12345', 'event',
   'Charity Drive (Full)', 'Capacity reached — should be filtered out',
   ARRAY['Sunday'], '14:00', 'All',
   false, false, 10, 10, NULL, now() - interval '1 day'),

  ('77777777-7777-7777-7777-777777777777', '12345', 'lecture',
   'Past Lecture', 'Already ended — should be filtered out',
   ARRAY['Tuesday'], '18:00', 'All',
   false, false, NULL, NULL, now() - interval '1 day', now() - interval '30 days')
ON CONFLICT (content_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Content tags (interests)
-- ---------------------------------------------------------------------------
INSERT INTO content_islamic_interests (content_id, interest_id)
SELECT c.cid, i.id FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, 'fiqh'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'tafsir'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'quran'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'quran'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'fiqh'),
    ('77777777-7777-7777-7777-777777777777'::uuid, 'tafsir')
  ) AS c(cid, key)
JOIN islamic_interest_categories i ON i.category_key = c.key
ON CONFLICT (content_id, interest_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Content tags (goals)
-- ---------------------------------------------------------------------------
INSERT INTO content_islamic_goals (content_id, goal_id)
SELECT c.cid, g.id FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, 'learn_arabic'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'learn_arabic'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'memorize_quran')
  ) AS c(cid, key)
JOIN islamic_goals g ON g.goal_key = c.key
ON CONFLICT (content_id, goal_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. User preferences (REQUIRED — engine early-exits if missing)
-- Adult male, 31, parent of one kid (age 8) and one teen (age 16) so we
-- exercise both is_kids and is_fourteen_plus parent paths.
-- ---------------------------------------------------------------------------
INSERT INTO user_preferences
  (user_id, mosque_id, gender, birth_year, has_children, children_ages,
   preferred_days, preferred_times, islamic_knowledge_level, is_revert)
VALUES
  ('user_3Bg53r7ZnLPWAVVTLwYU7BKNOpM', '12345',
   'Male', 1995, true, ARRAY[8, 16],
   ARRAY['Monday','Wednesday'], ARRAY['19:00'], 'intermediate', false)
ON CONFLICT (user_id, mosque_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. User interests (with weighted levels)
-- ---------------------------------------------------------------------------
INSERT INTO user_islamic_interests (user_id, mosque_id, interest_id, interest_level)
SELECT 'user_3Bg53r7ZnLPWAVVTLwYU7BKNOpM', '12345', i.id, v.lvl
FROM (VALUES ('fiqh', 5), ('tafsir', 3), ('quran', 2)) AS v(key, lvl)
JOIN islamic_interest_categories i ON i.category_key = v.key
ON CONFLICT (user_id, interest_id, mosque_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. User goals (with priorities)
-- ---------------------------------------------------------------------------
INSERT INTO user_islamic_goals (user_id, mosque_id, goal_id, priority)
SELECT 'user_3Bg53r7ZnLPWAVVTLwYU7BKNOpM', '12345', g.id, v.pri
FROM (VALUES ('learn_arabic', 4), ('memorize_quran', 2)) AS v(key, pri)
JOIN islamic_goals g ON g.goal_key = v.key
ON CONFLICT (user_id, goal_id, mosque_id) DO NOTHING;

COMMIT;
