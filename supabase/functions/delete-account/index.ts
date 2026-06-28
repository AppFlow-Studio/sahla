import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ============================================================================
// delete-account — permanently deletes the calling user's account.
// ============================================================================
//
// Flow:
//   1. Identify the caller from their *verified* Clerk JWT (never trust body
//      input — a user may only delete their own account).
//   2. Delete the user in Clerk (source of truth). This fires the
//      `user.deleted` webhook (sahla-web/.../clerk-webhooks) which deletes the
//      profiles row; ON DELETE CASCADE then wipes every per-user table.
//   3. Delete the profiles row here too, immediately, so cleanup doesn't wait
//      on webhook delivery. Idempotent with the webhook.
//
// Requires CLERK_SECRET_KEY in the function's secrets. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// ============================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const clerkSecret = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecret) {
      return json({ error: "CLERK_SECRET_KEY not configured" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Resolve the caller's identity from their verified token (RLS context).
    const asUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userId, error: idErr } = await asUser.rpc("requesting_user_id");
    if (idErr || !userId || typeof userId !== "string") {
      console.error("[delete-account] Could not resolve caller:", idErr?.message);
      return json({ error: "Unauthorized" }, 401);
    }

    // 2. Delete the Clerk user (source of truth). 404 = already gone → fine.
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${clerkSecret}` },
    });
    if (!clerkRes.ok && clerkRes.status !== 404) {
      const detail = await clerkRes.text();
      console.error("[delete-account] Clerk delete failed:", clerkRes.status, detail);
      return json({ error: "Failed to delete account" }, 502);
    }

    // 3. Delete the profile now — ON DELETE CASCADE clears all per-user tables.
    //    Don't fail the request if this errors: the Clerk user is already gone
    //    and the user.deleted webhook will retry the cleanup.
    const admin = createClient(supabaseUrl, serviceKey);
    const { error: delErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (delErr) {
      console.error("[delete-account] Profile delete failed (webhook will retry):", delErr.message);
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error("[delete-account] Error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
