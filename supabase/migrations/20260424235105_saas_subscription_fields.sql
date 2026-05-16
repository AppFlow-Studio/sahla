-- ST-SAAS-01: Add SaaS subscription fields to mosques table

ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS saas_stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS saas_stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT
    CHECK (subscription_tier IN ('core', 'core_crm', 'complete')),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Backfill email from pipeline_stages for existing mosques
UPDATE mosques m
SET email = ps.contact_email
FROM pipeline_stages ps
WHERE ps.mosque_id = m.id
  AND ps.contact_email IS NOT NULL
  AND m.email IS NULL;

-- Idempotent webhook processing
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events (processed_at);

-- Daily cron: cancel past-due mosques after 7-day grace period
SELECT cron.schedule(
  'check-past-due-subscriptions',
  '0 6 * * *',
  $$
  UPDATE mosques
  SET subscription_status = 'canceled'
  WHERE subscription_status = 'past_due'
    AND current_period_end < now() - INTERVAL '7 days';
  $$
);
