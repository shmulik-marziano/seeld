-- 12: POA wizard backend (20261121150000). Synthetic values only. Runs as postgres.
-- The Vault keys are created inside this rolled-back transaction when absent. The session flow needs Vault (present in the
-- replay image and in `supabase test db`). Never run this file against a database that holds the real keys.
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
select ok(current_setting('t.has_vault')::boolean, 'Vault is present (the POA flow needs it)');

-- ---------------------------------------------------------------- switches
select set_eq($$ select key || '=' || value from ops.config where key like 'poa%' $$,
  $$ values ('poa_enabled=false'), ('poa_docs_enabled=false'), ('poa_engine=surense'), ('poa_native_shadow=false'),
            ('poa_surense_url_id='), ('poa_module_maslaka=true'), ('poa_module_harbit=true'), ('poa_module_policies=true'),
            ('poa_turnstile_required=true') $$,
  'nine POA keys seeded; the master switches are off');
select ok(not private.flag('poa_enabled') and not private.flag('poa_docs_enabled') and not private.flag('poa_native_shadow'),
  'private.flag reads the master switches closed');

-- ---------------------------------------------------------------- structure and privileges
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'crm' and c.relname in ('poa_sessions', 'poa_consents', 'documents', 'poa_matches') and c.relrowsecurity),
  4, 'RLS on the four POA tables');
select is_empty($$ select r || ' ' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    cross join unnest(array['anon', 'authenticated', 'service_role']) r
                   where n.nspname = 'crm' and c.relname in ('poa_sessions', 'poa_consents', 'documents', 'poa_matches')
                     and has_table_privilege(r, c.oid, 'SELECT,INSERT,UPDATE,DELETE') $$,
  'no table privilege for anon/authenticated/service_role on the POA tables');
select is((select count(*)::int from pg_policies where schemaname = 'crm' and tablename in ('poa_sessions', 'poa_consents', 'documents', 'poa_matches')
            and policyname = 'deny_api_roles' and roles = '{anon,authenticated}' and qual = 'false'), 4, 'deny policy on each table');
select is((select count(*)::int from pg_trigger where tgrelid in ('crm.poa_sessions'::regclass, 'crm.poa_consents'::regclass,
            'crm.documents'::regclass, 'crm.poa_matches'::regclass) and tgname like '%\_audit' and not tgisinternal), 4, 'audit trigger on each table');
select is_empty($$ select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'crm' and c.relname in ('poa_sessions', 'poa_consents') and a.attnum > 0 and not a.attisdropped
                     and a.attname ~ '(name|phone|email|address|id_number|national_id$|birth|signature|^ip$|cell)'
                     and a.attname not in ('phone_hmac', 'phone_tail', 'national_id_hmac', 'signature_enc') $$,
  'no personal plain column in the session and consent tables');
select ok(not has_function_privilege('anon', 'api.poa_session_start(bytea, jsonb, text, text, bytea, text, boolean)', 'execute'), 'anon cannot start');
select ok(not has_function_privilege('authenticated', 'api.poa_session_get(bytea)', 'execute'), 'authenticated cannot read a session');
select ok(has_function_privilege('service_role', 'api.poa_session_get(bytea)', 'execute'), 'service_role reads a session');
select ok(has_function_privilege('service_role', 'api.poa_document_link(uuid, text, uuid, text)', 'execute'), 'service_role links documents');
select ok(not has_function_privilege('service_role', 'private.phone_hmac(text)', 'execute'), 'private helper not exposed');
select ok(not has_function_privilege('service_role', 'private.poa_open_session(uuid)', 'execute'), 'private session helper not exposed');
select ok(has_function_privilege('authenticated', 'staff.poa_session_list(integer, integer)', 'execute')
          and not has_function_privilege('anon', 'staff.poa_session_list(integer, integer)', 'execute'), 'staff list: authenticated only');

-- ---------------------------------------------------------------- every RPC closed while the switches are off
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config('t.tha', encode(extensions.digest('poa-fixture-token-a', 'sha256'), 'hex'), true);
select set_config('t.thb', encode(extensions.digest('poa-fixture-token-b', 'sha256'), 'hex'), true);
select set_config('t.sha', repeat('a', 64), true);
set local role service_role;
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018',
  '+972501234567', null, '203.0.113.7', false)$$, 'PT423', 'feature_disabled:poa_enabled', 'start closed');
select throws_ok($$select api.poa_session_get(decode(current_setting('t.tha'), 'hex'))$$, 'PT423', 'feature_disabled:poa_enabled', 'state closed');
select throws_ok($$select api.poa_engine_ref_set('c3000000-0000-4000-8000-0000000000f1', '{"sid":"x"}'::jsonb)$$, 'PT423', 'feature_disabled:poa_enabled', 'engine ref closed');
select throws_ok($$select api.poa_preview_set('c3000000-0000-4000-8000-0000000000f1', 'maslaka', current_setting('t.sha'))$$, 'PT423', 'feature_disabled:poa_enabled', 'preview closed');
select throws_ok($$select api.poa_consent_record('c3000000-0000-4000-8000-0000000000f1', 'maslaka', 'check', current_setting('t.sha'), null, '203.0.113.7', null, null)$$,
  'PT423', 'feature_disabled:poa_enabled', 'consent closed');
select throws_ok($$select api.poa_session_fail('c3000000-0000-4000-8000-0000000000f1', 'x')$$, 'PT423', 'feature_disabled:poa_enabled', 'fail closed');
select throws_ok($$select api.poa_session_complete('c3000000-0000-4000-8000-0000000000f1')$$, 'PT423', 'feature_disabled:poa_enabled', 'complete closed');
select throws_ok($$select api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'maslaka')$$, 'PT423', 'feature_disabled:poa_docs_enabled', 'download closed (its own switch)');
select is((api.poa_document_link('c3000000-0000-4000-8000-0000000000f1', 'maslaka', 'd3000000-0000-4000-8000-0000000000f1', null)) ->> 'linked', 'false',
  'document link never raises a switch error (a worker job must not park on it)');
select throws_ok($$select count(*) from crm.poa_sessions$$, '42501', null, 'service_role cannot read the table directly');
reset role;

