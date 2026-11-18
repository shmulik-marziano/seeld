-- V2-04 (ADR-22, ADR-23): staff schema; lead PII is read ONLY through named RPCs that write audit.access_log.
create schema if not exists staff;
comment on schema staff is 'Exposed to PostgREST for staff only: security_invoker views and named RPCs. anon has no usage.';
revoke all on schema staff from public, anon, authenticated;
grant usage on schema staff to authenticated, service_role;
alter default privileges for role postgres in schema staff revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema staff revoke all on sequences from anon, authenticated;

-- api.leads had no consumer (the site still reads Tokyo); replaced by staff.leads_list / staff.lead_get
drop view api.leads;

-- crm.leads: no direct read or write for API roles. Reads = staff.leads_list/lead_get (logged), writes = staff.lead_*.
revoke select, insert, update on crm.leads from authenticated;
drop policy leads_select on crm.leads;
drop policy leads_insert on crm.leads;
drop policy leads_update on crm.leads;
create policy deny_api_roles on crm.leads for all to anon, authenticated using (false) with check (false);
revoke usage on schema crm from authenticated;

-- colleagues list (assign dropdown). Invoker view: the agency-scoped policy staff_select on core.staff applies.
create view staff.members with (security_invoker = true) as
  select s.user_id, s.role, s.display_name, s.active,
         coalesce(s.locked_until > now(), false) as locked, s.agency_id
    from core.staff s;
revoke all on staff.members from anon, authenticated;
grant select on staff.members to authenticated;

