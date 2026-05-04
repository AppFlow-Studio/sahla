-- Add Stripe payment tracking columns to the donations table
-- so the app can record and query donation history by user.

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS user_id text REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';

-- Index for fast user-scoped lookups (payment history screen)
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);

-- Index for idempotent webhook handling
CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_stripe_pi
  ON public.donations(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
