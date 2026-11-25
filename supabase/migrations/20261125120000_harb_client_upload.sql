-- V3-06: Har HaBituach, client path (owner approved 2026-11-25). Har HaBituach (harb.cma.gov.il) has no API; a client can
-- sign in there and download an .xlsx of all their policies. In the personal area (client-area function, /my) a signed-in
-- client uploads that file; the function checks it (real xlsx, caps, layout, ONE national id in column A) and this database
-- compares that id with the client's own (hmac), names the private storage path, and queues the Surense push
-- (surense-worker kind surense.harb_import: data-import providers -> initiate -> ZIP upload -> start -> poll).
--   crm.documents            + kind 'harb_xlsx', source 'client' (no POA / forms session: customer_id is the owner),
--                              path harb/{agency}/{customer}/harb_xlsx-{id}.xlsx, import_status / import_id / import_code
--   api.client_harb_status / client_harb_add / client_harb_stored   service_role RPCs for client-area (token-scoped)
--   api.harb_import_get / harb_import_set                         service_role RPCs for surense-worker
--   staff.harb_fallback_list                                       harbit POA signed in the last N business days, no file yet
-- Switches (ops.config; a missing key reads closed): client_area_harb_upload_enabled = 'false' (the upload card and the three
-- client RPCs), surense_harb_import_enabled = 'false' (the push; the job also needs the upload switch, and surense_enabled
-- gates the queue), surense_harb_provider_match = '' (the data-import provider: its id or a part of its name; empty = the
-- job ends skipped before any Surense call). Nothing reaches Surense unless both switches are on.
-- Independent of 20261123120000/20261125090000 client_forms: the crm.documents checks are EXTENDED in place (whatever their
-- current definition is, OR the harb shape), never re-listed. Must run after client_forms (it re-creates those checks).
-- Error codes: PT400 invalid_input:<field>, PT423 feature_disabled:<key>, PT429 rate_limited, PT401 session_inactive,
-- PT404 not_found. A national id that is not the client's is NOT a raise: {ok:false, error:'id_mismatch'} plus an audit row
-- (a raise would roll the audit row back). No deletes; synthetic values only in supabase/tests/17_harb_client_upload.test.sql.

insert into ops.config (key, value) values
  ('client_area_harb_upload_enabled', 'false'), ('surense_harb_import_enabled', 'false'), ('surense_harb_provider_match', '')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- crm.documents: the harb shape
alter table crm.documents
  alter column session_id drop not null,
  add column import_status text check (import_status is null
    or import_status in ('queued', 'initiated', 'uploaded', 'sent', 'processed', 'failed', 'skipped')),
  add column import_id uuid,
  add column import_code text check (import_code is null or import_code ~ '^[A-Za-z0-9_.:-]{1,80}$'),
  add column import_updated_at timestamptz;

-- every existing check that would refuse a harb row is widened by OR-ing the harb shape onto its CURRENT definition
do $$
declare
  v_add constant jsonb := jsonb_build_object(
    'documents_kind_check', $c$kind = 'harb_xlsx'$c$,
    'documents_source_check', $c$source = 'client'$c$,
    'documents_storage_path_check', $c$storage_path ~ '^harb/[0-9a-f-]{36}/[0-9a-f-]{36}/harb_xlsx-[0-9a-f-]{36}\.xlsx$'$c$,
    'documents_one_session_check', $c$kind = 'harb_xlsx' and session_id is null$c$);
  k text; v_def text;
begin
  for k in select jsonb_object_keys(v_add) loop
    select pg_get_constraintdef(c.oid) into v_def from pg_constraint c
     where c.conrelid = 'crm.documents'::regclass and c.conname = k and c.contype = 'c';
    if v_def is null then continue; end if;
    execute format('alter table crm.documents drop constraint %I, add constraint %I check ((%s) or (%s))',
                   k, k, regexp_replace(v_def, '^CHECK ', ''), v_add ->> k);
  end loop;
  -- without the forms migration nothing would keep a POA row's session: keep that invariant here as well
  if not exists (select 1 from pg_constraint c where c.conrelid = 'crm.documents'::regclass and c.conname = 'documents_one_session_check') then
    alter table crm.documents add constraint documents_session_or_harb_check check (session_id is not null or kind = 'harb_xlsx');
  end if;
end $$;

