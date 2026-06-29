-- scheduled_notifications: queue for admin-composed mosque-audience pushes.
--
-- Captured from prod on 2026-06-28 — this migration was applied via MCP
-- apply_migration without being checked into the repo. Backported here so
-- the local migrations folder matches the remote chain exactly (per the
-- team rule). DDL is byte-identical to what's running in prod.
--
-- Drained by the send-push edge function (per-minute cron + inline calls
-- from the CRM Notifications composer). Audience types:
--   'all'     — every active push_token for the mosque
--   'program' — push_tokens of users with non-canceled rsvps to a program
--   'event'   — same shape but for events
-- The audience_target column holds the program/event UUID; null when
-- audience_type is 'all'.

CREATE TABLE public.scheduled_notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_type TEXT NOT NULL DEFAULT 'all'
    CHECK (audience_type IN ('all', 'program', 'event')),
  audience_target UUID,
  audience_label TEXT,
  template_id BIGINT REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  created_by TEXT,
  actor_name TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'canceled')),
  recipient_count INT,
  sent_count INT,
  failed_count INT,
  activity_log_id UUID,
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  CONSTRAINT scheduled_notifications_target_required
    CHECK (audience_type = 'all' OR audience_target IS NOT NULL)
);

CREATE INDEX idx_scheduled_notifications_due
  ON public.scheduled_notifications(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_scheduled_notifications_mosque
  ON public.scheduled_notifications(mosque_id, created_at DESC);

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_notifications_mosque_all ON public.scheduled_notifications
  FOR ALL USING (mosque_id = public.requesting_mosque_id());
CREATE POLICY scheduled_notifications_sahla ON public.scheduled_notifications
  FOR SELECT USING (public.is_sahla_team());
