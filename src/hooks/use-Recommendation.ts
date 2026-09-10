import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';

export type RecommendationItem = {
  content_id: string;
  recommendation_score: number;
  score_breakdown: Record<string, number> | null;
  name: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  start_date: string | null;
  start_time: string | null;
};

type EdgeResponse = {
  recomputed: boolean;
  count: number;
  items: {
    content_id: string;
    recommendation_score: number | null;
    score_breakdown: Record<string, number> | null;
    content_items: {
      name: string | null;
      description: string | null;
      image: string | null;
      type: string | null;
      start_date: string | null;
      start_time: string | null;
    } | null;
  }[];
};

export function useRecommendation() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const config = useMasjidConfig();

  console.log('[useRecommendation] gate:', { isLoaded, userId, configId: config.id, enabled: isLoaded && !!userId });

  const query = useQuery({
    queryKey: ['recommendations', userId, config.id],
    queryFn: async (): Promise<RecommendationItem[]> => {
      // `enabled` is not enough on its own: `refetch()` runs the query
      // regardless, and Discover's pull-to-refresh calls it. The edge function
      // 400s on a missing `user_id`, which surfaced to guests as a red
      // "Couldn't load recommendations" banner.
      if (!userId) return [];
      console.log('[useRecommendation] invoking recommend with:', { user_id: userId, mosque_slug: config.id });
      const { data, error } = await supabase.functions.invoke<EdgeResponse>('recommend', {
        body: { user_id: userId, mosque_slug: config.id, force: true },
      });
      console.log('[useRecommendation] response:', { hasData: !!data, count: data?.count, itemCount: data?.items?.length, error: error?.message });

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Empty response from recommend function');

      return data.items
        .filter((r) => r.content_items !== null)
        .map((r) => ({
          content_id: r.content_id,
          recommendation_score: r.recommendation_score ?? 0,
          score_breakdown: r.score_breakdown,
          name: r.content_items!.name,
          description: r.content_items!.description,
          image: r.content_items!.image,
          type: r.content_items!.type,
          start_date: r.content_items!.start_date,
          start_time: r.content_items!.start_time,
        }));
    },
    enabled: isLoaded && !!userId,
  });

  return {
    recommendations: query.data ?? [],
    status: !isLoaded
      ? ('idle' as const)
      : // Signed out there is nothing to recommend, and that is a settled
        // state rather than a pending one. Reporting 'loading' here would
        // strand Discover on its skeleton forever, because a disabled query
        // never leaves `isPending`.
        !userId
        ? ('success' as const)
        : query.isPending
          ? ('loading' as const)
          : query.isError
            ? ('error' as const)
            : ('success' as const),
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
