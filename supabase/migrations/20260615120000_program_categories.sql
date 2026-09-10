-- Admin-managed "Programs" category cards shown on the Discover home screen.
-- Replaces the previously hardcoded Kids / Youth / Adults cards with per-mosque
-- rows so admins can customize the cover image, title, background color, order,
-- and which audience filter the card opens into.
--
-- RLS mirrors speaker_data: public read (every app user sees the cards), and
-- mosque-admin write scoped by requesting_mosque_uuid() (the caller's Clerk org
-- → mosque). When a mosque has no rows configured the app falls back to the
-- bundled default cards, so this table can start empty.

CREATE TABLE IF NOT EXISTS public.program_categories (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id   TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  image_url   TEXT,
  bg_color    TEXT,
  -- Which Discover "Programs" tab filter the card opens into.
  audience_filter TEXT NOT NULL DEFAULT 'All'
    CHECK (audience_filter IN ('All','Kids','Youth','Adults')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_program_categories_mosque_order
  ON public.program_categories (mosque_id, sort_order);

ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read the cards (regular users have no Clerk org).
DROP POLICY IF EXISTS "program_categories_public_read" ON public.program_categories;
CREATE POLICY "program_categories_public_read" ON public.program_categories
  FOR SELECT USING (true);

-- Mosque admins manage their own mosque's cards.
DROP POLICY IF EXISTS "program_categories_mosque_write" ON public.program_categories;
CREATE POLICY "program_categories_mosque_write" ON public.program_categories
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());

-- Keep updated_at fresh on edits.
CREATE OR REPLACE FUNCTION public.touch_program_categories_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_program_categories_touch ON public.program_categories;
CREATE TRIGGER trg_program_categories_touch
  BEFORE UPDATE ON public.program_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_program_categories_updated_at();
