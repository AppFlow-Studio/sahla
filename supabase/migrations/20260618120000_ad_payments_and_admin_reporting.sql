-- Business-ad payment history + admin reporting.
--
-- Until now, individual ad payments lived only in Stripe. The mosque admin
-- panel needs to show how long an ad has run, when its subscription started,
-- and when each invoice was paid — so the webhook now records every paid
-- invoice into ad_payments, and mosque admins get read access to the timing
-- data (ad_subscriptions.start_date) and the payment rows.

-- ─── ad_payments: one row per paid invoice (first + renewals) ───
CREATE TABLE IF NOT EXISTS public.ad_payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES public.mosques(id),
  submission_id uuid REFERENCES public.business_ads_submissions(submission_id),
  stripe_subscription_id text,
  stripe_invoice_id text UNIQUE,          -- idempotency key for the webhook
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,          -- invoice.amount_paid
  currency text,
  kind text NOT NULL DEFAULT 'recurring', -- 'first' (onboarding + month 1) | 'recurring'
  status text NOT NULL DEFAULT 'paid',
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_payments_submission_idx
  ON public.ad_payments (submission_id);
CREATE INDEX IF NOT EXISTS ad_payments_mosque_idx
  ON public.ad_payments (mosque_id);

ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;

-- Sahla team: full access (mirrors ad_subscriptions_sahla_*).
DROP POLICY IF EXISTS "ad_payments_sahla_all" ON public.ad_payments;
CREATE POLICY "ad_payments_sahla_all" ON public.ad_payments
  FOR ALL TO public
  USING (is_sahla_team())
  WITH CHECK (is_sahla_team());

-- Mosque admins: read their own mosque's payment history (in-app panel).
DROP POLICY IF EXISTS "ad_payments_mosque_read" ON public.ad_payments;
CREATE POLICY "ad_payments_mosque_read" ON public.ad_payments
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_uuid());

-- ─── Let mosque admins read subscription timing (start_date etc.) ───
-- ad_subscriptions previously exposed only a sahla_team SELECT policy, so the
-- admin panel couldn't see start_date / status. Additive, scoped by mosque.
DROP POLICY IF EXISTS "ad_subscriptions_mosque_read" ON public.ad_subscriptions;
CREATE POLICY "ad_subscriptions_mosque_read" ON public.ad_subscriptions
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_uuid());
