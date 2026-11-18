-- V2-03: helpers for staff RPCs, step-up, switches with per-key defaults, access log; audit widened.
-- private.flag: a missing key is CLOSED, except intake_enabled and chat_enabled (public features stay up if a row is lost).
create or replace function private.flag(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select c.value from ops.config c where c.key = p_key),
                  case when p_key in ('intake_enabled', 'chat_enabled') then 'true' else 'false' end) = 'true'
$$;

create or replace function private.kill_switch(p_key text)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.flag(p_key) then
    raise exception 'feature_disabled:%', p_key using errcode = 'PT423';
  end if;
end $$;

create or replace function private.is_fresh_mfa(p_max_age integer default 900)
returns boolean language sql stable set search_path = '' as $$
  select private.jwt_aal() = 'aal2' and exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
    where a ->> 'method' = 'totp'
      and (a ->> 'timestamp') ~ '^[0-9]+$'
      and to_timestamp((a ->> 'timestamp')::bigint) > now() - make_interval(secs => p_max_age))
$$;

create or replace function private.assert_staff()
returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'unauthenticated' using errcode = 'PT401'; end if;
  if not private.is_staff() then raise exception 'forbidden:staff_aal2' using errcode = 'PT403'; end if;
  return (select auth.uid());
end $$;

create or replace function private.assert_admin_fresh()
returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.assert_staff();
  if private.staff_role() is distinct from 'admin'
     or not private.is_fresh_mfa(coalesce((select value from ops.config where key = 'stepup_max_age_sec'), '900')::int) then
    raise exception 'forbidden:admin_fresh_totp' using errcode = 'PT403';
  end if;
  return (select auth.uid());
end $$;

-- the inline CHECK on audit.log.op is named log_op_check
alter table audit.log drop constraint log_op_check;
alter table audit.log add constraint log_op_check check (op in ('INSERT', 'UPDATE', 'DELETE', 'ACTION', 'ACCESS'));
alter table audit.log add column request_id text check (request_id is null or char_length(request_id) <= 64);

-- Regulation 10 access log: who read which personal records, when. Written only by staff RPCs through private.log_access.
create table audit.access_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       uuid,
  actor_role  text,
  session_id  text,
  action      text not null,
  subject     text not null,
  subject_ids uuid[] not null default '{}',
  row_count   integer not null default 0,
  request_id  text
);
create index access_log_at_idx on audit.access_log (at desc);
create index access_log_actor_idx on audit.access_log (actor, at desc);
create index access_log_subject_ids_idx on audit.access_log using gin (subject_ids);
alter table audit.access_log enable row level security;
revoke all on audit.access_log from anon, authenticated;
grant select on audit.access_log to service_role;
create policy deny_api_roles on audit.access_log for all to anon, authenticated using (false) with check (false);
create trigger access_log_append_only before update or delete on audit.access_log for each row execute function audit.block_mutation();

create table audit.auth_events (
  id        bigint generated always as identity primary key,
  at        timestamptz not null default now(),
  user_id   uuid,
  kind      text not null,
  ok        boolean not null,
  ip_hash   bytea,
  source    text not null default 'gotrue' check (source in ('gotrue', 'hook')),
  source_id uuid,
  payload   jsonb
);
create unique index auth_events_source_id_idx on audit.auth_events (source_id) where source_id is not null;
create index auth_events_at_idx on audit.auth_events (at desc);
create index auth_events_user_idx on audit.auth_events (user_id, at desc) where user_id is not null;
alter table audit.auth_events enable row level security;
revoke all on audit.auth_events from anon, authenticated;
grant select, insert on audit.auth_events to service_role;
create policy deny_api_roles on audit.auth_events for all to anon, authenticated using (false) with check (false);
create trigger auth_events_append_only before update or delete on audit.auth_events for each row execute function audit.block_mutation();

create or replace function private.request_id()
returns text language sql stable set search_path = '' as $$
  select case when v ~ '^[A-Za-z0-9_-]{8,64}$' then v end
  from (select nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id' v) h
$$;

create or replace function private.log_access(p_action text, p_subject text, p_ids uuid[])
returns void language sql security definer set search_path = '' as $$
  insert into audit.access_log (actor, actor_role, session_id, action, subject, subject_ids, row_count, request_id)
  values ((select auth.uid()), private.staff_role(), auth.jwt() ->> 'session_id', p_action, p_subject,
          coalesce(p_ids, '{}'), coalesce(cardinality(p_ids), 0), private.request_id())
$$;

create or replace function private.audit_action(p_table text, p_pk text, p_cols text[], p_detail jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into audit.log (actor, actor_role, table_name, op, pk, changed_cols, new_data, request_id)
  values ((select auth.uid()), coalesce(private.staff_role(), (select auth.jwt() ->> 'role')), p_table, 'ACTION', p_pk, p_cols, p_detail,
          private.request_id())
$$;

-- internal helpers: called only from definer RPCs (owner postgres); API roles get nothing
revoke all on function private.flag(text), private.kill_switch(text), private.is_fresh_mfa(integer), private.assert_staff(),
  private.assert_admin_fresh(), private.request_id(), private.log_access(text, text, uuid[]),
  private.audit_action(text, text, text[], jsonb) from public, anon, authenticated;
