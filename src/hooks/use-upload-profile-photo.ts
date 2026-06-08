import { useAuth } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useSupabase } from '@/src/hooks/use-supabase';

// Loaded lazily on first use so that a dev client missing the
// expo-image-picker native module doesn't crash the screens that
// transitively import this hook (e.g. the Profile tab).
type ImagePickerModule = typeof import('expo-image-picker');
async function loadImagePicker(): Promise<ImagePickerModule> {
  try {
    const mod = await import('expo-image-picker');
    // Metro's dynamic-import transform sometimes nests named exports under `default`.
    return ((mod as any).default ?? mod) as ImagePickerModule;
  } catch {
    throw new Error(
      "Photo picker isn't available in this build. Rebuild the dev client (npx expo run:ios) to include expo-image-picker.",
    );
  }
}

type Source = 'camera' | 'gallery';

/**
 * Picks an image (camera or library) and posts it to the `upload-profile-pic`
 * edge function, which uploads it to Bunny Edge Storage and updates
 * `profiles.profile_pic` with the public CDN URL. The function does the DB
 * write server-side using the service role, so this hook just consumes the
 * returned URL for cache invalidation.
 *
 * Previously this uploaded to Supabase Storage's `profile-pics` bucket; that
 * was migrated to Bunny on 2026-06-08 — see [SCAFFOLD] notes in the
 * upload-profile-pic edge function for the auth model.
 */
export function useUploadProfilePhoto() {
  const { userId } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const run = useCallback(
    async (source: Source) => {
      if (!userId) throw new Error('Not signed in.');

      const ImagePicker = await loadImagePicker();

      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error(
          source === 'camera'
            ? 'Camera permission was denied.'
            : 'Photo library permission was denied.',
        );
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

      if (result.canceled || !result.assets?.[0]) return null;
      const asset = result.assets[0];

      setIsUploading(true);
      try {
        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();

        const form = new FormData();
        form.append('file', {
          uri: asset.uri,
          name: `avatar.${ext}`,
          type: asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as unknown as Blob);

        const { data, error } = await supabase.functions.invoke<{
          url: string;
          error?: string;
        }>('upload-profile-pic', { body: form });
        if (error) throw new Error(error.message);
        if (!data?.url) throw new Error('Upload succeeded but no URL returned');

        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        return data.url;
      } finally {
        setIsUploading(false);
      }
    },
    [userId, supabase, queryClient],
  );

  const takePhoto = useCallback(() => run('camera'), [run]);
  const chooseFromGallery = useCallback(() => run('gallery'), [run]);

  return { takePhoto, chooseFromGallery, isUploading };
}
