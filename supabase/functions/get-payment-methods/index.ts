import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const { user_id, mosque_id } = await req.json();
    if (!user_id || !mosque_id) {
      return new Response(
        JSON.stringify({ error: "user_id and mosque_id are required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // Use service role to read profiles
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_id")
      .eq("id", user_id)
      .single();

    if (!profile?.stripe_id) {
      return new Response(
        JSON.stringify({ methods: [] }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

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

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-03-31.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const stripeAccountOpts = { stripeAccount: mosque.stripe_account_id };

    const paymentMethods = await stripe.paymentMethods.list(
      { customer: profile.stripe_id, type: "card" },
      stripeAccountOpts,
    );

    const methods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "unknown",
      last4: pm.card?.last4 ?? "0000",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
    }));

    return new Response(
      JSON.stringify({ methods }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[get-payment-methods] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
