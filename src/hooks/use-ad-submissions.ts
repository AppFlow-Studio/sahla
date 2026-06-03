import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';

export type AdDecision = 'approve' | 'decline' | 'cancel';

export type AdSubmission = {
  submission_id: string;
  business_name: string | null;
  business_address: string | null;
  business_flyer_img: string | null;
  personal_full_name: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  status: string | null;
  created_at: string;
};

const COLS =
  'submission_id, business_name, business_address, business_flyer_img, personal_full_name, personal_email, personal_phone, status, created_at';

/** All ad submissions for the current mosque (mosque-admin RLS). */
export function useAdSubmissions() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  return useQuery({
    queryKey: ['ad-submissions', mosqueUuid],
    enabled: !!mosqueUuid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_ads_submissions')
        .select(COLS)
        .eq('mosque_id', mosqueUuid!)
        // Hide abandoned checkouts that never completed payment.
        .neq('status', 'pending_payment')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as AdSubmission[];
    },
  });
}

/**
 * Mosque-admin decision on a submission: approve / decline / cancel. Routes
 * through the admin-ad-decision edge function (decline/cancel also stop Stripe
 * billing, which can't be done from the client).
 */
export function useAdDecision() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      action,
    }: {
      submissionId: string;
      action: AdDecision;
    }) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { data, error } = await supabase.functions.invoke('admin-ad-decision', {
        headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
        body: { mosque_id: mosqueUuid, submission_id: submissionId, action },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error ?? 'Action failed');
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['ad-submissions', mosqueUuid] }),
  });
}
