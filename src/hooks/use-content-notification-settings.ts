import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';

export const NOTIF_OFFSET_OPTIONS = [
  'At start time',
  '5 min before',
  '30 min before',
  '1 hour before',
  '1 day before',
] as const;

export type NotifOffset = (typeof NOTIF_OFFSET_OPTIONS)[number];

/**
 * Reads the user's custom notification timings for a piece of content.
 * Returns `null` when no settings row exists — that's the canonical
 * "use the mosque-level default" state, NOT an empty array. The toggle
 * hook (CT-02 phase 2) deliberately does not pre-create this row.
 */
export function useContentNotifSettings(contentId: string) {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['content-notif-settings', userId, contentId],
    queryFn: async (): Promise<string[] | null> => {
      // Demo-day workaround: see ct02-actions edge function header.
      const { data, error } = await supabase.functions.invoke<{
        settings: string[] | null;
        error?: string;
      }>('ct02-actions', {
        body: { action: 'get_settings', user_id: userId, content_id: contentId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.settings ?? null;
    },
    enabled: isLoaded && !!userId && !!contentId,
  });
}

/**
 * Saves a custom notification-timing array. Empty array = revert to
 * default by deleting the row (the opt-in itself stays — that lives in
 * `content_notifications` and is owned by phase 2's hook).
 */
export function useSaveContentNotifSettings(
  contentId: string,
  mosqueId: string | null,
) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (offsets: string[]): Promise<string[] | null> => {
      if (!userId) throw new Error('Not signed in');
      if (!mosqueId) throw new Error('No mosque resolved');
      // Demo-day workaround: see ct02-actions edge function header.
      // Empty offsets array → edge function deletes the row (revert to default).
      const { data, error } = await supabase.functions.invoke<{
        settings: string[] | null;
        error?: string;
      }>('ct02-actions', {
        body: {
          action: 'set_timings',
          user_id: userId,
          mosque_id: mosqueId,
          content_id: contentId,
          offsets,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.settings ?? null;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(
        ['content-notif-settings', userId, contentId],
        next,
      );
    },
  });
}
