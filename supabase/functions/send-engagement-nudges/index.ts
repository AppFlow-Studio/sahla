import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Engagement-nudge sender — NT-ENGAGE-01.
 *
 * Mirrors send-prayer-notifications:
 *   - cron-invoked every 15 minutes (see migration 20260628120100)
 *   - resolves "now" in each mosque's own timezone
 *   - CLAIMS a row in engagement_nudges_sent before pushing — at-most-once
 *     across overlapping runs / retries
 *   - sends via the Expo push API; deactivates DeviceNotRegistered tokens
 *
 * First nudge type shipped: 'quran_goal' — "X more pages to hit your goal".
 * Fires once per (user, day) when:
 *   - user has engagement_nudges_enabled = true
 *   - user has at least one active push_tokens row
 *   - user's quran_daily_goal is > 0
 *   - user's user_daily_reading_progress for LOCAL today is short of goal
 *   - current LOCAL time is inside the v1 send window (08:00 — 20:00 local)
 *
 * Adding the next engagement-nudge type (streaks, re-engagement) is a new
 * branch in the per-user loop — no schema change required as long as the
 * `nudge_type` + `period_key` discriminator stays unique-per-period.
 *
 * Kill-switch: env var ENGAGEMENT_NUDGES_ENABLED=false short-circuits at the
 * top. Deploy with verify_jwt = false so the cron can invoke it (see
 * supabase/config.toml).
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// v1 send-window — replace with RC-MA preferred_times once that flow ships.
const SEND_WINDOW_START_HOUR = 8;
const SEND_WINDOW_END_HOUR = 20;

const QURAN_GOAL_NUDGE = "quran_goal";

/** Local YYYY-MM-DD date and integer hour (0–23) in the given IANA timezone. */
function localNow(tz: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hh = get("hour");
  if (hh === "24") hh = "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, hour: parseInt(hh, 10) };
}

// deno-lint-ignore no-explicit-any
type Supa = any;

/** Sends a batch of Expo push messages; deactivates dead tokens. Returns count sent. */
async function sendExpoPush(
  supabase: Supa,
  tokens: string[],
  title: string,
  body: string,
): Promise<number> {
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const messages = batch.map((to) => ({ to, title, body, sound: "default", priority: "high" }));
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.error("Expo push HTTP error:", res.status, await res.text());
      continue;
    }
    const json = await res.json();
    const tickets: { status: string; details?: { error?: string } }[] = json?.data ?? [];
    const dead: string[] = [];
    tickets.forEach((ticket, idx) => {
      if (ticket.status === "ok") {
        sent += 1;
      } else if (ticket.details?.error === "DeviceNotRegistered") {
        dead.push(batch[idx]);
      }
    });
    if (dead.length > 0) {
      await supabase.from("push_tokens").update({ is_active: false }).in("token", dead);
    }
  }
  return sent;
}

function quranGoalMessage(remaining: number, mosqueName: string | null): { title: string; body: string } {
  const pageWord = remaining === 1 ? "page" : "pages";
  const at = mosqueName ? ` at ${mosqueName}` : "";
  return {
    title: `${remaining} more ${pageWord} to hit your Quran goal`,
    body: `Almost there — open the Quran${at} to finish today's reading.`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (Deno.env.get("ENGAGEMENT_NUDGES_ENABLED") === "false") {
    return new Response(JSON.stringify({ success: true, skipped: "kill-switch" }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: mosques, error: mErr } = await supabase
      .from("mosques")
      .select("id, name, timezone");
    if (mErr) throw new Error(mErr.message);

    let totalSent = 0;
    const fired: string[] = [];

    for (const mosque of mosques ?? []) {
      const tz = mosque.timezone || "America/New_York";
      const { date: today, hour } = localNow(tz);

      // Skip mosques whose LOCAL clock is outside the send window. This is
      // the only way to honor "don't ping people at midnight" without a
      // per-user quiet-hours table yet.
      if (hour < SEND_WINDOW_START_HOUR || hour >= SEND_WINDOW_END_HOUR) continue;

      // Pull all candidate users in one query — users in this mosque with
      // nudges enabled, joined to their goal + today's progress.
      const { data: prefs } = await supabase
        .from("user_notification_preferences")
        .select("user_id, engagement_nudges_enabled")
        .eq("mosque_id", mosque.id)
        .eq("engagement_nudges_enabled", true);

      const candidateUserIds = (prefs ?? []).map((p: { user_id: string }) => p.user_id);
      if (candidateUserIds.length === 0) continue;

      const { data: goalRows } = await supabase
        .from("user_preferences")
        .select("user_id, quran_daily_goal")
        .eq("mosque_id", mosque.id)
        .in("user_id", candidateUserIds);
      const goalMap = new Map<string, number>(
        (goalRows ?? []).map((g: { user_id: string; quran_daily_goal: number }) => [g.user_id, g.quran_daily_goal ?? 0]),
      );

      const { data: progressRows } = await supabase
        .from("user_daily_reading_progress")
        .select("user_id, pages_read")
        .eq("mosque_id", mosque.id)
        .eq("date", today)
        .in("user_id", candidateUserIds);
      const progressMap = new Map<string, number>(
        (progressRows ?? []).map((r: { user_id: string; pages_read: number }) => [r.user_id, r.pages_read ?? 0]),
      );

      for (const userId of candidateUserIds) {
        const goal = goalMap.get(userId) ?? 0;
        if (goal <= 0) continue;
        const pagesRead = progressMap.get(userId) ?? 0;
        const remaining = goal - pagesRead;
        if (remaining <= 0) continue; // goal met — no nudge

        // Claim before sending — at-most-once per (user, mosque, type, day).
        const { data: claim, error: claimErr } = await supabase
          .from("engagement_nudges_sent")
          .upsert(
            {
              user_id: userId,
              mosque_id: mosque.id,
              nudge_type: QURAN_GOAL_NUDGE,
              period_key: today,
            },
            { onConflict: "user_id,mosque_id,nudge_type,period_key", ignoreDuplicates: true },
          )
          .select("id");
        if (claimErr) {
          console.error("claim error:", claimErr.message);
          continue;
        }
        if (!claim || claim.length === 0) continue; // already nudged today

        const { data: tokenRows } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", userId)
          .eq("mosque_id", mosque.id)
          .eq("is_active", true);
        const pushTokens = [
          ...new Set((tokenRows ?? []).map((t: { token: string }) => t.token)),
        ];
        if (pushTokens.length === 0) continue;

        const { title, body } = quranGoalMessage(remaining, mosque.name);
        totalSent += await sendExpoPush(supabase, pushTokens, title, body);
        fired.push(`${mosque.id}:${userId}:${QURAN_GOAL_NUDGE}=${pushTokens.length}`);
      }
    }

    // Safety-net cleanup: drop ledger rows older than 30 days. Same shape as
    // prayer_notifications_sent's cleanup; engagement keeps a longer window
    // because the period_key is one-per-day rather than one-per-minute.
    const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
    await supabase.from("engagement_nudges_sent").delete().lt("sent_at", cutoff);

    return new Response(JSON.stringify({ success: true, sent: totalSent, fired }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-engagement-nudges error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
