-- 11: Surense connector (20261120200000). Synthetic ids and payloads only. Runs as postgres.
-- The Vault keys are created inside this rolled-back transaction when absent; Vault-dependent checks skip without Vault.
-- Never run this file against a database that holds the real keys (replay/branch databases only).
begin;
select no_plan();

select set_config('t.has_vault', (to_regclass('vault.secrets') is not null)::text, true);
do $$
begin
  if current_setting('t.has_vault')::boolean then
    if not exists (select 1 from vault.secrets where name = 'pii_enc_key') then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'pii_enc_key');
    end if;
    if not exists (select 1 from vault.secrets where name = 'national_id_hmac_key') then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'national_id_hmac_key');
    end if;
  end if;
end $$;

-- switches: present and off; a missing key also reads as closed
select set_eq($$ select key || '=' || value from ops.config where key like 'surense%' $$,
  $$ values ('surense_enabled=false'), ('surense_write_enabled=false'), ('surense_e9100_enabled=false'), ('surense_webhook_enabled=false'),
            ('surense_retention_enabled=false'), ('surense_portfolio_enabled=false') $$,
  'six Surense switches, all off (surense_portfolio_enabled since 20261124090000)');
select ok(not private.flag('surense_enabled') and not private.flag('surense_write_enabled') and not private.flag('surense_webhook_enabled')
          and not private.flag('surense_retention_enabled') and not private.flag('surense_e9100_enabled'),
  'private.flag reads them closed');
select is((select confdeltype::text from pg_constraint
            where conrelid = 'ops.surense_jobs'::regclass and confrelid = 'ops.surense_events'::regclass and contype = 'f'), 'n',
  'surense_jobs.event_id is on delete set null (never cascade)');

-- structure: RLS everywhere, no API-role privilege, deny policies with explicit roles
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where (n.nspname, c.relname) in (('ops', 'surense_events'), ('ops', 'surense_jobs'), ('ops', 'surense_sync_state'),
                                             ('crm', 'surense_customers'), ('crm', 'surense_documents'), ('crm', 'surense_products'),
                                             ('crm', 'surense_portfolios'))
              and c.relrowsecurity), 7, 'RLS on all seven connector tables');
select is_empty($$ select r || ' ' || n.nspname || '.' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    cross join unnest(array['anon', 'authenticated', 'service_role']) r
                   where n.nspname in ('ops', 'crm') and c.relname like 'surense%' and c.relkind = 'r'
                     and has_table_privilege(r, c.oid, 'SELECT,INSERT,UPDATE,DELETE') $$,
  'no table privilege for anon/authenticated/service_role on connector tables');
select is((select count(*)::int from pg_policies where schemaname in ('ops', 'crm') and tablename like 'surense%'
            and policyname = 'deny_api_roles' and roles = '{anon,authenticated}' and qual = 'false'), 7, 'deny policy on each table');
select is_empty($$ select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'crm' and c.relname like 'surense%' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
                     and a.attname ~ '(name|phone|email|address|id_number|national_id$|policy|cell|sensitive|deceased|death|minor)'
                     and a.attname not in ('status_name', 'class_name', 'source_name', 'id_number_locked', 'cell_verified') $$,
  'no personal column in the mirror (only *_enc, hmac, ids, labels)');

-- RPC permissions
select ok(not has_function_privilege('anon', 'api.surense_event_ingest(text, text, timestamptz, text)', 'execute'), 'anon cannot ingest');
select ok(not has_function_privilege('authenticated', 'api.surense_job_claim(integer)', 'execute'), 'authenticated cannot claim');
select ok(has_function_privilege('service_role', 'api.surense_job_claim(integer)', 'execute'), 'service_role claims');
select ok(not has_function_privilege('service_role', 'private.surense_params_ok(jsonb)', 'execute'), 'private helper not exposed');

-- switches gate every path
set local role service_role;
select throws_ok($$select api.surense_event_ingest('msg_test0001', 'customer.created', now(), '{"type":"customer.created"}')$$,
  'PT423', 'feature_disabled:surense_webhook_enabled', 'ingest closed while the webhook switch is off');
