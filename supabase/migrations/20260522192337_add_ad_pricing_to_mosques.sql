-- Mosque-configurable pricing for business ad subscriptions.
-- Set during website onboarding; read by the app's advertise flow.
alter table public.mosques
  add column ad_monthly_price_cents integer not null default 5000,
  add column ad_onboarding_fee_cents integer not null default 10000;
