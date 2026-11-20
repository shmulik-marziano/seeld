-- V3-01: Surense connector foundation (direct API + Svix webhooks, no Make/Zapier in the path).
--   ops.surense_events      webhook inbox, idempotent by svix-id, payload encrypted (pii_enc_key)
--   ops.surense_jobs        the connector's own work queue (NOT ops.outbox: notify-worker dead-letters unknown topics)
--   ops.surense_sync_state  resumable pull cursors (encrypted: an opaque cursor may embed sort values)
--   crm.surense_customers / _documents / _products / _portfolios   local mirror; indexable columns are non-PII only,
--                           everything personal sits in *_enc (pgp, Vault pii_enc_key); national id = HMAC only
--   api.surense_*           service_role RPCs for surense-webhook / surense-sync / surense-worker
-- Off by default: surense_enabled, surense_write_enabled, surense_e9100_enabled, surense_webhook_enabled,
-- surense_retention_enabled = 'false' (a missing key also reads as closed, private.flag). E9100 submit needs both
-- surense_write_enabled and surense_e9100_enabled (api.surense_gate). Applying needs no secret. Ingest/upserts need Vault pii_enc_key (and national_id_hmac_key
-- for customers with an ID number); without them they raise 55000 vault_secret_missing:<name> and write nothing.
-- ops.cleanup deletes nothing Surense-related while surense_retention_enabled is off (no-delete rule).
-- ops.watchdog gains a 'surense' step (queue backlog, stuck locks, dead jobs, webhook silence / webhook switch off).
-- No cron job here: surense-worker runs on demand (cron secret) until the owner approves a schedule.

insert into ops.config (key, value) values
  ('surense_enabled', 'false'), ('surense_write_enabled', 'false'), ('surense_e9100_enabled', 'false'),
  ('surense_webhook_enabled', 'false'), ('surense_retention_enabled', 'false')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- inbox, queue, sync state (ops)
create table ops.surense_events (
  id            bigint generated always as identity primary key,
  svix_id       text not null unique check (svix_id ~ '^[A-Za-z0-9_-]{1,100}$'),
  event_type    text not null check (event_type ~ '^[a-z0-9_.]{1,80}$'),
  svix_ts       timestamptz not null,
  received_at   timestamptz not null default now(),
  payload_enc   bytea not null,
  payload_bytes integer not null check (payload_bytes between 2 and 262144),
  processed_at  timestamptz
);
comment on table ops.surense_events is 'Surense (Svix) webhook inbox. PII only inside payload_enc. Reached only through api.surense_* definer RPCs.';
create index surense_events_type_idx on ops.surense_events (event_type, received_at desc);
create index surense_events_received_idx on ops.surense_events (received_at);

create table ops.surense_jobs (
  id              bigint generated always as identity primary key,
  kind            text not null check (kind in ('surense.event', 'surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download')),
  -- set null, never cascade: purging an old event must not silently take a dead job (the failure record) with it
  event_id        bigint references ops.surense_events (id) on delete set null,
  params          jsonb not null default '{}'::jsonb,
  dedupe_key      text check (dedupe_key is null or dedupe_key ~ '^[a-z0-9_.:-]{1,120}$'),
  status          text not null default 'pending' check (status in ('pending', 'processing', 'done', 'skipped', 'dead')),
  attempts        integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  processed_at    timestamptz,
  last_error      text check (last_error is null or char_length(last_error) <= 200),
  last_error_kind text check (last_error_kind is null or last_error_kind in ('rate_limited', 'unavailable', 'auth', 'permanent', 'config',
                                                                              'db', 'storage', 'input', 'internal'))
);
comment on table ops.surense_jobs is 'Surense work queue. params hold Surense ids/dates/flags only (private.surense_params_ok), never personal values.';
create index surense_jobs_due_idx on ops.surense_jobs (next_attempt_at) where status in ('pending', 'processing');
create index surense_jobs_closed_idx on ops.surense_jobs (processed_at) where status in ('done', 'skipped', 'dead');
create index surense_jobs_event_idx on ops.surense_jobs (event_id) where event_id is not null;
create unique index surense_jobs_dedupe_idx on ops.surense_jobs (dedupe_key) where dedupe_key is not null and status in ('pending', 'processing');

create table ops.surense_sync_state (
  key         text primary key check (key ~ '^[a-z0-9_.:-]{1,80}$'),
  cursor_enc  bytea,
  rows_total  bigint not null default 0,
  last_run_at timestamptz,
  last_ok_at  timestamptz,
  updated_at  timestamptz not null default now()
);

alter table ops.surense_events enable row level security;
alter table ops.surense_jobs enable row level security;
alter table ops.surense_sync_state enable row level security;
revoke all on ops.surense_events, ops.surense_jobs, ops.surense_sync_state from anon, authenticated, service_role;
create policy deny_api_roles on ops.surense_events for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.surense_jobs for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.surense_sync_state for all to anon, authenticated using (false) with check (false);

-- ---------------------------------------------------------------- mirror (crm). id = the Surense id where one exists.
create table crm.surense_customers (
  id                         uuid primary key,
  surense_agency_id          uuid,
  manager_id                 uuid,
  manager_ids                uuid[] not null default '{}',
  status_id                  uuid,
  status_name                text check (status_name is null or char_length(status_name) <= 80),
  status_active              boolean,
  class_id                   uuid,
  class_name                 text check (class_name is null or char_length(class_name) <= 80),
  source_id                  uuid,
  source_name                text check (source_name is null or char_length(source_name) <= 80),
  creation_source            integer,
  id_type                    integer,
  id_number_locked           boolean,
  cell_verified              boolean,
  duplicate                  boolean,
  swiftness_proxy_signed_on  date,
  swiftness_proxy_expires_on date,
  hb_proxy_signed_on         date,
  hb_proxy_expires_on        date,
  policies_proxy_signed_on   date,
  policies_proxy_expires_on  date,
  last_e9100_data_on         date,
  surense_created_at         timestamptz,
  surense_modified_at        timestamptz,
  surense_version            bigint,
  national_id_hmac           bytea check (national_id_hmac is null or octet_length(national_id_hmac) = 32),
  details_enc                bytea not null,
  deleted_at                 timestamptz,
  synced_at                  timestamptz not null default now()
);
comment on table crm.surense_customers is 'PII mirror of Surense customers. Non-PII columns only; personal data in details_enc. No API role has any privilege.';
create index surense_customers_hmac_idx on crm.surense_customers (national_id_hmac) where national_id_hmac is not null;
create index surense_customers_manager_idx on crm.surense_customers (manager_id);
create index surense_customers_modified_idx on crm.surense_customers (surense_modified_at desc);

