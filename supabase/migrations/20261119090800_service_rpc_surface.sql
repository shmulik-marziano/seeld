-- V2-09 (ADR-22): RPCs that edge functions call with SEELD_SECRET_KEY live in an exposed schema: api, service_role only.
-- chat storage (90-day retention, session_hash only)
create table crm.chat_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_hash  bytea not null unique,
  message_count integer not null default 0,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);
create index chat_sessions_last_seen_idx on crm.chat_sessions (last_seen_at);
create table crm.chat_messages (
  id         bigint generated always as identity primary key,
  session_id uuid not null references crm.chat_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index chat_messages_session_idx on crm.chat_messages (session_id, created_at);
create index chat_messages_created_idx on crm.chat_messages (created_at);
alter table crm.chat_sessions enable row level security;
alter table crm.chat_messages enable row level security;
revoke all on crm.chat_sessions, crm.chat_messages from anon, authenticated;
grant select, insert, update, delete on crm.chat_sessions, crm.chat_messages to service_role;
create policy deny_api_roles on crm.chat_sessions for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on crm.chat_messages for all to anon, authenticated using (false) with check (false);

create or replace function api.outbox_claim(p_limit integer default 20)
returns table (id bigint, topic text, payload jsonb, attempts integer, locked_until timestamptz)
language sql volatile security definer set search_path = '' as $$
  select o.id, o.topic, o.payload, o.attempts, o.locked_until from ops.outbox_claim(p_limit) o
$$;
create or replace function api.outbox_complete(p_id bigint, p_ok boolean, p_error text default null)
returns void language sql volatile security definer set search_path = '' as $$ select ops.outbox_complete(p_id, p_ok, p_error) $$;
create or replace function api.job_finish(p_run bigint, p_ok boolean, p_stats jsonb default '{}'::jsonb, p_error text default null)
returns void language sql volatile security definer set search_path = '' as $$ select ops.job_finish(p_run, p_ok, p_stats, p_error) $$;
create or replace function api.job_continue(p_run bigint, p_name text, p_cursor jsonb)
returns bigint language sql volatile security definer set search_path = '' as $$ select ops.job_continue(p_run, p_name, p_cursor) $$;

-- deterministic: within one batch the LAST occurrence of (fund_id, report_period, source) wins
create or replace function api.cma_upsert_batch(p_rows jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare n integer;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 5000 then
    raise exception 'invalid_input:rows' using errcode = 'PT400';
  end if;
  insert into content.cma_funds as f (fund_id, fund_name, fund_classification, managing_company, managing_company_id, source,
    product_type, specialization, sub_specialization, target_population, report_period, inception_date, total_assets, deposits,
    withdrawals, internal_transfers, net_monthly_deposits, monthly_yield, ytd_yield, yield_trailing_3yrs, yield_trailing_5yrs,
    avg_annual_yield_3yrs, avg_annual_yield_5yrs, avg_annual_management_fee, avg_deposit_fee, standard_deviation, alpha,
    sharpe_ratio, liquid_assets_percent, stock_market_exposure, foreign_exposure, foreign_currency_exposure, actuarial_adjustment, fetched_at)
  select distinct on (r.fund_id, r.report_period, r.source)
    r.fund_id, r.fund_name, r.fund_classification, r.managing_company, r.managing_company_id, r.source,
    r.product_type, r.specialization, r.sub_specialization, r.target_population, r.report_period, r.inception_date, r.total_assets, r.deposits,
    r.withdrawals, r.internal_transfers, r.net_monthly_deposits, r.monthly_yield, r.ytd_yield, r.yield_trailing_3yrs, r.yield_trailing_5yrs,
    r.avg_annual_yield_3yrs, r.avg_annual_yield_5yrs, r.avg_annual_management_fee, r.avg_deposit_fee, r.standard_deviation, r.alpha,
    r.sharpe_ratio, r.liquid_assets_percent, r.stock_market_exposure, r.foreign_exposure, r.foreign_currency_exposure, r.actuarial_adjustment, now()
  from jsonb_array_elements(p_rows) with ordinality as e(j, ord)
  cross join lateral jsonb_to_record(e.j) as r(fund_id text, fund_name text, fund_classification text, managing_company text,
    managing_company_id text, source text, product_type text, specialization text, sub_specialization text, target_population text,
    report_period integer, inception_date text, total_assets numeric, deposits numeric, withdrawals numeric, internal_transfers numeric,
    net_monthly_deposits numeric, monthly_yield numeric, ytd_yield numeric, yield_trailing_3yrs numeric, yield_trailing_5yrs numeric,
    avg_annual_yield_3yrs numeric, avg_annual_yield_5yrs numeric, avg_annual_management_fee numeric, avg_deposit_fee numeric,
    standard_deviation numeric, alpha numeric, sharpe_ratio numeric, liquid_assets_percent numeric, stock_market_exposure numeric,
    foreign_exposure numeric, foreign_currency_exposure numeric, actuarial_adjustment numeric)
  order by r.fund_id, r.report_period, r.source, e.ord desc
  on conflict (fund_id, report_period, source) do update set
    (fund_name, fund_classification, managing_company, managing_company_id, product_type, specialization, sub_specialization,
     target_population, inception_date, total_assets, deposits, withdrawals, internal_transfers, net_monthly_deposits, monthly_yield,
     ytd_yield, yield_trailing_3yrs, yield_trailing_5yrs, avg_annual_yield_3yrs, avg_annual_yield_5yrs, avg_annual_management_fee,
     avg_deposit_fee, standard_deviation, alpha, sharpe_ratio, liquid_assets_percent, stock_market_exposure, foreign_exposure,
     foreign_currency_exposure, actuarial_adjustment, fetched_at)
  = (excluded.fund_name, excluded.fund_classification, excluded.managing_company, excluded.managing_company_id, excluded.product_type,
     excluded.specialization, excluded.sub_specialization, excluded.target_population, excluded.inception_date, excluded.total_assets,
     excluded.deposits, excluded.withdrawals, excluded.internal_transfers, excluded.net_monthly_deposits, excluded.monthly_yield,
     excluded.ytd_yield, excluded.yield_trailing_3yrs, excluded.yield_trailing_5yrs, excluded.avg_annual_yield_3yrs,
     excluded.avg_annual_yield_5yrs, excluded.avg_annual_management_fee, excluded.avg_deposit_fee, excluded.standard_deviation,
     excluded.alpha, excluded.sharpe_ratio, excluded.liquid_assets_percent, excluded.stock_market_exposure, excluded.foreign_exposure,
     excluded.foreign_currency_exposure, excluded.actuarial_adjustment, excluded.fetched_at);
  get diagnostics n = row_count;
  return jsonb_build_object('upserted', n);
end $$;

-- light on purpose: no matview refresh inside a PostgREST request (statement_timeout). It flags the refresh;
-- the ops-watchdog step cma_refresh runs it within 10 minutes (pg_cron session, no PostgREST timeout).
create or replace function api.cma_finish_sync(p_source text, p_status text, p_stats jsonb default '{}'::jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_refresh boolean;
begin
  if p_status is null or p_status not in ('success', 'error', 'partial') then
    raise exception 'invalid_input:status' using errcode = 'PT400';
  end if;
  v_refresh := p_status in ('success', 'partial');
  insert into content.cma_sync_log (source, status, records_fetched, records_upserted, latest_period, error_message, duration_ms, completed_at)
  values (left(coalesce(p_source, 'unknown'), 100), p_status, (p_stats ->> 'records_fetched')::int, (p_stats ->> 'records_upserted')::int,
          (p_stats ->> 'latest_period')::int, left(p_stats ->> 'error_message', 500), (p_stats ->> 'duration_ms')::int, now());
  if v_refresh then
    insert into ops.config (key, value) values ('cma_refresh_pending', 'true')
    on conflict (key) do update set value = 'true', updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'refresh_scheduled', v_refresh);
end $$;

create or replace function api.chat_session_touch(p_session_key text, p_client_ip text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_pepper text; v_id uuid; v_count integer; v_ip text;
begin
  perform private.kill_switch('chat_enabled');
  if p_session_key is null or char_length(p_session_key) not between 16 and 128 then
    raise exception 'invalid_input:session' using errcode = 'PT400';
  end if;
  v_ip := private.caller_ip(p_client_ip);
  if not private.check_rate_limit('chat_session', p_session_key, 30, interval '10 minutes')
     or not private.check_rate_limit('chat_ip', v_ip, 60, interval '1 hour') then
    raise exception 'rate_limited' using errcode = 'PT429';
  end if;
  select value into v_pepper from ops.config where key = 'rate_limit_pepper';
  insert into crm.chat_sessions as s (session_hash)
  values (extensions.hmac(convert_to(p_session_key, 'utf8'), convert_to(coalesce(v_pepper, ''), 'utf8'), 'sha256'))
  on conflict (session_hash) do update set last_seen_at = now(), message_count = s.message_count + 1
  returning id, message_count into v_id, v_count;
  return jsonb_build_object('session_id', v_id, 'message_count', v_count);
end $$;

create or replace function api.chat_append(p_session_id uuid, p_role text, p_content text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_role is null or p_role not in ('user', 'assistant') or char_length(coalesce(p_content, '')) not between 1 and 4000 then
    raise exception 'invalid_input:message' using errcode = 'PT400';
  end if;
  if not exists (select 1 from crm.chat_sessions s where s.id = p_session_id) then
    raise exception 'not_found:session' using errcode = 'PT404';
  end if;
  insert into crm.chat_messages (session_id, role, content) values (p_session_id, p_role, p_content);
end $$;

-- staff invitation: inviter must be an active admin; agency is the inviter's, never from the request
create or replace function api.invitation_create(p_email text, p_kind text, p_role text, p_invited_by uuid)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(btrim(coalesce(p_email, ''))); v_id uuid; v_agency uuid;
begin
  if char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'invalid_input:email' using errcode = 'PT400';
  end if;
  if p_kind is null or p_kind not in ('staff', 'client') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_kind = 'client' then perform private.kill_switch('portal_enabled'); end if;
  if p_kind = 'staff' and (p_role is null or p_role not in ('agent', 'manager', 'admin')) then
    raise exception 'invalid_input:role' using errcode = 'PT400';
  end if;
  select s.agency_id into v_agency from core.staff s
   where s.user_id = p_invited_by and s.active and s.role = 'admin' and (s.locked_until is null or s.locked_until < now());
  if v_agency is null then raise exception 'forbidden:inviter' using errcode = 'PT403'; end if;
  insert into core.invitations as i (email, kind, role, agency_id, invited_by)
  values (v_email, p_kind, case when p_kind = 'staff' then p_role end, v_agency, p_invited_by)
  on conflict ((lower(email))) where accepted_at is null
  do update set expires_at = now() + interval '24 hours', invited_by = excluded.invited_by, kind = excluded.kind,
                role = excluded.role, agency_id = excluded.agency_id
   where i.expires_at < now()
  returning id into v_id;
  if v_id is null then raise exception 'invitation_open' using errcode = 'PT409'; end if;
  return v_id;
end $$;

-- re-send: refresh the open invitation, or tell staff-invite to send a recovery link for an invited user who never signed in
create or replace function api.invitation_resend(p_email text, p_invited_by uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(btrim(coalesce(p_email, ''))); v_agency uuid; v_inv core.invitations; v_user uuid; v_signed timestamptz;
begin
  select s.agency_id into v_agency from core.staff s
   where s.user_id = p_invited_by and s.active and s.role = 'admin' and (s.locked_until is null or s.locked_until < now());
  if v_agency is null then raise exception 'forbidden:inviter' using errcode = 'PT403'; end if;
  select u.id, u.last_sign_in_at into v_user, v_signed from auth.users u where lower(u.email) = v_email;
  select * into v_inv from core.invitations i
   where lower(i.email) = v_email and i.kind = 'staff' and i.agency_id = v_agency
   order by i.created_at desc limit 1 for update;
  if v_inv.id is null then raise exception 'not_found:invitation' using errcode = 'PT404'; end if;
  if v_inv.accepted_at is null then
    update core.invitations set expires_at = now() + interval '24 hours', invited_by = p_invited_by where id = v_inv.id;
    return jsonb_build_object('mode', case when v_user is null then 'invite' else 'recovery' end, 'invitation_id', v_inv.id, 'user_id', v_user);
  end if;
  if v_user is not null and v_signed is null
     and exists (select 1 from core.staff s where s.user_id = v_user and s.agency_id = v_agency and s.active) then
    return jsonb_build_object('mode', 'recovery', 'invitation_id', v_inv.id, 'user_id', v_user);
  end if;
  raise exception 'already_active' using errcode = 'PT409';
end $$;

-- role and agency come from the invitation row, never from the request
create or replace function api.staff_provision(p_user_id uuid, p_display_name text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_email text; v_inv core.invitations;
begin
  if char_length(btrim(coalesce(p_display_name, ''))) not between 2 and 80 then
    raise exception 'invalid_input:display_name' using errcode = 'PT400';
  end if;
  select lower(u.email) into v_email from auth.users u where u.id = p_user_id;
  if v_email is null then raise exception 'not_found:user' using errcode = 'PT404'; end if;
  select * into v_inv from core.invitations i
   where lower(i.email) = v_email and i.kind = 'staff' and i.accepted_at is null and i.expires_at > now()
   order by i.created_at desc limit 1 for update;
  if v_inv.id is null then raise exception 'invitation_missing' using errcode = 'PT409'; end if;
  if exists (select 1 from core.staff s where s.user_id = p_user_id) then
    raise exception 'staff_exists' using errcode = 'PT409';
  end if;
  insert into core.staff (user_id, role, display_name, agency_id) values (p_user_id, v_inv.role, btrim(p_display_name), v_inv.agency_id);
  update core.invitations set accepted_at = now() where id = v_inv.id;
  insert into audit.log (actor, actor_role, table_name, op, pk, changed_cols, new_data, request_id)
  values (v_inv.invited_by, 'admin', 'core.staff', 'ACTION', p_user_id::text, array['role', 'agency_id'],
          jsonb_build_object('action', 'staff_provision', 'role', v_inv.role), private.request_id());
  return jsonb_build_object('ok', true, 'role', v_inv.role, 'agency_id', v_inv.agency_id);
end $$;

revoke all on function api.outbox_claim(integer), api.outbox_complete(bigint, boolean, text), api.job_finish(bigint, boolean, jsonb, text),
  api.job_continue(bigint, text, jsonb), api.cma_upsert_batch(jsonb), api.cma_finish_sync(text, text, jsonb),
  api.chat_session_touch(text, text), api.chat_append(uuid, text, text), api.invitation_create(text, text, text, uuid),
  api.invitation_resend(text, uuid), api.staff_provision(uuid, text) from public, anon, authenticated;
grant execute on function api.outbox_claim(integer), api.outbox_complete(bigint, boolean, text), api.job_finish(bigint, boolean, jsonb, text),
  api.job_continue(bigint, text, jsonb), api.cma_upsert_batch(jsonb), api.cma_finish_sync(text, text, jsonb),
  api.chat_session_touch(text, text), api.chat_append(uuid, text, text), api.invitation_create(text, text, text, uuid),
  api.invitation_resend(text, uuid), api.staff_provision(uuid, text) to service_role;
