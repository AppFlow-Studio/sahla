-- D1 from the CRM gap plan: log every RSVP INSERT to activity_log so the
-- Home dashboard's activity feed shows "Sarah RSVP'd to Friday Halaqa"
-- entries. Actor_name + entity_name are resolved at read time in the
-- /api/crm/activity route by joining to profiles and content_items —
-- triggers can't read Clerk display names anyway.
CREATE OR REPLACE FUNCTION public.log_rsvp_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_log (
    mosque_id,
    actor_id,
    actor_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    metadata
  ) VALUES (
    NEW.mosque_id,
    NEW.user_id,
    NULL,
    'rsvp_created',
    'rsvp',
    NEW.id::text,
    NULL,
    jsonb_build_object(
      'content_id', NEW.content_id,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rsvps_log_created ON public.rsvps;
CREATE TRIGGER trg_rsvps_log_created
  AFTER INSERT ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.log_rsvp_created();

COMMENT ON FUNCTION public.log_rsvp_created() IS
  'Records rsvp_created activity_log rows on every RSVP INSERT. Display names join lazily in the CRM API route.';
