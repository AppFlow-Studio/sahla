-- Drop the client-write RLS policies on the `business-ads` bucket added in
-- 20260603140000. They're now obsolete: the mobile app uploads flyers to Bunny
-- CDN (via the business-ad-flyer-upload edge function), not Supabase storage,
-- and the CRM uploads with the service-role client (bypasses RLS). The bucket
-- itself stays — the CRM still stores ad creatives there.

DROP POLICY IF EXISTS "business_ads_user_insert" ON storage.objects;
DROP POLICY IF EXISTS "business_ads_user_update" ON storage.objects;
