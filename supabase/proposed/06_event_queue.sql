-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).
-- Apply 06, 07, 08, 09 as ONE release: 06 calls public.route_destinations / apply_field_update (07) at run time.
-- Depends on: 02_audit_log.sql (pattern only), extension pgmq (available, NOT installed in the SEELD project).
--
-- Event-driven core. Design (docs/platform/EVENT-ARCHITECTURE.md):
--   * identity_links           unified identity: internal customer id <-> Salesforce id <-> Surense id
--   * TWO destination queues   salesforce_events (fast) and surense_events (slow), each with its own dead-letter queue.
--                              Salesforce and Surense never talk to each other, only through the operational DB.
--   * ONE transaction          save functions write the data AND call pgmq.send in the same transaction. No second outbox.
--   * event_log                append-only AUDIT of what happened. It is not a queue and nothing is copied from it.
--   * per-customer ordering    customer_queue_state, one row per (customer, destination): sequence assigned at enqueue,
--                              a message runs only when its predecessor is completed; FOR UPDATE SKIP LOCKED + lease.
--   * loop prevention          event_registry: stable event id + content hash + origin; echoes are dropped.
--   * idempotency_keys         double clicks and retries never create duplicate leads/cases (48 h retention).
-- PII rules: queue messages and event_log carry ids, codes and field KEYS only. Never values, never a national id.

