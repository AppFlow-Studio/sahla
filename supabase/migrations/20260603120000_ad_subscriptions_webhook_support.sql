-- Business-ads subscription lifecycle support
-- ------------------------------------------------------------------
-- The `stripe-webhook` edge function looks up ad subscriptions by their
-- Stripe subscription id and upserts on it during reconciliation, so that
-- column needs to be unique + indexed. It also filters submissions during
-- promotion, so index the submission_id link as well.

ALTER TABLE public.ad_subscriptions
  ADD CONSTRAINT ad_subscriptions_stripe_subscription_id_key
  UNIQUE (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_ad_subscriptions_submission_id
  ON public.ad_subscriptions (submission_id);