-- ---------------------------------------------------------------- start: validation (no Vault use before the checks pass)
update ops.config set value = 'true' where key = 'poa_enabled';
set local role service_role;
select throws_ok($$select api.poa_session_start(decode('00', 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:token', 'token hash must be 32 bytes');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:first_name', 'first name required');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test","email":"not-mail"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:email', 'email shape');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '12345678', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:national_id', 'national id is nine digits');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, 'A12345678', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:national_id', 'a passport-like value is refused');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '0501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:phone', 'only +9725x numbers');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '+97231234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:phone', 'a landline is refused');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, null, false)$$,
  'PT400', 'invalid_input:client_ip', 'the client ip is required from the service role');
reset role;

-- ---------------------------------------------------------------- start: identical shape for an existing and a new customer
insert into crm.customers (agency_id, first_name, last_name, mobile_phone, national_id_hmac, national_id_enc)
values ('5eed0000-0000-4000-8000-000000000001', 'Zz-Existing', 'Test', '0509999999', private.national_id_hmac('000000026'), private.pii_encrypt('000000026'));
select set_config('t.cust_before', (select md5(string_agg(c.id::text || coalesce(c.mobile_phone, '') || c.updated_at::text, ',' order by c.id)) from crm.customers c), true);

set local role service_role;
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), ('{"first_name":"Zz","last_name":"Test","street":"' || repeat('s', 81) || '"}')::jsonb, '000000018', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:street', 'street over 80 chars refused');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), ('{"first_name":"Zz","last_name":"Test","city":"' || repeat('c', 81) || '"}')::jsonb, '000000018', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:city', 'city over 80 chars refused');
select throws_ok($$select api.poa_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test","zip":"12345"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7', false)$$,
  'PT400', 'invalid_input:zip', 'a zip that is not 7 digits is refused');
select set_config('t.ra', (api.poa_session_start(decode(current_setting('t.tha'), 'hex'),
  '{"first_name":"Zz-First","last_name":"Zz-Last","email":"zz.test@example.invalid","street":"Zz-Street 12","city":"Zz-City","zip":"6473912"}'::jsonb, '000000018', '+972501234567',
  decode(repeat('ab', 32), 'hex'), '203.0.113.7', true))::text, true);
select set_config('t.rb', (api.poa_session_start(decode(current_setting('t.thb'), 'hex'),
  '{"first_name":"Zz-Other","last_name":"Zz-Last","email":null}'::jsonb, '000000026', '+972508888888', null, '203.0.113.8', false))::text, true);
reset role;
select set_config('t.sa', current_setting('t.ra')::jsonb ->> 'session_id', true);
select set_config('t.sb', current_setting('t.rb')::jsonb ->> 'session_id', true);

select is((select array_agg(k order by k) from jsonb_object_keys(current_setting('t.ra')::jsonb) k),
          (select array_agg(k order by k) from jsonb_object_keys(current_setting('t.rb')::jsonb) k),
  'the start result has the same keys for a new and an existing customer');
select is(current_setting('t.ra')::jsonb ->> 'next', 'maslaka', 'first module first');
select ok((current_setting('t.ra')::jsonb -> 'modules' -> 'harbit' ->> 'enabled')::boolean
          and not (current_setting('t.ra')::jsonb -> 'modules' -> 'policies' ->> 'performed')::boolean, 'three enabled modules, none performed');
select is((current_setting('t.ra')::jsonb ->> 'existing_customer') || '/' || (current_setting('t.rb')::jsonb ->> 'existing_customer'), 'false/true',
  'existing_customer is for the function only (it differs; the function never returns it)');
select is((select count(*)::int from crm.poa_matches where session_id = current_setting('t.sa')::uuid), 0, 'no match row for a new identity');
select is((select count(*)::int from crm.poa_matches where session_id = current_setting('t.sb')::uuid and phone_differs and status = 'pending'), 1,
  'a match row (phone differs, pending) for an existing national id');
select is((select md5(string_agg(c.id::text || coalesce(c.mobile_phone, '') || c.updated_at::text, ',' order by c.id)) from crm.customers c),
  current_setting('t.cust_before'), 'crm.customers is untouched');
select is((select token_hash from crm.poa_sessions where id = current_setting('t.sa')::uuid), extensions.digest('poa-fixture-token-a', 'sha256'),
  'only the sha256 of the token is stored');
select ok((select octet_length(national_id_hmac) = 32 and octet_length(phone_hmac) = 32 and phone_tail = '67'
                  and position(convert_to('000000018', 'utf8') in identity_enc) = 0
                  and position(convert_to('Zz-First', 'utf8') in identity_enc) = 0
                  and position(convert_to('501234567', 'utf8') in identity_enc) = 0
                  and position(convert_to('Zz-Street', 'utf8') in identity_enc) = 0
                  and status = 'open' and engine = 'surense' and expires_at between now() + interval '59 minutes' and now() + interval '61 minutes'
             from crm.poa_sessions where id = current_setting('t.sa')::uuid), 'hmacs 32 bytes, tail 67, identity encrypted, 60 minute expiry');
select is((select array_agg(kind order by kind) from crm.poa_consents where session_id = current_setting('t.sa')::uuid), array['marketing', 'terms_privacy'],
  'terms and marketing consents recorded');
select is((select array_agg(kind) from crm.poa_consents where session_id = current_setting('t.sb')::uuid), array['terms_privacy'], 'no marketing consent when not given');
select ok((select bool_and(ip_enc is not null and position(convert_to('203.0.113', 'utf8') in ip_enc) = 0)
             from crm.poa_consents where session_id = current_setting('t.sa')::uuid), 'client address stored encrypted');
select is_empty($$ select l.id from audit.log l, jsonb_object_keys(coalesce(l.new_data, '{}')) k
                   where l.op = 'ACTION' and l.table_name in ('crm.poa_sessions', 'crm.documents')
                     and k not in ('action', 'kind', 'method', 'complete', 'marketing', 'code', 'activated') $$,
  'POA ACTION rows carry codes only');
select is((select count(*)::int from audit.log where table_name like 'crm.poa%' and op in ('INSERT', 'UPDATE', 'DELETE')
              and (old_data is not null or new_data is not null)), 0, 'POA change rows carry no values');

-- consents are append-only
select throws_ok($$update crm.poa_consents set method = 'typed'$$, '42501', 'crm.poa_consents is append-only', 'consent update blocked');
select throws_ok($$delete from crm.poa_consents$$, '42501', 'crm.poa_consents is append-only', 'consent delete blocked');

