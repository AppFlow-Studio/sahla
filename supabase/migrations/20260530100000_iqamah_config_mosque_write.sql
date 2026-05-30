-- iqamah_config: let mosque admins manage their own iqamah times from the app.
--
-- Migration 20260430000001 removed the mosque-admin write policy back when
-- iqamah was scoped to sahla_team only. Iqamah is now edited by mosque admins
-- in the app admin panel (alongside Programs/Sheikhs/Jummah), so re-add the
-- write policy scoped by requesting_mosque_uuid(). Public read
-- (iqamah_config_public_read) and the sahla_team policies are unchanged — the
-- app reads these rules with the anon/public client and computes each day's
-- iqamah from the athan time client-side.

DROP POLICY IF EXISTS "iqamah_config_mosque_write" ON public.iqamah_config;
CREATE POLICY "iqamah_config_mosque_write" ON public.iqamah_config
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());
