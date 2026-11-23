-- V3-05: client area (database side). Owner decision 2026-11-23: a personal area on the site, secure per client, login by
-- unique data only (national id + the mobile number we hold) followed by a one-time code to that mobile (Micropay, sent by
-- the client-area function), then a 30-day session. Behind off switches; applying needs no secret.
--   crm.client_login_challenges  one row per login attempt (matched or not: the same statements run for every input);
--                                the mobile is kept encrypted for the single verify call, the id/phone as hmacs
--   crm.client_sessions          token = sha256 only (the token itself never reaches the database); revocable
--   api.client_*                 service_role RPCs for the client-area function
--   staff.client_sessions_revoke staff: sign a client out everywhere
--   ops.client_area_cleanup      retention (switch-gated, off by default: the no-delete rule)
-- Identity anchor: crm.customers (agency, names, mobile_phone, national_id_hmac). The Surense mirror joins on the same
-- national_id_hmac (crm.surense_customers), the POA wizard on crm.poa_sessions.national_id_hmac.
-- Switches (ops.config; a missing key reads closed): client_area_enabled = 'false', client_area_turnstile_required = 'true',
-- client_area_retention_enabled = 'false'.
-- Error codes (PostgREST maps PTxyz to HTTP xyz): PT400 invalid_input:<field>, PT423 feature_disabled:client_area_enabled,
-- PT429 rate_limited, PT401 session_inactive, PT410 challenge_expired, PT404 not_found.
-- Personal values never leave the database except: the matched mobile (to the function, for the one-time code) and the
-- client's own data for their own token. Audit rows carry ids and codes only.

insert into ops.config (key, value) values
  ('client_area_enabled', 'false'), ('client_area_turnstile_required', 'true'), ('client_area_retention_enabled', 'false')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- tables (crm)
create table crm.client_login_challenges (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references crm.customers (id),
  agency_id        uuid references core.agencies (id),
  national_id_hmac bytea not null check (octet_length(national_id_hmac) = 32),
  phone_hmac       bytea not null check (octet_length(phone_hmac) = 32),
  phone_enc        bytea,
  phone_tail       text not null check (phone_tail ~ '^[0-9]{2}$'),
  matched          boolean not null default false,
  status           text not null default 'pending' check (status in ('pending', 'verified', 'expired', 'failed')),
  attempts         integer not null default 0,
  ip_hash          bytea check (ip_hash is null or octet_length(ip_hash) = 32),
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null,
  check (not matched or customer_id is not null)
);
comment on table crm.client_login_challenges is 'Client-area login attempts. The mobile stays encrypted (phone_enc) for the one verify call; id and phone as hmacs. No API role has any privilege.';
create index client_login_challenges_customer_idx on crm.client_login_challenges (customer_id) where customer_id is not null;
create index client_login_challenges_created_idx on crm.client_login_challenges (created_at);

create table crm.client_sessions (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references crm.customers (id),
  agency_id    uuid not null references core.agencies (id),
  token_hash   bytea not null unique check (octet_length(token_hash) = 32),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at   timestamptz,
  ip_hash      bytea check (ip_hash is null or octet_length(ip_hash) = 32),
  user_agent   text check (user_agent is null or char_length(user_agent) <= 200)
);
comment on table crm.client_sessions is 'Client-area sessions (token stored as sha256 only; 30 days; revocable). No API role has any privilege.';
create index client_sessions_customer_idx on crm.client_sessions (customer_id, created_at desc);
create index client_sessions_expires_idx on crm.client_sessions (expires_at);

alter table crm.client_login_challenges enable row level security;
alter table crm.client_sessions enable row level security;
revoke all on crm.client_login_challenges, crm.client_sessions from anon, authenticated, service_role;
create policy deny_api_roles on crm.client_login_challenges for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.client_sessions for all to anon, authenticated using (false) with check (false);
create trigger client_login_challenges_audit after insert or update or delete on crm.client_login_challenges
  for each row execute function audit.log_change('no_values');
