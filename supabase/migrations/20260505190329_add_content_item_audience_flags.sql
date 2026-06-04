ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS is_young_professionals boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pace boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_quran boolean NOT NULL DEFAULT false;