-- ---------------------------------------------------------------- state, engine ref, preview, consent
set local role service_role;
select throws_ok($$select api.poa_session_get(decode(repeat('00', 32), 'hex'))$$, 'PT401', 'session_inactive', 'unknown token');
select ok(not ((api.poa_session_get(decode(current_setting('t.tha'), 'hex'))) ? 'identity'), 'state does not return (or decrypt) the identity');
select is((api.poa_session_get(decode(current_setting('t.tha'), 'hex'))) ->> 'status', 'open', 'open');
select throws_ok($$select api.poa_engine_ref_set(current_setting('t.sa')::uuid, '{"BadKey":"x"}'::jsonb)$$, 'PT400', 'invalid_input:ref', 'ref keys are snake_case');
select throws_ok($$select api.poa_engine_ref_set(current_setting('t.sa')::uuid, '{"nested":{"a":1}}'::jsonb)$$, 'PT400', 'invalid_input:ref', 'ref values are flat');
select throws_ok($$select api.poa_engine_ref_set(current_setting('t.sa')::uuid, '{"customer_id":"nope"}'::jsonb)$$, 'PT400', 'invalid_input:customer_id', 'customer id is a uuid');
select lives_ok($$select api.poa_engine_ref_set(current_setting('t.sa')::uuid,
  '{"customer_id":"c3000000-0000-4000-8000-000000000001","url_id":"abcd1234","sid":"zz-sid-1"}'::jsonb)$$, 'engine ref stored');
select is((api.poa_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'engine_ref' ->> 'url_id', 'abcd1234', 'engine ref comes back decrypted');
reset role;
select is((select surense_customer_id from crm.poa_sessions where id = current_setting('t.sa')::uuid), 'c3000000-0000-4000-8000-000000000001'::uuid,
  'the Surense customer id is also an indexed column');
select ok((select position(convert_to('abcd1234', 'utf8') in engine_ref_enc) = 0 from crm.poa_sessions where id = current_setting('t.sa')::uuid), 'engine ref encrypted');

set local role service_role;
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'maslaka', 'check', current_setting('t.sha'), null, '203.0.113.7', 'ua-test', null)$$,
  'PT400', 'invalid_input:preview_sha256', 'no approval without a recorded preview');
select throws_ok($$select api.poa_preview_set(current_setting('t.sa')::uuid, 'other', current_setting('t.sha'))$$, 'PT400', 'invalid_input:kind', 'kind is one of three');
select throws_ok($$select api.poa_preview_set(current_setting('t.sa')::uuid, 'maslaka', 'XYZ')$$, 'PT400', 'invalid_input:sha256', 'sha is 64 hex');
select lives_ok($$select api.poa_preview_set(current_setting('t.sa')::uuid, 'maslaka', current_setting('t.sha'))$$, 'preview recorded');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'maslaka', 'check', repeat('b', 64), null, '203.0.113.7', 'ua-test', null)$$,
  'PT400', 'invalid_input:preview_sha256', 'approval of a different file is refused');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'maslaka', 'wave', current_setting('t.sha'), null, '203.0.113.7', 'ua-test', null)$$,
  'PT400', 'invalid_input:method', 'method is a code');
select is((api.poa_consent_record(current_setting('t.sa')::uuid, 'maslaka', 'check', current_setting('t.sha'), null, '203.0.113.7', 'ua-test', null)) ->> 'next',
  'harbit', 'maslaka approved, harbit next');
select is((api.poa_consent_record(current_setting('t.sa')::uuid, 'maslaka', 'check', current_setting('t.sha'), null, '203.0.113.7', 'ua-test', null)) ->> 'kind',
  'maslaka', 'a repeated approval is idempotent');
reset role;
select is((select count(*)::int from crm.poa_consents where session_id = current_setting('t.sa')::uuid and kind = 'poa_maslaka'), 1, 'one consent row for the module');
select ok((select method = 'check' and user_agent = 'ua-test' and preview_sha256 = decode(repeat('a', 64), 'hex') and ip_enc is not null
             from crm.poa_consents where session_id = current_setting('t.sa')::uuid and kind = 'poa_maslaka'), 'consent evidence recorded');

set local role service_role;
select lives_ok($$select api.poa_preview_set(current_setting('t.sa')::uuid, 'harbit', repeat('c', 64))$$, 'harbit preview recorded');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'harbit', 'check', repeat('c', 64), null, '203.0.113.7', null, '{}'::jsonb)$$,
  'PT400', 'invalid_input:birth_date', 'harbit needs the birth date');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'harbit', 'check', repeat('c', 64), null, '203.0.113.7', null,
  '{"birth_date":"2026-13-45","issue_date":"2015-01-02"}'::jsonb)$$, 'PT400', 'invalid_input:birth_date', 'an impossible date is refused');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'harbit', 'check', repeat('c', 64), null, '203.0.113.7', null,
  '{"birth_date":"1980-05-17","issue_date":"1970-01-02"}'::jsonb)$$, 'PT400', 'invalid_input:issue_date', 'issue before birth is refused');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'harbit', 'check', repeat('c', 64), null, '203.0.113.7', null,
  '{"birth_date":"1980-05-17","issue_date":"1980-05-17"}'::jsonb)$$, 'PT400', 'invalid_input:issue_date', 'issue on the birth day is refused (same rule as the function)');
select throws_ok(format($q$select api.poa_consent_record(%L::uuid, 'harbit', 'check', repeat('c', 64), null, '203.0.113.7', null, %L::jsonb)$q$,
  current_setting('t.sa'), jsonb_build_object('birth_date', '1980-05-17', 'issue_date', (((now() at time zone 'Asia/Jerusalem')::date) + 1)::text)::text),
  'PT400', 'invalid_input:issue_date', 'the day after Israel-today is in the future');
-- the issue date is Israel-today: accepted (the database zone is UTC; "today" is the Jerusalem calendar day)
select is((api.poa_consent_record(current_setting('t.sa')::uuid, 'harbit', 'check', repeat('c', 64), null, '203.0.113.7', null,
  jsonb_build_object('birth_date', '1980-05-17', 'issue_date', ((now() at time zone 'Asia/Jerusalem')::date)::text))) ->> 'next', 'policies', 'harbit approved with an issue date of Israel-today, policies next');
