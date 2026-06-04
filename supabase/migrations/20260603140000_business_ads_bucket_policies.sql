-- Client-side write policies for the public `business-ads` bucket so mosque
-- app users can upload an ad flyer from the advertise flow. Mirrors the
-- profile-pics policies: writes scoped to the caller's own {user_id}/ folder.
-- Reads are public (bucket is public). The CRM uploads server-side via the
-- service role and bypasses RLS, so it's unaffected.

DROP POLICY IF EXISTS "business_ads_user_insert" ON storage.objects;
CREATE POLICY "business_ads_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-ads'
    AND (storage.foldername(name))[1] = requesting_user_id()
  );

DROP POLICY IF EXISTS "business_ads_user_update" ON storage.objects;
CREATE POLICY "business_ads_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-ads'
    AND (storage.foldername(name))[1] = requesting_user_id()
  )
  WITH CHECK (
    bucket_id = 'business-ads'
    AND (storage.foldername(name))[1] = requesting_user_id()
  );
