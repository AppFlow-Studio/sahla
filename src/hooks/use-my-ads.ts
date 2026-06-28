import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';

export type MyAd = {
  submission_id: string;
  business_name: string | null;
  business_flyer_img: string | null;
  submission_status: string | null;
  subscription_status: string | null;
  recurring_amount: number | null;
  onboarding_amount: number | null;
  start_date: string | null;
  can_cancel: boolean;
  created_at: string;
};

/** The current user's business-ad applications + subscription state. */
export function useMyAds() {
  const { userId } = useAuth();
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  return useQuery({
    queryKey: ['my-ads', userId, mosqueUuid],
    enabled: !!userId && !!mosqueUuid,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-ad-status', {
        headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
        body: { user_id: userId, mosque_id: mosqueUuid },
      });
      if (error) throw new Error(error.message);
      return (data?.ads ?? []) as MyAd[];
    },
  });
}

export function useCancelAdSubscription() {
  const { userId } = useAuth();
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.functions.invoke('cancel-ad-subscription', {
        headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
        body: { user_id: userId, submission_id: submissionId },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error ?? 'Cancellation failed');
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['my-ads', userId, mosqueUuid] }),
  });
}
