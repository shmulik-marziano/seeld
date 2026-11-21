-- V3-02: POA wizard backend (database side). Behind off switches; applying needs no secret.
--   crm.poa_sessions   one row per wizard run (token = sha256 only; identity, engine ids encrypted; hmac + phone tail indexable)
--   crm.poa_consents   append-only evidence (approval, signature, ip: all encrypted; update/delete blocked by trigger)
--   crm.documents      the final PDFs per session (status machine; storage path poa/{agency}/{session}/{kind}-{id}.pdf)
--   crm.poa_matches    an existing customer found by national id (server side only, never shown to the visitor)
--   api.poa_*          service_role RPCs for the poa-intake / surense-worker functions
--   staff.poa_session_list / poa_session_verify   minimal staff surface (admin, fresh TOTP, access log)
-- Switches (ops.config; a missing key reads closed, private.flag): poa_enabled, poa_docs_enabled, poa_native_shadow = 'false';
-- poa_engine = 'surense'; poa_surense_url_id = ''; poa_module_maslaka / harbit / policies = 'true' (a module only runs while the
-- master switch is on); poa_turnstile_required = 'true' (read by poa-intake). Every RPC starts with a kill switch except
-- api.poa_document_link / poa_document_stored (called from the Surense worker for every customer: they must never raise a
-- switch error and park a job; they only link by Surense customer id and return {linked:false} when no wizard session exists).
-- Identity values (names, national id, phone, email, birth and issue dates, signature, ip) live only in *_enc columns.
-- Audit rows (audit_action / log_change 'no_values') carry ids and codes, never values.
-- Error codes (PostgREST maps PTxyz to HTTP xyz; messages are short codes): PT400 invalid_input:<field>, PT423 feature_disabled:<key>,
-- PT429 rate_limited, PT401 session_inactive, PT403 session_locked, PT409 session_completed, PT410 session_expired /
-- document_gone / download_expired, PT404 document_not_ready.
-- The daily cap (spec section 5): when 'poa_all' passes its daily limit poa_session_start switches poa_enabled off, raises an
-- alert and RETURNS {"ok": false, "error": "rate_limited"} instead of raising (a raise would roll the switch-off back).
-- Retention purge of old sessions is a separate later job (no-delete rule); nothing here deletes anything.

insert into ops.config (key, value) values
  ('poa_enabled', 'false'), ('poa_docs_enabled', 'false'), ('poa_engine', 'surense'), ('poa_native_shadow', 'false'),
  ('poa_surense_url_id', ''), ('poa_module_maslaka', 'true'), ('poa_module_harbit', 'true'), ('poa_module_policies', 'true'),
  ('poa_turnstile_required', 'true')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- tables (crm)
create table crm.poa_sessions (
  id                  uuid primary key default gen_random_uuid(),
  agency_id           uuid not null references core.agencies (id),
  token_hash          bytea not null unique check (octet_length(token_hash) = 32),
  status              text not null default 'open' check (status in ('open', 'completed', 'expired', 'locked')),
  modules             jsonb not null check (jsonb_typeof(modules) = 'object'),
  engine              text not null default 'surense' check (engine in ('surense', 'native')),
  engine_ref_enc      bytea,
  engine_last_error   text check (engine_last_error is null or engine_last_error ~ '^[a-z0-9_.:-]{1,80}$'),
  surense_customer_id uuid,
  national_id_hmac    bytea not null check (octet_length(national_id_hmac) = 32),
  phone_hmac          bytea not null check (octet_length(phone_hmac) = 32),
  phone_tail          text not null check (phone_tail ~ '^[0-9]{2}$'),
  identity_enc        bytea not null,
  ua_hash             bytea check (ua_hash is null or octet_length(ua_hash) = 32),
  preview_sha         jsonb not null default '{}'::jsonb check (jsonb_typeof(preview_sha) = 'object'),
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  docs_complete_at    timestamptz,
  expires_at          timestamptz not null,
  created_at          timestamptz not null default now()
);
comment on table crm.poa_sessions is 'POA wizard sessions. PII only in identity_enc / engine_ref_enc; token stored as sha256. No API role has any privilege.';
create index poa_sessions_national_id_idx on crm.poa_sessions (national_id_hmac);
create index poa_sessions_phone_idx on crm.poa_sessions (phone_hmac);
create index poa_sessions_surense_customer_idx on crm.poa_sessions (surense_customer_id) where surense_customer_id is not null;
create index poa_sessions_completed_idx on crm.poa_sessions (completed_at) where status = 'completed';
create index poa_sessions_agency_idx on crm.poa_sessions (agency_id, created_at desc);

create table crm.poa_consents (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references crm.poa_sessions (id),
  kind            text not null check (kind in ('terms_privacy', 'marketing', 'poa_maslaka', 'poa_harbit', 'poa_policies',
                                                'staff_identity_check', 'revocation')),
  method          text not null check (method in ('check', 'signature', 'typed', 'staff')),
  approved_at     timestamptz not null default now(),
  preview_sha256  bytea check (preview_sha256 is null or octet_length(preview_sha256) = 32),
  document_sha256 bytea check (document_sha256 is null or octet_length(document_sha256) = 32),
  signature_enc   bytea,
  ip_enc          bytea,
  user_agent      text check (user_agent is null or char_length(user_agent) <= 300),
  note_enc        bytea,
  retain_until    timestamptz
);
comment on table crm.poa_consents is 'Append-only consent evidence. update/delete raise unless audit.allow_purge=on (a future retention job). ip, signature and notes encrypted.';
create index poa_consents_session_idx on crm.poa_consents (session_id, approved_at);

