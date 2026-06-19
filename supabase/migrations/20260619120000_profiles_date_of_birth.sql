-- Let users record a date of birth on their profile (edited from the in-app
-- Edit Profile sheet). Stored as a real date; PostgREST exchanges it as a
-- "YYYY-MM-DD" string, matching the app's DatePicker format. Distinct from
-- user_preferences.birth_year, which is the coarse life-stage signal.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date;
