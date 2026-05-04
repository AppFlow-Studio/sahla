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

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

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
        JSON.stringify({ payments: [] }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-03-31.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Fetch payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: profile.stripe_id,
      limit: 100,
    });

    const payments = await Promise.all(
      paymentIntents.data.map(async (pi) => {
        let paymentMethod: { type: string; brand: string | null; last4: string | null } | null = null;

        if (pi.payment_method && typeof pi.payment_method === "string") {
          try {
            const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
            paymentMethod = {
              type: pm.type,
              brand: pm.card?.brand ?? null,
              last4: pm.card?.last4 ?? null,
            };
          } catch {
            // Payment method may have been detached
          }
        }

        // Determine refund amount
        let amount_refunded = 0;
        if (pi.status === "succeeded") {
          try {
            const charges = await stripe.charges.list({
              payment_intent: pi.id,
              limit: 1,
            });
            if (charges.data.length > 0) {
              amount_refunded = charges.data[0].amount_refunded ?? 0;
            }
          } catch {
            // Ignore charge lookup errors
          }
        }

        let status = pi.status;
        if (status === "succeeded" && amount_refunded > 0) {
          status = amount_refunded >= pi.amount ? "refunded" : "partially_refunded";
        }

        return {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status,
          created: pi.created,
          description: pi.description,
          label: pi.metadata?.type === "donation" ? "Donation" : (pi.metadata?.label ?? "Donation"),
          paymentMethod,
          amount_refunded,
        };
      }),
    );

    return new Response(
      JSON.stringify({ payments }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[get-payment-history] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
