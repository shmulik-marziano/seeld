-- 19: operations signal (20261128120000): api.sms_report alerts, the hourly sms-health cron, and the watchdog jobs step
-- (one alert per job per 24 h; a late run whose HTTP call failed is closed with the reason). Runs as postgres.
begin;
select no_plan();

-- ===== api.sms_report =====
select ok(has_function_privilege('service_role', 'api.sms_report(boolean, text, integer)', 'execute'), 'service_role reports');
select ok(not has_function_privilege('anon', 'api.sms_report(boolean, text, integer)', 'execute')
          and not has_function_privilege('authenticated', 'api.sms_report(boolean, text, integer)', 'execute'), 'API roles cannot');
select is((select value from ops.config where key = 'sms_low_credit_threshold'), '200', 'low-credit threshold seeded');
select is((select count(*)::int from cron.job where jobname = 'sms-health-hourly' and schedule = '41 * * * *'
             and command = $$select ops.call_function('sms-health')$$), 1, 'sms-health runs hourly through ops.call_function');

delete from ops.alerts;
select api.sms_report(false, 'bad_token', null);
select api.sms_report(false, 'bad_token', null);
select is((select count(*)::int from ops.alerts where kind = 'sms_unavailable' and severity = 'critical'), 1,
  'a provider failure raises one critical sms_unavailable (deduped for 6 h)');
select ok((select summary like '%(bad_token)%' from ops.alerts where kind = 'sms_unavailable'), 'the summary names the code only');
select api.sms_report(true, null, 5000);
select is((select count(*)::int from ops.alerts where kind = 'sms_low_credit'), 0, 'enough credit raises nothing');
select api.sms_report(true, null, 150);
select is((select count(*)::int from ops.alerts where kind = 'sms_low_credit' and severity = 'warning'), 1, 'credit under the threshold warns');
select throws_ok($$ select api.sms_report(false, 'Bad Code!', null) $$, 'PT400', 'invalid_input:code', 'a code outside [a-z0-9_] is refused');
select throws_ok($$ select api.sms_report(null, null, null) $$, 'PT400', 'invalid_input:ok', 'ok is required');

-- ===== ops.job_budget =====
select is(ops.job_budget('notify-worker'), interval '5 minutes', 'worker budget 5 min');
select is(ops.job_budget('fetch-cma-data'), interval '120 minutes', 'cma budget 2 h');
select is(ops.job_budget('sms-health'), interval '30 minutes', 'others 30 min');

-- ===== watchdog jobs step =====
delete from ops.alerts;
update ops.job_runs set finished_at = now(), ok = true where finished_at is null;
-- a late worker run whose pg_net call timed out (DNS 5000 ms in production): closed as http_timeout, no job alert
insert into net._http_response (id, status_code, timed_out, created) values (991001, null, true, now() - interval '20 minutes');
insert into ops.job_runs (job, started_at, request_id) values ('notify-worker', now() - interval '20 minutes', 991001);
select set_config('t.timeout_run', (select max(id)::text from ops.job_runs), true);
-- a fresh run whose call timed out is still inside its budget: left open (the function may still finish it)
insert into net._http_response (id, status_code, timed_out, created) values (991002, null, true, now());
insert into ops.job_runs (job, started_at, request_id) values ('surense-worker', now() - interval '1 minute', 991002);
select set_config('t.fresh_run', (select max(id)::text from ops.job_runs), true);
-- a late run whose call failed with 502: closed as http_502
insert into net._http_response (id, status_code, timed_out, created) values (991003, 502, false, now() - interval '40 minutes');
insert into ops.job_runs (job, started_at, request_id) values ('surense-probe', now() - interval '40 minutes', 991003);
select set_config('t.failed_run', (select max(id)::text from ops.job_runs), true);
-- two late probe runs that answered 202 and never reported: one alert for the job, naming it and the count
insert into net._http_response (id, status_code, timed_out, created) values (991004, 202, false, now() - interval '50 minutes'),
                                                                            (991005, 202, false, now() - interval '45 minutes');
insert into ops.job_runs (job, started_at, request_id) values ('sms-health', now() - interval '50 minutes', 991004),
                                                              ('sms-health', now() - interval '45 minutes', 991005);

select ops.watchdog();
select is((select error from ops.job_runs where id = current_setting('t.timeout_run')::bigint), 'http_timeout', 'late timed-out run closed as http_timeout');
select ok((select finished_at is not null and ok = false from ops.job_runs where id = current_setting('t.timeout_run')::bigint), 'closed, ok=false');
select ok((select finished_at is null from ops.job_runs where id = current_setting('t.fresh_run')::bigint), 'a timed-out run inside its budget stays open');
select is((select error from ops.job_runs where id = current_setting('t.failed_run')::bigint), 'http_502', 'late failed call closed as http_502');
select is((select count(*)::int from ops.alerts where kind = 'job_not_finished'), 1, 'one job_not_finished alert');
select is((select dedupe_key from ops.alerts where kind = 'job_not_finished'), 'job_not_finished:sms-health', 'deduped per job');
select is((select summary from ops.alerts where kind = 'job_not_finished'), 'sms-health: 2 run(s) did not report job_finish in time',
  'the summary names the job and the count');
select is((select count(*)::int from ops.alerts where kind = 'cron_http_timeouts'), 0, 'one timeout is not a pattern');

select ops.watchdog();
select is((select count(*)::int from ops.alerts where kind = 'job_not_finished'), 1, 'the next tick does not re-alert the same job');

-- five timed-out closures in an hour raise one cron_http_timeouts warning
insert into net._http_response (id, status_code, timed_out, created)
  select 992000 + g, null, true, now() - interval '10 minutes' from generate_series(1, 5) g;
insert into ops.job_runs (job, started_at, request_id)
  select 'notify-worker', now() - interval '10 minutes', 992000 + g from generate_series(1, 5) g;
select ops.watchdog();
select is((select count(*)::int from ops.alerts where kind = 'cron_http_timeouts' and severity = 'warning'), 1, 'repeated timeouts warn once');

select * from finish();
rollback;
