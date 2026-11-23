-- 14: client forms backend (20261123120000). Synthetic values only. Runs as postgres. Needs Vault (created inside this
-- rolled-back transaction when absent; never run against a database that holds the real keys).
begin;
select no_plan();

do $$
begin
  if to_regclass('vault.secrets') is not null then
    if not exists (select 1 from vault.secrets where name = 'pii_enc_key') then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'pii_enc_key');
    end if;
    if not exists (select 1 from vault.secrets where name = 'national_id_hmac_key') then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'national_id_hmac_key');
    end if;
  end if;
end $$;
select ok(to_regclass('vault.secrets') is not null, 'Vault is present (the forms flow needs it)');

-- ---------------------------------------------------------------- switches, structure, privileges
select set_eq($$ select key || '=' || value from ops.config where key like 'forms%' $$,
  $$ values ('forms_enabled=false'), ('forms_health_enabled=false'), ('forms_turnstile_required=true') $$,
  'three forms keys seeded; the master switch and the health switch are off');
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'crm' and c.relname in ('form_sessions', 'form_submissions') and c.relrowsecurity), 2, 'RLS on the two forms tables');
select is_empty($$ select r || ' ' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    cross join unnest(array['anon', 'authenticated', 'service_role']) r
                   where n.nspname = 'crm' and c.relname in ('form_sessions', 'form_submissions')
                     and has_table_privilege(r, c.oid, 'SELECT,INSERT,UPDATE,DELETE') $$,
  'no table privilege for anon/authenticated/service_role on the forms tables');
select is((select count(*)::int from pg_trigger where tgrelid in ('crm.form_sessions'::regclass, 'crm.form_submissions'::regclass)
            and tgname like '%\_audit' and not tgisinternal), 2, 'audit trigger on each table');
select is_empty($$ select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'crm' and c.relname in ('form_sessions', 'form_submissions') and a.attnum > 0 and not a.attisdropped
                     and a.attname ~ '(name|phone|email|address|id_number|national_id$|birth|signature|answers$|^ip$|cell)'
                     and a.attname not in ('phone_hmac', 'phone_tail', 'national_id_hmac') $$,
  'no personal plain column in the forms tables');
select ok(not has_function_privilege('anon', 'api.form_session_start(bytea, jsonb, text, text, bytea, text)', 'execute'), 'anon cannot start');
select ok(not has_function_privilege('authenticated', 'api.form_session_get(bytea)', 'execute'), 'authenticated cannot read a session');
select ok(has_function_privilege('service_role', 'api.form_submit(uuid, text, text, integer, jsonb, jsonb, jsonb, text, text, integer)', 'execute'), 'service_role submits');
select ok(not has_function_privilege('service_role', 'private.form_open_session(uuid)', 'execute'), 'private session helper not exposed');
select ok(has_function_privilege('authenticated', 'staff.form_submission_list(integer, integer, text, text)', 'execute')
          and not has_function_privilege('anon', 'staff.form_submission_list(integer, integer, text, text)', 'execute'), 'staff list: authenticated only');
select ok((select attnotnull = false from pg_attribute where attrelid = 'crm.documents'::regclass and attname = 'session_id'), 'crm.documents.session_id is optional now');

-- ---------------------------------------------------------------- closed while the switch is off
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config('t.tha', encode(extensions.digest('forms-fixture-token-a', 'sha256'), 'hex'), true);
set local role service_role;
select throws_ok($$select api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7')$$,
  'PT423', 'feature_disabled:forms_enabled', 'start closed');
select throws_ok($$select api.form_session_get(decode(current_setting('t.tha'), 'hex'))$$, 'PT423', 'feature_disabled:forms_enabled', 'state closed');
select throws_ok($$select api.form_step_save('c5000000-0000-4000-8000-0000000000f1', 'personal', 'personal', 1, 'first_name', '{}'::jsonb, '{}'::jsonb, 0, 0)$$,
  'PT423', 'feature_disabled:forms_enabled', 'step closed');
select throws_ok($$select api.form_submit('c5000000-0000-4000-8000-0000000000f1', 'personal', 'personal', 1, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '203.0.113.7', null, 100)$$,
  'PT423', 'feature_disabled:forms_enabled', 'submit closed');
select throws_ok($$select api.form_document_add('c5000000-0000-4000-8000-0000000000f1', 'id_copy', repeat('a', 64), 'pdf', 100)$$,
  'PT423', 'feature_disabled:forms_enabled', 'document add closed');
