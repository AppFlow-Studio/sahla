import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getGoals, recordPage, setLastViewed } from '../lib/quran-tracker';

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
