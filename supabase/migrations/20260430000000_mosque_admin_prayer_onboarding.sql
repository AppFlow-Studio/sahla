-- =============================================================================
-- Mosque Admin Prayer Onboarding
-- Opens prayer-related tables for mosque admin access via website onboarding.
-- Adds helper functions, public read policies, and scoped write policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: Helper Functions
-- ---------------------------------------------------------------------------

-- Maps Clerk org_id (from JWT) to the actual mosques.id (used as FK everywhere)
CREATE OR REPLACE FUNCTION public.requesting_mosque_uuid()
  RETURNS text
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT id FROM mosques
  WHERE clerk_org_id = NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )
  LIMIT 1
$$;

-- Checks if the requester belongs to any mosque org
CREATE OR REPLACE FUNCTION public.is_mosque_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mosques
    WHERE clerk_org_id = NULLIF(
      current_setting('request.jwt.claims', true)::json->>'org_id',
      ''
    )
  )
$$;

-- ---------------------------------------------------------------------------
-- Part 2: Performance Index
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_mosques_clerk_org_id
  ON mosques (clerk_org_id)
  WHERE clerk_org_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Part 3: updated_at columns + triggers for tables that lack them
-- ---------------------------------------------------------------------------

ALTER TABLE jummah ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE todays_prayers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE speaker_data ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS jummah_updated_at ON jummah;
CREATE TRIGGER jummah_updated_at
  BEFORE UPDATE ON jummah
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS prayers_updated_at ON prayers;
CREATE TRIGGER prayers_updated_at
  BEFORE UPDATE ON prayers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS todays_prayers_updated_at ON todays_prayers;
CREATE TRIGGER todays_prayers_updated_at
  BEFORE UPDATE ON todays_prayers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS speaker_data_updated_at ON speaker_data;
CREATE TRIGGER speaker_data_updated_at
  BEFORE UPDATE ON speaker_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Part 4: Public Read Policies
-- Prayer times are public information — any authenticated or anon user can read.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "prayers_public_read" ON prayers;
CREATE POLICY "prayers_public_read" ON prayers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "todays_prayers_public_read" ON todays_prayers;
CREATE POLICY "todays_prayers_public_read" ON todays_prayers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "iqamah_config_public_read" ON iqamah_config;
CREATE POLICY "iqamah_config_public_read" ON iqamah_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "jummah_public_read" ON jummah;
CREATE POLICY "jummah_public_read" ON jummah
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "speaker_data_public_read" ON speaker_data;
CREATE POLICY "speaker_data_public_read" ON speaker_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "prayer_display_config_public_read" ON prayer_display_config;
CREATE POLICY "prayer_display_config_public_read" ON prayer_display_config
  FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Part 5: Mosque Admin Write Policies
-- Scoped so admins can only modify their own mosque's data.
-- These sit alongside existing sahla_team policies (not replacing them).
-- ---------------------------------------------------------------------------

-- mosques: admin can update their own row only
DROP POLICY IF EXISTS "mosques_admin_update" ON mosques;
CREATE POLICY "mosques_admin_update" ON mosques
  FOR UPDATE TO public
  USING (clerk_org_id = requesting_mosque_id())
  WITH CHECK (clerk_org_id = requesting_mosque_id());

-- iqamah_config: managed through app admin panel only (sahla_team policies)

-- jummah: admin can manage their mosque's Jummah schedule
DROP POLICY IF EXISTS "jummah_mosque_write" ON jummah;
CREATE POLICY "jummah_mosque_write" ON jummah
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());

-- speaker_data: admin can manage their mosque's speakers
DROP POLICY IF EXISTS "speaker_data_mosque_write" ON speaker_data;
CREATE POLICY "speaker_data_mosque_write" ON speaker_data
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());

-- prayers: admin can manage their mosque's prayer data
DROP POLICY IF EXISTS "prayers_mosque_write" ON prayers;
CREATE POLICY "prayers_mosque_write" ON prayers
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());

-- todays_prayers: admin can manage their mosque's daily prayer times
DROP POLICY IF EXISTS "todays_prayers_mosque_write" ON todays_prayers;
CREATE POLICY "todays_prayers_mosque_write" ON todays_prayers
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());

-- prayer_display_config: admin can manage their mosque's display settings
DROP POLICY IF EXISTS "prayer_display_config_mosque_write" ON prayer_display_config;
CREATE POLICY "prayer_display_config_mosque_write" ON prayer_display_config
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());
