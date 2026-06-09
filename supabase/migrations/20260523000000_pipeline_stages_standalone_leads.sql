-- Pipeline stages should work standalone for leads/demos without requiring
-- a mosques row. Leads only become mosques when they reach onboarding.

-- 1. Add lead-specific columns so pipeline_stages can hold mosque info directly
ALTER TABLE public.pipeline_stages
  ADD COLUMN IF NOT EXISTS mosque_name text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text;

-- 2. Backfill existing rows from the mosques join
UPDATE public.pipeline_stages ps
SET
  mosque_name = m.name,
  city        = m.city,
  country     = m.country
FROM public.mosques m
WHERE ps.mosque_id = m.id
  AND ps.mosque_name IS NULL;

-- 3. Make mosque_id nullable (leads won't have one yet)
ALTER TABLE public.pipeline_stages ALTER COLUMN mosque_id DROP NOT NULL;

-- 4. Drop the FK so leads can exist without a mosques row
ALTER TABLE public.pipeline_stages DROP CONSTRAINT IF EXISTS pipeline_stages_mosque_id_fkey;
