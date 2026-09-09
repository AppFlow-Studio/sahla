/**
 * When a program or event actually happens, and which reminder is due right
 * now. Pure and dependency-free so the sender stays thin and this can be
 * exercised directly against real `content_items` rows.
 */

/**
 * The timing labels the app writes into
 * `content_notification_settings.notification_settings`, in minutes before.
 * These strings are the storage contract — see NOTIF_OFFSET_OPTIONS in the app's
 * use-content-notification-settings hook.
 */
export const OFFSET_MINUTES: Record<string, number> = {
  "At start time": 0,
  "5 min before": 5,
  "30 min before": 30,
  "1 hour before": 60,
  "1 day before": 1440,
};

/** How the reminder reads to a member, per offset. */
export function whenPhrase(offset: number): string {
  if (offset === 0) return "now";
  if (offset === 1440) return "tomorrow";
  if (offset === 60) return "in an hour";
  return `in ${offset} minutes`;
}

/** Local date (YYYY-MM-DD), time (HH:MM) and weekday key in a timezone, now. */
export function localNow(tz: string): { date: string; hm: string; weekday: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hh = get("hour");
  if (hh === "24") hh = "00"; // some runtimes emit 24 at midnight
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hm: `${hh}:${get("minute")}`,
    weekday: dayKey(get("weekday")),
  };
}

/**
 * Weekday names in `content_items.days` are whatever the CRM saved — staging
 * holds "Thu" and "Friday" in the same row. Compare on the first three letters,
 * lowercased, so both forms match.
 */
export function dayKey(day: string): string {
  return day.trim().slice(0, 3).toLowerCase();
}

/** 'YYYY-MM-DD' + n days, staying in calendar space (no timezone maths). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 'HH:MM[:SS]' → minutes since midnight, or null. */
export function toMinutes(t: string | null | undefined): number | null {
  if (typeof t !== "string") return null;
  const [h, m] = t.split(":");
  const hh = Number(h);
  const mm = Number(m);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

/** 'HH:MM[:SS]' → "8:00 PM" for the {{time}} variable. */
export function to12Hour(t: string): string {
  const mins = toMinutes(t);
  if (mins == null) return "";
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export type ContentRow = {
  content_id: string;
  type: string | null;
  name: string | null;
  days: string[] | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
};

/**
 * A typo'd year makes a date range span millennia — staging has an event
 * starting "0006-02-08" and ending in 2026. Left alone that reads as "this
 * event runs every day for two thousand years", and anyone with the bell on
 * would get a reminder daily until the end date passes. A date this far off is
 * a data-entry error, not a schedule, so the row is skipped rather than guessed
 * at.
 */
function isPlausibleDate(date: string): boolean {
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year >= 2000 && year <= 2200;
}

/**
 * Does this content run on `date` (a local YYYY-MM-DD)?
 *
 * Events are a date range — a multi-night event reminds on each of its nights.
 * Programs repeat on the weekdays in `days[]`, optionally windowed by
 * start_date/end_date.
 */
export function occursOn(item: ContentRow, date: string, weekday: string): boolean {
  const start = item.start_date?.slice(0, 10) ?? null;
  const end = item.end_date?.slice(0, 10) ?? null;
  if (start && !isPlausibleDate(start)) return false;
  if (end && !isPlausibleDate(end)) return false;

  if (item.type === "event") {
    if (!start) return false;
    return date >= start && date <= (end ?? start);
  }

  // program: recurring by weekday, optionally windowed.
  const days = (item.days ?? []).map(dayKey);
  if (days.length === 0) return false;
  if (!days.includes(weekday)) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}
