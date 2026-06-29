-- NT-ENGAGE-01 — Reading-goal data model + daily progress sync.
--
-- The engagement-nudge scheduler (send-engagement-nudges) needs server-side
-- visibility into:
--   1) Each user's per-day Quran page goal — today this lives in MMKV only.
--   2) The user's pages-read count for "today" in their mosque's timezone —
--      currently the dwell-timer / recordPage path only writes locally.
--
-- This migration adds the goal column + the progress table + the per-user RPC
-- the client calls after every recorded page. The RPC writes with the user's
-- LOCAL today (not server `now()`) so a page recorded just before midnight
-- counts toward the day the user was actually reading.

-- 1. Per-user daily Quran page goal. Defaults match the client default in
--    src/lib/quran-tracker.ts (2 pages/day). NOT NULL with a default so the
--    scheduler can read it back without a coalesce.
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS quran_daily_goal int NOT NULL DEFAULT 2;

-- 2. Daily progress ledger. One row per (user, mosque, date). `pages_read`
--    holds the count of DISTINCT pages the user has read on that date in
--    that mosque scope — matches how MMKV's daily log dedupes per-day, so
--    progress is monotonic across the day.
CREATE TABLE IF NOT EXISTS public.user_daily_reading_progress (
  user_id    text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mosque_id  text NOT NULL REFERENCES public.mosques(id)  ON DELETE CASCADE,
  date       date NOT NULL,
  pages_read int  NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mosque_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_reading_progress_date
  ON public.user_daily_reading_progress (date);

-- 3. RLS — users can only read their own progress. Writes happen through the
--    RPC below (SECURITY DEFINER) so no client-side INSERT/UPDATE policies
--    are needed.
ALTER TABLE public.user_daily_reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_daily_reading_progress_user_select"
  ON public.user_daily_reading_progress;
CREATE POLICY "user_daily_reading_progress_user_select"
  ON public.user_daily_reading_progress
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

-- 4. Idempotent upsert RPC. Uses LOCAL `today` from the client (passed in)
--    so the row is attributed to the day the user was actually reading on,
--    even if the request hits the server after midnight server-time. The
--    `pages` argument is the current MMKV-side day total — we GREATEST() it
--    against the existing value so out-of-order calls can't roll progress
--    backward.
CREATE OR REPLACE FUNCTION public.upsert_reading_progress(
  p_date  date,
  p_pages int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   text;
  v_mosque_id text;
BEGIN
  v_user_id   := requesting_user_id();
  v_mosque_id := requesting_mosque_id();

  IF v_user_id IS NULL OR v_mosque_id IS NULL THEN
    RAISE EXCEPTION 'upsert_reading_progress: missing user or mosque context';
  END IF;
  IF p_pages < 0 THEN
    RAISE EXCEPTION 'upsert_reading_progress: pages cannot be negative';
  END IF;

  INSERT INTO public.user_daily_reading_progress (
    user_id, mosque_id, date, pages_read, updated_at
  )
  VALUES (v_user_id, v_mosque_id, p_date, p_pages, now())
  ON CONFLICT (user_id, mosque_id, date) DO UPDATE
    SET pages_read = GREATEST(public.user_daily_reading_progress.pages_read, EXCLUDED.pages_read),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_reading_progress(date, int) TO anon, authenticated;
