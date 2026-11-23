-- V3-03: client forms (owner request 2026-11-23: "מקום ייעודי שנוכל להפנות לקוחות למילוי שאלונים ... אחד אחרי השנייה, עם
-- תוצאה אחורית בדשבורד"). One client session (identity once, Turnstile, rate limits like the POA wizard) under which the
-- questionnaires of src/questionnaires run one after another; every step and every final submission is stored here
-- (answers encrypted), documents go to the private client-docs bucket as crm.documents rows, staff read through logging RPCs.
--   crm.form_sessions      one row per client session (token = sha256 only; identity encrypted; hmac + phone tail indexable)
--   crm.form_submissions   one row per (session, questionnaire): draft -> submitted -> reviewed; answers_enc, derived (no PII)
--   crm.documents          + form_session_id (a client upload: kind id_copy | payslip | statement | other; path forms/...)
--   api.form_*             service_role RPCs for the forms-intake function
--   staff.form_submission_list / _get / _set_status   the staff tab (admin, fresh TOTP, access log)
-- Switches (ops.config; a missing key reads closed): forms_enabled (master, default off), forms_health_enabled (store the
-- health answers; off = only the derived screening result is kept and the health questionnaire stays in the browser),
-- forms_turnstile_required (default true). Identity values live only in *_enc columns. Audit rows carry ids and codes.
-- Error codes: PT400 invalid_input:<field>, PT423 feature_disabled:<key>, PT429 rate_limited, PT401 session_inactive,
-- PT403 session_locked, PT409 stale_draft / already_submitted, PT410 session_expired, PT404 not_found.
-- Retention: nothing here deletes anything (no-delete rule); the purge of old sessions is an owner decision (CLIENT-FORMS.md).

insert into ops.config (key, value) values
  ('forms_enabled', 'false'), ('forms_health_enabled', 'false'), ('forms_turnstile_required', 'true')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- tables (crm)
create table crm.form_sessions (
  id                uuid primary key default gen_random_uuid(),
  agency_id         uuid not null references core.agencies (id),
  token_hash        bytea not null unique check (octet_length(token_hash) = 32),
  status            text not null default 'open' check (status in ('open', 'expired', 'locked')),
  national_id_hmac  bytea not null check (octet_length(national_id_hmac) = 32),
  phone_hmac        bytea not null check (octet_length(phone_hmac) = 32),
  phone_tail        text not null check (phone_tail ~ '^[0-9]{2}$'),
  identity_enc      bytea not null,
  ua_hash           bytea check (ua_hash is null or octet_length(ua_hash) = 32),
  last_error        text check (last_error is null or last_error ~ '^[a-z0-9_.:-]{1,80}$'),
  started_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now()
);
comment on table crm.form_sessions is 'Client forms sessions (/forms). PII only in identity_enc; token stored as sha256. No API role has any privilege.';
create index form_sessions_national_id_idx on crm.form_sessions (national_id_hmac);
create index form_sessions_phone_idx on crm.form_sessions (phone_hmac);
create index form_sessions_agency_idx on crm.form_sessions (agency_id, created_at desc);

create table crm.form_submissions (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references crm.form_sessions (id),
  agency_id         uuid not null references core.agencies (id),
  card_key          text not null check (card_key ~ '^[a-z][a-z0-9-]{1,40}$'),
  questionnaire_key text not null check (questionnaire_key ~ '^[a-z][a-z0-9-]{1,40}$'),
  version           integer not null check (version > 0),
  status            text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  answers_enc       bytea,
  answers_stored    boolean not null default true,
  derived           jsonb not null default '{}'::jsonb check (jsonb_typeof(derived) = 'object' and octet_length(derived::text) <= 4000),
  step_key          text check (step_key is null or char_length(step_key) <= 80),
  draft_version     integer not null default 0,
  completion_pct    integer not null default 0 check (completion_pct between 0 and 100),
  signer_enc        bytea,
  signed_at         timestamptz,
  submitted_at      timestamptz,
  reviewed_at       timestamptz,
  reviewed_by       uuid,
  review_note_enc   bytea,
  pdf_document_id   uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (session_id, questionnaire_key)
);
comment on table crm.form_submissions is 'One row per (client session, questionnaire). answers_enc holds the answers (jsonb, encrypted); derived holds non-personal results (health screening status, risk level). The PDF is rendered by the browser; pdf_document_id is filled when a server render exists.';
create index form_submissions_agency_idx on crm.form_submissions (agency_id, status, updated_at desc);
create index form_submissions_session_idx on crm.form_submissions (session_id);

-- crm.documents: a client upload belongs to a forms session (exactly one of the two session columns), its own kinds and path prefix
alter table crm.documents
  add column form_session_id uuid references crm.form_sessions (id),
  add column size_bytes integer check (size_bytes is null or size_bytes between 1 and 20000000),
  alter column session_id drop not null,
  drop constraint documents_kind_check,
  drop constraint documents_source_check,
  drop constraint documents_storage_path_check,
  add constraint documents_kind_check check (kind in ('maslaka', 'harbit', 'policies', 'id_copy', 'payslip', 'statement', 'other')),
  add constraint documents_source_check check (source in ('surense', 'native', 'native_shadow', 'client')),
  add constraint documents_storage_path_check check (storage_path is null
    or storage_path ~ '^poa/[0-9a-f-]{36}/[0-9a-f-]{36}/(maslaka|harbit|policies)-[0-9a-f-]{36}\.pdf$'
    or storage_path ~ '^forms/[0-9a-f-]{36}/[0-9a-f-]{36}/(id_copy|payslip|statement|other)-[0-9a-f-]{36}\.(pdf|jpg|jpeg|png|heic)$'),
  add constraint documents_one_session_check check ((session_id is not null and form_session_id is null) or (session_id is null and form_session_id is not null));
create index documents_form_session_idx on crm.documents (form_session_id) where form_session_id is not null;

alter table crm.form_sessions enable row level security;
alter table crm.form_submissions enable row level security;
revoke all on crm.form_sessions, crm.form_submissions from anon, authenticated, service_role;
create policy deny_api_roles on crm.form_sessions for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.form_submissions for all to anon, authenticated using (false) with check (false);
create trigger form_sessions_audit after insert or update or delete on crm.form_sessions
  for each row execute function audit.log_change('no_values');
create trigger form_submissions_audit after insert or update or delete on crm.form_submissions
  for each row execute function audit.log_change('no_values');

-- ---------------------------------------------------------------- private helpers
-- locks the session row and refuses anything but a live, open session; a session past its expiry is flipped to 'expired'
create or replace function private.form_open_session(p_id uuid)
returns crm.form_sessions language plpgsql volatile security definer set search_path = '' as $$
declare s crm.form_sessions;
begin
  if p_id is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  select * into s from crm.form_sessions where id = p_id for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'locked' then raise exception 'session_locked' using errcode = 'PT403'; end if;
  if s.status = 'expired' or s.expires_at <= now() then
    update crm.form_sessions set status = 'expired' where id = s.id and status <> 'expired';
    raise exception 'session_expired' using errcode = 'PT410';
  end if;
  return s;
end $$;

create or replace function private.form_key_ok(p_key text)
returns boolean language sql immutable set search_path = '' as $$
  select p_key is not null and p_key ~ '^[a-z][a-z0-9-]{1,40}$'
$$;

-- the health answers are stored only while forms_health_enabled is on; everything else is always stored
create or replace function private.form_store_answers(p_questionnaire text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_questionnaire <> 'health' or private.flag('forms_health_enabled')
$$;

-- ---------------------------------------------------------------- api: switches
create or replace function api.form_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'forms_enabled', private.flag('forms_enabled'),
    'health_enabled', private.flag('forms_health_enabled'),
    'turnstile_required', coalesce((select c.value from ops.config c where c.key = 'forms_turnstile_required'), 'true') <> 'false')
$$;

-- ---------------------------------------------------------------- api: session lifecycle
-- p_identity: {first_name, last_name, email|null}; p_national_id: 9 digits; p_phone: +9725XXXXXXXX. The daily cap trips the switch
-- and RETURNS {"ok": false, "error": "rate_limited"} (a raise would roll the switch-off back), like api.poa_session_start.
create or replace function api.form_session_start(p_token_hash bytea, p_identity jsonb, p_national_id text, p_phone text, p_ua_hash bytea, p_ip text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_agency uuid := coalesce((select c.value::uuid from ops.config c where c.key = 'default_agency_id'), '5eed0000-0000-4000-8000-000000000001'::uuid);
  v_first text; v_last text; v_email text; v_hmac bytea; v_phone_hmac bytea; v_ip text; v_id uuid; v_exp timestamptz;
begin
  perform private.kill_switch('forms_enabled');
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  if p_ua_hash is not null and octet_length(p_ua_hash) <> 32 then raise exception 'invalid_input:ua_hash' using errcode = 'PT400'; end if;
  if p_identity is null or jsonb_typeof(p_identity) <> 'object' or octet_length(p_identity::text) > 2000 then
    raise exception 'invalid_input:identity' using errcode = 'PT400';
  end if;
  v_first := btrim(coalesce(p_identity ->> 'first_name', ''));
  v_last := btrim(coalesce(p_identity ->> 'last_name', ''));
  v_email := nullif(btrim(coalesce(p_identity ->> 'email', '')), '');
  if char_length(v_first) not between 1 and 80 then raise exception 'invalid_input:first_name' using errcode = 'PT400'; end if;
  if char_length(v_last) not between 1 and 80 then raise exception 'invalid_input:last_name' using errcode = 'PT400'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') then
    raise exception 'invalid_input:email' using errcode = 'PT400';
  end if;
  if p_national_id is null or p_national_id !~ '^[0-9]{9}$' then raise exception 'invalid_input:national_id' using errcode = 'PT400'; end if;
  if p_phone is null or p_phone !~ '^\+9725[0-9]{8}$' then raise exception 'invalid_input:phone' using errcode = 'PT400'; end if;
  v_ip := private.caller_ip(p_ip);
  v_hmac := private.national_id_hmac(p_national_id);
  v_phone_hmac := private.phone_hmac(p_phone);

  if not private.check_rate_limit('forms_ip', v_ip, 20, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('forms_start', encode(v_hmac, 'hex'), 10, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('forms_all', 'hour', 60, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('forms_all_day', 'day', 300, interval '1 day') then
    update ops.config set value = 'false', updated_at = now() where key = 'forms_enabled';
    perform ops.raise_alert('critical', 'forms_daily_cap', 'forms_enabled switched off: more than 300 new sessions in one day', 'forms_daily_cap', interval '1 day');
    perform private.audit_action('ops.config', 'forms_enabled', array['value'], jsonb_build_object('action', 'forms_daily_cap_trip'));
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_exp := now() + interval '14 days';
  insert into crm.form_sessions (agency_id, token_hash, national_id_hmac, phone_hmac, phone_tail, identity_enc, ua_hash, expires_at)
  values (v_agency, p_token_hash, v_hmac, v_phone_hmac, right(p_phone, 2),
          private.pii_encrypt(jsonb_build_object('first_name', v_first, 'last_name', v_last, 'email', v_email, 'national_id', p_national_id,
                                                 'phone', p_phone, 'ip', v_ip)::text),
          p_ua_hash, v_exp)
  returning id into v_id;
  perform private.audit_action('crm.form_sessions', v_id::text, '{}', jsonb_build_object('action', 'form_session_start'));
  return jsonb_build_object('ok', true, 'session_id', v_id, 'expires_at', v_exp);
end $$;

-- the state of a session for the browser: the submissions (a draft carries its saved answers so the client resumes; a submitted
-- questionnaire carries no answers) and the uploaded documents (ids and kinds). Touches last_seen_at.
create or replace function api.form_session_get(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.form_sessions; v_subs jsonb; v_docs jsonb;
begin
  perform private.kill_switch('forms_enabled');
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('forms_state', encode(p_token_hash, 'hex'), 240, interval '1 minute') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  select * into s from crm.form_sessions where token_hash = p_token_hash for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'open' and s.expires_at <= now() then
    update crm.form_sessions set status = 'expired' where id = s.id;
    s.status := 'expired';
  elsif s.status = 'open' then
    update crm.form_sessions set last_seen_at = now() where id = s.id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'card_key', f.card_key, 'questionnaire_key', f.questionnaire_key, 'version', f.version, 'status', f.status,
           'step_key', f.step_key, 'draft_version', f.draft_version, 'completion_pct', f.completion_pct, 'submitted_at', f.submitted_at,
           'answers_stored', f.answers_stored, 'derived', f.derived,
           'answers', case when f.status = 'draft' and f.answers_enc is not null then private.pii_decrypt(f.answers_enc)::jsonb end)
           order by f.created_at), '[]'::jsonb)
    into v_subs from crm.form_submissions f where f.session_id = s.id;
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'created_at', d.created_at, 'stored', d.storage_path is not null) order by d.created_at), '[]'::jsonb)
    into v_docs from crm.documents d where d.form_session_id = s.id and d.status <> 'revoked';
  return jsonb_build_object('session_id', s.id, 'status', s.status, 'expires_at', s.expires_at, 'submissions', v_subs, 'documents', v_docs);
