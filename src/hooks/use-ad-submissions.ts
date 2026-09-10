import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';

export type AdDecision = 'approve' | 'decline' | 'cancel';

export type AdPayment = {
  amount_cents: number;
  currency: string | null;
  kind: string;
  status: string;
  paid_at: string;
};

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
  /** When the ad went live (admin approval); null until approved. */
  live_since: string | null;
  /** When the subscription's first invoice was paid; null until paid. */
  started_at: string | null;
  /** Paid invoices, newest first. */
  payments: AdPayment[];
};

// Embeds related rows via PostgREST. The mosque-admin RLS policies on
// approved_business_ads, ad_subscriptions, and ad_payments scope these to the
// caller's mosque. Each relationship is keyed on submission_id.
const COLS = `
  submission_id, business_name, business_address, business_flyer_img,
  personal_full_name, personal_email, personal_phone, status, created_at,
  approved_business_ads ( created_at ),
  ad_subscriptions ( start_date ),
  ad_payments ( amount_cents, currency, kind, status, paid_at )
`;

type RawAdSubmission = Omit<AdSubmission, 'live_since' | 'started_at' | 'payments'> & {
  approved_business_ads: { created_at: string }[] | { created_at: string } | null;
  ad_subscriptions: { start_date: string | null }[] | { start_date: string | null } | null;
  ad_payments: AdPayment[] | null;
};

function first<T>(rel: T[] | T | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

function normalize(row: RawAdSubmission): AdSubmission {
  const { approved_business_ads, ad_subscriptions, ad_payments, ...base } = row;
  const payments = [...(ad_payments ?? [])].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
  );
  return {
    ...base,
    live_since: first(approved_business_ads)?.created_at ?? null,
    started_at: first(ad_subscriptions)?.start_date ?? null,
    payments,
  };
}

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
      return ((data ?? []) as unknown as RawAdSubmission[]).map(normalize);
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
