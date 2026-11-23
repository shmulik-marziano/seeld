-- 16: client area backend (20261124100000). Synthetic values only. Runs as postgres.
-- Vault keys are created inside this rolled-back transaction when absent (same as 12). Never run against the real keys.
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
select ok(current_setting('t.has_vault')::boolean, 'Vault is present (the client area needs it)');

-- ---------------------------------------------------------------- switches, structure, privileges
select set_eq($$ select key || '=' || value from ops.config where key like 'client_area%' $$,
  $$ values ('client_area_enabled=false'), ('client_area_turnstile_required=true'), ('client_area_retention_enabled=false') $$,
  'three client-area keys seeded; the master switch is off');
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'crm' and c.relname in ('client_login_challenges', 'client_sessions') and c.relrowsecurity), 2, 'RLS on both tables');
select is_empty($$ select r || ' ' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    cross join unnest(array['anon', 'authenticated', 'service_role']) r
                   where n.nspname = 'crm' and c.relname in ('client_login_challenges', 'client_sessions')
                     and has_table_privilege(r, c.oid, 'SELECT,INSERT,UPDATE,DELETE') $$,
  'no table privilege for API roles on the client-area tables');
select is((select count(*)::int from pg_trigger where tgrelid in ('crm.client_login_challenges'::regclass, 'crm.client_sessions'::regclass)
            and tgname like '%\_audit' and not tgisinternal), 2, 'audit trigger on each table');
select is_empty($$ select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'crm' and c.relname in ('client_login_challenges', 'client_sessions') and a.attnum > 0 and not a.attisdropped
                     and a.attname ~ '(name|email|address|id_number|national_id$|birth|^ip$|cell|^phone$|token$)'
                     and a.attname not in ('phone_hmac', 'phone_tail', 'phone_enc', 'national_id_hmac') $$,
  'no personal plain column in the client-area tables');
select ok(not has_function_privilege('anon', 'api.client_login_start(text, text, text, bytea)', 'execute')
          and not has_function_privilege('authenticated', 'api.client_login_start(text, text, text, bytea)', 'execute'), 'login start: not for API roles');
select ok(has_function_privilege('service_role', 'api.client_portfolio_get(bytea)', 'execute'), 'service_role reads a portfolio');
select ok(not has_function_privilege('service_role', 'private.client_session_of(bytea)', 'execute'), 'private helper not exposed');
select ok(has_function_privilege('authenticated', 'staff.client_sessions_revoke(uuid)', 'execute')
          and not has_function_privilege('anon', 'staff.client_sessions_revoke(uuid)', 'execute'), 'staff revoke: authenticated only');
select is((select count(*)::int from cron.job where jobname = 'client-area-cleanup'), 1, 'cleanup scheduled');

-- ---------------------------------------------------------------- fixtures (synthetic)
insert into crm.customers (id, agency_id, first_name, last_name, mobile_phone, national_id_hmac, national_id_enc)
values ('c5000000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', 'Zz-Client', 'Test', '0501234567',
        private.national_id_hmac('000000018'), private.pii_encrypt('000000018')),
       ('c5000000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001', 'Zz-Other', 'Test', '0509999999',
        private.national_id_hmac('000000026'), private.pii_encrypt('000000026'));
-- Surense mirror: the same national id as client 1; one hidden product; one tombstone that must stay invisible
insert into crm.surense_customers (id, national_id_hmac, details_enc)
values ('c5100000-0000-4000-8000-000000000001', private.national_id_hmac('000000018'), private.pii_encrypt('{"firstName":"Zz-Client"}')),
       ('c5100000-0000-4000-8000-000000000002', private.national_id_hmac('000000026'), private.pii_encrypt('{"firstName":"Zz-Other"}'));
insert into crm.surense_products (id, customer_surense_id, source, company_id, product_type, hidden, surense_modified_at, details_enc) values
  ('d5100000-0000-4000-8000-000000000001', 'c5100000-0000-4000-8000-000000000001', 'מסלקה_פנסיונית', 11, 1, false, now(),
   private.pii_encrypt('{"accountPolicyNumber":"123456789","accumulation":123456.5,"shemTohnit":"Zz-Plan","status":"פעיל"}')),
  ('d5100000-0000-4000-8000-000000000002', 'c5100000-0000-4000-8000-000000000001', 'הר_הביטוח', 12, 13, true, now(),
   private.pii_encrypt('{"accountPolicyNumber":"HIDDEN-1"}')),
  ('d5100000-0000-4000-8000-000000000003', 'c5100000-0000-4000-8000-000000000002', 'הר_הביטוח', 12, 13, false, now(),
   private.pii_encrypt('{"accountPolicyNumber":"OTHER-1"}'));
