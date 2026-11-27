-- V3-07: the personal-area dashboard and client requests (owner approved 2026-11-27, prototype v5).
--   1. Product type / source repair. Surense sends `type` and `source` of a portfolio product as objects ({code, description,
--      ...}), not as the integer / enum string the OpenAPI file promises, so the mirror stored NULL in
--      crm.surense_products.product_type and .source for every row (mirror.ts read only a bare number / string). The full
--      responses are kept encrypted in crm.surense_portfolios.snapshot_enc, so the columns are filled from there:
--      private.surense_products_type_backfill() fills NULLs only (latest snapshot per product id), runs once below, and is
--      safe to run again. The worker fix (mirror.ts code()/source description) keeps new rows right.
--   2. Client requests from /my (the "פנייה לסוכן" sheet). A request is an ordinary crm.leads row (source 'client_area',
--      kind by topic: insurance -> insurance desk, savings -> pension (finance desk), details / other -> contact (general)),
--      so it reaches the right desk by the existing lead.created e-mail (notify-worker, NOTIFY_TO_*), shows in the staff
--      leads list, and its status there is what the client sees: 'new' -> received, anything else -> done.
--      The lead takes the client's name, mobile and e-mail from crm.customers (the client types none of them).
--        api.client_request_create(token_hash, topic, message, contact)  service_role (client-area POST /requests)
--        api.client_requests_list(token_hash)                            service_role (client-area GET /requests)
--      (A text message to the desk's mobile is a follow-up: the Micropay sending API, scheduleSms.php, is not documented
--      in our files yet, and nothing is sent on a guess.)
-- Switch (ops.config; a missing key reads closed): client_area_requests_enabled = 'false'. While off, GET answers
-- {enabled:false} and POST raises feature_disabled; the rest of /my works as before.
-- Error codes: PT400 invalid_input:<field>, PT423 feature_disabled:<key>, PT429 rate_limited, PT401 session_inactive.
-- No deletes. Synthetic values only in supabase/tests/18_client_area_dashboard.test.sql.

insert into ops.config (key, value) values ('client_area_requests_enabled', 'false')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- 1. product type / source from the stored snapshots
create or replace function private.surense_products_type_backfill()
returns integer language plpgsql volatile security definer set search_path = '' as $$
declare n integer;
begin
  with snap as (
    select x, p.fetched_at
      from crm.surense_portfolios p
     cross join lateral (select private.pii_decrypt(p.snapshot_enc)::jsonb as j) d
     cross join lateral jsonb_array_elements(case when jsonb_typeof(d.j -> 'products') = 'array' then d.j -> 'products'
                                                  else '[]'::jsonb end) x
  ), latest as (
    select distinct on (x ->> 'id') (x ->> 'id') as pid,
           case when jsonb_typeof(x -> 'type') = 'number' then (x ->> 'type')::numeric
                when jsonb_typeof(x -> 'type' -> 'code') = 'number' then (x -> 'type' ->> 'code')::numeric end as type_code,
           case when jsonb_typeof(x -> 'source') = 'string' then x ->> 'source'
                when jsonb_typeof(x -> 'source' -> 'description') = 'string' then replace(btrim(x -> 'source' ->> 'description'), ' ', '_')
           end as source_label
      from snap
     where (x ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     order by x ->> 'id', fetched_at desc
  )
  update crm.surense_products sp
     set product_type = coalesce(sp.product_type,
                                 case when l.type_code between 1 and 1000 and l.type_code = trunc(l.type_code) then l.type_code::integer end),
         source = coalesce(sp.source, case when char_length(l.source_label) between 1 and 40 then l.source_label end)
    from latest l
   where sp.id = l.pid::uuid
     and ((sp.product_type is null and l.type_code is not null) or (sp.source is null and l.source_label is not null));
  get diagnostics n = row_count;
  return n;
end $$;

select private.surense_products_type_backfill();

-- ---------------------------------------------------------------- 2. client requests
-- the four topics of the request sheet -> the lead kind (= the desk that gets it); NULL = not a topic
create or replace function private.client_request_kind(p_topic text)
returns text language sql immutable set search_path = '' as $$
  select case p_topic when 'insurance' then 'insurance' when 'savings' then 'pension'
                      when 'details' then 'contact' when 'other' then 'contact' end
$$;

create or replace function api.client_request_create(p_token_hash bytea, p_topic text, p_message text, p_contact text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; c crm.customers; v_kind text; v_msg text; v_id uuid; v_at timestamptz; v_req text;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  perform private.kill_switch('client_area_requests_enabled');
  v_kind := private.client_request_kind(p_topic);
  if v_kind is null then raise exception 'invalid_input:topic' using errcode = 'PT400'; end if;
  if p_contact is null or p_contact not in ('phone', 'whatsapp', 'email') then
    raise exception 'invalid_input:contact' using errcode = 'PT400'; end if;
  v_msg := nullif(btrim(coalesce(p_message, '')), '');
  if v_msg is not null and char_length(v_msg) > 1000 then raise exception 'invalid_input:message' using errcode = 'PT400'; end if;
  if not private.check_rate_limit('client_request', s.customer_id::text, 6, interval '1 day') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  select * into c from crm.customers where id = s.customer_id;
  if not found or (c.mobile_phone is null and c.email is null) then raise exception 'session_inactive' using errcode = 'PT401'; end if;

  v_req := private.request_id();
  insert into crm.leads (agency_id, kind, full_name, phone, email, message, payload, source, consent_at, consent_version, request_id)
  values (s.agency_id, v_kind, left(c.first_name || ' ' || c.last_name, 120), c.mobile_phone, c.email, v_msg,
          jsonb_build_object('origin', 'client_area', 'customer_id', s.customer_id, 'topic', p_topic, 'contact', p_contact),
          'client_area', now(), 'client-area-1', v_req)
  returning id, created_at into v_id, v_at;
  perform private.enqueue('lead.created', jsonb_build_object('lead_id', v_id, 'kind', v_kind, 'request_id', v_req));
  perform private.log_access('client_request_create', 'crm.leads', array[s.customer_id]);
  return jsonb_build_object('id', v_id, 'created_at', v_at);
end $$;

-- the client's own requests, newest first (30): topic, their own message, how they asked to be contacted, received/done
create or replace function api.client_requests_list(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.client_sessions; v jsonb;
begin
  perform private.kill_switch('client_area_enabled');
  s := private.client_session_of(p_token_hash);
  if not private.flag('client_area_requests_enabled') then
    return jsonb_build_object('enabled', false, 'requests', '[]'::jsonb);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', l.id, 'topic', l.payload ->> 'topic', 'message', l.message, 'contact', l.payload ->> 'contact',
           'created_at', l.created_at, 'status', case when l.status = 'new' then 'received' else 'done' end)
         order by l.created_at desc), '[]'::jsonb) into v
    from (select x.* from crm.leads x
           where x.source = 'client_area' and x.payload ->> 'customer_id' = s.customer_id::text
             and x.deleted_at is null and x.status <> 'spam'
           order by x.created_at desc limit 30) l;
  return jsonb_build_object('enabled', true, 'requests', v);
end $$;

-- ---------------------------------------------------------------- grants
revoke all on function private.surense_products_type_backfill(), private.client_request_kind(text)
  from public, anon, authenticated, service_role;
revoke all on function api.client_request_create(bytea, text, text, text), api.client_requests_list(bytea)
  from public, anon, authenticated;
grant execute on function api.client_request_create(bytea, text, text, text), api.client_requests_list(bytea) to service_role;