create table crm.surense_documents (
  id                  uuid primary key default gen_random_uuid(),
  kind                text not null check (kind in ('document', 'e9100_file')),
  surense_id          uuid unique,
  customer_surense_id uuid,
  lead_surense_id     uuid,
  type_id             uuid,
  e9100_event_id      uuid,
  mime                text check (mime is null or char_length(mime) <= 100),
  file_extension      text check (file_extension is null or file_extension ~ '^[a-z0-9]{1,10}$'),
  size_bytes          bigint,
  source              text check (source is null or char_length(source) <= 40),
  system_generated    boolean,
  company_id          bigint,
  storage_path        text unique check (storage_path is null or storage_path ~ '^surense/[0-9a-f-]{36}/[a-z0-9]+/[0-9a-f-]{36}/[0-9a-f]{64}(\.[a-z0-9]{1,10})?$'),
  sha256              bytea check (sha256 is null or octet_length(sha256) = 32),
  stored_at           timestamptz,
  surense_created_at  timestamptz,
  surense_modified_at timestamptz,
  details_enc         bytea not null,
  deleted_at          timestamptz,
  synced_at           timestamptz not null default now(),
  check ((kind = 'document') = (surense_id is not null)),
  check (kind <> 'e9100_file' or (storage_path is not null and sha256 is not null and e9100_event_id is not null))
);
comment on table crm.surense_documents is 'PII mirror of Surense documents and stored E9100 files. File names, notes and policy numbers only in details_enc; object names are content hashes.';
create index surense_documents_customer_idx on crm.surense_documents (customer_surense_id);
create index surense_documents_event_idx on crm.surense_documents (e9100_event_id) where e9100_event_id is not null;

create table crm.surense_products (
  id                  uuid primary key,
  customer_surense_id uuid,
  source              text check (source is null or char_length(source) <= 40),
  company_id          bigint,
  product_id          bigint,
  product_type        integer,
  hidden              boolean,
  surense_modified_at timestamptz,
  details_enc         bytea not null,
  synced_at           timestamptz not null default now()
);
comment on table crm.surense_products is 'PII mirror of Surense portfolio products. Policy numbers, balances and coverages only in details_enc.';
create index surense_products_customer_idx on crm.surense_products (customer_surense_id);

create table crm.surense_portfolios (
  id                  bigint generated always as identity primary key,
  customer_surense_id uuid not null,
  mode                text not null check (mode in ('production', 'pre_advice')),
  product_count       integer not null default 0,
  snapshot_enc        bytea not null,
  fetched_at          timestamptz not null default now()
);
comment on table crm.surense_portfolios is 'Encrypted Surense portfolio snapshots (full response). Retention: ops.cleanup (surense_retention_enabled).';
create index surense_portfolios_customer_idx on crm.surense_portfolios (customer_surense_id, fetched_at desc);

alter table crm.surense_customers enable row level security;
alter table crm.surense_documents enable row level security;
alter table crm.surense_products enable row level security;
alter table crm.surense_portfolios enable row level security;
revoke all on crm.surense_customers, crm.surense_documents, crm.surense_products, crm.surense_portfolios
  from anon, authenticated, service_role;
create policy deny_api_roles on crm.surense_customers for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.surense_documents for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.surense_products for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.surense_portfolios for all to anon, authenticated using (false) with check (false);
create trigger surense_customers_audit after insert or update or delete on crm.surense_customers
  for each row execute function audit.log_change('no_values');
create trigger surense_documents_audit after insert or update or delete on crm.surense_documents
  for each row execute function audit.log_change('no_values');
create trigger surense_products_audit after insert or update or delete on crm.surense_products
  for each row execute function audit.log_change('no_values');

-- private client-docs bucket (E9100 files). No storage policy: only the service key reaches it. Guarded: the local
-- replay image may lack the storage schema (or its later columns); then the bucket is created by the owner step
-- (OWNER-STEPS.md, Surense) and the warning below is the only trace. Never public.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('client-docs', 'client-docs', false) on conflict (id) do nothing;
  end if;
exception when others then
  raise warning 'client-docs bucket not created here (sqlstate %); create it as a private bucket by hand', sqlstate;
end $$;

