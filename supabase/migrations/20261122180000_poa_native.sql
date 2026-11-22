-- V3-02 "the package first, the tool after" (owner decision 2026-11-22): with poa_engine = 'native' the client's journey runs
-- entirely on our side (poa-intake renders the three documents from the approved templates, records the approvals and stores
-- the signed files) and the tool is fed AFTERWARDS by a queued job (surense-worker, kind surense.poa_ship) that never
-- touches the client. This migration adds:
--   crm.poa_sessions.ship_status / ship_error / ship_attempts / shipped_at   the ship state staff see
--   api.poa_document_from_url(..., p_source)   the native engine's own file takes source = 'native'
--   api.poa_session_fail   a 'ship_' code is accepted on a completed session (like 'launch_' / 'docs_')
--   api.poa_ship_enqueue / poa_ship_get / poa_ship_set   the ship job's RPCs (service_role; the get decrypts for that call only and
--       leaves an audit row)
--   staff.poa_session_list (+ ship columns), staff.poa_ship_retry   "שגר שוב"
--   job kind surense.poa_ship, and the surense-worker tick (every minute, through ops.call_function: a no-op while
--       edge_cron_enabled = 'false'; OWNER-STEPS 6.18)
-- Behind the existing switches: poa_enabled (wizard), poa_docs_enabled (files), surense_enabled (queue), surense_write_enabled
-- (the ship itself, api.surense_gate). Applying needs no secret. Nothing here deletes anything.

-- ---------------------------------------------------------------- ship state
alter table crm.poa_sessions
  add column ship_status   text check (ship_status is null or ship_status in ('pending', 'shipped', 'failed')),
  add column ship_error    text check (ship_error is null or ship_error ~ '^[a-z0-9_.:-]{1,80}$'),
  add column ship_attempts integer not null default 0,
  add column shipped_at    timestamptz;
comment on column crm.poa_sessions.ship_status is 'native engine: pending (queued for the tool) / shipped / failed (ship_error holds a code; staff may re-queue)';
create index poa_sessions_ship_idx on crm.poa_sessions (ship_status, completed_at) where ship_status in ('pending', 'failed');

-- ---------------------------------------------------------------- api.poa_document_from_url: + p_source ('surense' | 'native')
drop function api.poa_document_from_url(uuid, text, text);
create function api.poa_document_from_url(p_session uuid, p_kind text, p_sha256 text, p_source text default 'surense')
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; v_doc uuid; v_stored boolean; v_complete boolean;
begin
  perform private.kill_switch('poa_docs_enabled');
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  if p_source is null or p_source not in ('surense', 'native') then raise exception 'invalid_input:source' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_session for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'locked' then raise exception 'session_locked' using errcode = 'PT403'; end if;
  if s.status = 'expired'
     or (s.status = 'open' and s.expires_at <= now())
     or (s.status = 'completed' and s.completed_at <= now() - interval '24 hours') then
    raise exception 'session_expired' using errcode = 'PT410';
  end if;
  if not coalesce((s.modules -> p_kind ->> 'enabled')::boolean, false) or not coalesce((s.modules -> p_kind ->> 'performed')::boolean, false) then
    raise exception 'invalid_input:kind' using errcode = 'PT400';
  end if;
  insert into crm.documents as d (session_id, kind, source, status, sha256)
  values (s.id, p_kind, p_source, 'pending_staff_verification', decode(p_sha256, 'hex'))
  on conflict (session_id, kind) do update
    set sha256 = excluded.sha256, source = excluded.source
    where d.status in ('incomplete', 'pending_staff_verification') and d.storage_path is null
  returning d.id into v_doc;
  if v_doc is null then
    select d.id into v_doc from crm.documents d where d.session_id = s.id and d.kind = p_kind and d.status <> 'revoked';
    if v_doc is null then raise exception 'document_not_found' using errcode = 'PT404'; end if;
  end if;
  select d.storage_path is not null into v_stored from crm.documents d where d.id = v_doc;
  select not exists (select 1 from unnest(array['maslaka', 'harbit', 'policies']) k
                      where coalesce((s.modules -> k ->> 'enabled')::boolean, false)
                        and not exists (select 1 from crm.documents d where d.session_id = s.id and d.kind = k and d.status <> 'revoked'))
    into v_complete;
  if v_complete and s.docs_complete_at is null then update crm.poa_sessions set docs_complete_at = now() where id = s.id; end if;
  perform private.audit_action('crm.documents', v_doc::text, '{}', jsonb_build_object('action', 'poa_document_from_url', 'kind', p_kind, 'source', p_source, 'complete', v_complete));
  return jsonb_build_object('linked', true, 'session_id', s.id, 'agency_id', s.agency_id, 'document_id', v_doc, 'stored', v_stored, 'complete', v_complete);
