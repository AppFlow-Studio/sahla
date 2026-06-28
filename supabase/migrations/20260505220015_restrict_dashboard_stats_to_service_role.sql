-- HARDEN-RLS-02: lock down the dashboard stats matview.
-- Revoke SELECT from anon and authenticated so PostgREST doesn't expose
-- per-mosque revenue / member aggregates publicly. The CRM Home dashboard
-- will read via a server route using the service-role admin client,
-- filtered to the caller's orgId — same pattern as the other admin routes.
--
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

REVOKE SELECT ON public.mosque_dashboard_stats FROM anon, authenticated;
