-- Links Discover "Program" cards (program_categories) to the actual program
-- content_items they contain. Many-to-many: a program can appear under multiple
-- cards, and a card lists many programs. This is what makes the cards act as
-- real, content-filtering categories in the app's Programs tab (replacing the
-- hardcoded Kids/Youth/Adults audience filters for programs).
--
-- RLS mirrors program_categories: public read (every app user sees assignments)
-- and mosque-admin write scoped by requesting_mosque_uuid().

CREATE TABLE IF NOT EXISTS public.program_category_content (
  category_id UUID NOT NULL
    REFERENCES public.program_categories(id) ON DELETE CASCADE,
  content_id  UUID NOT NULL
    REFERENCES public.content_items(content_id) ON DELETE CASCADE,
  mosque_id   TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (category_id, content_id)
);

-- Reverse lookups (which cards a program belongs to) and mosque-scoped reads.
CREATE INDEX IF NOT EXISTS idx_pcc_content ON public.program_category_content (content_id);
CREATE INDEX IF NOT EXISTS idx_pcc_mosque ON public.program_category_content (mosque_id);

ALTER TABLE public.program_category_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pcc_public_read" ON public.program_category_content;
CREATE POLICY "pcc_public_read" ON public.program_category_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pcc_mosque_write" ON public.program_category_content;
CREATE POLICY "pcc_mosque_write" ON public.program_category_content
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());