insert into crm.surense_portfolios (customer_surense_id, mode, product_count, snapshot_enc, fetched_at)
values ('c5100000-0000-4000-8000-000000000001', 'production', 2, private.pii_encrypt('{}'), now() - interval '3 days');
insert into crm.surense_documents (id, kind, surense_id, customer_surense_id, mime, size_bytes, details_enc)
values ('d5200000-0000-4000-8000-000000000001', 'document', 'd5300000-0000-4000-8000-000000000001', 'c5100000-0000-4000-8000-000000000001',
        'application/pdf', 1234, private.pii_encrypt('{"name":"Zz-Surense-Doc.pdf"}'));
-- a completed POA wizard session of client 1 with one stored final document
insert into crm.poa_sessions (id, agency_id, token_hash, status, modules, national_id_hmac, phone_hmac, phone_tail, identity_enc, expires_at, completed_at)
values ('c5300000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', extensions.digest('ca-poa-1', 'sha256'), 'completed',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        private.national_id_hmac('000000018'), extensions.digest('ca-p', 'sha256'), '67', private.pii_encrypt('{"first_name":"Zz-Client"}'),
        now() - interval '1 day', now() - interval '1 day');
insert into crm.documents (id, session_id, kind, source, status, storage_path, sha256, stored_at)
values ('d5400000-0000-4000-8000-000000000001', 'c5300000-0000-4000-8000-000000000001', 'maslaka', 'native', 'active',
        'poa/5eed0000-0000-4000-8000-000000000001/c5300000-0000-4000-8000-000000000001/maslaka-d5400000-0000-4000-8000-000000000001.pdf',
        decode(repeat('ab', 32), 'hex'), now() - interval '1 day');

select set_config('t.th1', encode(extensions.digest('client-fixture-token-1', 'sha256'), 'hex'), true);
select set_config('t.th2', encode(extensions.digest('client-fixture-token-2', 'sha256'), 'hex'), true);

-- ---------------------------------------------------------------- every RPC closed while the switch is off
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select is(api.client_area_config(), '{"enabled": false, "turnstile_required": true}'::jsonb, 'config snapshot while closed');
select throws_ok($$select api.client_login_start('000000018', '0501234567', '203.0.113.7', null)$$, 'PT423', 'feature_disabled:client_area_enabled', 'start closed');
select throws_ok($$select api.client_login_challenge_use('c5000000-0000-4000-8000-0000000000f1')$$, 'PT423', 'feature_disabled:client_area_enabled', 'challenge use closed');
select throws_ok($$select api.client_login_verify('c5000000-0000-4000-8000-0000000000f1', decode(current_setting('t.th1'), 'hex'), '203.0.113.7', 'ua')$$,
  'PT423', 'feature_disabled:client_area_enabled', 'verify closed');
select throws_ok($$select api.client_session_get(decode(current_setting('t.th1'), 'hex'))$$, 'PT423', 'feature_disabled:client_area_enabled', 'session closed');
select throws_ok($$select api.client_portfolio_get(decode(current_setting('t.th1'), 'hex'))$$, 'PT423', 'feature_disabled:client_area_enabled', 'portfolio closed');
select throws_ok($$select api.client_documents_list(decode(current_setting('t.th1'), 'hex'))$$, 'PT423', 'feature_disabled:client_area_enabled', 'documents closed');
select throws_ok($$select api.client_document_get(decode(current_setting('t.th1'), 'hex'), 'd5400000-0000-4000-8000-000000000001')$$, 'PT423', 'feature_disabled:client_area_enabled', 'document closed');
select throws_ok($$select api.client_logout(decode(current_setting('t.th1'), 'hex'))$$, 'PT423', 'feature_disabled:client_area_enabled', 'logout closed');
select throws_ok($$select count(*) from crm.client_sessions$$, '42501', null, 'service_role cannot read the table directly');
reset role;

-- ---------------------------------------------------------------- login start: validation, same shape for a hit and a miss
update ops.config set value = 'true' where key = 'client_area_enabled';
set local role service_role;
select is(api.client_area_config() ->> 'enabled', 'true', 'config snapshot open');
select throws_ok($$select api.client_login_start('12', '0501234567', '203.0.113.7', null)$$, 'PT400', 'invalid_input:national_id', 'id must be digits (5..9)');
select throws_ok($$select api.client_login_start('000000018', '031234567', '203.0.113.7', null)$$, 'PT400', 'invalid_input:phone', 'a landline is refused');
select throws_ok($$select api.client_login_start('000000018', '0501234567', null, null)$$, 'PT400', 'invalid_input:client_ip', 'the client ip is required');
select throws_ok($$select api.client_login_start('000000018', '0501234567', '203.0.113.7', decode('00', 'hex'))$$, 'PT400', 'invalid_input:ua_hash', 'ua hash is 32 bytes');