-- a harb row belongs to one customer, comes from the client, has no POA session; import columns only on harb rows
alter table crm.documents
  add constraint documents_harb_shape_check check (kind <> 'harb_xlsx' or (session_id is null and customer_id is not null and source = 'client')),
  add constraint documents_import_only_harb_check check (kind = 'harb_xlsx' or (import_status is null and import_id is null and import_code is null));
create index documents_harb_customer_idx on crm.documents (customer_id, created_at desc) where kind = 'harb_xlsx';
comment on column crm.documents.import_status is 'Har HaBituach files only: the Surense data-import phase (surense.harb_import).';

-- ---------------------------------------------------------------- job kind: the Surense push
alter table ops.surense_jobs drop constraint surense_jobs_kind_check;
alter table ops.surense_jobs add constraint surense_jobs_kind_check
  check (kind in ('surense.event', 'surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit',
                  'surense.poa_ship', 'surense.portfolio_pull', 'surense.portfolio_sweep', 'surense.harb_import'));

-- api.surense_job_enqueue: 20261124090000 verbatim + surense.harb_import in the whitelist (the worker's poll follow-up)
create or replace function api.surense_job_enqueue(p_kind text, p_params jsonb default '{}'::jsonb, p_dedupe text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform private.kill_switch('surense_enabled');
  if p_kind is null or p_kind not in ('surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit',
                                      'surense.poa_ship', 'surense.portfolio_pull', 'surense.portfolio_sweep', 'surense.harb_import') then
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

-- ---------------------------------------------------------------- helpers (private)
-- the storage path the database mandates for a client's Har HaBituach file (ids only)
create or replace function private.harb_path(p_agency uuid, p_customer uuid, p_document uuid)
returns text language sql immutable set search_path = '' as $$
  select 'harb/' || p_agency || '/' || p_customer || '/harb_xlsx-' || p_document || '.xlsx'
$$;

-- Israeli business days (Sunday..Thursday) strictly after p_from up to and including p_to; holidays are not known here
create or replace function private.il_business_days_after(p_from date, p_to date)
returns integer language sql immutable set search_path = '' as $$
  select count(*)::int from generate_series((p_from + 1)::timestamp, p_to::timestamp, interval '1 day') g(d)
   where extract(isodow from g.d) in (7, 1, 2, 3, 4)
$$;

revoke all on function private.harb_path(uuid, uuid, uuid), private.il_business_days_after(date, date)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------- api: the client (token-scoped)
-- the upload card: shown only while the switch is on; the client's latest stored file (date + import phase)
create or replace function api.client_harb_status(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; r record;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  if not private.flag('client_area_harb_upload_enabled') then return jsonb_build_object('enabled', false, 'last', null); end if;
  select d.id, coalesce(d.stored_at, d.created_at) as created_at, d.import_status into r
    from crm.documents d
   where d.kind = 'harb_xlsx' and d.customer_id = s.customer_id and d.storage_path is not null and d.status <> 'revoked'
   order by d.created_at desc limit 1;
  if not found then return jsonb_build_object('enabled', true, 'last', null); end if;
  return jsonb_build_object('enabled', true, 'last', jsonb_build_object('id', r.id, 'created_at', r.created_at, 'import_status', r.import_status));
end $$;

-- one checked file: p_national_id = the ONE id the function found in column A (compared here, never stored), p_sha256 = the
-- file hash (hex), p_rows = policy rows. Same file already stored -> {duplicate:true}. Else a row (status incomplete) and the
-- mandated path; the function stores the bytes and calls client_harb_stored. 10 attempts per customer per day.
create or replace function api.client_harb_add(p_token_hash bytea, p_national_id text, p_sha256 text, p_rows integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; v_hmac bytea; v_dup uuid; v_id uuid := gen_random_uuid();
begin
  perform private.kill_switch('client_area_enabled');
  perform private.kill_switch('client_area_harb_upload_enabled');
  s := private.client_session_of(p_token_hash);
  if p_national_id is null or p_national_id !~ '^[0-9]{5,9}$' then raise exception 'invalid_input:national_id' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  if p_rows is null or p_rows not between 1 and 5000 then raise exception 'invalid_input:rows' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('client_harb', s.customer_id::text, 10, interval '1 day') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  select c.national_id_hmac into v_hmac from crm.customers c where c.id = s.customer_id;
  if v_hmac is null or private.national_id_hmac(p_national_id) is distinct from v_hmac then
    perform private.audit_action('crm.customers', s.customer_id::text, '{}', jsonb_build_object('action', 'client_harb_refused', 'code', 'id_mismatch'));
    return jsonb_build_object('ok', false, 'error', 'id_mismatch');
  end if;
  select d.id into v_dup from crm.documents d
   where d.kind = 'harb_xlsx' and d.customer_id = s.customer_id and d.sha256 = decode(p_sha256, 'hex')
     and d.storage_path is not null and d.status <> 'revoked'
   order by d.created_at desc limit 1;
  if v_dup is not null then return jsonb_build_object('ok', true, 'duplicate', true, 'document_id', v_dup); end if;
  insert into crm.documents (id, kind, source, status, customer_id, sha256)
  values (v_id, 'harb_xlsx', 'client', 'incomplete', s.customer_id, decode(p_sha256, 'hex'));
  perform private.audit_action('crm.documents', v_id::text, '{}', jsonb_build_object('action', 'client_harb_add', 'kind', 'harb_xlsx', 'rows', p_rows));
  return jsonb_build_object('ok', true, 'duplicate', false, 'document_id', v_id, 'storage_path', private.harb_path(s.agency_id, s.customer_id, v_id));
end $$;

-- the bytes are in the bucket: the row gets its path, and the Surense push is queued when surense_harb_import_enabled is on
-- (a direct insert: the job waits in the queue while surense_enabled is off). Idempotent for a row already stored.
create or replace function api.client_harb_stored(p_token_hash bytea, p_document uuid, p_path text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; d crm.documents; v_path text; v_queued boolean := false;
begin
  perform private.kill_switch('client_area_enabled');
  perform private.kill_switch('client_area_harb_upload_enabled');
  s := private.client_session_of(p_token_hash);
  if p_document is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  select * into d from crm.documents x where x.id = p_document and x.kind = 'harb_xlsx' and x.customer_id = s.customer_id for update;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  v_path := private.harb_path(s.agency_id, s.customer_id, d.id);
  if p_path is distinct from v_path then raise exception 'invalid_input:path' using errcode = 'PT400'; end if;
  if d.storage_path is not null then return jsonb_build_object('stored', true, 'queued', d.import_status is not null); end if;
  update crm.documents set storage_path = v_path, stored_at = now(), status = 'active' where id = d.id;
  if private.flag('surense_harb_import_enabled') then
    insert into ops.surense_jobs (kind, params, dedupe_key)
    values ('surense.harb_import', jsonb_build_object('document_id', d.id), 'harb:' || d.id)
    on conflict (dedupe_key) where dedupe_key is not null and status in ('pending', 'processing') do nothing;
    update crm.documents set import_status = 'queued', import_updated_at = now() where id = d.id;
    v_queued := true;
  end if;
  perform private.audit_action('crm.documents', d.id::text, array['storage_path'], jsonb_build_object('action', 'client_harb_stored', 'queued', v_queued));
  return jsonb_build_object('stored', true, 'queued', v_queued);
end $$;

-- ---------------------------------------------------------------- api: the worker
-- what the push needs: the stored path and hash, the client's Surense id (mirror, same national id hmac), the provider match
-- and the import phase. Raises PT423 unless both harb switches are on (the job then ends skipped, nothing sent).
create or replace function api.harb_import_get(p_document uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d crm.documents; v_hmac bytea; v_sur uuid;
begin
  perform private.kill_switch('client_area_harb_upload_enabled');
  perform private.kill_switch('surense_harb_import_enabled');
  if p_document is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  select * into d from crm.documents x where x.id = p_document and x.kind = 'harb_xlsx';
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  select c.national_id_hmac into v_hmac from crm.customers c where c.id = d.customer_id;
  select sc.id into v_sur from crm.surense_customers sc
   where v_hmac is not null and sc.national_id_hmac = v_hmac and sc.deleted_at is null
   order by sc.surense_modified_at desc nulls last limit 1;
  return jsonb_build_object('storage_path', d.storage_path, 'sha256', encode(d.sha256, 'hex'), 'surense_customer_id', v_sur,
                            'provider_match', coalesce((select c.value from ops.config c where c.key = 'surense_harb_provider_match'), ''),
                            'import_status', d.import_status, 'import_id', d.import_id);
end $$;

-- one phase of the push written back (no switch: an outcome is always recorded). A null import id keeps the known one.
create or replace function api.harb_import_set(p_document uuid, p_status text, p_import_id uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_document is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  if p_status is null or p_status not in ('queued', 'initiated', 'uploaded', 'sent', 'processed', 'failed', 'skipped') then
    raise exception 'invalid_input:status' using errcode = 'PT400';
  end if;
  if p_code is not null and p_code !~ '^[A-Za-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  update crm.documents set import_status = p_status, import_id = coalesce(p_import_id, import_id), import_code = p_code, import_updated_at = now()
   where id = p_document and kind = 'harb_xlsx';
  if not found then return jsonb_build_object('updated', false); end if;
  perform private.audit_action('crm.documents', p_document::text, array['import_status'],
                               jsonb_build_object('action', 'harb_import_set', 'status', p_status, 'code', p_code));
  return jsonb_build_object('updated', true);
end $$;

-- ---------------------------------------------------------------- staff: the manual fallback list
-- POA wizard sessions of the caller's agency whose Har HaBituach permission (consent poa_harbit) was signed less than p_days
-- Israeli business days ago and for which no Har HaBituach file of that person (crm.customers, same national id hmac) was
-- stored since the signing: the agent pulls those by hand before the window closes. Admin + fresh TOTP + access log,
-- masked id and phone tail only (as staff.poa_session_list).
create or replace function staff.harb_fallback_list(p_days integer default 5)
returns table (session_id uuid, customer_id uuid, first_name text, last_name text, id_masked text, phone_tail text,
               signed_at timestamptz, business_days_left integer)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare v_actor uuid := private.assert_admin_fresh(); v_agency uuid := private.my_agency_id();
        v_today date := (now() at time zone 'Asia/Jerusalem')::date; v_ids uuid[];
begin
  if p_days is null or p_days not between 1 and 30 then raise exception 'invalid_input:days' using errcode = 'PT400'; end if;
  select coalesce(array_agg(x.sid order by x.signed_at, x.sid), '{}') into v_ids
    from (select s.id as sid, s.national_id_hmac as hmac, max(pc.approved_at) as signed_at
            from crm.poa_sessions s join crm.poa_consents pc on pc.session_id = s.id
           where s.agency_id = v_agency and pc.kind = 'poa_harbit' and pc.method in ('check', 'signature', 'typed')
             and pc.approved_at > now() - interval '60 days'
           group by s.id, s.national_id_hmac) x
   where private.il_business_days_after((x.signed_at at time zone 'Asia/Jerusalem')::date, v_today) < p_days
     and not exists (select 1 from crm.customers c join crm.documents d on d.customer_id = c.id
                      where c.national_id_hmac = x.hmac and c.agency_id = v_agency and d.kind = 'harb_xlsx'
                        and d.storage_path is not null and d.status <> 'revoked' and d.created_at >= x.signed_at);
  perform private.log_access('harb_fallback_list', 'crm.poa_sessions', v_ids);
  return query
    select s.id,
           (select c.id from crm.customers c where c.national_id_hmac = s.national_id_hmac and c.agency_id = s.agency_id
             order by c.created_at limit 1),
           i.j ->> 'first_name', i.j ->> 'last_name', '*****' || right(i.j ->> 'national_id', 4), s.phone_tail, sg.signed_at,
           p_days - private.il_business_days_after((sg.signed_at at time zone 'Asia/Jerusalem')::date, v_today)
      from crm.poa_sessions s
      cross join lateral (select max(pc.approved_at) as signed_at from crm.poa_consents pc
                           where pc.session_id = s.id and pc.kind = 'poa_harbit' and pc.method in ('check', 'signature', 'typed')) sg
      cross join lateral (select private.pii_decrypt(s.identity_enc)::jsonb as j) i
     where s.id = any (v_ids)
     order by sg.signed_at, s.id;
end $$;

-- ---------------------------------------------------------------- grants
revoke all on function api.client_harb_status(bytea), api.client_harb_add(bytea, text, text, integer), api.client_harb_stored(bytea, uuid, text),
  api.harb_import_get(uuid), api.harb_import_set(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function api.client_harb_status(bytea), api.client_harb_add(bytea, text, text, integer), api.client_harb_stored(bytea, uuid, text),
  api.harb_import_get(uuid), api.harb_import_set(uuid, text, uuid, text)
  to service_role;
revoke all on function staff.harb_fallback_list(integer) from public, anon;
grant execute on function staff.harb_fallback_list(integer) to authenticated;
