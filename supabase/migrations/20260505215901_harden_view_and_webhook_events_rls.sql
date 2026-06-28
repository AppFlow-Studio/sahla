-- HARDEN-RLS-01: clear the two pre-existing security advisor ERRORs.
--
-- 1. mosque_feature_flags was created without `security_invoker = true`, so
--    Postgres treats it as SECURITY DEFINER (creator's privileges) and bypasses
--    RLS on `mosques`. Flip to SECURITY INVOKER so RLS cascades correctly —
--    a non-service-role caller will only see flags for mosques they can read.
--
-- 2. stripe_webhook_events is the Stripe idempotency log. Only the
--    stripe-webhooks edge function (running as service_role, which bypasses
--    RLS) writes/reads it. Enable RLS with no policies so PostgREST cannot
--    expose it to authenticated/anon callers.
--
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

ALTER VIEW public.mosque_feature_flags SET (security_invoker = true);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
