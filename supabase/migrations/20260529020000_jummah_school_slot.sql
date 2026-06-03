-- Distinguish the (optional) school jummah from the up-to-3 regular jummahs.
-- Each mosque can configure up to 3 regular jummahs + 1 school jummah; the
-- home-page Jummah card is driven entirely by these rows (shown Thu Maghrib →
-- Fri Asr when at least one slot exists).
ALTER TABLE public.jummah
  ADD COLUMN IF NOT EXISTS is_school boolean NOT NULL DEFAULT false;
