ALTER TABLE public.user_preferences ADD COLUMN programs_for text[] NOT NULL DEFAULT '{}';
