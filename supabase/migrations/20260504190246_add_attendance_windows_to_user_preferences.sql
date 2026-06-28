ALTER TABLE public.user_preferences ADD COLUMN attendance_windows text[] NOT NULL DEFAULT '{}';
