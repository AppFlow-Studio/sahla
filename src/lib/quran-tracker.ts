import { kv } from './mmkv';
import { TOTAL_MUSHAF_PAGES } from '../db/quranDb';

export type Period = 'day' | 'week' | 'month' | 'year';

export type Goals = {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  /** Seconds a page must be visible before it counts as read. */
  dwellSeconds: number;
};

/** YYYY-MM-DD → unique page numbers read that day. */
export type DailyLog = Record<string, number[]>;

/** Where the user last had the Quran open — used to "Continue Reading". */
export type LastViewed = {
  page: number;
  viewMode: 'list' | 'mushaf';
  surahNumber: number;
  surahName?: string;
};

const GOALS_KEY = 'quran.tracker.goals';
const LOG_KEY = 'quran.tracker.log';
const LAST_VIEWED_KEY = 'quran.tracker.lastViewed';

const DEFAULT_GOALS: Goals = {
  daily: 2,
  weekly: 14,
  monthly: 60,
  yearly: TOTAL_MUSHAF_PAGES, // one khatm/year ≈ 1.65 pages/day
  dwellSeconds: 30,
};

// --- date helpers (local time) ---

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  // Mon = start of week (ISO). getDay(): Sun=0, Mon=1, ..., Sat=6.
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + diff);
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function periodStart(period: Period, d: Date): Date {
  switch (period) {
    case 'day': {
      const out = new Date(d);
      out.setHours(0, 0, 0, 0);
      return out;
    }
    case 'week':
      return startOfWeek(d);
    case 'month':
      return startOfMonth(d);
    case 'year':
      return startOfYear(d);
  }
}

function eachDateKey(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    keys.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

// --- subscription (so screens can re-render on writes) ---

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() {
  for (const l of listeners) l();
}
export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// --- core API ---

export function getGoals(): Goals {
  const stored = kv.getJSON<Partial<Goals>>(GOALS_KEY);
  return { ...DEFAULT_GOALS, ...(stored ?? {}) };
}

export function setGoals(partial: Partial<Goals>): Goals {
  const next = { ...getGoals(), ...partial };
  // Clamp to sane positive ints; dwell minimum 5s.
  next.daily = Math.max(1, Math.floor(next.daily));
  next.weekly = Math.max(1, Math.floor(next.weekly));
  next.monthly = Math.max(1, Math.floor(next.monthly));
  next.yearly = Math.max(1, Math.floor(next.yearly));
  next.dwellSeconds = Math.max(5, Math.floor(next.dwellSeconds));
  kv.setJSON(GOALS_KEY, next);
  emit();
  return next;
}

export function getLog(): DailyLog {
  return kv.getJSON<DailyLog>(LOG_KEY) ?? {};
}

/**
 * Record a single page as read on `date` (default: now). Pages are deduped
 * per-day, so re-reading the same page on the same day doesn't inflate
 * progress. Re-reads on a different day still count.
 */
export function recordPage(page: number, date: Date = new Date()): void {
  if (!Number.isFinite(page) || page < 1 || page > TOTAL_MUSHAF_PAGES) return;
  const log = getLog();
  const key = isoDate(date);
  const day = log[key] ?? [];
  if (day.includes(page)) return;
  day.push(page);
  log[key] = day;
  kv.setJSON(LOG_KEY, log);
  emit();
}

// --- derived stats ---

export function getPagesForDate(d: Date = new Date()): number {
  return getLog()[isoDate(d)]?.length ?? 0;
}

export function getPeriodPages(
  period: Period,
  d: Date = new Date()
): number {
  const log = getLog();
  const start = periodStart(period, d);
  const keys = eachDateKey(start, d);
  let total = 0;
  for (const k of keys) total += log[k]?.length ?? 0;
  return total;
}

export function getGoalForPeriod(period: Period, goals: Goals = getGoals()): number {
  switch (period) {
    case 'day':
      return goals.daily;
    case 'week':
      return goals.weekly;
    case 'month':
      return goals.monthly;
    case 'year':
      return goals.yearly;
  }
}

/**
 * Days-in-a-row hitting the daily goal, ending today (or yesterday if today
 * isn't done yet — so a partial day doesn't break the streak).
 */
export function getStreak(): number {
  const log = getLog();
  const goal = getGoals().daily;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if ((log[isoDate(cursor)]?.length ?? 0) < goal) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while ((log[isoDate(cursor)]?.length ?? 0) >= goal) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTotalPages(): number {
  const log = getLog();
  let total = 0;
  for (const k in log) total += log[k]!.length;
  return total;
}

export type KhatmStats = {
  /** Total mushaf pages read all-time (sum of unique pages per day). */
  totalPages: number;
  /** How many full khatms completed (totalPages / 604, floored). */
  completedKhatms: number;
  /** Pages into the current in-progress khatm. */
  pagesIntoCurrent: number;
  /** Percent of current khatm completed (0–100). */
  currentPercent: number;
};

export function getKhatmStats(): KhatmStats {
  const totalPages = getTotalPages();
  const completedKhatms = Math.floor(totalPages / TOTAL_MUSHAF_PAGES);
  const pagesIntoCurrent = totalPages % TOTAL_MUSHAF_PAGES;
  const currentPercent = (pagesIntoCurrent / TOTAL_MUSHAF_PAGES) * 100;
  return { totalPages, completedKhatms, pagesIntoCurrent, currentPercent };
}

export type MonthArchive = {
  /** YYYY-MM */
  month: string;
  label: string; // "Mar 2026"
  pages: number;
  daysHit: number; // days that met the daily goal
  totalDays: number;
  goalDaily: number;
};

/**
 * Past months (most recent first), excluding the current month. Derived from
 * the log on every call — the log is the source of truth, this is a view.
 */
export function getMonthArchive(): MonthArchive[] {
  const log = getLog();
  const goalDaily = getGoals().daily;
  const buckets = new Map<string, { pages: number; daysHit: number; totalDays: number }>();
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  for (const dateKey of Object.keys(log)) {
    const monthKey = dateKey.slice(0, 7); // YYYY-MM
    if (monthKey === currentMonthKey) continue;
    const count = log[dateKey]!.length;
    const bucket = buckets.get(monthKey) ?? { pages: 0, daysHit: 0, totalDays: 0 };
    bucket.pages += count;
    bucket.totalDays += 1;
    if (count >= goalDaily) bucket.daysHit += 1;
    buckets.set(monthKey, bucket);
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, b]) => {
      const [y, m] = month.split('-');
      return {
        month,
        label: `${monthNames[Number(m) - 1]} ${y}`,
        pages: b.pages,
        daysHit: b.daysHit,
        totalDays: b.totalDays,
        goalDaily,
      };
    });
}

// --- last-viewed (resume "Continue Reading") ---

export function getLastViewed(): LastViewed | null {
  return kv.getJSON<LastViewed>(LAST_VIEWED_KEY);
}

export function setLastViewed(v: LastViewed): void {
  if (!Number.isFinite(v.page) || !Number.isFinite(v.surahNumber)) return;
  kv.setJSON(LAST_VIEWED_KEY, v);
  emit();
}

/** Wipe everything — useful for a "reset" affordance in the UI. */
export function resetAll(): void {
  kv.delete(GOALS_KEY);
  kv.delete(LOG_KEY);
  kv.delete(LAST_VIEWED_KEY);
  emit();
}
