import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Reel } from '@/src/hooks/use-reels';
import { useSupabase } from '@/src/hooks/use-supabase';

/**
 * "Not interested" on a reel. One-way (no toggle): the server records the
 * dismissal permanently and the reel never resurfaces in the feed. The
 * optimistic move removes the reel from every ['reels', mosqueId] cache cell so
 * it vanishes instantly; onError restores the snapshot if the server call fails.
 */
export function useDismissReel(reelId: string, mosqueId: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (!userId || !mosqueId) {
        throw new Error('useDismissReel: userId and mosqueId are required');
      }
      const {data,error} = await supabase.functions.invoke<{dismissed:boolean,error?:string}>("reels-actions",{
        body: {action: "dismiss_reel",user_id:userId,mosque_id:mosqueId,reel_id:reelId}
      })
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return !!data?.dismissed;
    },
    onMutate: async () => {
      // Stop any in-flight feed refetch from re-adding the reel we're removing.
      await queryClient.cancelQueries({ queryKey: ["reels", mosqueId] });
      // Snapshot every feed cell so onError can put the reel back.
      const previousFeeds = queryClient.getQueriesData<Reel[]>({ queryKey: ["reels", mosqueId] });
      // Optimistically drop the reel from each cell — it vanishes instantly.
      queryClient.setQueriesData<Reel[]>({ queryKey: ["reels", mosqueId] }, (old) =>
        old?.filter((r) => r.reel_id !== reelId),
      );
      return { previousFeeds };
    },
    onError: (_err, _vars, context) => {
      // Restore each snapshotted cell to its pre-dismissal contents.
      context?.previousFeeds.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      // Reconcile with the server's filtered feed (the reel's already gone
      // optimistically; this just confirms it).
      queryClient.invalidateQueries({ queryKey: ["reels", mosqueId] });
    },
  });
}
