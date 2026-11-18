-- 06: cron wrapper + outbox v2 (090700), service RPC surface (090800), tracks refresh (091000), watchdog + health (091100),
-- round-2 alert dead-letter, admin_alert_resolve and the edge_cron_enabled gate (090700/091400). Runs as postgres.
begin;
select no_plan();

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a4');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'agent', 'Agent A', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a4', 'admin', 'Admin A', '5eed0000-0000-4000-8000-000000000001');
select set_config('t.vault', (exists (select 1 from vault.decrypted_secrets where name in ('project_url', 'edge_cron_secret')))::text, true);

-- ===== edge_cron_enabled gate (default false) =====
select is((select value from ops.config where key = 'edge_cron_enabled'), 'false', 'edge_cron_enabled defaults to false');
select is(ops.call_function('notify-worker'), null, 'gate closed: call_function returns null');
select is((select count(*)::int from ops.job_runs where job = 'notify-worker'), 0, 'gate closed: no job_runs row');
select ok(pg_get_functiondef('ops.http_invoke(bigint,text,jsonb)'::regprocedure) !~* 'https?://|supabase[.]co', 'http_invoke has no hard-coded host');
select throws_ok($$select ops.http_invoke(1, 'Bad Name!')$$, '22023', 'invalid_input:function', 'http_invoke rejects a bad function name');
select case when current_setting('t.vault')::boolean
  then skip('Vault secrets exist in this database', 2)
  else collect_tap(
    throws_ok($$select ops.http_invoke(1, 'notify-worker')$$, '55000', 'vault_secret_missing', 'vault missing gives 55000 vault_secret_missing'),
    throws_ok($q$do $d$ begin update ops.config set value = 'true' where key = 'edge_cron_enabled'; perform ops.call_function('notify-worker'); end $d$$q$,
              '55000', 'vault_secret_missing', 'gate open + no Vault: call_function fails loudly, nothing half-written'))
  end;
select is((select value from ops.config where key = 'edge_cron_enabled'), 'false', 'the failed gate-open probe rolled back');

-- ===== outbox v2 =====
insert into ops.outbox (topic, payload) values ('lead.created', '{"lead_id":"x"}');
select set_config('t.o1', (select max(id)::text from ops.outbox), true);
set local role service_role;
select is((select count(*)::int from api.outbox_claim(10)), 1, 'first claim gets the row');
select is((select count(*)::int from api.outbox_claim(10)), 0, 'second claim gets nothing (locked)');
select lives_ok(format('select api.outbox_complete(%s, false, %L)', current_setting('t.o1'), 'temporary failure'), 'complete(false)');
reset role;
select ok((select status = 'pending' and next_attempt_at > now() and last_error = 'temporary failure' and locked_until is null
             from ops.outbox where id = current_setting('t.o1')::bigint), 'complete(false) backs off');
update ops.outbox set attempts = 5, status = 'processing' where id = current_setting('t.o1')::bigint;
select ops.outbox_complete(current_setting('t.o1')::bigint, false, 'final failure');
select is((select status from ops.outbox where id = current_setting('t.o1')::bigint), 'dead', 'attempts=5 gives dead');
select is((select count(*)::int from ops.alerts where kind = 'outbox_dead' and status = 'pending'), 1, 'a dead row raises an outbox_dead alert');
select isnt(ops.raise_alert('warning', 'test_kind', 'first', 'test_key'), null, 'raise_alert inserts');
select is(ops.raise_alert('warning', 'test_kind', 'second', 'test_key'), null, 'raise_alert dedupes within the window');
select is((select count(*)::int from ops.outbox where topic = 'alert' and payload ->> 'kind' = 'test_kind'), 1, 'one outbox message per alert');

