import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Adds the current user to the mosque's Clerk Organization via the
 * `join-org` Edge Function. Safe to call multiple times — the function
 * checks for existing membership and returns `already_member`.
 */
export async function joinMosqueOrg(
  supabase: SupabaseClient,
  userId: string,
  orgId: string | undefined,
): Promise<'joined' | 'already_member' | 'skipped' | 'error'> {
  if (!orgId) return 'skipped';

  try {
    const { data, error } = await supabase.functions.invoke('join-org', {
      body: { user_id: userId, org_id: orgId },
    });

    if (error) {
      console.warn('[clerk-org] Edge Function error:', error);
      return 'error';
    }

    return data?.status ?? 'error';
  } catch (err) {
    console.warn('[clerk-org] Failed to join org:', err);
    return 'error';
  }
}