create extension if not exists pgmq;
create extension if not exists pgcrypto with schema extensions;
-- Vault (supabase_vault) holds the secrets 'national_id_hmac_key' and 'national_id_enc_key'. Created by the owner, never in git.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. identity_links: THE router table. One row per person.
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.identity_links (
  internal_customer_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,   -- portal login, if any
  agency_id uuid references public.agencies(id) on delete set null,
  -- National ID: NEVER plaintext. Lookup = HMAC-SHA256(normalised 9-digit id, vault key). Value = pgcrypto encrypted.
  national_id_hash bytea unique,
  national_id_enc bytea,
  national_id_key_ref text,                       -- which vault key version produced hash/enc, e.g. 'v1'
  salesforce_id text unique,
  surense_id text unique,
  status text not null default 'pending' check (status in ('pending','verified','conflict','merged','disabled')),
  verified_at timestamptz,
  verified_by text check (verified_by in ('otp','agent','clearing_house','manual')),
  merged_into uuid references public.identity_links(internal_customer_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identity_verified_needs_hash check (status <> 'verified' or (national_id_hash is not null and national_id_enc is not null and verified_at is not null)),
  constraint identity_hash_with_enc check ((national_id_hash is null) = (national_id_enc is null))
);
comment on table public.identity_links is 'Unified identity router. National id only as keyed HMAC lookup hash + encrypted value. No access for client roles.';
comment on column public.identity_links.national_id_hash is 'HMAC-SHA256 of the normalised 9-digit id with a Vault key. Keyed so the 10^9 id space cannot be brute forced from a leak.';
comment on column public.identity_links.national_id_enc is 'pgp_sym_encrypt of the normalised id, key from Vault. Never logged, never selected by client roles.';
create index if not exists identity_links_agency_id_idx on public.identity_links (agency_id);
create index if not exists identity_links_merged_into_idx on public.identity_links (merged_into) where merged_into is not null;
alter table public.identity_links enable row level security;
revoke all on public.identity_links from anon, authenticated;
-- No policy: service role and security definer functions only.

-- Normalise to exactly nine digits (strip separators, left pad) and validate the check digit. Returns null if invalid.
create or replace function public.identity_normalize_national_id(p_raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  with s as (select lpad(regexp_replace(coalesce(p_raw, ''), '[\s./-]', '', 'g'), 9, '0') as v)
  select case
    when (select v from s) ~ '^[0-9]{9}$'
     and (select coalesce(sum(case when d * w > 9 then d * w - 9 else d * w end), 0) % 10
            from (select substr((select v from s), i, 1)::int as d, ((i - 1) % 2) + 1 as w from generate_series(1, 9) i) t) = 0
    then (select v from s)
  end;
$$;

create or replace function public.identity_hash_national_id(p_raw text)
returns bytea
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id text := public.identity_normalize_national_id(p_raw);
  v_key text;
begin
  if v_id is null then raise exception 'invalid_national_id' using errcode = '22023'; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'national_id_hmac_key';
  if v_key is null then raise exception 'identity_hmac_key_missing' using errcode = '55000'; end if;
  return extensions.hmac(convert_to(v_id, 'utf8'), convert_to(v_key, 'utf8'), 'sha256');
end;
$$;

-- Find-or-create a VERIFIED identity from a national id. The caller says how it was verified. The id never leaves this function.
create or replace function public.identity_upsert_verified(p_national_id text, p_verified_by text, p_agency_id uuid default null, p_auth_user_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text := public.identity_normalize_national_id(p_national_id);
  v_hash bytea;
  v_enc_key text;
  v_uid uuid;
begin
  if v_id is null then raise exception 'invalid_national_id' using errcode = '22023'; end if;
  v_hash := public.identity_hash_national_id(v_id);
  select decrypted_secret into v_enc_key from vault.decrypted_secrets where name = 'national_id_enc_key';
  if v_enc_key is null then raise exception 'identity_enc_key_missing' using errcode = '55000'; end if;
  insert into public.identity_links as il (national_id_hash, national_id_enc, national_id_key_ref, status, verified_at, verified_by, agency_id, auth_user_id)
  values (v_hash, extensions.pgp_sym_encrypt(v_id, v_enc_key), 'v1', 'verified', now(), p_verified_by, p_agency_id, p_auth_user_id)
  on conflict (national_id_hash) do update
    set updated_at = now(),
        agency_id = coalesce(il.agency_id, excluded.agency_id),
        auth_user_id = coalesce(il.auth_user_id, excluded.auth_user_id)
  returning internal_customer_id into v_uid;
  return v_uid;
end;
$$;

create or replace function public.identity_create_pending(p_agency_id uuid default null)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.identity_links (agency_id) values (p_agency_id) returning internal_customer_id;
$$;

-- Link an external id. A clash on the unique constraint marks the identity 'conflict' and logs it; it never overwrites.
create or replace function public.identity_set_external_id(p_customer uuid, p_system text, p_external_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_system not in ('salesforce','surense') then raise exception 'bad_system'; end if;
  if p_system = 'salesforce' then
    update public.identity_links set salesforce_id = p_external_id, updated_at = now() where internal_customer_id = p_customer and (salesforce_id is null or salesforce_id = p_external_id);
  else
    update public.identity_links set surense_id = p_external_id, updated_at = now() where internal_customer_id = p_customer and (surense_id is null or surense_id = p_external_id);
  end if;
  if not found then
    update public.identity_links set status = 'conflict', updated_at = now() where internal_customer_id = p_customer;
    insert into public.event_log (event_type, customer_key, destination, code) values ('identity.conflict', p_customer, p_system, 'external_id_already_linked');
    return 'conflict';
  end if;
  return 'ok';
exception when unique_violation then
  update public.identity_links set status = 'conflict', updated_at = now() where internal_customer_id = p_customer;
  insert into public.event_log (event_type, customer_key, destination, code) values ('identity.conflict', p_customer, p_system, 'external_id_unique_violation');
  return 'conflict';
end;
$$;

create or replace function public.identity_get_external_ids(p_customer uuid)
returns table (salesforce_id text, surense_id text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select salesforce_id, surense_id, status from public.identity_links where internal_customer_id = p_customer;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Destination queues (one per system) + dead-letter queues + per-destination policy (mirrors the adapter profiles).
-- ---------------------------------------------------------------------------------------------------------------
select pgmq.create('salesforce_events');
select pgmq.create('salesforce_events_dlq');
select pgmq.create('surense_events');
select pgmq.create('surense_events_dlq');

create table if not exists public.queue_destinations (
  destination text primary key check (destination in ('salesforce','surense')),
  queue_name text not null unique,
  dlq_name text not null unique,
  enabled boolean not null default false,                -- the config switch: salesforce_only / surense_only / both_parallel
  visibility_timeout_sec integer not null default 60 check (visibility_timeout_sec between 10 and 300),
  batch_size integer not null default 20 check (batch_size between 1 and 20),
  drain_interval_sec integer not null default 30 check (drain_interval_sec >= 1),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  backoff_sec integer[] not null default '{30,300,1800}',
  skip_requeue_sec integer not null default 5 check (skip_requeue_sec >= 1),
  halted_requeue_sec integer not null default 300 check (halted_requeue_sec >= 1),
  updated_at timestamptz not null default now()
);
comment on table public.queue_destinations is 'Per destination queue policy. Values mirror SALESFORCE_PROFILE / SURENSE_PROFILE in src/platform/systems. Every number is a TODO(owner) tuning value, not a vendor limit.';
alter table public.queue_destinations enable row level security;
revoke all on public.queue_destinations from anon, authenticated;

-- TODO(owner): tune after the vendor limits are documented. enabled stays false until the owner picks the deployment mode.
insert into public.queue_destinations (destination, queue_name, dlq_name, batch_size, drain_interval_sec, backoff_sec, skip_requeue_sec, halted_requeue_sec)
values ('salesforce', 'salesforce_events', 'salesforce_events_dlq', 20, 10, '{30,300,1800}', 5, 300),
       ('surense',    'surense_events',    'surense_events_dlq',     5, 30, '{60,600,3600}', 15, 600)
on conflict (destination) do nothing;

create or replace function public.queue_policy(p_destination text)
returns public.queue_destinations
language sql
stable
security definer
set search_path = ''
as $$ select * from public.queue_destinations where destination = p_destination; $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Audit log, event registry, per-customer state, idempotency
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.event_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  event_type text not null check (char_length(event_type) between 3 and 60),
  event_id uuid,
  origin_system text check (origin_system in ('operational_db','salesforce','surense','portal','manual')),
  destination text check (destination in ('salesforce','surense')),
  customer_key uuid,
  seq bigint,
  msg_id bigint,
  content_hash text,
  attempt integer,
  code text,                                   -- machine code only
  request_id text,
  meta jsonb not null default '{}'::jsonb      -- no PII, ever
);
comment on table public.event_log is 'Append-only AUDIT of queue activity. Not a queue, not an outbox: nothing is ever read from here to be processed.';
create index if not exists event_log_customer_at_idx on public.event_log (customer_key, at desc);
create index if not exists event_log_type_at_idx on public.event_log (event_type, at desc);
create index if not exists event_log_event_id_idx on public.event_log (event_id);
alter table public.event_log enable row level security;
revoke all on public.event_log from anon, authenticated;

create or replace function public.event_log_block_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'event_log is append-only';
end;
$$;
drop trigger if exists event_log_no_update on public.event_log;
create trigger event_log_no_update before update or delete on public.event_log for each row execute function public.event_log_block_mutation();
drop trigger if exists event_log_no_truncate on public.event_log;
create trigger event_log_no_truncate before truncate on public.event_log for each statement execute function public.event_log_block_mutation();

-- event_registry: loop prevention. One row per accepted event.
create table if not exists public.event_registry (
  event_id uuid primary key,
  customer_key uuid not null references public.identity_links(internal_customer_id) on delete cascade,
  origin_system text not null check (origin_system in ('operational_db','salesforce','surense','portal','manual')),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  sent_to text[] not null default '{}',
  first_seen_at timestamptz not null default now()
);
comment on table public.event_registry is 'Event ids, origins and content hashes for duplicate and echo detection. Rows older than the retention window may be purged (see 09).';
create index if not exists event_registry_customer_hash_idx on public.event_registry (customer_key, content_hash);
create index if not exists event_registry_first_seen_idx on public.event_registry (first_seen_at);
alter table public.event_registry enable row level security;
revoke all on public.event_registry from anon, authenticated;

-- Per customer AND per destination: the ordering state.
create table if not exists public.customer_queue_state (
  customer_key uuid not null references public.identity_links(internal_customer_id) on delete cascade,
  destination text not null check (destination in ('salesforce','surense')),
  last_enqueued_seq bigint not null default 0,
  last_completed_seq bigint not null default 0,
  failure_count integer not null default 0,
  halted boolean not null default false,        -- an earlier message of this customer is in the DLQ
  halted_seq bigint,
  claimed_by text,
  claimed_seq bigint,
  lease_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (customer_key, destination),
  check (last_completed_seq <= last_enqueued_seq)
);
comment on table public.customer_queue_state is 'Per customer and destination ordering state. A message N may run only if N-1 is completed. FOR UPDATE SKIP LOCKED claims; lease_until covers the visibility timeout.';
alter table public.customer_queue_state enable row level security;
revoke all on public.customer_queue_state from anon, authenticated;

create table if not exists public.idempotency_keys (
  action text not null check (char_length(action) between 3 and 60),
  key text not null check (char_length(key) between 8 and 128),
  customer_key uuid,
  result jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',   -- retention >= 24 h; TODO(owner): confirm
  primary key (action, key)
);
comment on table public.idempotency_keys is 'One row per (action, client supplied key). Inserted inside the save function transaction.';
create index if not exists idempotency_keys_expires_at_idx on public.idempotency_keys (expires_at);
alter table public.idempotency_keys enable row level security;
revoke all on public.idempotency_keys from anon, authenticated;

-- Returns null when the caller may proceed, or the stored result of the first call (a duplicate).
create or replace function public.idempotency_begin(p_action text, p_key text, p_customer uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_n integer; v_prev jsonb;
begin
  insert into public.idempotency_keys (action, key, customer_key) values (p_action, p_key, p_customer)
  on conflict (action, key) do nothing;
  get diagnostics v_n = row_count;
  if v_n = 1 then return null; end if;
  -- The unique index made us wait for a concurrent first call to commit, so its result is visible now.
  select coalesce(result, jsonb_build_object('status', 'in_progress')) into v_prev from public.idempotency_keys where action = p_action and key = p_key;
  return v_prev || jsonb_build_object('duplicate', true);
end;
$$;

create or replace function public.idempotency_finish(p_action text, p_key text, p_result jsonb)
returns void
language sql
security definer
set search_path = ''
as $$ update public.idempotency_keys set result = p_result where action = p_action and key = p_key; $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 4. Enqueue (internal). Called ONLY from save functions, inside THEIR transaction. pgmq.send commits with the data.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.content_hash_jsonb(p_value jsonb)
returns text
language sql
immutable
set search_path = ''
as $$ select encode(extensions.digest(convert_to(coalesce(p_value, 'null'::jsonb)::text, 'utf8'), 'sha256'), 'hex'); $$;

create or replace function public.queue_enqueue_event(
  p_origin text,
  p_event_id uuid,
  p_content_hash text,
  p_customer_key uuid,
  p_type text,
  p_field_keys text[],
  p_case_id text default null,
  p_request_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dest text;
  v_targets text[];
  v_sent text[] := '{}';
  v_seq bigint;
  v_msg bigint;
  v_queue text;
begin
  if p_origin not in ('operational_db','salesforce','surense','portal','manual') then raise exception 'bad_origin'; end if;
  if p_content_hash !~ '^[0-9a-f]{64}$' then raise exception 'bad_content_hash'; end if;

  -- Loop prevention 1: same event id seen before.
  if exists (select 1 from public.event_registry where event_id = p_event_id) then
    insert into public.event_log (event_type, event_id, origin_system, customer_key, content_hash, code, request_id)
    values ('event.dropped', p_event_id, p_origin, p_customer_key, p_content_hash, 'duplicate_event', p_request_id);
    return jsonb_build_object('status', 'dropped', 'reason', 'duplicate_event');
  end if;
  -- Loop prevention 2: echo. Same customer and content as an event we already SENT to the system that now reports it.
  if p_origin in ('salesforce','surense') and exists (
       select 1 from public.event_registry r
        where r.customer_key = p_customer_key and r.content_hash = p_content_hash and p_origin = any (r.sent_to)) then
    insert into public.event_registry (event_id, customer_key, origin_system, content_hash, sent_to) values (p_event_id, p_customer_key, p_origin, p_content_hash, '{}');
    insert into public.event_log (event_type, event_id, origin_system, customer_key, content_hash, code, request_id)
    values ('event.dropped', p_event_id, p_origin, p_customer_key, p_content_hash, 'echo', p_request_id);
    return jsonb_build_object('status', 'dropped', 'reason', 'echo');
  end if;

  -- Routing: owner + replicas of the changed fields (07), minus the origin, minus disabled destinations.
  v_targets := public.route_destinations(p_origin, p_field_keys);

  insert into public.event_registry (event_id, customer_key, origin_system, content_hash) values (p_event_id, p_customer_key, p_origin, p_content_hash);
  insert into public.event_log (event_type, event_id, origin_system, customer_key, content_hash, request_id, meta)
  values ('event.accepted', p_event_id, p_origin, p_customer_key, p_content_hash, p_request_id, jsonb_build_object('targets', to_jsonb(v_targets), 'type', p_type));

  foreach v_dest in array v_targets loop
    select queue_name into v_queue from public.queue_destinations where destination = v_dest and enabled;
    if v_queue is null then continue; end if;
    -- Per customer, per destination sequence. The row lock is held until commit, so sequence order == commit order.
    insert into public.customer_queue_state as s (customer_key, destination, last_enqueued_seq) values (p_customer_key, v_dest, 1)
    on conflict (customer_key, destination) do update set last_enqueued_seq = s.last_enqueued_seq + 1, updated_at = now()
    returning last_enqueued_seq into v_seq;
    v_msg := pgmq.send(v_queue, jsonb_build_object(
      'v', 1, 'eventId', p_event_id, 'originSystem', p_origin, 'contentHash', p_content_hash, 'destination', v_dest,
      'customerKey', p_customer_key, 'seq', v_seq, 'type', p_type, 'fieldKeys', to_jsonb(p_field_keys),
      'caseId', p_case_id, 'requestId', p_request_id, 'enqueuedAt', now()));
    v_sent := v_sent || v_dest;
    insert into public.event_log (event_type, event_id, origin_system, destination, customer_key, seq, msg_id, content_hash, request_id)
    values ('message.enqueued', p_event_id, p_origin, v_dest, p_customer_key, v_seq, v_msg, p_content_hash, p_request_id);
  end loop;

  update public.event_registry set sent_to = v_sent where event_id = p_event_id;
  return jsonb_build_object('status', 'accepted', 'sent_to', to_jsonb(v_sent));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 5. SAVE functions: data write + enqueue in ONE transaction, idempotent.
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.questionnaire_drafts (
  customer_key uuid not null references public.identity_links(internal_customer_id) on delete cascade,
  form_key text not null check (char_length(form_key) between 2 and 60),
  answers jsonb not null default '{}'::jsonb,        -- personal data: RLS mandatory, no client policy, written via the save function
  last_step text,
  completion_pct smallint not null default 0 check (completion_pct between 0 and 100),
  version integer not null default 1,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (customer_key, form_key)
);
comment on table public.questionnaire_drafts is 'Instant questionnaire drafts (operational DB is the source of truth for drafts only).';
alter table public.questionnaire_drafts enable row level security;
revoke all on public.questionnaire_drafts from anon, authenticated;

-- May the caller write for this customer? The customer themself (auth_user_id), an agent/manager, or the service role.
create or replace function public.platform_can_write_customer(p_customer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.role() = 'service_role', false)
      or exists (select 1 from public.identity_links il where il.internal_customer_id = p_customer and il.auth_user_id = (select auth.uid()))
      or public.current_platform_role() in ('agent','manager');   -- TODO(owner): restrict agents to their agency/assigned customers
$$;

create or replace function public.save_questionnaire_step(
  p_idempotency_key text,
  p_customer_key uuid,
  p_form_key text,
  p_answers jsonb,
  p_last_step text,
  p_completion_pct integer,
  p_step_completed boolean default false,
  p_submit boolean default false,
  p_request_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prev jsonb;
  v_event uuid;
  v_key text;
  v_applied text[] := '{}';
  v_res jsonb;
  v_dec text;
begin
  if not public.platform_can_write_customer(p_customer_key) then raise exception 'forbidden' using errcode = '42501'; end if;
  v_prev := public.idempotency_begin('questionnaire.save', p_idempotency_key, p_customer_key);
  if v_prev is not null then return v_prev; end if;

  insert into public.questionnaire_drafts as d (customer_key, form_key, answers, last_step, completion_pct, submitted_at)
  values (p_customer_key, p_form_key, coalesce(p_answers, '{}'), p_last_step, greatest(0, least(100, coalesce(p_completion_pct, 0))), case when p_submit then now() end)
  on conflict (customer_key, form_key) do update
    set answers = d.answers || excluded.answers, last_step = excluded.last_step, completion_pct = excluded.completion_pct,
        version = d.version + 1, submitted_at = coalesce(d.submitted_at, excluded.submitted_at), updated_at = now();

  -- Only COMPLETED steps leave the operational DB. In-progress answers stay a draft (fast save, no core system traffic).
  if p_step_completed or p_submit then
    for v_key in select jsonb_object_keys(coalesce(p_answers, '{}')) loop
      select decision into v_dec from public.apply_field_update('customer', p_customer_key::text, v_key, p_answers -> v_key, 'pre_treatment_questionnaire', now(), 'portal');
      if v_dec like 'apply\_%' then v_applied := v_applied || v_key; end if;
    end loop;
    if cardinality(v_applied) > 0 or p_submit then
      v_event := md5('questionnaire.save:' || p_idempotency_key)::uuid;     -- deterministic: a retried save reuses the event id
      v_res := public.queue_enqueue_event('portal', v_event, public.content_hash_jsonb(p_answers), p_customer_key,
                 case when p_submit then 'questionnaire.submitted' else 'questionnaire.step_completed' end, v_applied, null, p_request_id);
    end if;
  end if;

  v_res := jsonb_build_object('status', 'saved', 'enqueue', coalesce(v_res, jsonb_build_object('status', 'not_needed')));
  perform public.idempotency_finish('questionnaire.save', p_idempotency_key, v_res);
  return v_res;
end;
$$;

-- Lead intake from the public site (via an edge function holding the service role). Creates identity + fields + assignment + event atomically.
create or replace function public.save_lead(
  p_idempotency_key text,
  p_fields jsonb,                       -- field_key -> value; keys must exist in field_ownership
  p_line_of_business text,              -- 'insurance' | 'finance'
  p_national_id text default null,      -- optional; goes only to identity_upsert_verified (never stored or logged in clear)
  p_agency_id uuid default null,
  p_request_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prev jsonb;
  v_customer uuid;
  v_key text;
  v_applied text[] := '{}';
  v_dec text;
  v_res jsonb;
  v_event uuid := md5('lead.create:' || p_idempotency_key)::uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  v_prev := public.idempotency_begin('lead.create', p_idempotency_key, null);
  if v_prev is not null then return v_prev; end if;

  if p_national_id is not null then
    v_customer := public.identity_upsert_verified(p_national_id, 'manual', p_agency_id);   -- TODO(owner): verification channel (otp / agent)
  else
    v_customer := public.identity_create_pending(p_agency_id);
  end if;

  for v_key in select jsonb_object_keys(coalesce(p_fields, '{}')) loop
    select decision into v_dec from public.apply_field_update('customer', v_customer::text, v_key, p_fields -> v_key, 'manual_template', now(), 'portal');
    if v_dec like 'apply\_%' then v_applied := v_applied || v_key; end if;
  end loop;

  perform public.assign_lead(v_customer, p_line_of_business, null, p_agency_id);      -- 08: rules, sticky, round robin, cap
  v_res := public.queue_enqueue_event('portal', v_event, public.content_hash_jsonb(p_fields), v_customer, 'lead.created', v_applied, null, p_request_id);
  v_res := jsonb_build_object('status', 'created', 'customer_key', v_customer, 'enqueue', v_res);
  perform public.idempotency_finish('lead.create', p_idempotency_key, v_res);
  return v_res;
end;
$$;
-- Same pattern for cases (save_case): idempotency_begin -> data write -> queue_enqueue_event -> idempotency_finish.

-- ---------------------------------------------------------------------------------------------------------------
-- 6. Worker RPCs (service role only; pgmq itself is not exposed to the API). All take the destination.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.queue_read_batch(p_destination text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations; r jsonb;
begin
  select * into d from public.queue_destinations where destination = p_destination and enabled;
  if not found then return '[]'::jsonb; end if;
  -- Mandatory: visibility timeout on every read, short batch (<= 20, enforced by the check constraint too).
  select coalesce(jsonb_agg(jsonb_build_object('msg_id', m.msg_id, 'read_ct', m.read_ct, 'enqueued_at', m.enqueued_at, 'message', m.message) order by m.msg_id), '[]'::jsonb)
    into r from pgmq.read(d.queue_name, d.visibility_timeout_sec, least(d.batch_size, 20)) m;
  return r;
end;
$$;

-- Ordering gate. Returns 'process' | 'duplicate' | 'halted' | 'locked' | 'not_ready'. Skips are requeued here (no failure counted).
create or replace function public.queue_claim(p_destination text, p_msg_id bigint, p_customer_key uuid, p_seq bigint, p_worker text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations; st public.customer_queue_state;
begin
  select * into d from public.queue_destinations where destination = p_destination;
  select * into st from public.customer_queue_state where customer_key = p_customer_key and destination = p_destination for update skip locked;
  if not found then
    -- Row locked by another worker (claim/complete in flight) or missing: do not wait, requeue shortly. Blocks only this customer.
    perform pgmq.set_vt(d.queue_name, p_msg_id, d.skip_requeue_sec);
    return case when exists (select 1 from public.customer_queue_state where customer_key = p_customer_key and destination = p_destination) then 'locked' else 'not_ready' end;
  end if;
  if p_seq <= st.last_completed_seq then
    perform pgmq.archive(d.queue_name, p_msg_id);
    insert into public.event_log (event_type, destination, customer_key, seq, msg_id, code) values ('message.duplicate_archived', p_destination, p_customer_key, p_seq, p_msg_id, 'already_completed');
    return 'duplicate';
  end if;
  if st.halted then
    perform pgmq.set_vt(d.queue_name, p_msg_id, d.halted_requeue_sec);
    return 'halted';
  end if;
  if st.lease_until is not null and st.lease_until > now() then
    perform pgmq.set_vt(d.queue_name, p_msg_id, d.skip_requeue_sec);
    return 'locked';
  end if;
  if p_seq <> st.last_completed_seq + 1 then
    perform pgmq.set_vt(d.queue_name, p_msg_id, d.skip_requeue_sec);
    return 'not_ready';
  end if;
  update public.customer_queue_state
     set claimed_by = p_worker, claimed_seq = p_seq, lease_until = now() + make_interval(secs => d.visibility_timeout_sec), updated_at = now()
   where customer_key = p_customer_key and destination = p_destination;
  return 'process';
end;
$$;

create or replace function public.queue_complete(p_destination text, p_msg_id bigint, p_customer_key uuid, p_seq bigint, p_worker text, p_event_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations; n integer;
begin
  select * into d from public.queue_destinations where destination = p_destination;
  update public.customer_queue_state
     set last_completed_seq = p_seq, failure_count = 0, claimed_by = null, claimed_seq = null, lease_until = null, updated_at = now()
   where customer_key = p_customer_key and destination = p_destination and last_completed_seq = p_seq - 1 and claimed_by = p_worker;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'ordering_violation_or_lease_lost' using errcode = '40001'; end if;
  perform pgmq.archive(d.queue_name, p_msg_id);       -- archive on success (kept for audit; purge per retention in 09)
  insert into public.event_log (event_type, event_id, destination, customer_key, seq, msg_id) values ('message.completed', p_event_id, p_destination, p_customer_key, p_seq, p_msg_id);
end;
$$;

create or replace function public.queue_record_failure(p_destination text, p_customer_key uuid, p_seq bigint, p_msg_id bigint, p_event_id uuid, p_code text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  update public.customer_queue_state set failure_count = failure_count + 1, updated_at = now()
   where customer_key = p_customer_key and destination = p_destination returning failure_count into v_count;
  insert into public.event_log (event_type, event_id, destination, customer_key, seq, msg_id, attempt, code) values ('message.failed', p_event_id, p_destination, p_customer_key, p_seq, p_msg_id, v_count, left(p_code, 60));
  return coalesce(v_count, 1);
end;
$$;

-- Graduated retry: release the lease (only THIS customer waits) and hide the message for the delay.
create or replace function public.queue_schedule_retry(p_destination text, p_msg_id bigint, p_customer_key uuid, p_delay_sec integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations;
begin
  select * into d from public.queue_destinations where destination = p_destination;
  update public.customer_queue_state set claimed_by = null, claimed_seq = null, lease_until = null, updated_at = now() where customer_key = p_customer_key and destination = p_destination;
  perform pgmq.set_vt(d.queue_name, p_msg_id, greatest(1, least(p_delay_sec, 86400)));
end;
$$;

-- Return a message untouched (worker out of time budget).
create or replace function public.queue_release(p_destination text, p_msg_id bigint, p_delay_sec integer default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations;
begin
  select * into d from public.queue_destinations where destination = p_destination;
  perform pgmq.set_vt(d.queue_name, p_msg_id, greatest(0, p_delay_sec));
end;
$$;

-- Move to the dead-letter queue, halt only this customer on this destination, write the audit row (09 raises the alert from it).
create or replace function public.queue_dead_letter(p_destination text, p_msg_id bigint, p_customer_key uuid, p_seq bigint, p_message jsonb, p_reason text, p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations;
begin
  select * into d from public.queue_destinations where destination = p_destination;
  perform pgmq.send(d.dlq_name, coalesce(p_message, '{}'::jsonb) || jsonb_build_object('dlq', jsonb_build_object('reason', left(p_reason, 60), 'code', left(p_code, 60), 'at', now(), 'msgId', p_msg_id)));
  perform pgmq.archive(d.queue_name, p_msg_id);
  update public.customer_queue_state set halted = true, halted_seq = p_seq, claimed_by = null, claimed_seq = null, lease_until = null, updated_at = now()
   where customer_key = p_customer_key and destination = p_destination;
  insert into public.event_log (event_type, event_id, destination, customer_key, seq, msg_id, code, meta)
  values ('message.dead_lettered', nullif(p_message ->> 'eventId', '')::uuid, p_destination, p_customer_key, p_seq, p_msg_id, left(p_code, 60), jsonb_build_object('reason', left(p_reason, 60)));
end;
$$;

-- Ops resolution of a halted customer. 'skip' = treat the dead message as handled; 'replay' = put the dead message back in the live queue.
create or replace function public.queue_resolve_halt(p_destination text, p_customer_key uuid, p_action text, p_dlq_msg_id bigint default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations; st public.customer_queue_state; v_msg jsonb;
begin
  select * into d from public.queue_destinations where destination = p_destination;
  select * into st from public.customer_queue_state where customer_key = p_customer_key and destination = p_destination for update;
  if not found or not st.halted then return 'not_halted'; end if;
  if p_action = 'skip' then
    update public.customer_queue_state set last_completed_seq = st.halted_seq, halted = false, halted_seq = null, failure_count = 0, updated_at = now() where customer_key = p_customer_key and destination = p_destination;
  elsif p_action = 'replay' then
    execute format('select message from pgmq.%I where msg_id = $1', 'q_' || d.dlq_name) into v_msg using p_dlq_msg_id;
    if v_msg is null then return 'dlq_message_not_found'; end if;
    perform pgmq.send(d.queue_name, v_msg - 'dlq');
    perform pgmq.archive(d.dlq_name, p_dlq_msg_id);
    update public.customer_queue_state set halted = false, halted_seq = null, failure_count = 0, updated_at = now() where customer_key = p_customer_key and destination = p_destination;
  else
    raise exception 'bad_action';
  end if;
  insert into public.event_log (event_type, destination, customer_key, seq, code) values ('queue.halt_resolved', p_destination, p_customer_key, st.halted_seq, p_action);
  return 'ok';
end;
$$;

-- Execute rights: service role only. Save functions are the only client-reachable entry points.
do $$
declare f text;
begin
  foreach f in array array[
    'identity_hash_national_id(text)', 'identity_upsert_verified(text,text,uuid,uuid)', 'identity_create_pending(uuid)',
    'identity_set_external_id(uuid,text,text)', 'identity_get_external_ids(uuid)', 'queue_policy(text)',
    'idempotency_begin(text,text,uuid)', 'idempotency_finish(text,text,jsonb)',
    'queue_enqueue_event(text,uuid,text,uuid,text,text[],text,text)', 'save_lead(text,jsonb,text,text,uuid,text)',
    'queue_read_batch(text)', 'queue_claim(text,bigint,uuid,bigint,text)', 'queue_complete(text,bigint,uuid,bigint,text,uuid)',
    'queue_record_failure(text,uuid,bigint,bigint,uuid,text)', 'queue_schedule_retry(text,bigint,uuid,integer)',
    'queue_release(text,bigint,integer)', 'queue_dead_letter(text,bigint,uuid,bigint,jsonb,text,text)', 'queue_resolve_halt(text,uuid,text,bigint)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
-- save_questionnaire_step: callable by the logged-in customer or an agent (it checks platform_can_write_customer itself).
revoke execute on function public.save_questionnaire_step(text,uuid,text,jsonb,text,integer,boolean,boolean,text) from public, anon;
grant execute on function public.save_questionnaire_step(text,uuid,text,jsonb,text,integer,boolean,boolean,text) to authenticated, service_role;
