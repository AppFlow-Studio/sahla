-- content_items: let mosque admins manage their own mosque's programs & events.
--
-- Until now content_items only had a sahla-team write policy
-- (content_items_sahla_write), so programs/events could only be created from the
-- Sahla side. The app's admin panel needs mosque admins to create them too —
-- this mirrors speaker_data_mosque_write (migration 20260430000000), which is
-- what lets the Sheikhs admin screen write directly via the Clerk-authenticated
-- client. requesting_mosque_uuid() resolves the signed-in admin's mosque.

DROP POLICY IF EXISTS "content_items_mosque_write" ON public.content_items;
CREATE POLICY "content_items_mosque_write" ON public.content_items
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid())
  WITH CHECK (mosque_id = requesting_mosque_uuid());