end $$;

-- ---------------------------------------------------------------- api.poa_session_fail: 'ship_' joins 'launch_' / 'docs_'
create or replace function api.poa_session_fail(p_session uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  perform private.kill_switch('poa_enabled');
  if p_code is null or p_code !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  if p_code ~ '^(launch|docs|ship)_' then
    if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
    select * into s from crm.poa_sessions where id = p_session for update;
    if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
    if s.status <> 'completed' and not (p_code ~ '^docs_' and s.status = 'open') then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
    update crm.poa_sessions set engine_last_error = p_code where id = s.id;
    perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_last_error'],
      jsonb_build_object('action', case when p_code ~ '^docs_' then 'poa_docs_not_stored' when p_code ~ '^ship_' then 'poa_ship_not_queued' else 'poa_launch_not_queued' end, 'code', p_code));
    return jsonb_build_object('ok', true);
  end if;
  s := private.poa_open_session(p_session);
  update crm.poa_sessions set engine_last_error = p_code, status = case when p_code = 'locked' then 'locked' else status end where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_last_error'], jsonb_build_object('action', 'poa_session_fail', 'code', p_code));
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------- job kind: the ship
alter table ops.surense_jobs drop constraint surense_jobs_kind_check;
alter table ops.surense_jobs add constraint surense_jobs_kind_check
  check (kind in ('surense.event', 'surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit', 'surense.poa_ship'));