create or replace function staff.leads_list(p_status text default null, p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, kind text, status text, full_name text, phone text, email text, message text, payload jsonb,
               source text, assigned_to uuid, notes text, agency_id uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare v_actor uuid := private.assert_staff(); v_agency uuid := private.my_agency_id(); v_ids uuid[];
begin
  if p_status is not null and p_status not in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam') then
    raise exception 'invalid_input:status' using errcode = 'PT400';
  end if;
  select coalesce(array_agg(x.id order by x.created_at desc, x.id), '{}') into v_ids
    from (select l.id, l.created_at from crm.leads l
           where l.agency_id = v_agency and l.deleted_at is null and (p_status is null or l.status = p_status)
           order by l.created_at desc, l.id
           limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) x;
  perform private.log_access('leads_list', 'crm.leads', v_ids);
  return query
    select l.id, l.kind, l.status, l.full_name, l.phone, l.email, l.message, l.payload, l.source, l.assigned_to, l.notes,
           l.agency_id, l.created_at, l.updated_at
      from crm.leads l where l.id = any (v_ids)
     order by l.created_at desc, l.id;
end $$;

create or replace function staff.lead_get(p_lead_id uuid)
returns table (id uuid, kind text, status text, full_name text, phone text, email text, message text, payload jsonb,
               source text, assigned_to uuid, notes text, agency_id uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare v_actor uuid := private.assert_staff();
begin
  if not exists (select 1 from crm.leads l
                  where l.id = p_lead_id and l.deleted_at is null and l.agency_id = private.my_agency_id()) then
    raise exception 'not_found' using errcode = 'PT404';
  end if;
  perform private.log_access('lead_get', 'crm.leads', array[p_lead_id]);
  return query
    select l.id, l.kind, l.status, l.full_name, l.phone, l.email, l.message, l.payload, l.source, l.assigned_to, l.notes,
           l.agency_id, l.created_at, l.updated_at
      from crm.leads l where l.id = p_lead_id;
end $$;

create or replace function staff.lead_set_status(p_lead_id uuid, p_status text, p_reason text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); v_old text;
begin
  if p_status is null or p_status not in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam') then
    raise exception 'invalid_input:status' using errcode = 'PT400';
  end if;
  select l.status into v_old from crm.leads l
   where l.id = p_lead_id and l.deleted_at is null and l.agency_id = private.my_agency_id() for update;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  if v_old = p_status then return jsonb_build_object('ok', true, 'unchanged', true); end if;
  update crm.leads set status = p_status where id = p_lead_id;
  perform private.audit_action('crm.leads', p_lead_id::text, array['status'],
    jsonb_build_object('action', 'lead_set_status', 'from', v_old, 'to', p_status, 'reason_given', p_reason is not null));
  return jsonb_build_object('ok', true);
end $$;

create or replace function staff.lead_assign(p_lead_id uuid, p_assignee uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); v_agency uuid := private.my_agency_id(); v_old uuid;
begin
  if p_assignee is not null and not exists (
    select 1 from core.staff s where s.user_id = p_assignee and s.active and s.agency_id = v_agency) then
    raise exception 'invalid_input:assignee' using errcode = 'PT400';
  end if;
  select l.assigned_to into v_old from crm.leads l
   where l.id = p_lead_id and l.deleted_at is null and l.agency_id = v_agency for update;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  if v_old is not distinct from p_assignee then return jsonb_build_object('ok', true, 'unchanged', true); end if;
  update crm.leads set assigned_to = p_assignee where id = p_lead_id;
  perform private.audit_action('crm.leads', p_lead_id::text, array['assigned_to'],
    jsonb_build_object('action', 'lead_assign', 'from', v_old, 'to', p_assignee));
  return jsonb_build_object('ok', true);
end $$;

create or replace function staff.lead_note_add(p_lead_id uuid, p_note text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); v_note text := btrim(coalesce(p_note, ''));
begin
  if char_length(v_note) not between 1 and 1000 then raise exception 'invalid_input:note' using errcode = 'PT400'; end if;
  update crm.leads l
     set notes = right(coalesce(l.notes || chr(10), '') || to_char(now() at time zone 'Asia/Jerusalem', 'YYYY-MM-DD HH24:MI') || ' ' || v_note, 8000)
   where l.id = p_lead_id and l.deleted_at is null and l.agency_id = private.my_agency_id();
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('crm.leads', p_lead_id::text, array['notes'],
    jsonb_build_object('action', 'lead_note_add', 'chars', char_length(v_note)));
  return jsonb_build_object('ok', true);
end $$;

create or replace function staff.lead_soft_delete(p_lead_id uuid, p_reason text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff();
begin
  update crm.leads l set deleted_at = now()
   where l.id = p_lead_id and l.deleted_at is null and l.agency_id = private.my_agency_id();
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('crm.leads', p_lead_id::text, array['deleted_at'],
    jsonb_build_object('action', 'lead_soft_delete', 'reason_given', p_reason is not null));
  return jsonb_build_object('ok', true);
end $$;

-- called by staff-invite with the user's JWT
create or replace function staff.admin_assert_fresh()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := private.assert_admin_fresh();
begin
  return jsonb_build_object('user_id', v_uid, 'agency_id', private.my_agency_id());
end $$;

create or replace function staff.admin_config_set(p_key text, p_value text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_old text;
begin
  if p_key is null or p_key not in ('intake_enabled', 'chat_enabled', 'portal_enabled', 'tracks_sync_enabled',
      'lead_retention_enabled', 'auth_lock_enabled', 'stepup_max_age_sec') then
    raise exception 'invalid_input:key' using errcode = 'PT400';
  end if;
  if p_key = 'stepup_max_age_sec' then
    if coalesce(p_value, '') !~ '^[0-9]{3,4}$' or p_value::int not between 300 and 3600 then
      raise exception 'invalid_input:value' using errcode = 'PT400';
    end if;
  elsif p_value is null or p_value not in ('true', 'false') then
    raise exception 'invalid_input:value' using errcode = 'PT400';
  end if;
  select value into v_old from ops.config where key = p_key for update;
  insert into ops.config (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
  perform private.audit_action('ops.config', p_key, array['value'],
    jsonb_build_object('action', 'admin_config_set', 'from', v_old, 'to', p_value));
  return jsonb_build_object('ok', true);
end $$;

revoke all on function staff.leads_list(text, integer, integer), staff.lead_get(uuid), staff.lead_set_status(uuid, text, text),
  staff.lead_assign(uuid, uuid), staff.lead_note_add(uuid, text), staff.lead_soft_delete(uuid, text),
  staff.admin_assert_fresh(), staff.admin_config_set(text, text) from public, anon;
grant execute on function staff.leads_list(text, integer, integer), staff.lead_get(uuid), staff.lead_set_status(uuid, text, text),
  staff.lead_assign(uuid, uuid), staff.lead_note_add(uuid, text), staff.lead_soft_delete(uuid, text),
  staff.admin_assert_fresh(), staff.admin_config_set(text, text) to authenticated;
