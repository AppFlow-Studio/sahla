import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Returns the caller's business-ad applications with their subscription state,
 * for the in-app "My Business Ads" screen. ad_subscriptions has no owner RLS,
 * so this reads with the service role after scoping by user_id.
 *
 * Body: { user_id: string, mosque_id: string }
 * Returns: { ads: [{ submission_id, business_name, business_flyer_img,
 *   submission_status, subscription_status, recurring_amount, onboarding_amount,
 *   start_date, can_cancel }] }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_id, mosque_id } = await req.json();
    if (!user_id || !mosque_id) {
      return new Response(JSON.stringify({ error: "user_id and mosque_id are required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Exclude abandoned checkouts (never paid). The webhook flips a paid
    // submission from 'pending_payment' to 'submitted', so these are the
    // incomplete Stripe subscriptions the advertiser never completed.
    const { data: subs, error: subErr } = await supabase
      .from("business_ads_submissions")
      .select("submission_id, business_name, business_flyer_img, status, created_at")
      .eq("user_id", user_id)
      .eq("mosque_id", mosque_id)
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false });
    if (subErr) throw new Error(subErr.message);

    const ids = (subs ?? []).map((s) => s.submission_id);
    const adSubBySubmission: Record<string, any> = {};
    if (ids.length > 0) {
      const { data: adSubs } = await supabase
        .from("ad_subscriptions")
        .select("submission_id, status, recurring_amount, onboarding_amount, start_date")
        .in("submission_id", ids);
      for (const a of adSubs ?? []) adSubBySubmission[a.submission_id] = a;
    }

    const ads = (subs ?? []).map((s) => {
      const adSub = adSubBySubmission[s.submission_id];
      const subscriptionStatus = adSub?.status ?? null;
      return {
        submission_id: s.submission_id,
        business_name: s.business_name,
        business_flyer_img: s.business_flyer_img,
        submission_status: s.status,
        created_at: s.created_at,
        subscription_status: subscriptionStatus,
        recurring_amount: adSub?.recurring_amount ?? null,
        onboarding_amount: adSub?.onboarding_amount ?? null,
        start_date: adSub?.start_date ?? null,
        can_cancel:
          subscriptionStatus === "active" || subscriptionStatus === "past_due",
      };
    });

    return new Response(JSON.stringify({ ads }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[get-ad-status] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