reset role;
select is((select private.pii_decrypt(identity_enc)::jsonb ->> 'birth_date' from crm.poa_sessions where id = current_setting('t.sa')::uuid), '1980-05-17', 'birth date kept inside the encrypted identity');
select is((select private.pii_decrypt(identity_enc)::jsonb ->> 'street' from crm.poa_sessions where id = current_setting('t.sa')::uuid), 'Zz-Street 12', 'street kept inside the encrypted identity');
select is((select private.pii_decrypt(identity_enc)::jsonb ->> 'city' from crm.poa_sessions where id = current_setting('t.sa')::uuid), 'Zz-City', 'city kept inside the encrypted identity');
select is((select private.pii_decrypt(identity_enc)::jsonb ->> 'zip' from crm.poa_sessions where id = current_setting('t.sa')::uuid), '6473912', 'zip kept inside the encrypted identity');
set local role service_role;
select is((api.poa_session_complete(current_setting('t.sa')::uuid)) ->> 'complete', 'false', 'not complete with a module left');
select lives_ok($$select api.poa_preview_set(current_setting('t.sa')::uuid, 'policies', repeat('d', 64))$$, 'policies preview recorded');
select throws_ok($$select api.poa_consent_record(current_setting('t.sa')::uuid, 'policies', 'signature', repeat('d', 64), null, '203.0.113.7', null, null)$$,
  'PT400', 'invalid_input:signature', 'a signature approval needs the signature');
select is((api.poa_consent_record(current_setting('t.sa')::uuid, 'policies', 'signature', repeat('d', 64), 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
  '203.0.113.7', null, null)) ->> 'complete', 'true', 'the last module completes the session');
select is((api.poa_consent_record(current_setting('t.sa')::uuid, 'policies', 'signature', repeat('d', 64), 'data:image/png;base64,iVBORw0KGgo=', '203.0.113.7', null, null)) ->> 'complete', 'false',
  'a completed session takes no NEW approval: a repeated one is only a replay');
select is((api.poa_session_get(decode(current_setting('t.tha'), 'hex'))) ->> 'status', 'completed', 'state: completed');
select is((api.poa_session_complete(current_setting('t.sa')::uuid)) ->> 'complete', 'true', 'complete is idempotent');
select throws_ok($$select api.poa_session_fail(current_setting('t.sa')::uuid, 'x')$$, 'PT409', 'session_completed', 'a completed session cannot be failed');
select is((api.poa_consent_record(current_setting('t.sa')::uuid, 'policies', 'check', repeat('d', 64), null, '203.0.113.7', null, null)) ->> 'kind', 'policies',
  'replay: a performed module of a COMPLETED session answers with its recorded approval (nothing inserted)');
select lives_ok($$select api.poa_session_fail(current_setting('t.sa')::uuid, 'launch_423')$$, 'a completed session records that its launch was not queued');
select throws_ok($$select api.poa_session_fail(current_setting('t.sb')::uuid, 'launch_423')$$, 'PT400', 'invalid_input:code', 'a launch_ code is for completed sessions only');
select is((api.poa_session_complete(current_setting('t.sb')::uuid)) ->> 'complete', 'false', 'the other session is still open');
select lives_ok($$select api.poa_session_fail(current_setting('t.sb')::uuid, 'surense_http_503')$$, 'engine error code recorded');
select throws_ok($$select api.poa_session_fail(current_setting('t.sb')::uuid, 'Some free text')$$, 'PT400', 'invalid_input:code', 'codes only');
reset role;
select ok((select status = 'completed' and completed_at is not null and position(convert_to('iVBOR', 'utf8') in c.signature_enc) = 0
             from crm.poa_sessions s join crm.poa_consents c on c.session_id = s.id and c.kind = 'poa_policies' where s.id = current_setting('t.sa')::uuid),
  'session completed; the signature is stored encrypted');
select is((select engine_last_error from crm.poa_sessions where id = current_setting('t.sb')::uuid), 'surense_http_503', 'error code stored');
select is((select count(*)::int from crm.poa_consents where session_id = current_setting('t.sa')::uuid and kind like 'poa\_%'), 3, 'three approvals');

-- expiry: an expired session says so; every mutation is refused
update crm.poa_sessions set expires_at = now() - interval '1 minute' where id = current_setting('t.sb')::uuid;
set local role service_role;
select throws_ok($$select api.poa_preview_set(current_setting('t.sb')::uuid, 'maslaka', current_setting('t.sha'))$$, 'PT410', 'session_expired', 'expired: preview refused');
select is((api.poa_session_get(decode(current_setting('t.thb'), 'hex'))) ->> 'status', 'expired', 'expired: state says expired');
reset role;
select is((select status from crm.poa_sessions where id = current_setting('t.sb')::uuid), 'expired', 'and the row is flipped');

-- ---------------------------------------------------------------- documents
set local role service_role;
select throws_ok($$select api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'bad', 'd3000000-0000-4000-8000-000000000001', null)$$, 'PT400', 'invalid_input:kind', 'link: kind');
select is((api.poa_document_link('c3999999-0000-4000-8000-000000000001', 'maslaka', 'd3000000-0000-4000-8000-000000000001', null)) ->> 'linked', 'false',
  'link: an unknown customer is not an error');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'maslaka', 'd3000000-0000-4000-8000-000000000001', repeat('1', 64))) ->> 'complete', 'false', 'link 1 of 3');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'maslaka', 'd3000000-0000-4000-8000-000000000001', repeat('1', 64))) ->> 'linked', 'true', 'relinking the same document is idempotent');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'harbit', 'd3000000-0000-4000-8000-000000000001', null)) ->> 'linked', 'false',
  'one Surense document is never linked to two kinds of one session (linked=false)');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'harbit', 'd3000000-0000-4000-8000-000000000001', null)) ->> 'reason', 'already_linked', '... reason already_linked');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'harbit', 'd3000000-0000-4000-8000-000000000001', null)) ->> 'complete', null, '... and nothing is completed by it');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'maslaka', 'd3000000-0000-4000-8000-000000000001', repeat('1', 64))) ->> 'agency_id',
  '5eed0000-0000-4000-8000-000000000001', 'a link answers the agency id (for the storage path)');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'harbit', 'd3000000-0000-4000-8000-000000000002', null)) ->> 'complete', 'false', 'link 2 of 3');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'policies', 'd3000000-0000-4000-8000-000000000003', null)) ->> 'complete', 'true', 'link 3 of 3 completes the documents');
reset role;
select is((select count(*)::int from crm.documents where session_id = current_setting('t.sa')::uuid and status = 'pending_staff_verification' and source = 'surense'), 3,
  'three documents pending staff verification, one per kind');
select ok((select docs_complete_at is not null from crm.poa_sessions where id = current_setting('t.sa')::uuid), 'docs_complete_at stamped');
select set_config('t.doc_m', (select id::text from crm.documents where session_id = current_setting('t.sa')::uuid and kind = 'maslaka'), true);
select set_config('t.doc_h', (select id::text from crm.documents where session_id = current_setting('t.sa')::uuid and kind = 'harbit'), true);

