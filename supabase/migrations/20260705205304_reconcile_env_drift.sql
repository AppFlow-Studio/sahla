-- Reconcile prod <-> staging drift.
--
-- These objects were applied out-of-band (SQL editor / dashboard) and never
-- captured as migrations, so prod and staging diverged:
--   * 4 HQ dashboard views existed on prod only.
--   * user_preferences.attendance_reasons existed on staging only.
--   * todays_prayers.date default (CURRENT_DATE) existed on prod only.
-- This migration is idempotent so it converges whichever environment runs it.
--
-- SECURITY: the 4 views were created via the SQL editor, which auto-granted full
-- privileges to anon/authenticated. They run with owner rights (no
-- security_invoker) and therefore bypass RLS, so any anon/authenticated caller
-- could read cross-mosque platform stats, health scores, and activity logs.
-- The app only reads them server-side via the service_role admin client
-- (app/(admin)/revenue/page.tsx), so we revoke anon/authenticated to close the
-- leak. service_role retains access and is unaffected.

-- ============================================================================
-- HQ dashboard views (captured verbatim from prod)
-- ============================================================================

create or replace view public.latest_health_scores as
SELECT DISTINCT ON (mhs.mosque_id) mhs.id,
    mhs.mosque_id,
    mhs.overall_score,
    mhs.content_freshness,
    mhs.user_engagement,
    mhs.push_coverage,
    mhs.admin_activity,
    mhs.business_ads,
    mhs.payment_health,
    mhs.computed_at,
    m.name AS mosque_name,
    m.slug AS mosque_slug,
    m.subscription_status,
        CASE
            WHEN mhs.overall_score >= 80 THEN 'excellent'::text
            WHEN mhs.overall_score >= 60 THEN 'good'::text
            WHEN mhs.overall_score >= 40 THEN 'at_risk'::text
            ELSE 'critical'::text
        END AS badge
   FROM mosque_health_scores mhs
     JOIN mosques m ON m.id = mhs.mosque_id
  ORDER BY mhs.mosque_id, mhs.computed_at DESC;

create or replace view public.mosque_onboarding_summary as
SELECT m.id AS mosque_id,
    m.name AS mosque_name,
    m.onboarding_status,
    count(mos.id) AS total_steps,
    count(mos.id) FILTER (WHERE mos.status = 'completed'::text) AS completed_steps,
    count(mos.id) FILTER (WHERE mos.status = 'in_progress'::text) AS in_progress_steps,
    round(100.0 * count(mos.id) FILTER (WHERE mos.status = 'completed'::text)::numeric / NULLIF(count(mos.id), 0)::numeric) AS completion_pct,
    min(mos.created_at) AS onboarding_started_at,
    max(mos.completed_at) AS last_step_completed_at
   FROM mosques m
     LEFT JOIN mosque_onboarding_steps mos ON mos.mosque_id = m.id
  GROUP BY m.id, m.name, m.onboarding_status;

create or replace view public.platform_overview as
SELECT count(*) FILTER (WHERE subscription_status = 'active'::text) AS active_mosques,
    count(*) FILTER (WHERE subscription_status = ANY (ARRAY['setup'::text, 'trial'::text])) AS onboarding_mosques,
    count(*) FILTER (WHERE subscription_status = 'past_due'::text) AS past_due_mosques,
    count(*) FILTER (WHERE subscription_status = 'canceled'::text) AS churned_mosques,
    count(*) AS total_mosques
   FROM mosques;

create or replace view public.recent_activity as
SELECT al.id,
    al.mosque_id,
    al.actor_id,
    al.actor_name,
    al.action,
    al.entity_type,
    al.entity_id,
    al.entity_name,
    al.metadata,
    al.created_at,
    m.name AS mosque_name,
    m.slug AS mosque_slug
   FROM activity_log al
     LEFT JOIN mosques m ON m.id = al.mosque_id
  ORDER BY al.created_at DESC
 LIMIT 50;

-- Lock the views down: only service_role (used by the server-side admin client)
-- should read them. Revoke the default public grants.
revoke all on table
  public.latest_health_scores,
  public.mosque_onboarding_summary,
  public.platform_overview,
  public.recent_activity
  from anon, authenticated;

-- ============================================================================
-- user_preferences.attendance_reasons  (was on staging only; used by
-- app/api/crm/members/[id]/route.ts)
-- ============================================================================
alter table public.user_preferences
  add column if not exists attendance_reasons text[] not null default '{}'::text[];

-- ============================================================================
-- todays_prayers.date default (was CURRENT_DATE on prod only)
-- ============================================================================
alter table public.todays_prayers
  alter column date set default CURRENT_DATE;
