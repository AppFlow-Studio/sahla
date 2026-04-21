import { env } from './env';

/**
 * Calls the join-org edge function directly via fetch.
 *
 * Used during auth flows (sign-in, sign-up, OAuth) where the Supabase
 * client doesn't have an authenticated session yet. For post-auth usage,
 * prefer `joinMosqueOrg()` from `clerk-org.ts` which uses the Supabase client.
 */
export async function joinOrgDirect(
  userId: string,
  orgId: string,
): Promise<'joined' | 'already_member' | 'error'> {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/functions/v1/join-org`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_PUB_KEY,
      },
      body: JSON.stringify({ user_id: userId, org_id: orgId }),
    });
    const data = await res.json();
    return data?.status ?? 'error';
  } catch (err) {
    console.warn('[join-org-direct] Failed:', err);
    return 'error';
  }
}
