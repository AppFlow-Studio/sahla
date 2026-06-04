import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Reel } from '@/src/hooks/use-reels';
import { useSupabase } from '@/src/hooks/use-supabase';

/** Report reasons surfaced in the Watch report sheet. `value` is persisted. */
export const REEL_REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'misinformation', label: 'False information' },
  { value: 'violence', label: 'Violence or dangerous acts' },
  { value: 'other', label: 'Something else' },
] as const;

export type ReelReportReason = (typeof REEL_REPORT_REASONS)[number]['value'];

/** Drop a reel from every ['reels', mosqueId] cache cell. Returns a snapshot. */
function removeReelFromFeeds(
  queryClient: ReturnType<typeof useQueryClient>,
  mosqueId: string,
  predicate: (reel: Reel) => boolean,
) {
  const previousFeeds = queryClient.getQueriesData<Reel[]>({
    queryKey: ['reels', mosqueId],
  });
  queryClient.setQueriesData<Reel[]>({ queryKey: ['reels', mosqueId] }, (old) =>
    old?.filter((r) => !predicate(r)),
  );
  return previousFeeds;
}

/**
 * Reports a reel as objectionable (Apple guideline 1.2). The server records the
 * report and also hides the reel from this user (writes a dismissed_reels row),
 * so we optimistically remove just that reel from the feed. onError restores it.
 */
export function useReportReel(reelId: string, mosqueId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: { reason: ReelReportReason; details?: string }) => {
      if (!userId || !mosqueId) {
        throw new Error('useReportReel: userId and mosqueId are required');
      }
      const { data, error } = await supabase.functions.invoke<{
        reported: boolean;
        error?: string;
      }>('reels-actions', {
        body: {
          action: 'report_reel',
          user_id: userId,
          mosque_id: mosqueId,
          reel_id: reelId,
          reason: input.reason,
          details: input.details,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.reported;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['reels', mosqueId] });
      const previousFeeds = removeReelFromFeeds(
        queryClient,
        mosqueId ?? '',
        (r) => r.reel_id === reelId,
      );
      return { previousFeeds };
    },
    onError: (_err, _vars, context) => {
      context?.previousFeeds.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', mosqueId] });
    },
  });
}

/**
 * Blocks a masjid's reels (Apple guideline 1.2). The server records the block
 * and the feed filters every reel from that mosque_id, so we optimistically
 * drop all of them. onError restores the snapshot.
 */
export function useBlockReelSource(mosqueId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!userId || !mosqueId) {
        throw new Error('useBlockReelSource: userId and mosqueId are required');
      }
      const { data, error } = await supabase.functions.invoke<{
        blocked: boolean;
        error?: string;
      }>('reels-actions', {
        body: { action: 'block_source', user_id: userId, mosque_id: mosqueId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.blocked;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['reels', mosqueId] });
      const previousFeeds = removeReelFromFeeds(
        queryClient,
        mosqueId ?? '',
        (r) => r.mosque_id === mosqueId,
      );
      return { previousFeeds };
    },
    onError: (_err, _vars, context) => {
      context?.previousFeeds.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', mosqueId] });
    },
  });
}
