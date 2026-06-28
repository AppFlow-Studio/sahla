-- Restore the pipeline_stages -> mosques FK so PostgREST can resolve
-- embedded selects (.select('*, mosques(...)')) on the pipeline page.
-- mosque_id is nullable, so standalone leads (no mosque) still work —
-- FKs do not constrain NULL values.

ALTER TABLE public.pipeline_stages
  ADD CONSTRAINT pipeline_stages_mosque_id_fkey
  FOREIGN KEY (mosque_id) REFERENCES public.mosques(id);

NOTIFY pgrst, 'reload schema';