-- ---------------------------------------------------------------- helpers
-- job params: a flat object of short id-like strings, numbers and booleans (no names, phones or free text fit)
create or replace function private.surense_params_ok(p jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select p is not null and jsonb_typeof(p) = 'object' and octet_length(p::text) <= 2000
     and not exists (select 1 from jsonb_each(p) e
                      where e.key !~ '^[a-z][a-z0-9_]{0,40}$'
                         or not (jsonb_typeof(e.value) in ('number', 'boolean')
                                 or (jsonb_typeof(e.value) = 'string' and (e.value #>> '{}') ~ '^[A-Za-z0-9_.:-]{0,64}$')))
$$;

-- ---------------------------------------------------------------- api: gates and inbox
-- p_action: the surense-sync action name. 'e9100-submit' is a write that also needs its own switch (surense_e9100_enabled),
-- so proxies invites and E9100 submissions can be turned on separately.
create or replace function api.surense_gate(p_write boolean default false, p_action text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if p_action is not null and p_action !~ '^[a-z0-9-]{1,40}$' then raise exception 'invalid_input:action' using errcode = 'PT400'; end if;
  perform private.kill_switch('surense_enabled');
  if coalesce(p_write, false) or p_action = 'e9100-submit' then perform private.kill_switch('surense_write_enabled'); end if;
  if p_action = 'e9100-submit' then perform private.kill_switch('surense_e9100_enabled'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function api.surense_event_ingest(p_svix_id text, p_type text, p_ts timestamptz, p_payload text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id bigint; v_job bigint;
begin
  perform private.kill_switch('surense_webhook_enabled');
  if p_svix_id is null or p_svix_id !~ '^[A-Za-z0-9_-]{1,100}$' then raise exception 'invalid_input:svix_id' using errcode = 'PT400'; end if;
  if p_type is null or p_type !~ '^[a-z0-9_.]{1,80}$' then raise exception 'invalid_input:type' using errcode = 'PT400'; end if;
  if p_ts is null then raise exception 'invalid_input:ts' using errcode = 'PT400'; end if;
  if p_payload is null or octet_length(p_payload) not between 2 and 262144 then raise exception 'invalid_input:payload' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('surense_webhook', 'all', 600, interval '1 minute') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  insert into ops.surense_events (svix_id, event_type, svix_ts, payload_enc, payload_bytes)
  values (p_svix_id, p_type, p_ts, private.pii_encrypt(p_payload), octet_length(p_payload))
  on conflict (svix_id) do nothing
  returning id into v_id;
  if v_id is null then
    return jsonb_build_object('id', (select e.id from ops.surense_events e where e.svix_id = p_svix_id), 'duplicate', true);
  end if;
  insert into ops.surense_jobs (kind, event_id, dedupe_key) values ('surense.event', v_id, 'event:' || v_id) returning id into v_job;
  perform private.audit_action('ops.surense_events', v_id::text, '{}', jsonb_build_object('action', 'surense_event_ingest', 'type', p_type));
  return jsonb_build_object('id', v_id, 'duplicate', false, 'job_id', v_job);
end $$;

-- ---------------------------------------------------------------- api: queue
create or replace function api.surense_job_enqueue(p_kind text, p_params jsonb default '{}'::jsonb, p_dedupe text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform private.kill_switch('surense_enabled');
  if p_kind is null or p_kind not in ('surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download') then
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

-- payload is decrypted for 'surense.event' jobs only; the worker must never log or echo it
create or replace function api.surense_job_claim(p_limit integer default 5)
returns table (id bigint, kind text, params jsonb, event_id bigint, event_type text, payload text, attempts integer)
language plpgsql volatile security definer set search_path = '' as $$
declare r record;
begin
  perform private.kill_switch('surense_enabled');
  -- a job whose run never reached surense_job_complete (isolate killed, OOM, crash) at its last attempt goes dead here
  for r in
    with x as (
      select j.id from ops.surense_jobs j
       where j.status = 'processing' and j.locked_until < now() and j.attempts >= 5
       for update skip locked)
    update ops.surense_jobs j set status = 'dead', processed_at = now(), locked_until = null, last_error = 'lock_expired'
      from x where j.id = x.id
    returning j.id as job_id, j.kind as job_kind
  loop
    perform ops.raise_alert('critical', 'surense_job_dead', 'surense job id=' || r.job_id || ' (' || r.job_kind || ') is dead after 5 attempts',
                            'surense_job_dead');
  end loop;
  return query
  with c as (
    select j.id from ops.surense_jobs j
     where (j.status = 'pending' or (j.status = 'processing' and j.locked_until < now())) and j.next_attempt_at <= now()
       and j.attempts < 5
     order by j.id
     limit least(greatest(coalesce(p_limit, 5), 1), 25)
     for update skip locked),
  u as (
    update ops.surense_jobs j set status = 'processing', locked_until = now() + interval '2 minutes', attempts = j.attempts + 1
      from c where j.id = c.id
    returning j.id, j.kind, j.params, j.event_id, j.attempts)
  select u.id, u.kind, u.params, u.event_id, e.event_type, private.pii_decrypt(e.payload_enc), u.attempts
    from u left join ops.surense_events e on e.id = u.event_id
   order by u.id;
end $$;

-- p_result: 'done' | 'skipped' | 'failed'. failed backs off 1m, 5m, 30m, 2h and goes dead at attempt 5 (critical alert).
-- This is the ONLY retry layer for queued work (surense-worker calls Surense with maxAttempts 1).
-- p_error_kind: the failure class (SurenseError.kind, or db/storage/input/internal). p_retry_after: seconds from the
-- server's Retry-After (0..86400). Retry delay = greatest(backoff, retry_after), jittered to delay*(0.5+random()*0.5)
-- but never earlier than retry_after (no synchronised wave after an outage, and the server's hint is honoured).
-- p_attempts = the value claim returned: a stale run (lock expired, job reclaimed or closed since) changes nothing.
create or replace function api.surense_job_complete(p_id bigint, p_attempts integer, p_result text, p_error text default null,
                                                    p_error_kind text default null, p_retry_after integer default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_attempts integer; v_kind text; v_event bigint; v_delay interval; v_after interval;
begin
  if p_attempts is null then raise exception 'invalid_input:attempts' using errcode = 'PT400'; end if;
  if p_result is null or p_result not in ('done', 'skipped', 'failed') then raise exception 'invalid_input:result' using errcode = 'PT400'; end if;
  if p_error is not null and p_error !~ '^[A-Za-z0-9_.:-]{1,200}$' then raise exception 'invalid_input:error' using errcode = 'PT400'; end if;
  if p_error_kind is not null and p_error_kind not in ('rate_limited', 'unavailable', 'auth', 'permanent', 'config', 'db', 'storage', 'input', 'internal') then
    raise exception 'invalid_input:error_kind' using errcode = 'PT400';
  end if;
  if p_retry_after is not null and p_retry_after not between 0 and 86400 then raise exception 'invalid_input:retry_after' using errcode = 'PT400'; end if;
  select j.attempts, j.kind, j.event_id into v_attempts, v_kind, v_event from ops.surense_jobs j
   where j.id = p_id and j.status = 'processing' and j.attempts = p_attempts for update;
  if v_attempts is null then return; end if;
  if p_result in ('done', 'skipped') then
    update ops.surense_jobs set status = p_result, processed_at = now(), locked_until = null, last_error = p_error,
           last_error_kind = p_error_kind where id = p_id;
    if v_event is not null then
      update ops.surense_events set processed_at = now() where id = v_event and processed_at is null;
    end if;
  elsif v_attempts >= 5 then
    update ops.surense_jobs set status = 'dead', processed_at = now(), locked_until = null, last_error = p_error,
           last_error_kind = p_error_kind where id = p_id;
    perform ops.raise_alert('critical', 'surense_job_dead', 'surense job id=' || p_id || ' (' || v_kind || ') is dead after 5 attempts',
                            'surense_job_dead');
  else
    v_after := make_interval(secs => coalesce(p_retry_after, 0));
    v_delay := greatest((array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours'])[greatest(v_attempts, 1)], v_after);
    v_delay := greatest(v_delay * (0.5 + random() * 0.5), v_after);
    update ops.surense_jobs set status = 'pending', locked_until = null, last_error = p_error, last_error_kind = p_error_kind,
           next_attempt_at = now() + v_delay
     where id = p_id;
  end if;
end $$;

create or replace function api.surense_sync_state_get(p_key text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r ops.surense_sync_state;
begin
  if p_key is null or p_key !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:key' using errcode = 'PT400'; end if;
  select * into r from ops.surense_sync_state where key = p_key;
  return jsonb_build_object('cursor', private.pii_decrypt(r.cursor_enc), 'rows_total', coalesce(r.rows_total, 0),
                            'last_run_at', r.last_run_at, 'last_ok_at', r.last_ok_at);
end $$;

-- p_done: the pull reached the end -> cursor cleared and last_ok_at stamped
create or replace function api.surense_sync_state_set(p_key text, p_cursor text, p_done boolean, p_rows integer)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  perform private.kill_switch('surense_enabled');
  if p_key is null or p_key !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:key' using errcode = 'PT400'; end if;
  if p_cursor is not null and octet_length(p_cursor) > 4096 then raise exception 'invalid_input:cursor' using errcode = 'PT400'; end if;
  insert into ops.surense_sync_state as s (key, cursor_enc, rows_total, last_run_at, last_ok_at)
  values (p_key, case when coalesce(p_done, false) then null else private.pii_encrypt(p_cursor) end, greatest(coalesce(p_rows, 0), 0), now(),
          case when coalesce(p_done, false) then now() end)
  on conflict (key) do update
    set cursor_enc = excluded.cursor_enc, rows_total = s.rows_total + excluded.rows_total, last_run_at = now(),
        last_ok_at = coalesce(excluded.last_ok_at, s.last_ok_at), updated_at = now();
end $$;

-- ---------------------------------------------------------------- api: mirror writes (encryption happens here)
create or replace function api.surense_customers_upsert(p_rows jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare n_total integer; n_up integer;
begin
  perform private.kill_switch('surense_enabled');
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 200 then
    raise exception 'invalid_input:rows' using errcode = 'PT400';
  end if;
  n_total := jsonb_array_length(p_rows);
  insert into crm.surense_customers as t (id, surense_agency_id, manager_id, manager_ids, status_id, status_name, status_active,
    class_id, class_name, source_id, source_name, creation_source, id_type, id_number_locked, cell_verified, duplicate,
    swiftness_proxy_signed_on, swiftness_proxy_expires_on, hb_proxy_signed_on, hb_proxy_expires_on,
    policies_proxy_signed_on, policies_proxy_expires_on, last_e9100_data_on, surense_created_at, surense_modified_at,
    surense_version, national_id_hmac, details_enc, synced_at)
  select distinct on (r.surense_id)
    r.surense_id, r.surense_agency_id, r.manager_id, coalesce(r.manager_ids, '{}'), r.status_id, left(r.status_name, 80), r.status_active,
    r.class_id, left(r.class_name, 80), r.source_id, left(r.source_name, 80), r.creation_source, r.id_type, r.id_number_locked,
    r.cell_verified, r.duplicate, r.swiftness_proxy_signed_on, r.swiftness_proxy_expires_on,
    r.hb_proxy_signed_on, r.hb_proxy_expires_on, r.policies_proxy_signed_on, r.policies_proxy_expires_on, r.last_e9100_data_on,
    r.surense_created_at, r.surense_modified_at, r.surense_version,
    case when r.id_type = 1 and r.national_id ~ '^[0-9]{5,9}$' then private.national_id_hmac(r.national_id) end,
    private.pii_encrypt(coalesce(e.j -> 'details', '{}'::jsonb)::text), now()
  from jsonb_array_elements(p_rows) with ordinality as e(j, ord)
  cross join lateral jsonb_to_record(e.j) as r(surense_id uuid, surense_agency_id uuid, manager_id uuid, manager_ids uuid[],
    status_id uuid, status_name text, status_active boolean, class_id uuid, class_name text, source_id uuid, source_name text,
    creation_source integer, id_type integer, id_number_locked boolean, cell_verified boolean, duplicate boolean,
    swiftness_proxy_signed_on date, swiftness_proxy_expires_on date, hb_proxy_signed_on date,
    hb_proxy_expires_on date, policies_proxy_signed_on date, policies_proxy_expires_on date, last_e9100_data_on date,
    surense_created_at timestamptz, surense_modified_at timestamptz, surense_version bigint, national_id text)
  where r.surense_id is not null
  order by r.surense_id, e.ord desc
  on conflict (id) do update set
    surense_agency_id = excluded.surense_agency_id, manager_id = excluded.manager_id, manager_ids = excluded.manager_ids,
    status_id = excluded.status_id, status_name = excluded.status_name, status_active = excluded.status_active,
    class_id = excluded.class_id, class_name = excluded.class_name, source_id = excluded.source_id, source_name = excluded.source_name,
    creation_source = excluded.creation_source, id_type = excluded.id_type, id_number_locked = excluded.id_number_locked,
    cell_verified = excluded.cell_verified, duplicate = excluded.duplicate, swiftness_proxy_signed_on = excluded.swiftness_proxy_signed_on,
    swiftness_proxy_expires_on = excluded.swiftness_proxy_expires_on, hb_proxy_signed_on = excluded.hb_proxy_signed_on,
    hb_proxy_expires_on = excluded.hb_proxy_expires_on, policies_proxy_signed_on = excluded.policies_proxy_signed_on,
    policies_proxy_expires_on = excluded.policies_proxy_expires_on, last_e9100_data_on = excluded.last_e9100_data_on,
    surense_created_at = excluded.surense_created_at, surense_modified_at = excluded.surense_modified_at,
    surense_version = excluded.surense_version, national_id_hmac = excluded.national_id_hmac, details_enc = excluded.details_enc,
    deleted_at = null, synced_at = now()
  -- an older copy never overwrites a newer one (webhook and pull can race)
  where t.surense_modified_at is null or excluded.surense_modified_at is null or excluded.surense_modified_at >= t.surense_modified_at;
  get diagnostics n_up = row_count;
  return jsonb_build_object('received', n_total, 'upserted', n_up);
end $$;

-- deleted in Surense: the row stays as a tombstone (ops.cleanup hard-deletes it later) but its personal data goes now:
-- details, the id hmac, the customer's product details and portfolio snapshots are replaced by an encrypted '{}'
create or replace function api.surense_customer_mark_deleted(p_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_found boolean;
begin
  perform private.kill_switch('surense_enabled');
  update crm.surense_customers set deleted_at = now(), details_enc = private.pii_encrypt('{}'), national_id_hmac = null
   where id = p_id and deleted_at is null;
  v_found := found;
  if v_found then
    update crm.surense_products set details_enc = private.pii_encrypt('{}'), synced_at = now() where customer_surense_id = p_id;
    update crm.surense_portfolios set snapshot_enc = private.pii_encrypt('{}'), product_count = 0 where customer_surense_id = p_id;
  end if;
  return jsonb_build_object('updated', v_found);
end $$;

create or replace function api.surense_documents_upsert(p_rows jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare n_total integer; n_up integer;
begin
  perform private.kill_switch('surense_enabled');
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 200 then
    raise exception 'invalid_input:rows' using errcode = 'PT400';
  end if;
  n_total := jsonb_array_length(p_rows);
  insert into crm.surense_documents as t (kind, surense_id, customer_surense_id, lead_surense_id, type_id, mime, file_extension,
    size_bytes, source, system_generated, company_id, surense_created_at, surense_modified_at, details_enc, synced_at)
  select distinct on (r.surense_id)
    'document', r.surense_id, r.customer_surense_id, r.lead_surense_id, r.type_id, left(r.mime, 100),
    case when r.file_extension ~ '^[a-z0-9]{1,10}$' then r.file_extension end, r.size_bytes, left(r.source, 40), r.system_generated,
    r.company_id, r.surense_created_at, r.surense_modified_at, private.pii_encrypt(coalesce(e.j -> 'details', '{}'::jsonb)::text), now()
  from jsonb_array_elements(p_rows) with ordinality as e(j, ord)
  cross join lateral jsonb_to_record(e.j) as r(surense_id uuid, customer_surense_id uuid, lead_surense_id uuid, type_id uuid,
    mime text, file_extension text, size_bytes bigint, source text, system_generated boolean, company_id bigint,
    surense_created_at timestamptz, surense_modified_at timestamptz)
  where r.surense_id is not null
  order by r.surense_id, e.ord desc
  on conflict (surense_id) do update set
    customer_surense_id = excluded.customer_surense_id, lead_surense_id = excluded.lead_surense_id, type_id = excluded.type_id,
    mime = excluded.mime, file_extension = excluded.file_extension, size_bytes = excluded.size_bytes, source = excluded.source,
    system_generated = excluded.system_generated, company_id = excluded.company_id, surense_created_at = excluded.surense_created_at,
    surense_modified_at = excluded.surense_modified_at, details_enc = excluded.details_enc, deleted_at = null, synced_at = now()
  where t.surense_modified_at is null or excluded.surense_modified_at is null or excluded.surense_modified_at >= t.surense_modified_at;
  get diagnostics n_up = row_count;
  return jsonb_build_object('received', n_total, 'upserted', n_up);
end $$;

create or replace function api.surense_document_mark_deleted(p_surense_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  perform private.kill_switch('surense_enabled');
  -- Surense documents have no stored object here (only e9100_file rows do): clearing details removes the personal data
  update crm.surense_documents set deleted_at = now(), details_enc = private.pii_encrypt('{}')
   where surense_id = p_surense_id and deleted_at is null;
  return jsonb_build_object('updated', found);
end $$;

-- a file the connector stored in the client-docs bucket (object name = content hash; the real name only in details)
create or replace function api.surense_file_record(p_customer uuid, p_event uuid, p_path text, p_sha256 text, p_size bigint,
                                                   p_mime text, p_details jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.kill_switch('surense_enabled');
  if p_customer is null or p_event is null then raise exception 'invalid_input:ids' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  if p_path is null or p_path <> ('surense/' || p_customer || '/e9100/' || p_event || '/' || p_sha256 || coalesce(substring(p_path from '(\.[a-z0-9]{1,10})$'), '')) then
    raise exception 'invalid_input:path' using errcode = 'PT400';
  end if;
  insert into crm.surense_documents (kind, customer_surense_id, e9100_event_id, mime, size_bytes, storage_path, sha256, stored_at,
                                     details_enc)
  values ('e9100_file', p_customer, p_event, case when p_mime ~ '^[a-z0-9.+-]+/[a-z0-9.+-]+$' then left(p_mime, 100) end, p_size, p_path,
          decode(p_sha256, 'hex'), now(), private.pii_encrypt(coalesce(p_details, '{}'::jsonb)::text))
  on conflict (storage_path) do nothing
  returning id into v_id;
  return jsonb_build_object('id', coalesce(v_id, (select d.id from crm.surense_documents d where d.storage_path = p_path)), 'duplicate', v_id is null);
end $$;

-- p_mode: 'production' | 'pre_advice'; p_snapshot = the full response (encrypted); p_products = mirror rows (mirror.ts)
create or replace function api.surense_portfolio_store(p_customer uuid, p_mode text, p_snapshot text, p_products jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_snap bigint; n_up integer;
begin
  perform private.kill_switch('surense_enabled');
  if p_customer is null then raise exception 'invalid_input:customer' using errcode = 'PT400'; end if;
  if p_mode is null or p_mode not in ('production', 'pre_advice') then raise exception 'invalid_input:mode' using errcode = 'PT400'; end if;
  if p_snapshot is null or octet_length(p_snapshot) > 4194304 then raise exception 'invalid_input:snapshot' using errcode = 'PT400'; end if;
  if p_products is null or jsonb_typeof(p_products) <> 'array' or jsonb_array_length(p_products) > 1000 then
    raise exception 'invalid_input:products' using errcode = 'PT400';
  end if;
  insert into crm.surense_portfolios (customer_surense_id, mode, product_count, snapshot_enc)
  values (p_customer, p_mode, jsonb_array_length(p_products), private.pii_encrypt(p_snapshot))
  returning id into v_snap;
  insert into crm.surense_products as t (id, customer_surense_id, source, company_id, product_id, product_type, hidden,
                                         surense_modified_at, details_enc, synced_at)
  select distinct on (r.surense_id)
    r.surense_id, coalesce(r.customer_surense_id, p_customer), left(r.source, 40), r.company_id, r.product_id, r.product_type, r.hidden,
    r.surense_modified_at, private.pii_encrypt(coalesce(e.j -> 'details', '{}'::jsonb)::text), now()
  from jsonb_array_elements(p_products) with ordinality as e(j, ord)
  cross join lateral jsonb_to_record(e.j) as r(surense_id uuid, customer_surense_id uuid, source text, company_id bigint,
    product_id bigint, product_type integer, hidden boolean, surense_modified_at timestamptz)
  where r.surense_id is not null
  order by r.surense_id, e.ord desc
  on conflict (id) do update set
    customer_surense_id = excluded.customer_surense_id, source = excluded.source, company_id = excluded.company_id,
    product_id = excluded.product_id, product_type = excluded.product_type, hidden = excluded.hidden,
    surense_modified_at = excluded.surense_modified_at, details_enc = excluded.details_enc, synced_at = now();
  get diagnostics n_up = row_count;
  perform private.audit_action('crm.surense_portfolios', v_snap::text, '{}', jsonb_build_object('action', 'surense_portfolio_store', 'mode', p_mode));
  return jsonb_build_object('snapshot_id', v_snap, 'products', n_up);
end $$;

-- outbound write calls (create customer, proxies invite, E9100, uploads): ACTION rows with op + Surense id + status.
-- p_phase: 'pending' is written BEFORE the request (status null; if this insert fails the request is not sent),
-- 'result' after it with the HTTP status, 'ambiguous' after a timeout / network failure / 502 / 504 on a write
-- (status 0 or the gateway status): the call may or may not have taken effect in Surense, check there before retrying.
create or replace function api.surense_audit(p_op text, p_ref text, p_status integer, p_phase text default 'result')
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_op is null or p_op !~ '^[a-z][a-z0-9_.]{1,60}$' then raise exception 'invalid_input:op' using errcode = 'PT400'; end if;
  if p_ref is not null and p_ref !~ '^[A-Za-z0-9_-]{1,64}$' then raise exception 'invalid_input:ref' using errcode = 'PT400'; end if;
  if p_status is not null and p_status not between 0 and 599 then raise exception 'invalid_input:status' using errcode = 'PT400'; end if;
  if p_phase is null or p_phase not in ('pending', 'result', 'ambiguous') then raise exception 'invalid_input:phase' using errcode = 'PT400'; end if;
  perform private.audit_action('surense.api', p_ref, '{}',
    jsonb_build_object('action', 'surense_call', 'op', p_op, 'status', p_status, 'phase', p_phase));
end $$;

revoke all on function private.surense_params_ok(jsonb) from public, anon, authenticated, service_role;
revoke all on function api.surense_gate(boolean, text), api.surense_event_ingest(text, text, timestamptz, text),
  api.surense_job_enqueue(text, jsonb, text), api.surense_job_claim(integer), api.surense_job_complete(bigint, integer, text, text, text, integer),
  api.surense_sync_state_get(text), api.surense_sync_state_set(text, text, boolean, integer), api.surense_customers_upsert(jsonb),
  api.surense_customer_mark_deleted(uuid), api.surense_documents_upsert(jsonb), api.surense_document_mark_deleted(uuid),
  api.surense_file_record(uuid, uuid, text, text, bigint, text, jsonb), api.surense_portfolio_store(uuid, text, text, jsonb),
  api.surense_audit(text, text, integer, text)
  from public, anon, authenticated;
grant execute on function api.surense_gate(boolean, text), api.surense_event_ingest(text, text, timestamptz, text),
  api.surense_job_enqueue(text, jsonb, text), api.surense_job_claim(integer), api.surense_job_complete(bigint, integer, text, text, text, integer),
  api.surense_sync_state_get(text), api.surense_sync_state_set(text, text, boolean, integer), api.surense_customers_upsert(jsonb),
  api.surense_customer_mark_deleted(uuid), api.surense_documents_upsert(jsonb), api.surense_document_mark_deleted(uuid),
  api.surense_file_record(uuid, uuid, text, text, bigint, text, jsonb), api.surense_portfolio_store(uuid, text, text, jsonb),
  api.surense_audit(text, text, integer, text)
  to service_role;

-- ---------------------------------------------------------------- staff.admin_config_set: 090300 verbatim + 5 keys
create or replace function staff.admin_config_set(p_key text, p_value text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_old text;
begin
  if p_key is null or p_key not in ('intake_enabled', 'chat_enabled', 'portal_enabled', 'tracks_sync_enabled',
      'lead_retention_enabled', 'auth_lock_enabled', 'stepup_max_age_sec',
      'surense_enabled', 'surense_write_enabled', 'surense_e9100_enabled', 'surense_webhook_enabled', 'surense_retention_enabled') then
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

-- ---------------------------------------------------------------- ops.cleanup: 091200 verbatim + Surense (switch-gated)
create or replace function ops.cleanup()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  n_rate bigint; n_outbox bigint; n_dead bigint; n_idem bigint; n_jobs bigint; n_alerts bigint; n_alerts_stuck bigint;
  n_chat_m bigint; n_chat_s bigint; n_inv bigint; n_audit bigint; n_access bigint; n_auth bigint; n_cron bigint := 0;
  n_lead_soft bigint := 0; n_lead_hard bigint := 0; n_sur_events bigint := 0; n_sur_jobs bigint := 0; n_sur_mirror bigint := 0;
  n_sur_snap bigint := 0; n bigint;
begin
  delete from ops.rate_limits where window_start < now() - interval '2 days';
  get diagnostics n_rate = row_count;
  delete from ops.outbox where status = 'sent' and processed_at < now() - interval '14 days';
  get diagnostics n_outbox = row_count;
  delete from ops.outbox where status = 'dead' and processed_at < now() - interval '30 days';
  get diagnostics n_dead = row_count;
  delete from ops.idempotency_keys where created_at < now() - interval '48 hours';
  get diagnostics n_idem = row_count;
  -- successful notify-worker ticks (1,440/day) are kept 7 days; everything else 90 days
  delete from ops.job_runs where started_at < now() - interval '90 days'
     or (job = 'notify-worker' and ok and started_at < now() - interval '7 days')
     or (job = 'surense-worker' and ok and started_at < now() - interval '7 days');
  get diagnostics n_jobs = row_count;
  delete from ops.alerts where status <> 'pending' and at < now() - interval '90 days';
  get diagnostics n_alerts = row_count;
  delete from ops.alerts where status = 'pending' and at < now() - interval '30 days';
  get diagnostics n_alerts_stuck = row_count;
  delete from crm.chat_messages where created_at < now() - interval '90 days';
  get diagnostics n_chat_m = row_count;
  delete from crm.chat_sessions where last_seen_at < now() - interval '90 days';
  get diagnostics n_chat_s = row_count;
  -- invitations hold e-mail addresses: unused ones go 30 days after expiry, accepted ones after 90 days
  delete from core.invitations
   where (accepted_at is null and expires_at < now() - interval '30 days') or accepted_at < now() - interval '90 days';
  get diagnostics n_inv = row_count;
  -- Surense (switch surense_retention_enabled, off by default: nothing Surense-related is deleted until the owner
  -- approves the windows; no-delete rule). TODO(owner): placeholder windows (OWNER-STEPS 6.20).
  -- Inbox: 90 days (encrypted payloads), never while a job for the event is still open; a closed job keeps its row
  -- with event_id set null (FK on delete set null). Closed jobs 30 days, dead jobs 90 days.
  if private.flag('surense_retention_enabled') then
    delete from ops.surense_events e where e.received_at < now() - interval '90 days'
       and not exists (select 1 from ops.surense_jobs j where j.event_id = e.id and j.status in ('pending', 'processing'));
    get diagnostics n_sur_events = row_count;
    delete from ops.surense_jobs where (status in ('done', 'skipped') and processed_at < now() - interval '30 days')
       or (status = 'dead' and processed_at < now() - interval '90 days');
    get diagnostics n_sur_jobs = row_count;
  end if;
  -- Surense mirror (same switch).
  -- Tombstones (deleted in Surense; personal data already cleared) go after 30 days with their products and snapshots;
  -- every customer keeps only the latest 3 portfolio snapshots per mode.
  if private.flag('surense_retention_enabled') then
    delete from crm.surense_products p using crm.surense_customers c
     where p.customer_surense_id = c.id and c.deleted_at < now() - interval '30 days';
    get diagnostics n = row_count;
    n_sur_mirror := n_sur_mirror + n;
    delete from crm.surense_portfolios p using crm.surense_customers c
     where p.customer_surense_id = c.id and c.deleted_at < now() - interval '30 days';
    get diagnostics n = row_count;
    n_sur_snap := n_sur_snap + n;
    delete from crm.surense_customers where deleted_at < now() - interval '30 days';
    get diagnostics n = row_count;
    n_sur_mirror := n_sur_mirror + n;
    delete from crm.surense_documents where kind = 'document' and storage_path is null and deleted_at < now() - interval '30 days';
    get diagnostics n = row_count;
    n_sur_mirror := n_sur_mirror + n;
    delete from crm.surense_portfolios p
     using (select x.id, row_number() over (partition by x.customer_surense_id, x.mode order by x.fetched_at desc, x.id desc) as rn
              from crm.surense_portfolios x) old
     where p.id = old.id and old.rn > 3;
    get diagnostics n = row_count;
    n_sur_snap := n_sur_snap + n;
  end if;

  perform set_config('audit.allow_purge', 'on', true);
  delete from audit.log where at < now() - interval '25 months';
  get diagnostics n_audit = row_count;
  delete from audit.access_log where at < now() - interval '25 months';
  get diagnostics n_access = row_count;
  delete from audit.auth_events where at < now() - interval '25 months';
  get diagnostics n_auth = row_count;
  perform set_config('audit.allow_purge', 'off', true);

  if private.flag('lead_retention_enabled') then
    update crm.leads set deleted_at = now()
     where deleted_at is null and status in ('lost', 'spam') and updated_at < now() - interval '24 months';
    get diagnostics n_lead_soft = row_count;
    -- any status: a lead soft-deleted by staff (or by the rule above) is hard-deleted 12 months later
    delete from crm.leads where deleted_at is not null and deleted_at < now() - interval '12 months';
    get diagnostics n_lead_hard = row_count;
  end if;

  if to_regclass('cron.job_run_details') is not null then
    delete from cron.job_run_details where end_time < now() - interval '7 days';
    get diagnostics n_cron = row_count;
  end if;

  if n_alerts_stuck > 0 then
    perform ops.raise_alert('warning', 'alerts_purged_undelivered', n_alerts_stuck || ' alerts were still pending after 30 days and were purged',
                            'alerts_purged_undelivered', interval '24 hours');
  end if;

  return jsonb_build_object('rate_limits', n_rate, 'outbox', n_outbox, 'outbox_dead', n_dead, 'idempotency', n_idem,
    'job_runs', n_jobs, 'alerts', n_alerts, 'alerts_stuck', n_alerts_stuck, 'chat_messages', n_chat_m, 'chat_sessions', n_chat_s,
    'invitations', n_inv, 'audit', n_audit, 'access_log', n_access, 'auth_events', n_auth, 'cron_runs', n_cron,
    'leads_soft', n_lead_soft, 'leads_hard', n_lead_hard, 'surense_events', n_sur_events, 'surense_jobs', n_sur_jobs,
    'surense_mirror', n_sur_mirror, 'surense_snapshots', n_sur_snap);
end $$;
revoke all on function ops.cleanup() from public, anon, authenticated;
grant execute on function ops.cleanup() to service_role;

-- ---------------------------------------------------------------- ops.watchdog: 091100 verbatim + 'surense' step
-- Full body re-created (the 091100 way; no later migration redefines it). Additions only: surense-worker in the
-- job_not_finished CASE (5 minutes: its budget is 72 s) and the isolated 'surense' step before the run is closed.
create or replace function ops.watchdog()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_run bigint; v_failed text[] := '{}'; v_copied integer := 0; v_fail integer; v_locked integer := 0; r record;
  v_n bigint; v_min bigint;
  v_actions text := coalesce((select value from ops.config where key = 'auth_failure_actions'), '');
begin
  insert into ops.job_runs (job) values ('ops-watchdog') returning id into v_run;

  begin
    perform ops.cron_http_audit();
  exception when others then
    v_failed := v_failed || 'cron_http_audit'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'cron_http_audit: SQLSTATE ' || sqlstate, 'watchdog_step:cron_http_audit', interval '24 hours');
  end;

  begin
    v_copied := ops.copy_auth_events();
  exception when others then
    v_failed := v_failed || 'copy_auth_events'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'copy_auth_events: SQLSTATE ' || sqlstate, 'watchdog_step:copy_auth_events', interval '24 hours');
  end;

  begin
    if exists (select 1 from ops.outbox o
                where (o.status = 'pending' and o.next_attempt_at < now() - interval '15 minutes')
                   or (o.status = 'processing' and o.locked_until < now() - interval '5 minutes')) then
      perform ops.raise_alert('critical', 'outbox_backlog', 'outbox rows overdue > 15 min (worker not draining)', 'outbox_backlog');
    end if;
    if exists (select 1 from ops.outbox o where o.status = 'pending' and o.attempts >= 3) then
      perform ops.raise_alert('warning', 'outbox_retrying', 'outbox rows on their 3rd+ attempt', 'outbox_retrying', interval '6 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'outbox'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'outbox: SQLSTATE ' || sqlstate, 'watchdog_step:outbox', interval '24 hours');
  end;

  begin
    if exists (select 1 from ops.job_runs j
                where j.finished_at is null and j.id <> v_run and j.started_at > now() - interval '1 day'
                  and j.started_at < now() - case j.job when 'notify-worker' then interval '5 minutes'
                                                        when 'surense-worker' then interval '5 minutes'
                                                        when 'ops-watchdog' then interval '5 minutes'
                                                        when 'fetch-cma-data' then interval '120 minutes'
                                                        else interval '30 minutes' end) then
      perform ops.raise_alert('warning', 'job_not_finished', 'a job run did not report job_finish in time', 'job_not_finished');
    end if;
    if exists (select 1 from ops.job_runs where job = 'fetch-cma-data')
       and not exists (select 1 from ops.job_runs where job = 'fetch-cma-data' and ok and finished_at > now() - interval '8 days') then
      perform ops.raise_alert('warning', 'cma_stale', 'no successful fetch-cma-data run in 8 days', 'cma_stale', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'jobs'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'jobs: SQLSTATE ' || sqlstate, 'watchdog_step:jobs', interval '24 hours');
  end;

  -- refresh after a successful load (flag set by api.cma_finish_sync); runs here because pg_cron has no PostgREST timeout
  begin
    if private.flag('cma_refresh_pending') then
      declare v_r bigint; v_t jsonb;
      begin
        insert into ops.job_runs (job) values ('cma-refresh') returning id into v_r;
        perform content.refresh_fund_views();
        v_t := content.refresh_investment_tracks();
        update ops.config set value = 'false', updated_at = now() where key = 'cma_refresh_pending';
        update ops.job_runs set finished_at = now(), ok = true, stats = jsonb_build_object('tracks', v_t) where id = v_r;
      end;
    end if;
    if private.flag('tracks_sync_enabled')
       and exists (select 1 from content.investment_tracks where is_active)
       and (select max(last_sync) from content.investment_tracks where is_active) < now() - interval '9 days' then
      perform ops.raise_alert('warning', 'tracks_stale', 'investment_tracks not refreshed for 9 days', 'tracks_stale', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'cma_refresh'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'cma_refresh: SQLSTATE ' || sqlstate, 'watchdog_step:cma_refresh', interval '24 hours');
  end;

  begin
    -- rejected requests roll back inside submit_lead; lead-intake records them via api.intake_note_reject (separate request)
    if (select coalesce(sum(hits), 0) from ops.rate_limits where bucket = 'intake_reject' and window_start > now() - interval '1 hour') >= 200 then
      perform ops.raise_alert('warning', 'intake_rejects', '200+ rejected intake requests in the last hour', 'intake_rejects');
    end if;
    if (select coalesce(max(hits), 0) from ops.rate_limits where bucket = 'lead_all' and window_start > now() - interval '1 hour') >= 250 then
      perform ops.raise_alert('warning', 'intake_near_cap', 'accepted leads at 250 of the 300/hour cap; real visitors are next', 'intake_near_cap');
    end if;
  exception when others then
    v_failed := v_failed || 'intake'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'intake: SQLSTATE ' || sqlstate, 'watchdog_step:intake', interval '24 hours');
  end;

  begin
    if v_actions = '' then
      perform ops.raise_alert('warning', 'auth_failure_detection_unverified',
        'auth_failure_actions is empty: failed-login detection and auto-lock are OFF until verified on a branch',
        'auth_failure_detection_unverified', interval '24 hours');
    end if;
    if exists (select 1 from core.staff where active)
       and not exists (select 1 from audit.auth_events where source = 'gotrue' and at > now() - interval '7 days') then
      perform ops.raise_alert('warning', 'auth_feed_silent', 'no GoTrue audit event copied in 7 days', 'auth_feed_silent', interval '24 hours');
    end if;
    if v_actions <> '' then
      select count(*) into v_fail from audit.auth_events where not ok and at > now() - interval '15 minutes';
      if v_fail >= 30 then
        perform ops.raise_alert('critical', 'auth_failure_burst', v_fail || ' auth failures in 15 min', 'auth_burst_critical');
      elsif v_fail >= 10 then
        perform ops.raise_alert('warning', 'auth_failure_burst', v_fail || ' auth failures in 15 min', 'auth_burst_warning');
      end if;
    end if;
    if v_actions <> '' and private.flag('auth_lock_enabled') then
      for r in
        select e.user_id, s.role, count(*) as n, count(distinct e.ip_hash) as ips
          from audit.auth_events e join core.staff s on s.user_id = e.user_id and s.active
         where not e.ok and e.source = 'gotrue' and e.at > now() - interval '15 minutes'
           and (s.locked_until is null or s.locked_until < now())
         group by e.user_id, s.role having count(*) >= 10
      loop
        if r.role = 'admin' or r.ips < 2 then
          -- admins are never auto-locked (a locked last admin has no way back); single-source bursts are left to GoTrue limits + CAPTCHA
          perform ops.raise_alert('critical', 'staff_failures', r.role || ' account: ' || r.n || ' failures in 15 min (not locked)',
                                  'staff_failures:' || r.user_id);
        else
          update core.staff set locked_until = now() + interval '30 minutes' where user_id = r.user_id;
          insert into audit.log (actor, actor_role, table_name, op, pk, changed_cols, new_data)
          values (null, 'watchdog', 'core.staff', 'ACTION', r.user_id::text, array['locked_until'],
                  jsonb_build_object('action', 'staff_auto_lock', 'failures', r.n));
          perform ops.raise_alert('critical', 'staff_locked', 'staff account locked 30 min after ' || r.n || ' failures', 'staff_locked:' || r.user_id);
          v_locked := v_locked + 1;
        end if;
      end loop;
    end if;
  exception when others then
    v_failed := v_failed || 'auth'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'auth: SQLSTATE ' || sqlstate, 'watchdog_step:auth', interval '24 hours');
  end;

  -- Surense connector (20261120200000). Ids and counts only, never a payload or a name.
  begin
    select count(*), min(j.id) into v_n, v_min from ops.surense_jobs j
     where j.status = 'pending' and j.next_attempt_at < now() - interval '15 minutes';
    if v_n > 0 then
      perform ops.raise_alert('critical', 'surense_backlog',
        'surense jobs pending > 15 min past due: count=' || v_n || ' oldest_id=' || v_min || ' (worker not draining)', 'surense_backlog');
    end if;
    select count(*), min(j.id) into v_n, v_min from ops.surense_jobs j
     where j.status = 'processing' and j.locked_until < now() - interval '10 minutes';
    if v_n > 0 then
      perform ops.raise_alert('critical', 'surense_job_stuck',
        'surense jobs processing with a lock expired > 10 min: count=' || v_n || ' oldest_id=' || v_min, 'surense_job_stuck');
    end if;
    select count(*), min(j.id) into v_n, v_min from ops.surense_jobs j
     where j.status = 'dead' and j.processed_at > now() - interval '24 hours';
    if v_n > 0 then
      perform ops.raise_alert('warning', 'surense_dead_24h', 'surense dead jobs in 24h: count=' || v_n || ' first_id=' || v_min,
                              'surense_dead_24h', interval '24 hours');
    end if;
    -- silence: the webhook switch has been on for 24h+ and no event arrived in 24h (Svix endpoint disabled, secret drift)
    if private.flag('surense_webhook_enabled')
       and (select c.updated_at from ops.config c where c.key = 'surense_webhook_enabled') < now() - interval '24 hours'
       and not exists (select 1 from ops.surense_events e where e.received_at > now() - interval '24 hours') then
      perform ops.raise_alert('warning', 'surense_events_silent', 'no surense webhook event in 24h while surense_webhook_enabled is on',
                              'surense_events_silent', interval '24 hours');
    end if;
    -- intake left off: only once the connector is in use (surense_enabled on), else this would fire daily before go-live
    if private.flag('surense_enabled') and not private.flag('surense_webhook_enabled')
       and coalesce((select c.updated_at from ops.config c where c.key = 'surense_webhook_enabled'), '-infinity') < now() - interval '24 hours' then
      perform ops.raise_alert('warning', 'surense_webhook_off', 'surense_webhook_enabled is off for more than 24h while surense_enabled is on',
                              'surense_webhook_off', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'surense'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'surense: SQLSTATE ' || sqlstate, 'watchdog_step:surense', interval '24 hours');
  end;

  update ops.job_runs set finished_at = now(), ok = cardinality(v_failed) = 0,
         stats = jsonb_build_object('failed_steps', to_jsonb(v_failed), 'auth_events_copied', v_copied, 'locked', v_locked)
   where id = v_run;
  return jsonb_build_object('ok', cardinality(v_failed) = 0, 'failed_steps', to_jsonb(v_failed),
                            'auth_events_copied', v_copied, 'locked', v_locked);
end $$;

revoke all on function ops.watchdog() from public, anon, authenticated;
