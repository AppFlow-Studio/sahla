-- Records when a user finishes the personalization flow (reaches the all-set
-- screen). Read by the "For You" banner to show Edit (complete) vs Continue
-- (started) vs Get started (none). Nullable: null = not yet completed.
alter table public.user_preferences
  add column if not exists personalization_completed_at timestamptz;
