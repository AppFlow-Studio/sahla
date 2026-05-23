import { useCallback, useState } from 'react';

import { useSupabase } from '@/src/hooks/use-supabase';

type ImagePickerModule = typeof import('expo-image-picker');
async function loadImagePicker(): Promise<ImagePickerModule> {
  return await import('expo-image-picker');
}

const BUCKET = 'profile-pics';

type Source = 'camera' | 'gallery';

/**
 * Picks an image and uploads it to the `profile-pics` bucket under
 * `speakers/{speakerId}/avatar.{ext}`. Returns the public URL on success.
 */
export function useUploadSpeakerPhoto() {
  const supabase = useSupabase();
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = useCallback(
    async (speakerId: string, source: Source): Promise<string | null> => {
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

      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();

      const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
      const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `speakers/${speakerId}/avatar.${ext}`;

      setIsUploading(true);
      try {
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, arrayBuffer, { contentType, upsert: true });
        if (uploadErr) throw new Error(uploadErr.message);

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return `${data.publicUrl}?t=${Date.now()}`;
      } finally {
        setIsUploading(false);
      }
    },
    [supabase],
  );

  return { pickAndUpload, isUploading };
}
