-- Clerk JWT v2 nests org info under `o.id` instead of `org_id`.
-- These functions previously only read the v1 shape, so requesting_mosque_id()
-- returned NULL for every authenticated v2 session and broke ~47 RLS policies.
-- Reading from both paths keeps backwards-compat with any v1 tokens still in flight.

CREATE OR REPLACE FUNCTION public.requesting_mosque_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::json->>'org_id', ''),
    NULLIF(current_setting('request.jwt.claims', true)::json#>>'{o,id}', '')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_sahla_team()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    EXISTS (
      SELECT 1 FROM sahla_team
      WHERE user_id = NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
      )
      AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM sahla_config
      WHERE id = 'singleton'
        AND org_id = COALESCE(
          NULLIF(current_setting('request.jwt.claims', true)::json->>'org_id', ''),
          NULLIF(current_setting('request.jwt.claims', true)::json#>>'{o,id}', '')
        )
    )
  )
$$;
