-- The JummahSetupPanel collects a free-text Khateeb name during onboarding,
-- and the CRM Jummah module + mobile app want to surface it. The `jummah`
-- table already has a `speaker` UUID FK (for speakers picked from the
-- registry), but no plain-text field — so the onboarding name was being
-- silently dropped on save.
ALTER TABLE public.jummah
  ADD COLUMN IF NOT EXISTS khateeb_name text;

COMMENT ON COLUMN public.jummah.khateeb_name IS
  'Free-text khateeb name captured during onboarding when the admin hasnt linked a speaker yet. CRM + mobile app fall back to this when `speaker` (FK to speaker_data) is null.';
