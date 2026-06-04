-- F-RLS-01: Per-user RLS policies for regular app users
-- Author: Ahmad Hamoudeh
-- Ticket: https://www.notion.so/34a8280c1b1d816c9dd0c46c89ee7671
-- Applied to staging: 2026-04-25
--
-- Adds SELECT / INSERT / UPDATE / DELETE policies scoped by
-- requesting_mosque_id() and requesting_user_id() to every user-facing
-- table. Existing sahla_team policies are left untouched (platform admins
-- continue to see everything cross-mosque).
--
-- Pattern uses TO public to match the existing prayer_notification_settings
-- policies; the requesting_*_id() helpers return NULL for unauthenticated
-- requests, so anon users are naturally filtered out by the predicate.
--
-- community_partners and reels are listed in the ticket but do not exist
-- on the schema yet ("once it exists") and are skipped here.

-- =====================================================================
-- Bucket 1: Org-members read (mosque-scoped reads for content + ops data)
-- =====================================================================

DROP POLICY IF EXISTS "content_items_org_select" ON content_items;
CREATE POLICY "content_items_org_select" ON content_items
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "prayers_org_select" ON prayers;
CREATE POLICY "prayers_org_select" ON prayers
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "todays_prayers_org_select" ON todays_prayers;
CREATE POLICY "todays_prayers_org_select" ON todays_prayers
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "jummah_org_select" ON jummah;
CREATE POLICY "jummah_org_select" ON jummah
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "speaker_data_org_select" ON speaker_data;
CREATE POLICY "speaker_data_org_select" ON speaker_data
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "lectures_org_select" ON lectures;
CREATE POLICY "lectures_org_select" ON lectures
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

-- ramadan_quran_tracker: ticket lists this as a per-user table, but the
-- schema has no user_id column (only mosque_id). Treating it as mosque-
-- scoped read for now; per-user tracking would need a schema change first.
DROP POLICY IF EXISTS "ramadan_quran_tracker_org_select" ON ramadan_quran_tracker;
CREATE POLICY "ramadan_quran_tracker_org_select" ON ramadan_quran_tracker
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id());

-- =====================================================================
-- Bucket 2: Global lookups (islamic categories + goals)
-- These tables had RLS off; enable RLS and add an explicit public-read
-- policy that mirrors the mosques_public_read pattern. Functionally
-- equivalent to RLS-off but explicit and discoverable in pg_policy.
-- =====================================================================

ALTER TABLE islamic_interest_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "islamic_interest_categories_public_read" ON islamic_interest_categories;
CREATE POLICY "islamic_interest_categories_public_read" ON islamic_interest_categories
  FOR SELECT TO public
  USING (true);

ALTER TABLE islamic_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "islamic_goals_public_read" ON islamic_goals;
CREATE POLICY "islamic_goals_public_read" ON islamic_goals
  FOR SELECT TO public
  USING (true);

-- =====================================================================
-- Bucket 3: Own-row read/write, scoped to (user_id, mosque_id)
-- =====================================================================

-- Macro idea: same 4 policies per table. We unroll for clarity (and
-- because some tables may grow extra constraints later).

