-- 05: agency boundary (090100), helpers + access log (090200), staff RPCs (090300). Runs as postgres; API roles via set local role.
begin;
select no_plan();

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a4'), ('00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000c9');
insert into core.agencies (id, name) values ('5eed0000-0000-4000-8000-0000000000b2', 'Agency B');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'agent', 'Agent A', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a2', 'manager', 'Manager A', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a4', 'admin', 'Admin A', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000b1', 'agent', 'Agent B', '5eed0000-0000-4000-8000-0000000000b2');
insert into core.client_accounts (user_id, status) values ('00000000-0000-0000-0000-0000000000c9', 'active');
insert into crm.leads (agency_id, kind, full_name, phone, consent_at, consent_version) values
  ('5eed0000-0000-4000-8000-000000000001', 'contact', 'Lead A1', '0501234567', now(), 'v1'),
  ('5eed0000-0000-4000-8000-000000000001', 'pension', 'Lead A2', '0501234569', now(), 'v1'),
  ('5eed0000-0000-4000-8000-0000000000b2', 'contact', 'Lead B', '0507654321', now(), 'v1');

-- 090100: seed + config defaults
select is((select name from core.agencies where id = '5eed0000-0000-4000-8000-000000000001'), 'SEELD', 'seed agency exists');
select set_eq($$ select key || '=' || value from ops.config where key in ('intake_enabled', 'chat_enabled', 'portal_enabled', 'tracks_sync_enabled', 'stepup_max_age_sec') $$,
  $$ values ('intake_enabled=true'), ('chat_enabled=true'), ('portal_enabled=false'), ('tracks_sync_enabled=true'), ('stepup_max_age_sec=900') $$,
  'switch defaults');

-- staff.members / core.staff agency scope
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::int from staff.members), 3, 'manager a2 sees the 3 staff of agency A');
select is((select count(*)::int from staff.members where agency_id = '5eed0000-0000-4000-8000-0000000000b2'), 0, 'agency-B staff is not visible');
select is((select count(*)::int from core.agencies), 1, 'manager sees only the own agency');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::int from staff.members), 1, 'agent sees the own staff row only');
select is((select count(*)::int from core.client_accounts), 0, 'staff cannot list client accounts');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c9","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from core.client_accounts), 1, 'a client sees only the own account row');
reset role;

-- 090200: flags and kill switch
delete from ops.config where key in ('portal_enabled', 'intake_enabled');
select throws_ok($$select private.kill_switch('portal_enabled')$$, 'PT423', 'feature_disabled:portal_enabled', 'missing portal_enabled reads closed (PT423)');
select lives_ok($$select private.kill_switch('intake_enabled')$$, 'missing intake_enabled reads open');
select ok(private.flag('chat_enabled'), 'chat_enabled is open');
select ok(not private.flag('no_such_key'), 'an unknown key reads closed');
insert into ops.config (key, value) values ('portal_enabled', 'false'), ('intake_enabled', 'true');

