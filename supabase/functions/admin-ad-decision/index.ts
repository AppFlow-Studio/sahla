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
 * Mosque-admin decision on a business-ad submission. Single source of truth for
 * approve / decline / cancel, used by both the in-app admin screen and the CRM.
 *
 *   approve → status 'approved' + mirror into approved_business_ads (goes live)
 *   decline → reject a submitted (paid) ad: cancel the subscription, remove any
 *             approval, status 'declined'
 *   cancel  → take down an approved (live) ad: cancel the subscription, remove
 *             the approval, status 'canceled'
 *
 * decline/cancel cancel the Stripe subscription immediately on the connected
 * account (admin-initiated removal stops billing now).
 *
 * Body: { mosque_id: string, submission_id: string, action: 'approve'|'decline'|'cancel' }
 *
 * ⚠️ Staging: does not independently verify the caller is an admin of mosque_id
 * (matches the other admin functions). Harden before production.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    const { mosque_id, submission_id, action } = await req.json();
    if (!mosque_id || !submission_id || !["approve", "decline", "cancel"].includes(action)) {
      return json({ error: "mosque_id, submission_id and a valid action are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Scope the submission to the mosque.
    const { data: submission } = await supabase
      .from("business_ads_submissions")
      .select("mosque_id")
      .eq("submission_id", submission_id)
      .single();
    if (!submission || submission.mosque_id !== mosque_id) {
      return json({ error: "Not found" }, 404);
    }

    if (action === "approve") {
      await supabase
        .from("business_ads_submissions")
        .update({ status: "approved" })
        .eq("submission_id", submission_id);
      const { data: existing } = await supabase
        .from("approved_business_ads")
        .select("id")
        .eq("submission_id", submission_id)
        .maybeSingle();
      if (!existing) {
        await supabase
          .from("approved_business_ads")
          .insert({ submission_id, mosque_id });
      }
      return json({ ok: true, status: "approved" });
    }

    // decline / cancel → stop billing + remove approval.
    const { data: adSub } = await supabase
      .from("ad_subscriptions")
      .select("stripe_subscription_id")
      .eq("submission_id", submission_id)
      .single();

    if (adSub?.stripe_subscription_id) {
      const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
      const { data: mosque } = await supabase
        .from("mosques")
        .select("stripe_account_id")
        .eq("id", mosque_id)
        .single();
      if (stripeSecret && mosque?.stripe_account_id) {
        const stripe = new Stripe(stripeSecret, {
          apiVersion: "2024-12-18.acacia",
          httpClient: Stripe.createFetchHttpClient(),
        });
        try {
          await stripe.subscriptions.cancel(adSub.stripe_subscription_id, {
            stripeAccount: mosque.stripe_account_id,
          });
        } catch (e) {
          // Already canceled / not found — proceed with the DB cleanup anyway.
          console.warn("[admin-ad-decision] stripe cancel:", String(e));
        }
      }
      await supabase
        .from("ad_subscriptions")
        .update({ status: "canceled", end_date: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("submission_id", submission_id);
    }

    await supabase
      .from("approved_business_ads")
      .delete()
      .eq("submission_id", submission_id);

    const newStatus = action === "decline" ? "declined" : "canceled";
    await supabase
      .from("business_ads_submissions")
      .update({ status: newStatus })
      .eq("submission_id", submission_id);

    return json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[admin-ad-decision] Error:", err);
    return json({ error: "Internal error", detail: String(err) }, 500);
  }
});