insert into ops.job_runs (job, finished_at, ok) values ('fetch-cma-data', now(), true);
select set_config('t.run_done', (select max(id)::text from ops.job_runs), true);
insert into ops.job_runs (job) values ('fetch-cma-data');
select set_config('t.run_open', (select max(id)::text from ops.job_runs), true);
set local role service_role;
select throws_ok(format('select api.job_continue(%s, %L, %L)', current_setting('t.run_done'), 'fetch-cma-data', '{"page":2}'),
  'PT404', 'not_found:job_run', 'job_continue on a finished run gives PT404');
select lives_ok(format('select api.job_finish(%s, true, %L)', current_setting('t.run_open'), '{"rows":3}'), 'job_finish');
reset role;
select ok((select ok and finished_at is not null and stats ->> 'rows' = '3' from ops.job_runs where id = current_setting('t.run_open')::bigint), 'job_finish stored');

-- ===== tracks refresh (091000) =====
insert into content.cma_funds (fund_id, fund_name, managing_company, source, product_type, report_period, total_assets, monthly_yield)
  select 'FUND' || g, 'קרן ' || g, 'הראל פנסיה', 'gemelnet', 'gemel', p, 1000, 0.5
  from generate_series(1, 3) g, unnest(array[202601, 202602, 202603]) p;
select content.refresh_fund_views();
insert into content.investment_tracks (fund_number, name, company, product_type, specialization, is_active)
  values ('OLD1', 'old track', 'c', 'p', 's', true);
select is(content.refresh_investment_tracks(), '{"upserted": 3, "hidden": 1}'::jsonb, '3 funds + OLD1 give upserted 3, hidden 1');
select is((select source_period from content.investment_tracks where fund_number = 'FUND1'), 202603, 'source_period is the report period');
select is((select is_active from content.investment_tracks where fund_number = 'OLD1'), false, 'OLD1 is hidden, not deleted');
update ops.config set value = 'false' where key = 'tracks_sync_enabled';
select is(content.refresh_investment_tracks(), '{"skipped": "disabled"}'::jsonb, 'flag off skips');
update ops.config set value = 'true' where key = 'tracks_sync_enabled';

-- ===== service RPC surface (090800) =====
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is((api.cma_upsert_batch(jsonb_build_array(jsonb_build_object('fund_id','F1','fund_name','n','source','gemelnet','report_period',202609),
  jsonb_build_object('fund_id','F1','fund_name','n2','source','gemelnet','report_period',202609)))) ->> 'upserted', '1', 'duplicate key in one batch upserts once');
select is((api.cma_finish_sync('gemelnet', 'success', '{"records_fetched":2}')) ->> 'refresh_scheduled', 'true', 'cma_finish_sync schedules the refresh');
select throws_ok($$select api.cma_finish_sync('gemelnet', 'bogus')$$, 'PT400', 'invalid_input:status', 'bogus status gives PT400');
select throws_ok($$select api.chat_append('00000000-0000-0000-0000-00000000dead', 'user', 'hello')$$, 'PT404', 'not_found:session', 'chat_append unknown session gives PT404');
select throws_ok($$select api.chat_session_touch('session-key-000000001', null)$$, 'PT400', 'invalid_input:client_ip', 'chat_session_touch requires p_client_ip');
select ok((api.chat_session_touch('session-key-000000001', '192.0.2.10')) ? 'session_id', 'chat_session_touch opens a session');
reset role;
select is((select fund_name from content.cma_funds where fund_id = 'F1'), 'n2', 'last row wins');
select is((select value from ops.config where key = 'cma_refresh_pending'), 'true', 'cma_refresh_pending set');
select ok(ops.watchdog() is not null, 'watchdog runs the pending refresh');
select is((select value from ops.config where key = 'cma_refresh_pending'), 'false', 'refresh flag cleared');
select ok((select ok from ops.job_runs where job = 'cma-refresh' order by id desc limit 1), 'cma-refresh run recorded ok');

