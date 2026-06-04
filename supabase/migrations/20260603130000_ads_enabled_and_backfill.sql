-- Business ads: explicit enable flag + backfill from onboarding config
-- ----------------------------------------------------------------------------
-- `ads_enabled` gates whether a mosque offers business ads at all. It is
-- opt-in: defaults to false so a mosque must turn ads on (in onboarding or the
-- CRM) before the app shows the advertise flow. Mosques that already enabled
-- ads during onboarding are backfilled to true below.

ALTER TABLE public.mosques
  ADD COLUMN IF NOT EXISTS ads_enabled boolean NOT NULL DEFAULT false;

-- Backfill the authoritative pricing columns from the dollar values a mosque
-- chose during onboarding (stored in onboarding_progress._ads_config as
-- strings). Earlier the onboarding route only wrote that JSON blob, never the
-- columns the app charges from — so any mosque configured before 2026-06-03
-- still has default pricing here. Only touch rows with a numeric value saved.
UPDATE public.mosques
SET
  ad_onboarding_fee_cents = round(
    (onboarding_progress -> '_ads_config' ->> 'onboardingFee')::numeric * 100
  )::int,
  ad_monthly_price_cents = round(
    (onboarding_progress -> '_ads_config' ->> 'monthlyRate')::numeric * 100
  )::int
WHERE onboarding_progress ? '_ads_config'
  AND (onboarding_progress -> '_ads_config' ->> 'onboardingFee') ~ '^[0-9]+(\.[0-9]+)?$'
  AND (onboarding_progress -> '_ads_config' ->> 'monthlyRate')  ~ '^[0-9]+(\.[0-9]+)?$';

-- Backfill the enable flag from the onboarding toggle.
UPDATE public.mosques
SET ads_enabled = true
WHERE onboarding_progress ? '_ads_config'
  AND (onboarding_progress -> '_ads_config' ->> 'enabled') = 'true';
