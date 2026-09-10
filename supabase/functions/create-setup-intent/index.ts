import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { resolveConnectedCustomer } from "../_shared/stripe-customer.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Creates a Stripe SetupIntent so a card can be saved WITHOUT a charge.
 *
 * create-donation-intent only ever saves a card as a side effect of a
 * donation (setup_future_usage), which is why Payment Methods had no way to
 * add one and shipped a "coming soon" alert instead. This is the same shape as
 * that function minus the amount: same connected-account resolution, same
 * ephemeral key, so the saved card lands on the mosque's connected account and
 * shows up in get-payment-methods.
 *
 * Required env: STRIPE_SECRET_KEY
 *
 * Body: {
 *   mosque_id: string      — mosque UUID (used to look up connected account)
 *   user_id?: string
 *   customer_email?: string
 * }
 *
 * Returns: { clientSecret, ephemeralKey, customerId, publishableKey, stripeAccountId }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
        {
          status: 500,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-12-18.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { customer_email, user_id, mosque_id } = await req.json();

    if (!mosque_id) {
      return new Response(
        JSON.stringify({ error: "mosque_id is required" }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    // Use service role to read/write profiles
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the mosque's connected Stripe account
    const { data: mosque, error: mosqueError } = await supabase
      .from("mosques")
      .select("stripe_account_id")
      .eq("id", mosque_id)
      .single();

    if (mosqueError || !mosque?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          error: "Mosque not found or Stripe not configured for this mosque",
        }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const connectedAccountId = mosque.stripe_account_id;
    const stripeAccountOpts = { stripeAccount: connectedAccountId };

    // Resolve a customer that exists on THIS mosque's connected account.
    const customer = await resolveConnectedCustomer({
      stripe,
      supabase,
      connectedAccountId,
      userId: user_id,
      email: customer_email,
    });

    // apiVersion MUST match what @stripe/stripe-react-native expects
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-12-18.acacia", ...stripeAccountOpts },
    );

    // off_session: the saved card is meant for later donations, not just this
    // session, which is what get-payment-methods lists and what the donation
    // sheet's saved-card picker charges.
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customer.id,
        usage: "off_session",
        metadata: {
          type: "save_card",
          mosque_id,
        },
        automatic_payment_methods: { enabled: true },
      },
      stripeAccountOpts,
    );

    return new Response(
      JSON.stringify({
        clientSecret: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId: customer.id,
        publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY")!,
        stripeAccountId: connectedAccountId,
      }),
      {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[create-setup-intent] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }
});