create trigger client_sessions_audit after insert or update or delete on crm.client_sessions
  for each row execute function audit.log_change('no_values');

-- ---------------------------------------------------------------- helpers (private)
-- local mobile digits (05XXXXXXXX) from +9725..., 9725... or 05...; null when not an Israeli mobile
create or replace function private.client_mobile_norm(p_phone text)
returns text language sql immutable set search_path = '' as $$
  select nullif(regexp_replace(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '^(\+972|972)', '0'), '')
$$;

-- the live session behind a token: raises session_inactive (PT401) for an unknown, expired or revoked token
create or replace function private.client_session_of(p_token_hash bytea)
returns crm.client_sessions language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions;
begin
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('client_session', encode(p_token_hash, 'hex'), 240, interval '1 minute') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  select * into s from crm.client_sessions where token_hash = p_token_hash;
  if not found or s.revoked_at is not null or s.expires_at <= now() then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  -- last_seen_at moves at most once a minute (every read would otherwise write an audit row)
  if s.last_seen_at < now() - interval '1 minute' then
    update crm.client_sessions set last_seen_at = now() where id = s.id;
  end if;
  return s;
end $$;

-- the Surense mirror rows of a customer: same national id (hmac), not deleted in Surense
create or replace function private.client_surense_ids(p_customer uuid)
returns setof uuid language sql stable security definer set search_path = '' as $$
  select sc.id from crm.surense_customers sc join crm.customers c on c.national_id_hmac = sc.national_id_hmac
   where c.id = p_customer and sc.deleted_at is null
$$;

revoke all on function private.client_mobile_norm(text), private.client_session_of(bytea), private.client_surense_ids(uuid)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------- api: switches
create or replace function api.client_area_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'enabled', private.flag('client_area_enabled'),
    'turnstile_required', coalesce((select c.value from ops.config c where c.key = 'client_area_turnstile_required'), 'true') <> 'false')
$$;