create table crm.documents (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references crm.poa_sessions (id),
  kind                text not null check (kind in ('maslaka', 'harbit', 'policies')),
  source              text not null check (source in ('surense', 'native', 'native_shadow')),
  status              text not null default 'incomplete' check (status in ('incomplete', 'pending_staff_verification', 'active', 'revoked')),
  -- the Surense document id (crm.surense_documents.surense_id). No foreign key: the mirror may lag or be purged.
  surense_document_id uuid,
  storage_path        text unique check (storage_path is null
                                         or storage_path ~ '^poa/[0-9a-f-]{36}/[0-9a-f-]{36}/(maslaka|harbit|policies)-[0-9a-f-]{36}\.pdf$'),
  sha256              bytea check (sha256 is null or octet_length(sha256) = 32),
  valid_until         date,
  retain_until        timestamptz,
  customer_id         uuid,
  stored_at           timestamptz,
  downloaded_at       timestamptz,
  created_at          timestamptz not null default now(),
  unique (session_id, kind)
);
comment on table crm.documents is 'Final POA PDFs per wizard session. customer_id stays empty until staff assign it. File bytes live in the private client-docs bucket.';
create index documents_session_idx on crm.documents (session_id);

create table crm.poa_matches (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references crm.poa_sessions (id),
  customer_id   uuid not null references crm.customers (id),
  phone_differs boolean not null,
  status        text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at    timestamptz not null default now(),
  unique (session_id, customer_id)
);
comment on table crm.poa_matches is 'A wizard session whose national id (hmac) is already a customer. Staff decide; crm.customers is never updated from here.';
create index poa_matches_customer_idx on crm.poa_matches (customer_id);

alter table crm.poa_sessions enable row level security;
alter table crm.poa_consents enable row level security;
alter table crm.documents enable row level security;
alter table crm.poa_matches enable row level security;
revoke all on crm.poa_sessions, crm.poa_consents, crm.documents, crm.poa_matches from anon, authenticated, service_role;
create policy deny_api_roles on crm.poa_sessions for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.poa_consents for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.documents for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.poa_matches for all to anon, authenticated using (false) with check (false);
create trigger poa_sessions_audit after insert or update or delete on crm.poa_sessions
  for each row execute function audit.log_change('no_values');
create trigger poa_consents_audit after insert or update or delete on crm.poa_consents
  for each row execute function audit.log_change('no_values');
create trigger documents_audit after insert or update or delete on crm.documents
  for each row execute function audit.log_change('no_values');
create trigger poa_matches_audit after insert or update or delete on crm.poa_matches
  for each row execute function audit.log_change('no_values');

-- append-only: the only way through is the retention purge flag (same flag audit.block_mutation honours)
create or replace function private.poa_consents_block()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('audit.allow_purge', true), '') = 'on' then
    return coalesce(old, new);
  end if;
  raise exception 'crm.poa_consents is append-only' using errcode = '42501';
end $$;
create trigger poa_consents_append_only before update or delete on crm.poa_consents
  for each row execute function private.poa_consents_block();

-- ---------------------------------------------------------------- helpers
-- phone hmac: same Vault key as the national id, with a 'phone:' prefix so the two domains never collide.
-- Input: +9725XXXXXXXX or 05XXXXXXXX; both normalise to the local 10 digits.
create or replace function private.phone_hmac(p_phone text)
returns bytea language plpgsql stable security definer set search_path = '' as $$
declare v_local text := regexp_replace(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '^(\+972|972)', '0');
begin
  if v_local !~ '^05[0-9]{8}$' then raise exception 'invalid_input:phone' using errcode = 'PT400'; end if;
  return extensions.hmac(convert_to('phone:' || v_local, 'utf8'), convert_to(private.vault_secret('national_id_hmac_key'), 'utf8'), 'sha256');
end $$;

-- the first enabled module not yet performed, in display order; 'done' when none is left
create or replace function private.poa_next(p_modules jsonb)
returns text language sql immutable set search_path = '' as $$
  select coalesce((select t.k from unnest(array['maslaka', 'harbit', 'policies']) with ordinality as t(k, o)
                    where coalesce((p_modules -> t.k ->> 'enabled')::boolean, false)
                      and not coalesce((p_modules -> t.k ->> 'performed')::boolean, false)
                    order by t.o limit 1), 'done')
$$;

create or replace function private.poa_enabled_count(p_modules jsonb)
returns integer language sql immutable set search_path = '' as $$
  select count(*)::int from unnest(array['maslaka', 'harbit', 'policies']) as k
   where coalesce((p_modules -> k ->> 'enabled')::boolean, false)
$$;

-- locks the session row and refuses anything but a live, open session
create or replace function private.poa_open_session(p_id uuid)
returns crm.poa_sessions language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  if p_id is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_id for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'locked' then raise exception 'session_locked' using errcode = 'PT403'; end if;
  if s.status = 'completed' then raise exception 'session_completed' using errcode = 'PT409'; end if;
  if s.status = 'expired' or s.expires_at <= now() then raise exception 'session_expired' using errcode = 'PT410'; end if;
  return s;
end $$;

