-- Per-(user, connected-account) Stripe customer mapping.
--
-- Stripe Connect customers are scoped to a single connected account, so the
-- one global `profiles.stripe_id` cannot represent a user's customer across
-- mosques — reusing it on another mosque's account throws "No such customer".
-- This table holds the correct customer id per (user, connected account).
--
-- Written/read only by edge functions via the service role; RLS is enabled
-- with no policies so it is inaccessible to anon/auth clients.

create table if not exists public.stripe_customers (
  user_id            text        not null,  -- Clerk user id (== profiles.id)
  stripe_account_id  text        not null,  -- mosques.stripe_account_id (acct_…)
  stripe_customer_id text        not null,  -- cus_… scoped to that account
  created_at         timestamptz not null default now(),
  primary key (user_id, stripe_account_id)
);

alter table public.stripe_customers enable row level security;

-- Reverse lookup (customer -> mapping), e.g. webhook reconciliation.
create index if not exists stripe_customers_customer_idx
  on public.stripe_customers (stripe_customer_id);
