-- Defensive audit layer for venezuela-ti-aid.
-- Run after supabase/schema.sql in the Supabase SQL editor.

create extension if not exists pgcrypto;

create schema if not exists audit;

create table if not exists audit.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default timezone('utc', now()),
  event_type text not null check (char_length(trim(event_type)) between 2 and 120),
  actor_user_id uuid,
  actor_role text,
  session_hash text,
  entity_type text,
  entity_id text,
  request_id text,
  ip inet,
  ip_hash text,
  user_agent text,
  referer text,
  origin text,
  method text,
  path text,
  status_code int,
  geo jsonb not null default '{}'::jsonb,
  device jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  previous_hash text,
  row_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_events_occurred_at_idx on audit.audit_events (occurred_at desc);
create index if not exists audit_events_event_type_idx on audit.audit_events (event_type);
create index if not exists audit_events_entity_idx on audit.audit_events (entity_type, entity_id);
create index if not exists audit_events_ip_hash_idx on audit.audit_events (ip_hash);
create index if not exists audit_events_request_id_idx on audit.audit_events (request_id);

alter table audit.audit_events enable row level security;

revoke all on schema audit from public, anon, authenticated;
revoke all on audit.audit_events from public, anon, authenticated;
grant usage on schema audit to service_role;
grant select, insert on audit.audit_events to service_role;

create or replace function audit.audit_event_payload(
  p_id uuid,
  p_occurred_at timestamptz,
  p_event_type text,
  p_actor_user_id uuid,
  p_actor_role text,
  p_session_hash text,
  p_entity_type text,
  p_entity_id text,
  p_request_id text,
  p_ip inet,
  p_ip_hash text,
  p_user_agent text,
  p_referer text,
  p_origin text,
  p_method text,
  p_path text,
  p_status_code int,
  p_geo jsonb,
  p_device jsonb,
  p_metadata jsonb,
  p_previous_hash text,
  p_created_at timestamptz
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'id', p_id,
    'occurred_at', p_occurred_at,
    'event_type', p_event_type,
    'actor_user_id', p_actor_user_id,
    'actor_role', p_actor_role,
    'session_hash', p_session_hash,
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'request_id', p_request_id,
    'ip', p_ip,
    'ip_hash', p_ip_hash,
    'user_agent', p_user_agent,
    'referer', p_referer,
    'origin', p_origin,
    'method', p_method,
    'path', p_path,
    'status_code', p_status_code,
    'geo', coalesce(p_geo, '{}'::jsonb),
    'device', coalesce(p_device, '{}'::jsonb),
    'metadata', coalesce(p_metadata, '{}'::jsonb),
    'previous_hash', p_previous_hash,
    'created_at', p_created_at
  );
$$;

create or replace function audit.block_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit.audit_events is append-only';
end;
$$;

drop trigger if exists audit_events_no_update on audit.audit_events;
create trigger audit_events_no_update
before update on audit.audit_events
for each row execute function audit.block_audit_event_mutation();

drop trigger if exists audit_events_no_delete on audit.audit_events;
create trigger audit_events_no_delete
before delete on audit.audit_events
for each row execute function audit.block_audit_event_mutation();