-- ---------------------------------------------------------------- api: session lifecycle
-- p_token_hash = sha256 of the 32-byte token the function generated (the token itself never reaches the database).
-- p_identity: {first_name, last_name, email|null}; p_national_id: 9 digits; p_phone: +9725XXXXXXXX; p_ip: client ip (service role only,
-- stored encrypted in the consent rows). The result is the same shape for every identity: existing_customer is for the function's
-- internal use only (it must never reach the browser) and the existing-customer lookup is ONE insert-select, so a match and a
-- non-match run the same statements.
create or replace function api.poa_session_start(p_token_hash bytea, p_identity jsonb, p_national_id text, p_phone text,
                                                 p_ua_hash bytea, p_ip text, p_marketing boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_agency uuid := coalesce((select c.value::uuid from ops.config c where c.key = 'default_agency_id'), '5eed0000-0000-4000-8000-000000000001'::uuid);
  v_first text; v_last text; v_email text; v_hmac bytea; v_phone_hmac bytea; v_local text; v_ip text; v_ip_enc bytea;
  v_modules jsonb; v_id uuid; v_exp timestamptz; v_matched integer; v_marketing boolean := coalesce(p_marketing, false);
begin
  perform private.kill_switch('poa_enabled');
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

  v_modules := jsonb_build_object(
    'maslaka', jsonb_build_object('enabled', private.flag('poa_module_maslaka'), 'required', private.flag('poa_module_maslaka'), 'performed', false),
    'harbit', jsonb_build_object('enabled', private.flag('poa_module_harbit'), 'required', private.flag('poa_module_harbit'), 'performed', false),
    'policies', jsonb_build_object('enabled', private.flag('poa_module_policies'), 'required', private.flag('poa_module_policies'), 'performed', false));
  if private.poa_enabled_count(v_modules) = 0 then raise exception 'feature_disabled:poa_modules' using errcode = 'PT423'; end if;

  v_hmac := private.national_id_hmac(p_national_id);
  v_phone_hmac := private.phone_hmac(p_phone);
  v_local := '0' || substr(p_phone, 5);

  -- limits: per client address, per identity, then everything (hourly raises; the daily cap trips the switch and returns)
  if not private.check_rate_limit('poa_ip', v_ip, 20, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('poa_start', encode(v_hmac, 'hex'), 10, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('poa_all', 'hour', 60, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('poa_all_day', 'day', 300, interval '1 day') then
    update ops.config set value = 'false', updated_at = now() where key = 'poa_enabled';
    perform ops.raise_alert('critical', 'poa_daily_cap', 'poa_enabled switched off: more than 300 new sessions in one day', 'poa_daily_cap', interval '1 day');
    perform private.audit_action('ops.config', 'poa_enabled', array['value'], jsonb_build_object('action', 'poa_daily_cap_trip'));
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_ip_enc := private.pii_encrypt(v_ip);
  v_exp := now() + interval '60 minutes';
  insert into crm.poa_sessions (agency_id, token_hash, status, modules, engine, national_id_hmac, phone_hmac, phone_tail, identity_enc,
                                ua_hash, expires_at)
  values (v_agency, p_token_hash, 'open', v_modules,
          case when (select c.value from ops.config c where c.key = 'poa_engine') = 'native' then 'native' else 'surense' end,
          v_hmac, v_phone_hmac, right(p_phone, 2),
          private.pii_encrypt(jsonb_build_object('first_name', v_first, 'last_name', v_last, 'email', v_email, 'national_id', p_national_id,
                                                 'phone', p_phone, 'marketing_approved', v_marketing)::text),
          p_ua_hash, v_exp)
  returning id into v_id;

  insert into crm.poa_consents (session_id, kind, method, ip_enc) values (v_id, 'terms_privacy', 'check', v_ip_enc);
  insert into crm.poa_consents (session_id, kind, method, ip_enc) select v_id, 'marketing', 'check', v_ip_enc where v_marketing;

  -- existing customer: one statement, same path for a hit and a miss; only a crm.poa_matches row comes of it
  insert into crm.poa_matches (session_id, customer_id, phone_differs)
  select v_id, c.id, c.mobile_phone is distinct from v_local
    from crm.customers c where c.agency_id = v_agency and c.national_id_hmac = v_hmac
   limit 1;
  get diagnostics v_matched = row_count;

  perform private.audit_action('crm.poa_sessions', v_id::text, '{}', jsonb_build_object('action', 'poa_session_start', 'marketing', v_marketing));
  return jsonb_build_object('ok', true, 'session_id', v_id, 'expires_at', v_exp, 'modules', v_modules,
                            'next', private.poa_next(v_modules), 'existing_customer', v_matched > 0);
end $$;

-- state for the function. A session past its expiry is flipped to 'expired' here (and stays so). engine_ref (decrypted) is
-- returned only while the session is open. The identity is NOT returned: no route needs it, so it is never decrypted on the
-- hot path (a later feature that needs it gets a dedicated, logged RPC).
create or replace function api.poa_session_get(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  perform private.kill_switch('poa_enabled');
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('poa_state', encode(p_token_hash, 'hex'), 120, interval '1 minute') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  select * into s from crm.poa_sessions where token_hash = p_token_hash for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'open' and s.expires_at <= now() then
    update crm.poa_sessions set status = 'expired' where id = s.id;
    s.status := 'expired';
  end if;
  return jsonb_build_object('session_id', s.id, 'status', s.status, 'expires_at', s.expires_at, 'modules', s.modules,
    'next', private.poa_next(s.modules), 'engine', s.engine, 'surense_customer_id', s.surense_customer_id,
    'completed_at', s.completed_at, 'preview_sha', s.preview_sha,
    'engine_ref', case when s.status = 'open' and s.engine_ref_enc is not null then private.pii_decrypt(s.engine_ref_enc)::jsonb end);
end $$;

-- the engine's ids (Surense customer id, public page id, process id): one flat object, encrypted whole. customer_id also
-- lands in an indexable column so poa_document_link is a plain lookup.
create or replace function api.poa_engine_ref_set(p_session uuid, p_ref jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; v_cust uuid;
begin
  perform private.kill_switch('poa_enabled');
  if p_ref is null or jsonb_typeof(p_ref) <> 'object' or octet_length(p_ref::text) > 2000
     or exists (select 1 from jsonb_each(p_ref) e
                 where e.key !~ '^[a-z][a-z0-9_]{0,40}$' or jsonb_typeof(e.value) not in ('string', 'number', 'boolean')) then
    raise exception 'invalid_input:ref' using errcode = 'PT400';
  end if;
  if p_ref ? 'customer_id' then
    if (p_ref ->> 'customer_id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'invalid_input:customer_id' using errcode = 'PT400';
    end if;
    v_cust := (p_ref ->> 'customer_id')::uuid;
  end if;
  s := private.poa_open_session(p_session);
  update crm.poa_sessions set engine_ref_enc = private.pii_encrypt(p_ref::text), surense_customer_id = coalesce(v_cust, surense_customer_id)
   where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_ref_enc'], jsonb_build_object('action', 'poa_engine_ref_set'));
  return jsonb_build_object('ok', true);
end $$;

-- the sha256 (hex) of the last PDF shown for a kind: consent is accepted only for exactly this file
create or replace function api.poa_preview_set(p_session uuid, p_kind text, p_sha256 text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  perform private.kill_switch('poa_enabled');
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  s := private.poa_open_session(p_session);
  if not coalesce((s.modules -> p_kind ->> 'enabled')::boolean, false) then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('poa_preview', s.id::text, 30, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  update crm.poa_sessions set preview_sha = preview_sha || jsonb_build_object(p_kind, p_sha256) where id = s.id;
  return jsonb_build_object('ok', true);
end $$;

-- p_method: check | signature | typed. p_signature: PNG data url (any method may carry one; method 'signature' requires it).
-- p_extra: harbit needs {birth_date, issue_date} (ISO). The approval is refused unless p_preview_sha256 equals the stored last preview.
-- Idempotent: a module already performed returns its recorded approval and inserts nothing.
create or replace function api.poa_consent_record(p_session uuid, p_kind text, p_method text, p_preview_sha256 text, p_signature text,
                                                  p_ip text, p_user_agent text, p_extra jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  s crm.poa_sessions; v_ip text; v_birth date; v_issue date; v_today date; v_modules jsonb; v_at timestamptz; v_ident jsonb; v_done boolean;
  v_ua text := nullif(left(btrim(coalesce(p_user_agent, '')), 300), '');
begin
  perform private.kill_switch('poa_enabled');
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_method is null or p_method not in ('check', 'signature', 'typed') then raise exception 'invalid_input:method' using errcode = 'PT400'; end if;
  if p_preview_sha256 is null or p_preview_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:preview_sha256' using errcode = 'PT400'; end if;
  if p_signature is not null and octet_length(p_signature) > 400000 then raise exception 'invalid_input:signature' using errcode = 'PT400'; end if;
  if p_method = 'signature' and (p_signature is null or p_signature !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$') then
    raise exception 'invalid_input:signature' using errcode = 'PT400';
  end if;
  if p_extra is not null and (jsonb_typeof(p_extra) <> 'object' or octet_length(p_extra::text) > 2000) then
    raise exception 'invalid_input:extra' using errcode = 'PT400';
  end if;
  v_ip := private.caller_ip(p_ip);
  -- replay: a module already performed answers with its recorded approval, also once the session is completed (the first
  -- answer may have been lost on the way to the browser). Nothing is inserted.
  select * into s from crm.poa_sessions where id = p_session for update;
  if found and (s.status = 'completed' or (s.status = 'open' and s.expires_at > now())) and coalesce((s.modules -> p_kind ->> 'performed')::boolean, false) then
    select c.approved_at into v_at from crm.poa_consents c where c.session_id = s.id and c.kind = 'poa_' || p_kind order by c.approved_at desc limit 1;
    return jsonb_build_object('kind', p_kind, 'method', p_method, 'approved_at', v_at, 'valid_until', null, 'modules', s.modules,
                              'next', private.poa_next(s.modules), 'complete', false);
  end if;
  s := private.poa_open_session(p_session);
  if not coalesce((s.modules -> p_kind ->> 'enabled')::boolean, false) then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if (s.preview_sha ->> p_kind) is distinct from p_preview_sha256 then raise exception 'invalid_input:preview_sha256' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('poa_consent', s.id::text, 20, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;

  if p_kind = 'harbit' then
    if coalesce(p_extra ->> 'birth_date', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid_input:birth_date' using errcode = 'PT400'; end if;
    if coalesce(p_extra ->> 'issue_date', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid_input:issue_date' using errcode = 'PT400'; end if;
    begin
      v_birth := (p_extra ->> 'birth_date')::date;
    exception when others then
      raise exception 'invalid_input:birth_date' using errcode = 'PT400';
    end;
    begin
      v_issue := (p_extra ->> 'issue_date')::date;
    exception when others then
      raise exception 'invalid_input:issue_date' using errcode = 'PT400';
    end;
    -- "today" is the Israeli calendar day, the same definition poa-intake uses (todayIsrael); the database zone is UTC
    v_today := (now() at time zone 'Asia/Jerusalem')::date;
    if v_birth < date '1900-01-01' or v_birth >= v_today then raise exception 'invalid_input:birth_date' using errcode = 'PT400'; end if;
    if v_issue <= v_birth or v_issue > v_today then raise exception 'invalid_input:issue_date' using errcode = 'PT400'; end if;
    v_ident := private.pii_decrypt(s.identity_enc)::jsonb || jsonb_build_object('birth_date', v_birth::text, 'issue_date', v_issue::text);
  end if;

  v_at := now();
  insert into crm.poa_consents (session_id, kind, method, approved_at, preview_sha256, signature_enc, ip_enc, user_agent)
  values (s.id, 'poa_' || p_kind, p_method, v_at, decode(p_preview_sha256, 'hex'), private.pii_encrypt(p_signature),
          private.pii_encrypt(v_ip), v_ua);

  v_modules := jsonb_set(s.modules, array[p_kind, 'performed'], 'true'::jsonb);
  v_done := private.poa_next(v_modules) = 'done';
  update crm.poa_sessions
     set modules = v_modules,
         identity_enc = case when v_ident is not null then private.pii_encrypt(v_ident::text) else identity_enc end,
         status = case when v_done then 'completed' else status end,
         completed_at = case when v_done then v_at else completed_at end
   where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['modules'],
    jsonb_build_object('action', 'poa_consent', 'kind', p_kind, 'method', p_method, 'complete', v_done));
  return jsonb_build_object('kind', p_kind, 'method', p_method, 'approved_at', v_at, 'valid_until', null, 'modules', v_modules,
                            'next', private.poa_next(v_modules), 'complete', v_done);
end $$;

-- a code only (<= 80 chars). 'locked' also closes the session (the wizard shows the locked screen).
-- A code starting 'launch_' is the one exception for a COMPLETED session: it records that the E9100 launch was not queued
-- (engine_last_error + an audit row) so staff can see which completed sessions still need a manual launch.
create or replace function api.poa_session_fail(p_session uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  perform private.kill_switch('poa_enabled');
  if p_code is null or p_code !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  if p_code ~ '^launch_' then
    if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
    select * into s from crm.poa_sessions where id = p_session for update;
    if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
    if s.status <> 'completed' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
    update crm.poa_sessions set engine_last_error = p_code where id = s.id;
    perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_last_error'], jsonb_build_object('action', 'poa_launch_not_queued', 'code', p_code));
    return jsonb_build_object('ok', true);
  end if;
  s := private.poa_open_session(p_session);
  update crm.poa_sessions set engine_last_error = p_code, status = case when p_code = 'locked' then 'locked' else status end where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_last_error'], jsonb_build_object('action', 'poa_session_fail', 'code', p_code));
  return jsonb_build_object('ok', true);
end $$;

-- idempotent: completes an open session whose enabled modules are all performed (consent_record already does this on the
-- last module). Not complete -> {complete:false}, nothing changes. A completed session returns its record.
create or replace function api.poa_session_complete(p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  perform private.kill_switch('poa_enabled');
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_session for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'completed' then
    return jsonb_build_object('complete', true, 'status', s.status, 'completed_at', s.completed_at, 'customer_id', s.surense_customer_id);
  end if;
  if s.status = 'locked' then raise exception 'session_locked' using errcode = 'PT403'; end if;
  if s.status = 'expired' or s.expires_at <= now() then raise exception 'session_expired' using errcode = 'PT410'; end if;
  if private.poa_next(s.modules) <> 'done' then
    return jsonb_build_object('complete', false, 'status', s.status, 'completed_at', null, 'customer_id', s.surense_customer_id);
  end if;
  update crm.poa_sessions set status = 'completed', completed_at = now() where id = s.id returning * into s;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['status'], jsonb_build_object('action', 'poa_session_complete'));
  return jsonb_build_object('complete', true, 'status', s.status, 'completed_at', s.completed_at, 'customer_id', s.surense_customer_id);
end $$;

-- ---------------------------------------------------------------- api: documents
-- Called by the Surense worker after a dataproxy.<aleph|hei|bet>.approved event. p_kind: maslaka | harbit | policies;
-- p_document_id: the Surense document id; p_sha256: hex, or null while only metadata is known. Never raises for an unknown
-- customer (webhooks also fire for customers that never used the wizard): {linked:false}. A link answers agency_id too, so the worker
-- can build the storage path poa/{agency}/{session}/{kind}-{document}.pdf.
create or replace function api.poa_document_link(p_customer uuid, p_kind text, p_document_id uuid, p_sha256 text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; v_doc uuid; v_complete boolean;
begin
  if p_customer is null or p_document_id is null then raise exception 'invalid_input:ids' using errcode = 'PT400'; end if;
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_sha256 is not null and p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  -- only a LIVE wizard run takes a document: an open session inside its 60 minutes, or one completed in the last 24 hours, and
  -- only for a module the visitor actually performed. A stale session (e.g. someone who once typed another person's id) never
  -- receives a document that arrives much later through the agent's own link.
  select * into s from crm.poa_sessions x
   where x.surense_customer_id = p_customer
     and ((x.status = 'open' and x.expires_at > now()) or (x.status = 'completed' and x.completed_at > now() - interval '24 hours'))
     and coalesce((x.modules -> p_kind ->> 'enabled')::boolean, false)
     and coalesce((x.modules -> p_kind ->> 'performed')::boolean, false)
   order by x.created_at desc limit 1
   for update;
  if not found then return jsonb_build_object('linked', false, 'session_id', null); end if;
  -- one Surense document backs one kind: the "newest document" heuristic must not hand the same file to two modules
  if exists (select 1 from crm.documents d2 where d2.session_id = s.id and d2.kind <> p_kind and d2.surense_document_id = p_document_id) then
    return jsonb_build_object('linked', false, 'session_id', s.id, 'reason', 'already_linked');
  end if;
  insert into crm.documents as d (session_id, kind, source, status, surense_document_id, sha256)
  values (s.id, p_kind, 'surense', 'pending_staff_verification', p_document_id, case when p_sha256 is not null then decode(p_sha256, 'hex') end)
  on conflict (session_id, kind) do update
    set surense_document_id = excluded.surense_document_id, sha256 = coalesce(excluded.sha256, d.sha256)
    where d.status in ('incomplete', 'pending_staff_verification')
  returning d.id into v_doc;
  if v_doc is null then select d.id into v_doc from crm.documents d where d.session_id = s.id and d.kind = p_kind; end if;
  select not exists (select 1 from unnest(array['maslaka', 'harbit', 'policies']) k
                      where coalesce((s.modules -> k ->> 'enabled')::boolean, false)
                        and not exists (select 1 from crm.documents d where d.session_id = s.id and d.kind = k and d.status <> 'revoked'))
    into v_complete;
  if v_complete and s.docs_complete_at is null then update crm.poa_sessions set docs_complete_at = now() where id = s.id; end if;
  perform private.audit_action('crm.documents', v_doc::text, '{}', jsonb_build_object('action', 'poa_document_link', 'kind', p_kind, 'complete', v_complete));
  return jsonb_build_object('linked', true, 'session_id', s.id, 'agency_id', s.agency_id, 'document_id', v_doc, 'complete', v_complete);
end $$;

-- the worker stored the bytes: record the path (it must be exactly poa/{agency}/{session}/{kind}-{document}.pdf) and the hash
create or replace function api.poa_document_stored(p_document uuid, p_path text, p_sha256 text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r record;
begin
  if p_document is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  select d.id, d.kind, d.session_id, s.agency_id into r from crm.documents d join crm.poa_sessions s on s.id = d.session_id where d.id = p_document for update of d;
  if not found then raise exception 'document_not_found' using errcode = 'PT404'; end if;
  if p_path is distinct from ('poa/' || r.agency_id || '/' || r.session_id || '/' || r.kind || '-' || r.id || '.pdf') then
    raise exception 'invalid_input:path' using errcode = 'PT400';
  end if;
  update crm.documents set storage_path = p_path, sha256 = decode(p_sha256, 'hex'), stored_at = now() where id = r.id;
  perform private.audit_action('crm.documents', r.id::text, array['storage_path'], jsonb_build_object('action', 'poa_document_stored', 'kind', r.kind));
  return jsonb_build_object('ok', true);
end $$;

-- The client's one download per document, in two steps so a storage hiccup never burns it:
--   api.poa_doc_get    (peek)  checks switch, window and that it was not downloaded yet; returns {storage_path, sha256}; claims nothing
--   api.poa_doc_claim  (claim) the single use: called by poa-intake only AFTER the bytes were read and the hash verified
-- The window is 30 minutes from the session's COMPLETION (not from when the file was stored). It needs only poa_docs_enabled,
-- not poa_enabled (closing new sessions must not close downloads of people who just finished); the module must be enabled
-- for the session.
create or replace function private.poa_doc_lookup(p_token_hash bytea, p_kind text)
returns crm.documents language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; d crm.documents;
begin
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where token_hash = p_token_hash;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if not coalesce((s.modules -> p_kind ->> 'enabled')::boolean, false) then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if s.status <> 'completed' then raise exception 'document_not_ready' using errcode = 'PT404'; end if;
  select * into d from crm.documents x where x.session_id = s.id and x.kind = p_kind and x.status <> 'revoked' and x.storage_path is not null for update;
  if not found then raise exception 'document_not_ready' using errcode = 'PT404'; end if;
  if now() > s.completed_at + interval '30 minutes' then raise exception 'download_expired' using errcode = 'PT410'; end if;
  if d.downloaded_at is not null then raise exception 'document_gone' using errcode = 'PT410'; end if;
  return d;
end $$;

create or replace function api.poa_doc_get(p_token_hash bytea, p_kind text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare d crm.documents;
begin
  perform private.kill_switch('poa_docs_enabled');
  if p_token_hash is not null and not private.check_rate_limit('poa_doc', encode(p_token_hash, 'hex'), 20, interval '1 hour') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  d := private.poa_doc_lookup(p_token_hash, p_kind);
  return jsonb_build_object('storage_path', d.storage_path, 'sha256', encode(d.sha256, 'hex'));
end $$;

create or replace function api.poa_doc_claim(p_token_hash bytea, p_kind text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare d crm.documents; v_n integer;
begin
  perform private.kill_switch('poa_docs_enabled');
  d := private.poa_doc_lookup(p_token_hash, p_kind);
  update crm.documents set downloaded_at = now() where id = d.id and downloaded_at is null;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'document_gone' using errcode = 'PT410'; end if;
  perform private.audit_action('crm.documents', d.id::text, array['downloaded_at'], jsonb_build_object('action', 'poa_doc_download', 'kind', p_kind));
  return jsonb_build_object('ok', true);
end $$;

-- the wizard switches in one read (service role only): lets poa-intake refuse before it spends a Turnstile token, and honour
-- poa_turnstile_required. No kill switch of its own: it only reports.
create or replace function api.poa_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'poa_enabled', private.flag('poa_enabled'),
    'engine', case when (select c.value from ops.config c where c.key = 'poa_engine') = 'native' then 'native' else 'surense' end,
    'turnstile_required', coalesce((select c.value from ops.config c where c.key = 'poa_turnstile_required'), 'true') <> 'false',
    'modules', jsonb_build_object('maslaka', private.flag('poa_module_maslaka'), 'harbit', private.flag('poa_module_harbit'),
                                  'policies', private.flag('poa_module_policies')))
$$;

-- ---------------------------------------------------------------- staff (admin, fresh TOTP, access log). Minimal.
-- No national id beyond the last four digits, no phone beyond its tail. Names are shown to staff only through this logged call.
create or replace function staff.poa_session_list(p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, status text, modules jsonb, first_name text, last_name text, id_masked text, phone_tail text,
               created_at timestamptz, completed_at timestamptz, documents jsonb, matched boolean, last_error text)
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
           coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'status', d.status) order by d.kind)
                       from crm.documents d where d.session_id = s.id), '[]'::jsonb),
           exists (select 1 from crm.poa_matches m where m.session_id = s.id), s.engine_last_error
      from crm.poa_sessions s cross join lateral (select private.pii_decrypt(s.identity_enc)::jsonb as j) i
     where s.id = any (v_ids)
     order by s.created_at desc, s.id;
end $$;

-- "verified by phone": records the staff identity check and activates the session's pending documents
create or replace function staff.poa_session_verify(p_session uuid, p_note text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_note text := nullif(left(btrim(coalesce(p_note, '')), 200), ''); n integer;
begin
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  if not exists (select 1 from crm.poa_sessions s where s.id = p_session and s.agency_id = private.my_agency_id() and s.status = 'completed') then
    raise exception 'not_found' using errcode = 'PT404';
  end if;
  insert into crm.poa_consents (session_id, kind, method, note_enc) values (p_session, 'staff_identity_check', 'staff', private.pii_encrypt(v_note));
  update crm.documents set status = 'active' where session_id = p_session and status = 'pending_staff_verification';
  get diagnostics n = row_count;
  perform private.audit_action('crm.poa_sessions', p_session::text, '{}', jsonb_build_object('action', 'poa_session_verify', 'activated', n));
  return jsonb_build_object('ok', true, 'activated', n);
end $$;

-- minimal staff download lookup for the client-docs function (called AS the staff caller, with their JWT): staff, fresh MFA step,
-- an access-log row (ids only), then the storage path and hash of one stored document of the caller's agency.
create or replace function staff.client_doc_get(p_document_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); r record;
begin
  if not private.is_fresh_mfa(coalesce((select c.value from ops.config c where c.key = 'stepup_max_age_sec'), '900')::int) then
    raise exception 'forbidden:fresh_totp' using errcode = 'PT403';
  end if;
  if p_document_id is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  select d.id, d.storage_path, encode(d.sha256, 'hex') as sha256 into r
    from crm.documents d join crm.poa_sessions s on s.id = d.session_id
   where d.id = p_document_id and s.agency_id = private.my_agency_id() and d.status <> 'revoked' and d.storage_path is not null;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.log_access('client_doc_get', 'crm.documents', array[r.id]);
  return jsonb_build_object('storage_path', r.storage_path, 'sha256', r.sha256);
end $$;

-- ---------------------------------------------------------------- job kind: launch of the E9100 submission
alter table ops.surense_jobs drop constraint surense_jobs_kind_check;
alter table ops.surense_jobs add constraint surense_jobs_kind_check
  check (kind in ('surense.event', 'surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit'));

-- api.surense_job_enqueue: 20261120200000 verbatim + 'surense.e9100_submit' in the whitelist
create or replace function api.surense_job_enqueue(p_kind text, p_params jsonb default '{}'::jsonb, p_dedupe text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform private.kill_switch('surense_enabled');
  if p_kind is null or p_kind not in ('surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit') then
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

-- ---------------------------------------------------------------- staff.admin_config_set: 20261120200000 verbatim + 9 poa keys
-- poa_engine takes 'surense' | 'native'; poa_surense_url_id takes a short id (or empty); the other poa keys are true/false.
create or replace function staff.admin_config_set(p_key text, p_value text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_old text;
begin
  if p_key is null or p_key not in ('intake_enabled', 'chat_enabled', 'portal_enabled', 'tracks_sync_enabled',
      'lead_retention_enabled', 'auth_lock_enabled', 'stepup_max_age_sec',
      'surense_enabled', 'surense_write_enabled', 'surense_e9100_enabled', 'surense_webhook_enabled', 'surense_retention_enabled',
      'poa_enabled', 'poa_docs_enabled', 'poa_engine', 'poa_native_shadow', 'poa_surense_url_id',
      'poa_module_maslaka', 'poa_module_harbit', 'poa_module_policies', 'poa_turnstile_required') then
    raise exception 'invalid_input:key' using errcode = 'PT400';
  end if;
  if p_key = 'stepup_max_age_sec' then
    if coalesce(p_value, '') !~ '^[0-9]{3,4}$' or p_value::int not between 300 and 3600 then
      raise exception 'invalid_input:value' using errcode = 'PT400';
    end if;
  elsif p_key = 'poa_engine' then
    if p_value is null or p_value not in ('surense', 'native') then raise exception 'invalid_input:value' using errcode = 'PT400'; end if;
  elsif p_key = 'poa_surense_url_id' then
    if p_value is null or p_value !~ '^[A-Za-z0-9_-]{0,32}$' then raise exception 'invalid_input:value' using errcode = 'PT400'; end if;
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

-- ---------------------------------------------------------------- ops.watchdog: 20261120200000 verbatim + 'poa' step
-- Full body re-created. Addition only: the isolated 'poa' step before the run is closed. Ids and counts only.
-- A completed session (all enabled modules approved) older than 1 hour with FEWER linked documents (crm.documents rows, stored or
-- not, not revoked) than enabled modules raises poa_docs_missing (once per 24 h). Linked-but-never-stored files are the
-- download-host decision (client.ts ALLOWED_HOSTS), tracked by the stored_at column, not by this alert. Sessions only exist while the wizard is in use, so this is quiet before go-live.
create or replace function ops.watchdog()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_run bigint; v_failed text[] := '{}'; v_copied integer := 0; v_fail integer; v_locked integer := 0; r record;
  v_n bigint; v_min bigint; v_poa_first uuid;
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


  -- POA wizard (20261121150000). Ids and counts only.
  begin
    select count(*), (array_agg(x.id order by x.completed_at, x.id))[1] into v_n, v_poa_first
      from crm.poa_sessions x
     where x.status = 'completed' and x.completed_at < now() - interval '1 hour'
       and (select count(*) from crm.documents d where d.session_id = x.id and d.status <> 'revoked') < private.poa_enabled_count(x.modules);
    if v_n > 0 then
      perform ops.raise_alert('warning', 'poa_docs_missing',
        'poa sessions completed >1h ago with documents missing: count=' || v_n || ' first_id=' || v_poa_first, 'poa_docs_missing', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'poa'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'poa: SQLSTATE ' || sqlstate, 'watchdog_step:poa', interval '24 hours');
  end;

  update ops.job_runs set finished_at = now(), ok = cardinality(v_failed) = 0,
         stats = jsonb_build_object('failed_steps', to_jsonb(v_failed), 'auth_events_copied', v_copied, 'locked', v_locked)
   where id = v_run;
  return jsonb_build_object('ok', cardinality(v_failed) = 0, 'failed_steps', to_jsonb(v_failed),
                            'auth_events_copied', v_copied, 'locked', v_locked);
end $$;

-- ---------------------------------------------------------------- privileges
revoke all on function private.poa_consents_block(), private.phone_hmac(text), private.poa_next(jsonb), private.poa_enabled_count(jsonb),
  private.poa_open_session(uuid), private.poa_doc_lookup(bytea, text) from public, anon, authenticated, service_role;
revoke all on function api.poa_session_start(bytea, jsonb, text, text, bytea, text, boolean), api.poa_session_get(bytea),
  api.poa_engine_ref_set(uuid, jsonb), api.poa_preview_set(uuid, text, text),
  api.poa_consent_record(uuid, text, text, text, text, text, text, jsonb), api.poa_session_fail(uuid, text), api.poa_session_complete(uuid),
  api.poa_document_link(uuid, text, uuid, text), api.poa_document_stored(uuid, text, text), api.poa_doc_get(bytea, text), api.poa_doc_claim(bytea, text),
  api.poa_config(), api.surense_job_enqueue(text, jsonb, text)
  from public, anon, authenticated;
grant execute on function api.poa_session_start(bytea, jsonb, text, text, bytea, text, boolean), api.poa_session_get(bytea),
  api.poa_engine_ref_set(uuid, jsonb), api.poa_preview_set(uuid, text, text),
  api.poa_consent_record(uuid, text, text, text, text, text, text, jsonb), api.poa_session_fail(uuid, text), api.poa_session_complete(uuid),
  api.poa_document_link(uuid, text, uuid, text), api.poa_document_stored(uuid, text, text), api.poa_doc_get(bytea, text), api.poa_doc_claim(bytea, text),
  api.poa_config(), api.surense_job_enqueue(text, jsonb, text)
  to service_role;
revoke all on function staff.poa_session_list(integer, integer), staff.poa_session_verify(uuid, text), staff.client_doc_get(uuid) from public, anon;
grant execute on function staff.poa_session_list(integer, integer), staff.poa_session_verify(uuid, text), staff.client_doc_get(uuid) to authenticated;
revoke all on function ops.watchdog() from public, anon, authenticated;