update ops.config set value = 'true' where key = 'poa_docs_enabled';
set local role service_role;
select throws_ok($$select api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'maslaka')$$, 'PT404', 'document_not_ready', 'no stored file yet');
select throws_ok($$select api.poa_document_stored(current_setting('t.doc_m')::uuid, 'poa/other/path.pdf', repeat('1', 64))$$, 'PT400', 'invalid_input:path', 'the path must follow the pattern');
select lives_ok($$select api.poa_document_stored(current_setting('t.doc_m')::uuid,
  'poa/5eed0000-0000-4000-8000-000000000001/' || current_setting('t.sa') || '/maslaka-' || current_setting('t.doc_m') || '.pdf', repeat('1', 64))$$, 'stored path recorded');
select lives_ok($$select api.poa_document_stored(current_setting('t.doc_h')::uuid,
  'poa/5eed0000-0000-4000-8000-000000000001/' || current_setting('t.sa') || '/harbit-' || current_setting('t.doc_h') || '.pdf', repeat('2', 64))$$, 'second path recorded');
select is((api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'maslaka')) ->> 'sha256', repeat('1', 64), 'peek: the client gets the path and hash');
select is((api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'maslaka')) ->> 'sha256', repeat('1', 64), 'peek claims nothing: a second peek still works (a storage miss does not burn the download)');
reset role;
select ok((select downloaded_at is null from crm.documents where id = current_setting('t.doc_m')::uuid), 'peek left downloaded_at empty');
-- the download needs poa_docs_enabled only (its own switch), not poa_enabled
update ops.config set value = 'false' where key = 'poa_enabled';
set local role service_role;
select is((api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'maslaka')) ->> 'sha256', repeat('1', 64), 'poa_enabled=false, poa_docs_enabled=true: poa_doc_get still serves');
select is((api.poa_doc_claim(decode(current_setting('t.tha'), 'hex'), 'maslaka')) ->> 'ok', 'true', 'claim: the single download is consumed (poa_enabled off, poa_docs_enabled on)');
select throws_ok($$select api.poa_doc_claim(decode(current_setting('t.tha'), 'hex'), 'maslaka')$$, 'PT410', 'document_gone', 'the second claim is refused');
select throws_ok($$select api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'maslaka')$$, 'PT410', 'document_gone', 'and a peek after the claim says gone');
reset role;
update ops.config set value = 'true' where key = 'poa_enabled';
update crm.poa_sessions set completed_at = now() - interval '2 hours' where id = current_setting('t.sa')::uuid;
update crm.documents set stored_at = now() - interval '2 hours' where id = current_setting('t.doc_h')::uuid;
set local role service_role;
select throws_ok($$select api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'harbit')$$, 'PT410', 'download_expired', 'after 30 minutes the client download is closed');
select throws_ok($$select api.poa_doc_claim(decode(current_setting('t.tha'), 'hex'), 'harbit')$$, 'PT410', 'download_expired', 'the claim honours the window too');
reset role;
-- the window runs from COMPLETION: a file stored just now for a session completed two days ago is not downloadable
update crm.poa_sessions set completed_at = now() - interval '2 days' where id = current_setting('t.sa')::uuid;
update crm.documents set stored_at = now() where id = current_setting('t.doc_h')::uuid;
set local role service_role;
select throws_ok($$select api.poa_doc_get(decode(current_setting('t.tha'), 'hex'), 'harbit')$$, 'PT410', 'download_expired', 'a document stored 2 days after completion is not served');
select is((api.poa_document_link('c3000000-0000-4000-8000-000000000001', 'policies', 'd3000000-0000-4000-8000-000000000003', null)) ->> 'linked', 'false',
  'a session completed 2 days ago takes no late document (24 hour bound)');
select throws_ok($$select api.poa_doc_get(decode(current_setting('t.thb'), 'hex'), 'maslaka')$$, 'PT404', 'document_not_ready', 'an unfinished session has nothing to download');
reset role;

