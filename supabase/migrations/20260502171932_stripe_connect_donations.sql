-- Stripe Connect donation infrastructure
-- Adds Connect status fields to mosques + Stripe fields to donations

-- ─── Mosques: Connect status fields ───
ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at timestamptz;

-- Backfill: mosques that already completed Stripe Connect onboarding
UPDATE mosques
SET stripe_charges_enabled = true,
    stripe_onboarding_completed_at = now()
WHERE stripe_account_id IS NOT NULL
  AND onboarding_progress->>'stripe_connect' = 'true';

-- ─── Donations: Stripe tracking fields ───
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';

-- Constraints
ALTER TABLE donations
  ADD CONSTRAINT donations_status_check
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded'));

ALTER TABLE donations
  ADD CONSTRAINT donations_stripe_pi_unique
    UNIQUE (stripe_payment_intent_id);

-- Index for webhook lookups by payment intent
CREATE INDEX IF NOT EXISTS idx_donations_stripe_pi
  ON donations (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Backfill existing donation rows to 'succeeded' (they were inserted on payment_intent.succeeded)
UPDATE donations
SET status = 'succeeded'
WHERE status = 'pending'
  AND stripe_payment_intent_id IS NULL;
