-- V3-04: Surense portfolio pull (the client-area data pipeline). Owner decision 2026-11-23: the personal area reads the
-- processed portfolio (POST /customers/{id}/portfolio, mode production) from OUR mirror, so every customer with a Surense
-- id is pulled on a schedule and after the events that change a portfolio (Har HaBituach file loaded, E9100 completed,
-- customer updated). Nothing here calls Surense: the worker does (surense-worker, kinds surense.portfolio_pull /
-- surense.portfolio_sweep). Everything is behind surense_portfolio_enabled (default false) on top of surense_enabled.
-- No deletes. Synthetic values only in the tests (supabase/tests/16_surense_portfolio.test.sql).

insert into ops.config (key, value) values ('surense_portfolio_enabled', 'false') on conflict (key) do nothing;

-- ---------------------------------------------------------------- job kinds: the per-customer pull and the daily sweep
alter table ops.surense_jobs drop constraint surense_jobs_kind_check;
alter table ops.surense_jobs add constraint surense_jobs_kind_check
  check (kind in ('surense.event', 'surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit',
                  'surense.poa_ship', 'surense.portfolio_pull', 'surense.portfolio_sweep'));

-- api.surense_job_enqueue: 20261122180000 verbatim + the two portfolio kinds in the whitelist
create or replace function api.surense_job_enqueue(p_kind text, p_params jsonb default '{}'::jsonb, p_dedupe text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_id bigint;
begin
  perform private.kill_switch('surense_enabled');
  if p_kind is null or p_kind not in ('surense.pull_customers', 'surense.pull_documents', 'surense.e9100_download', 'surense.e9100_submit',
                                      'surense.poa_ship', 'surense.portfolio_pull', 'surense.portfolio_sweep') then
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

-- ---------------------------------------------------------------- the due list (service role; the sweep job reads it)
-- Customers of the mirror (not deleted) whose latest PRODUCTION snapshot is missing or older than p_max_age_days, oldest
-- first (never-pulled first). Ids only: no personal value leaves the database here.
create or replace function api.surense_portfolio_due(p_max_age_days integer default 30, p_limit integer default 200)
returns table (surense_id uuid) language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.kill_switch('surense_enabled');
  perform private.kill_switch('surense_portfolio_enabled');
  if p_max_age_days is null or p_max_age_days not between 1 and 365 then raise exception 'invalid_input:max_age_days' using errcode = 'PT400'; end if;
  return query
    select c.id
      from crm.surense_customers c
      left join lateral (select max(p.fetched_at) as fetched_at
                           from crm.surense_portfolios p
                          where p.customer_surense_id = c.id and p.mode = 'production') lp on true
     where c.deleted_at is null
       and (lp.fetched_at is null or lp.fetched_at < now() - make_interval(days => p_max_age_days))
     order by lp.fetched_at asc nulls first, c.id
     limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end $$;

-- ---------------------------------------------------------------- the two cron enqueuers (run as postgres by pg_cron)
-- Both are no-ops while surense_enabled or surense_portfolio_enabled is off: nothing is queued, nothing is logged.
create or replace function ops.surense_portfolio_sweep_enqueue()
returns bigint language plpgsql volatile security definer set search_path = '' as $$
declare r jsonb;
begin
  if not private.flag('surense_enabled') or not private.flag('surense_portfolio_enabled') then return null; end if;
  r := api.surense_job_enqueue('surense.portfolio_sweep', '{}'::jsonb, 'portfolio_sweep');
  return (r ->> 'id')::bigint;
end $$;

create or replace function ops.surense_customers_pull_enqueue()
returns bigint language plpgsql volatile security definer set search_path = '' as $$
declare r jsonb;
begin
  if not private.flag('surense_enabled') or not private.flag('surense_portfolio_enabled') then return null; end if;
  r := api.surense_job_enqueue('surense.pull_customers', '{}'::jsonb, 'pull_customers');
  return (r ->> 'id')::bigint;
end $$;

-- daily sweep 02:30 UTC (04:30 Israel winter); weekly full customer pass Monday 02:00 UTC. Idempotent: replaced if present.
select cron.unschedule(jobid) from cron.job where jobname in ('surense-portfolio-sweep', 'surense-customers-weekly');
select cron.schedule('surense-portfolio-sweep', '30 2 * * *', $$select ops.surense_portfolio_sweep_enqueue()$$);
select cron.schedule('surense-customers-weekly', '0 2 * * 1', $$select ops.surense_customers_pull_enqueue()$$);

-- ---------------------------------------------------------------- staff.admin_config_set: 20261121150000 verbatim + surense_portfolio_enabled
create or replace function staff.admin_config_set(p_key text, p_value text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_old text;
begin
  if p_key is null or p_key not in ('intake_enabled', 'chat_enabled', 'portal_enabled', 'tracks_sync_enabled',
      'lead_retention_enabled', 'auth_lock_enabled', 'stepup_max_age_sec',
      'surense_enabled', 'surense_write_enabled', 'surense_e9100_enabled', 'surense_webhook_enabled', 'surense_retention_enabled',
      'surense_portfolio_enabled',
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

-- ---------------------------------------------------------------- privileges
revoke all on function api.surense_portfolio_due(integer, integer) from public, anon, authenticated;
grant execute on function api.surense_portfolio_due(integer, integer) to service_role;
revoke all on function ops.surense_portfolio_sweep_enqueue(), ops.surense_customers_pull_enqueue() from public, anon, authenticated, service_role;
