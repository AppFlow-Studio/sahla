import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Drain worker for the scheduled_notifications queue ──────────────────
//
// Invoked by the per-minute cron (scheduled sends) and inline by the
// /api/crm/notifications/send route (immediate sends). It NEVER accepts a push
// payload over the wire — it only drains rows that the auth-gated enqueue path
// already wrote. That's why it can run with verify_jwt = false safely.
//
// Per call it: claims due `pending` rows (compare-and-swap so cron and the
// inline call never double-send the same row), resolves the audience to active
// Expo push tokens, pushes via exp.host in batches of 100, writes the
// `notification_sent` activity_log row, bumps the source template, and
// deactivates tokens Expo reports as DeviceNotRegistered.

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;
const MAX_ROWS_PER_RUN = 25;
const MAX_ATTEMPTS = 3;

type ScheduledRow = {
  id: number;
  mosque_id: string;
  title: string;
  body: string;
  audience_type: "all" | "program" | "event";
  audience_target: string | null;
  audience_label: string | null;
  template_id: number | null;
  created_by: string | null;
  actor_name: string | null;
  attempts: number;
};

type ExpoTicket =
  | { status: "ok"; id?: string }
  | { status: "error"; message?: string; details?: { error?: string } };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Resolve a row's audience to a deduped list of active Expo push tokens.
async function resolveTokens(row: ScheduledRow): Promise<string[]> {
  if (row.audience_type === "all") {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("mosque_id", row.mosque_id)
      .eq("is_active", true);
    if (error) throw new Error(`token query failed: ${error.message}`);
    return dedupe((data ?? []).map((r) => r.token as string));
  }

  // program / event — recipients are the (non-canceled) RSVPs for that content.
  const { data: rsvps, error: rsvpErr } = await supabase
    .from("rsvps")
    .select("user_id")
    .eq("mosque_id", row.mosque_id)
    .eq("content_id", row.audience_target)
    .neq("status", "canceled");
  if (rsvpErr) throw new Error(`rsvp query failed: ${rsvpErr.message}`);

  const userIds = dedupe((rsvps ?? []).map((r) => r.user_id as string));
  if (userIds.length === 0) return [];

  const { data: tokens, error: tokErr } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("mosque_id", row.mosque_id)
    .eq("is_active", true)
    .in("user_id", userIds);
  if (tokErr) throw new Error(`token query failed: ${tokErr.message}`);
  return dedupe((tokens ?? []).map((r) => r.token as string));
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

// Push one notification to every token; returns per-token outcomes aligned with
// the input order so we can map errors back to tokens.
async function pushToExpo(
  tokens: string[],
  title: string,
  body: string
): Promise<{ sent: number; failed: number; deadTokens: string[] }> {
  let sent = 0;
  let failed = 0;
  const deadTokens: string[] = [];

  for (const batch of chunk(tokens, EXPO_BATCH_SIZE)) {
    const messages = batch.map((to) => ({ to, title, body, sound: "default" }));
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      // Whole batch rejected (e.g. 429/5xx). Count as failed; the row stays
      // retryable so the next drain re-attempts.
      throw new Error(`Expo returned ${res.status}: ${await res.text()}`);
    }

    const payload = (await res.json()) as { data?: ExpoTicket[] };
    const tickets = payload.data ?? [];
    tickets.forEach((ticket, i) => {
      if (ticket.status === "ok") {
        sent++;
      } else {
        failed++;
        if (ticket.details?.error === "DeviceNotRegistered") {
          deadTokens.push(batch[i]);
        }
      }
    });
  }

  return { sent, failed, deadTokens };
}

async function deliverRow(row: ScheduledRow): Promise<void> {
  const tokens = await resolveTokens(row);

  let sent = 0;
  let failed = 0;
  if (tokens.length > 0) {
    const result = await pushToExpo(tokens, row.title, row.body);
    sent = result.sent;
    failed = result.failed;

    if (result.deadTokens.length > 0) {
      await supabase
        .from("push_tokens")
        .update({ is_active: false })
        .eq("mosque_id", row.mosque_id)
        .in("token", result.deadTokens);
    }
  }

  // History row the CRM Notifications page + Home feed read from.
  const { data: activityRow } = await supabase
    .from("activity_log")
    .insert({
      mosque_id: row.mosque_id,
      actor_id: row.created_by,
      actor_name: row.actor_name ?? "An admin",
      action: "notification_sent",
      entity_type: "notification",
      entity_name: row.title,
      metadata: {
        body: row.body,
        audience_label: row.audience_label,
        audience_type: row.audience_type,
        recipient_count: tokens.length,
        sent_count: sent,
        failed_count: failed,
        template_id: row.template_id,
        scheduled_notification_id: row.id,
      },
    })
    .select("id")
    .single();

  // Bump the source template's usage on a real send.
  if (row.template_id) {
    const { data: tpl } = await supabase
      .from("notification_templates")
      .select("usage_count")
      .eq("id", row.template_id)
      .eq("mosque_id", row.mosque_id)
      .maybeSingle();
    if (tpl) {
      await supabase
        .from("notification_templates")
        .update({
          usage_count: (tpl.usage_count ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", row.template_id)
        .eq("mosque_id", row.mosque_id);
    }
  }

  await supabase
    .from("scheduled_notifications")
    .update({
      status: "sent",
      recipient_count: tokens.length,
      sent_count: sent,
      failed_count: failed,
      activity_log_id: activityRow?.id ?? null,
      sent_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", row.id);
}

Deno.serve(async () => {
  const nowIso = new Date().toISOString();

  // Find due, still-pending rows.
  const { data: due, error: dueErr } = await supabase
    .from("scheduled_notifications")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(MAX_ROWS_PER_RUN);

  if (dueErr) {
    return Response.json({ error: dueErr.message }, { status: 500 });
  }

  const results: Array<{ id: number; status: string }> = [];

  for (const { id } of due ?? []) {
    // Compare-and-swap claim: only the caller that flips pending→sending owns
    // the row, so the cron and an inline immediate-send call never collide.
    const { data: claimed } = await supabase
      .from("scheduled_notifications")
      .update({ status: "sending" })
      .eq("id", id)
      .eq("status", "pending")
      .select(
        "id, mosque_id, title, body, audience_type, audience_target, audience_label, template_id, created_by, actor_name, attempts"
      )
      .maybeSingle();

    if (!claimed) continue; // someone else claimed it first

    const row = claimed as ScheduledRow;
    try {
      await deliverRow(row);
      results.push({ id: row.id, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const attempts = (row.attempts ?? 0) + 1;
      const giveUp = attempts >= MAX_ATTEMPTS;
      // Retry transient failures by returning the row to the queue; give up
      // after MAX_ATTEMPTS so a permanently-broken row can't loop forever.
      await supabase
        .from("scheduled_notifications")
        .update({
          status: giveUp ? "failed" : "pending",
          attempts,
          error: message,
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: giveUp ? "failed" : "retry" });
    }
  }

  return Response.json({ drained: results.length, results });
});
