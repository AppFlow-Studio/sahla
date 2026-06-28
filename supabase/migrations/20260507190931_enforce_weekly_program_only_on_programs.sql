ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_weekly_only_on_programs
  CHECK (is_weekly_program = false OR type = 'program');
