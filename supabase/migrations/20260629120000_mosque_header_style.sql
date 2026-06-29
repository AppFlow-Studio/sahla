-- Per-masjid home-screen header style. Mirrors `font_theme`: the masjid admin
-- picks a header (in onboarding / the CRM) and the app renders the matching
-- home header. One of: 'classic', 'countdown-centered', 'countdown-left'
-- (see src/theme/header-style.ts). Defaults to 'classic' so existing masjids
-- are unchanged until they opt in.
ALTER TABLE public.mosques
  ADD COLUMN IF NOT EXISTS header_style text NOT NULL DEFAULT 'classic';

COMMENT ON COLUMN public.mosques.header_style IS
  'Home-screen header style key: classic | countdown-centered | countdown-left. See src/theme/header-style.ts.';
