-- Remove abandoned business-ad checkouts.
-- ----------------------------------------------------------------------------
-- create-ad-subscription writes the submission + ad_subscriptions row (status
-- 'pending_payment' / 'pending') BEFORE the card is confirmed, so abandoning
-- the payment step leaves an orphan. The app/CRM already hide these, but they
-- shouldn't linger: Stripe expires the underlying incomplete subscription after
-- ~23h, so anything still 'pending_payment' after a day was abandoned.
--
-- ad_subscriptions.submission_id FKs business_ads_submissions, so delete the
-- child rows first.

-- One-time cleanup of existing abandoned rows (>15 min old, to spare a
-- checkout that's actively in progress right now).
DELETE FROM public.ad_subscriptions a
  USING public.business_ads_submissions s
  WHERE a.submission_id = s.submission_id
    AND s.status = 'pending_payment'
    AND s.created_at < now() - interval '15 minutes';

DELETE FROM public.business_ads_submissions
  WHERE status = 'pending_payment'
    AND created_at < now() - interval '15 minutes';

-- Recurring daily sweep for anything abandoned going forward (>1 day old).
SELECT cron.unschedule('cleanup-abandoned-ad-submissions')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-abandoned-ad-submissions');

SELECT cron.schedule(
  'cleanup-abandoned-ad-submissions',
  '23 4 * * *',
  $$
  DELETE FROM public.ad_subscriptions a
    USING public.business_ads_submissions s
    WHERE a.submission_id = s.submission_id
      AND s.status = 'pending_payment'
      AND s.created_at < now() - interval '1 day';
  DELETE FROM public.business_ads_submissions
    WHERE status = 'pending_payment'
      AND created_at < now() - interval '1 day';
  $$
);