-- ---------------------------------------------------------------- api: login
-- p_national_id: 5..9 digits (normalised like everywhere else); p_phone: Israeli mobile (05XXXXXXXX or +9725XXXXXXXX);
-- p_ip: the client address (service role asserts it); p_ua_hash: sha256 of the user agent or null.
-- The same statements run for a match and a non-match: one challenge row either way, the same keys in the answer.
-- `matched` and `phone` are for the FUNCTION only (it sends the code and never returns them): the browser gets
-- challenge_id, phone_tail (of the number typed, so a non-match reveals nothing) and expires_in_sec.
create or replace function api.client_login_start(p_national_id text, p_phone text, p_ip text, p_ua_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_hmac bytea; v_phone text; v_phone_hmac bytea; v_ip text; v_id uuid; v_exp timestamptz := now() + interval '10 minutes';
  v_cust uuid; v_agency uuid; v_matched boolean;
begin
  perform private.kill_switch('client_area_enabled');
  if p_national_id is null or p_national_id !~ '^[0-9]{5,9}$' then raise exception 'invalid_input:national_id' using errcode = 'PT400'; end if;
  v_phone := private.client_mobile_norm(p_phone);
  if v_phone is null or v_phone !~ '^05[0-9]{8}$' then raise exception 'invalid_input:phone' using errcode = 'PT400'; end if;
  if p_ua_hash is not null and octet_length(p_ua_hash) <> 32 then raise exception 'invalid_input:ua_hash' using errcode = 'PT400'; end if;
  v_ip := private.caller_ip(p_ip);
  v_hmac := private.national_id_hmac(p_national_id);
  v_phone_hmac := private.phone_hmac(v_phone);

  -- limits: per client address, per identity, per phone (hourly)
  if not private.check_rate_limit('client_login_ip', v_ip, 10, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('client_login_id', encode(v_hmac, 'hex'), 5, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  if not private.check_rate_limit('client_login_phone', encode(v_phone_hmac, 'hex'), 3, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;

  -- one lookup for a hit and a miss alike: the id AND the mobile must both be ours
  select c.id, c.agency_id into v_cust, v_agency
    from crm.customers c
   where c.national_id_hmac = v_hmac and c.mobile_phone = v_phone and c.status = 'active'
   order by c.created_at limit 1;
  v_matched := v_cust is not null;

  insert into crm.client_login_challenges (customer_id, agency_id, national_id_hmac, phone_hmac, phone_enc, phone_tail, matched, ip_hash, expires_at)
  values (v_cust, v_agency, v_hmac, v_phone_hmac, case when v_matched then private.pii_encrypt(v_phone) end, right(v_phone, 2), v_matched,
          extensions.digest(v_ip, 'sha256'), v_exp)
  returning id into v_id;
  perform private.audit_action('crm.client_login_challenges', v_id::text, '{}', jsonb_build_object('action', 'client_login_start', 'matched', v_matched));
  return jsonb_build_object('challenge_id', v_id, 'phone_tail', right(v_phone, 2), 'expires_in_sec', 600,
                            'matched', v_matched, 'phone', case when v_matched then v_phone end);
end $$;

-- one verify attempt: counts it, closes the challenge after 10, answers the mobile (decrypted for this call) when the
-- challenge matched a customer. The function checks the code with the SMS provider and then calls client_login_verify.
create or replace function api.client_login_challenge_use(p_challenge uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare ch crm.client_login_challenges;
begin
  perform private.kill_switch('client_area_enabled');
  if p_challenge is null then raise exception 'invalid_input:challenge' using errcode = 'PT400'; end if;
  select * into ch from crm.client_login_challenges where id = p_challenge for update;
  if not found then raise exception 'challenge_expired' using errcode = 'PT410'; end if;
  if ch.status = 'pending' and ch.expires_at <= now() then
    update crm.client_login_challenges set status = 'expired' where id = ch.id;
    ch.status := 'expired';
  end if;
  if ch.status = 'expired' or ch.status = 'verified' then raise exception 'challenge_expired' using errcode = 'PT410'; end if;
  if ch.status = 'failed' then return jsonb_build_object('status', 'failed', 'matched', ch.matched, 'phone', null, 'attempts', ch.attempts); end if;
  update crm.client_login_challenges set attempts = attempts + 1, status = case when attempts + 1 >= 10 then 'failed' else status end
   where id = ch.id returning * into ch;
  return jsonb_build_object('status', ch.status, 'matched', ch.matched, 'attempts', ch.attempts,
                            'phone', case when ch.matched and ch.status = 'pending' then private.pii_decrypt(ch.phone_enc) end);
end $$;

-- the code was accepted by the SMS provider: close the challenge, open a 30-day session (token = sha256 only)
create or replace function api.client_login_verify(p_challenge uuid, p_token_hash bytea, p_ip text, p_user_agent text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare ch crm.client_login_challenges; c crm.customers; v_id uuid; v_exp timestamptz := now() + interval '30 days'; v_ip text;
begin
  perform private.kill_switch('client_area_enabled');
  if p_challenge is null then raise exception 'invalid_input:challenge' using errcode = 'PT400'; end if;
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  v_ip := private.caller_ip(p_ip);
  select * into ch from crm.client_login_challenges where id = p_challenge for update;
  if not found or ch.status <> 'pending' or ch.expires_at <= now() or not ch.matched then
    raise exception 'challenge_expired' using errcode = 'PT410';
  end if;
  select * into c from crm.customers where id = ch.customer_id and status = 'active';
  if not found then raise exception 'challenge_expired' using errcode = 'PT410'; end if;
  update crm.client_login_challenges set status = 'verified', phone_enc = null where id = ch.id;
  insert into crm.client_sessions (customer_id, agency_id, token_hash, expires_at, ip_hash, user_agent)
  values (c.id, c.agency_id, p_token_hash, v_exp, extensions.digest(v_ip, 'sha256'), left(p_user_agent, 200))
  returning id into v_id;
  perform private.audit_action('crm.client_sessions', v_id::text, '{}', jsonb_build_object('action', 'client_login_verify'));
  return jsonb_build_object('session_id', v_id, 'expires_at', v_exp,
                            'client', jsonb_build_object('first_name', c.first_name, 'last_name', c.last_name));
end $$;

-- ---------------------------------------------------------------- api: the client's own data (token-scoped)
create or replace function api.client_session_get(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; c crm.customers; v_agency text;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  select * into c from crm.customers where id = s.customer_id;
  select a.name into v_agency from core.agencies a where a.id = s.agency_id;
  return jsonb_build_object('session_id', s.id, 'customer_id', s.customer_id, 'expires_at', s.expires_at,
                            'client', jsonb_build_object('first_name', c.first_name, 'last_name', c.last_name, 'agency_name', v_agency));
end $$;

-- the mirrored Surense products of this client (details decrypted for this call; hidden ones left out) and the date of
-- the latest snapshot. The function shapes them (labels, masking); nothing here is cached.
create or replace function api.client_portfolio_get(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; v_as_of date; v_products jsonb;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  if not private.check_rate_limit('client_portfolio', s.id::text, 60, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  select max(p.fetched_at)::date into v_as_of
    from crm.surense_portfolios p where p.customer_surense_id in (select private.client_surense_ids(s.customer_id));
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'source', p.source, 'company_id', p.company_id, 'product_type', p.product_type,
           'modified_at', p.surense_modified_at, 'details', coalesce(private.pii_decrypt(p.details_enc)::jsonb, '{}'::jsonb))
         order by p.product_type, p.surense_modified_at desc nulls last), '[]'::jsonb) into v_products
    from crm.surense_products p
   where p.customer_surense_id in (select private.client_surense_ids(s.customer_id)) and coalesce(p.hidden, false) = false;
  perform private.log_access('client_portfolio_get', 'crm.surense_products', array[s.customer_id]);
  return jsonb_build_object('as_of', v_as_of, 'products', v_products);
end $$;

-- the client's documents: the final POA files of their wizard sessions (same national id) and the Surense document
-- metadata (names decrypted for this call; no file for those yet)
create or replace function api.client_documents_list(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; v_hmac bytea; v_poa jsonb; v_sur jsonb;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  select c.national_id_hmac into v_hmac from crm.customers c where c.id = s.customer_id;
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'created_at', coalesce(d.stored_at, d.created_at),
                                               'downloadable', d.storage_path is not null and d.status <> 'revoked')
                  order by coalesce(d.stored_at, d.created_at) desc), '[]'::jsonb) into v_poa
    from crm.documents d join crm.poa_sessions ps on ps.id = d.session_id
   where ps.national_id_hmac = v_hmac and d.status <> 'revoked' and d.storage_path is not null;
  select coalesce(jsonb_agg(jsonb_build_object('id', sd.id, 'kind', 'surense', 'created_at', coalesce(sd.surense_created_at, sd.synced_at),
                                               'size_bytes', sd.size_bytes, 'mime', sd.mime,
                                               'name', left(private.pii_decrypt(sd.details_enc)::jsonb ->> 'name', 120), 'downloadable', false)
                  order by coalesce(sd.surense_created_at, sd.synced_at) desc), '[]'::jsonb) into v_sur
    from crm.surense_documents sd
   where sd.kind = 'document' and sd.deleted_at is null
     and sd.customer_surense_id in (select private.client_surense_ids(s.customer_id));
  return jsonb_build_object('poa', v_poa, 'surense', v_sur);
end $$;

-- one POA file of this client: the storage path for the function to sign (5 minutes); access-logged
create or replace function api.client_document_get(p_token_hash bytea, p_document uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; r record;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  if p_document is null then raise exception 'invalid_input:document' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('client_doc', s.id::text, 30, interval '1 hour') then raise exception 'rate_limited' using errcode = 'PT429'; end if;
  select d.id, d.kind, d.storage_path, encode(d.sha256, 'hex') as sha256 into r
    from crm.documents d join crm.poa_sessions ps on ps.id = d.session_id join crm.customers c on c.national_id_hmac = ps.national_id_hmac
   where d.id = p_document and c.id = s.customer_id and d.status <> 'revoked' and d.storage_path is not null;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.log_access('client_document_get', 'crm.documents', array[r.id]);
  perform private.audit_action('crm.documents', r.id::text, '{}', jsonb_build_object('action', 'client_document_get', 'kind', r.kind));
  return jsonb_build_object('storage_path', r.storage_path, 'sha256', r.sha256, 'kind', r.kind);
end $$;

create or replace function api.client_logout(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare n integer;
begin
  perform private.kill_switch('client_area_enabled');
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then raise exception 'invalid_input:token' using errcode = 'PT400'; end if;
  update crm.client_sessions set revoked_at = now() where token_hash = p_token_hash and revoked_at is null;
  get diagnostics n = row_count;
  return jsonb_build_object('revoked', n > 0);
end $$;

-- ---------------------------------------------------------------- staff: sign a client out everywhere
create or replace function staff.client_sessions_revoke(p_customer uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); n integer;
begin
  if p_customer is null then raise exception 'invalid_input:customer' using errcode = 'PT400'; end if;
  update crm.client_sessions s set revoked_at = now()
   where s.customer_id = p_customer and s.agency_id = private.my_agency_id() and s.revoked_at is null;
  get diagnostics n = row_count;
  perform private.audit_action('crm.client_sessions', p_customer::text, array['revoked_at'], jsonb_build_object('action', 'client_sessions_revoke', 'count', n));
  return jsonb_build_object('revoked', n);
end $$;

-- ---------------------------------------------------------------- retention (switch-gated; nothing deleted until the owner opens it)
-- challenges after 1 day (their encrypted mobile is cleared at verification anyway), sessions 30 days past expiry or revocation
create or replace function ops.client_area_cleanup()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n_ch bigint := 0; n_se bigint := 0;
begin
  if private.flag('client_area_retention_enabled') then
    delete from crm.client_login_challenges where created_at < now() - interval '1 day';
    get diagnostics n_ch = row_count;
    delete from crm.client_sessions where expires_at < now() - interval '30 days' or revoked_at < now() - interval '30 days';
    get diagnostics n_se = row_count;
  end if;
  return jsonb_build_object('challenges', n_ch, 'sessions', n_se);
end $$;
revoke all on function ops.client_area_cleanup() from public, anon, authenticated;
select cron.schedule('client-area-cleanup', '23 3 * * *', 'select ops.client_area_cleanup()');

-- ---------------------------------------------------------------- grants
revoke all on function api.client_area_config(), api.client_login_start(text, text, text, bytea), api.client_login_challenge_use(uuid),
  api.client_login_verify(uuid, bytea, text, text), api.client_session_get(bytea), api.client_portfolio_get(bytea),
  api.client_documents_list(bytea), api.client_document_get(bytea, uuid), api.client_logout(bytea)
  from public, anon, authenticated;
grant execute on function api.client_area_config(), api.client_login_start(text, text, text, bytea), api.client_login_challenge_use(uuid),
  api.client_login_verify(uuid, bytea, text, text), api.client_session_get(bytea), api.client_portfolio_get(bytea),
  api.client_documents_list(bytea), api.client_document_get(bytea, uuid), api.client_logout(bytea)
  to service_role;
revoke all on function staff.client_sessions_revoke(uuid) from public, anon;
grant execute on function staff.client_sessions_revoke(uuid) to authenticated;
