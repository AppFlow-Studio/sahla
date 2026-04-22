-- Allow any client (anon or authenticated) to read mosque config.
-- Mosques are public app configuration, not sensitive data.
DROP POLICY IF EXISTS "mosques_public_read" ON mosques;
CREATE POLICY "mosques_public_read" ON mosques
  FOR SELECT
  USING (true);