-- ---- user_preferences ----
DROP POLICY IF EXISTS "user_preferences_user_select" ON user_preferences;
CREATE POLICY "user_preferences_user_select" ON user_preferences
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_preferences_user_insert" ON user_preferences;
CREATE POLICY "user_preferences_user_insert" ON user_preferences
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_preferences_user_update" ON user_preferences;
CREATE POLICY "user_preferences_user_update" ON user_preferences
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_preferences_user_delete" ON user_preferences;
CREATE POLICY "user_preferences_user_delete" ON user_preferences
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_islamic_interests ----
DROP POLICY IF EXISTS "user_islamic_interests_user_select" ON user_islamic_interests;
CREATE POLICY "user_islamic_interests_user_select" ON user_islamic_interests
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_islamic_interests_user_insert" ON user_islamic_interests;
CREATE POLICY "user_islamic_interests_user_insert" ON user_islamic_interests
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_islamic_interests_user_update" ON user_islamic_interests;
CREATE POLICY "user_islamic_interests_user_update" ON user_islamic_interests
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_islamic_interests_user_delete" ON user_islamic_interests;
CREATE POLICY "user_islamic_interests_user_delete" ON user_islamic_interests
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_islamic_goals ----
DROP POLICY IF EXISTS "user_islamic_goals_user_select" ON user_islamic_goals;
CREATE POLICY "user_islamic_goals_user_select" ON user_islamic_goals
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_islamic_goals_user_insert" ON user_islamic_goals;
CREATE POLICY "user_islamic_goals_user_insert" ON user_islamic_goals
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_islamic_goals_user_update" ON user_islamic_goals;
CREATE POLICY "user_islamic_goals_user_update" ON user_islamic_goals
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_islamic_goals_user_delete" ON user_islamic_goals;
CREATE POLICY "user_islamic_goals_user_delete" ON user_islamic_goals
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_content_interactions ----
DROP POLICY IF EXISTS "user_content_interactions_user_select" ON user_content_interactions;
CREATE POLICY "user_content_interactions_user_select" ON user_content_interactions
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_content_interactions_user_insert" ON user_content_interactions;
CREATE POLICY "user_content_interactions_user_insert" ON user_content_interactions
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_content_interactions_user_update" ON user_content_interactions;
CREATE POLICY "user_content_interactions_user_update" ON user_content_interactions
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_content_interactions_user_delete" ON user_content_interactions;
CREATE POLICY "user_content_interactions_user_delete" ON user_content_interactions
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- liked_lectures ----
DROP POLICY IF EXISTS "liked_lectures_user_select" ON liked_lectures;
CREATE POLICY "liked_lectures_user_select" ON liked_lectures
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "liked_lectures_user_insert" ON liked_lectures;
CREATE POLICY "liked_lectures_user_insert" ON liked_lectures
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "liked_lectures_user_update" ON liked_lectures;
CREATE POLICY "liked_lectures_user_update" ON liked_lectures
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "liked_lectures_user_delete" ON liked_lectures;
CREATE POLICY "liked_lectures_user_delete" ON liked_lectures
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_bookmarked_ayahs ----
DROP POLICY IF EXISTS "user_bookmarked_ayahs_user_select" ON user_bookmarked_ayahs;
CREATE POLICY "user_bookmarked_ayahs_user_select" ON user_bookmarked_ayahs
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_bookmarked_ayahs_user_insert" ON user_bookmarked_ayahs;
CREATE POLICY "user_bookmarked_ayahs_user_insert" ON user_bookmarked_ayahs
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_bookmarked_ayahs_user_update" ON user_bookmarked_ayahs;
CREATE POLICY "user_bookmarked_ayahs_user_update" ON user_bookmarked_ayahs
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_bookmarked_ayahs_user_delete" ON user_bookmarked_ayahs;
CREATE POLICY "user_bookmarked_ayahs_user_delete" ON user_bookmarked_ayahs
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_liked_ayahs ----
DROP POLICY IF EXISTS "user_liked_ayahs_user_select" ON user_liked_ayahs;
CREATE POLICY "user_liked_ayahs_user_select" ON user_liked_ayahs
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_liked_ayahs_user_insert" ON user_liked_ayahs;
CREATE POLICY "user_liked_ayahs_user_insert" ON user_liked_ayahs
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_liked_ayahs_user_update" ON user_liked_ayahs;
CREATE POLICY "user_liked_ayahs_user_update" ON user_liked_ayahs
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_liked_ayahs_user_delete" ON user_liked_ayahs;
CREATE POLICY "user_liked_ayahs_user_delete" ON user_liked_ayahs
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_bookmarked_surahs ----
DROP POLICY IF EXISTS "user_bookmarked_surahs_user_select" ON user_bookmarked_surahs;
CREATE POLICY "user_bookmarked_surahs_user_select" ON user_bookmarked_surahs
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_bookmarked_surahs_user_insert" ON user_bookmarked_surahs;
CREATE POLICY "user_bookmarked_surahs_user_insert" ON user_bookmarked_surahs
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_bookmarked_surahs_user_update" ON user_bookmarked_surahs;
CREATE POLICY "user_bookmarked_surahs_user_update" ON user_bookmarked_surahs
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_bookmarked_surahs_user_delete" ON user_bookmarked_surahs;
CREATE POLICY "user_bookmarked_surahs_user_delete" ON user_bookmarked_surahs
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_liked_surahs ----
DROP POLICY IF EXISTS "user_liked_surahs_user_select" ON user_liked_surahs;
CREATE POLICY "user_liked_surahs_user_select" ON user_liked_surahs
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_liked_surahs_user_insert" ON user_liked_surahs;
CREATE POLICY "user_liked_surahs_user_insert" ON user_liked_surahs
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_liked_surahs_user_update" ON user_liked_surahs;
CREATE POLICY "user_liked_surahs_user_update" ON user_liked_surahs
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_liked_surahs_user_delete" ON user_liked_surahs;
CREATE POLICY "user_liked_surahs_user_delete" ON user_liked_surahs
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- ---- user_continue_read ----
DROP POLICY IF EXISTS "user_continue_read_user_select" ON user_continue_read;
CREATE POLICY "user_continue_read_user_select" ON user_continue_read
  FOR SELECT TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_continue_read_user_insert" ON user_continue_read;