-- ---------------------------------------------------------------- watchdog 'poa' step
select ok(not ((ops.watchdog()) -> 'failed_steps') ? 'poa', 'watchdog poa step runs');
select is((select count(*)::int from ops.alerts where kind = 'poa_docs_missing'), 0, 'a completed session with all documents raises nothing');
insert into crm.poa_sessions (id, agency_id, token_hash, status, modules, national_id_hmac, phone_hmac, phone_tail, identity_enc, expires_at, completed_at)
values ('c3000000-0000-4000-8000-0000000000e1', '5eed0000-0000-4000-8000-000000000001', extensions.digest('wd-1', 'sha256'), 'completed',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":true,"required":true,"performed":true},"policies":{"enabled":true,"required":true,"performed":true}}',
        extensions.digest('wd-n', 'sha256'), extensions.digest('wd-p', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-Wd","national_id":"000000000"}'), now() - interval '1 hour', now() - interval '2 hours'),
       ('c3000000-0000-4000-8000-0000000000e2', '5eed0000-0000-4000-8000-000000000001', extensions.digest('wd-2', 'sha256'), 'completed',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        extensions.digest('wd-n2', 'sha256'), extensions.digest('wd-p2', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-Wd","national_id":"000000000"}'), now() - interval '1 hour', now() - interval '30 minutes');
select ok(not ((ops.watchdog()) -> 'failed_steps') ? 'poa', 'watchdog poa step runs on the fixture');
select is((select count(*)::int from ops.alerts where kind = 'poa_docs_missing' and status = 'pending'), 1, 'only the old session without documents raises poa_docs_missing');
select is((select summary from ops.alerts where kind = 'poa_docs_missing'),
  'poa sessions completed >1h ago with documents missing: count=1 first_id=c3000000-0000-4000-8000-0000000000e1', 'alert holds a count and an id only');
select is((select dedupe_key from ops.alerts where kind = 'poa_docs_missing'), 'poa_docs_missing', 'alert is deduped');
select lives_ok($$select ops.watchdog()$$, 'second watchdog run');
select is((select count(*)::int from ops.alerts where kind = 'poa_docs_missing'), 1, 'dedupe: still one alert');

-- a document download for a module the session never enabled is refused; a stale / unperformed session takes no late document
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select throws_ok($$select api.poa_doc_get(extensions.digest('wd-2', 'sha256'), 'harbit')$$, 'PT400', 'invalid_input:kind', 'doc_get: a disabled module is refused');
reset role;
insert into crm.poa_sessions (id, agency_id, token_hash, status, modules, surense_customer_id, national_id_hmac, phone_hmac, phone_tail, identity_enc, expires_at, completed_at)
values ('c3000000-0000-4000-8000-0000000000e3', '5eed0000-0000-4000-8000-000000000001', extensions.digest('st-1', 'sha256'), 'completed',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        'c3000000-0000-4000-8000-0000000000c5', extensions.digest('st-n', 'sha256'), extensions.digest('st-p', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-St"}'),
        now() - interval '3 days', now() - interval '2 days'),
       ('c3000000-0000-4000-8000-0000000000e4', '5eed0000-0000-4000-8000-000000000001', extensions.digest('st-2', 'sha256'), 'open',
        '{"maslaka":{"enabled":true,"required":true,"performed":false},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        'c3000000-0000-4000-8000-0000000000c6', extensions.digest('st-n2', 'sha256'), extensions.digest('st-p2', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-St"}'),
        now() + interval '30 minutes', null);
set local role service_role;
select is((api.poa_document_link('c3000000-0000-4000-8000-0000000000c5', 'maslaka', 'd3000000-0000-4000-8000-0000000000a5', null)) ->> 'linked', 'false',
  'a session completed 2 days ago takes no document that arrives now');
select is((api.poa_document_link('c3000000-0000-4000-8000-0000000000c6', 'maslaka', 'd3000000-0000-4000-8000-0000000000a6', null)) ->> 'linked', 'false',
  'an open session takes no document for a module the visitor has not performed');
reset role;

-- ---------------------------------------------------------------- final documents from the policies step (20261122090000)
select ok(has_function_privilege('service_role', 'api.poa_document_from_url(uuid, text, text, text)', 'execute')
          and not has_function_privilege('authenticated', 'api.poa_document_from_url(uuid, text, text, text)', 'execute')
          and not has_function_privilege('anon', 'api.poa_document_from_url(uuid, text, text, text)', 'execute'), 'poa_document_from_url: service_role only');
insert into crm.poa_sessions (id, agency_id, token_hash, status, modules, national_id_hmac, phone_hmac, phone_tail, identity_enc, expires_at, completed_at)
values ('c3000000-0000-4000-8000-0000000000e5', '5eed0000-0000-4000-8000-000000000001', extensions.digest('fd-1', 'sha256'), 'completed',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":true,"required":true,"performed":true},"policies":{"enabled":true,"required":true,"performed":true}}',
        extensions.digest('fd-n', 'sha256'), extensions.digest('fd-p', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-Fd"}'), now() + interval '30 minutes', now() - interval '5 minutes'),
       ('c3000000-0000-4000-8000-0000000000e6', '5eed0000-0000-4000-8000-000000000001', extensions.digest('fd-2', 'sha256'), 'open',
        '{"maslaka":{"enabled":true,"required":true,"performed":false},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        extensions.digest('fd-n2', 'sha256'), extensions.digest('fd-p2', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-Fd"}'), now() + interval '30 minutes', null),
       ('c3000000-0000-4000-8000-0000000000e7', '5eed0000-0000-4000-8000-000000000001', extensions.digest('fd-3', 'sha256'), 'completed',
        '{"maslaka":{"enabled":true,"required":true,"performed":true},"harbit":{"enabled":false,"required":false,"performed":false},"policies":{"enabled":false,"required":false,"performed":false}}',
        extensions.digest('fd-n3', 'sha256'), extensions.digest('fd-p3', 'sha256'), '00', private.pii_encrypt('{"first_name":"Zz-Fd"}'), now() - interval '3 days', now() - interval '2 days');
set local role service_role;
select throws_ok($$select api.poa_document_from_url(null, 'maslaka', repeat('1', 64))$$, 'PT400', 'invalid_input:session', 'from_url: session required');
select throws_ok($$select api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'bad', repeat('1', 64))$$, 'PT400', 'invalid_input:kind', 'from_url: kind');
select throws_ok($$select api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'maslaka', 'xyz')$$, 'PT400', 'invalid_input:sha256', 'from_url: sha256 shape');
select throws_ok($$select api.poa_document_from_url('c3999999-0000-4000-8000-0000000000e5', 'maslaka', repeat('1', 64))$$, 'PT401', 'session_inactive', 'from_url: unknown session');
select throws_ok($$select api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e6', 'maslaka', repeat('1', 64))$$, 'PT400', 'invalid_input:kind', 'from_url: a module not performed takes no document');
select throws_ok($$select api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e6', 'harbit', repeat('1', 64))$$, 'PT400', 'invalid_input:kind', 'from_url: a module not enabled takes no document');
select throws_ok($$select api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e7', 'maslaka', repeat('1', 64))$$, 'PT410', 'session_expired', 'from_url: a session completed 2 days ago takes no document');
select is((api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'maslaka', repeat('1', 64))) ->> 'complete', 'false', 'from_url 1 of 3');
select is((api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'maslaka', repeat('1', 64))) ->> 'stored', 'false', 'from_url: nothing stored yet');
select is((api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'maslaka', repeat('2', 64))) ->> 'agency_id', '5eed0000-0000-4000-8000-000000000001',
  'from_url answers the agency id (for the storage path); repeating is idempotent');
select is((api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'harbit', repeat('3', 64))) ->> 'complete', 'false', 'from_url 2 of 3');
select is((api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'policies', repeat('4', 64))) ->> 'complete', 'true', 'from_url 3 of 3 completes the documents');
reset role;
select is((select count(*)::int from crm.documents where session_id = 'c3000000-0000-4000-8000-0000000000e5' and status = 'pending_staff_verification'
            and source = 'surense' and surense_document_id is null), 3, 'three pending documents without a Surense document id');
select is((select encode(sha256, 'hex') from crm.documents where session_id = 'c3000000-0000-4000-8000-0000000000e5' and kind = 'maslaka'), repeat('2', 64), 'a repeat refreshes the hash while nothing is stored');
select ok((select docs_complete_at is not null from crm.poa_sessions where id = 'c3000000-0000-4000-8000-0000000000e5'), 'docs_complete_at stamped');
select set_config('t.fd_doc', (select id::text from crm.documents where session_id = 'c3000000-0000-4000-8000-0000000000e5' and kind = 'maslaka'), true);
set local role service_role;
select lives_ok($$select api.poa_document_stored(current_setting('t.fd_doc')::uuid,
  'poa/5eed0000-0000-4000-8000-000000000001/c3000000-0000-4000-8000-0000000000e5/maslaka-' || current_setting('t.fd_doc') || '.pdf', repeat('2', 64))$$, 'the stored path of a link-less document is recorded as usual');
select is((api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'maslaka', repeat('9', 64))) ->> 'stored', 'true', 'from_url on a stored document: stored=true');
reset role;
select is((select encode(sha256, 'hex') from crm.documents where id = current_setting('t.fd_doc')::uuid), repeat('2', 64), 'and its hash is left untouched');
update crm.poa_sessions set surense_customer_id = 'c3000000-0000-4000-8000-0000000000c9' where id = 'c3000000-0000-4000-8000-0000000000e5';
set local role service_role;
select is((api.poa_document_link('c3000000-0000-4000-8000-0000000000c9', 'maslaka', 'd3000000-0000-4000-8000-0000000000b9', repeat('7', 64))) ->> 'stored', 'true',
  'link after from_url + stored answers stored=true');
