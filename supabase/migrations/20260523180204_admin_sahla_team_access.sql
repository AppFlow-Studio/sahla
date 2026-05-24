-- Allow Sahla HQ team members (super admins) to access the admin portal
-- for all masjid apps, not just their own org.

CREATE OR REPLACE FUNCTION public.is_mosque_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT (
    -- Sahla HQ team members can access any masjid's admin
    is_sahla_team()
    OR
    -- Regular mosque org members
    EXISTS (
      SELECT 1 FROM mosques
      WHERE clerk_org_id = NULLIF(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        ''
      )
    )
  )
$$;
