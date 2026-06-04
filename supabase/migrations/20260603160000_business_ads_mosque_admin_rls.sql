-- Let mosque admins manage their own business-ad submissions + approvals from
-- the in-app admin panel. Scoped by requesting_mosque_uuid() (the caller's
-- Clerk org → mosque), mirroring iqamah_config_mosque_write. RLS is already
-- enabled on both tables; these policies are additive to the existing
-- sahla_team and user-own policies.

DROP POLICY IF EXISTS "business_ads_mosque_read" ON public.business_ads_submissions;
CREATE POLICY "business_ads_mosque_read" ON public.business_ads_submissions
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_uuid());

DROP POLICY IF EXISTS "business_ads_mosque_update" ON public.business_ads_submissions;
CREATE POLICY "business_ads_mosque_update" ON public.business_ads_submissions
  FOR UPDATE TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());

DROP POLICY IF EXISTS "approved_ads_mosque_all" ON public.approved_business_ads;
CREATE POLICY "approved_ads_mosque_all" ON public.approved_business_ads
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());