reset role;
select is((select encode(sha256, 'hex') from crm.documents where id = current_setting('t.fd_doc')::uuid), repeat('2', 64), 'and the link keeps the stored hash');
select ok((select surense_document_id is null from crm.documents where id = current_setting('t.fd_doc')::uuid), 'and does not touch the row');
update ops.config set value = 'false' where key = 'poa_docs_enabled';
set local role service_role;
select throws_ok($$select api.poa_document_from_url('c3000000-0000-4000-8000-0000000000e5', 'maslaka', repeat('1', 64))$$, 'PT423', 'feature_disabled:poa_docs_enabled', 'from_url: closed with poa_docs_enabled off');
reset role;
update ops.config set value = 'true' where key = 'poa_docs_enabled';
-- a docs_ failure code is recorded on a completed (or open) session; other codes still need an open one
set local role service_role;
select lives_ok($$select api.poa_session_fail('c3000000-0000-4000-8000-0000000000e5', 'docs_host')$$, 'a completed session records that a document was not stored');
select throws_ok($$select api.poa_session_fail('c3000000-0000-4000-8000-0000000000e5', 'dp_http_500')$$, 'PT409', 'session_completed', 'other codes are still refused on a completed session');
select lives_ok($$select api.poa_session_fail('c3000000-0000-4000-8000-0000000000e6', 'docs_http_403')$$, 'an open session takes a docs_ code too');
select throws_ok($$select api.poa_session_fail('c3000000-0000-4000-8000-0000000000e5', 'docs_Bad Code')$$, 'PT400', 'invalid_input:code', 'docs_ codes stay codes');
reset role;
select is((select engine_last_error from crm.poa_sessions where id = 'c3000000-0000-4000-8000-0000000000e5'), 'docs_host', 'engine_last_error carries the docs_ code');

-- ---------------------------------------------------------------- job kind: launch of the E9100 submission
select lives_ok($$insert into ops.surense_jobs (kind, params) values ('surense.e9100_submit', '{}')$$, 'the kind check accepts surense.e9100_submit');
update ops.config set value = 'true' where key = 'surense_enabled';
set local role service_role;
select is((api.surense_job_enqueue('surense.e9100_submit', '{"customer_id":"c3000000-0000-4000-8000-000000000001","proxy_approval_date":"2026-11-21"}'::jsonb,
  'e9100:c3000000-0000-4000-8000-000000000001')) ->> 'duplicate', 'false', 'enqueue the E9100 submission');
select is((api.surense_job_enqueue('surense.e9100_submit', '{"customer_id":"c3000000-0000-4000-8000-000000000001","proxy_approval_date":"2026-11-21"}'::jsonb,
  'e9100:c3000000-0000-4000-8000-000000000001')) ->> 'duplicate', 'true', 'the same customer is one open job (dedupe)');
select throws_ok($$select api.surense_job_enqueue('surense.e9100_submit', '{"customerId":"c3000000-0000-4000-8000-000000000001"}'::jsonb)$$, 'PT400',
  'invalid_input:params', 'params stay snake_case');
select throws_ok($$select api.surense_job_enqueue('surense.event', '{}'::jsonb)$$, 'PT400', 'invalid_input:kind', 'event jobs only via ingest (whitelist kept)');
reset role;
update ops.config set value = 'false' where key = 'surense_enabled';

-- ---------------------------------------------------------------- staff: list and verify (admin, fresh TOTP)
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f4'), ('00000000-0000-0000-0000-0000000000f1');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000f4', 'admin', 'Admin F', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000f1', 'agent', 'Agent F', '5eed0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select * from staff.poa_session_list()$$, 'PT403', 'forbidden:admin_fresh_totp', 'an agent cannot list POA sessions');
select throws_ok($$select staff.poa_session_verify(current_setting('t.sa')::uuid, 'x')$$, 'PT403', 'forbidden:admin_fresh_totp', 'an agent cannot verify');
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000f4', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select is((select id_masked from staff.poa_session_list() where id = current_setting('t.sa')::uuid), '*****0018', 'the list shows a masked national id');
select is((select jsonb_array_length(documents) from staff.poa_session_list() where id = current_setting('t.sa')::uuid), 3, 'the list shows the three documents');
select is((select matched from staff.poa_session_list() where id = current_setting('t.sb')::uuid), true, 'the list flags an existing customer');
select throws_ok($$select staff.poa_session_verify(current_setting('t.sb')::uuid, 'x')$$, 'PT404', 'not_found', 'only a completed session can be verified');
select is((staff.poa_session_verify(current_setting('t.sa')::uuid, 'verified by phone')) ->> 'activated', '3', 'verify activates the three documents');
reset role;
select is((select count(*)::int from crm.documents where session_id = current_setting('t.sa')::uuid and status = 'active'), 3, 'documents are active');
select ok((select method = 'staff' and note_enc is not null and position(convert_to('verified by phone', 'utf8') in note_enc) = 0
             from crm.poa_consents where session_id = current_setting('t.sa')::uuid and kind = 'staff_identity_check'), 'staff check recorded, note encrypted');
select ok(exists (select 1 from audit.access_log where action = 'poa_session_list' and subject = 'crm.poa_sessions' and row_count >= 2), 'the list is in the access log');

-- ---------------------------------------------------------------- staff.client_doc_get and api.poa_config
select ok(has_function_privilege('authenticated', 'staff.client_doc_get(uuid)', 'execute') and not has_function_privilege('anon', 'staff.client_doc_get(uuid)', 'execute'),
          'client_doc_get: authenticated only');
select ok(has_function_privilege('service_role', 'api.poa_config()', 'execute') and not has_function_privilege('authenticated', 'api.poa_config()', 'execute'),
          'poa_config: service_role only');
