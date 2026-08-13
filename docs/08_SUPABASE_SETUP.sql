-- Michiko Smart Ledger: shared cloud state for one Reception account.
-- Run this whole file once in Supabase SQL Editor.

create table if not exists public.smart_ledger_state (
  storage_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.smart_ledger_state enable row level security;

drop policy if exists "reception reads shared ledger state" on public.smart_ledger_state;
create policy "reception reads shared ledger state"
on public.smart_ledger_state for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "reception inserts shared ledger state" on public.smart_ledger_state;
create policy "reception inserts shared ledger state"
on public.smart_ledger_state for insert to authenticated
with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));

drop policy if exists "reception updates shared ledger state" on public.smart_ledger_state;
create policy "reception updates shared ledger state"
on public.smart_ledger_state for update to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null and updated_by = (select auth.uid()));

drop policy if exists "reception deletes shared ledger state" on public.smart_ledger_state;
create policy "reception deletes shared ledger state"
on public.smart_ledger_state for delete to authenticated
using ((select auth.uid()) is not null);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.smart_ledger_state to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'smart_ledger_state'
  ) then
    alter publication supabase_realtime add table public.smart_ledger_state;
  end if;
end $$;
