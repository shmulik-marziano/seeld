-- V2-15 (round 2): alert dead-letter + resolve, staff enable, disable guard, staff-only hook,
-- tie-break auth watermark, PII-safe customer import.
-- Moved out of this file by the round-2 review: the edge_cron_enabled gate now lives in 090700 (before any cron job is
-- scheduled), and the content_dump role lives in 091500 (role DDL can never roll back these security fixes).

-- 1. alerts: terminal state for undeliverable alerts (frees the pending dedupe index, ends 'pending > 30 min').
-- The inline CHECK of 090700 is auto-named; drop whatever status check exists, looked up by definition, then re-add by name.
do $$
declare c text;
begin
  for c in select con.conname from pg_constraint con
            where con.conrelid = 'ops.alerts'::regclass and con.contype = 'c'
              and pg_get_constraintdef(con.oid) ~ '\mstatus\M'
  loop
    execute format('alter table ops.alerts drop constraint if exists %I', c);
  end loop;
end $$;
alter table ops.alerts add constraint alerts_status_check
  check (status in ('pending', 'sent', 'resolved', 'undeliverable'));

create or replace function ops.outbox_complete(p_id bigint, p_ok boolean, p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempts int; v_topic text; v_payload jsonb;
begin
  if p_ok then
    update ops.outbox set status = 'sent', processed_at = now(), locked_until = null, last_error = null
     where id = p_id returning topic, payload into v_topic, v_payload;
    if v_topic = 'alert' then
      update ops.alerts set status = 'sent' where id = (v_payload ->> 'alert_id')::bigint and status = 'pending';
    end if;
    return;
  end if;
  select o.attempts, o.topic, o.payload into v_attempts, v_topic, v_payload from ops.outbox o where o.id = p_id;
  if v_attempts is null then return; end if;
  if v_attempts >= 5 then
    update ops.outbox set status = 'dead', processed_at = now(), last_error = left(p_error, 500), locked_until = null where id = p_id;
    if v_topic = 'alert' then
      update ops.alerts set status = 'undeliverable' where id = (v_payload ->> 'alert_id')::bigint and status = 'pending';
    end if;
    -- no new outbox_dead alert for a dead outbox_dead alert (no loop); the 24h dead window keeps health degraded
    if v_topic is distinct from 'alert' or (v_payload ->> 'kind') is distinct from 'outbox_dead' then
      perform ops.raise_alert('critical', 'outbox_dead', 'outbox id=' || p_id || ' is dead after 5 attempts', 'outbox_dead');
    end if;
  else
    update ops.outbox set status = 'pending', last_error = left(p_error, 500), locked_until = null,
           next_attempt_at = now() + (array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours'])[v_attempts]
     where id = p_id;
  end if;
end $$;

create or replace function staff.admin_alert_resolve(p_id bigint)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh();
begin
  if private.my_agency_id() is distinct from (select value::uuid from ops.config where key = 'default_agency_id') then
    raise exception 'forbidden:platform_admin' using errcode = 'PT403';
  end if;
  update ops.alerts set status = 'resolved' where id = p_id and status = 'pending';
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('ops.alerts', p_id::text, array['status'], jsonb_build_object('action', 'admin_alert_resolve'));
  return jsonb_build_object('ok', true);
end $$;

-- 2. disable: the last_admin guard was unreachable (caller is an active admin of the same agency); self guard suffices
create or replace function staff.admin_staff_disable(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_agency uuid := private.my_agency_id();
begin
  if p_user_id = v_actor then raise exception 'cannot_disable_self' using errcode = 'PT409'; end if;
  update core.staff s set active = false where s.user_id = p_user_id and s.agency_id = v_agency and s.active;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('core.staff', p_user_id::text, array['active'], jsonb_build_object('action', 'admin_staff_disable'));
  return jsonb_build_object('ok', true, 'next', 'ban_user');
end $$;

create or replace function staff.admin_staff_enable(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh();
begin
  update core.staff s set active = true, locked_until = null
   where s.user_id = p_user_id and s.agency_id = private.my_agency_id() and not s.active;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('core.staff', p_user_id::text, array['active', 'locked_until'], jsonb_build_object('action', 'admin_staff_enable'));
  return jsonb_build_object('ok', true, 'next', 'unban_user');
end $$;

revoke all on function staff.admin_staff_disable(uuid), staff.admin_staff_enable(uuid), staff.admin_alert_resolve(bigint) from public, anon;
grant execute on function staff.admin_staff_disable(uuid), staff.admin_staff_enable(uuid), staff.admin_alert_resolve(bigint) to authenticated;

-- 3. hook: staff invitations only until the client portal exists
create or replace function private.hook_before_user_created(event jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_email text := lower(event #>> '{user,email}');
begin
  if v_email is null or not exists (
      select 1 from core.invitations i
       where lower(i.email) = v_email and i.kind = 'staff' and i.expires_at > now() and i.accepted_at is null) then
    insert into audit.auth_events (kind, ok, source) values ('user_created_denied', false, 'hook');
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'ההרשמה בהזמנה בלבד.'));
  end if;
  return '{}'::jsonb;
end $$;

-- 4. auth events: (created_at, id) watermark, so more than p_limit rows sharing one timestamp can never stall the copy.
-- p_limit exists so the tie-break can be tested with a handful of rows; the watchdog calls it with the default 5000.
-- Note: auth.audit_log_entries.created_at is nullable; a row with NULL created_at never satisfies the row-value
-- comparison and is skipped forever. GoTrue always sets it, so this is accepted.
insert into ops.config (key, value) values ('auth_events_last_id', '00000000-0000-0000-0000-000000000000')
on conflict (key) do nothing;

drop function if exists ops.copy_auth_events();
create function ops.copy_auth_events(p_limit integer default 5000)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_since timestamptz := coalesce((select value::timestamptz from ops.config where key = 'auth_events_last_at'), now() - interval '1 day');
  v_last uuid := coalesce((select value::uuid from ops.config where key = 'auth_events_last_id'), '00000000-0000-0000-0000-000000000000'::uuid);
  v_fail text[] := array_remove(string_to_array(coalesce((select value from ops.config where key = 'auth_failure_actions'), ''), ','), '');
  v_pepper text := (select value from ops.config where key = 'rate_limit_pepper');
  v_limit integer := least(greatest(coalesce(p_limit, 5000), 1), 5000);
  v_max_at timestamptz; v_max_id uuid; n integer := 0;
begin
  if to_regclass('auth.audit_log_entries') is null then return 0; end if;
  with src as materialized (
    select e.id, e.created_at, e.payload::jsonb as p, to_jsonb(e) ->> 'ip_address' as ip_address
      from auth.audit_log_entries e
     where (e.created_at, e.id) > (v_since, v_last)
     order by e.created_at, e.id
     limit v_limit),
  lst as (select s.created_at, s.id from src s order by s.created_at desc, s.id desc limit 1),
  ins as (
    insert into audit.auth_events (at, user_id, kind, ok, ip_hash, source, source_id, payload)
    select s.created_at,
           case when (s.p ->> 'actor_id') ~ '^[0-9a-f-]{36}$' then (s.p ->> 'actor_id')::uuid end,
           coalesce(s.p ->> 'action', 'unknown'),
           not (coalesce(s.p ->> 'action', '') = any (v_fail)),
           case when nullif(s.ip_address, '') is not null
                then extensions.hmac(convert_to(s.ip_address, 'utf8'), convert_to(coalesce(v_pepper, ''), 'utf8'), 'sha256') end,
           'gotrue', s.id,
           jsonb_build_object('action', s.p ->> 'action', 'log_type', s.p ->> 'log_type')
      from src s
    on conflict (source_id) where source_id is not null do nothing
    returning 1)
  select (select count(*) from ins), (select created_at from lst), (select id from lst) into n, v_max_at, v_max_id;
  if v_max_at is not null then
    update ops.config set value = v_max_at::text, updated_at = now() where key = 'auth_events_last_at';
    update ops.config set value = v_max_id::text, updated_at = now() where key = 'auth_events_last_id';
  end if;
  return n;
end $$;
revoke all on function ops.copy_auth_events(integer) from public, anon, authenticated;

-- 5. (moved to 090700) edge_cron_enabled gate in ops.call_function.

-- 6. customer import: invalid rows are skipped and reported by legacy_id/ordinal; nothing raises with row values
create or replace function private.customers_import(p_rows jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_agency uuid := (select value::uuid from ops.config where key = 'default_agency_id');
        n_in integer; n_total integer; v_bad jsonb;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 1000 then
    raise exception 'invalid_input:rows' using errcode = 'PT400';
  end if;
  n_total := jsonb_array_length(p_rows);
  with src as materialized (
    select t.r, t.ord,
           coalesce(jsonb_typeof(t.r) = 'object', false) as is_obj,
           coalesce((t.r ->> 'legacy_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false) as ok_id,
           coalesce(char_length(btrim(t.r ->> 'first_name')) >= 1, false) as ok_first,
           coalesce(char_length(btrim(t.r ->> 'last_name')) >= 1, false) as ok_last,
           coalesce(char_length(regexp_replace(t.r ->> 'id_number', '[^0-9]', '', 'g')) between 5 and 9, false) as ok_nid
      from jsonb_array_elements(p_rows) with ordinality as t(r, ord)),
  good as (select s.r from src s where s.is_obj and s.ok_id and s.ok_first and s.ok_last and s.ok_nid),
  bad as (select coalesce(jsonb_agg(case when s.ok_id then to_jsonb(s.r ->> 'legacy_id') else to_jsonb('#' || s.ord) end order by s.ord), '[]'::jsonb) as ids
            from src s where not (s.is_obj and s.ok_id and s.ok_first and s.ok_last and s.ok_nid)),
  ins as (
    insert into crm.customers (agency_id, legacy_id, first_name, last_name, mobile_phone, email,
                               national_id_hmac, national_id_enc, details_enc)
    select v_agency, (g.r ->> 'legacy_id')::uuid, left(btrim(g.r ->> 'first_name'), 80), left(btrim(g.r ->> 'last_name'), 80),
           case when x.phone ~ '^0[2-9][0-9]{7,8}$' then x.phone end,
           case when char_length(x.email) <= 254 and x.email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then x.email end,
           private.national_id_hmac(g.r ->> 'id_number'),
           private.pii_encrypt(private.national_id_norm(g.r ->> 'id_number')),
           case when jsonb_typeof(g.r -> 'details') = 'object' and g.r -> 'details' <> '{}'::jsonb
                then private.pii_encrypt((g.r -> 'details')::text) end
      from good g
      cross join lateral (select regexp_replace(regexp_replace(coalesce(g.r ->> 'mobile_phone', ''), '[^0-9+]', '', 'g'), '^(\+972|972)', '0') as phone,
                                 lower(btrim(coalesce(g.r ->> 'email', ''))) as email) x
    on conflict do nothing
    returning 1)
  select (select count(*) from ins), (select ids from bad) into n_in, v_bad;
  return jsonb_build_object('received', n_total, 'inserted', n_in, 'skipped', n_total - n_in,
                            'invalid', jsonb_array_length(v_bad), 'invalid_ids', v_bad);
end $$;
revoke all on function private.customers_import(jsonb) from public, anon, authenticated, service_role;

-- 7. (moved to 091500) content_dump role.
