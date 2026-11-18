-- FOUNDATION 07: the exposed API layer. This is the ONLY schema PostgREST should expose.
-- Views are security_invoker, so row policies of the base tables apply to the caller. They keep the old table names,
-- so the site cutover is: createClient(url, key, { db: { schema: 'api' } }).

-- public site data -----------------------------------------------------------------
create view api.blog_posts          with (security_invoker = true) as select * from content.blog_posts;
create view api.travel_companies    with (security_invoker = true) as select * from content.travel_companies;
create view api.investment_tracks   with (security_invoker = true) as select * from content.investment_tracks;
create view api.cma_sync_log        with (security_invoker = true) as select * from content.cma_sync_log;
create view api.cma_funds_latest    with (security_invoker = true) as select * from content.cma_funds_latest;
create view api.cma_board           with (security_invoker = true) as select * from content.cma_board;
create view api.cma_company_map     with (security_invoker = true) as select * from content.cma_company_map;

grant select on api.blog_posts, api.travel_companies, api.investment_tracks, api.cma_sync_log,
                api.cma_funds_latest, api.cma_board, api.cma_company_map to anon, authenticated;
-- staff writes through the same views (base-table RLS decides)
grant insert, update, delete on api.blog_posts, api.travel_companies to authenticated;

-- private, staff-only ------------------------------------------------------------------
create view api.leads with (security_invoker = true) as
  select * from crm.leads where deleted_at is null;
grant select on api.leads to authenticated;
grant update (status, assigned_to, notes, deleted_at) on api.leads to authenticated;

-- service role keeps full access to the api schema objects
grant all on all tables in schema api to service_role;

-- who am I (UI uses it to decide what to render; authorization itself stays in RLS) --------
create or replace function api.me()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'user_id', (select auth.uid()),
    'staff_role', private.staff_role(),
    'aal', private.jwt_aal(),
    'is_client', private.is_client()
  )
$$;
revoke all on function api.me() from public, anon;
grant execute on function api.me() to authenticated, service_role;

-- lead intake: the ONLY write path for anonymous visitors -----------------------------------
-- Contract: returns {"ok":true,"id":<uuid|null>} ; errors use SQLSTATE PTnnn so PostgREST answers with that HTTP status:
--   PT400 invalid_input:<field>   PT429 rate_limited
-- Honeypot (p_hp non-empty) returns ok without storing anything. Same person + same kind within 10 minutes = same id.
create or replace function api.submit_lead(
  p_kind            text,
  p_full_name       text,
  p_phone           text default null,
  p_email           text default null,
  p_message         text default null,
  p_payload         jsonb default '{}'::jsonb,
  p_consent         boolean default false,
  p_consent_version text default 'v1',
  p_source          text default null,
  p_utm             jsonb default '{}'::jsonb,
  p_hp              text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ip      text := coalesce(private.client_ip(), 'unknown');
  v_name    text := btrim(coalesce(p_full_name, ''));
  v_phone   text;
  v_email   text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_msg     text := nullif(btrim(coalesce(p_message, '')), '');
  v_id      uuid;
  v_pepper  text;
begin
  if coalesce(btrim(p_hp), '') <> '' then
    return jsonb_build_object('ok', true, 'id', null);   -- bot: pretend success, store nothing
  end if;

  if not private.check_rate_limit('lead_ip', v_ip, 8, interval '10 minutes')
     or not private.check_rate_limit('lead_all', 'all', 300, interval '1 hour') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;

  if p_kind is null or p_kind not in ('insurance', 'pension', 'contact', 'portfolio_review', 'report') then
    raise exception 'invalid_input:kind' using errcode = 'PT400';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid_input:full_name' using errcode = 'PT400';
  end if;
  if coalesce(p_consent, false) is not true then
    raise exception 'invalid_input:consent' using errcode = 'PT400';
  end if;

  -- Israeli phone: strip formatting, +972/972 prefix -> 0
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_phone := regexp_replace(v_phone, '^(\+972|972)', '0');
  v_phone := nullif(v_phone, '');
  if v_phone is not null and v_phone !~ '^0[2-9][0-9]{7,8}$' then
    raise exception 'invalid_input:phone' using errcode = 'PT400';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'invalid_input:email' using errcode = 'PT400';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'invalid_input:contact' using errcode = 'PT400';
  end if;
  if v_msg is not null and char_length(v_msg) > 4000 then
    raise exception 'invalid_input:message' using errcode = 'PT400';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 16000 then
    raise exception 'invalid_input:payload' using errcode = 'PT400';
  end if;
  if p_utm is null or jsonb_typeof(p_utm) <> 'object' or octet_length(p_utm::text) > 2000 then
    raise exception 'invalid_input:utm' using errcode = 'PT400';
  end if;
  if char_length(coalesce(p_source, '')) > 300 or char_length(coalesce(p_consent_version, 'v1')) > 40 then
    raise exception 'invalid_input:source' using errcode = 'PT400';
  end if;

  -- idempotency: the same person double-clicking or retrying gets the same id
  select l.id into v_id
  from crm.leads l
  where l.kind = p_kind
    and l.created_at > now() - interval '10 minutes'
    and ((v_email is not null and lower(l.email) = v_email) or (v_phone is not null and l.phone = v_phone))
  order by l.created_at desc
  limit 1;
  if v_id is not null then
    return jsonb_build_object('ok', true, 'id', v_id, 'duplicate', true);
  end if;

  select value into v_pepper from ops.config where key = 'rate_limit_pepper';

  insert into crm.leads (kind, full_name, phone, email, message, payload, source, utm,
                         consent_at, consent_version, ip_hash)
  values (p_kind, v_name, v_phone, v_email, v_msg, p_payload, nullif(p_source, ''), p_utm,
          now(), coalesce(nullif(p_consent_version, ''), 'v1'),
          extensions.hmac(convert_to(v_ip, 'utf8'), convert_to(coalesce(v_pepper, ''), 'utf8'), 'sha256'))
  returning id into v_id;

  perform private.enqueue('lead.created', jsonb_build_object('lead_id', v_id, 'kind', p_kind));
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;
comment on function api.submit_lead is 'Public lead intake. Exposed to anon ON PURPOSE (documented advisor exception). Revoke anon execute once the Turnstile edge function fronts it.';
revoke all on function api.submit_lead(text, text, text, text, text, jsonb, boolean, text, text, jsonb, text) from public;
grant execute on function api.submit_lead(text, text, text, text, text, jsonb, boolean, text, text, jsonb, text)
  to anon, authenticated, service_role;