select set_config('t.ra', (api.client_login_start('000000018', '+972501234567', '203.0.113.7', decode(repeat('ab', 32), 'hex')))::text, true);
select set_config('t.rb', (api.client_login_start('000000026', '0501111111', '203.0.113.8', null))::text, true);
select set_config('t.rc', (api.client_login_start('000000018', '0502222222', '203.0.113.9', null))::text, true);
reset role;
select is((select array_agg(k order by k) from jsonb_object_keys(current_setting('t.ra')::jsonb) k),
          (select array_agg(k order by k) from jsonb_object_keys(current_setting('t.rb')::jsonb) k), 'the same keys for a match and a miss');
select is(current_setting('t.ra')::jsonb ->> 'matched', 'true', 'id + our mobile: matched');
select is(current_setting('t.ra')::jsonb ->> 'phone', '0501234567', 'the matched mobile goes back to the function (local digits)');
select is(current_setting('t.ra')::jsonb ->> 'phone_tail', '67', 'tail of the number typed');
select is(current_setting('t.ra')::jsonb ->> 'expires_in_sec', '600', '10 minutes');
select is(current_setting('t.rb')::jsonb ->> 'matched', 'false', 'wrong mobile for a known id: no match');
select ok((current_setting('t.rb')::jsonb -> 'phone') = 'null'::jsonb, 'no phone for a miss');
select is(current_setting('t.rb')::jsonb ->> 'phone_tail', '11', 'a miss still echoes the tail of the number typed');
select is(current_setting('t.rc')::jsonb ->> 'matched', 'false', 'right id, foreign mobile: no match');
select is((select count(*)::int from crm.client_login_challenges), 3, 'one challenge row per start, hit or miss');
select is((select count(*)::int from audit.log where table_name = 'crm.client_login_challenges' and op = 'INSERT' and new_data is null), 3, 'row audit carries no values');
select ok((select matched and customer_id = 'c5000000-0000-4000-8000-000000000001' and agency_id = '5eed0000-0000-4000-8000-000000000001'
                  and phone_enc is not null and position(convert_to('0501234567', 'utf8') in phone_enc) = 0 and phone_tail = '67'
                  and status = 'pending' and attempts = 0 and ip_hash is not null
             from crm.client_login_challenges where id = (current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid), 'matched challenge: customer linked, mobile encrypted');
select ok((select not matched and customer_id is null and phone_enc is null
             from crm.client_login_challenges where id = (current_setting('t.rb')::jsonb ->> 'challenge_id')::uuid), 'missed challenge: nothing linked, no mobile kept');
select is_empty($$ select l.id from audit.log l, jsonb_object_keys(coalesce(l.new_data, '{}')) k
                   where l.op = 'ACTION' and l.table_name like 'crm.client_%' and k not in ('action', 'matched', 'count', 'kind') $$,
  'client-area ACTION rows carry codes only');

-- rate limit: 5 starts per national id per hour (id 000000018 has two so far; three more pass, the sixth is refused)
set local role service_role;
select lives_ok($$select api.client_login_start('000000018', '0503333333', '203.0.113.10', null)$$, 'start 3 for the id');
select lives_ok($$select api.client_login_start('000000018', '0504444444', '203.0.113.11', null)$$, 'start 4 for the id');
select lives_ok($$select api.client_login_start('000000018', '0506666666', '203.0.113.13', null)$$, 'start 5 for the id');
select throws_ok($$select api.client_login_start('000000018', '0505555555', '203.0.113.12', null)$$, 'PT429', 'rate_limited', 'the sixth start of an id within the hour is refused');

-- ---------------------------------------------------------------- challenge use + verify
select is(api.client_login_challenge_use((current_setting('t.rb')::jsonb ->> 'challenge_id')::uuid),
  '{"status": "pending", "matched": false, "attempts": 1, "phone": null}'::jsonb, 'a missed challenge yields no mobile (the function answers wrong_code itself)');
select is((api.client_login_challenge_use((current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid)) ->> 'phone', '0501234567', 'a matched challenge yields the mobile for the provider check');
select is((api.client_login_challenge_use((current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid)) ->> 'attempts', '2', 'every use counts');
select throws_ok($$select api.client_login_challenge_use('c5000000-0000-4000-8000-0000000000f1')$$, 'PT410', 'challenge_expired', 'an unknown challenge is gone');
-- the missed challenge: 9 more uses lock it; a locked one answers failed without the mobile
select lives_ok($$select api.client_login_challenge_use((current_setting('t.rb')::jsonb ->> 'challenge_id')::uuid) from generate_series(1, 9)$$, 'nine more uses');
select is(api.client_login_challenge_use((current_setting('t.rb')::jsonb ->> 'challenge_id')::uuid),
  '{"status": "failed", "matched": false, "attempts": 10, "phone": null}'::jsonb, 'ten wrong attempts lock the challenge');
-- verify: only a matched, pending challenge opens a session
select throws_ok($$select api.client_login_verify((current_setting('t.rb')::jsonb ->> 'challenge_id')::uuid, decode(current_setting('t.th1'), 'hex'), '203.0.113.7', 'ua-test')$$,
  'PT410', 'challenge_expired', 'a missed (and locked) challenge never opens a session');
select throws_ok($$select api.client_login_verify((current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid, decode('00', 'hex'), '203.0.113.7', 'ua-test')$$,
  'PT400', 'invalid_input:token', 'token hash must be 32 bytes');
select set_config('t.rv', (api.client_login_verify((current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid, decode(current_setting('t.th1'), 'hex'), '203.0.113.7', 'ua-test'))::text, true);
select throws_ok($$select api.client_login_verify((current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid, decode(current_setting('t.th2'), 'hex'), '203.0.113.7', 'ua-test')$$,
  'PT410', 'challenge_expired', 'a challenge opens one session only');
reset role;
select is((select array_agg(k order by k) from jsonb_object_keys(current_setting('t.rv')::jsonb) k), array['client', 'expires_at', 'session_id'], 'verify result keys');
select is(current_setting('t.rv')::jsonb -> 'client', '{"first_name": "Zz-Client", "last_name": "Test"}'::jsonb, 'the client names come from crm.customers');
select ok((select status = 'verified' and phone_enc is null from crm.client_login_challenges where id = (current_setting('t.ra')::jsonb ->> 'challenge_id')::uuid),
  'verified challenge: the encrypted mobile is cleared');
select ok((select token_hash = extensions.digest('client-fixture-token-1', 'sha256') and customer_id = 'c5000000-0000-4000-8000-000000000001'
                  and expires_at between now() + interval '29 days' and now() + interval '31 days' and revoked_at is null and user_agent = 'ua-test'
                  and ip_hash is not null
             from crm.client_sessions where id = (current_setting('t.rv')::jsonb ->> 'session_id')::uuid), 'session: sha256 only, 30 days, bound to the customer');

-- a second client's session, inserted directly (the flow above proved the path)
insert into crm.client_sessions (customer_id, agency_id, token_hash, expires_at)
values ('c5000000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001', extensions.digest('client-fixture-token-2', 'sha256'), now() + interval '30 days');

-- ---------------------------------------------------------------- session, portfolio, documents: only the token's own data
set local role service_role;
select throws_ok($$select api.client_session_get(decode(repeat('00', 32), 'hex'))$$, 'PT401', 'session_inactive', 'unknown token');
select is((api.client_session_get(decode(current_setting('t.th1'), 'hex'))) -> 'client',
  '{"first_name": "Zz-Client", "last_name": "Test", "agency_name": "SEELD"}'::jsonb, 'session answers the client and the agency');
select ok((api.client_session_get(decode(current_setting('t.th1'), 'hex'))) ? 'expires_at', 'session carries its expiry');

select set_config('t.pf', (api.client_portfolio_get(decode(current_setting('t.th1'), 'hex')))::text, true);
select is(jsonb_array_length(current_setting('t.pf')::jsonb -> 'products'), 1, 'one visible product (the hidden one and the other client''s are left out)');
select is(current_setting('t.pf')::jsonb -> 'products' -> 0 ->> 'id', 'd5100000-0000-4000-8000-000000000001', 'the product id');
select is(current_setting('t.pf')::jsonb -> 'products' -> 0 -> 'details' ->> 'accountPolicyNumber', '123456789', 'details decrypted for this call (the function masks them)');
select is(current_setting('t.pf')::jsonb -> 'products' -> 0 ->> 'source', 'מסלקה_פנסיונית', 'source kept');
select is((current_setting('t.pf')::jsonb ->> 'as_of')::date, (now() - interval '3 days')::date, 'as_of = the latest snapshot date');
select is(jsonb_array_length((api.client_portfolio_get(decode(current_setting('t.th2'), 'hex'))) -> 'products'), 1, 'the other client sees only their own product');
select is((api.client_portfolio_get(decode(current_setting('t.th2'), 'hex'))) -> 'products' -> 0 -> 'details' ->> 'accountPolicyNumber', 'OTHER-1', 'and it is theirs');

select set_config('t.dl', (api.client_documents_list(decode(current_setting('t.th1'), 'hex')))::text, true);
select is(jsonb_array_length(current_setting('t.dl')::jsonb -> 'poa'), 1, 'one POA document');
select is(current_setting('t.dl')::jsonb -> 'poa' -> 0 ->> 'id', 'd5400000-0000-4000-8000-000000000001', 'the stored POA document');
select is(current_setting('t.dl')::jsonb -> 'poa' -> 0 ->> 'downloadable', 'true', 'downloadable');
select is(current_setting('t.dl')::jsonb -> 'surense' -> 0 ->> 'name', 'Zz-Surense-Doc.pdf', 'the Surense document name decrypted for this call');
select is(current_setting('t.dl')::jsonb -> 'surense' -> 0 ->> 'downloadable', 'false', 'Surense documents are metadata only');
select is(jsonb_array_length((api.client_documents_list(decode(current_setting('t.th2'), 'hex'))) -> 'poa'), 0, 'the other client has no POA document');

select is((api.client_document_get(decode(current_setting('t.th1'), 'hex'), 'd5400000-0000-4000-8000-000000000001')) ->> 'sha256', repeat('ab', 32), 'the owner gets the path and hash');
select throws_ok($$select api.client_document_get(decode(current_setting('t.th2'), 'hex'), 'd5400000-0000-4000-8000-000000000001')$$, 'PT404', 'not_found', 'another client''s token: not found');
reset role;
select is((select count(*)::int from audit.access_log where action = 'client_document_get' and 'd5400000-0000-4000-8000-000000000001' = any (subject_ids)), 1, 'the download is access-logged');
select is((select count(*)::int from audit.access_log where action = 'client_portfolio_get'), 3, 'every portfolio read is access-logged');

-- ---------------------------------------------------------------- logout, staff revoke, expiry
set local role service_role;
select is(api.client_logout(decode(current_setting('t.th1'), 'hex')), '{"revoked": true}'::jsonb, 'logout revokes');
select is(api.client_logout(decode(current_setting('t.th1'), 'hex')), '{"revoked": false}'::jsonb, 'a second logout is a no-op');
select throws_ok($$select api.client_session_get(decode(current_setting('t.th1'), 'hex'))$$, 'PT401', 'session_inactive', 'a revoked token is inactive');
reset role;

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000c1');
insert into core.staff (user_id, role, display_name, agency_id) values ('00000000-0000-0000-0000-0000000000c1', 'admin', 'Zz Staff', '5eed0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
select is(staff.client_sessions_revoke('c5000000-0000-4000-8000-000000000002'), '{"revoked": 1}'::jsonb, 'staff revoke signs the client out');
reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select throws_ok($$select api.client_session_get(decode(current_setting('t.th2'), 'hex'))$$, 'PT401', 'session_inactive', 'revoked by staff');
reset role;
update crm.client_sessions set revoked_at = null, expires_at = now() - interval '1 minute' where token_hash = extensions.digest('client-fixture-token-2', 'sha256');
set local role service_role;
select throws_ok($$select api.client_session_get(decode(current_setting('t.th2'), 'hex'))$$, 'PT401', 'session_inactive', 'an expired token is inactive');
reset role;

-- ---------------------------------------------------------------- retention (switch-gated)
update crm.client_login_challenges set created_at = now() - interval '2 days' where id = (current_setting('t.rb')::jsonb ->> 'challenge_id')::uuid;
update crm.client_sessions set expires_at = now() - interval '40 days' where token_hash = extensions.digest('client-fixture-token-2', 'sha256');
select is(ops.client_area_cleanup(), '{"challenges": 0, "sessions": 0}'::jsonb, 'cleanup deletes nothing while the switch is off');
update ops.config set value = 'true' where key = 'client_area_retention_enabled';
select is(ops.client_area_cleanup(), '{"challenges": 1, "sessions": 1}'::jsonb, 'cleanup removes the old challenge and the long-expired session');

select * from finish();
rollback;
