-- content_items: structured recurrence so admins can schedule programs that
-- repeat on patterns the old `days[]`/`is_weekly_program` pair can't express —
-- "every other Tuesday" (interval > 1) and "last Thursday of the month"
-- (monthly by week-of-month).
--
-- The existing model only knew two shapes: one-time (start_date) and
-- every-week (is_weekly_program + days[]). These columns generalize that while
-- staying backward compatible: occurrence dates are computed from the rule, no
-- materialized table yet (that arrives with the per-date RSVP flow).
--
--   recurrence_freq      'once' | 'weekly' | 'monthly'
--   recurrence_interval  every N weeks/months (1 = every, 2 = every other)
--   recurrence_anchor    reference date for weekly parity (which weeks count
--                        when interval > 1); ignored for interval = 1
--   week_of_month        monthly only: 1..4, or -1 for "last"
--
-- Which weekday(s) the program lands on continues to live in the existing
-- `days` text[]. is_weekly_program is kept in sync (true when freq <> 'once')
-- so existing reads (discover, programs-section) keep working unchanged.

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS recurrence_freq text NOT NULL DEFAULT 'once'
    CHECK (recurrence_freq IN ('once', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_interval integer NOT NULL DEFAULT 1
    CHECK (recurrence_interval >= 1),
  ADD COLUMN IF NOT EXISTS recurrence_anchor date,
  ADD COLUMN IF NOT EXISTS week_of_month integer
    CHECK (week_of_month IS NULL OR week_of_month IN (1, 2, 3, 4, -1));

-- Backfill: existing recurring programs were all plain weekly (interval 1).
UPDATE public.content_items
  SET recurrence_freq = 'weekly'
  WHERE is_weekly_program = true
    AND recurrence_freq = 'once';
