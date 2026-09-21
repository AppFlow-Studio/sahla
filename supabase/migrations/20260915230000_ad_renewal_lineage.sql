-- Link a renewed business ad back to the one it replaces.
--
-- Renewing is a fresh application (new submission, new Stripe subscription,
-- re-reviewed by the masjid) rather than a revival of the old row, so without
-- an explicit link there is nothing tying the two together — the advertiser can
-- edit the business name on the way through, which defeats matching by name.
-- Without the link the old card keeps offering "Renew" after it has already
-- been renewed, which charges the onboarding fee a second time for an ad that
-- is already live.

ALTER TABLE public.business_ads_submissions
  ADD COLUMN IF NOT EXISTS renewed_from_submission_id uuid
    REFERENCES public.business_ads_submissions(submission_id) ON DELETE SET NULL;

COMMENT ON COLUMN public.business_ads_submissions.renewed_from_submission_id IS
  'The ended submission this one was created to replace. Set by create-ad-subscription when the advertiser renews from My Business Ads.';

-- get-ad-status asks "has anything renewed this submission?" for every ad it
-- returns, so index the lookup direction.
CREATE INDEX IF NOT EXISTS idx_bas_renewed_from
  ON public.business_ads_submissions (renewed_from_submission_id)
  WHERE renewed_from_submission_id IS NOT NULL;
