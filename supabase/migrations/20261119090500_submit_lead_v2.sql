-- V2-06 (ADR-21, ADR-35): lead intake v2, service_role only; idempotency checked before Turnstile; closed payload keys.
create table ops.idempotency_keys (
  key          text primary key check (char_length(key) between 8 and 128),
  request_hash bytea not null,
  response     jsonb not null,
  created_at   timestamptz not null default now()
);
create index idempotency_keys_created_idx on ops.idempotency_keys (created_at);
alter table ops.idempotency_keys enable row level security;
revoke all on ops.idempotency_keys from anon, authenticated;
grant select, insert, update, delete on ops.idempotency_keys to service_role;
create policy deny_api_roles on ops.idempotency_keys for all to anon, authenticated using (false) with check (false);

-- closed allowlist of kind-specific keys inside payload.payload. No national id, no health or bank data, ever.
create table ops.intake_payload_keys (
  kind text not null check (kind in ('insurance', 'pension', 'contact', 'portfolio_review', 'report')),
  key  text not null check (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  primary key (kind, key)
);
alter table ops.intake_payload_keys enable row level security;
revoke all on ops.intake_payload_keys from anon, authenticated;
grant select on ops.intake_payload_keys to service_role;
create policy deny_api_roles on ops.intake_payload_keys for all to anon, authenticated using (false) with check (false);
insert into ops.intake_payload_keys (kind, key)
select k, unnest(v) from (values
  ('insurance', array['insurance_type', 'vehicle_type', 'vehicle_year', 'property_type', 'property_size_sqm', 'business_type',
                      'business_employees', 'destination', 'travel_start_date', 'travel_end_date', 'travelers_count',
                      'preferred_contact_time', 'page']),
  ('pension', array['focus_area', 'age_range', 'situation', 'concern', 'employment_status', 'retirement_age', 'risk_tolerance',
                    'primary_goals', 'children_count', 'preferred_contact_time', 'page']),
  ('contact', array['subject', 'page']),
  ('portfolio_review', array['subject', 'page']),
  ('report', array['subject', 'page'])) t(k, v);

-- client address for PostgREST-direct callers only: cf-connecting-ip, else the LAST public hop of x-forwarded-for.
create or replace function private.is_public_ip(p text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare a inet;
begin
  a := btrim(p)::inet;
  return not (a << '10.0.0.0/8'::inet or a << '172.16.0.0/12'::inet or a << '192.168.0.0/16'::inet
           or a << '127.0.0.0/8'::inet or a << '100.64.0.0/10'::inet or a << '169.254.0.0/16'::inet
           or a <<= '::1/128'::inet or a << 'fc00::/7'::inet or a << 'fe80::/10'::inet);
exception when others then
  return false;
end $$;

create or replace function private.client_ip()
returns text language sql stable set search_path = '' as $$
  with h as (select nullif(current_setting('request.headers', true), '')::jsonb j)
  select coalesce(
    nullif(btrim(h.j ->> 'cf-connecting-ip'), ''),
    (select btrim(x.v) from unnest(string_to_array(h.j ->> 'x-forwarded-for', ',')) with ordinality x(v, n)
      where private.is_public_ip(x.v) order by x.n desc limit 1))
  from h
$$;
revoke all on function private.is_public_ip(text), private.client_ip() from public, anon, authenticated;

-- the address a service_role caller asserts. Blank = PT400: one shared 'unknown' bucket would rate-limit every visitor at once.
create or replace function private.caller_ip(p_client_ip text)
returns text language plpgsql stable set search_path = '' as $$
begin
  if (select auth.jwt() ->> 'role') = 'service_role' then
    if nullif(btrim(coalesce(p_client_ip, '')), '') is null then
      raise exception 'invalid_input:client_ip' using errcode = 'PT400';
    end if;
    return left(btrim(p_client_ip), 64);
  end if;
  return coalesce(private.client_ip(), 'unknown');
end $$;
revoke all on function private.caller_ip(text) from public, anon, authenticated;

-- canonical request hash: jsonb normalises key order and whitespace, so the same form fields always hash the same.
create or replace function private.lead_request_hash(p_payload jsonb)
returns bytea language sql immutable set search_path = '' as $$
  select extensions.digest(convert_to(p_payload::text, 'utf8'), 'sha256')
$$;
revoke all on function private.lead_request_hash(jsonb) from public, anon, authenticated;

-- lead-intake calls this BEFORE Turnstile: a retry with the same Idempotency-Key gets the stored answer
-- without spending a (single-use) Turnstile token.
create or replace function api.lead_replay(p_idem_key text, p_payload jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_prev record;
begin
  if p_idem_key is null or char_length(p_idem_key) not between 8 and 128 or p_payload is null then
    raise exception 'invalid_input:idempotency_key' using errcode = 'PT400';
  end if;
  select k.request_hash, k.response into v_prev from ops.idempotency_keys k
   where k.key = p_idem_key and k.created_at > now() - interval '48 hours';
  if not found then return null; end if;
  if v_prev.request_hash <> private.lead_request_hash(p_payload) then
    raise exception 'idempotency_conflict' using errcode = 'PT409';
  end if;
  return v_prev.response || jsonb_build_object('replay', true);
end $$;

-- rejections (403 origin/turnstile, 400, 429) are rolled back inside submit_lead, so lead-intake records them here,
-- in a separate request that commits. The watchdog alerts on the hourly total.
create or replace function api.intake_note_reject(p_reason text, p_client_ip text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_reason is null or p_reason not in ('origin', 'turnstile', 'invalid_input', 'idempotency_conflict', 'rate_limited', 'feature_disabled') then
    raise exception 'invalid_input:reason' using errcode = 'PT400';
  end if;
  perform private.check_rate_limit('intake_reject', p_reason, 2147483647, interval '1 hour');
  perform private.check_rate_limit('intake_reject_ip', coalesce(nullif(btrim(p_client_ip), ''), 'unknown'), 2147483647, interval '1 hour');
end $$;

create or replace function api.submit_lead(p_payload jsonb, p_idem_key text, p_client_ip text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_hash bytea; v_prev record; v_ip text; v_kind text; v_name text; v_phone text; v_email text; v_msg text;
  v_extra jsonb; v_utm jsonb; v_source text; v_cv text; v_req text; v_agency uuid; v_pepper text; v_id uuid; v_resp jsonb;
begin
  perform private.kill_switch('intake_enabled');
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 24000 then
    raise exception 'invalid_input:payload' using errcode = 'PT400';
  end if;
  if p_idem_key is null or char_length(p_idem_key) not between 8 and 128 then
    raise exception 'invalid_input:idempotency_key' using errcode = 'PT400';
  end if;
  -- canonical form fields only: never turnstile_token, headers or per-attempt values (they would break the replay hash)
  if exists (select 1 from jsonb_object_keys(p_payload) k
              where k not in ('kind', 'full_name', 'phone', 'email', 'message', 'payload', 'utm', 'consent',
                              'consent_version', 'source', 'hp')) then
    raise exception 'invalid_input:payload_key' using errcode = 'PT400';
  end if;
  v_ip := private.caller_ip(p_client_ip);

  v_hash := private.lead_request_hash(p_payload);
  perform pg_advisory_xact_lock(hashtextextended('submit_lead:' || p_idem_key, 0));
  select k.request_hash, k.response into v_prev from ops.idempotency_keys k
   where k.key = p_idem_key and k.created_at > now() - interval '48 hours';
  if found then
    if v_prev.request_hash <> v_hash then raise exception 'idempotency_conflict' using errcode = 'PT409'; end if;
    return v_prev.response || jsonb_build_object('replay', true);
  end if;

  if coalesce(btrim(p_payload ->> 'hp'), '') <> '' then
    return jsonb_build_object('ok', true, 'id', null);
  end if;

  -- validation runs before the rate-limit counters (a rejected call rolls back its increment anyway)
  v_kind   := p_payload ->> 'kind';
  v_name   := btrim(coalesce(p_payload ->> 'full_name', ''));
  v_email  := nullif(lower(btrim(coalesce(p_payload ->> 'email', ''))), '');
  v_msg    := nullif(btrim(coalesce(p_payload ->> 'message', '')), '');
  v_extra  := coalesce(p_payload -> 'payload', '{}'::jsonb);
  v_utm    := coalesce(p_payload -> 'utm', '{}'::jsonb);
  v_source := nullif(p_payload ->> 'source', '');
  v_cv     := coalesce(nullif(p_payload ->> 'consent_version', ''), 'v1');

  if v_kind is null or v_kind not in ('insurance', 'pension', 'contact', 'portfolio_review', 'report') then
    raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid_input:full_name' using errcode = 'PT400'; end if;
  if (p_payload -> 'consent') is distinct from 'true'::jsonb then
    raise exception 'invalid_input:consent' using errcode = 'PT400'; end if;
  v_phone := regexp_replace(coalesce(p_payload ->> 'phone', ''), '[^0-9+]', '', 'g');
  v_phone := nullif(regexp_replace(v_phone, '^(\+972|972)', '0'), '');
  if v_phone is not null and v_phone !~ '^0[2-9][0-9]{7,8}$' then
    raise exception 'invalid_input:phone' using errcode = 'PT400'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') then
    raise exception 'invalid_input:email' using errcode = 'PT400'; end if;
  if v_phone is null and v_email is null then
    raise exception 'invalid_input:contact' using errcode = 'PT400'; end if;
  if v_msg is not null and char_length(v_msg) > 4000 then
    raise exception 'invalid_input:message' using errcode = 'PT400'; end if;
  -- payload.payload: flat object, keys from ops.intake_payload_keys for this kind, scalar values up to 200 chars,
  -- and no string that looks like an Israeli national id (8-9 digits)
  if jsonb_typeof(v_extra) <> 'object' or octet_length(v_extra::text) > 4000 then
    raise exception 'invalid_input:payload' using errcode = 'PT400'; end if;
  if exists (select 1 from jsonb_object_keys(v_extra) k
              where not exists (select 1 from ops.intake_payload_keys a where a.kind = v_kind and a.key = k)) then
    raise exception 'invalid_input:payload_key' using errcode = 'PT400'; end if;
  if exists (select 1 from jsonb_each(v_extra) e
              where jsonb_typeof(e.value) not in ('string', 'number', 'boolean', 'null')
                 or (jsonb_typeof(e.value) = 'string' and (char_length(e.value #>> '{}') > 200
                                                           or (e.value #>> '{}') ~ '^[[:space:]]*[0-9]{8,9}[[:space:]]*$'))) then
    raise exception 'invalid_input:payload_value' using errcode = 'PT400'; end if;
  if jsonb_typeof(v_utm) <> 'object' or exists (
       select 1 from jsonb_each(v_utm) e
        where e.key not in ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref')
           or jsonb_typeof(e.value) <> 'string' or char_length(e.value #>> '{}') > 100) then
    raise exception 'invalid_input:utm' using errcode = 'PT400'; end if;
  if char_length(coalesce(v_source, '')) > 300 or char_length(v_cv) > 40 then
    raise exception 'invalid_input:source' using errcode = 'PT400'; end if;

  if not private.check_rate_limit('lead_ip', v_ip, 8, interval '10 minutes')
     or not private.check_rate_limit('lead_all', 'all', 300, interval '1 hour') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;

  v_req := private.request_id();
  v_agency := (select value::uuid from ops.config where key = 'default_agency_id');
  if v_agency is null then raise exception 'config_missing:default_agency_id' using errcode = '55000'; end if;

  -- second net: same person + same kind within 10 minutes = same lead
  select l.id into v_id from crm.leads l
   where l.kind = v_kind and l.created_at > now() - interval '10 minutes'
     and ((v_email is not null and lower(l.email) = v_email) or (v_phone is not null and l.phone = v_phone))
   order by l.created_at desc limit 1;
  if v_id is not null then
    v_resp := jsonb_build_object('ok', true, 'id', v_id, 'duplicate', true);
  else
    select value into v_pepper from ops.config where key = 'rate_limit_pepper';
    insert into crm.leads (agency_id, kind, full_name, phone, email, message, payload, source, utm,
                           consent_at, consent_version, ip_hash, request_id)
    values (v_agency, v_kind, v_name, v_phone, v_email, v_msg, v_extra, v_source, v_utm, now(), v_cv,
            extensions.hmac(convert_to(v_ip, 'utf8'), convert_to(coalesce(v_pepper, ''), 'utf8'), 'sha256'), v_req)
    returning id into v_id;
    perform private.enqueue('lead.created', jsonb_build_object('lead_id', v_id, 'kind', v_kind, 'request_id', v_req));
    v_resp := jsonb_build_object('ok', true, 'id', v_id);
  end if;

  insert into ops.idempotency_keys (key, request_hash, response) values (p_idem_key, v_hash, v_resp)
  on conflict (key) do update set request_hash = excluded.request_hash, response = excluded.response, created_at = now()
   where ops.idempotency_keys.created_at <= now() - interval '48 hours';
  return v_resp;
end $$;

drop function api.submit_lead(text, text, text, text, text, jsonb, boolean, text, text, jsonb, text);
revoke all on function api.submit_lead(jsonb, text, text), api.lead_replay(text, jsonb), api.intake_note_reject(text, text)
  from public, anon, authenticated;
grant execute on function api.submit_lead(jsonb, text, text), api.lead_replay(text, jsonb), api.intake_note_reject(text, text)
  to service_role;
comment on function api.submit_lead(jsonb, text, text) is 'Lead intake v2. service_role only, called by lead-intake after Origin, api.lead_replay and Turnstile. p_client_ip is required. Errors: PT400 invalid_input:<field>, PT409 idempotency_conflict, PT423 feature_disabled:intake_enabled, PT429 rate_limited.';
