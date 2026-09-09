-- automated_notification_templates — per-masjid copy for the notifications the
-- system sends on its own (prayer athan/iqamah reminders, engagement nudges).
--
-- Distinct from `notification_templates`, which is a library of drafts an admin
-- picks from when composing a one-off send. Here there is at most one row per
-- (mosque, notification_key), and it *overrides* a built-in default rather than
-- standing alone: a mosque with no row still gets notifications, in Sahla's
-- wording. That keeps a masjid from silently breaking its own reminders by
-- clearing a field, and means new notification kinds ship without backfilling
-- every tenant.
--
-- `notification_key` is intentionally free text with no CHECK constraint: the
-- catalogue of keys lives in code (supabase/functions/_shared/
-- automated-notifications.ts), so adding a notification kind doesn't need a
-- migration. Unknown keys are ignored by the sender.
--
-- Author: Wakeem Widdi
-- Applied to staging: (pending)

CREATE TABLE public.automated_notification_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  -- NULL means "use the built-in default for this key". An admin who clears a
  -- field gets Sahla's copy back rather than an empty push notification.
  title TEXT,
  body TEXT,
  -- Lets a masjid turn one kind off entirely without deleting its wording.
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mosque_id, notification_key)
);

CREATE INDEX idx_automated_notif_templates_mosque
  ON public.automated_notification_templates(mosque_id);

ALTER TABLE public.automated_notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY automated_notification_templates_mosque_all
  ON public.automated_notification_templates
  FOR ALL USING (mosque_id = public.requesting_mosque_id());
CREATE POLICY automated_notification_templates_sahla
  ON public.automated_notification_templates
  FOR SELECT USING (public.is_sahla_team());
