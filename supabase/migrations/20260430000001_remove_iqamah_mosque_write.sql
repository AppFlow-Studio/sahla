-- =============================================================================
-- Remove iqamah_config mosque admin write policy
-- Iqamah times are managed through the app admin panel only (sahla_team).
-- =============================================================================

DROP POLICY IF EXISTS "iqamah_config_mosque_write" ON iqamah_config;