select throws_ok($$select api.surense_gate(false)$$, 'PT423', 'feature_disabled:surense_enabled', 'gate closed while surense_enabled is off');
select throws_ok($$select * from api.surense_job_claim(5)$$, 'PT423', 'feature_disabled:surense_enabled', 'claim closed while surense_enabled is off');
select throws_ok($$select count(*) from ops.surense_events$$, '42501', null, 'service_role cannot read the inbox directly');
reset role;
update ops.config set value = 'true' where key in ('surense_enabled', 'surense_webhook_enabled');
set local role service_role;
select throws_ok($$select api.surense_gate(true)$$, 'PT423', 'feature_disabled:surense_write_enabled', 'write gate stays closed');
select lives_ok($$select api.surense_gate(false)$$, 'read gate open');
select throws_ok($$select api.surense_gate(false, 'e9100-submit')$$, 'PT423', 'feature_disabled:surense_write_enabled',
  'e9100 submit is a write even when the caller says p_write=false');
select throws_ok($$select api.surense_gate(true, 'Bad Action')$$, 'PT400', 'invalid_input:action', 'action names are codes');
reset role;
update ops.config set value = 'true' where key = 'surense_write_enabled';
set local role service_role;
select lives_ok($$select api.surense_gate(true, 'invite-proxies')$$, 'proxies invite open with surense_write_enabled');
select throws_ok($$select api.surense_gate(true, 'e9100-submit')$$, 'PT423', 'feature_disabled:surense_e9100_enabled',
  'e9100 submit gate closed while surense_write_enabled is on and surense_e9100_enabled is off');
reset role;
update ops.config set value = 'true' where key = 'surense_e9100_enabled';
set local role service_role;
select lives_ok($$select api.surense_gate(true, 'e9100-submit')$$, 'e9100 submit open with both switches');
reset role;
update ops.config set value = 'false' where key = 'surense_write_enabled';
set local role service_role;
select throws_ok($$select api.surense_gate(true, 'e9100-submit')$$, 'PT423', 'feature_disabled:surense_write_enabled',
  'surense_e9100_enabled alone opens nothing');
reset role;
update ops.config set value = 'false' where key = 'surense_e9100_enabled';
set local role service_role;
select throws_ok($$select api.surense_event_ingest('bad id!', 'x.y', now(), '{}')$$, 'PT400', 'invalid_input:svix_id', 'bad svix id refused');
select throws_ok($$select api.surense_event_ingest('msg_x', 'Bad Type', now(), '{}')$$, 'PT400', 'invalid_input:type', 'bad type refused');
select throws_ok($$select api.surense_job_enqueue('surense.pull_customers', '{"name":"Some Person Name"}'::jsonb)$$, 'PT400',
  'invalid_input:params', 'job params refuse free text');
select throws_ok($$select api.surense_job_enqueue('surense.event', '{}'::jsonb)$$, 'PT400', 'invalid_input:kind', 'event jobs only via ingest');
select is((api.surense_job_enqueue('surense.pull_customers', '{"page_size":100}'::jsonb, 'pull_customers')) ->> 'duplicate', 'false', 'enqueue');
select is((api.surense_job_enqueue('surense.pull_customers', '{"page_size":100}'::jsonb, 'pull_customers')) ->> 'duplicate', 'true',
  'same open dedupe key is one job');
reset role;

-- watchdog 'surense' step: a clean queue raises nothing; a job pending 20 min past due raises surense_backlog (ids/counts only)
select ok(not ((ops.watchdog()) -> 'failed_steps') ? 'surense', 'watchdog surense step runs');
select is((select count(*)::int from ops.alerts where kind like 'surense%'), 0, 'clean queue: no surense alert');
insert into ops.surense_jobs (kind, params, status, next_attempt_at) values ('surense.pull_documents', '{"t":"wd"}', 'pending', now() - interval '20 minutes');
select set_config('t.jwd', (select id from ops.surense_jobs where params ->> 't' = 'wd')::text, true);
select ok(not ((ops.watchdog()) -> 'failed_steps') ? 'surense', 'watchdog surense step runs on the stuck fixture');
select is((select count(*)::int from ops.alerts where kind = 'surense_backlog' and status = 'pending'), 1, 'stuck pending job raises surense_backlog');
select is((select summary from ops.alerts where kind = 'surense_backlog'),
  'surense jobs pending > 15 min past due: count=1 oldest_id=' || current_setting('t.jwd') || ' (worker not draining)', 'backlog alert holds count and id only');
