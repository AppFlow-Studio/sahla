import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/** Content types an admin can create from the app. */
export const CONTENT_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'program', label: 'Program' },
  { value: 'class', label: 'Class' },
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]['value'];

/** Days of week, matching the `days` text[] stored on content_items. */
export const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Admin-facing content row — the fields the Programs & Events screen edits. */
export type AdminContentItem = {
  content_id: string;
  mosque_id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  type: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  days: string[] | null;
  speakers: string[] | null;
  is_weekly_program: boolean;
  recurrence_freq: string | null;
  recurrence_interval: number | null;
  recurrence_anchor: string | null;
  week_of_month: number | null;
  is_kids: boolean | null;
  is_fourteen_plus: boolean | null;
  is_young_professionals: boolean | null;
  created_at: string;
};

const SELECT =
  'content_id, mosque_id, name, description, image, type, start_date, end_date, start_time, days, speakers, is_weekly_program, recurrence_freq, recurrence_interval, recurrence_anchor, week_of_month, is_kids, is_fourteen_plus, is_young_professionals, created_at' as const;

/** All of this mosque's content items (newest first) for the admin list. */
export function useAdminContentItems() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['admin-content', mosqueUuid],
    queryFn: async (): Promise<AdminContentItem[]> => {
      const { data, error } = await supabase
        .from('content_items')
        .select(SELECT)
        .eq('mosque_id', mosqueUuid!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as AdminContentItem[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export type ContentItemInput = {
  name: string;
  type: ContentType;
  description?: string | null;
  image?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  days?: string[] | null;
  speakers?: string[] | null;
  is_weekly_program?: boolean;
  recurrence_freq?: string;
  recurrence_interval?: number;
  recurrence_anchor?: string | null;
  week_of_month?: number | null;
  is_kids?: boolean;
  is_fourteen_plus?: boolean;
  is_young_professionals?: boolean;
};

export function useCreateContentItem() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ContentItemInput) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { data, error } = await supabase
        .from('content_items')
        .insert({ mosque_id: mosqueUuid, ...input })
        .select('content_id')
        .single();
      if (error) throw new Error(error.message);
      return data as { content_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content', mosqueUuid] });
    },
  });
}

export type UpdateContentItemInput = { content_id: string } & Partial<ContentItemInput>;

export function useUpdateContentItem() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content_id, ...updates }: UpdateContentItemInput) => {
      const { error } = await supabase
        .from('content_items')
        .update(updates)
        .eq('content_id', content_id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content', mosqueUuid] });
    },
  });
}

export function useDeleteContentItem() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('content_id', contentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content', mosqueUuid] });
    },
  });
}

type ImagePickerModule = typeof import('expo-image-picker');
async function loadImagePicker(): Promise<ImagePickerModule> {
  return await import('expo-image-picker');
}

/**
 * Picks a cover image and posts it to the `upload-content-image` edge function,
 * which uploads it to Bunny Edge Storage under
 * `content/{mosque_id}/{key}/cover.{ext}` and returns the public CDN URL. `key`
 * is the content_id when editing, or a caller-supplied draft id when creating
 * before the row exists. The caller persists the returned URL onto
 * `content_items.image` via the create/update mutation.
 *
 * Previously this uploaded directly to the Supabase Storage `profile-pics`
 * bucket; that broke once the bucket's RLS was locked down to per-user folders
 * (the avatar→Bunny migration on 2026-06-08), so covers moved to Bunny too.
 */
export function useUploadContentImage() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = useCallback(
    async (key: string, source: 'camera' | 'gallery'): Promise<string | null> => {
      if (!mosqueUuid) throw new Error('No mosque configured');

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

      const opts = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9] as [number, number],
        quality: 0.7,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);

      if (result.canceled || !result.assets?.[0]) return null;
      const asset = result.assets[0];

      setIsUploading(true);
      try {
        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();

        const form = new FormData();
        form.append('file', {
          uri: asset.uri,
          name: `cover.${ext}`,
          type: asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as unknown as Blob);
        form.append('mosque_id', mosqueUuid);
        form.append('content_key', key);

        const { data, error } = await supabase.functions.invoke<{
          url: string;
          error?: string;
        }>('upload-content-image', { body: form });
        if (error) throw new Error(error.message);
        if (!data?.url) throw new Error('Upload succeeded but no URL returned');

        return data.url;
      } finally {
        setIsUploading(false);
      }
    },
    [supabase, mosqueUuid],
  );

  return { pickAndUpload, isUploading };
}
