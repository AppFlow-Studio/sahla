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
      .select("submission_id, business_name, business_address, business_flyer_img, personal_full_name, personal_email, personal_phone, status, created_at")
      .eq("user_id", user_id)
      .eq("mosque_id", mosque_id)
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false });
    if (subErr) throw new Error(subErr.message);

    const ids = (subs ?? []).map((s) => s.submission_id);

    // Which of these ads have already been renewed? Abandoned renew attempts
    // are excluded — they stay 'pending_payment' forever, and counting them
    // would permanently disable Renew on an ad the advertiser never replaced.
    const renewedIds = new Set<string>();
    if (ids.length > 0) {
      const { data: successors } = await supabase
        .from("business_ads_submissions")
        .select("renewed_from_submission_id")
        .in("renewed_from_submission_id", ids)
        .neq("status", "pending_payment");
      for (const r of successors ?? []) {
        if (r.renewed_from_submission_id) renewedIds.add(r.renewed_from_submission_id);
      }
    }

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
        // Dead ad → offer a re-application prefilled from this business, so an
        // advertiser with several businesses renews the right one. 'canceling'
        // is excluded: that ad is still live until the period closes, and an
        // already-renewed ad is excluded so renewing twice can't charge the
        // onboarding fee again for a business that is already running.
        can_renew: subscriptionStatus === "canceled" && !renewedIds.has(s.submission_id),
        renewed: renewedIds.has(s.submission_id),
        business_address: s.business_address,
        personal_full_name: s.personal_full_name,
        personal_email: s.personal_email,
        personal_phone: s.personal_phone,
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
