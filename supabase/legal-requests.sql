-- Restricted legal request intake for venezuela-ti-aid.
-- Run after supabase/schema.sql and supabase/audit.sql.
-- This stores official data-access requests, not exported person records.

create extension if not exists pgcrypto;

create schema if not exists legal;

create table if not exists legal.data_requests (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default timezone('utc', now()),
  status text not null default 'received' check (
    status in ('received', 'under_review', 'approved', 'denied', 'fulfilled', 'cancelled')
  ),
  authority_full_name text not null check (char_length(trim(authority_full_name)) between 3 and 180),
  institution text not null check (char_length(trim(institution)) between 3 and 180),
  official_role text not null check (char_length(trim(official_role)) between 3 and 160),
  jurisdiction text not null check (char_length(trim(jurisdiction)) between 3 and 180),
  official_email text not null check (char_length(trim(official_email)) between 6 and 254),
  official_phone text,
  court_order_id text not null check (char_length(trim(court_order_id)) between 3 and 120),
  issuing_court text not null check (char_length(trim(issuing_court)) between 3 and 180),
  order_date date not null,
  legal_basis text not null check (char_length(trim(legal_basis)) between 10 and 2000),
  scope_summary text not null check (char_length(trim(scope_summary)) between 10 and 3000),
  requested_records text not null check (char_length(trim(requested_records)) between 10 and 3000),
  urgency text not null check (urgency in ('normal', 'urgent')),
  delivery_constraints text,
  attestation boolean not null check (attestation = true),
  request_metadata jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  reviewer_notes text,
  fulfilled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists legal_data_requests_submitted_at_idx on legal.data_requests (submitted_at desc);
create index if not exists legal_data_requests_status_idx on legal.data_requests (status);
create index if not exists legal_data_requests_court_order_idx on legal.data_requests (court_order_id);

create or replace function legal.set_data_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists legal_data_requests_updated_at on legal.data_requests;
create trigger legal_data_requests_updated_at
before update on legal.data_requests
for each row execute function legal.set_data_requests_updated_at();

alter table legal.data_requests enable row level security;

revoke all on schema legal from public, anon, authenticated;
revoke all on legal.data_requests from public, anon, authenticated;

grant usage on schema legal to service_role;
grant select, insert, update on legal.data_requests to service_role;
