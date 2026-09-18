import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/**
 * Answers "does this person already have an account at THIS masjid?".
 *
 * Every masjid app is backed by the same Clerk instance and separated only by
 * a Clerk Organization, so "the email exists in Clerk" is NOT the same as
 * "the email belongs to this masjid". Sign-in and password-reset both need the
 * second answer before they let someone into a tenant, otherwise the session
 * carries no `org_id` claim and every RLS-protected write fails downstream.
 *
 * Required env: CLERK_SECRET_KEY
 *
 * Body: { org_id: string, email?: string, user_id?: string }
 * Returns: { member: boolean }
 *
 * Deliberately returns only `member` — never whether the email exists in Clerk
 * at all — so this cannot be used to enumerate accounts across other masjids.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { org_id, email, user_id } = await req.json();

    if (!org_id || (!email && !user_id)) {
      return json({ error: "org_id and one of email / user_id are required" }, 400);
    }

    const clerkSecret = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecret) {
      return json({ error: "CLERK_SECRET_KEY not configured" }, 500);
    }

    const clerk = (path: string) =>
      fetch(`https://api.clerk.com/v1${path}`, {
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          "Content-Type": "application/json",
        },
      });

    // Resolve the email to Clerk user ids. An email can map to more than one
    // user (the same address has been re-registered across environments), so
    // membership is true if ANY of them is in the org.
    let userIds: string[] = user_id ? [user_id] : [];

    if (!user_id && email) {
      const res = await clerk(
        `/users?email_address=${encodeURIComponent(email)}&limit=10`,
      );
      if (!res.ok) {
        console.error("[check-masjid-membership] user lookup failed", await res.text());
        return json({ error: "Lookup failed" }, 502);
      }
      const users = await res.json();
      userIds = (Array.isArray(users) ? users : []).map((u: { id: string }) => u.id);
    }

    for (const id of userIds) {
      const res = await clerk(
        `/organizations/${org_id}/memberships?user_id=${encodeURIComponent(id)}`,
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data?.data) && data.data.length > 0) {
        return json({ member: true });
      }
    }

    return json({ member: false });
  } catch (err) {
    console.error("[check-masjid-membership] Error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