-- api.surense_job_enqueue: 20261121150000 verbatim + 'surense.poa_ship' in the whitelist
create or replace function api.surense_job_enqueue(p_kind text, p_params jsonb default '{}'::jsonb, p_dedupe text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform private.kill_switch('surense_enabled');
  if p_kind is null or p_kind not in ('surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit', 'surense.poa_ship') then
    raise exception 'invalid_input:kind' using errcode = 'PT400';
  end if;
  if not private.surense_params_ok(coalesce(p_params, '{}'::jsonb)) then raise exception 'invalid_input:params' using errcode = 'PT400'; end if;
  if p_dedupe is not null and p_dedupe !~ '^[a-z0-9_.:-]{1,120}$' then raise exception 'invalid_input:dedupe' using errcode = 'PT400'; end if;
  insert into ops.surense_jobs (kind, params, dedupe_key) values (p_kind, coalesce(p_params, '{}'::jsonb), p_dedupe)
  on conflict (dedupe_key) where dedupe_key is not null and status in ('pending', 'processing') do nothing
  returning id into v_id;
  if v_id is null then
    return jsonb_build_object('id', (select j.id from ops.surense_jobs j where j.dedupe_key = p_dedupe and j.status in ('pending', 'processing')),
                              'duplicate', true);
  end if;
  return jsonb_build_object('id', v_id, 'duplicate', false);
end $$;

-- the one place a session is queued for the tool: a COMPLETED native session; marks it pending and inserts one job
-- (dedupe poa_ship:<session>). Needs the queue switch (surense_enabled, inside surense_job_enqueue).
create or replace function private.poa_ship_queue(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; r jsonb;
begin
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_session for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status <> 'completed' then raise exception 'session_not_completed' using errcode = 'PT409'; end if;
  if s.engine <> 'native' then raise exception 'invalid_input:engine' using errcode = 'PT400'; end if;
  if s.ship_status = 'shipped' then raise exception 'already_shipped' using errcode = 'PT409'; end if;
  r := api.surense_job_enqueue('surense.poa_ship', jsonb_build_object('session_id', s.id::text), 'poa_ship:' || s.id::text);
  update crm.poa_sessions set ship_status = 'pending', ship_error = null where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['ship_status'], jsonb_build_object('action', 'poa_ship_queued', 'duplicate', r ->> 'duplicate'));
  return jsonb_build_object('ok', true, 'job_id', r -> 'id', 'duplicate', r -> 'duplicate');
end $$;

create or replace function api.poa_ship_enqueue(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  return private.poa_ship_queue(p_session);
end $$;

-- the ship job's read: the identity and the approvals of a completed native session, decrypted for this call only (the
-- signature as its PNG data url, the harbit dates), plus the ship state. An audit row (ids only) records every read.
-- Closed while surense_write_enabled is off: nothing may be sent to the tool, so nothing is decrypted.
create or replace function api.poa_ship_get(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; v_ident jsonb; v_consents jsonb := '{}'::jsonb; r record;
begin
  perform private.kill_switch('surense_write_enabled');
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_session;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status <> 'completed' then raise exception 'session_not_completed' using errcode = 'PT409'; end if;
  if s.engine <> 'native' then raise exception 'invalid_input:engine' using errcode = 'PT400'; end if;
  v_ident := private.pii_decrypt(s.identity_enc)::jsonb;
  for r in
    select c.kind, c.approved_at, c.signature_enc from crm.poa_consents c
     where c.session_id = s.id and c.kind in ('poa_maslaka', 'poa_harbit', 'poa_policies') and c.method in ('check', 'signature', 'typed')
     order by c.approved_at
  loop
    v_consents := v_consents || jsonb_build_object(substr(r.kind, 5), jsonb_build_object(
      'approved_at', r.approved_at,
      'birth_date', case when r.kind = 'poa_harbit' then v_ident ->> 'birth_date' end,
      'issue_date', case when r.kind = 'poa_harbit' then v_ident ->> 'issue_date' end,
      'signature', case when r.kind = 'poa_policies' and r.signature_enc is not null then private.pii_decrypt(r.signature_enc) end));
  end loop;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['identity_enc'], jsonb_build_object('action', 'poa_ship_get'));
  return jsonb_build_object('session_id', s.id, 'ship_status', s.ship_status, 'surense_customer_id', s.surense_customer_id, 'modules', s.modules,
    'identity', jsonb_build_object('first_name', v_ident ->> 'first_name', 'last_name', v_ident ->> 'last_name', 'email', v_ident ->> 'email',
                                   'national_id', v_ident ->> 'national_id', 'phone', v_ident ->> 'phone', 'street', v_ident ->> 'street',
                                   'city', v_ident ->> 'city', 'zip', v_ident ->> 'zip', 'marketing_approved', coalesce((v_ident ->> 'marketing_approved')::boolean, false)),
    'consents', v_consents);
end $$;

-- the ship job's write: the outcome of one attempt. 'shipped' also records the tool's customer id (the webhook path and the
-- E9100 launch key on it); 'failed' keeps the code in ship_error and engine_last_error. Ids and codes only.
create or replace function api.poa_ship_set(p_session uuid, p_status text, p_code text default null, p_customer uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  if p_status is null or p_status not in ('pending', 'shipped', 'failed') then raise exception 'invalid_input:status' using errcode = 'PT400'; end if;
  if p_code is not null and p_code !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_session for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.engine <> 'native' then raise exception 'invalid_input:engine' using errcode = 'PT400'; end if;
  update crm.poa_sessions
     set ship_status = p_status,
         ship_error = case when p_status = 'failed' then p_code else null end,
         ship_attempts = ship_attempts + case when p_status = 'pending' then 0 else 1 end,
         shipped_at = case when p_status = 'shipped' then now() else shipped_at end,
         surense_customer_id = coalesce(p_customer, surense_customer_id),
         engine_last_error = case when p_status = 'failed' then coalesce(p_code, engine_last_error) else engine_last_error end
   where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['ship_status'], jsonb_build_object('action', 'poa_ship_set', 'status', p_status, 'code', p_code));
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------- staff: the list gains the ship columns; "שגר שוב"
drop function staff.poa_session_list(integer, integer);
create function staff.poa_session_list(p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, status text, modules jsonb, first_name text, last_name text, id_masked text, phone_tail text,
               created_at timestamptz, completed_at timestamptz, documents jsonb, matched boolean, last_error text,
               engine text, ship_status text, ship_error text, shipped_at timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare v_actor uuid := private.assert_admin_fresh(); v_agency uuid := private.my_agency_id(); v_ids uuid[];
begin
  select coalesce(array_agg(x.id order by x.created_at desc, x.id), '{}') into v_ids
    from (select s.id, s.created_at from crm.poa_sessions s
           where s.agency_id = v_agency
           order by s.created_at desc, s.id
           limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) x;
  perform private.log_access('poa_session_list', 'crm.poa_sessions', v_ids);
  return query
    select s.id, s.status, s.modules,
           i.j ->> 'first_name', i.j ->> 'last_name', '*****' || right(i.j ->> 'national_id', 4), s.phone_tail, s.created_at, s.completed_at,
           coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'status', d.status, 'source', d.source) order by d.kind)
                       from crm.documents d where d.session_id = s.id), '[]'::jsonb),
           exists (select 1 from crm.poa_matches m where m.session_id = s.id), s.engine_last_error,
           s.engine, s.ship_status, s.ship_error, s.shipped_at
      from crm.poa_sessions s cross join lateral (select private.pii_decrypt(s.identity_enc)::jsonb as j) i
     where s.id = any (v_ids)
     order by s.created_at desc, s.id;
