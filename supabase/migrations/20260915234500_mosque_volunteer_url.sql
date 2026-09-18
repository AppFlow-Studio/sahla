-- Where a masjid takes volunteer sign-ups.
--
-- Free-form external URL (a Google Form, a page on the masjid's own site, a
-- third-party signup tool) opened in an in-app browser from the Home quick
-- actions. NULL means this masjid has no volunteer intake, and the app hides
-- the Volunteer tile entirely rather than linking somewhere dead.
ALTER TABLE public.mosques
  ADD COLUMN IF NOT EXISTS volunteer_url text;

COMMENT ON COLUMN public.mosques.volunteer_url IS
  'External volunteer sign-up URL shown as the Home "Volunteer" quick action. NULL hides the tile. Edited by mosque admins in-app (mosques_admin_update RLS).';
