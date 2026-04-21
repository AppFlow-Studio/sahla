import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { env } from '@/src/lib/env';

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

type Status = 'idle' | 'loading' | 'success' | 'error';

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
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;
  const config = useMasjidConfig();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!isLoaded) return;

    const effectiveUserId =
      userId ??
      (__DEV__ && env.DEV_BYPASS_AUTH
        ? 'user_3Bg53r7ZnLPWAVVTLwYU7BKNOpM'
        : null);
    if (!effectiveUserId) return;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const { data, error: fnError } = await supabaseRef.current.functions.invoke<
        EdgeResponse
      >('recommend', {
        body: { user_id: effectiveUserId, mosque_slug: config.id },
      });

      if (cancelled) return;

      if (fnError) {
        if (__DEV__) console.error('[useRecommendation] invoke failed', fnError);
        setError(fnError.message);
        setStatus('error');
        return;
      }
      if (!data) {
        if (__DEV__) console.error('[useRecommendation] empty response');
        setError('Empty response from recommend function');
        setStatus('error');
        return;
      }

      const items: RecommendationItem[] = data.items
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

      setRecommendations(items);
      setError(null);
      setStatus('success');
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, config.id, refreshKey]);

  return { recommendations, status, error, refetch };
}

