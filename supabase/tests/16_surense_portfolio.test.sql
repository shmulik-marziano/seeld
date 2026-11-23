-- 16: Surense portfolio pull pipeline (20261124090000). Synthetic ids only, no Vault needed (details_enc is raw bytes here).
-- Runs as postgres; rolled back.
begin;
select no_plan();

-- ---------------------------------------------------------------- switch, kinds, crons, privileges
select is((select value from ops.config where key = 'surense_portfolio_enabled'), 'false', 'surense_portfolio_enabled present and off');
select lives_ok($$insert into ops.surense_jobs (kind, params) values ('surense.portfolio_pull', '{}')$$, 'the kind check accepts surense.portfolio_pull');
select lives_ok($$insert into ops.surense_jobs (kind, params) values ('surense.portfolio_sweep', '{}')$$, 'the kind check accepts surense.portfolio_sweep');
delete from ops.surense_jobs where kind in ('surense.portfolio_pull', 'surense.portfolio_sweep');
select is((select count(*)::int from cron.job where jobname = 'surense-portfolio-sweep' and schedule = '30 2 * * *'), 1, 'daily sweep at 02:30');
select is((select count(*)::int from cron.job where jobname = 'surense-customers-weekly' and schedule = '0 2 * * 1'), 1, 'weekly customer pass on Monday 02:00');
select ok(has_function_privilege('service_role', 'api.surense_portfolio_due(integer, integer)', 'execute')
          and not has_function_privilege('authenticated', 'api.surense_portfolio_due(integer, integer)', 'execute')
          and not has_function_privilege('anon', 'api.surense_portfolio_due(integer, integer)', 'execute'), 'portfolio_due: service_role only');
select ok(not has_function_privilege('service_role', 'ops.surense_portfolio_sweep_enqueue()', 'execute')
          and not has_function_privilege('authenticated', 'ops.surense_portfolio_sweep_enqueue()', 'execute'), 'sweep enqueuer: cron (postgres) only');
select ok(not has_function_privilege('service_role', 'ops.surense_customers_pull_enqueue()', 'execute'), 'customers enqueuer: cron (postgres) only');

-- ---------------------------------------------------------------- closed while the switches are off
update ops.config set value = 'true' where key = 'surense_enabled';
select is(ops.surense_portfolio_sweep_enqueue(), null, 'sweep enqueuer is a no-op while surense_portfolio_enabled is off');
select is(ops.surense_customers_pull_enqueue(), null, 'customers enqueuer is a no-op while surense_portfolio_enabled is off');
select is((select count(*)::int from ops.surense_jobs where kind in ('surense.portfolio_sweep', 'surense.pull_customers') and status = 'pending'), 0, 'nothing queued');
set local role service_role;
select throws_ok($$select * from api.surense_portfolio_due()$$, 'PT423', 'feature_disabled:surense_portfolio_enabled', 'due list closed while the portfolio switch is off');
reset role;
update ops.config set value = 'false' where key = 'surense_enabled';
update ops.config set value = 'true' where key = 'surense_portfolio_enabled';
select is(ops.surense_portfolio_sweep_enqueue(), null, 'sweep enqueuer is a no-op while surense_enabled is off');
set local role service_role;
select throws_ok($$select * from api.surense_portfolio_due()$$, 'PT423', 'feature_disabled:surense_enabled', 'due list closed while the queue switch is off');
reset role;
update ops.config set value = 'true' where key = 'surense_enabled';

-- ---------------------------------------------------------------- fixtures: four mirror customers, three snapshot states
insert into crm.surense_customers (id, details_enc) values
  ('c6000000-0000-4000-8000-000000000001', decode('00', 'hex')),   -- old production snapshot
  ('c6000000-0000-4000-8000-000000000002', decode('00', 'hex')),   -- fresh production snapshot
  ('c6000000-0000-4000-8000-000000000003', decode('00', 'hex')),   -- never pulled
  ('c6000000-0000-4000-8000-000000000004', decode('00', 'hex'));   -- pre-advice only (production missing)
