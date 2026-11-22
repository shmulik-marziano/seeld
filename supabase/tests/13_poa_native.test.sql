-- 13: POA native engine + ship (20261122180000). Synthetic values only. Runs as postgres. Needs Vault like 12.
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
select ok(current_setting('t.has_vault')::boolean, 'Vault is present');

-- ---------------------------------------------------------------- structure and privileges
select has_column('crm', 'poa_sessions', 'ship_status', 'ship_status column');
select has_column('crm', 'poa_sessions', 'ship_error', 'ship_error column');
select has_column('crm', 'poa_sessions', 'shipped_at', 'shipped_at column');
select ok(has_function_privilege('service_role', 'api.poa_ship_enqueue(uuid)', 'execute') and not has_function_privilege('authenticated', 'api.poa_ship_enqueue(uuid)', 'execute'), 'ship_enqueue: service_role only');
select ok(has_function_privilege('service_role', 'api.poa_ship_get(uuid)', 'execute') and not has_function_privilege('anon', 'api.poa_ship_get(uuid)', 'execute'), 'ship_get: service_role only');
select ok(has_function_privilege('service_role', 'api.poa_ship_set(uuid, text, text, uuid)', 'execute'), 'ship_set: service_role');
select ok(has_function_privilege('service_role', 'api.poa_document_from_url(uuid, text, text, text)', 'execute'), 'from_url with source: service_role');
select ok(not has_function_privilege('service_role', 'private.poa_ship_queue(uuid)', 'execute'), 'private queue helper not exposed');
select ok(has_function_privilege('authenticated', 'staff.poa_ship_retry(uuid)', 'execute') and not has_function_privilege('anon', 'staff.poa_ship_retry(uuid)', 'execute'), 'ship_retry: authenticated only');
select lives_ok($$insert into ops.surense_jobs (kind, params) values ('surense.poa_ship', '{}')$$, 'the kind check accepts surense.poa_ship');
select is((select count(*)::int from cron.job where jobname = 'surense-worker-tick' and schedule = '* * * * *'), 1, 'surense-worker ticks every minute');

