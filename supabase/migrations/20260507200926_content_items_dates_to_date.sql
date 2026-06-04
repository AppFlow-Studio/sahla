ALTER TABLE public.content_items
  ALTER COLUMN start_date TYPE date USING start_date::date,
  ALTER COLUMN end_date   TYPE date USING end_date::date;