end $$;

-- re-queues the ship of a completed native session of the caller's agency (admin, fresh TOTP); refused once shipped
create or replace function staff.poa_ship_retry(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh();
begin
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  if not exists (select 1 from crm.poa_sessions s where s.id = p_session and s.agency_id = private.my_agency_id()) then
    raise exception 'not_found' using errcode = 'PT404';
  end if;
  return private.poa_ship_queue(p_session);
end $$;

-- ---------------------------------------------------------------- the worker tick (OWNER-STEPS 6.18)
-- ops.call_function is a no-op while edge_cron_enabled = 'false'; the surense-worker itself stops at once while
-- surense_enabled is off (api.surense_job_claim raises PT423). Idempotent: an existing job of this name is replaced.
select cron.unschedule(jobid) from cron.job where jobname = 'surense-worker-tick';
select cron.schedule('surense-worker-tick', '* * * * *', $$select ops.call_function('surense-worker')$$);

-- ---------------------------------------------------------------- privileges
revoke all on function private.poa_ship_queue(uuid) from public, anon, authenticated, service_role;
revoke all on function api.poa_document_from_url(uuid, text, text, text), api.poa_session_fail(uuid, text), api.surense_job_enqueue(text, jsonb, text),
  api.poa_ship_enqueue(uuid), api.poa_ship_get(uuid), api.poa_ship_set(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function api.poa_document_from_url(uuid, text, text, text), api.poa_session_fail(uuid, text), api.surense_job_enqueue(text, jsonb, text),
  api.poa_ship_enqueue(uuid), api.poa_ship_get(uuid), api.poa_ship_set(uuid, text, text, uuid)
  to service_role;
revoke all on function staff.poa_session_list(integer, integer), staff.poa_ship_retry(uuid) from public, anon;
grant execute on function staff.poa_session_list(integer, integer), staff.poa_ship_retry(uuid) to authenticated;
