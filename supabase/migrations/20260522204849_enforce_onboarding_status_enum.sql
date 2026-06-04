-- Lock down mosques.onboarding_status to the known lifecycle states.
-- Background: the column has been free-text since baseline (default
-- 'in_progress'). The CRM layout gate (PR 1) and the post-Stripe polling
-- page (PR 2) both branch on this value — a typo in a webhook or migration
-- silently locks an admin out of their CRM. A check constraint catches it.
-- Author: Ahmad Hamoudeh
ALTER TABLE public.mosques
  ADD CONSTRAINT mosques_onboarding_status_check
  CHECK (onboarding_status IN ('pipeline', 'setup', 'in_progress', 'ready', 'live'));

COMMENT ON CONSTRAINT mosques_onboarding_status_check ON public.mosques IS
  'Onboarding lifecycle states. Allowed: pipeline (lead in the kanban), setup (post-Clerk org delete cleanup), in_progress (active onboarding), ready (paid, awaiting binary build), live (mosque app shipped).';
