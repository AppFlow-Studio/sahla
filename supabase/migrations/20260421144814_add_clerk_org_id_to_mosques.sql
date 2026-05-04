ALTER TABLE public.mosques
ADD COLUMN clerk_org_id text;

COMMENT ON COLUMN public.mosques.clerk_org_id IS
  'Clerk Organization ID for this mosque tenant.';
