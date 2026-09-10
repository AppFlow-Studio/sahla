-- Add vendor, notes, status, and mosque link to expenses (Sahla HQ CRM)
alter table public.expenses
  add column if not exists vendor text,
  add column if not exists notes text,
  add column if not exists status text not null default 'active',
  add column if not exists mosque_id text references public.mosques(id) on delete set null;

-- Constrain status to known values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'expenses_status_check'
  ) then
    alter table public.expenses
      add constraint expenses_status_check
      check (status in ('active', 'paused', 'cancelled'));
  end if;
end $$;

create index if not exists idx_expenses_mosque_id on public.expenses(mosque_id);
