import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Sets onboarding completion in Clerk user `publicMetadata`.
 *
 * Metadata is org-keyed so one user can onboard per mosque:
 *   publicMetadata[orgId] = { onboarded: true, firstName, joinedAt }
 *
 * Required env: CLERK_SECRET_KEY
 *
 * Body: { user_id: string, org_id: string, first_name: string }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { user_id, org_id, first_name } = await req.json();

    if (!user_id || !org_id) {
      return new Response(
        JSON.stringify({ error: "user_id and org_id are required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const clerkSecret = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecret) {
      return new Response(
        JSON.stringify({ error: "CLERK_SECRET_KEY not configured" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // Fetch current publicMetadata so we merge, not overwrite
    const userRes = await fetch(
      `https://api.clerk.com/v1/users/${user_id}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!userRes.ok) {
      const err = await userRes.json();
      console.error("[sync-onboarding] Failed to fetch user:", err);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user", detail: err }),
        { status: userRes.status, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const userData = await userRes.json();
    const existing = userData.public_metadata ?? {};

    // Merge org-keyed onboarding data
    const updated = {
      ...existing,
      [org_id]: {
        onboarded: true,
        firstName: first_name ?? "",
        joinedAt: new Date().toISOString(),
      },
    };

    // Write back via Clerk Backend API
    const patchRes = await fetch(
      `https://api.clerk.com/v1/users/${user_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_metadata: updated }),
      },
    );

    if (!patchRes.ok) {
      const err = await patchRes.json();
      console.error("[sync-onboarding] Clerk PATCH error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to update metadata", detail: err }),
        { status: patchRes.status, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ status: "synced" }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[sync-onboarding] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
