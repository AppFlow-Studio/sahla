ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS is_weekly_program boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.content_items.is_weekly_program IS
  'True for programs that recur weekly. Surfaced as a separate "Weekly programs" section in the Discover Programs tab when an audience filter is active.';
