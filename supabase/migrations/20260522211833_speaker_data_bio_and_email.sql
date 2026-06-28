-- Round out speaker_data so the CRM's speaker form fields persist:
-- the existing table only stores name, image, and a creds array; the
-- CRM also captures a one-line bio and a private contact email.
ALTER TABLE public.speaker_data
  ADD COLUMN IF NOT EXISTS speaker_bio text,
  ADD COLUMN IF NOT EXISTS speaker_email text;

COMMENT ON COLUMN public.speaker_data.speaker_bio IS
  'Optional short bio. One or two sentences. Surfaced on the mobile app speaker detail.';
COMMENT ON COLUMN public.speaker_data.speaker_email IS
  'Private contact email — visible only to mosque admins, never to members.';