end $$;

-- a step save: upsert the draft of one questionnaire. p_draft_version is the version the browser last saw (0 for a new draft);
-- a stale one is refused (PT409 stale_draft) so another device never overwrites newer answers. A submitted questionnaire is closed.
create or replace function api.form_step_save(p_session uuid, p_card text, p_questionnaire text, p_version integer, p_step_key text,
                                              p_answers jsonb, p_derived jsonb, p_draft_version integer, p_completion integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.form_sessions; f crm.form_submissions; v_store boolean; v_derived jsonb := coalesce(p_derived, '{}'::jsonb); v_ver integer;
begin
  perform private.kill_switch('forms_enabled');
  s := private.form_open_session(p_session);
  if not private.form_key_ok(p_card) then raise exception 'invalid_input:card' using errcode = 'PT400'; end if;
  if not private.form_key_ok(p_questionnaire) then raise exception 'invalid_input:questionnaire' using errcode = 'PT400'; end if;
  if p_version is null or p_version < 1 then raise exception 'invalid_input:version' using errcode = 'PT400'; end if;
  if p_step_key is not null and char_length(p_step_key) > 80 then raise exception 'invalid_input:step_key' using errcode = 'PT400'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or octet_length(p_answers::text) > 200000 then
    raise exception 'invalid_input:answers' using errcode = 'PT400';
  end if;
  if jsonb_typeof(v_derived) <> 'object' or octet_length(v_derived::text) > 4000 then raise exception 'invalid_input:derived' using errcode = 'PT400'; end if;
  if p_draft_version is null or p_draft_version < 0 then raise exception 'invalid_input:draft_version' using errcode = 'PT400'; end if;
  if p_completion is null or p_completion not between 0 and 100 then raise exception 'invalid_input:completion' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('forms_step', s.id::text, 600, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  v_store := private.form_store_answers(p_questionnaire);

  select * into f from crm.form_submissions where session_id = s.id and questionnaire_key = p_questionnaire for update;
  if found then
    if f.status <> 'draft' then raise exception 'already_submitted' using errcode = 'PT409'; end if;
    if f.draft_version <> p_draft_version then raise exception 'stale_draft' using errcode = 'PT409'; end if;
    v_ver := f.draft_version + 1;
    update crm.form_submissions
       set answers_enc = case when v_store then private.pii_encrypt(p_answers::text) else null end, answers_stored = v_store,
           derived = v_derived, step_key = p_step_key, draft_version = v_ver, completion_pct = p_completion, version = p_version,
           card_key = p_card, updated_at = now()
     where id = f.id;
  else
    if p_draft_version <> 0 then raise exception 'stale_draft' using errcode = 'PT409'; end if;
    v_ver := 1;
    insert into crm.form_submissions (session_id, agency_id, card_key, questionnaire_key, version, status, answers_enc, answers_stored, derived,
                                      step_key, draft_version, completion_pct)
    values (s.id, s.agency_id, p_card, p_questionnaire, p_version, 'draft', case when v_store then private.pii_encrypt(p_answers::text) end, v_store,
            v_derived, p_step_key, v_ver, p_completion)
    returning * into f;
  end if;
  update crm.form_sessions set last_seen_at = now() where id = s.id;
  return jsonb_build_object('ok', true, 'submission_id', f.id, 'draft_version', v_ver, 'answers_stored', v_store);
end $$;

-- the final submission of one questionnaire: the full answers, the derived values and the signer evidence (name, masked id, the
-- signature PNG or the typed name, the hash the browser computed; all encrypted together) with the client ip. Idempotent: a second
-- submit of a submitted questionnaire answers with the recorded time and changes nothing.
create or replace function api.form_submit(p_session uuid, p_card text, p_questionnaire text, p_version integer, p_answers jsonb, p_derived jsonb,
                                           p_signer jsonb, p_ip text, p_user_agent text, p_completion integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.form_sessions; f crm.form_submissions; v_store boolean; v_derived jsonb := coalesce(p_derived, '{}'::jsonb); v_ip text; v_at timestamptz;
        v_ua text := nullif(left(btrim(coalesce(p_user_agent, '')), 300), ''); v_signer jsonb;
begin
  perform private.kill_switch('forms_enabled');
  s := private.form_open_session(p_session);
  if not private.form_key_ok(p_card) then raise exception 'invalid_input:card' using errcode = 'PT400'; end if;
  if not private.form_key_ok(p_questionnaire) then raise exception 'invalid_input:questionnaire' using errcode = 'PT400'; end if;
  if p_version is null or p_version < 1 then raise exception 'invalid_input:version' using errcode = 'PT400'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or octet_length(p_answers::text) > 200000 then
    raise exception 'invalid_input:answers' using errcode = 'PT400';
  end if;
  if jsonb_typeof(v_derived) <> 'object' or octet_length(v_derived::text) > 4000 then raise exception 'invalid_input:derived' using errcode = 'PT400'; end if;
  if p_signer is null or jsonb_typeof(p_signer) <> 'object' or octet_length(p_signer::text) > 400000 then
    raise exception 'invalid_input:signer' using errcode = 'PT400';
  end if;
  if coalesce(p_signer ->> 'hash', '') !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:signer_hash' using errcode = 'PT400'; end if;
  if char_length(btrim(coalesce(p_signer ->> 'name', ''))) not between 2 and 80 then raise exception 'invalid_input:signer_name' using errcode = 'PT400'; end if;
  if coalesce(p_signer ->> 'kind', '') not in ('drawn', 'typed') then raise exception 'invalid_input:signer_kind' using errcode = 'PT400'; end if;
  if (p_signer ->> 'kind') = 'drawn' and coalesce(p_signer ->> 'png', '') !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' then
    raise exception 'invalid_input:signature' using errcode = 'PT400';
  end if;
  if p_completion is null or p_completion not between 0 and 100 then raise exception 'invalid_input:completion' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('forms_submit', s.id::text, 30, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  v_ip := private.caller_ip(p_ip);
  v_store := private.form_store_answers(p_questionnaire);

  select * into f from crm.form_submissions where session_id = s.id and questionnaire_key = p_questionnaire for update;
  if found and f.status <> 'draft' then
    return jsonb_build_object('ok', true, 'submission_id', f.id, 'submitted_at', f.submitted_at, 'answers_stored', f.answers_stored, 'duplicate', true);
  end if;
  v_at := now();
  v_signer := p_signer || jsonb_build_object('ip', v_ip, 'user_agent', v_ua);
  if found then
    update crm.form_submissions
       set answers_enc = case when v_store then private.pii_encrypt(p_answers::text) else null end, answers_stored = v_store,
           derived = v_derived, status = 'submitted', step_key = null, completion_pct = p_completion, version = p_version, card_key = p_card,
           signer_enc = private.pii_encrypt(v_signer::text), signed_at = v_at, submitted_at = v_at, updated_at = v_at
     where id = f.id;
  else
    insert into crm.form_submissions (session_id, agency_id, card_key, questionnaire_key, version, status, answers_enc, answers_stored, derived,
                                      completion_pct, signer_enc, signed_at, submitted_at)
    values (s.id, s.agency_id, p_card, p_questionnaire, p_version, 'submitted', case when v_store then private.pii_encrypt(p_answers::text) end, v_store,
            v_derived, p_completion, private.pii_encrypt(v_signer::text), v_at, v_at)
    returning * into f;
  end if;
  update crm.form_sessions set last_seen_at = v_at where id = s.id;
  perform private.audit_action('crm.form_submissions', f.id::text, array['status'],
    jsonb_build_object('action', 'form_submit', 'questionnaire', p_questionnaire, 'card', p_card, 'answers_stored', v_store, 'signer_kind', p_signer ->> 'kind'));
  return jsonb_build_object('ok', true, 'submission_id', f.id, 'submitted_at', v_at, 'answers_stored', v_store, 'duplicate', false);
end $$;

-- a code only (<= 80 chars). 'locked' also closes the session.
create or replace function api.form_session_fail(p_session uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.form_sessions;
begin
  perform private.kill_switch('forms_enabled');
  if p_code is null or p_code !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  select * into s from crm.form_sessions where id = p_session for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  update crm.form_sessions set last_error = p_code, status = case when p_code = 'locked' then 'locked' else status end where id = s.id;
  perform private.audit_action('crm.form_sessions', s.id::text, array['last_error'], jsonb_build_object('action', 'form_session_fail', 'code', p_code));
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------- api: client documents (two steps: row first, bytes stored, then marked)
-- The row names the path the function must write to (forms/{agency}/{session}/{kind}-{document}.{ext}); the file name the client
-- chose is never part of it. At most 12 documents per session.
create or replace function api.form_document_add(p_session uuid, p_kind text, p_sha256 text, p_ext text, p_bytes integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.form_sessions; v_id uuid; v_path text; v_n integer;
begin
  perform private.kill_switch('forms_enabled');
  s := private.form_open_session(p_session);
  if p_kind is null or p_kind not in ('id_copy', 'payslip', 'statement', 'other') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  if p_ext is null or p_ext not in ('pdf', 'jpg', 'jpeg', 'png', 'heic') then raise exception 'invalid_input:ext' using errcode = 'PT400'; end if;
  if p_bytes is null or p_bytes not between 1 and 20000000 then raise exception 'invalid_input:bytes' using errcode = 'PT400'; end if;
  select count(*) into v_n from crm.documents d where d.form_session_id = s.id and d.status <> 'revoked';
  if v_n >= 12 then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  v_id := gen_random_uuid();
  v_path := 'forms/' || s.agency_id || '/' || s.id || '/' || p_kind || '-' || v_id || '.' || p_ext;
  insert into crm.documents (id, form_session_id, kind, source, status, sha256, size_bytes)
  values (v_id, s.id, p_kind, 'client', 'pending_staff_verification', decode(p_sha256, 'hex'), p_bytes);
  perform private.audit_action('crm.documents', v_id::text, '{}', jsonb_build_object('action', 'form_document_add', 'kind', p_kind, 'bytes', p_bytes));
  return jsonb_build_object('ok', true, 'document_id', v_id, 'storage_path', v_path);
end $$;

create or replace function api.form_document_stored(p_document uuid, p_path text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r record;
begin
  perform private.kill_switch('forms_enabled');
  if p_document is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  select d.id, d.kind, d.form_session_id, s.agency_id into r from crm.documents d join crm.form_sessions s on s.id = d.form_session_id where d.id = p_document for update of d;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  if p_path is null or p_path !~ ('^forms/' || r.agency_id || '/' || r.form_session_id || '/' || r.kind || '-' || r.id || '\.(pdf|jpg|jpeg|png|heic)$') then
    raise exception 'invalid_input:path' using errcode = 'PT400';
  end if;
  update crm.documents set storage_path = p_path, stored_at = now() where id = r.id;
  perform private.audit_action('crm.documents', r.id::text, array['storage_path'], jsonb_build_object('action', 'form_document_stored', 'kind', r.kind));
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------- staff (admin, fresh TOTP, access log)
-- the list: one row per submission of the caller's agency; names and masked id through the logged decrypt; no answers here
create or replace function staff.form_submission_list(p_limit integer default 50, p_offset integer default 0, p_card text default null, p_status text default null)
returns table (id uuid, session_id uuid, card_key text, questionnaire_key text, version integer, status text, completion_pct integer, answers_stored boolean,
               derived jsonb, first_name text, last_name text, id_masked text, phone_tail text, created_at timestamptz, updated_at timestamptz,
               submitted_at timestamptz, reviewed_at timestamptz, documents jsonb, session_status text)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare v_actor uuid := private.assert_admin_fresh(); v_agency uuid := private.my_agency_id(); v_ids uuid[];
begin
  if p_card is not null and not private.form_key_ok(p_card) then raise exception 'invalid_input:card' using errcode = 'PT400'; end if;
  if p_status is not null and p_status not in ('draft', 'submitted', 'reviewed') then raise exception 'invalid_input:status' using errcode = 'PT400'; end if;
  select coalesce(array_agg(x.id order by x.updated_at desc, x.id), '{}') into v_ids
    from (select f.id, f.updated_at from crm.form_submissions f
           where f.agency_id = v_agency and (p_card is null or f.card_key = p_card) and (p_status is null or f.status = p_status)
           order by f.updated_at desc, f.id
           limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) x;
  perform private.log_access('form_submission_list', 'crm.form_submissions', v_ids);
  return query
    select f.id, f.session_id, f.card_key, f.questionnaire_key, f.version, f.status, f.completion_pct, f.answers_stored, f.derived,
           i.j ->> 'first_name', i.j ->> 'last_name', '*****' || right(i.j ->> 'national_id', 4), s.phone_tail,
           f.created_at, f.updated_at, f.submitted_at, f.reviewed_at,
           coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'status', d.status, 'stored', d.storage_path is not null) order by d.created_at)
                       from crm.documents d where d.form_session_id = s.id and d.status <> 'revoked'), '[]'::jsonb),
           s.status
      from crm.form_submissions f join crm.form_sessions s on s.id = f.session_id
      cross join lateral (select private.pii_decrypt(s.identity_enc)::jsonb as j) i
     where f.id = any (v_ids)
     order by f.updated_at desc, f.id;
end $$;

-- one submission in full: the answers (decrypted for this logged read), the identity, the signer evidence without the ip
create or replace function staff.form_submission_get(p_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); f crm.form_submissions; s crm.form_sessions; v_ident jsonb; v_signer jsonb;
begin
  if p_id is null then raise exception 'invalid_input:id' using errcode = 'PT400'; end if;
  select * into f from crm.form_submissions where id = p_id and agency_id = private.my_agency_id();
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  select * into s from crm.form_sessions where id = f.session_id;
  perform private.log_access('form_submission_get', 'crm.form_submissions', array[f.id]);
  v_ident := private.pii_decrypt(s.identity_enc)::jsonb;
  v_signer := case when f.signer_enc is not null then private.pii_decrypt(f.signer_enc)::jsonb - 'ip' - 'user_agent' end;
  return jsonb_build_object(
    'id', f.id, 'session_id', f.session_id, 'card_key', f.card_key, 'questionnaire_key', f.questionnaire_key, 'version', f.version,
    'status', f.status, 'completion_pct', f.completion_pct, 'answers_stored', f.answers_stored, 'derived', f.derived,
    'answers', case when f.answers_enc is not null then private.pii_decrypt(f.answers_enc)::jsonb else '{}'::jsonb end,
    'signer', v_signer, 'signed_at', f.signed_at, 'submitted_at', f.submitted_at, 'reviewed_at', f.reviewed_at,
    'review_note', case when f.review_note_enc is not null then private.pii_decrypt(f.review_note_enc) end,
    'identity', jsonb_build_object('first_name', v_ident ->> 'first_name', 'last_name', v_ident ->> 'last_name',
                                   'id_masked', '*****' || right(v_ident ->> 'national_id', 4), 'phone', v_ident ->> 'phone', 'email', v_ident ->> 'email'),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'status', d.status, 'stored', d.storage_path is not null, 'created_at', d.created_at) order by d.created_at)
                             from crm.documents d where d.form_session_id = s.id and d.status <> 'revoked'), '[]'::jsonb));
