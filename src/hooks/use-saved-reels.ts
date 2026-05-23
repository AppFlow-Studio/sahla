import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Reel } from '@/src/hooks/use-reels';
import { useSupabase } from '@/src/hooks/use-supabase';

/**
 * Three hooks for the reel Save feature — all route through the `reels-actions`
 * edge function. Mirror of `use-saved-content.ts`; open that file as you go,
 * the patterns are nearly identical (saved_content → saved_reels).
 */

/**
 * Reads whether the current user has saved a given reel.
 * Mirror of `useIsSaved`.
 */
export function useIsReelSaved(reelId: string) {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['saved-reel', userId, reelId],
    queryFn: async (): Promise<boolean> => {
      const {data, error} = await supabase.functions.invoke<{is_saved: boolean, error?: string}>('reels-actions', {
        body: { action: 'is_reel_saved', user_id: userId, reel_id: reelId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.is_saved;
    },
    enabled: isLoaded && !!userId && !!reelId,
  });
}

/**
 * Toggles a reel save on/off. The caller passes `currentlySaved` so the cached
 * value can be flipped optimistically. Mirror of `useToggleSave`.
 */
export function useToggleReelSave(reelId: string, mosqueId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (currentlySaved: boolean): Promise<boolean> => {
      if (!userId || !mosqueId) {
        throw new Error("User ID or Mosque ID is missing");
      };
      const {data, error} = await supabase.functions.invoke<{is_saved: boolean, error?: string}>('reels-actions', {
        
        body: { action: 'toggle_reel_save', user_id: userId, mosque_id: mosqueId, reel_id: reelId, currently_saved: currentlySaved },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.is_saved;
      
    },
     
    onMutate: async (currentlySaved) => {
      await queryClient.cancelQueries({
        queryKey: ['saved-reel', userId, reelId],
      });
      const previous = queryClient.getQueryData<boolean>(["saved-reel", userId, reelId]);
      queryClient.setQueryData(["saved-reel", userId,reelId], !currentlySaved);
      return { previous};
    },
    onError: (_err, _vars, context) => {
      if (context && typeof context.previous === 'boolean') {
        queryClient.setQueryData(["saved-reel", userId, reelId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reels-list', userId] });
    }
  });
}

/**
 * Lists the current user's saved reels — for the Saved Clips screen.
 */
export function useSavedReels() {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['saved-reels-list', userId],
    queryFn: async (): Promise<Reel[]> => {
      const {data, error} = await supabase.functions.invoke<{reels: Reel[], error?: string}>('reels-actions', {
        body: { action: 'list_saved_reels', user_id: userId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.reels ?? [];
    },
    enabled: isLoaded && !!userId,
  });
}
