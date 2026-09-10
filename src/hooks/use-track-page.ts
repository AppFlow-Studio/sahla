import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getGoals, getPagesForDate, recordPage, setLastViewed } from '../lib/quran-tracker';
import { useSupabase } from './use-supabase';

/** ISO YYYY-MM-DD in LOCAL time — the date the user was reading on. Server
 *  attribution uses this so a page recorded just before midnight counts to
 *  the day the user was actually engaging, not server `now()`. */
function localIsoDate(d: Date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const SYNC_THROTTLE_MS = 10_000;

type Opts = {
  /** Reading mode the user is currently in. */
  viewMode: 'list' | 'mushaf';
  /** Surah currently containing `page`, if known (so resume can re-open it). */
  surahNumber?: number;
  /** Pretty surah name for display in resume affordances. */
  surahName?: string;
};

/**
 * Records `page` as read once it has been visible for at least
 * `goals.dwellSeconds`. Re-arms whenever the page changes, and pauses while
 * the app is backgrounded (resuming with a fresh timer on return).
 *
 * Also writes the current page to `lastViewed` whenever the resume metadata
 * changes — independent of the dwell timer — so "Continue Reading" can jump
 * back even if the dwell hasn't fired yet, and so the surah-for-page resolver
 * catching up after a swipe still updates the resume target.
 */
export function useTrackPage(
  page: number | null | undefined,
  opts?: Opts
): void {
  const supabase = useSupabase();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<number>(0);
  const inFlightRef = useRef(false);

  // Pushes today's MMKV-side page total up to user_daily_reading_progress so
  // the NT-ENGAGE-01 scheduler can see "X pages read today" without us
  // backing the whole tracker by Supabase. Idempotent + throttled — repeated
  // recordPage()s within 10s coalesce to one RPC, and the RPC itself does a
  // GREATEST() so out-of-order calls can't roll progress backward.
  const syncTodayProgress = async () => {
    if (inFlightRef.current) return;
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_THROTTLE_MS) return;
    inFlightRef.current = true;
    lastSyncRef.current = now;
    try {
      const today = localIsoDate();
      const pages = getPagesForDate();
      // RPC name cast: the function is declared in migration
      // 20260628120000_user_reading_goal_and_progress.sql. Database types
      // (`database.types.ts`) get regenerated *after* a migration is applied
      // to staging — until then the typed RPC list doesn't include this one.
      await supabase.rpc(
        'upsert_reading_progress' as 'requesting_user_id',
        { p_date: today, p_pages: pages } as never,
      );
    } catch {
      // Best-effort; the next recordPage will retry. Failing the sync must
      // never break the in-app dwell-tracker UX.
    } finally {
      inFlightRef.current = false;
    }
  };

  // 1) Dwell timer — re-arms only on actual page changes.
  useEffect(() => {
    if (!page) return;

    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const arm = () => {
      clear();
      const dwellMs = getGoals().dwellSeconds * 1000;
      timerRef.current = setTimeout(() => {
        recordPage(page);
        timerRef.current = null;
        void syncTodayProgress();
      }, dwellMs);
    };

    arm();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') arm();
      else clear();
    });

    return () => {
      clear();
      sub.remove();
    };
  }, [page]);

  // 2) Resume target — updates whenever any of (page, mode, surah) change.
  useEffect(() => {
    if (!page || !opts?.viewMode || !opts.surahNumber) return;
    setLastViewed({
      page,
      viewMode: opts.viewMode,
      surahNumber: opts.surahNumber,
      surahName: opts.surahName,
    });
  }, [page, opts?.viewMode, opts?.surahNumber, opts?.surahName]);
}
