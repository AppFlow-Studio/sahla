import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  type NotificationKey,
  resolveMessage,
  type TemplateOverride,
} from "../_shared/automated-notifications.ts";
import {
  addDays,
  type ContentRow,
  dayKey,
  localNow,
  occursOn,
  OFFSET_MINUTES,
  to12Hour,
  toMinutes,
  whenPhrase,
} from "../_shared/content-schedule.ts";

/**
 * Sends program and event reminders. Runs every minute via pg_cron.
 *
 * Members turn on the bell for a piece of content (`content_notifications`) and
 * optionally pick their own timings (`content_notification_settings`); with no
 * timings of their own they get the mosque's `default_reminder_min`.
 *
 * Occurrences are computed on the fly rather than queued in advance, so moving
 * a program to a different night can't leave a stale reminder behind:
 *   - event   → every date from `start_date` to `end_date` at `start_time`
 *   - program → every weekday in `days[]` at `start_time`, inside the
 *               start_date/end_date window when one is set
 *
 * Delivery is at-most-once: a row in `content_notifications_sent` is CLAIMED
 * before sending, so overlapping cron runs can't double-send.
 *
 * Copy comes from `automated_notification_templates` when the masjid has
 * edited it, and from the shared catalogue's defaults otherwise.
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
      const now = localNow(tz);
      const nowMin = toMinutes(now.hm)!;

      const { data: configRow } = await supabase
        .from("mosque_notification_config")
        .select("program_notif_enabled, event_notif_enabled, default_reminder_min")
        .eq("mosque_id", mosque.id)
        .maybeSingle();
      // No config row is the common case for a new masjid — treat it as "on",
      // matching the column defaults rather than silently sending nothing.
      const programsOn = configRow?.program_notif_enabled ?? true;
      const eventsOn = configRow?.event_notif_enabled ?? true;
      const defaultOffset = configRow?.default_reminder_min ?? 30;
      if (!programsOn && !eventsOn) continue;

      const { data: items } = await supabase
        .from("content_items")
        .select("content_id, type, name, days, start_date, end_date, start_time")
        .eq("mosque_id", mosque.id)
        .in("type", ["program", "event"])
        .not("start_time", "is", null);
      if (!items || items.length === 0) continue;

      // A masjid's edited copy, if any, for both reminder kinds.
      const { data: templateRows } = await supabase
        .from("automated_notification_templates")
        .select("notification_key, title, body, enabled")
        .eq("mosque_id", mosque.id)
        .in("notification_key", ["content.program_reminder", "content.event_reminder"]);
      const templates = new Map<string, TemplateOverride>(
        (templateRows ?? []).map((t: TemplateOverride) => [t.notification_key, t]),
      );

      // Today covers offsets up to now; tomorrow is what makes "1 day before"
      // (and any offset that crosses midnight) fire at the right minute.
      const tomorrow = { date: addDays(now.date, 1), weekday: dayKey(
        new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" })
          .format(new Date(Date.now() + 86400_000)),
      ) };

      for (const item of items as ContentRow[]) {
        const isEvent = item.type === "event";
        if (isEvent && !eventsOn) continue;
        if (!isEvent && !programsOn) continue;

        const startMin = toMinutes(item.start_time);
        if (startMin == null) continue;

        for (const day of [
          { date: now.date, weekday: now.weekday, dayOffset: 0 },
          { date: tomorrow.date, weekday: tomorrow.weekday, dayOffset: 1 },
        ]) {
          if (!occursOn(item, day.date, day.weekday)) continue;

          // Minutes from now until this occurrence starts.
          const untilStart = startMin + day.dayOffset * 1440 - nowMin;
          if (untilStart < 0) continue;

          // Which configured timing lands exactly on this minute?
          const dueLabel = Object.keys(OFFSET_MINUTES).find(
            (label) => OFFSET_MINUTES[label] === untilStart,
          );
          const dueByDefault = untilStart === defaultOffset;
          if (!dueLabel && !dueByDefault) continue;

          // Claim before sending — at-most-once across overlapping runs.
          const { data: claim, error: claimErr } = await supabase
            .from("content_notifications_sent")
            .upsert(
              {
                mosque_id: mosque.id,
                content_id: item.content_id,
                occurrence_date: day.date,
                offset_minutes: untilStart,
              },
              { onConflict: "content_id,occurrence_date,offset_minutes", ignoreDuplicates: true },
            )
            .select("id");
          if (claimErr) {
            console.error("claim error:", claimErr.message);
            continue;
          }
          if (!claim || claim.length === 0) continue; // already handled

          // Everyone with the bell on for this content.
          const { data: optIns } = await supabase
            .from("content_notifications")
            .select("user_id")
            .eq("content_id", item.content_id)
            .eq("mosque_id", mosque.id);
          const optedIn = [...new Set((optIns ?? []).map((o: { user_id: string }) => o.user_id))];
          if (optedIn.length === 0) continue;

          // Their own timings, where they set any. No row means "use the
          // mosque default", which is why the settings row is never
          // pre-created (see the app's useToggleContentNotif).
          const { data: settingsRows } = await supabase
            .from("content_notification_settings")
            .select("user_id, notification_settings")
            .eq("content_id", item.content_id)
            .in("user_id", optedIn);
          const chosen = new Map<string, string[]>(
            (settingsRows ?? []).map((r: { user_id: string; notification_settings: string[] | null }) => [
              r.user_id,
              r.notification_settings ?? [],
            ]),
          );

          const recipients = optedIn.filter((userId) => {
            const own = chosen.get(userId);
            if (own && own.length > 0) return dueLabel != null && own.includes(dueLabel);
            return dueByDefault;
          });
          if (recipients.length === 0) continue;

          const { data: tokenRows } = await supabase
            .from("push_tokens")
            .select("token")
            .in("user_id", recipients)
            .eq("mosque_id", mosque.id)
            .eq("is_active", true);
          const pushTokens = [...new Set((tokenRows ?? []).map((t: { token: string }) => t.token))];
          if (pushTokens.length === 0) continue;

          const key: NotificationKey = isEvent
            ? "content.event_reminder"
            : "content.program_reminder";
          const message = resolveMessage(
            key,
            {
              name: item.name,
              masjid: mosque.name,
              time: to12Hour(item.start_time!),
              when: whenPhrase(untilStart),
            },
            templates.get(key),
          );
          // null means the masjid switched this reminder off in the CRM. The
          // claim above stays, so we don't re-check it every minute.
          if (!message) continue;

          const sent = await sendExpoPush(supabase, pushTokens, message.title, message.body);
          totalSent += sent;
          await supabase
            .from("content_notifications_sent")
            .update({ recipient_count: sent })
            .eq("content_id", item.content_id)
            .eq("occurrence_date", day.date)
            .eq("offset_minutes", untilStart);
          fired.push(`${mosque.id}:${item.name}:${untilStart}m=${pushTokens.length}`);
        }
      }
    }

    // Safety-net cleanup of stale ledger rows.
    const cutoff = addDays(new Date().toISOString().slice(0, 10), -7);
    await supabase.from("content_notifications_sent").delete().lt("occurrence_date", cutoff);

    return new Response(JSON.stringify({ success: true, sent: totalSent, fired }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-content-notifications error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
