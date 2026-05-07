import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';

/**
 * Reads whether a single content item is saved by the current user.
 * Cache key matches CT-02's spec so the toggle mutation can do an
 * optimistic update without re-fetching.
 */
export function useIsSaved(contentId: string) {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['saved-content', userId, contentId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('saved_content')
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

      if (currentlySaved) {
        const { error } = await supabase
          .from('saved_content')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('saved_content')
          .insert({ user_id: userId, content_id: contentId, mosque_id: mosqueId });
        if (error) throw new Error(error.message);
      }

      // Fire-and-forget interaction log — don't block the UI.
      void supabase.from('user_content_interactions').insert({
        user_id: userId,
        content_id: contentId,
        mosque_id: mosqueId,
        interaction_type: currentlySaved ? 'unsave' : 'save',
      });

      return !currentlySaved;
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