select is((select dedupe_key from ops.alerts where kind = 'surense_backlog'), 'surense_backlog', 'backlog alert is deduped');
select lives_ok($$select ops.watchdog()$$, 'second watchdog run');
select is((select count(*)::int from ops.alerts where kind = 'surense_backlog'), 1, 'dedupe: still one backlog alert');
select is((select count(*)::int from ops.alerts where kind like 'surense%' and kind <> 'surense_backlog'), 0, 'no other surense alert');
-- fixture closed (all rolled back with the transaction) so later claims see the same queue as before
update ops.surense_jobs set status = 'skipped', processed_at = now() where id = current_setting('t.jwd')::bigint;
delete from ops.alerts where kind = 'surense_backlog';

-- inbox + queue (Vault)
set local role service_role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((api.surense_event_ingest('msg_test0001', 'customer.created', now(), '{"type":"customer.created","marker":"zz-plain"}')) ->> 'duplicate',
          'false', 'first delivery stored') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((api.surense_event_ingest('msg_test0001', 'customer.created', now(), '{"type":"customer.created"}')) ->> 'duplicate',
          'true', 'same svix-id is a duplicate') end;
reset role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((select count(*)::int from ops.surense_events where svix_id = 'msg_test0001'), 1, 'one row per svix-id') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok((select position(convert_to('zz-plain', 'utf8') in payload_enc) = 0 from ops.surense_events where svix_id = 'msg_test0001'),
          'payload stored encrypted') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((select count(*)::int from ops.surense_jobs j join ops.surense_events e on e.id = j.event_id where e.svix_id = 'msg_test0001'),
          1, 'one event job per event') end;
set local role service_role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((select payload::jsonb ->> 'marker' from api.surense_job_claim(25) where kind = 'surense.event'), 'zz-plain',
          'claim decrypts the event payload for the worker') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((select count(*)::int from api.surense_job_claim(25)), 0, 'second claim gets nothing (locked)') end;
reset role;

