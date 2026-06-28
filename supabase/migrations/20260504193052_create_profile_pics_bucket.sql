-- Public bucket for user avatars. Path scheme: {user_id}/avatar.{ext}
-- Public read so React Native Image can load via public URL; writes are
-- scoped to the user's own folder via storage RLS.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pics',
  'profile-pics',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Per-user write policies: the first path segment must equal the caller's user id.
CREATE POLICY "profile_pics_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pics'
    AND (storage.foldername(name))[1] = requesting_user_id()
  );

CREATE POLICY "profile_pics_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-pics'
    AND (storage.foldername(name))[1] = requesting_user_id()
  )
  WITH CHECK (
    bucket_id = 'profile-pics'
    AND (storage.foldername(name))[1] = requesting_user_id()
  );

CREATE POLICY "profile_pics_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-pics'
    AND (storage.foldername(name))[1] = requesting_user_id()
  );