end $$;

-- "סומן כטופל" / back to submitted; the note is encrypted
create or replace function staff.form_submission_set_status(p_id uuid, p_status text, p_note text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), ''); f crm.form_submissions;
begin
  if p_id is null then raise exception 'invalid_input:id' using errcode = 'PT400'; end if;
  if p_status is null or p_status not in ('submitted', 'reviewed') then raise exception 'invalid_input:status' using errcode = 'PT400'; end if;
  select * into f from crm.form_submissions where id = p_id and agency_id = private.my_agency_id() for update;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  if f.status = 'draft' then raise exception 'invalid_input:status' using errcode = 'PT400'; end if;
  update crm.form_submissions
     set status = p_status, reviewed_at = case when p_status = 'reviewed' then now() else null end,
         reviewed_by = case when p_status = 'reviewed' then v_actor else null end,
         review_note_enc = case when v_note is not null then private.pii_encrypt(v_note) else review_note_enc end, updated_at = now()
   where id = f.id;
  perform private.audit_action('crm.form_submissions', f.id::text, array['status'], jsonb_build_object('action', 'form_submission_set_status', 'status', p_status));
  return jsonb_build_object('ok', true);
end $$;

-- staff.client_doc_get: a client upload (forms session) is served like a POA document of the caller's agency
create or replace function staff.client_doc_get(p_document_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); r record;
begin
  if not private.is_fresh_mfa(coalesce((select c.value from ops.config c where c.key = 'stepup_max_age_sec'), '900')::int) then
    raise exception 'forbidden:fresh_totp' using errcode = 'PT403';
  end if;
  if p_document_id is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  select d.id, d.storage_path, encode(d.sha256, 'hex') as sha256 into r
    from crm.documents d
    left join crm.poa_sessions s on s.id = d.session_id
    left join crm.form_sessions fs on fs.id = d.form_session_id
   where d.id = p_document_id and coalesce(s.agency_id, fs.agency_id) = private.my_agency_id() and d.status <> 'revoked' and d.storage_path is not null;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.log_access('client_doc_get', 'crm.documents', array[r.id]);
  return jsonb_build_object('storage_path', r.storage_path, 'sha256', r.sha256);