-- step-up freshness
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub','00000000-0000-0000-0000-0000000000a4','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now() - interval '1 hour')::bigint)))::text, true);
select throws_ok($$select staff.admin_assert_fresh()$$, 'PT403', 'forbidden:admin_fresh_totp', 'stale amr gives PT403');
select set_config('request.jwt.claims', jsonb_build_object('sub','00000000-0000-0000-0000-0000000000a4','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','password','timestamp', extract(epoch from now())::bigint)))::text, true);
select throws_ok($$select staff.admin_assert_fresh()$$, 'PT403', 'forbidden:admin_fresh_totp', 'a fresh password amr is not a fresh TOTP');
select set_config('request.jwt.claims', jsonb_build_object('sub','00000000-0000-0000-0000-0000000000a4','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now())::bigint)))::text, true);
select is((staff.admin_assert_fresh()) ->> 'agency_id', '5eed0000-0000-4000-8000-000000000001', 'fresh admin passes and reports the agency');
select throws_ok($$select staff.admin_config_set('rate_limit_pepper', 'x')$$, 'PT400', 'invalid_input:key', 'admin_config_set rejects an unknown key');
select throws_ok($$select staff.admin_config_set('chat_enabled', 'maybe')$$, 'PT400', 'invalid_input:value', 'admin_config_set rejects a non-boolean');
select throws_ok($$select staff.admin_config_set('stepup_max_age_sec', '60')$$, 'PT400', 'invalid_input:value', 'stepup below 300 rejected');
select is((staff.admin_config_set('chat_enabled', 'false')) ->> 'ok', 'true', 'fresh admin flips a switch');
select set_config('request.jwt.claims', jsonb_build_object('sub','00000000-0000-0000-0000-0000000000a2','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now())::bigint)))::text, true);
select throws_ok($$select staff.admin_config_set('chat_enabled', 'true')$$, 'PT403', 'forbidden:admin_fresh_totp', 'a manager is not an admin');
reset role;
select is((select value from ops.config where key = 'chat_enabled'), 'false', 'switch stored');
select is((select new_data from audit.log where table_name = 'ops.config' and op = 'ACTION' order by id desc limit 1),
  '{"to": "false", "from": "true", "action": "admin_config_set"}'::jsonb, 'switch change is an ACTION row');

-- 090300: leads through RPCs only, every read logged
select set_config('t.lead_b', (select id::text from crm.leads where full_name = 'Lead B'), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select set_config('request.headers', '{"x-request-id":"req-05-000001"}', true);
select is((select count(*)::int from staff.leads_list()), 2, 'agent a1 sees the 2 agency-A leads');
select is((select count(*)::int from staff.leads_list('new', 1, 0)), 1, 'limit applies');
select throws_ok($$select * from staff.leads_list('bogus')$$, 'PT400', 'invalid_input:status', 'unknown status filter rejected');
select throws_ok($$select count(*) from crm.leads$$, '42501', null, 'direct crm.leads select gives 42501');
reset role;
select is((select row_count from audit.access_log where action = 'leads_list' and actor = '00000000-0000-0000-0000-0000000000a1' order by id limit 1), 2, 'access_log row_count matches');
select set_eq($$ select unnest(x.subject_ids) from (select subject_ids from audit.access_log where action = 'leads_list'
                                                        and actor = '00000000-0000-0000-0000-0000000000a1' order by id limit 1) x $$,
  $$ select id from crm.leads where agency_id = '5eed0000-0000-4000-8000-000000000001' $$, 'access_log subject_ids match the returned leads');
select is((select request_id from audit.access_log where action = 'leads_list' order by id limit 1), 'req-05-000001', 'access_log keeps the request id');
select is((select actor_role from audit.access_log where action = 'leads_list' order by id limit 1), 'agent', 'access_log keeps the actor role');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok(format('select * from staff.lead_get(%L)', current_setting('t.lead_b')), 'PT404', 'not_found', 'lead_get of an agency-B lead gives PT404');
select throws_ok(format('select staff.lead_set_status(%L, %L)', current_setting('t.lead_b'), 'contacted'), 'PT404', 'not_found', 'lead_set_status of an agency-B lead gives PT404');
select is((select full_name from staff.lead_get((select l.id from staff.leads_list() l where l.kind = 'contact'))), 'Lead A1', 'lead_get of an own lead works');
select is((staff.lead_note_add((select l.id from staff.leads_list() l where l.kind = 'contact'), 'שיחה ראשונה note-secret-text')) ->> 'ok', 'true', 'note added');
select throws_ok(format('select staff.lead_note_add(%L, %L)', (select l.id from staff.leads_list() l where l.kind = 'contact'), '   '), 'PT400', 'invalid_input:note', 'blank note rejected');
select is((staff.lead_assign((select l.id from staff.leads_list() l where l.kind = 'contact'), '00000000-0000-0000-0000-0000000000a2')) ->> 'ok', 'true', 'assign to a colleague');
select throws_ok(format('select staff.lead_assign(%L, %L)', (select l.id from staff.leads_list() l where l.kind = 'contact'), '00000000-0000-0000-0000-0000000000b1'),
  'PT400', 'invalid_input:assignee', 'cannot assign to another agency');
select is((staff.lead_soft_delete((select l.id from staff.leads_list() l where l.kind = 'pension'))) ->> 'ok', 'true', 'soft delete');
select is((select count(*)::int from staff.leads_list()), 1, 'soft-deleted lead leaves the list');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select throws_ok($$select * from staff.leads_list()$$, 'PT403', 'forbidden:staff_aal2', 'aal1 gives PT403');
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($$select * from staff.leads_list()$$, 'PT401', 'unauthenticated', 'no user gives PT401');
reset role;
select is((select count(*)::int from audit.log where table_name = 'crm.leads' and op = 'ACTION' and new_data::text like '%note-secret-text%'), 0,
  'the note ACTION row holds no note text');
select ok((select (new_data ->> 'chars')::int > 0 from audit.log where table_name = 'crm.leads' and op = 'ACTION' and new_data ->> 'action' = 'lead_note_add'),
  'the note ACTION row holds only the length');
select ok((select notes like '%note-secret-text%' from crm.leads where full_name = 'Lead A1'), 'the note is stored on the lead');
select is((select count(*)::int from audit.access_log where action = 'lead_get'), 1, 'lead_get is logged once (the PT404 call logs nothing)');

-- append-only audit tables
select throws_ok($$update audit.access_log set row_count = 0$$, '42501', 'audit.log is append-only', 'access_log update gives 42501');
insert into audit.auth_events (kind, ok, source) values ('test_event', true, 'hook');
select throws_ok($$update audit.auth_events set ok = false$$, '42501', 'audit.log is append-only', 'auth_events update gives 42501');
select throws_ok($$delete from audit.auth_events$$, '42501', 'audit.log is append-only', 'auth_events delete gives 42501');

select * from finish();
rollback;
