-- CRM-V1-MIGRATIONS: donations.project_id FK — additive.
-- Existing text[] column stays untouched; new donations use the FK. Old data
-- not backfilled. Partial index keeps the FK lookup cheap.
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

ALTER TABLE public.donations
  ADD COLUMN project_id UUID REFERENCES public.projects(project_id) ON DELETE SET NULL;

CREATE INDEX idx_donations_project ON public.donations(project_id) WHERE project_id IS NOT NULL;
