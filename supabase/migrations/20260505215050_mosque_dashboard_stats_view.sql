-- CRM-V1-MIGRATIONS: mosque_dashboard_stats materialized view.
-- Pre-aggregates dashboard KPIs per mosque. Hourly refresh via pg_cron.
-- Saves ~200ms per Home dashboard load (single read vs 6-table join).
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

CREATE MATERIALIZED VIEW public.mosque_dashboard_stats AS
SELECT
  m.id AS mosque_id,
  m.name AS mosque_name,
  COALESCE((SELECT SUM(d."amountGiven") FROM donations d
    WHERE d.mosque_id = m.id AND d.status = 'succeeded'
    AND d.date >= now() - INTERVAL '30 days'), 0) AS donations_mtd,
  COALESCE((SELECT SUM(d."amountGiven") FROM donations d
    WHERE d.mosque_id = m.id AND d.status = 'succeeded'
    AND date_trunc('year', d.date) = date_trunc('year', now())), 0) AS donations_ytd,
  COALESCE((SELECT COUNT(DISTINCT uci.user_id) FROM user_content_interactions uci
    WHERE uci.mosque_id = m.id
    AND uci.created_at >= now() - INTERVAL '30 days'), 0) AS active_members_30d,
  COALESCE((SELECT COUNT(*) FROM rsvps r
    WHERE r.mosque_id = m.id
    AND r.reserved_at >= now() - INTERVAL '7 days'
    AND r.status IN ('reserved','paid','attended')), 0) AS rsvps_last_7d,
  COALESCE((SELECT COUNT(*) FROM ad_subscriptions a
    WHERE a.mosque_id = m.id AND a.status = 'active'), 0) AS active_ads,
  COALESCE((SELECT COUNT(*) FROM content_notification_schedule cns
    WHERE cns.mosque_id = m.id AND cns.is_sent = true
    AND cns.notification_time >= now() - INTERVAL '30 days'), 0) AS notifications_sent_30d,
  now() AS computed_at
FROM mosques m;

CREATE UNIQUE INDEX idx_mosque_dashboard_stats_mosque
  ON public.mosque_dashboard_stats(mosque_id);

-- Refresh hourly via pg_cron
SELECT cron.schedule(
  'refresh-mosque-dashboard-stats',
  '0 * * * *',
  $cron$REFRESH MATERIALIZED VIEW CONCURRENTLY public.mosque_dashboard_stats$cron$
);
