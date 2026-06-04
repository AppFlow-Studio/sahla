import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// PaymentIntent statuses that can still be canceled. Anything else
// (succeeded, processing, already canceled) is left untouched.
const CANCELABLE = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/**
 * Cancels an abandoned donation PaymentIntent so it doesn't linger in the
 * donor's payment history as an "incomplete" charge.
 *
 * Required env: STRIPE_SECRET_KEY
 *
 * Body: {
 *   payment_intent_id: string  — the PaymentIntent id (pi_…)
 *   mosque_id: string          — mosque UUID (resolves the connected account)
 * }
 *
 * Returns: { canceled: boolean, status?: string }
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
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const { payment_intent_id, mosque_id } = await req.json();
    if (!payment_intent_id || !mosque_id) {
      return new Response(
        JSON.stringify({ error: "payment_intent_id and mosque_id are required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-12-18.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const stripeAccountOpts = { stripeAccount: mosque.stripe_account_id };

    // Only cancel if it's still in a cancelable state — avoids racing a
    // payment that succeeded between the user backing out and this call.
    const intent = await stripe.paymentIntents.retrieve(
      payment_intent_id,
      stripeAccountOpts,
    );

    if (!CANCELABLE.has(intent.status)) {
      return new Response(
        JSON.stringify({ canceled: false, status: intent.status }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const canceled = await stripe.paymentIntents.cancel(
      payment_intent_id,
      stripeAccountOpts,
    );

    return new Response(
      JSON.stringify({ canceled: true, status: canceled.status }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[cancel-donation-intent] Error:", err?.message ?? err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err?.message ?? String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
