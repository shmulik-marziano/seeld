-- 17: Har HaBituach, client path (20261125120000). Synthetic values only (valid-checksum fake ids). Runs as postgres.
-- Vault keys are created inside this rolled-back transaction when absent (same as 12 and 16). Never run against the real keys.
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

-- ---------------------------------------------------------------- switches, structure, privileges
select set_eq($$ select key || '=' || value from ops.config
                 where key in ('client_area_harb_upload_enabled', 'surense_harb_import_enabled', 'surense_harb_provider_match') $$,
  $$ values ('client_area_harb_upload_enabled=false'), ('surense_harb_import_enabled=false'), ('surense_harb_provider_match=') $$,
  'the three harb keys are seeded closed / empty');
select ok((select attnotnull = false from pg_attribute where attrelid = 'crm.documents'::regclass and attname = 'session_id'), 'session_id is optional');
select is((select count(*)::int from pg_attribute where attrelid = 'crm.documents'::regclass and not attisdropped
            and attname in ('import_status', 'import_id', 'import_code', 'import_updated_at')), 4, 'the import columns exist');
select lives_ok($$insert into ops.surense_jobs (kind, params) values ('surense.harb_import', '{}')$$, 'the kind check accepts surense.harb_import');
delete from ops.surense_jobs where kind = 'surense.harb_import';
select ok(has_function_privilege('service_role', 'api.client_harb_add(bytea, text, text, integer)', 'execute')
          and not has_function_privilege('authenticated', 'api.client_harb_add(bytea, text, text, integer)', 'execute')
          and not has_function_privilege('anon', 'api.client_harb_add(bytea, text, text, integer)', 'execute'), 'client_harb_add: service role only');
select ok(has_function_privilege('service_role', 'api.harb_import_get(uuid)', 'execute')
          and not has_function_privilege('authenticated', 'api.harb_import_get(uuid)', 'execute'), 'harb_import_get: service role only');
select ok(has_function_privilege('authenticated', 'staff.harb_fallback_list(integer)', 'execute')
          and not has_function_privilege('anon', 'staff.harb_fallback_list(integer)', 'execute'), 'fallback list: authenticated only');
select ok(not has_function_privilege('service_role', 'private.il_business_days_after(date, date)', 'execute'), 'private helper not exposed');

-- business days (Sunday..Thursday): 2026-11-22 is a Sunday
select is(private.il_business_days_after('2026-11-22', '2026-11-22'), 0, 'same day: 0');
select is(private.il_business_days_after('2026-11-22', '2026-11-26'), 4, 'Sunday -> Thursday: 4');
select is(private.il_business_days_after('2026-11-26', '2026-11-29'), 1, 'Thursday -> Sunday: the weekend does not count');

-- ---------------------------------------------------------------- fixtures (synthetic)
insert into crm.customers (id, agency_id, first_name, last_name, mobile_phone, national_id_hmac, national_id_enc)
values ('c7000000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', 'Zz-Harb', 'Test', '0501234567',
        private.national_id_hmac('000000018'), private.pii_encrypt('000000018')),
       ('c7000000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001', 'Zz-Harb2', 'Test', '0509999999',
        private.national_id_hmac('000000026'), private.pii_encrypt('000000026'));
insert into crm.surense_customers (id, national_id_hmac, details_enc)
values ('c7100000-0000-4000-8000-000000000001', private.national_id_hmac('000000018'), private.pii_encrypt('{}'));
insert into crm.client_sessions (id, customer_id, agency_id, token_hash, expires_at)
values ('c7200000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001',
        extensions.digest('harb-fixture-token-1', 'sha256'), now() + interval '30 days');
select set_config('t.th', encode(extensions.digest('harb-fixture-token-1', 'sha256'), 'hex'), true);

