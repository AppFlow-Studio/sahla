-- CRM-V1-MIGRATIONS: rsvps table — per-content-item RSVP/registration.
-- Status enum covers full lifecycle including waitlist. Includes triggers
-- to maintain content_items.current_count and auto-promote from waitlist.
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

CREATE TABLE public.rsvps (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_items(content_id) ON DELETE CASCADE,
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved','paid','attended','no_show','canceled','refunded','waitlisted')),
  payment_intent_id TEXT,
  amount_paid NUMERIC,
  reserved_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  refund_id TEXT,
  notes TEXT,
  UNIQUE (user_id, content_id)
);

CREATE INDEX idx_rsvps_content_status ON public.rsvps(content_id, status);
CREATE INDEX idx_rsvps_mosque_user ON public.rsvps(mosque_id, user_id);
CREATE INDEX idx_rsvps_payment ON public.rsvps(payment_intent_id) WHERE payment_intent_id IS NOT NULL;

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY rsvps_mosque_select ON public.rsvps
  FOR SELECT USING (mosque_id = public.requesting_mosque_id());
CREATE POLICY rsvps_sahla_select ON public.rsvps
  FOR SELECT USING (public.is_sahla_team());
CREATE POLICY rsvps_user_insert ON public.rsvps
  FOR INSERT WITH CHECK (user_id = public.requesting_user_id());
CREATE POLICY rsvps_user_update ON public.rsvps
  FOR UPDATE USING (user_id = public.requesting_user_id());
CREATE POLICY rsvps_admin_update ON public.rsvps
  FOR UPDATE USING (mosque_id = public.requesting_mosque_id());

-- Trigger: maintain content_items.current_count
CREATE OR REPLACE FUNCTION public.maintain_content_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  active_statuses TEXT[] := ARRAY['reserved','paid','attended'];
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = ANY(active_statuses) THEN
    UPDATE content_items SET current_count = COALESCE(current_count, 0) + 1
      WHERE content_id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = ANY(active_statuses) THEN
    UPDATE content_items SET current_count = GREATEST(0, COALESCE(current_count, 0) - 1)
      WHERE content_id = OLD.content_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.status = ANY(active_statuses)) AND NOT (NEW.status = ANY(active_statuses)) THEN
      UPDATE content_items SET current_count = GREATEST(0, COALESCE(current_count, 0) - 1)
        WHERE content_id = NEW.content_id;
    ELSIF NOT (OLD.status = ANY(active_statuses)) AND (NEW.status = ANY(active_statuses)) THEN
      UPDATE content_items SET current_count = COALESCE(current_count, 0) + 1
        WHERE content_id = NEW.content_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_rsvps_maintain_count
  AFTER INSERT OR UPDATE OR DELETE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.maintain_content_count();

-- Trigger: auto-promote from waitlist on cancellation
CREATE OR REPLACE FUNCTION public.promote_from_waitlist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max_capacity INT;
  v_current_count INT;
  v_next_id BIGINT;
BEGIN
  IF NEW.status NOT IN ('canceled','refunded','no_show') THEN RETURN NEW; END IF;
  SELECT max_capacity, current_count INTO v_max_capacity, v_current_count
    FROM content_items WHERE content_id = NEW.content_id;
  IF v_max_capacity IS NULL OR v_current_count >= v_max_capacity THEN RETURN NEW; END IF;
  SELECT id INTO v_next_id FROM rsvps
    WHERE content_id = NEW.content_id AND status = 'waitlisted'
    ORDER BY reserved_at ASC LIMIT 1;
  IF v_next_id IS NOT NULL THEN
    UPDATE rsvps SET status = 'reserved', reserved_at = now() WHERE id = v_next_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rsvps_promote_waitlist
  AFTER UPDATE OF status ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.promote_from_waitlist();
