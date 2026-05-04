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
      const { data, error } = await supabase
        .from('content_notification_settings')
        .select('notification_settings')
        .eq('user_id', userId!)
        .eq('content_id', contentId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return data.notification_settings ?? [];
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

      if (offsets.length === 0) {
        // No selections = revert to default. DELETE the settings row.
        // The user stays opted in (content_notifications row untouched);
        // NT-BE's scheduler will fall back to mosque default_reminder_min.
        const { error } = await supabase
          .from('content_notification_settings')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId);
        if (error) throw new Error(error.message);
        return null;
      }

      const { error } = await supabase
        .from('content_notification_settings')
        .upsert(
          {
            user_id: userId,
            content_id: contentId,
            mosque_id: mosqueId,
            notification_settings: offsets,
          },
          { onConflict: 'user_id,content_id' },
        );
      if (error) throw new Error(error.message);
      return offsets;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(
        ['content-notif-settings', userId, contentId],
        next,
      );
    },
  });
}
