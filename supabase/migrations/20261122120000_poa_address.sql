-- Address in the POA wizard (owner decision 2026-11-22): street + house number and the city are asked in ס1 and required by
-- poa-intake (parseStart). Here api.poa_session_start accepts them inside p_identity ({street, city}, each 1-80 chars when
-- present) and keeps them inside the encrypted identity blob with the rest (identity_enc). No new column: the address is
-- PII like the names and lives only in the encrypted JSON. The database side stays lenient (absent = fine) so the function
-- is the one place that decides what is required; the pgTAP tests of the flow are unchanged by this.
-- Applying needs no secret.

create or replace function api.poa_session_start(p_token_hash bytea, p_identity jsonb, p_national_id text, p_phone text,
                                                 p_ua_hash bytea, p_ip text, p_marketing boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_agency uuid := coalesce((select c.value::uuid from ops.config c where c.key = 'default_agency_id'), '5eed0000-0000-4000-8000-000000000001'::uuid);
  v_first text; v_last text; v_email text; v_street text; v_city text; v_hmac bytea; v_phone_hmac bytea; v_local text; v_ip text; v_ip_enc bytea;
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
  v_street := nullif(btrim(coalesce(p_identity ->> 'street', '')), '');
  v_city := nullif(btrim(coalesce(p_identity ->> 'city', '')), '');
  if char_length(v_first) not between 1 and 80 then raise exception 'invalid_input:first_name' using errcode = 'PT400'; end if;
  if char_length(v_last) not between 1 and 80 then raise exception 'invalid_input:last_name' using errcode = 'PT400'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') then
    raise exception 'invalid_input:email' using errcode = 'PT400';
  end if;
  if v_street is not null and char_length(v_street) > 80 then raise exception 'invalid_input:street' using errcode = 'PT400'; end if;
  if v_city is not null and char_length(v_city) > 80 then raise exception 'invalid_input:city' using errcode = 'PT400'; end if;
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
                                                 'phone', p_phone, 'street', v_street, 'city', v_city, 'marketing_approved', v_marketing)::text),
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
