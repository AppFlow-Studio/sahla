import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Adds a user to a Clerk Organization as a member.
 *
 * Called from the app after sign-up so new users are automatically
 * associated with the mosque's Clerk org — no manual invite needed.
 *
 * Required env: CLERK_SECRET_KEY
 *
 * Body: { user_id: string, org_id: string }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { user_id, org_id } = await req.json();

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

    // Check if user is already a member
    const checkRes = await fetch(
      `https://api.clerk.com/v1/organizations/${org_id}/memberships?user_id=${user_id}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.data && checkData.data.length > 0) {
        return new Response(
          JSON.stringify({ status: "already_member" }),
          { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
        );
      }
    }

    // Add user as org:member
    const res = await fetch(
      `https://api.clerk.com/v1/organizations/${org_id}/memberships`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          role: "org:member",
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("[join-org] Clerk API error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to add member", detail: err }),
        { status: res.status, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const membership = await res.json();
    return new Response(
      JSON.stringify({ status: "joined", role: membership.role }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[join-org] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