CREATE POLICY "user_continue_read_user_insert" ON user_continue_read
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_continue_read_user_update" ON user_continue_read;
CREATE POLICY "user_continue_read_user_update" ON user_continue_read
  FOR UPDATE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id())
  WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

DROP POLICY IF EXISTS "user_continue_read_user_delete" ON user_continue_read;
CREATE POLICY "user_continue_read_user_delete" ON user_continue_read
  FOR DELETE TO public
  USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

-- =====================================================================
-- Bucket 4: Own-row, no mosque scope
--   profiles      → keyed on id (= Clerk user.id)
--   saved_content → keyed on user_id (table also has mosque_id, but the
--                   ticket spec scopes by user only)
-- =====================================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "profiles_user_select" ON profiles;
CREATE POLICY "profiles_user_select" ON profiles
  FOR SELECT TO public
  USING (id = requesting_user_id());

DROP POLICY IF EXISTS "profiles_user_insert" ON profiles;
CREATE POLICY "profiles_user_insert" ON profiles
  FOR INSERT TO public
  WITH CHECK (id = requesting_user_id());

DROP POLICY IF EXISTS "profiles_user_update" ON profiles;
CREATE POLICY "profiles_user_update" ON profiles
  FOR UPDATE TO public
  USING (id = requesting_user_id())
  WITH CHECK (id = requesting_user_id());

DROP POLICY IF EXISTS "profiles_user_delete" ON profiles;
CREATE POLICY "profiles_user_delete" ON profiles
  FOR DELETE TO public
  USING (id = requesting_user_id());

-- ---- saved_content ----
DROP POLICY IF EXISTS "saved_content_user_select" ON saved_content;
CREATE POLICY "saved_content_user_select" ON saved_content
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

DROP POLICY IF EXISTS "saved_content_user_insert" ON saved_content;
CREATE POLICY "saved_content_user_insert" ON saved_content
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "saved_content_user_update" ON saved_content;
CREATE POLICY "saved_content_user_update" ON saved_content
  FOR UPDATE TO public
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "saved_content_user_delete" ON saved_content;
CREATE POLICY "saved_content_user_delete" ON saved_content
  FOR DELETE TO public
  USING (user_id = requesting_user_id());