-- mirror upsert: hmac only, details encrypted, older copy never wins (Vault)
set local role service_role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((api.surense_customers_upsert('[{"surense_id":"c1000000-0000-4000-8000-000000000001","status_name":"active","id_type":1,
            "national_id":"12345678","surense_modified_at":"2026-11-20T10:00:00Z","details":{"firstName":"Zz-Test","idNumber":"12345678"}}]'::jsonb)) ->> 'upserted',
          '1', 'customer upserted') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((api.surense_customers_upsert('[{"surense_id":"c1000000-0000-4000-8000-000000000001","status_name":"stale",
            "surense_modified_at":"2026-11-19T10:00:00Z","details":{}}]'::jsonb)) ->> 'upserted', '0', 'older copy ignored') end;
reset role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok((select status_name = 'active' and octet_length(national_id_hmac) = 32
                  and position(convert_to('Zz-Test', 'utf8') in details_enc) = 0
                  and position(convert_to('12345678', 'utf8') in details_enc) = 0
             from crm.surense_customers where id = 'c1000000-0000-4000-8000-000000000001'), 'hmac 32 bytes, details encrypted') end;
select is((select count(*)::int from audit.log where table_name like 'crm.surense%' and op in ('INSERT', 'UPDATE', 'DELETE')
              and (old_data is not null or new_data is not null)), 0, 'mirror change rows carry no values');
select is_empty($$ select l.id from audit.log l, jsonb_object_keys(coalesce(l.new_data, '{}')) k
                   where l.op = 'ACTION' and (l.table_name like '%surense%' or l.table_name = 'surense.api')
                     and k not in ('action', 'type', 'mode', 'op', 'status', 'phase') $$,
  'connector ACTION rows carry codes only');

-- backoff, dead + alert (direct rows; no Vault needed). Job ids are resolved as postgres: service_role has no table privilege.
insert into ops.surense_jobs (kind, params, status, attempts) values ('surense.pull_customers', '{}', 'processing', 1), ('surense.pull_documents', '{}', 'processing', 5);
select set_config('t.j1', (select max(id) from ops.surense_jobs where kind = 'surense.pull_customers' and attempts = 1)::text, true);
select set_config('t.j5', (select max(id) from ops.surense_jobs where kind = 'surense.pull_documents')::text, true);
insert into ops.surense_jobs (kind, params, status, attempts) values ('surense.pull_customers', '{"t":"ra"}', 'processing', 1),
  ('surense.pull_customers', '{"t":"rb"}', 'processing', 1);
select set_config('t.ja', (select id from ops.surense_jobs where params ->> 't' = 'ra')::text, true);
select set_config('t.jb', (select id from ops.surense_jobs where params ->> 't' = 'rb')::text, true);
set local role service_role;
select lives_ok($$select api.surense_job_complete(current_setting('t.j1')::bigint, 1, 'failed', 'surense_503')$$, 'complete failed (attempt 1)');
select lives_ok($$select api.surense_job_complete(current_setting('t.j5')::bigint, 5, 'failed', 'surense_503')$$, 'complete failed (attempt 5)');
select throws_ok($$select api.surense_job_complete(1, 1, 'failed', 'has spaces and text')$$, 'PT400', 'invalid_input:error', 'error codes only');
select throws_ok($$select api.surense_job_complete(1, null, 'done')$$, 'PT400', 'invalid_input:attempts', 'attempts required');
-- a stale run (job no longer processing at that attempt) changes nothing
select lives_ok($$select api.surense_job_complete(current_setting('t.j1')::bigint, 1, 'done')$$, 'stale complete is a no-op');
select lives_ok($$select api.surense_job_complete(current_setting('t.j5')::bigint, 5, 'done')$$, 'stale complete cannot revive a dead job');
select lives_ok($$select api.surense_job_complete(current_setting('t.ja')::bigint, 1, 'failed', 'surense_http_503', 'unavailable', 600)$$,
  'complete failed with retry-after 600 s');
select lives_ok($$select api.surense_job_complete(current_setting('t.jb')::bigint, 1, 'failed', 'surense_http_503', 'unavailable', 5)$$,
  'complete failed with retry-after 5 s');
select throws_ok($$select api.surense_job_complete(1, 1, 'failed', 'x', 'unavailable', -1)$$, 'PT400', 'invalid_input:retry_after', 'retry-after range');
select throws_ok($$select api.surense_job_complete(1, 1, 'failed', 'x', 'Some text', null)$$, 'PT400', 'invalid_input:error_kind', 'error kind is a code');
reset role;
select ok((select status = 'pending' and next_attempt_at >= now() + interval '30 seconds' and next_attempt_at <= now() + interval '60 seconds'
             from ops.surense_jobs where id = current_setting('t.j1')::bigint), 'attempt 1 backs off one minute with jitter 0.5-1.0 (stale done ignored)');
select is((select next_attempt_at from ops.surense_jobs where id = current_setting('t.ja')::bigint), now() + interval '600 seconds',
  'next_attempt_at honours p_retry_after (longer than the backoff; never jittered below it)');
select is((select last_error || ':' || last_error_kind from ops.surense_jobs where id = current_setting('t.ja')::bigint), 'surense_http_503:unavailable',
  'error code and kind recorded');
select ok((select next_attempt_at >= now() + interval '30 seconds' and next_attempt_at <= now() + interval '60 seconds'
             from ops.surense_jobs where id = current_setting('t.jb')::bigint), 'a retry-after shorter than the backoff keeps the backoff');
select is((select status from ops.surense_jobs where kind = 'surense.pull_documents' order by id desc limit 1), 'dead', 'attempt 5 goes dead');
select is((select count(*)::int from ops.alerts where kind = 'surense_job_dead' and status = 'pending'), 1, 'dead job raises one alert');
select is_empty($$ select summary from ops.alerts where kind = 'surense_job_dead' and summary !~ '^surense job id=[0-9]+ \(surense\.[a-z_]+\) is dead after 5 attempts$' $$,
  'alert summary holds ids and kind only');

-- a run that died before complete at its last attempt: the next claim dead-letters it instead of reclaiming it forever
delete from ops.alerts where kind = 'surense_job_dead';
insert into ops.surense_jobs (kind, params, status, attempts, locked_until)
values ('surense.e9100_download', '{}', 'processing', 5, now() - interval '1 minute');
select set_config('t.jx', (select max(id) from ops.surense_jobs where kind = 'surense.e9100_download')::text, true);
set local role service_role;
select is((select count(*)::int from api.surense_job_claim(25) where id = current_setting('t.jx')::bigint), 0, 'expired lock at attempt 5 is not claimed');
reset role;
select is((select status || ':' || attempts || ':' || last_error from ops.surense_jobs where id = current_setting('t.jx')::bigint), 'dead:5:lock_expired',
  'it ends dead');
select is((select count(*)::int from ops.alerts where kind = 'surense_job_dead' and status = 'pending'), 1, 'with one critical alert');

-- staff switch list accepts the three keys (direct check of the allowlist text; the RPC itself needs a fresh-TOTP admin)
select ok((select prosrc ~ 'surense_enabled' and prosrc ~ 'surense_write_enabled' and prosrc ~ 'surense_webhook_enabled'
                  and prosrc ~ 'surense_e9100_enabled' and prosrc ~ 'surense_retention_enabled'
             from pg_proc where oid = 'staff.admin_config_set(text, text)'::regprocedure), 'admin_config_set allows the Surense switches');

-- write audit phases: 'pending' before the request, then 'result' / 'ambiguous'
set local role service_role;
select lives_ok($$select api.surense_audit('proxies.invite', 'c1000000-0000-4000-8000-000000000009', null, 'pending')$$, 'pending audit row before a write');
select lives_ok($$select api.surense_audit('proxies.invite', 'c1000000-0000-4000-8000-000000000009', 0, 'ambiguous')$$, 'ambiguous audit row after a timeout');
select throws_ok($$select api.surense_audit('proxies.invite', null, 200, 'later')$$, 'PT400', 'invalid_input:phase', 'phase is one of three codes');
reset role;
select is((select string_agg(new_data ->> 'phase', ',' order by id) from audit.log
            where table_name = 'surense.api' and pk = 'c1000000-0000-4000-8000-000000000009'), 'pending,ambiguous', 'audit rows carry the phase');

-- retention of inbox and queue: switch surense_retention_enabled off -> ops.cleanup deletes nothing (no-delete rule)
insert into ops.surense_events (svix_id, event_type, svix_ts, received_at, payload_enc, payload_bytes)
values ('msg_old00001', 'lead.created', now() - interval '91 days', now() - interval '91 days', '\x00', 2),
       ('msg_old00002', 'lead.created', now() - interval '91 days', now() - interval '91 days', '\x00', 2),
       ('msg_new00001', 'lead.created', now(), now(), '\x00', 2);
insert into ops.surense_jobs (kind, event_id, params, status, processed_at)
select 'surense.event', id, '{"t":"old_done"}'::jsonb, 'done', now() - interval '91 days' from ops.surense_events where svix_id = 'msg_old00001'
union all
select 'surense.event', id, '{"t":"old_dead"}'::jsonb, 'dead', now() - interval '1 day' from ops.surense_events where svix_id = 'msg_old00001';
insert into ops.surense_jobs (kind, event_id, params, status)
select 'surense.event', id, '{"t":"old_open"}'::jsonb, 'pending' from ops.surense_events where svix_id = 'msg_old00002';
insert into ops.surense_jobs (kind, params, status, processed_at) values
  ('surense.pull_customers', '{"t":"closed_31d"}', 'done', now() - interval '31 days'),
  ('surense.pull_customers', '{"t":"dead_91d"}', 'dead', now() - interval '91 days');
select set_config('t.n_ev', (select count(*) from ops.surense_events)::text, true);
select set_config('t.n_jobs', (select count(*) from ops.surense_jobs)::text, true);
select set_config('t.r', ops.cleanup()::text, true);
select is((select count(*)::text from ops.surense_events), current_setting('t.n_ev'), 'switch off: no Surense event deleted');
select is((select count(*)::text from ops.surense_jobs), current_setting('t.n_jobs'), 'switch off: no Surense job deleted');
select is((select count(*)::int from ops.surense_jobs where event_id is null and params ->> 't' in ('old_done', 'old_dead', 'old_open')), 0,
  'switch off: no job lost its event');
select ok((current_setting('t.r')::jsonb ->> 'surense_events')::int = 0 and (current_setting('t.r')::jsonb ->> 'surense_jobs')::int = 0,
  'cleanup reports zero Surense deletions while the switch is off');

-- mirror retention (switch surense_retention_enabled; direct rows, no Vault needed)
insert into crm.surense_customers (id, details_enc, deleted_at) values
  ('c2000000-0000-4000-8000-000000000001', '\x00', now() - interval '31 days'),
  ('c2000000-0000-4000-8000-000000000002', '\x00', now() - interval '1 day'),
  ('c2000000-0000-4000-8000-000000000003', '\x00', null);
insert into crm.surense_products (id, customer_surense_id, details_enc) values
  ('d2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', '\x00');
insert into crm.surense_portfolios (customer_surense_id, mode, snapshot_enc, fetched_at)
select 'c2000000-0000-4000-8000-000000000003', 'production', '\x00', now() - make_interval(days => g) from generate_series(1, 5) g;
select lives_ok($$select ops.cleanup()$$, 'cleanup with mirror retention off');
select is((select count(*)::int from crm.surense_customers where id::text like 'c2000000-%'), 3, 'mirror untouched while the switch is off');
select is((select count(*)::int from crm.surense_portfolios where customer_surense_id = 'c2000000-0000-4000-8000-000000000003'), 5, 'snapshots untouched');
update ops.config set value = 'true' where key = 'surense_retention_enabled';
select set_config('t.r2', ops.cleanup()::text, true);
select set_eq($$ select id::text from crm.surense_customers where id::text like 'c2000000-%' $$,
  $$ values ('c2000000-0000-4000-8000-000000000002'), ('c2000000-0000-4000-8000-000000000003') $$,
  'tombstone older than 30 days purged; newer tombstone and live customer kept');
select is((select count(*)::int from crm.surense_products where id = 'd2000000-0000-4000-8000-000000000001'), 0, 'its products go with it');
select is((select min(fetched_at) from crm.surense_portfolios where customer_surense_id = 'c2000000-0000-4000-8000-000000000003'),
  (select now() - interval '3 days'), 'only the latest 3 snapshots per customer and mode are kept');
select ok((current_setting('t.r2')::jsonb ->> 'surense_mirror')::int >= 2 and (current_setting('t.r2')::jsonb ->> 'surense_snapshots')::int >= 2,
  'cleanup reports the mirror counts');
-- same run, inbox and queue windows (switch on): events 90 days unless a job is open; closed jobs 30 days, dead 90 days
select is((select count(*)::int from ops.surense_events where svix_id = 'msg_old00001'), 0, 'switch on: event older than 90 days purged');
select is((select count(*)::int from ops.surense_events where svix_id = 'msg_old00002'), 1, 'an old event with an open job is kept');
select is((select count(*)::int from ops.surense_events where svix_id = 'msg_new00001'), 1, 'new event kept');
select is((select status || ':' || coalesce(event_id::text, 'null') from ops.surense_jobs where params ->> 't' = 'old_dead'), 'dead:null',
  'the dead job of a purged event survives with event_id null (no cascade)');
select is((select count(*)::int from ops.surense_jobs where params ->> 't' in ('old_done', 'closed_31d', 'dead_91d')), 0,
  'closed jobs past 30 days and dead jobs past 90 days purged');
select ok((current_setting('t.r2')::jsonb ->> 'surense_events')::int >= 1 and (current_setting('t.r2')::jsonb ->> 'surense_jobs')::int >= 3,
  'cleanup reports the Surense counts');

-- soft delete clears the personal data at once (Vault)
set local role service_role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((api.surense_customer_mark_deleted('c1000000-0000-4000-8000-000000000001')) ->> 'updated', 'true', 'customer marked deleted') end;
reset role;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok((select deleted_at is not null and national_id_hmac is null and private.pii_decrypt(details_enc) = '{}'
             from crm.surense_customers where id = 'c1000000-0000-4000-8000-000000000001'), 'tombstone keeps no hmac and no details') end;

select * from finish();
rollback;
