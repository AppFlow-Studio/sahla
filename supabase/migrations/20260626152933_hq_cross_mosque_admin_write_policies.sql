-- APP-AUTH-01: Sahla HQ cross-mosque admin writes
-- ----------------------------------------------------------------------------
-- The in-app admin gate (is_mosque_admin) already honors is_sahla_team(), so an
-- HQ member signed in with their existing HQ account *sees* the admin panel on
-- any masjid app. But every mosque-admin WRITE policy was scoped only to
-- `mosque_id = requesting_mosque_uuid()` (and mosques_admin_update to
-- `requesting_mosque_id()`), which resolves the caller's Clerk org -> mosque.
-- An HQ member's org is Sahla HQ (or none), so that resolves to NULL and every
-- save was denied — they could open the panel but not edit anything.
--
-- Fix: add the same dual condition F2 uses for the CRM — allow the write if the
-- row belongs to the caller's own mosque OR the caller is Sahla HQ. No
-- cross-tenant bleed: the app/CRM write paths set mosque_id explicitly to the
-- active mosque, so is_sahla_team() in WITH CHECK only widens *who* may write,
-- not *which* mosque the row is attributed to.
--
-- Regular mosque admins are unaffected (their requesting_mosque_uuid() branch is
-- unchanged). Applied to staging (rpepxdgdiqeirdqsazuc) only.

-- mosques: HQ can update any mosque row; admins still only their own.
DROP POLICY IF EXISTS "mosques_admin_update" ON public.mosques;
CREATE POLICY "mosques_admin_update" ON public.mosques
  FOR UPDATE TO public
  USING (clerk_org_id = requesting_mosque_id() OR is_sahla_team())
  WITH CHECK (clerk_org_id = requesting_mosque_id() OR is_sahla_team());

-- jummah
DROP POLICY IF EXISTS "jummah_mosque_write" ON public.jummah;
CREATE POLICY "jummah_mosque_write" ON public.jummah
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- speaker_data (Sheikhs)
DROP POLICY IF EXISTS "speaker_data_mosque_write" ON public.speaker_data;
CREATE POLICY "speaker_data_mosque_write" ON public.speaker_data
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- prayers
DROP POLICY IF EXISTS "prayers_mosque_write" ON public.prayers;
CREATE POLICY "prayers_mosque_write" ON public.prayers
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- todays_prayers
DROP POLICY IF EXISTS "todays_prayers_mosque_write" ON public.todays_prayers;
CREATE POLICY "todays_prayers_mosque_write" ON public.todays_prayers
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- prayer_display_config
DROP POLICY IF EXISTS "prayer_display_config_mosque_write" ON public.prayer_display_config;
CREATE POLICY "prayer_display_config_mosque_write" ON public.prayer_display_config
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- content_items (Programs & Events)
DROP POLICY IF EXISTS "content_items_mosque_write" ON public.content_items;
CREATE POLICY "content_items_mosque_write" ON public.content_items
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- iqamah_config (Iqamah Times)
DROP POLICY IF EXISTS "iqamah_config_mosque_write" ON public.iqamah_config;
CREATE POLICY "iqamah_config_mosque_write" ON public.iqamah_config
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- business_ads_submissions (Business Ads — review/approve)
DROP POLICY IF EXISTS "business_ads_mosque_read" ON public.business_ads_submissions;
CREATE POLICY "business_ads_mosque_read" ON public.business_ads_submissions
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

DROP POLICY IF EXISTS "business_ads_mosque_update" ON public.business_ads_submissions;
CREATE POLICY "business_ads_mosque_update" ON public.business_ads_submissions
  FOR UPDATE TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());

-- approved_business_ads
DROP POLICY IF EXISTS "approved_ads_mosque_all" ON public.approved_business_ads;
CREATE POLICY "approved_ads_mosque_all" ON public.approved_business_ads
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() OR is_sahla_team())
  WITH CHECK (mosque_id = requesting_mosque_uuid() OR is_sahla_team());
