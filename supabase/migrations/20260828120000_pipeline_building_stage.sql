-- Adds the "building" pipeline stage: paid + onboarding complete, app not yet
-- shipped. Previously these mosques stayed parked in "onboarding" until
-- someone ran Mark as Live, so the board couldn't distinguish "waiting on the
-- mosque" from "waiting on us".
--
-- Backfills any mosque already sitting in that state.
-- Applied to staging: (pending)

UPDATE public.pipeline_stages ps
SET stage = 'building',
    updated_at = now()
FROM public.mosques m
WHERE ps.mosque_id = m.id
  AND m.onboarding_status = 'ready'
  AND ps.stage IS DISTINCT FROM 'building'
  AND ps.stage IS DISTINCT FROM 'live';