-- ===== health + watchdog (091100) =====
delete from ops.outbox;
delete from ops.alerts;
insert into ops.job_runs (job, finished_at, ok) values ('ops-watchdog', now(), true);
insert into ops.outbox (topic, payload, created_at, attempts, next_attempt_at) values ('lead.created', '{}', now() - interval '3 hours', 3, now() + interval '2 hours');
select is((api.health()) ->> 'degraded', 'false', 'a retrying outbox row with a fresh watchdog run is not degraded');
select ok((select array_agg(k order by k) from jsonb_object_keys(api.health()) k) = array['cma_age_bucket', 'degraded', 'ok'], 'api.health returns exactly 3 keys');
select ops.watchdog();
select ok(not exists (select 1 from ops.alerts where kind = 'outbox_backlog'), 'a normal retry raises no outbox_backlog');
insert into net._http_response (id, status_code, timed_out, created) values (990001, null, true, now());
select ops.cron_http_audit();
select ok(not exists (select 1 from ops.alerts where kind = 'cron_http_failed'), 'a timed-out request is not a cron_http_failed');
insert into net._http_response (id, status_code, timed_out, created) values (990002, 500, false, now());
select ops.cron_http_audit();
select ok(exists (select 1 from ops.alerts where kind = 'cron_http_failed'), 'status 500 raises cron_http_failed');

update ops.config set value = 'not-a-timestamp' where key = 'auth_events_last_at';
select is((ops.watchdog()) -> 'failed_steps', '["copy_auth_events"]'::jsonb, 'a broken step is isolated');
select ok((select ok = false and finished_at is not null from ops.job_runs where job = 'ops-watchdog' order by id desc limit 1), 'the watchdog run still finished, ok=false');
select ok((select summary ~ '^copy_auth_events: SQLSTATE [0-9A-Z]{5}$' from ops.alerts where kind = 'watchdog_step_failed' order by id desc limit 1),
  'the step alert carries only the SQLSTATE, no message text');
update ops.config set value = '1970-01-01T00:00:00Z' where key = 'auth_events_last_at';

insert into ops.alerts (at, severity, kind, summary, status) values (now() - interval '31 minutes', 'warning', 'stuck_test', 'stuck', 'pending');
select set_config('t.stuck', (select max(id)::text from ops.alerts), true);
select is((api.health()) ->> 'degraded', 'true', 'an alert pending 31 min gives degraded');

