import { useAuth } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useSupabase } from '@/src/hooks/use-supabase';

// Deferred so the missing native module doesn't crash the app at import time
// in dev clients that haven't been rebuilt with the expo-image-picker plugin.
type ImagePickerModule = typeof import('expo-image-picker');
async function loadImagePicker(): Promise<ImagePickerModule> {
  return await import('expo-image-picker');
}

const BUCKET = 'profile-pics';

type Source = 'camera' | 'gallery';

/**
 * Picks an image (camera or library), uploads it to the `profile-pics`
 * bucket under the user's folder, and writes the resulting public URL to
 * `profiles.profile_pic`. Cache-busts the URL so RN's Image cache doesn't
 * keep serving the previous avatar after a re-upload.
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

      // Read the local URI as bytes for the upload.
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();

      // Derive extension + content type. ImagePicker yields jpeg by default
      // when quality is set, but PNG sources stay PNG; respect what we got.
      const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
      const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `${userId}/avatar.${ext}`;

      setIsUploading(true);
      try {
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, arrayBuffer, { contentType, upsert: true });
        if (uploadErr) throw new Error(uploadErr.message);

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        // Cache-bust so the avatar refresh is visible immediately.
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

        const { error: dbErr } = await supabase
          .from('profiles')
          .upsert(
            { id: userId, profile_pic: publicUrl },
            { onConflict: 'id' },
          );
        if (dbErr) throw new Error(dbErr.message);

        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        return publicUrl;
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