create or replace function audit.log_event(
  p_event_type text,
  p_actor_user_id uuid default null,
  p_actor_role text default null,
  p_session_hash text default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_request_id text default null,
  p_ip inet default null,
  p_audit_salt text default null,
  p_user_agent text default null,
  p_referer text default null,
  p_origin text default null,
  p_method text default null,
  p_path text default null,
  p_status_code int default null,
  p_geo jsonb default '{}'::jsonb,
  p_device jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = audit, public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_occurred_at timestamptz := timezone('utc', now());
  v_created_at timestamptz := timezone('utc', now());
  v_previous_hash text;
  v_ip_hash text;
  v_payload jsonb;
  v_row_hash text;
begin
  perform pg_advisory_xact_lock(hashtext('audit.audit_events.hash_chain'));

  select row_hash
  into v_previous_hash
  from audit.audit_events
  order by occurred_at desc, created_at desc, id desc
  limit 1;

  if p_ip is not null and nullif(p_audit_salt, '') is not null then
    v_ip_hash := encode(digest(p_ip::text || ':' || p_audit_salt, 'sha256'), 'hex');
  elsif p_ip is not null then
    v_ip_hash := encode(digest(p_ip::text, 'sha256'), 'hex');
  end if;

  v_payload := audit.audit_event_payload(
    v_id,
    v_occurred_at,
    trim(p_event_type),
    p_actor_user_id,
    nullif(trim(coalesce(p_actor_role, '')), ''),
    nullif(trim(coalesce(p_session_hash, '')), ''),
    nullif(trim(coalesce(p_entity_type, '')), ''),
    nullif(trim(coalesce(p_entity_id, '')), ''),
    nullif(trim(coalesce(p_request_id, '')), ''),
    p_ip,
    v_ip_hash,
    nullif(p_user_agent, ''),
    nullif(p_referer, ''),
    nullif(p_origin, ''),
    nullif(p_method, ''),
    nullif(p_path, ''),
    p_status_code,
    coalesce(p_geo, '{}'::jsonb),
    coalesce(p_device, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    v_previous_hash,
    v_created_at
  );

  v_row_hash := encode(digest(v_payload::text, 'sha256'), 'hex');

  insert into audit.audit_events (
    id,
    occurred_at,
    event_type,
    actor_user_id,
    actor_role,
    session_hash,
    entity_type,
    entity_id,
    request_id,
    ip,
    ip_hash,
    user_agent,
    referer,
    origin,
    method,
    path,
    status_code,
    geo,
    device,
    metadata,
    previous_hash,
    row_hash,
    created_at
  )
  values (
    v_id,
    v_occurred_at,
    trim(p_event_type),
    p_actor_user_id,
    nullif(trim(coalesce(p_actor_role, '')), ''),
    nullif(trim(coalesce(p_session_hash, '')), ''),
    nullif(trim(coalesce(p_entity_type, '')), ''),
    nullif(trim(coalesce(p_entity_id, '')), ''),
    nullif(trim(coalesce(p_request_id, '')), ''),
    p_ip,
    v_ip_hash,
    nullif(p_user_agent, ''),
    nullif(p_referer, ''),
    nullif(p_origin, ''),
    nullif(p_method, ''),
    nullif(p_path, ''),
    p_status_code,
    coalesce(p_geo, '{}'::jsonb),
    coalesce(p_device, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    v_previous_hash,
    v_row_hash,
    v_created_at
  );

  return v_id;
end;
$$;

revoke all on function audit.log_event(text, uuid, text, text, text, text, text, inet, text, text, text, text, text, text, int, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function audit.log_event(text, uuid, text, text, text, text, text, inet, text, text, text, text, text, text, int, jsonb, jsonb, jsonb) to service_role;

create or replace function public.log_audit_event(
  p_event_type text,
  p_actor_user_id uuid default null,
  p_actor_role text default null,
  p_session_hash text default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_request_id text default null,
  p_ip inet default null,
  p_audit_salt text default null,
  p_user_agent text default null,
  p_referer text default null,
  p_origin text default null,
  p_method text default null,
  p_path text default null,
  p_status_code int default null,
  p_geo jsonb default '{}'::jsonb,
  p_device jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = audit, public
as $$
  select audit.log_event(
    p_event_type,
    p_actor_user_id,
    p_actor_role,
    p_session_hash,
    p_entity_type,
    p_entity_id,
    p_request_id,
    p_ip,
    p_audit_salt,
    p_user_agent,
    p_referer,
    p_origin,
    p_method,
    p_path,
    p_status_code,
    p_geo,
    p_device,
    p_metadata
  );
$$;

revoke all on function public.log_audit_event(text, uuid, text, text, text, text, text, inet, text, text, text, text, text, text, int, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.log_audit_event(text, uuid, text, text, text, text, text, inet, text, text, text, text, text, text, int, jsonb, jsonb, jsonb) to service_role;

create or replace function audit.verify_chain()
returns jsonb
language plpgsql
security definer
set search_path = audit, public
as $$
declare
  v_event audit.audit_events%rowtype;
  v_previous_hash text := null;
  v_expected_hash text;
  v_errors jsonb := '[]'::jsonb;
begin
  for v_event in
    select *
    from audit.audit_events
    order by occurred_at asc, created_at asc, id asc
  loop
    if v_event.previous_hash is distinct from v_previous_hash then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'id', v_event.id,
        'error', 'previous_hash_mismatch',
        'expected', v_previous_hash,
        'actual', v_event.previous_hash
      ));
    end if;

    v_expected_hash := encode(digest(audit.audit_event_payload(
      v_event.id,
      v_event.occurred_at,
      v_event.event_type,
      v_event.actor_user_id,
      v_event.actor_role,
      v_event.session_hash,
      v_event.entity_type,
      v_event.entity_id,
      v_event.request_id,
      v_event.ip,
      v_event.ip_hash,
      v_event.user_agent,
      v_event.referer,
      v_event.origin,
      v_event.method,
      v_event.path,
      v_event.status_code,
      v_event.geo,
      v_event.device,
      v_event.metadata,
      v_event.previous_hash,
      v_event.created_at
    )::text, 'sha256'), 'hex');

    if v_event.row_hash is distinct from v_expected_hash then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'id', v_event.id,
        'error', 'row_hash_mismatch',
        'expected', v_expected_hash,
        'actual', v_event.row_hash
      ));
    end if;

    v_previous_hash := v_event.row_hash;
  end loop;

  return jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'checked_at', timezone('utc', now()),
    'errors', v_errors
  );
end;
$$;

revoke all on function audit.verify_chain() from public, anon, authenticated;
grant execute on function audit.verify_chain() to service_role;

create or replace function audit.export_events(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_event_type text default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_ip_hash text default null,
  p_request_id text default null,
  p_audit_salt text default null
)
returns jsonb
language plpgsql
security definer
set search_path = audit, public
as $$
declare
  v_exported_at timestamptz := timezone('utc', now());
  v_events jsonb;
  v_filters jsonb;
  v_payload jsonb;
begin
  v_filters := jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'event_type', p_event_type,
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'ip_hash', p_ip_hash,
    'request_id', p_request_id
  );

  select coalesce(jsonb_agg(to_jsonb(e) order by e.occurred_at asc, e.id asc), '[]'::jsonb)
  into v_events
  from audit.audit_events e
  where (p_from is null or e.occurred_at >= p_from)
    and (p_to is null or e.occurred_at <= p_to)
    and (p_event_type is null or e.event_type = p_event_type)
    and (p_entity_type is null or e.entity_type = p_entity_type)
    and (p_entity_id is null or e.entity_id = p_entity_id)
    and (p_ip_hash is null or e.ip_hash = p_ip_hash)
    and (p_request_id is null or e.request_id = p_request_id);

  v_payload := jsonb_build_object(
    'exported_at', v_exported_at,
    'filters', v_filters,
    'events', v_events,
    'total_events', jsonb_array_length(v_events)
  );

  v_payload := v_payload || jsonb_build_object(
    'export_hash', encode(digest(v_payload::text, 'sha256'), 'hex')
  );

  perform audit.log_event(
    'AUDIT_EXPORT',
    null,
    'service_role',
    null,
    'audit',
    null,
    gen_random_uuid()::text,
    null,
    p_audit_salt,
    null,
    null,
    null,
    'SQL',
    'audit.export_events',
    200,
    '{}'::jsonb,
    '{}'::jsonb,
    jsonb_build_object('filters', v_filters, 'total_events', jsonb_array_length(v_events))
  );

  return v_payload;
end;
$$;

revoke all on function audit.export_events(timestamptz, timestamptz, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function audit.export_events(timestamptz, timestamptz, text, text, text, text, text, text) to service_role;
