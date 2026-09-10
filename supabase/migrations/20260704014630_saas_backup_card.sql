-- SaaS subscription backup card.
-- During onboarding we collect a primary card (subscription-mode Checkout) and,
-- optionally, a backup card (setup-mode Checkout). The backup card is attached
-- to the same Stripe customer but is NOT the subscription default — it sits on
-- file so an admin can one-click switch to it if the primary starts failing.
-- brand/last4 are denormalized so the CRM can render "Visa •••• 4242" without
-- a live Stripe round-trip.
alter table public.mosques
  add column if not exists saas_backup_payment_method_id text,
  add column if not exists saas_backup_card_brand text,
  add column if not exists saas_backup_card_last4 text;

comment on column public.mosques.saas_backup_payment_method_id is
  'Stripe PaymentMethod id of the on-file backup card for the SaaS subscription (not the subscription default).';
