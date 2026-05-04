-- Support for saved cards via Stripe
-- The create-donation-intent edge function now saves profiles.stripe_id
-- after the first donation, linking the user to their Stripe customer.
-- get-payment-methods and delete-payment-method edge functions use this
-- to fetch and manage saved cards.

-- Index for fast Stripe customer lookups when loading saved payment methods
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_id
  ON public.profiles(stripe_id)
  WHERE stripe_id IS NOT NULL;