select is((api.poa_config()) ->> 'engine', 'surense', 'poa_config reports the engine');
select is((api.poa_config()) ->> 'turnstile_required', 'true', 'poa_config reports Turnstile as required by default');
select is(jsonb_typeof((api.poa_config()) -> 'modules'), 'object', 'poa_config reports the modules');
select set_config('t.doc', (select id::text from crm.documents where session_id = current_setting('t.sa')::uuid and kind = 'maslaka'), true);
select set_config('t.doc_p', (select id::text from crm.documents where session_id = current_setting('t.sa')::uuid and kind = 'policies'), true);
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000f4', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select throws_ok($$select staff.client_doc_get(current_setting('t.doc_p')::uuid)$$, 'PT404', 'not_found', 'client_doc_get: no stored file yet');
select is((staff.client_doc_get(current_setting('t.doc')::uuid)) ->> 'sha256', repeat('1', 64), 'client_doc_get returns the hash');
select ok(((staff.client_doc_get(current_setting('t.doc')::uuid)) ->> 'storage_path') ~ '^poa/[0-9a-f-]{36}/[0-9a-f-]{36}/maslaka-[0-9a-f-]{36}[.]pdf$', 'client_doc_get returns the path');
select throws_ok($$select staff.client_doc_get('00000000-0000-4000-8000-00000000dead')$$, 'PT404', 'not_found', 'client_doc_get: unknown document');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select staff.client_doc_get(current_setting('t.doc')::uuid)$$, 'PT403', 'forbidden:fresh_totp', 'client_doc_get: a stale MFA step is refused');
reset role;
select ok(exists (select 1 from audit.access_log where action = 'client_doc_get' and subject = 'crm.documents' and row_count = 1), 'client_doc_get is in the access log');

-- ---------------------------------------------------------------- staff.admin_config_set: the new keys
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000f4', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select is((staff.admin_config_set('poa_engine', 'native')) ->> 'ok', 'true', 'poa_engine accepts native');
select throws_ok($$select staff.admin_config_set('poa_engine', 'x')$$, 'PT400', 'invalid_input:value', 'poa_engine refuses anything else');
select is((staff.admin_config_set('poa_surense_url_id', 'abc_12')) ->> 'ok', 'true', 'poa_surense_url_id accepts a short id');
select is((staff.admin_config_set('poa_surense_url_id', '')) ->> 'ok', 'true', 'poa_surense_url_id accepts empty');
select throws_ok($$select staff.admin_config_set('poa_surense_url_id', 'bad id!')$$, 'PT400', 'invalid_input:value', 'poa_surense_url_id refuses odd characters');
select is((staff.admin_config_set('poa_module_harbit', 'false')) ->> 'ok', 'true', 'a module switch takes true/false');
select throws_ok($$select staff.admin_config_set('poa_enabled', 'maybe')$$, 'PT400', 'invalid_input:value', 'poa_enabled is a boolean');
select throws_ok($$select staff.admin_config_set('poa_unknown', 'true')$$, 'PT400', 'invalid_input:key', 'unknown poa key refused');
select is((staff.admin_config_set('surense_enabled', 'false')) ->> 'ok', 'true', 'the earlier keys still work');
reset role;
select is((select value from ops.config where key = 'poa_engine'), 'native', 'poa_engine changed');
select is((select value from ops.config where key = 'poa_module_harbit'), 'false', 'module switch changed');

-- a start with a module switched off: only enabled modules, and the engine switch is honoured
update ops.config set value = 'true' where key = 'poa_enabled';
select set_config('t.thc', encode(extensions.digest('poa-fixture-token-c', 'sha256'), 'hex'), true);
set local role service_role;
select set_config('t.rc', (api.poa_session_start(decode(current_setting('t.thc'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000034',
  '+972507777777', null, '203.0.113.9', false))::text, true);
reset role;
select is(current_setting('t.rc')::jsonb -> 'modules' -> 'harbit' ->> 'enabled', 'false', 'a switched-off module starts disabled');
select is(current_setting('t.rc')::jsonb ->> 'next', 'maslaka', 'next is the first enabled module');
select is((select engine from crm.poa_sessions where id = (current_setting('t.rc')::jsonb ->> 'session_id')::uuid), 'native', 'the session engine follows poa_engine');
update ops.config set value = 'false' where key in ('poa_module_maslaka', 'poa_module_policies');
set local role service_role;
select throws_ok($$select api.poa_session_start(decode(repeat('ee', 32), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000042', '+972506666666', null, '203.0.113.10', false)$$,
  'PT423', 'feature_disabled:poa_modules', 'no enabled module: closed');
reset role;
update ops.config set value = 'true' where key in ('poa_module_maslaka', 'poa_module_harbit', 'poa_module_policies');

-- ---------------------------------------------------------------- limits
-- per identity: 10 an hour (the identity of session A has used 1)
set local role service_role;
select is((select count(*)::int from (select api.poa_session_start(extensions.digest('rl-' || g, 'sha256'), '{"first_name":"Zz","last_name":"Test"}'::jsonb,
  '000000059', '+972505555555', null, '198.51.100.5', false) from generate_series(1, 10) g) x), 10, 'ten starts for one identity within the hour');
select throws_ok($$select api.poa_session_start(extensions.digest('rl-11', 'sha256'), '{"first_name":"Zz","last_name":"Test"}'::jsonb,
  '000000059', '+972505555555', null, '198.51.100.5', false)$$, 'PT429', 'rate_limited', 'the 11th start for one identity is refused');
reset role;
-- daily cap: pass the day limit, the next start switches poa_enabled off, alerts, and returns (it does not raise: a raise would undo the switch-off)
select is((select count(*)::int from generate_series(1, 300) g where private.check_rate_limit('poa_all_day', 'day', 300, interval '1 day')) < 300, true, 'daily counter pushed past its limit');
set local role service_role;
select is((api.poa_session_start(extensions.digest('cap-1', 'sha256'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000067', '+972504444444', null,
  '198.51.100.6', false)) ->> 'error', 'rate_limited', 'the daily cap returns rate_limited');
select throws_ok($$select api.poa_session_start(extensions.digest('cap-2', 'sha256'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000075', '+972503333333', null,
  '198.51.100.7', false)$$, 'PT423', 'feature_disabled:poa_enabled', 'and the next call finds the switch off');
reset role;
select is((select value from ops.config where key = 'poa_enabled'), 'false', 'poa_enabled switched itself off');
select is((select count(*)::int from ops.alerts where kind = 'poa_daily_cap'), 1, 'one critical alert');
select is((select count(*)::int from crm.poa_sessions where token_hash = extensions.digest('cap-1', 'sha256')), 0, 'no session was created by the capped call');

select * from finish();
rollback;
