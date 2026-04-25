import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';

/**
 * Reads whether the current user is opted into push reminders for a piece
 * of content. Mirrors the saved-content read pattern.
 */
export function useIsNotifOptedIn(contentId: string) {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['content-notif-opt-in', userId, contentId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('content_notifications')
        .select('content_id')
        .eq('user_id', userId!)
        .eq('content_id', contentId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return !!data;
    },
    enabled: isLoaded && !!userId && !!contentId,
  });
}

/**
 * Toggles the bell on/off for a piece of content. INSERT/DELETE on
 * `content_notifications`. Does NOT pre-create a
 * `content_notification_settings` row — leaving it absent lets NT-BE's
 * scheduler fall back to the mosque-level `default_reminder_min`, which
 * makes "opt in with default timing" the zero-config path.
 *
 * Fires a fire-and-forget `user_content_interactions` row
 * (`'notification_opt_in'` / `'notification_opt_off'`).
 */
export function useToggleContentNotif(
  contentId: string,
  mosqueId: string | null,
) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (currentlyOptedIn: boolean): Promise<boolean> => {
      if (!userId) throw new Error('Not signed in');
      if (!mosqueId) throw new Error('No mosque resolved');

      if (currentlyOptedIn) {
        const { error } = await supabase
          .from('content_notifications')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('content_notifications')
          .insert({ user_id: userId, content_id: contentId, mosque_id: mosqueId });
        if (error) throw new Error(error.message);
      }

      void supabase.from('user_content_interactions').insert({
        user_id: userId,
        content_id: contentId,
        mosque_id: mosqueId,
        interaction_type: currentlyOptedIn ? 'notification_opt_off' : 'notification_opt_in',
      });

      return !currentlyOptedIn;
    },
    onMutate: async (currentlyOptedIn) => {
      await queryClient.cancelQueries({
        queryKey: ['content-notif-opt-in', userId, contentId],
      });
      const previous = queryClient.getQueryData<boolean>([
        'content-notif-opt-in',
        userId,
        contentId,
      ]);
      queryClient.setQueryData<boolean>(
        ['content-notif-opt-in', userId, contentId],
        !currentlyOptedIn,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context && typeof context.previous === 'boolean') {
        queryClient.setQueryData(
          ['content-notif-opt-in', userId, contentId],
          context.previous,
        );
      }
    },
  });
}
