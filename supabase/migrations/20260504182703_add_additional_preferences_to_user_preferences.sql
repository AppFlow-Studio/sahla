ALTER TABLE public.user_preferences ADD COLUMN additional_preferences text[] NOT NULL DEFAULT '{}';
