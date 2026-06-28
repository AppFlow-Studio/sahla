import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Public list of a mosque's approved business ads, for the app's "Community
 * Partners" section. Reads via service role and returns only the ad's public
 * fields (no applicant personal name/email beyond the business contact), so we
 * don't need a broad public RLS policy on business_ads_submissions.
 *
 * Presence in approved_business_ads == currently live (decline/cancel removes
 * the row), so no status filter is needed.
 *
 * Body: { mosque_id: string }
 * Returns: { partners: [{ id, name, address, flyerImg, phone, email }] }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { mosque_id } = await req.json();
    if (!mosque_id) {
      return new Response(JSON.stringify({ error: "mosque_id is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("approved_business_ads")
      .select(
        "submission_id, created_at, business_ads_submissions!inner(business_name, business_address, business_flyer_img, personal_phone, personal_email)",
      )
      .eq("mosque_id", mosque_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const partners = (data ?? []).map((row: any) => {
      const s = row.business_ads_submissions;
      return {
        id: row.submission_id,
        name: s?.business_name ?? null,
        address: s?.business_address ?? null,
        flyerImg: s?.business_flyer_img ?? null,
        phone: s?.personal_phone ?? null,
        email: s?.personal_email ?? null,
      };
    });

    return new Response(JSON.stringify({ partners }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[get-community-partners] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