select is((api.form_config()) ->> 'forms_enabled', 'false', 'config reports the switch');
select throws_ok($$select count(*) from crm.form_sessions$$, '42501', null, 'service_role cannot read the table directly');
reset role;

-- ---------------------------------------------------------------- start: validation, then a session
update ops.config set value = 'true' where key = 'forms_enabled';
set local role service_role;
select throws_ok($$select api.form_session_start(decode('00', 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7')$$,
  'PT400', 'invalid_input:token', 'token hash must be 32 bytes');
select throws_ok($$select api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7')$$,
  'PT400', 'invalid_input:first_name', 'first name required');
select throws_ok($$select api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test","email":"x"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7')$$,
  'PT400', 'invalid_input:email', 'email shape');
select throws_ok($$select api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '12345678', '+972501234567', null, '203.0.113.7')$$,
  'PT400', 'invalid_input:national_id', 'national id is nine digits');
select throws_ok($$select api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '0501234567', null, '203.0.113.7')$$,
  'PT400', 'invalid_input:phone', 'phone must be E.164 Israeli mobile');

select set_config('t.start', (api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test","email":"zz@example.com"}'::jsonb,
  '000000018', '+972501234567', null, '203.0.113.7'))::text, true);
select is((current_setting('t.start')::jsonb) ->> 'ok', 'true', 'session started');
select set_config('t.sid', (current_setting('t.start')::jsonb) ->> 'session_id', true);
select throws_ok($$select api.form_session_start(decode(current_setting('t.tha'), 'hex'), '{"first_name":"Zz","last_name":"Test"}'::jsonb, '000000018', '+972501234567', null, '203.0.113.7')$$,
  '23505', null, 'the same token hash cannot start twice');

