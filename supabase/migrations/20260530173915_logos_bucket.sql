-- Create the public `logos` storage bucket that the onboarding
-- App Branding panel uploads to (POST /api/mosques/[id]/logo).
-- Without this the panel surfaces "Failed to upload logo".

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152, -- 2 MB, matches the client-side guard in AppBrandingPanel
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;
