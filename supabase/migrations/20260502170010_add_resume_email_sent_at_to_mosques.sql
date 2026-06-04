-- ONBOARD-RESUME-01: Track when the resume-onboarding email was sent.
-- Null = email has not been sent for this mosque yet. Cleared by the
-- clerk-webhooks org.deleted handler so re-invited masjids get a fresh
-- email-once cycle.
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-02

ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS resume_email_sent_at timestamptz;
