/**
 * Recurrence math for programs & events.
 *
 * A content_item's schedule is described by a small rule (the columns added in
 * migration 20260530000000). This module turns that rule into concrete answers
 * — "does it happen on this date?", "when's the next time?", "how do I label
 * it?" — without materializing occurrence rows. Everything works on plain
 * `YYYY-MM-DD` strings so it stays timezone-agnostic: callers pass dates already
 * resolved in the mosque's timezone (as the display hooks do today).
 */

export type RecurrenceFreq = 'once' | 'weekly' | 'monthly';

/** Weekday names as stored in content_items.days (matches WEEK_DAYS). */
export const WEEK_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Ordinal options for monthly "Nth weekday of the month". -1 = last. */
export const WEEK_OF_MONTH_OPTIONS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
] as const;

export type RecurrenceRule = {
  freq: RecurrenceFreq;
  /** Every N weeks/months. 1 = every, 2 = every other. */
  interval: number;
  /** Weekday(s) the program lands on. */
  days: string[] | null;
  /** Reference date for weekly parity when interval > 1. */
  anchor: string | null;
  /** Monthly only: 1..4, or -1 for "last" weekday of the month. */
  weekOfMonth: number | null;
  /** One-time date (freq === 'once'). */
  startDate: string | null;
  /** Optional active window — recurrence stops after this date. */
  endDate: string | null;
};

// ── Date helpers (UTC math on plain YYYY-MM-DD, no timezone drift) ──────────

/** Parse `YYYY-MM-DD` (ignoring any time suffix) to a UTC Date at midnight. */
function parseDate(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 0 (Sun) .. 6 (Sat). */
function weekday(date: string): number {
  return parseDate(date).getUTCDay();
}

function weekdayName(date: string): string {
  return WEEK_DAY_NAMES[weekday(date)];
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

function daysInMonth(date: string): number {
  const d = parseDate(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/**
 * Which ordinal occurrence of its weekday a date is within its month, counted
 * both ways: { fromStart: 1.. , fromEnd: -1.. }. The 3rd Thursday is
 * { fromStart: 3, fromEnd: -2 } (or -1 if it's also the last Thursday).
 */
function weekdayOrdinalInMonth(date: string): { fromStart: number; fromEnd: number } {
  const dom = parseDate(date).getUTCDate();
  const fromStart = Math.floor((dom - 1) / 7) + 1;
  const remaining = daysInMonth(date) - dom;
  const fromEnd = -(Math.floor(remaining / 7) + 1);
  return { fromStart, fromEnd };
}

// ── Core predicate ──────────────────────────────────────────────────────────

function inWindow(rule: RecurrenceRule, date: string): boolean {
  if (rule.endDate && date > rule.endDate.slice(0, 10)) return false;
  if (rule.anchor && rule.freq !== 'once' && date < rule.anchor.slice(0, 10)) {
    // Before the series began.
    return false;
  }
  return true;
}

/** Does this rule produce an occurrence on the given `YYYY-MM-DD` date? */
export function occursOn(rule: RecurrenceRule, date: string): boolean {
  const day = date.slice(0, 10);

  if (rule.freq === 'once') {
    return !!rule.startDate && rule.startDate.slice(0, 10) === day;
  }

  const days = rule.days ?? [];
  if (!days.includes(weekdayName(day))) return false;
  if (!inWindow(rule, day)) return false;

  const interval = Math.max(1, rule.interval || 1);

  if (rule.freq === 'weekly') {
    if (interval === 1) return true;
    // Parity relative to the anchor week. Without an anchor we can't define
    // "every other", so fall back to every week rather than silently hiding it.
    if (!rule.anchor) return true;
    const weeks = Math.floor(daysBetween(rule.anchor.slice(0, 10), day) / 7);
    return weeks % interval === 0;
  }

  // monthly: must match the configured week-of-month ordinal.
  const { fromStart, fromEnd } = weekdayOrdinalInMonth(day);
  const target = rule.weekOfMonth ?? 1;
  const ordinalMatches = target === -1 ? fromEnd === -1 : fromStart === target;
  if (!ordinalMatches) return false;
  if (interval === 1) return true;
  // Every-other-month parity, counted from the anchor month.
  if (!rule.anchor) return true;
  const a = parseDate(rule.anchor.slice(0, 10));
  const d = parseDate(day);
  const months =
    (d.getUTCFullYear() - a.getUTCFullYear()) * 12 + (d.getUTCMonth() - a.getUTCMonth());
  return months % interval === 0;
}

/**
 * The next date (inclusive of `from`) on which the rule occurs, or null if it
 * never occurs again within `horizonDays`. `from` defaults to scanning forward;
 * callers pass today in mosque-local time.
 */
export function nextOccurrence(
  rule: RecurrenceRule,
  from: string,
  horizonDays = 400,
): string | null {
  if (rule.freq === 'once') {
    const s = rule.startDate?.slice(0, 10) ?? null;
    return s && s >= from.slice(0, 10) ? s : null;
  }
  let cursor = parseDate(from);
  for (let i = 0; i < horizonDays; i++) {
    const key = toKey(cursor);
    if (occursOn(rule, key)) return key;
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return null;
}

// ── Labels ────────────────────────────────────────────────────────────────

function shortDays(days: string[]): string {
  // Keep WEEK_DAY_NAMES order regardless of how they were toggled in.
  return WEEK_DAY_NAMES.filter((d) => days.includes(d))
    .map((d) => d.slice(0, 3))
    .join(', ');
}

const ORDINAL_LABEL: Record<number, string> = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  [-1]: 'last',
};

/**
 * Human label for a recurrence rule, e.g. "Every other Tuesday",
 * "Last Thursday of the month", "Mon, Wed". One-time items return null (the
 * caller shows the date instead).
 */
export function describeRecurrence(rule: RecurrenceRule): string | null {
  if (rule.freq === 'once') return null;
  const days = rule.days ?? [];
  const interval = Math.max(1, rule.interval || 1);

  if (rule.freq === 'weekly') {
    if (days.length === 0) return null;
    const label = shortDays(days);
    if (interval === 1) return label;
    if (interval === 2) {
      return days.length === 1 ? `Every other ${days[0]}` : `Every other week · ${label}`;
    }
    return `Every ${interval} weeks · ${label}`;
  }

  // monthly
  const ord = ORDINAL_LABEL[rule.weekOfMonth ?? 1] ?? 'first';
  const dayName = days[0] ?? 'day';
  const base = `${ord.charAt(0).toUpperCase() + ord.slice(1)} ${dayName} of the month`;
  return interval > 1 ? `${base} (every ${interval} months)` : base;
}

/** Build a rule from the columns on a content_items row. */
export function ruleFromRow(row: {
  recurrence_freq?: string | null;
  recurrence_interval?: number | null;
  recurrence_anchor?: string | null;
  week_of_month?: number | null;
  days?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
}): RecurrenceRule {
  return {
    freq: (row.recurrence_freq as RecurrenceFreq) ?? 'once',
    interval: row.recurrence_interval ?? 1,
    days: row.days ?? null,
    anchor: row.recurrence_anchor ?? null,
    weekOfMonth: row.week_of_month ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
  };
}
