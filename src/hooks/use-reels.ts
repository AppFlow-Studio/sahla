import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/** A reel row — what `reels-actions` `list_reels` returns. */
export type Reel = {
  reel_id: string;
  mosque_id: string;
  title: string | null;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_sec: number | null;
  view_count: number | null;
  like_count: number | null;
  is_published: boolean | null;
  display_order: number | null;
  arabic: string | null;
  urdu: string | null;
  translation: string | null;
  source: string | null;
};

/**
 * Fetches the Watch-feed reels for the current mosque via the `reels-actions`
 * edge function. Once the user is signed in, the feed is personalized through
 * `list_reels_scored`, which ranks reels by the viewer's interest weights.
 * Unauthenticated callers fall back to `list_reels` (unscored, display_order).
 */
export function useReels() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const { userId, isLoaded } = useAuth();

  const query = useQuery({
    // userId is part of the key so each user gets their own ranked cache cell.
    queryKey: ['reels', mosqueUuid, userId],
    queryFn: async (): Promise<Reel[]> => {
      const body = userId
        ? { action: 'list_reels_scored', user_id: userId, mosque_id: mosqueUuid }
        : { action: 'list_reels', mosque_id: mosqueUuid };
      const { data, error } = await supabase.functions.invoke<{
        reels: Reel[];
        error?: string;
      }>('reels-actions', { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.reels ?? [];
    },
    enabled: isLoaded && !!mosqueUuid,
  });

  return {
    reels: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
