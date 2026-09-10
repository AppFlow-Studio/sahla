import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

/**
 * Bridges the admin pipeline's "go LIVE" action to the app repo's tenant
 * scaffolder. Wired as a Supabase Database Webhook on the `mosques` table
 * (UPDATE). When `onboarding_status` transitions INTO 'live', it fires a
 * GitHub `repository_dispatch` so the `generate-tenant` workflow opens a PR
 * with the new tenant's build config.
 *
 * Required secrets:
 *   GITHUB_DISPATCH_TOKEN  — fine-grained PAT with "Contents: read/write" on the repo
 *   GITHUB_REPO            — e.g. "AppFlow-Studio/sahla"
 *
 * Webhook payload (Supabase): { type, table, record, old_record, schema }
 */
serve(async (req: Request) => {
  try {
    const body = await req.json();
    const record = body.record ?? {};
    const old = body.old_record ?? {};

    // Only react to an actual transition INTO live (idempotent on repeats).
    const becameLive =
      record.onboarding_status === "live" && old.onboarding_status !== "live";
    if (!becameLive) {
      return new Response(JSON.stringify({ skipped: "not a live transition" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = record.slug;
    if (!slug) {
      return new Response(JSON.stringify({ error: "row has no slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("GITHUB_DISPATCH_TOKEN");
    const repo = Deno.env.get("GITHUB_REPO");
    if (!token || !repo) {
      console.error("[notify-mosque-live] missing GITHUB_DISPATCH_TOKEN / GITHUB_REPO");
      return new Response(JSON.stringify({ error: "not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "mosque-live",
        client_payload: { slug, name: record.name ?? null },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[notify-mosque-live] dispatch failed:", res.status, detail);
      return new Response(JSON.stringify({ error: "dispatch failed", detail }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[notify-mosque-live] dispatched mosque-live for ${slug}`);
    return new Response(JSON.stringify({ dispatched: slug }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-mosque-live] error:", err);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
