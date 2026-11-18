-- V2-10 (ADR-30): failed-login detection, temporary lock, disable. Lockout hooks are Team-only, so this is our code.
-- core.staff.locked_until is added in V2-02 (staff.members reads it).
create or replace function private.staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select s.role from core.staff s
   where s.user_id = (select auth.uid()) and s.active and (s.locked_until is null or s.locked_until < now())
$$;

-- auth_failure_actions stays EMPTY until a real failed login on a branch shows the action names GoTrue writes (day 3).
-- auth_lock_enabled stays false until then. The watchdog warns while either is unset.
insert into ops.config (key, value) values
  ('auth_events_last_at', '1970-01-01T00:00:00Z'),
  ('auth_failure_actions', ''),
  ('auth_lock_enabled', 'false')
on conflict (key) do nothing;

-- boundary-safe: >= watermark + unique source_id, so rows sharing the boundary timestamp are never lost or doubled
create or replace function ops.copy_auth_events()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_since timestamptz := coalesce((select value::timestamptz from ops.config where key = 'auth_events_last_at'), now() - interval '1 day');
  v_fail text[] := array_remove(string_to_array(coalesce((select value from ops.config where key = 'auth_failure_actions'), ''), ','), '');
  v_pepper text := (select value from ops.config where key = 'rate_limit_pepper');
  v_max timestamptz; n integer := 0;
begin
  if to_regclass('auth.audit_log_entries') is null then return 0; end if;
  select max(s.created_at) into v_max
    from (select e.created_at from auth.audit_log_entries e where e.created_at >= v_since
           order by e.created_at, e.id limit 5000) s;
  with src as (
    select e.id, e.created_at, e.payload::jsonb as p, to_jsonb(e) ->> 'ip_address' as ip_address
      from auth.audit_log_entries e
     where e.created_at >= v_since and e.created_at <= v_max),
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
  select count(*) into n from ins;
  if v_max is not null then
    update ops.config set value = v_max::text, updated_at = now() where key = 'auth_events_last_at';
  end if;
  return n;
end $$;
revoke all on function ops.copy_auth_events() from public, anon, authenticated;

-- disable = data access ends at once (staff_role() is null). staff-invite then bans the auth user
-- (auth.admin.updateUserById(id, { ban_duration: '876000h' })), which blocks refresh; the last access token dies within 15 min.
create or replace function staff.admin_staff_disable(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_agency uuid := private.my_agency_id(); v_role text;
begin
  if p_user_id = v_actor then raise exception 'cannot_disable_self' using errcode = 'PT409'; end if;
  select s.role into v_role from core.staff s
   where s.user_id = p_user_id and s.agency_id = v_agency and s.active for update;
  if v_role is null then raise exception 'not_found' using errcode = 'PT404'; end if;
  if v_role = 'admin' and (select count(*) from core.staff s
                            where s.agency_id = v_agency and s.active and s.role = 'admin') <= 1 then
    raise exception 'last_admin' using errcode = 'PT409';
  end if;
  update core.staff set active = false where user_id = p_user_id;
  perform private.audit_action('core.staff', p_user_id::text, array['active'], jsonb_build_object('action', 'admin_staff_disable'));
  return jsonb_build_object('ok', true, 'next', 'ban_user');
end $$;

create or replace function staff.admin_staff_unlock(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh();
begin
  update core.staff s set locked_until = null
   where s.user_id = p_user_id and s.agency_id = private.my_agency_id() and s.locked_until is not null;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('core.staff', p_user_id::text, array['locked_until'], jsonb_build_object('action', 'admin_staff_unlock'));
  return jsonb_build_object('ok', true);
end $$;

revoke all on function staff.admin_staff_disable(uuid), staff.admin_staff_unlock(uuid) from public, anon;
grant execute on function staff.admin_staff_disable(uuid), staff.admin_staff_unlock(uuid) to authenticated;