-- ===== staff.admin_alert_resolve =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok(format('select staff.admin_alert_resolve(%s)', current_setting('t.stuck')), 'PT403', 'forbidden:admin_fresh_totp', 'an agent cannot resolve alerts');
select set_config('request.jwt.claims', jsonb_build_object('sub','00000000-0000-0000-0000-0000000000a4','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now())::bigint)))::text, true);
select throws_ok($$select staff.admin_alert_resolve(-1)$$, 'PT404', 'not_found', 'unknown alert id gives PT404');
select is((staff.admin_alert_resolve(current_setting('t.stuck')::bigint)) ->> 'ok', 'true', 'a fresh admin resolves the alert');
select ok((staff.ops_health()) ? 'alerts_pending', 'staff.ops_health answers staff');
reset role;
select is((select status from ops.alerts where id = current_setting('t.stuck')::bigint), 'resolved', 'alert status resolved');
select ok(exists (select 1 from audit.log where table_name = 'ops.alerts' and op = 'ACTION' and pk = current_setting('t.stuck')
                   and new_data ->> 'action' = 'admin_alert_resolve' and actor = '00000000-0000-0000-0000-0000000000a4'), 'resolve wrote an ACTION row');
select is((api.health()) ->> 'degraded', 'false', 'resolving the stuck alert clears degraded');

-- ===== round 2: undeliverable alert chain =====
delete from ops.outbox;
delete from ops.alerts;
select set_config('t.a', ops.raise_alert('critical', 'chain_test', 'alert A', 'dedupe_a')::text, true);
select set_config('t.oa', (select id::text from ops.outbox where topic = 'alert' and (payload ->> 'alert_id')::bigint = current_setting('t.a')::bigint), true);
update ops.outbox set attempts = 5, status = 'processing' where id = current_setting('t.oa')::bigint;
select ops.outbox_complete(current_setting('t.oa')::bigint, false, 'mail provider down');
select is((select status from ops.outbox where id = current_setting('t.oa')::bigint), 'dead', 'alert A outbox row is dead');
select is((select status from ops.alerts where id = current_setting('t.a')::bigint), 'undeliverable', 'alert A is undeliverable (no longer pending)');
select is((select count(*)::int from ops.alerts where kind = 'outbox_dead'), 1, 'one outbox_dead alert B raised');
select set_config('t.b', (select id::text from ops.alerts where kind = 'outbox_dead'), true);
select set_config('t.ob', (select id::text from ops.outbox where topic = 'alert' and (payload ->> 'alert_id')::bigint = current_setting('t.b')::bigint), true);
update ops.outbox set attempts = 5, status = 'processing' where id = current_setting('t.ob')::bigint;
select ops.outbox_complete(current_setting('t.ob')::bigint, false, 'mail provider down');
select is((select status from ops.alerts where id = current_setting('t.b')::bigint), 'undeliverable', 'replacement alert B ends undeliverable when its own row dies');
select is((select count(*)::int from ops.alerts where kind = 'outbox_dead'), 1, 'a dead outbox_dead alert raises no new outbox_dead alert (no loop)');
select is((select count(*)::int from ops.alerts where status = 'pending'), 0, 'nothing is left pending');
select is(ops.raise_alert('critical', 'chain_test', 'alert A again', 'dedupe_a'), null, 'same dedupe key inside the 1h window is still suppressed');
update ops.alerts set at = now() - interval '2 hours' where id = current_setting('t.a')::bigint;
select isnt(ops.raise_alert('critical', 'chain_test', 'alert A again', 'dedupe_a'), null, 'after the window the freed dedupe key inserts a new pending alert');
select is((api.health()) ->> 'degraded', 'true', 'a dead row inside 24h keeps degraded');
update ops.outbox set processed_at = now() - interval '25 hours' where status = 'dead';
select is(private.health_degraded(), false, 'after the 24h dead window, with no other signal, degraded clears');

-- ===== round 3: recipients resolved at claim time (091600) =====
delete from ops.outbox;
delete from ops.alerts;
delete from ops.alert_recipients;
select set_config('t.r', ops.raise_alert('warning', 'recipients_test', 'raised before any recipient exists', 'dedupe_r')::text, true);
select is((select payload -> 'recipients' from ops.outbox where topic = 'alert' and (payload ->> 'alert_id')::bigint = current_setting('t.r')::bigint),
  '[]'::jsonb, 'an alert raised with no recipients snapshots an empty list');
insert into ops.alert_recipients (email, active) values ('ops-b@example.com', true), ('ops-a@example.com', true), ('off@example.com', false);
insert into ops.outbox (topic, payload) values ('lead.created', '{"lead_id":"y"}');
set local role service_role;
select set_config('t.claimed', (select jsonb_object_agg(c.topic, c.payload)::text from api.outbox_claim(50) c), true);
reset role;
select is(current_setting('t.claimed')::jsonb #> '{alert,recipients}', '["ops-a@example.com", "ops-b@example.com"]'::jsonb,
  'claim resolves the CURRENT active recipients, sorted, inactive excluded');
select is(current_setting('t.claimed')::jsonb -> 'lead.created', '{"lead_id":"y"}'::jsonb, 'a non-alert payload is returned unchanged');
select is((select payload -> 'recipients' from ops.outbox where topic = 'alert' and (payload ->> 'alert_id')::bigint = current_setting('t.r')::bigint),
  '[]'::jsonb, 'the stored payload is not rewritten by the claim');
select ok(not has_function_privilege('anon', 'api.outbox_claim(integer)', 'execute')
          and not has_function_privilege('authenticated', 'api.outbox_claim(integer)', 'execute')
          and has_function_privilege('service_role', 'api.outbox_claim(integer)', 'execute'), 'api.outbox_claim stays service-only after 091600');

select * from finish();
rollback;
