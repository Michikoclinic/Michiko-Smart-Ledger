-- Michiko Smart Ledger: Supabase foundation
-- Run this file once in Supabase SQL Editor before enabling online login.

create extension if not exists pgcrypto;

create table if not exists public.branch_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  branch text not null check (branch in ('พหลโยธิน 21', 'EmSphere')),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  branch text not null check (branch in ('พหลโยธิน 21', 'EmSphere')),
  ledger_date date not null,
  position integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branch_settings (
  branch text not null check (branch in ('พหลโยธิน 21', 'EmSphere')),
  setting_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (branch, setting_key)
);

create or replace function public.current_user_branch()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select branch from public.branch_profiles where user_id = auth.uid()
$$;

alter table public.branch_profiles enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.branch_settings enable row level security;

drop policy if exists "read own branch profile" on public.branch_profiles;
create policy "read own branch profile" on public.branch_profiles
for select to authenticated using (user_id = auth.uid());

drop policy if exists "branch members read ledger" on public.ledger_entries;
create policy "branch members read ledger" on public.ledger_entries
for select to authenticated using (branch = public.current_user_branch());

drop policy if exists "branch members add ledger" on public.ledger_entries;
create policy "branch members add ledger" on public.ledger_entries
for insert to authenticated with check (
  branch = public.current_user_branch() and created_by = auth.uid()
);

drop policy if exists "branch members edit ledger" on public.ledger_entries;
create policy "branch members edit ledger" on public.ledger_entries
for update to authenticated
using (branch = public.current_user_branch())
with check (branch = public.current_user_branch());

drop policy if exists "branch members delete ledger" on public.ledger_entries;
create policy "branch members delete ledger" on public.ledger_entries
for delete to authenticated using (branch = public.current_user_branch());

drop policy if exists "branch members read settings" on public.branch_settings;
create policy "branch members read settings" on public.branch_settings
for select to authenticated using (branch = public.current_user_branch());

drop policy if exists "branch members add settings" on public.branch_settings;
create policy "branch members add settings" on public.branch_settings
for insert to authenticated with check (
  branch = public.current_user_branch() and updated_by = auth.uid()
);

drop policy if exists "branch members edit settings" on public.branch_settings;
create policy "branch members edit settings" on public.branch_settings
for update to authenticated
using (branch = public.current_user_branch())
with check (branch = public.current_user_branch());

grant usage on schema public to authenticated;
grant select on public.branch_profiles to authenticated;
grant select, insert, update, delete on public.ledger_entries to authenticated;
grant select, insert, update on public.branch_settings to authenticated;

create index if not exists ledger_entries_branch_date_idx
on public.ledger_entries(branch, ledger_date, position);

-- After creating the two users in Authentication > Users, link each user UUID:
-- insert into public.branch_profiles(user_id, branch, display_name)
-- values ('USER_UUID_HERE', 'พหลโยธิน 21', 'พหลโยธิน 21');
-- insert into public.branch_profiles(user_id, branch, display_name)
-- values ('USER_UUID_HERE', 'EmSphere', 'EmSphere');
