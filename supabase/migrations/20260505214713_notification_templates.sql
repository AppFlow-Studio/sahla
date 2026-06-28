-- CRM-V1-MIGRATIONS: notification_templates — saved-and-reuse notifications.
-- One-click reuse for common mosque notifications (e.g. "Jummah reminder",
-- "Class canceled"). Audience filter is JSONB for flexible targeting.
-- Author: Ahmad Hamoudeh
-- Applied to staging: 2026-05-05

CREATE TABLE public.notification_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  default_audience TEXT DEFAULT 'all'
    CHECK (default_audience IN ('all','program','event','tag')),
  audience_filter JSONB DEFAULT '{}'::jsonb,
  last_used_at TIMESTAMPTZ,
  usage_count INT DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mosque_id, name)
);

CREATE INDEX idx_notification_templates_mosque ON public.notification_templates(mosque_id);
CREATE INDEX idx_notification_templates_recent ON public.notification_templates(mosque_id, last_used_at DESC NULLS LAST);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_templates_mosque_all ON public.notification_templates
  FOR ALL USING (mosque_id = public.requesting_mosque_id());
CREATE POLICY notification_templates_sahla ON public.notification_templates
  FOR SELECT USING (public.is_sahla_team());
