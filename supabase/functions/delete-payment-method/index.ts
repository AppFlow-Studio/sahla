import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { findConnectedCustomerId } from "../_shared/stripe-customer.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Stripe statuses where a subscription will still try to bill this card. */
const LIVE_SUB_STATUSES = new Set(["active", "past_due", "trialing", "unpaid"]);

const idOf = (v: unknown): string | null =>
  typeof v === "string" ? v : (v as { id?: string } | null)?.id ?? null;

/**
 * Ids of the customer's live subscriptions that would bill `paymentMethodId`.
 * A subscription with no default of its own falls back to the customer's
 * invoice default, so detaching that card breaks it just the same.
 */
async function subscriptionsUsingPaymentMethod({
  stripe,
  stripeAccountOpts,
  customerId,
  paymentMethodId,
}: {
  stripe: Stripe;
  stripeAccountOpts: { stripeAccount: string };
  customerId: string;
  paymentMethodId: string;
}): Promise<string[]> {
  const subs = await stripe.subscriptions.list(
    { customer: customerId, status: "all", limit: 100 },
    stripeAccountOpts,
  );
  const live = subs.data.filter((sub) => LIVE_SUB_STATUSES.has(sub.status));
  if (live.length === 0) return [];

  let customerDefaultId: string | null = null;
  if (live.some((sub) => !idOf(sub.default_payment_method))) {
    const customer = await stripe.customers.retrieve(customerId, stripeAccountOpts);
    if (!customer.deleted) {
      customerDefaultId = idOf(customer.invoice_settings?.default_payment_method);
    }
  }

  return live
    .filter((sub) => (idOf(sub.default_payment_method) ?? customerDefaultId) === paymentMethodId)
    .map((sub) => sub.id);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const { user_id, paymentMethodId, mosque_id } = await req.json();
    if (!user_id || !paymentMethodId || !mosque_id) {
      return new Response(
        JSON.stringify({ error: "user_id, paymentMethodId, and mosque_id are required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up mosque's connected Stripe account
    const { data: mosque, error: mosqueError } = await supabase
      .from("mosques")
      .select("stripe_account_id")
      .eq("id", mosque_id)
      .single();

    if (mosqueError || !mosque?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Mosque not found or Stripe not configured" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_email")
      .eq("id", user_id)
      .single();

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-03-31.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const stripeAccountOpts = { stripeAccount: mosque.stripe_account_id };

    // Resolve the customer on THIS connected account to verify ownership
    // (saved cards are per-account, not per global profiles.stripe_id).
    const customerId = await findConnectedCustomerId({
      stripe,
      supabase,
      connectedAccountId: mosque.stripe_account_id,
      userId: user_id,
      email: profile?.profile_email,
    });

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // Verify ownership before detaching
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId, stripeAccountOpts);
    if (pm.customer !== customerId) {
      return new Response(
        JSON.stringify({ error: "Payment method does not belong to this user" }),
        { status: 403, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // A saved card on this connected customer can also be what a live
    // business-ad subscription bills. Detaching it silently orphans that
    // billing: the next renewal fails, dunning runs out, and the ad is
    // canceled — so refuse and say which ad is using it.
    const blocking = await subscriptionsUsingPaymentMethod({
      stripe,
      stripeAccountOpts,
      customerId,
      paymentMethodId,
    });
    if (blocking.length > 0) {
      const { data: rows } = await supabase
        .from("ad_subscriptions")
        .select("submission_id, business_ads_submissions(business_name)")
        .in("stripe_subscription_id", blocking);
      const names = (rows ?? [])
        .map((r: any) => r.business_ads_submissions?.business_name)
        .filter(Boolean);
      const which = names.length > 0 ? `"${names.join('", "')}"` : "an active";
      return new Response(
        JSON.stringify({
          error:
            `This card pays for your ${which} ad subscription. ` +
            `Add another card and make it the default for that subscription before removing this one.`,
          code: "in_use_by_subscription",
          subscription_ids: blocking,
        }),
        { status: 409, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    await stripe.paymentMethods.detach(paymentMethodId, stripeAccountOpts);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[delete-payment-method] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
