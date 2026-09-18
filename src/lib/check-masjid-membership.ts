import { env } from './env';

/**
 * Asks whether an email (or Clerk user id) already belongs to this masjid's
 * Clerk Organization.
 *
 * All masjid apps share one Clerk instance, so a successful Clerk credential
 * only proves the person has *a* Sahla account — not one at this masjid. Both
 * sign-in and password-reset gate on this before letting a session through;
 * without an active org the JWT carries no `org_id` claim and every
 * tenant-scoped RLS write fails once the user reaches personalization.
 *
 * Fails OPEN (returns `true`) on network/function errors so an outage can't
 * lock legitimate members out of their own masjid.
 */
export async function checkMasjidMembership(
  orgId: string,
  identity: { email: string } | { userId: string },
): Promise<boolean> {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/functions/v1/check-masjid-membership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_PUB_KEY,
      },
      body: JSON.stringify({
        org_id: orgId,
        ...('email' in identity ? { email: identity.email } : { user_id: identity.userId }),
      }),
    });
    const data = await res.json();
    if (typeof data?.member !== 'boolean') {
      console.warn('[check-masjid-membership] Unexpected response:', data);
      return true;
    }
    return data.member;
  } catch (err) {
    console.warn('[check-masjid-membership] Failed:', err);
    return true;
  }
}
