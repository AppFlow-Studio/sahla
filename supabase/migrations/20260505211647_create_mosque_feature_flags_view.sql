-- CRM-ACCESS-01: View deriving feature flags from mosques state.
-- Single canonical place for "does this mosque have CRM access?". Live-derived
-- from subscription_tier/status + Stripe Connect state, no sync work needed.
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

CREATE OR REPLACE VIEW public.mosque_feature_flags AS
SELECT
  m.id AS mosque_id,
  m.subscription_tier AS account_type,
  COALESCE(m.subscription_status IN ('active', 'trialing'), false) AS is_active,
  COALESCE(m.stripe_charges_enabled, false) AS is_stripe_connected,
  COALESCE(
    m.subscription_tier IN ('core_crm', 'complete')
      AND m.subscription_status IN ('active', 'trialing'),
    false
  ) AS has_crm_access
FROM public.mosques m;

COMMENT ON VIEW public.mosque_feature_flags IS
  'Live-derived feature flags per mosque. has_crm_access is the canonical check for granting CRM features. Sourced from mosques.subscription_tier, subscription_status, stripe_charges_enabled.';

GRANT SELECT ON public.mosque_feature_flags TO authenticated;
GRANT SELECT ON public.mosque_feature_flags TO service_role;