-- state: empty
select is((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) ->> 'status', 'open', 'state: open');
select is(jsonb_array_length((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'submissions'), 0, 'state: no submissions yet');

-- ---------------------------------------------------------------- steps: draft versions
select throws_ok($$select api.form_step_save(current_setting('t.sid')::uuid, 'personal', 'Bad Key', 1, 'first_name', '{"first_name":"Zz"}'::jsonb, '{}'::jsonb, 0, 10)$$,
  'PT400', 'invalid_input:questionnaire', 'questionnaire key shape');
select throws_ok($$select api.form_step_save(current_setting('t.sid')::uuid, 'personal', 'personal', 1, 'first_name', '{"first_name":"Zz"}'::jsonb, '{}'::jsonb, 3, 10)$$,
  'PT409', 'stale_draft', 'a new draft starts at version 0');
select is((api.form_step_save(current_setting('t.sid')::uuid, 'personal', 'personal', 1, 'first_name', '{"first_name":"Zz"}'::jsonb, '{}'::jsonb, 0, 10)) ->> 'draft_version', '1', 'first save: version 1');
select is((api.form_step_save(current_setting('t.sid')::uuid, 'personal', 'personal', 1, 'last_name', '{"first_name":"Zz","last_name":"Test"}'::jsonb, '{}'::jsonb, 1, 20)) ->> 'draft_version', '2', 'second save: version 2');
select throws_ok($$select api.form_step_save(current_setting('t.sid')::uuid, 'personal', 'personal', 1, 'last_name', '{"first_name":"Other"}'::jsonb, '{}'::jsonb, 1, 20)$$,
  'PT409', 'stale_draft', 'an older device cannot overwrite a newer draft');
select is((select x ->> 'step_key' from jsonb_array_elements((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'submissions') x), 'last_name', 'state: resume point');
select is((select x -> 'answers' ->> 'last_name' from jsonb_array_elements((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'submissions') x), 'Test', 'state: a draft returns its answers');
reset role;
select ok((select answers_enc is not null and position(convert_to('Test', 'utf8') in answers_enc) = 0 from crm.form_submissions where session_id = current_setting('t.sid')::uuid), 'the draft answers are encrypted');

-- ---------------------------------------------------------------- health: answers kept only with forms_health_enabled
set local role service_role;
select is((api.form_step_save(current_setting('t.sid')::uuid, 'health', 'health', 1, 'height', '{"height":"180"}'::jsonb, '{"health_screening":{"status":"all_clear"}}'::jsonb, 0, 5)) ->> 'answers_stored', 'false',
  'health draft: answers not stored while the switch is off');
reset role;
select ok((select answers_enc is null and derived ->> 'health_screening' is not null from crm.form_submissions where session_id = current_setting('t.sid')::uuid and questionnaire_key = 'health'),
  'health draft: only the derived screening is kept');
update ops.config set value = 'true' where key = 'forms_health_enabled';
set local role service_role;
select is((api.form_step_save(current_setting('t.sid')::uuid, 'health', 'health', 1, 'weight', '{"height":"180","weight":"80"}'::jsonb, '{}'::jsonb, 1, 6)) ->> 'answers_stored', 'true',
  'health draft: stored once the switch is on');
reset role;
update ops.config set value = 'false' where key = 'forms_health_enabled';

-- ---------------------------------------------------------------- submit
set local role service_role;
select throws_ok($$select api.form_submit(current_setting('t.sid')::uuid, 'personal', 'personal', 1, '{"first_name":"Zz"}'::jsonb, '{}'::jsonb, '{"name":"Zz Test","kind":"typed","hash":"nothex"}'::jsonb, '203.0.113.7', 'ua', 100)$$,
  'PT400', 'invalid_input:signer_hash', 'the signer hash is sha256 hex');
select throws_ok($$select api.form_submit(current_setting('t.sid')::uuid, 'personal', 'personal', 1, '{"first_name":"Zz"}'::jsonb, '{}'::jsonb, jsonb_build_object('name', 'Zz Test', 'kind', 'drawn', 'png', 'data:text/html;base64,AAAA', 'hash', repeat('a', 64)), '203.0.113.7', 'ua', 100)$$,
  'PT400', 'invalid_input:signature', 'a drawn signature must be a PNG data url');
select set_config('t.sub', (api.form_submit(current_setting('t.sid')::uuid, 'personal', 'personal', 1, '{"first_name":"Zz","last_name":"Test"}'::jsonb, '{"completion":"full"}'::jsonb,
  jsonb_build_object('name', 'Zz Test', 'kind', 'typed', 'hash', repeat('a', 64)), '203.0.113.7', 'ua-test', 100))::text, true);
select is((current_setting('t.sub')::jsonb) ->> 'duplicate', 'false', 'submitted');
select is((api.form_submit(current_setting('t.sid')::uuid, 'personal', 'personal', 1, '{"first_name":"Zz"}'::jsonb, '{}'::jsonb,
  jsonb_build_object('name', 'Zz Test', 'kind', 'typed', 'hash', repeat('b', 64)), '203.0.113.7', 'ua-test', 100)) ->> 'duplicate', 'true', 'a second submit changes nothing');
select throws_ok($$select api.form_step_save(current_setting('t.sid')::uuid, 'personal', 'personal', 1, 'first_name', '{"first_name":"Zz"}'::jsonb, '{}'::jsonb, 2, 10)$$,
  'PT409', 'already_submitted', 'a submitted questionnaire takes no more steps');
select is((select x ->> 'status' from jsonb_array_elements((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'submissions') x where x ->> 'questionnaire_key' = 'personal'), 'submitted', 'state: submitted');
select ok((select x -> 'answers' is null or jsonb_typeof(x -> 'answers') = 'null' from jsonb_array_elements((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'submissions') x where x ->> 'questionnaire_key' = 'personal'),
  'state: a submitted questionnaire returns no answers');
reset role;
select ok((select status = 'submitted' and signer_enc is not null and position(convert_to('Zz Test', 'utf8') in signer_enc) = 0 and signed_at is not null
             from crm.form_submissions where session_id = current_setting('t.sid')::uuid and questionnaire_key = 'personal'), 'submission recorded, signer encrypted');
select ok(exists (select 1 from audit.log where table_name = 'crm.form_submissions' and new_data ->> 'action' = 'form_submit'), 'submit left an audit row');

-- ---------------------------------------------------------------- documents
set local role service_role;
select throws_ok($$select api.form_document_add(current_setting('t.sid')::uuid, 'selfie', repeat('a', 64), 'pdf', 100)$$, 'PT400', 'invalid_input:kind', 'document kind');
select throws_ok($$select api.form_document_add(current_setting('t.sid')::uuid, 'id_copy', repeat('a', 64), 'exe', 100)$$, 'PT400', 'invalid_input:ext', 'document extension');
select set_config('t.doc', (api.form_document_add(current_setting('t.sid')::uuid, 'id_copy', repeat('a', 64), 'pdf', 1234))::text, true);
select set_config('t.did', (current_setting('t.doc')::jsonb) ->> 'document_id', true);
select set_config('t.dpath', (current_setting('t.doc')::jsonb) ->> 'storage_path', true);
select ok(current_setting('t.dpath') ~ ('^forms/5eed0000-0000-4000-8000-000000000001/' || current_setting('t.sid') || '/id_copy-' || current_setting('t.did') || '\.pdf$'), 'the path names agency, session, kind and document');
select throws_ok($$select api.form_document_stored(current_setting('t.did')::uuid, 'forms/x/y/id_copy-z.pdf')$$, 'PT400', 'invalid_input:path', 'stored: the path must be the one given');
select is((api.form_document_stored(current_setting('t.did')::uuid, current_setting('t.dpath'))) ->> 'ok', 'true', 'document stored');
select is((select x ->> 'stored' from jsonb_array_elements((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) -> 'documents') x), 'true', 'state lists the stored document');
reset role;
select ok((select session_id is null and form_session_id = current_setting('t.sid')::uuid and source = 'client' and storage_path = current_setting('t.dpath')
             from crm.documents where id = current_setting('t.did')::uuid), 'crm.documents row belongs to the forms session');

-- ---------------------------------------------------------------- expiry
update crm.form_sessions set expires_at = now() - interval '1 minute' where id = current_setting('t.sid')::uuid;
set local role service_role;
select is((api.form_session_get(decode(current_setting('t.tha'), 'hex'))) ->> 'status', 'expired', 'state flips an expired session');
select throws_ok($$select api.form_step_save(current_setting('t.sid')::uuid, 'financial', 'needs-assessment', 1, 'x', '{}'::jsonb, '{}'::jsonb, 0, 0)$$, 'PT410', 'session_expired', 'no step on an expired session');
reset role;
update crm.form_sessions set expires_at = now() + interval '1 day', status = 'open' where id = current_setting('t.sid')::uuid;

-- ---------------------------------------------------------------- staff: list, get, status (admin, fresh TOTP), client_doc_get
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f4'), ('00000000-0000-0000-0000-0000000000f1');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000f4', 'admin', 'Admin F', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000f1', 'agent', 'Agent F', '5eed0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select * from staff.form_submission_list()$$, 'PT403', 'forbidden:admin_fresh_totp', 'an agent cannot list submissions');
select set_config('request.jwt.claims', jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000f4', 'role', 'authenticated', 'aal', 'aal2',
  'amr', jsonb_build_array(jsonb_build_object('method', 'totp', 'timestamp', extract(epoch from now())::bigint)))::text, true);
select is((select count(*)::int from staff.form_submission_list()), 2, 'the admin lists the two submissions of the session');
select is((select id_masked from staff.form_submission_list(p_status => 'submitted')), '*****0018', 'the list shows a masked national id');
select is((select first_name from staff.form_submission_list(p_card => 'personal')), 'Zz', 'the list shows the first name');
select is((select jsonb_array_length(documents) from staff.form_submission_list(p_card => 'personal')), 1, 'the list shows the document');
select set_config('t.fid', (select id::text from staff.form_submission_list(p_card => 'personal')), true);
select is((staff.form_submission_get(current_setting('t.fid')::uuid)) -> 'answers' ->> 'last_name', 'Test', 'get decrypts the answers for the logged read');
select is((staff.form_submission_get(current_setting('t.fid')::uuid)) -> 'signer' ->> 'name', 'Zz Test', 'get shows the signer');
select ok(((staff.form_submission_get(current_setting('t.fid')::uuid)) -> 'signer') ? 'ip' = false, 'get never shows the ip');
select is((staff.form_submission_get(current_setting('t.fid')::uuid)) -> 'identity' ->> 'email', 'zz@example.com', 'get shows the identity');
select is((staff.form_submission_set_status(current_setting('t.fid')::uuid, 'reviewed', 'called back')) ->> 'ok', 'true', 'marked reviewed');
select is((select status from staff.form_submission_list(p_card => 'personal')), 'reviewed', 'the list shows reviewed');
select is((staff.client_doc_get(current_setting('t.did')::uuid)) ->> 'storage_path', current_setting('t.dpath'), 'client_doc_get serves a client upload');
reset role;
select ok((select reviewed_by = '00000000-0000-0000-0000-0000000000f4' and review_note_enc is not null from crm.form_submissions where id = current_setting('t.fid')::uuid), 'reviewer and note recorded');
select ok(exists (select 1 from audit.access_log where action = 'form_submission_get' and subject = 'crm.form_submissions'), 'the read is in the access log');

select * from finish();
rollback;
