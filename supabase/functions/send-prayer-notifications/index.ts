import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Sends prayer-time push notifications. Runs every minute via pg_cron.
 *
 * For each mosque, in the mosque's own timezone, it finds prayers that are due
 * "right now" (to the minute) for each notification kind:
 *   - 'athan'       → athan_time == now
 *   - 'iqamah'      → computed iqamah == now (iqamah_config rule applied to
 *                     athan, falling back to any stored iqamah_time)
 *   - 'reminder_30' → athan_time is 30 minutes from now
 *
 * Then it finds users who opted into that kind (prayer_notification_settings)
 * and pushes to their active Expo tokens. Delivery is at-most-once: it CLAIMS a
 * row in prayer_notifications_sent before sending, so overlapping cron runs
 * can't double-send.
 *
 * Deployed with verify_jwt = false so the cron can invoke it without auth.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Map a notification kind to the token stored in notification_settings[]. */
const KIND_TO_TOKEN: Record<string, string> = {
  athan: "prayer_time",
  iqamah: "iqamah_time",
  reminder_30: "30_min_before",
};

type IqamahRule = {
  prayer_name: string;
  mode: string;
  fixed_time: string | null;
  offset_minutes: number | null;
};

/** Local YYYY-MM-DD date and HH:MM in the given IANA timezone, right now. */
function localNow(tz: string): { date: string; hm: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hh = get("hour");
  if (hh === "24") hh = "00"; // some runtimes emit 24 at midnight
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hm: `${hh}:${get("minute")}` };
}

/** Normalize a 'HH:MM[:SS]' time to 'HH:MM', or null. */
function toHM(t: string | null | undefined): string | null {
  if (typeof t !== "string") return null;
  const [h, m] = t.split(":");
  if (h == null || m == null) return null;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** Add minutes to a 'HH:MM[:SS]' time, wrapping within the day → 'HH:MM'. */
function addMinutes(t: string, mins: number): string | null {
  const base = toHM(t);
  if (!base) return null;
  const [h, m] = base.split(":").map(Number);
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Resolve an iqamah rule against an athan time → 'HH:MM', or null. */
function computeIqamahHM(athan: string, rule: IqamahRule | undefined): string | null {
  if (!rule) return null;
  if (rule.mode === "fixed") return toHM(rule.fixed_time);
  if (rule.mode === "offset" && rule.offset_minutes != null) {
    return addMinutes(athan, rule.offset_minutes);
  }
  return null;
}

function messageFor(
  kind: string,
  prayer: string,
  mosqueName: string | null,
): { title: string; body: string } {
  const at = mosqueName ? ` at ${mosqueName}` : "";
  if (kind === "iqamah") {
    return { title: `${prayer} Iqamah`, body: `Iqamah for ${prayer}${at} is now.` };
  }
  if (kind === "reminder_30") {
    return { title: `${prayer} in 30 minutes`, body: `${prayer}${at} is in 30 minutes.` };
  }
  return { title: prayer, body: `It's time for ${prayer}${at}.` };
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

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
      const { date, hm: nowHM } = localNow(tz);

      const { data: prayers } = await supabase
        .from("todays_prayers")
        .select("prayer_name, athan_time, iqamah_time")
        .eq("mosque_id", mosque.id)
        .eq("date", date);
      if (!prayers || prayers.length === 0) continue;

      const { data: rules } = await supabase
        .from("iqamah_config")
        .select("prayer_name, mode, fixed_time, offset_minutes")
        .eq("mosque_id", mosque.id);
      const ruleMap = new Map<string, IqamahRule>(
        (rules ?? []).map((r: IqamahRule) => [r.prayer_name.toLowerCase(), r]),
      );

      // Which (prayer, kind) are due this minute?
      const due: { prayer: string; kind: string }[] = [];
      for (const p of prayers) {
        const athanHM = toHM(p.athan_time);
        if (!athanHM) continue;
        if (athanHM === nowHM) due.push({ prayer: p.prayer_name, kind: "athan" });

        const iqHM =
          computeIqamahHM(p.athan_time, ruleMap.get(p.prayer_name.toLowerCase())) ??
          toHM(p.iqamah_time);
        if (iqHM && iqHM === nowHM) due.push({ prayer: p.prayer_name, kind: "iqamah" });

        if (addMinutes(nowHM, 30) === athanHM) {
          due.push({ prayer: p.prayer_name, kind: "reminder_30" });
        }
      }

      for (const d of due) {
        // Claim before sending — at-most-once across overlapping runs.
        const { data: claim, error: claimErr } = await supabase
          .from("prayer_notifications_sent")
          .upsert(
            { mosque_id: mosque.id, prayer_name: d.prayer, date, kind: d.kind },
            { onConflict: "mosque_id,prayer_name,date,kind", ignoreDuplicates: true },
          )
          .select("id");
        if (claimErr) {
          console.error("claim error:", claimErr.message);
          continue;
        }
        if (!claim || claim.length === 0) continue; // already handled

        const token = KIND_TO_TOKEN[d.kind];
        const { data: settings } = await supabase
          .from("prayer_notification_settings")
          .select("user_id")
          .eq("mosque_id", mosque.id)
          .ilike("prayer", d.prayer)
          .contains("notification_settings", [token]);
        const userIds = [...new Set((settings ?? []).map((s: { user_id: string }) => s.user_id))];
        if (userIds.length === 0) continue;

        const { data: tokenRows } = await supabase
          .from("push_tokens")
          .select("token")
          .in("user_id", userIds)
          .eq("mosque_id", mosque.id)
          .eq("is_active", true);
        const pushTokens = [...new Set((tokenRows ?? []).map((t: { token: string }) => t.token))];
        if (pushTokens.length === 0) continue;

        const { title, body } = messageFor(d.kind, d.prayer, mosque.name);
        totalSent += await sendExpoPush(supabase, pushTokens, title, body);
        fired.push(`${mosque.id}:${d.prayer}:${d.kind}=${pushTokens.length}`);
      }
    }

    // Safety-net cleanup of stale ledger rows.
    const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString().split("T")[0];
    await supabase.from("prayer_notifications_sent").delete().lt("date", cutoff);

    return new Response(JSON.stringify({ success: true, sent: totalSent, fired }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-prayer-notifications error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
