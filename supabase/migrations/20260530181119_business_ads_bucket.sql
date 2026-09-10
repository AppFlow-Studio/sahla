-- Create the public `business-ads` storage bucket for ad creative images
-- uploaded from the CRM Business Ads module. 16:9 enforcement is client-side
-- since storage can't introspect dimensions.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-ads',
  'business-ads',
  true,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