-- shape checks on crm.documents (the forms / POA checks still hold for every other row)
select throws_ok($$insert into crm.documents (kind, source, status, session_id, customer_id) values ('harb_xlsx', 'client', 'incomplete',
                   'c7300000-0000-4000-8000-0000000000ff', 'c7000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'a harb row never carries a POA session');
select throws_ok($$insert into crm.documents (kind, source, status) values ('harb_xlsx', 'client', 'incomplete')$$,
  '23514', null, 'a harb row needs its customer');
select throws_ok($$insert into crm.documents (kind, source, status, customer_id) values ('maslaka', 'native', 'incomplete', 'c7000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'a POA kind without a session is still refused');
select throws_ok($$insert into crm.documents (kind, source, status, customer_id, storage_path) values ('harb_xlsx', 'client', 'incomplete',
                   'c7000000-0000-4000-8000-000000000001', 'harb/x/../evil.xlsx')$$,
  '23514', null, 'a harb path outside the mandated shape is refused');

-- ---------------------------------------------------------------- closed: the client area, then the harb switch
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select throws_ok($$select api.client_harb_status(decode(current_setting('t.th'), 'hex'))$$, 'PT423', 'feature_disabled:client_area_enabled', 'status closed with the area');
reset role;
update ops.config set value = 'true' where key = 'client_area_enabled';
set local role service_role;
select is(api.client_harb_status(decode(current_setting('t.th'), 'hex')), '{"enabled": false, "last": null}'::jsonb, 'upload switch off: the card is hidden');
select throws_ok($$select api.client_harb_add(decode(current_setting('t.th'), 'hex'), '000000018', repeat('a', 64), 3)$$,
  'PT423', 'feature_disabled:client_area_harb_upload_enabled', 'add closed');
select throws_ok($$select api.client_harb_stored(decode(current_setting('t.th'), 'hex'), 'c7300000-0000-4000-8000-000000000001', 'x')$$,
  'PT423', 'feature_disabled:client_area_harb_upload_enabled', 'stored closed');
select throws_ok($$select api.harb_import_get('c7300000-0000-4000-8000-000000000001')$$,
  'PT423', 'feature_disabled:client_area_harb_upload_enabled', 'the worker read is closed too');
reset role;

-- ---------------------------------------------------------------- open: add, mismatch, store, duplicate
update ops.config set value = 'true' where key = 'client_area_harb_upload_enabled';
set local role service_role;
select is(api.client_harb_status(decode(current_setting('t.th'), 'hex')), '{"enabled": true, "last": null}'::jsonb, 'open, nothing uploaded yet');
select throws_ok($$select api.client_harb_add(decode(repeat('00', 32), 'hex'), '000000018', repeat('a', 64), 3)$$, 'PT401', 'session_inactive', 'unknown token');
select throws_ok($$select api.client_harb_add(decode(current_setting('t.th'), 'hex'), '18a', repeat('a', 64), 3)$$, 'PT400', 'invalid_input:national_id', 'id must be digits');
select throws_ok($$select api.client_harb_add(decode(current_setting('t.th'), 'hex'), '000000018', 'xyz', 3)$$, 'PT400', 'invalid_input:sha256', 'hash must be hex');
select throws_ok($$select api.client_harb_add(decode(current_setting('t.th'), 'hex'), '000000018', repeat('a', 64), 0)$$, 'PT400', 'invalid_input:rows', 'at least one policy row');
select is(api.client_harb_add(decode(current_setting('t.th'), 'hex'), '000000026', repeat('a', 64), 3), '{"ok": false, "error": "id_mismatch"}'::jsonb,
  'another person''s id: refused without a raise');
select set_config('t.a1', (api.client_harb_add(decode(current_setting('t.th'), 'hex'), '00000018', repeat('a', 64), 3))::text, true);
reset role;
select is((select count(*)::int from audit.log where op = 'ACTION' and new_data ->> 'action' = 'client_harb_refused' and new_data ->> 'code' = 'id_mismatch'), 1,
  'the refusal is audited (code only)');
select is(current_setting('t.a1')::jsonb ->> 'ok', 'true', 'the client''s own id (leading zeros normalised) passes');
select is(current_setting('t.a1')::jsonb ->> 'duplicate', 'false', 'a new file');
select set_config('t.d1', current_setting('t.a1')::jsonb ->> 'document_id', true);
select is(current_setting('t.a1')::jsonb ->> 'storage_path',
  'harb/5eed0000-0000-4000-8000-000000000001/c7000000-0000-4000-8000-000000000001/harb_xlsx-' || current_setting('t.d1') || '.xlsx', 'the mandated path');
select ok((select kind = 'harb_xlsx' and source = 'client' and status = 'incomplete' and session_id is null and storage_path is null
                  and customer_id = 'c7000000-0000-4000-8000-000000000001' and sha256 = decode(repeat('a', 64), 'hex') and import_status is null
             from crm.documents where id = current_setting('t.d1')::uuid), 'row: harb, client, customer-bound, not stored yet');
select is_empty($$ select l.id from audit.log l, jsonb_object_keys(coalesce(l.new_data, '{}')) k
                   where l.op = 'ACTION' and l.new_data ->> 'action' like '%harb%' and k not in ('action', 'kind', 'rows', 'code', 'queued', 'status') $$,
  'harb ACTION rows carry codes and counts only');

set local role service_role;
select throws_ok(format($$select api.client_harb_stored(decode(current_setting('t.th'), 'hex'), %L, 'harb/x.xlsx')$$, current_setting('t.d1')),
  'PT400', 'invalid_input:path', 'only the mandated path');
select throws_ok($$select api.client_harb_stored(decode(current_setting('t.th'), 'hex'), 'c7300000-0000-4000-8000-0000000000ee', 'x')$$,
  'PT404', 'not_found', 'an unknown document');
select is(api.client_harb_stored(decode(current_setting('t.th'), 'hex'), current_setting('t.d1')::uuid, current_setting('t.a1')::jsonb ->> 'storage_path'),
  '{"stored": true, "queued": false}'::jsonb, 'stored; the push switch is off, nothing queued');
select is(api.client_harb_stored(decode(current_setting('t.th'), 'hex'), current_setting('t.d1')::uuid, current_setting('t.a1')::jsonb ->> 'storage_path'),
  '{"stored": true, "queued": false}'::jsonb, 'storing again is a no-op');
select is(api.client_harb_add(decode(current_setting('t.th'), 'hex'), '000000018', repeat('a', 64), 3) ->> 'duplicate', 'true', 'the same file again: duplicate');
select is((api.client_harb_status(decode(current_setting('t.th'), 'hex'))) -> 'last' ->> 'id', current_setting('t.d1'), 'the card shows the latest file');
reset role;
select ok((select status = 'active' and stored_at is not null from crm.documents where id = current_setting('t.d1')::uuid), 'stored row is active');
select is((select count(*)::int from ops.surense_jobs where kind = 'surense.harb_import'), 0, 'no job while surense_harb_import_enabled is off');

-- ---------------------------------------------------------------- push switch on: the second file is queued
update ops.config set value = 'true' where key = 'surense_harb_import_enabled';
set local role service_role;
select set_config('t.a2', (api.client_harb_add(decode(current_setting('t.th'), 'hex'), '000000018', repeat('b', 64), 5))::text, true);
select set_config('t.d2', current_setting('t.a2')::jsonb ->> 'document_id', true);
select is(api.client_harb_stored(decode(current_setting('t.th'), 'hex'), current_setting('t.d2')::uuid, current_setting('t.a2')::jsonb ->> 'storage_path'),
  '{"stored": true, "queued": true}'::jsonb, 'stored and queued');
reset role;
select ok((select status = 'pending' and params = jsonb_build_object('document_id', current_setting('t.d2')) and dedupe_key = 'harb:' || current_setting('t.d2')
             from ops.surense_jobs where kind = 'surense.harb_import'), 'one pending job: document id only, deduped per document');
select is((select import_status from crm.documents where id = current_setting('t.d2')::uuid), 'queued', 'the row says queued');

-- ---------------------------------------------------------------- the worker side
set local role service_role;
select set_config('t.g', (api.harb_import_get(current_setting('t.d2')::uuid))::text, true);
select throws_ok($$select api.harb_import_get('c7300000-0000-4000-8000-0000000000ee')$$, 'PT404', 'not_found', 'unknown document');
select throws_ok(format($$select api.harb_import_set(%L, 'bogus', null, null)$$, current_setting('t.d2')), 'PT400', 'invalid_input:status', 'status whitelist');
select throws_ok(format($$select api.harb_import_set(%L, 'failed', null, 'has space')$$, current_setting('t.d2')), 'PT400', 'invalid_input:code', 'codes only');
select is(api.harb_import_set(current_setting('t.d2')::uuid, 'initiated', 'c7400000-0000-4000-8000-000000000001', null), '{"updated": true}'::jsonb, 'phase written');
select is(api.harb_import_set(current_setting('t.d2')::uuid, 'sent', null, null), '{"updated": true}'::jsonb, 'a later phase without an id');
select is(api.harb_import_set('c7300000-0000-4000-8000-0000000000ee', 'sent', null, null), '{"updated": false}'::jsonb, 'unknown document: nothing updated');
select set_config('t.g2', (api.harb_import_get(current_setting('t.d2')::uuid))::text, true);
reset role;
select is(current_setting('t.g')::jsonb ->> 'storage_path', current_setting('t.a2')::jsonb ->> 'storage_path', 'the worker reads the stored path');
select is(current_setting('t.g')::jsonb ->> 'sha256', repeat('b', 64), 'and the hash');
select is(current_setting('t.g')::jsonb ->> 'surense_customer_id', 'c7100000-0000-4000-8000-000000000001', 'the Surense id of the same person (mirror)');
select is(current_setting('t.g')::jsonb ->> 'provider_match', '', 'the provider match is empty until the owner sets it');
select is(current_setting('t.g2')::jsonb ->> 'import_status', 'sent', 'the phase');
select is(current_setting('t.g2')::jsonb ->> 'import_id', 'c7400000-0000-4000-8000-000000000001', 'a null id keeps the known one');
select ok(not (current_setting('t.g')::jsonb ? 'national_id'), 'no national id goes to the worker');

-- ---------------------------------------------------------------- staff fallback list
-- session A: customer 2 (no file), harbit signed now -> listed; session B: customer 1 signed an hour ago, a file stored since
-- -> not listed; session C: signed 20 days ago -> past the window
insert into crm.poa_sessions (id, agency_id, token_hash, status, modules, national_id_hmac, phone_hmac, phone_tail, identity_enc, expires_at, completed_at)
values
  ('c7300000-0000-4000-8000-00000000000a', '5eed0000-0000-4000-8000-000000000001', extensions.digest('harb-poa-a', 'sha256'), 'completed', '{}',
   private.national_id_hmac('000000026'), extensions.digest('hp-a', 'sha256'), '99',
   private.pii_encrypt('{"first_name":"Zz-A","last_name":"Test","national_id":"000000026"}'), now() + interval '1 day', now()),
  ('c7300000-0000-4000-8000-00000000000b', '5eed0000-0000-4000-8000-000000000001', extensions.digest('harb-poa-b', 'sha256'), 'completed', '{}',
   private.national_id_hmac('000000018'), extensions.digest('hp-b', 'sha256'), '67',
   private.pii_encrypt('{"first_name":"Zz-B","last_name":"Test","national_id":"000000018"}'), now() + interval '1 day', now()),
  ('c7300000-0000-4000-8000-00000000000c', '5eed0000-0000-4000-8000-000000000001', extensions.digest('harb-poa-c', 'sha256'), 'completed', '{}',
   private.national_id_hmac('000000034'), extensions.digest('hp-c', 'sha256'), '11',
   private.pii_encrypt('{"first_name":"Zz-C","last_name":"Test","national_id":"000000034"}'), now() + interval '1 day', now());
insert into crm.poa_consents (session_id, kind, method, approved_at) values
  ('c7300000-0000-4000-8000-00000000000a', 'poa_harbit', 'signature', now()),
  ('c7300000-0000-4000-8000-00000000000b', 'poa_harbit', 'signature', now() - interval '1 hour'),
  ('c7300000-0000-4000-8000-00000000000c', 'poa_harbit', 'signature', now() - interval '20 days');
update crm.documents set created_at = now() where kind = 'harb_xlsx';

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000d7'), ('00000000-0000-0000-0000-0000000000d8');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000d7', 'admin', 'Zz Admin', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000d8', 'agent', 'Zz Agent', '5eed0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d8","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select * from staff.harb_fallback_list()$$, 'PT403', 'forbidden:admin_fresh_totp', 'an agent without a fresh admin step cannot list');
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000d7', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select throws_ok($$select * from staff.harb_fallback_list(0)$$, 'PT400', 'invalid_input:days', 'the window is 1..30 business days');
select set_eq($$ select session_id::text from staff.harb_fallback_list() $$, $$ values ('c7300000-0000-4000-8000-00000000000a') $$,
  'only the fresh signature without a file is listed');
select is((select id_masked || ' ' || phone_tail || ' ' || business_days_left from staff.harb_fallback_list()), '*****0026 99 5', 'masked id, phone tail, days left');
select is((select customer_id::text from staff.harb_fallback_list()), 'c7000000-0000-4000-8000-000000000002', 'linked to the customer of the same id');
reset role;
select ok(exists (select 1 from audit.access_log where action = 'harb_fallback_list' and subject = 'crm.poa_sessions'), 'the list is access-logged');

select * from finish();
rollback;
