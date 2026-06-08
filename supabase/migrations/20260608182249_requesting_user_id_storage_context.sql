-- requesting_user_id() previously only read `request.jwt.claims` (the JSON
-- blob PostgREST sets). Supabase Storage sets claims under per-claim keys
-- (`request.jwt.claim.sub`, etc.) instead, so the function returned NULL in
-- storage RLS context and every authenticated upload to profile-pics /
-- business-ads / logos was rejected as a row-level security violation.
--
-- auth.jwt() reads from both shapes, so routing through it makes the function
-- work in PostgREST, Storage, Realtime, and Edge Function contexts alike.

CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')
$$;