end $$;

-- ---------------------------------------------------------------- privileges
revoke all on function private.form_open_session(uuid), private.form_key_ok(text), private.form_store_answers(text) from public, anon, authenticated, service_role;
revoke all on function api.form_config(), api.form_session_start(bytea, jsonb, text, text, bytea, text), api.form_session_get(bytea),
  api.form_step_save(uuid, text, text, integer, text, jsonb, jsonb, integer, integer),
  api.form_submit(uuid, text, text, integer, jsonb, jsonb, jsonb, text, text, integer), api.form_session_fail(uuid, text),
  api.form_document_add(uuid, text, text, text, integer), api.form_document_stored(uuid, text)
  from public, anon, authenticated;
grant execute on function api.form_config(), api.form_session_start(bytea, jsonb, text, text, bytea, text), api.form_session_get(bytea),
  api.form_step_save(uuid, text, text, integer, text, jsonb, jsonb, integer, integer),
  api.form_submit(uuid, text, text, integer, jsonb, jsonb, jsonb, text, text, integer), api.form_session_fail(uuid, text),
  api.form_document_add(uuid, text, text, text, integer), api.form_document_stored(uuid, text)
  to service_role;
revoke all on function staff.form_submission_list(integer, integer, text, text), staff.form_submission_get(uuid), staff.form_submission_set_status(uuid, text, text),
  staff.client_doc_get(uuid) from public, anon;
grant execute on function staff.form_submission_list(integer, integer, text, text), staff.form_submission_get(uuid), staff.form_submission_set_status(uuid, text, text),
  staff.client_doc_get(uuid) to authenticated;
