import type Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Stripe Connect customer resolution.
 * ------------------------------------
 * Donations / ads / saved cards all run against each mosque's OWN connected
 * account (`mosques.stripe_account_id`). Stripe customers are scoped to a
 * single connected account, so a customer created while donating to one mosque
 * does NOT exist on another mosque's account — reusing the one global
 * `profiles.stripe_id` there throws `No such customer`.
 *
 * Source of truth is the `stripe_customers` table, keyed by
 * (user_id, stripe_account_id). Resolution order:
 *   1. mapping row for (user, account)         — the correct per-account id
 *   2. legacy global `profiles.stripe_id`       — backfilled into the mapping
 *   3. dedupe by email on the account           — backfilled into the mapping
 *   4. (resolve only) create on the account     — written into the mapping
 */

type Args = {
  stripe: Stripe;
  supabase: SupabaseClient;
  connectedAccountId: string;
  /** Clerk user id (== profiles.id), optional for anonymous flows. */
  userId?: string | null;
  email?: string | null;
};

/** Triple-equals guard for the `{ deleted: true }` shape Stripe returns. */
function isDeleted(c: Stripe.Customer | Stripe.DeletedCustomer): boolean {
  return (c as Stripe.DeletedCustomer).deleted === true;
}

async function mappedCustomerId(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  accountId: string,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("stripe_account_id", accountId)
    .maybeSingle();
  return data?.stripe_customer_id ?? null;
}

async function rememberCustomer(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  accountId: string,
  customerId: string,
): Promise<void> {
  if (!userId) return;
  await supabase.from("stripe_customers").upsert(
    { user_id: userId, stripe_account_id: accountId, stripe_customer_id: customerId },
    { onConflict: "user_id,stripe_account_id" },
  );
}

async function legacyStripeId(
  supabase: SupabaseClient,
  userId?: string | null,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("stripe_id")
    .eq("id", userId)
    .single();
  return data?.stripe_id ?? null;
}

async function findByEmail(
  stripe: Stripe,
  email: string,
  opts: { stripeAccount: string },
): Promise<Stripe.Customer | null> {
  const existing = await stripe.customers.list({ email, limit: 1 }, opts);
  return existing.data[0] ?? null;
}

/** Verify an id still exists (and isn't deleted) on the connected account. */
async function liveOnAccount(
  stripe: Stripe,
  id: string,
  opts: { stripeAccount: string },
): Promise<boolean> {
  try {
    const c = await stripe.customers.retrieve(id, opts);
    return !isDeleted(c);
  } catch (_) {
    return false; // resource_missing — id belongs to a different account
  }
}

/**
 * Returns the customer id that exists on this connected account, or null if
 * the user has none here. Never creates. Backfills the mapping when it finds
 * an id via a legacy source. Use for read/delete paths.
 */
export async function findConnectedCustomerId(args: Args): Promise<string | null> {
  const { stripe, supabase, connectedAccountId, userId, email } = args;
  const opts = { stripeAccount: connectedAccountId };

  const mapped = await mappedCustomerId(supabase, userId, connectedAccountId);
  if (mapped && (await liveOnAccount(stripe, mapped, opts))) return mapped;

  const legacy = await legacyStripeId(supabase, userId);
  if (legacy && (await liveOnAccount(stripe, legacy, opts))) {
    await rememberCustomer(supabase, userId, connectedAccountId, legacy);
    return legacy;
  }

  if (email) {
    const byEmail = await findByEmail(stripe, email, opts);
    if (byEmail) {
      await rememberCustomer(supabase, userId, connectedAccountId, byEmail.id);
      return byEmail.id;
    }
  }
  return null;
}

/**
 * Like findConnectedCustomerId, but creates a customer on this connected
 * account when none exists. Always records the mapping. Use for charge paths.
 */
export async function resolveConnectedCustomer(args: Args): Promise<Stripe.Customer> {
  const { stripe, supabase, connectedAccountId, userId, email } = args;
  const opts = { stripeAccount: connectedAccountId };

  const existingId = await findConnectedCustomerId(args);
  if (existingId) {
    return (await stripe.customers.retrieve(existingId, opts)) as Stripe.Customer;
  }

  const customer = await stripe.customers.create(email ? { email } : {}, opts);
  await rememberCustomer(supabase, userId, connectedAccountId, customer.id);
  return customer;
}