-- ---------------------------------------------------------------- fixtures: a completed native session with three approvals, an open one, a surense one
insert into crm.poa_sessions (id, agency_id, token_hash, status, engine, modules, national_id_hmac, phone_hmac, phone_tail, identity_enc, expires_at, completed_at)
values ('c4000000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', extensions.digest('nt-1', 'sha256'), 'completed', 'native',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":true,"required":true,"performed":true},"policies":{"enabled":true,"required":true,"performed":true}}',
        extensions.digest('nt-n', 'sha256'), extensions.digest('nt-p', 'sha256'), '67',
        private.pii_encrypt('{"first_name":"Zz-Nat","last_name":"Zz-Test","email":null,"national_id":"000000018","phone":"+972501234567","street":"Zz-Street 12","city":"Zz-City","zip":"6473912","marketing_approved":true,"birth_date":"1990-05-17","issue_date":"2015-01-01"}'),
        now() + interval '30 minutes', now() - interval '5 minutes'),
       ('c4000000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001', extensions.digest('nt-2', 'sha256'), 'open', 'native',
        '{"maslaka":{"enabled":true,"required":true,"performed":false},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        extensions.digest('nt-n2', 'sha256'), extensions.digest('nt-p2', 'sha256'), '67', private.pii_encrypt('{"first_name":"Zz-Nat"}'), now() + interval '30 minutes', null),
       ('c4000000-0000-4000-8000-000000000003', '5eed0000-0000-4000-8000-000000000001', extensions.digest('nt-3', 'sha256'), 'completed', 'surense',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        extensions.digest('nt-n3', 'sha256'), extensions.digest('nt-p3', 'sha256'), '67', private.pii_encrypt('{"first_name":"Zz-Sur"}'), now() + interval '30 minutes', now() - interval '5 minutes');
insert into crm.poa_consents (session_id, kind, method, approved_at, preview_sha256, signature_enc, ip_enc) values
  ('c4000000-0000-4000-8000-000000000001', 'poa_maslaka', 'check', now() - interval '9 minutes', decode(repeat('a', 64), 'hex'), null, private.pii_encrypt('203.0.113.7')),
  ('c4000000-0000-4000-8000-000000000001', 'poa_harbit', 'check', now() - interval '7 minutes', decode(repeat('b', 64), 'hex'), null, private.pii_encrypt('203.0.113.7')),
  ('c4000000-0000-4000-8000-000000000001', 'poa_policies', 'signature', now() - interval '5 minutes', decode(repeat('c', 64), 'hex'),
   private.pii_encrypt('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), private.pii_encrypt('203.0.113.7'));

-- ---------------------------------------------------------------- the native document row
update ops.config set value = 'true' where key = 'poa_docs_enabled';
set local role service_role;
select throws_ok($$select api.poa_document_from_url('c4000000-0000-4000-8000-000000000001', 'maslaka', repeat('1', 64), 'other')$$, 'PT400', 'invalid_input:source', 'from_url: source is surense or native');
select is((api.poa_document_from_url('c4000000-0000-4000-8000-000000000001', 'maslaka', repeat('1', 64), 'native')) ->> 'stored', 'false', 'from_url native: row created');
select is((api.poa_document_from_url('c4000000-0000-4000-8000-000000000001', 'harbit', repeat('2', 64))) ->> 'stored', 'false', 'from_url defaults to surense');
reset role;
select is((select source from crm.documents where session_id = 'c4000000-0000-4000-8000-000000000001' and kind = 'maslaka'), 'native', 'the native file is recorded as native');
select is((select source from crm.documents where session_id = 'c4000000-0000-4000-8000-000000000001' and kind = 'harbit'), 'surense', 'the default source stays surense');

-- ---------------------------------------------------------------- ship: closed while the switches are off
set local role service_role;
select throws_ok($$select api.poa_ship_enqueue('c4000000-0000-4000-8000-000000000001')$$, 'PT423', 'feature_disabled:surense_enabled', 'enqueue closed with the queue switch off');
select throws_ok($$select api.poa_ship_get('c4000000-0000-4000-8000-000000000001')$$, 'PT423', 'feature_disabled:surense_write_enabled', 'ship_get closed with the write switch off (nothing is decrypted)');
reset role;
update ops.config set value = 'true' where key in ('surense_enabled', 'surense_write_enabled');

-- ---------------------------------------------------------------- enqueue: only a completed native session, once
set local role service_role;
select throws_ok($$select api.poa_ship_enqueue(null)$$, 'PT400', 'invalid_input:session', 'enqueue: session required');
select throws_ok($$select api.poa_ship_enqueue('c4999999-0000-4000-8000-000000000001')$$, 'PT401', 'session_inactive', 'enqueue: unknown session');
select throws_ok($$select api.poa_ship_enqueue('c4000000-0000-4000-8000-000000000002')$$, 'PT409', 'session_not_completed', 'enqueue: an open session is not shipped');
select throws_ok($$select api.poa_ship_enqueue('c4000000-0000-4000-8000-000000000003')$$, 'PT400', 'invalid_input:engine', 'enqueue: a surense session is not shipped (the live chain did it)');
select is((api.poa_ship_enqueue('c4000000-0000-4000-8000-000000000001')) ->> 'duplicate', 'false', 'enqueue: one job');
select is((api.poa_ship_enqueue('c4000000-0000-4000-8000-000000000001')) ->> 'duplicate', 'true', 'enqueue again: the same open job (dedupe)');
reset role;
select is((select ship_status from crm.poa_sessions where id = 'c4000000-0000-4000-8000-000000000001'), 'pending', 'the session is pending');
select is((select count(*)::int from ops.surense_jobs where kind = 'surense.poa_ship' and status = 'pending' and dedupe_key = 'poa_ship:c4000000-0000-4000-8000-000000000001'
            and params = '{"session_id":"c4000000-0000-4000-8000-000000000001"}'::jsonb), 1, 'one pending ship job with the session id only');

-- ---------------------------------------------------------------- the job's read
set local role service_role;
select throws_ok($$select api.poa_ship_get('c4000000-0000-4000-8000-000000000002')$$, 'PT409', 'session_not_completed', 'ship_get: open session refused');
select throws_ok($$select api.poa_ship_get('c4000000-0000-4000-8000-000000000003')$$, 'PT400', 'invalid_input:engine', 'ship_get: surense session refused');
select set_config('t.ship', (api.poa_ship_get('c4000000-0000-4000-8000-000000000001'))::text, true);
reset role;
select is(current_setting('t.ship')::jsonb -> 'identity' ->> 'first_name', 'Zz-Nat', 'ship_get: identity decrypted');
select is(current_setting('t.ship')::jsonb -> 'identity' ->> 'zip', '6473912', 'ship_get: address included');
select is(current_setting('t.ship')::jsonb -> 'identity' ->> 'marketing_approved', 'true', 'ship_get: marketing flag');
select is(current_setting('t.ship')::jsonb ->> 'ship_status', 'pending', 'ship_get: ship state');
select is((select array_agg(k order by k) from jsonb_object_keys(current_setting('t.ship')::jsonb -> 'consents') k), array['harbit', 'maslaka', 'policies'], 'ship_get: the three approvals');
select is(current_setting('t.ship')::jsonb -> 'consents' -> 'harbit' ->> 'birth_date', '1990-05-17', 'ship_get: harbit birth date');
select is(current_setting('t.ship')::jsonb -> 'consents' -> 'harbit' ->> 'issue_date', '2015-01-01', 'ship_get: harbit issue date');
select ok((current_setting('t.ship')::jsonb -> 'consents' -> 'policies' ->> 'signature') like 'data:image/png;base64,%', 'ship_get: the signature data url');
select ok(current_setting('t.ship')::jsonb -> 'consents' -> 'maslaka' ->> 'signature' is null, 'ship_get: no signature on maslaka');
select ok(exists (select 1 from audit.log where table_name = 'crm.poa_sessions' and pk = 'c4000000-0000-4000-8000-000000000001' and new_data ->> 'action' = 'poa_ship_get'),
  'ship_get leaves an audit row');

-- ---------------------------------------------------------------- the job's write
set local role service_role;
select throws_ok($$select api.poa_ship_set('c4000000-0000-4000-8000-000000000001', 'done')$$, 'PT400', 'invalid_input:status', 'ship_set: status');
select throws_ok($$select api.poa_ship_set('c4000000-0000-4000-8000-000000000001', 'failed', 'Bad Code')$$, 'PT400', 'invalid_input:code', 'ship_set: code shape');
select throws_ok($$select api.poa_ship_set('c4000000-0000-4000-8000-000000000003', 'failed', 'x')$$, 'PT400', 'invalid_input:engine', 'ship_set: surense session refused');
select lives_ok($$select api.poa_ship_set('c4000000-0000-4000-8000-000000000001', 'failed', 'dp_http_500')$$, 'ship_set: a failure');
reset role;
select is((select ship_status || '/' || ship_error || '/' || ship_attempts || '/' || engine_last_error from crm.poa_sessions where id = 'c4000000-0000-4000-8000-000000000001'),
  'failed/dp_http_500/1/dp_http_500', 'failed: status, code, attempt counted, engine_last_error');
set local role service_role;
select lives_ok($$select api.poa_ship_set('c4000000-0000-4000-8000-000000000001', 'shipped', null, 'c4000000-0000-4000-8000-0000000000c1')$$, 'ship_set: shipped with the customer id');
reset role;
select is((select ship_status || '/' || coalesce(ship_error, '-') || '/' || ship_attempts || '/' || surense_customer_id from crm.poa_sessions where id = 'c4000000-0000-4000-8000-000000000001'),
  'shipped/-/2/c4000000-0000-4000-8000-0000000000c1', 'shipped: status, no code, attempts, customer id');
select ok((select shipped_at is not null from crm.poa_sessions where id = 'c4000000-0000-4000-8000-000000000001'), 'shipped_at stamped');
set local role service_role;
select throws_ok($$select api.poa_ship_enqueue('c4000000-0000-4000-8000-000000000001')$$, 'PT409', 'already_shipped', 'a shipped session is not queued again');
-- the ship_ code on a completed session (poa_session_fail)
update ops.config set value = 'true' where key = 'poa_enabled';
select lives_ok($$select api.poa_session_fail('c4000000-0000-4000-8000-000000000001', 'ship_423')$$, 'a completed session records that the ship was not queued');
reset role;

-- ---------------------------------------------------------------- staff: list columns and "שגר שוב"
update crm.poa_sessions set ship_status = 'failed', ship_error = 'dp_http_500', shipped_at = null where id = 'c4000000-0000-4000-8000-000000000001';
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f5'), ('00000000-0000-0000-0000-0000000000f2');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000f5', 'admin', 'Admin N', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000f2', 'agent', 'Agent N', '5eed0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select staff.poa_ship_retry('c4000000-0000-4000-8000-000000000001')$$, 'PT403', 'forbidden:admin_fresh_totp', 'an agent cannot re-queue');
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000f5', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select is((select engine || '/' || ship_status || '/' || ship_error from staff.poa_session_list() where id = 'c4000000-0000-4000-8000-000000000001'), 'native/failed/dp_http_500',
  'the list shows the engine and the ship state');
select is((select documents -> 0 ->> 'source' from staff.poa_session_list() where id = 'c4000000-0000-4000-8000-000000000001'), 'surense', 'the list shows each document''s source');
select throws_ok($$select staff.poa_ship_retry('c4999999-0000-4000-8000-000000000001')$$, 'PT404', 'not_found', 'retry: unknown session');
select is((staff.poa_ship_retry('c4000000-0000-4000-8000-000000000001')) ->> 'duplicate', 'true', 'retry re-queues (the earlier job is still open: dedupe)');
reset role;
select is((select ship_status || '/' || coalesce(ship_error, '-') from crm.poa_sessions where id = 'c4000000-0000-4000-8000-000000000001'), 'pending/-', 'retry: pending again, code cleared');

select * from finish();
rollback;
