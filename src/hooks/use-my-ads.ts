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
  /** Subscription is over — offer a prefilled re-application for this business. */
  can_renew: boolean;
  /** A later submission replaced this one, so it's history, not an option. */
  renewed: boolean;
  business_address: string | null;
  personal_full_name: string | null;
  personal_email: string | null;
  personal_phone: string | null;
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

/** Pull the JSON `error` field out of a failed functions.invoke() response. */
async function functionErrorMessage(error: any): Promise<string> {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return String(body.error);
  } catch {
    // Non-JSON body (or already consumed) — fall through to the generic message.
  }
  return error?.message ?? 'Request failed';
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
      // invoke() collapses every non-2xx into "Edge Function returned a
      // non-2xx status code" — read the response body for the real reason.
      if (error) throw new Error(await functionErrorMessage(error));
      if (!data?.ok) throw new Error(data?.error ?? 'Cancellation failed');
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['my-ads', userId, mosqueUuid] }),
  });
}
