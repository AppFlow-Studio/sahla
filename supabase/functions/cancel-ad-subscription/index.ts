import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Cancels a business-ad subscription at period end (the advertiser keeps the
 * month they paid for). Verifies ownership, then sets cancel_at_period_end on
 * the connected account's subscription and marks ad_subscriptions 'canceling'.
 * The stripe-webhooks function flips it to 'canceled' when the period ends.
 *
 * Body: { user_id: string, submission_id: string }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-12-18.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { user_id, submission_id } = await req.json();
    if (!user_id || !submission_id) {
      return new Response(JSON.stringify({ error: "user_id and submission_id are required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify ownership.
    const { data: submission } = await supabase
      .from("business_ads_submissions")
      .select("user_id, mosque_id")
      .eq("submission_id", submission_id)
      .single();
    if (!submission || submission.user_id !== user_id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: adSub } = await supabase
      .from("ad_subscriptions")
      .select("stripe_subscription_id")
      .eq("submission_id", submission_id)
      .single();
    if (!adSub?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "No active subscription" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: mosque } = await supabase
      .from("mosques")
      .select("stripe_account_id")
      .eq("id", submission.mosque_id)
      .single();
    if (!mosque?.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Mosque Stripe not configured" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    await stripe.subscriptions.update(
      adSub.stripe_subscription_id,
      { cancel_at_period_end: true },
      { stripeAccount: mosque.stripe_account_id },
    );

    await supabase
      .from("ad_subscriptions")
      .update({ status: "canceling", updated_at: new Date().toISOString() })
      .eq("submission_id", submission_id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[cancel-ad-subscription] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
