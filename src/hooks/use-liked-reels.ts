import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Reel } from '@/src/hooks/use-reels';
import { useSupabase } from '@/src/hooks/use-supabase';

export function useIsReelLiked(reelId: string) {
  const supabase = useSupabase();
  const { userId: userId, isLoaded: isLoaded } = useAuth();

  return useQuery({
    queryKey: ['liked-reel', userId,reelId],
    queryFn: async (): Promise<boolean> => {
      const {data,error} = await supabase.functions.invoke<{is_liked:boolean,error?:string}>('reels-actions',{
        body: {action: 'is_reel_liked',user_id:userId,reel_id:reelId}
      })
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);      
      return !!data?.is_liked;
    },
    enabled: isLoaded && !!userId && !!reelId 
  });
}

/**
 * Toggle a reel like on/off. Optimistic on both the heart state and the feed's
 * like_count so the UI moves instantly — the server round-trip (which also
 * re-weights the user's interests) can lag without the count appearing stuck.
 */
export function useToggleReelLike(reelId: string, mosqueId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId: userId } = useAuth();

  return useMutation({
    mutationFn: async (currentlyLiked: boolean): Promise<boolean> => {
      if (!userId || !mosqueId){
        throw new Error("user id or mosque id is missing")
      }
      const {data,error} = await supabase.functions.invoke<{is_liked:boolean,error?:string}>("reels-actions",{
        body: {action: "toggle_reel_like",user_id:userId,mosque_id:mosqueId,reel_id:reelId,currently_liked:currentlyLiked}
      })
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.is_liked;
     
    },
    onMutate: async (currentlyLiked) => {
      // Cancel in-flight reads of both cells we're about to hand-edit, so a
      // late server response can't clobber our optimistic values.
      await queryClient.cancelQueries({ queryKey: ["liked-reel", userId, reelId] });
      await queryClient.cancelQueries({ queryKey: ["reels", mosqueId] });

      const previousLiked = queryClient.getQueryData<boolean>(["liked-reel", userId, reelId]);
      // Snapshot every feed cell (one per userId suffix) so we can restore on error.
      const previousFeeds = queryClient.getQueriesData<Reel[]>({ queryKey: ["reels", mosqueId] });

      // Flip the heart…
      queryClient.setQueryData(["liked-reel", userId, reelId], !currentlyLiked);

      // …and move the count in the same tick. unlike → -1, like → +1.
      const delta = currentlyLiked ? -1 : 1;
      queryClient.setQueriesData<Reel[]>({ queryKey: ["reels", mosqueId] }, (old) =>
        old?.map((r) =>
          r.reel_id === reelId
            ? { ...r, like_count: Math.max(0, (r.like_count ?? 0) + delta) }
            : r,
        ),
      );

      return { previousLiked, previousFeeds };
    },
    onError: (_err, _vars, context) => {
      if (context && typeof context.previousLiked === "boolean") {
        queryClient.setQueryData(["liked-reel", userId, reelId], context.previousLiked);
      }
      // Restore each feed cell to its pre-mutation snapshot.
      context?.previousFeeds?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      // Reconcile against the server's authoritative like_count. The optimistic
      // value already moved the UI; this refetch just corrects any drift.
      queryClient.invalidateQueries({ queryKey: ["reels", mosqueId] });
      queryClient.invalidateQueries({ queryKey: ["liked-reels-list", userId] });
    },
  });
}