insert into crm.surense_customers (id, details_enc, deleted_at) values
  ('c6000000-0000-4000-8000-000000000005', decode('00', 'hex'), now());   -- tombstone: never due
insert into crm.surense_portfolios (customer_surense_id, mode, product_count, snapshot_enc, fetched_at) values
  ('c6000000-0000-4000-8000-000000000001', 'production', 2, decode('00', 'hex'), now() - interval '40 days'),
  ('c6000000-0000-4000-8000-000000000001', 'production', 2, decode('00', 'hex'), now() - interval '70 days'),
  ('c6000000-0000-4000-8000-000000000002', 'production', 3, decode('00', 'hex'), now() - interval '2 days'),
  ('c6000000-0000-4000-8000-000000000004', 'pre_advice', 1, decode('00', 'hex'), now() - interval '1 day');

set local role service_role;
select set_eq($$ select surense_id from api.surense_portfolio_due() $$,
  $$ values ('c6000000-0000-4000-8000-000000000001'::uuid), ('c6000000-0000-4000-8000-000000000003'::uuid), ('c6000000-0000-4000-8000-000000000004'::uuid) $$,
  'due: the stale, the never-pulled and the pre-advice-only customers; not the fresh one, not the tombstone');
select results_eq($$ select surense_id from api.surense_portfolio_due(30, 2) $$,
  $$ values ('c6000000-0000-4000-8000-000000000003'::uuid), ('c6000000-0000-4000-8000-000000000004'::uuid) $$,
  'never-pulled first, then by id; the limit cuts the list');
select set_eq($$ select surense_id from api.surense_portfolio_due(60) $$,
  $$ values ('c6000000-0000-4000-8000-000000000003'::uuid), ('c6000000-0000-4000-8000-000000000004'::uuid) $$,
  'a 60-day age keeps the 40-day-old snapshot out');
select throws_ok($$select * from api.surense_portfolio_due(0)$$, 'PT400', 'invalid_input:max_age_days', 'age must be 1..365');
select is((api.surense_job_enqueue('surense.portfolio_pull', '{"customer_id":"c6000000-0000-4000-8000-000000000003"}'::jsonb, 'portfolio:c6000000-0000-4000-8000-000000000003')) ->> 'duplicate',
  'false', 'enqueue accepts the pull kind with a customer id');
select is((api.surense_job_enqueue('surense.portfolio_pull', '{"customer_id":"c6000000-0000-4000-8000-000000000003"}'::jsonb, 'portfolio:c6000000-0000-4000-8000-000000000003')) ->> 'duplicate',
  'true', 'the same open dedupe key is one job');
reset role;

-- ---------------------------------------------------------------- the cron enqueuers, both switches on
select ok(ops.surense_portfolio_sweep_enqueue() is not null, 'sweep queued');
select is(ops.surense_portfolio_sweep_enqueue(), (select id from ops.surense_jobs where dedupe_key = 'portfolio_sweep' and status = 'pending'), 'a second call returns the same open sweep job');
select is((select count(*)::int from ops.surense_jobs where kind = 'surense.portfolio_sweep' and status = 'pending'), 1, 'one pending sweep');
select ok(ops.surense_customers_pull_enqueue() is not null, 'customer pass queued');
select is((select count(*)::int from ops.surense_jobs where kind = 'surense.pull_customers' and status = 'pending' and dedupe_key = 'pull_customers'), 1, 'one pending customer pass');

-- ---------------------------------------------------------------- staff.admin_config_set knows the new key
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f6');
insert into core.staff (user_id, role, display_name, agency_id) values ('00000000-0000-0000-0000-0000000000f6', 'admin', 'Admin P', '5eed0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000f6', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select is((staff.admin_config_set('surense_portfolio_enabled', 'false')) ->> 'ok', 'true', 'admin can flip surense_portfolio_enabled');
select throws_ok($$select staff.admin_config_set('surense_portfolio_enabled', 'yes')$$, 'PT400', 'invalid_input:value', 'only true/false');
reset role;
select is((select value from ops.config where key = 'surense_portfolio_enabled'), 'false', 'the flip landed');

select * from finish();
rollback;
