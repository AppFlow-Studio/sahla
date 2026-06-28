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
 * Creates a Stripe PaymentIntent for a one-time donation.
 *
 * Required env: STRIPE_SECRET_KEY
 *
 * Body: {
 *   amount: number        — donation amount in dollars (e.g. 50)
 *   mosque_id: string     — mosque UUID (used to look up connected account)
 *   save_card?: boolean   — whether to set up for future usage
 *   customer_email?: string
 * }
 *
 * Returns: { clientSecret, ephemeralKey, customer, publishableKey }
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

    const { amount, customer_email, save_card, user_id, mosque_id } =
      await req.json();

    if (!amount || amount < 1) {
      return new Response(
        JSON.stringify({ error: "amount is required and must be >= 1" }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

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

    // Create an ephemeral key for the mobile SDK on the connected account
    // apiVersion MUST match what @stripe/stripe-react-native expects (0.65.0 → 2024-12-18.acacia)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-12-18.acacia", ...stripeAccountOpts },
    );

    // Create the PaymentIntent on the connected account
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100), // convert dollars to cents
        currency: "usd",
        customer: customer.id,
        metadata: {
          type: "donation",
          mosque_id,
        },
        setup_future_usage: save_card ? "off_session" : undefined,
        automatic_payment_methods: { enabled: true },
      },
      stripeAccountOpts,
    );

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
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
    console.error("[create-donation-intent] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }
});
