-- The mosque profile onboarding panel + PATCH /api/mosques/[id] both
-- assume a `phone` column on mosques, but it was never added. Saving
-- the mosque profile fails with "column phone does not exist". Add it.
ALTER TABLE public.mosques
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.mosques.phone IS
  'Primary contact phone for the masjid. Free-form text — no format enforcement.';
