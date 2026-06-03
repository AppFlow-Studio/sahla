-- Extend the donations status constraint to cover the full Stripe
-- PaymentIntent lifecycle. Previously only 'pending'/'succeeded'/'failed'/
-- 'refunded' were allowed, so a canceled or in-flight donation could not be
-- recorded. Pairs with the cancel-donation-intent edge function
-- (cancel-on-abandon) and the get-payment-history incomplete-payment filter.

ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_status_check;

ALTER TABLE donations
  ADD CONSTRAINT donations_status_check
    CHECK (status IN (
      'pending',
      'processing',
      'succeeded',
      'failed',
      'canceled',
      'refunded'
    ));
