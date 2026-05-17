import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';

/**
 * Reads whether a single content item is saved by the current user.
 *
 * Demo-day workaround: routed through the `ct02-actions` service-role edge
 * function while the Clerk → Supabase JWT bridge is unverified. Direct
 * .from('saved_content') reads return empty under the new F-RLS-01 policies
 * because requesting_user_id() resolves to NULL.
 */
export function useIsSaved(contentId: string) {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['saved-content', userId, contentId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.functions.invoke<{
        is_saved: boolean;
        error?: string;
      }>('ct02-actions', {
        body: { action: 'is_saved', user_id: userId, content_id: contentId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.is_saved;
    },
    enabled: isLoaded && !!userId && !!contentId,
  });
}

/**
 * Toggles a save on/off. Caller passes `currentlySaved` so the mutation
 * can flip the cached value optimistically before the network round-trip.
 *
 * Side effect: fires a `user_content_interactions` row (`'save'` or
 * `'unsave'`) for the recommendation engine + analytics. That write is
 * fire-and-forget — UI does not wait on it.
 */
export function useToggleSave(contentId: string, mosqueId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (currentlySaved: boolean): Promise<boolean> => {
      if (!userId) throw new Error('Not signed in');
      if (!mosqueId) throw new Error('No mosque resolved');
      // Demo-day workaround: see useIsSaved for context. Edge function
      // handles the saved_content write + interaction log in one call.
      const { data, error } = await supabase.functions.invoke<{
        is_saved: boolean;
        error?: string;
      }>('ct02-actions', {
        body: {
          action: 'toggle_save',
          user_id: userId,
          mosque_id: mosqueId,
          content_id: contentId,
          currently_saved: currentlySaved,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.is_saved;
    },
    onMutate: async (currentlySaved) => {
      await queryClient.cancelQueries({
        queryKey: ['saved-content', userId, contentId],
      });
      const previous = queryClient.getQueryData<boolean>([
        'saved-content',
        userId,
        contentId,
      ]);
      queryClient.setQueryData<boolean>(
        ['saved-content', userId, contentId],
        !currentlySaved,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context && typeof context.previous === 'boolean') {
        queryClient.setQueryData(
          ['saved-content', userId, contentId],
          context.previous,
        );
      }
    },
    onSuccess: () => {
      // CT-03's Library tab reads this list — invalidate so a freshly
      // saved/unsaved item shows/hides immediately when the user navigates
      // to Library.
      queryClient.invalidateQueries({
        queryKey: ['saved-content-list', userId],
      });
    },
  });
}
