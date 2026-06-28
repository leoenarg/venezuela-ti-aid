-- Supabase schema for venezuela-ti-aid.
-- Run this in the Supabase SQL editor before deploying the app.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'person_status') then
    create type public.person_status as enum ('missing', 'found_alive', 'deceased', 'critical_health');
  end if;
end $$;

create table if not exists public.missing_persons (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 180),
  cedula text not null check (char_length(trim(cedula)) between 4 and 30),
  gender text not null check (gender in ('femenino', 'masculino', 'otro')),
  age integer check (age between 0 and 125),
  birth_date date,
  status public.person_status not null default 'missing',
  location_category text not null check (location_category in ('Hospital', 'Sede Policial', 'Refugio Temporal', 'Escuela Habilitada', 'Otro...')),
  location_detail text,
  last_known_state text,
  last_known_city text,
  last_known_parish text,
  image_url text,
  is_minor boolean not null,
  accepted_terms boolean not null default false,
  terms_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- age/birth_date may be unknown during emergencies: when age is known it must
  -- still match is_minor; when unknown, is_minor is set false (cannot assert minority).
  constraint missing_persons_minor_consistency check (age is null or is_minor = (age < 18)),
  -- birth_date may be null (age-only reports). NULLs are distinct in Postgres, so
  -- this only enforces a single record per (cedula, birth_date) when birth_date is known.
  constraint missing_persons_exact_identity unique (cedula, birth_date)
);

alter table public.missing_persons add column if not exists last_known_state text;
alter table public.missing_persons add column if not exists last_known_city text;
alter table public.missing_persons add column if not exists last_known_parish text;
alter table public.missing_persons add column if not exists accepted_terms boolean not null default false;
alter table public.missing_persons add column if not exists terms_version text;

-- Relax age/birth_date for existing deployments: emergencies may only yield one of them.
alter table public.missing_persons alter column age drop not null;
alter table public.missing_persons alter column birth_date drop not null;
alter table public.missing_persons drop constraint if exists missing_persons_minor_consistency;
alter table public.missing_persons add constraint missing_persons_minor_consistency check (age is null or is_minor = (age < 18));

create index if not exists missing_persons_cedula_idx on public.missing_persons (cedula);
create index if not exists missing_persons_birth_date_idx on public.missing_persons (birth_date);
create index if not exists missing_persons_exact_search_idx on public.missing_persons (cedula, birth_date);
create index if not exists missing_persons_status_idx on public.missing_persons (status);
create index if not exists missing_persons_last_known_state_idx on public.missing_persons (last_known_state);

create or replace function public.set_missing_persons_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists missing_persons_updated_at on public.missing_persons;
create trigger missing_persons_updated_at
before update on public.missing_persons
for each row execute function public.set_missing_persons_updated_at();

alter table public.missing_persons enable row level security;

revoke all on public.missing_persons from anon, authenticated;
grant insert on public.missing_persons to anon;

drop policy if exists "Anonymous humanitarian reports" on public.missing_persons;
create policy "Anonymous humanitarian reports"
on public.missing_persons
for insert
to anon
with check (
  (age is null or is_minor = (age < 18))
  and accepted_terms = true
  and terms_version is not null
  and char_length(trim(cedula)) between 4 and 30
  and char_length(trim(full_name)) between 2 and 180
);

-- RLS cannot reliably prove that a REST SELECT used cedula + birth_date filters.
-- To prevent public indexing and scraping, direct anonymous SELECT is denied.
-- Exact-match reads are exposed only through the SECURITY DEFINER RPC below.
drop policy if exists "No anonymous directory reads" on public.missing_persons;
create policy "No anonymous directory reads"
on public.missing_persons
for select
to anon
using (false);

create or replace function public.search_missing_person(search_cedula text, search_birth_date date)
returns table (
  id uuid,
  full_name text,
  status public.person_status,
  location_category text,
  location_detail text,
  last_known_state text,
  last_known_city text,
  last_known_parish text,
  image_url text,
  is_minor boolean,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    mp.id,
    case
      when mp.is_minor then 'Persona menor de edad'
      else mp.full_name
    end as full_name,
    mp.status,
    mp.location_category,
    case
      when mp.is_minor then null
      else mp.location_detail
    end as location_detail,
    mp.last_known_state,
    case
      when mp.is_minor then null
      else mp.last_known_city
    end as last_known_city,
    case
      when mp.is_minor then null
      else mp.last_known_parish
    end as last_known_parish,
    case
      when mp.is_minor then null
      else mp.image_url
    end as image_url,
    mp.is_minor,
    mp.updated_at as last_seen_at
  from public.missing_persons mp
  where mp.cedula = trim(search_cedula)
    and mp.birth_date = search_birth_date
  limit 1;
$$;

create or replace function public.get_public_state_stats()
returns table (
  state text,
  missing bigint,
  found_alive bigint,
  deceased bigint,
  critical_health bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(nullif(trim(last_known_state), ''), 'Sin especificar') as state,
    count(*) filter (where status = 'missing') as missing,
    count(*) filter (where status = 'found_alive') as found_alive,
    count(*) filter (where status = 'deceased') as deceased,
    count(*) filter (where status = 'critical_health') as critical_health
  from public.missing_persons
  group by coalesce(nullif(trim(last_known_state), ''), 'Sin especificar')
  order by state;
$$;

create or replace function public.get_public_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'total_missing', count(*) filter (where status = 'missing'),
    'found_alive', count(*) filter (where status = 'found_alive'),
    'deceased', count(*) filter (where status = 'deceased'),
    'critical_health', count(*) filter (where status = 'critical_health')
  )
  from public.missing_persons;
$$;

revoke all on function public.search_missing_person(text, date) from public;
revoke all on function public.get_public_stats() from public;
revoke all on function public.get_public_state_stats() from public;
grant execute on function public.search_missing_person(text, date) to anon;
grant execute on function public.get_public_stats() to anon;
grant execute on function public.get_public_state_stats() to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('person-photos', 'person-photos', true, 51200, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anonymous optimized photo uploads" on storage.objects;
create policy "Anonymous optimized photo uploads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'person-photos'
  and lower(storage.extension(name)) in ('jpg', 'jpeg')
);
