-- 07: invitations + Before User Created hook (090600/091400), invitation RPCs (090800), lockout/disable/enable (090900/091400),
-- copy_auth_events tie-break watermark (091400) and the watchdog lock rules (091100).
-- Runs as postgres, like every other file: `supabase test db` cannot assume supabase_auth_admin, so the hook is called directly
-- (postgres owns it) and supabase_auth_admin's access is asserted from the catalog (grants + policies), not by switching role.
-- The tie-break is proven with p_limit = 2 and 3 rows sharing one timestamp (same code path as 5,000 + 1, without 5,001 inserts).
begin;
select no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'agent-a@example.com'), ('00000000-0000-0000-0000-0000000000a3', 'agent-c@example.com'),
  ('00000000-0000-0000-0000-0000000000a4', 'admin-a@example.com'), ('00000000-0000-0000-0000-0000000000a5', 'admin-b@example.com'),
  ('00000000-0000-0000-0000-0000000000a6', 'new-staff@example.com');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'agent', 'Agent A', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a3', 'agent', 'Agent C', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a4', 'admin', 'Admin A', '5eed0000-0000-4000-8000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin', 'Admin B', '5eed0000-0000-4000-8000-000000000001');
insert into crm.leads (agency_id, kind, full_name, phone, consent_at, consent_version)
values ('5eed0000-0000-4000-8000-000000000001', 'contact', 'Lead A1', '0501234567', now(), 'v1');

-- ===== what supabase_auth_admin may do (catalog, no role switch) =====
select ok(has_function_privilege('supabase_auth_admin', 'private.hook_before_user_created(jsonb)', 'execute'), 'supabase_auth_admin executes the hook');
select ok(not (select prosecdef from pg_proc where oid = 'private.hook_before_user_created(jsonb)'::regprocedure), 'the hook is not security definer');
select ok(has_table_privilege('supabase_auth_admin', 'core.invitations', 'select'), 'supabase_auth_admin reads invitations');
select ok(has_table_privilege('supabase_auth_admin', 'audit.auth_events', 'insert'), 'supabase_auth_admin inserts auth events');
select ok(not has_table_privilege('supabase_auth_admin', 'core.invitations', 'insert,update,delete'), 'supabase_auth_admin cannot change invitations');
select ok(has_schema_privilege('supabase_auth_admin', 'core', 'usage') and has_schema_privilege('supabase_auth_admin', 'audit', 'usage')
          and has_schema_privilege('supabase_auth_admin', 'private', 'usage'), 'supabase_auth_admin has usage on core/audit/private');
select set_eq($$ select tablename || ':' || cmd from pg_policies where 'supabase_auth_admin' = any (roles) $$,
  $$ values ('invitations:SELECT'), ('auth_events:INSERT') $$, 'exactly the two hook policies exist');
select ok(has_function_privilege('anon', 'private.hook_before_user_created(jsonb)', 'execute') = false
          and has_function_privilege('authenticated', 'private.hook_before_user_created(jsonb)', 'execute') = false, 'API roles cannot call the hook');

-- ===== hook =====
select is(private.hook_before_user_created('{"user":{"email":"stranger@example.com"}}'::jsonb) #>> '{error,http_code}', '403', 'no invitation gives 403');
select is((select count(*)::int from audit.auth_events where kind = 'user_created_denied' and source = 'hook'), 1, 'denial is recorded in auth_events');
select is(private.hook_before_user_created('{"user":{}}'::jsonb) #>> '{error,http_code}', '403', 'missing email gives 403');
insert into core.invitations (email, kind, role, agency_id) values ('Invited@Example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001');
select is(private.hook_before_user_created('{"user":{"email":"invited@example.com"}}'::jsonb), '{}'::jsonb, 'open staff invitation gives {}');
select throws_ok($$insert into core.invitations (email, kind, role, agency_id) values ('invited@example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001')$$,
  '23505', null, 'second open invitation for the same email gives 23505');
insert into core.invitations (email, kind, role, agency_id, expires_at) values ('expired@example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001', now() - interval '1 minute');
select is(private.hook_before_user_created('{"user":{"email":"expired@example.com"}}'::jsonb) #>> '{error,http_code}', '403', 'expired invitation gives 403');
insert into core.invitations (email, kind, agency_id) values ('client@example.com', 'client', '5eed0000-0000-4000-8000-000000000001');
select is(private.hook_before_user_created('{"user":{"email":"client@example.com"}}'::jsonb) #>> '{error,http_code}', '403', 'open CLIENT invitation gives 403 (staff only until the portal)');
select is((select count(*)::int from audit.log where table_name = 'core.invitations' and (new_data is not null or old_data is not null) and op <> 'ACTION'), 0,
  'invitation audit keeps no e-mail values');

-- ===== invitation RPCs (service_role) =====
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok($$select api.invitation_create('x@example.com', 'staff', 'agent', '00000000-0000-0000-0000-0000000000a1')$$, 'PT403', 'forbidden:inviter', 'an agent cannot invite');
select throws_ok($$select api.invitation_create('invited@example.com', 'staff', 'agent', '00000000-0000-0000-0000-0000000000a4')$$, 'PT409', 'invitation_open', 'second open invitation gives PT409');
select throws_ok($$select api.invitation_create('x@example.com', 'client', null, '00000000-0000-0000-0000-0000000000a4')$$, 'PT423', 'feature_disabled:portal_enabled', 'client invitations are off with the portal');
select isnt(api.invitation_create('New-Staff@example.com', 'staff', 'manager', '00000000-0000-0000-0000-0000000000a4'), null, 'admin invites a manager');
select is((api.staff_provision('00000000-0000-0000-0000-0000000000a6', 'New Staff')) ->> 'role', 'manager', 'staff_provision takes the role from the invitation');
select throws_ok($$select api.staff_provision('00000000-0000-0000-0000-0000000000a6', 'New Staff')$$, 'PT409', null, 'repeat provision gives PT409');
select is((api.invitation_resend('new-staff@example.com', '00000000-0000-0000-0000-0000000000a4')) ->> 'mode', 'recovery', 'resend for a never-signed-in user gives recovery');
reset role;
select is((select agency_id from core.staff where user_id = '00000000-0000-0000-0000-0000000000a6'), '5eed0000-0000-4000-8000-000000000001'::uuid, 'agency comes from the invitation');
select ok((select accepted_at is not null from core.invitations where lower(email) = 'new-staff@example.com'), 'invitation accepted');

-- ===== lockout =====
update core.staff set locked_until = now() + interval '30 minutes' where user_id = '00000000-0000-0000-0000-0000000000a3';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated","aal":"aal2"}', true);
select is(private.staff_role(), null, 'a locked agent has staff_role null');
select throws_ok($$select * from staff.leads_list()$$, 'PT403', 'forbidden:staff_aal2', 'a locked agent reads no leads');
reset role;

-- ===== disable / enable =====
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub','00000000-0000-0000-0000-0000000000a4','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now())::bigint)))::text, true);
select throws_ok($$select staff.admin_staff_disable('00000000-0000-0000-0000-0000000000a4')$$, 'PT409', 'cannot_disable_self', 'admin cannot disable self');
select is((staff.admin_staff_disable('00000000-0000-0000-0000-0000000000a1')) ->> 'next', 'ban_user', 'disable agent gives next ban_user');
select throws_ok($$select staff.admin_staff_disable('00000000-0000-0000-0000-0000000000a1')$$, 'PT404', 'not_found', 'disable twice gives PT404');
select is((staff.admin_staff_disable('00000000-0000-0000-0000-0000000000a5')) ->> 'next', 'ban_user', 'another admin can be disabled (the caller stays an active admin)');
select is((staff.admin_staff_enable('00000000-0000-0000-0000-0000000000a1')) ->> 'next', 'unban_user', 'enable gives next unban_user');
select throws_ok($$select staff.admin_staff_enable('00000000-0000-0000-0000-0000000000a1')$$, 'PT404', 'not_found', 'enable on an active user gives PT404');
select is((staff.admin_staff_unlock('00000000-0000-0000-0000-0000000000a3')) ->> 'ok', 'true', 'unlock a locked agent');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select staff.admin_staff_enable('00000000-0000-0000-0000-0000000000a5')$$, 'PT403', 'forbidden:admin_fresh_totp', 'an agent cannot enable');
reset role;
select ok((select active and locked_until is null from core.staff where user_id = '00000000-0000-0000-0000-0000000000a1'), 'enabled agent is active');
select ok(exists (select 1 from audit.log where op = 'ACTION' and pk = '00000000-0000-0000-0000-0000000000a1' and new_data ->> 'action' = 'admin_staff_enable'), 'enable wrote an ACTION row');
select is((select count(*)::int from core.staff where role = 'admin' and active), 1, 'one active admin remains');

-- ===== copy_auth_events: (created_at, id) watermark =====
update ops.config set value = '2000-01-01T00:00:00Z' where key = 'auth_events_last_at';
update ops.config set value = '00000000-0000-0000-0000-000000000000' where key = 'auth_events_last_id';
insert into auth.audit_log_entries (instance_id, id, payload, created_at) values
  (null, '10000000-0000-4000-8000-000000000001', '{"action":"login","actor_id":"00000000-0000-0000-0000-0000000000a1"}', '2001-01-01T00:00:00Z'),
  (null, '10000000-0000-4000-8000-000000000002', '{"action":"login","actor_id":"00000000-0000-0000-0000-0000000000a1"}', '2001-01-01T00:00:00Z'),
  (null, '10000000-0000-4000-8000-000000000003', '{"action":"logout","actor_id":"00000000-0000-0000-0000-0000000000a1"}', '2001-01-01T00:00:00Z');
select is(ops.copy_auth_events(2), 2, 'first run copies the first 2 of 3 rows sharing one created_at');
select is((select value from ops.config where key = 'auth_events_last_id'), '10000000-0000-4000-8000-000000000002', 'auth_events_last_id advanced inside the shared timestamp');
select is(ops.copy_auth_events(2), 1, 'second run copies the remaining row (no stall)');
select is(ops.copy_auth_events(2), 0, 'third run copies nothing new');
select is((select count(*)::int from audit.auth_events where source_id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003')), 3, 'each source row copied exactly once');
update ops.config set value = '2000-01-01T00:00:00Z' where key = 'auth_events_last_at';
update ops.config set value = '00000000-0000-0000-0000-000000000000' where key = 'auth_events_last_id';
select is(ops.copy_auth_events(), 0, 'a rewound watermark re-reads but inserts no duplicate');
select is((select count(*)::int from audit.auth_events where payload ? 'actor_id' or payload ? 'ip_address'), 0, 'copied payload keeps only action and log_type');

-- ===== watchdog lock rules (detection on) =====
update ops.config set value = 'login_failed_test' where key = 'auth_failure_actions';
update ops.config set value = 'true' where key = 'auth_lock_enabled';
update core.staff set active = true where user_id = '00000000-0000-0000-0000-0000000000a5';
insert into audit.auth_events (at, user_id, kind, ok, ip_hash, source)
  select now() - interval '1 minute', '00000000-0000-0000-0000-0000000000a1', 'login_failed_test', false, case when g % 2 = 0 then '\x01'::bytea else '\x02'::bytea end, 'gotrue'
  from generate_series(1, 10) g;
insert into audit.auth_events (at, user_id, kind, ok, ip_hash, source)
  select now() - interval '1 minute', '00000000-0000-0000-0000-0000000000a5', 'login_failed_test', false, case when g % 2 = 0 then '\x01'::bytea else '\x02'::bytea end, 'gotrue'
  from generate_series(1, 10) g;
insert into audit.auth_events (at, user_id, kind, ok, ip_hash, source)
  select now() - interval '1 minute', '00000000-0000-0000-0000-0000000000a3', 'login_failed_test', false, '\x03'::bytea, 'gotrue'
  from generate_series(1, 10) g;
select is((ops.watchdog()) ->> 'locked', '1', 'watchdog locks exactly one account');
select ok((select locked_until > now() from core.staff where user_id = '00000000-0000-0000-0000-0000000000a1'), 'agent failing from 2 addresses is locked');
select ok((select locked_until is null from core.staff where user_id = '00000000-0000-0000-0000-0000000000a5'), 'an admin is never auto-locked');
select ok((select locked_until is null from core.staff where user_id = '00000000-0000-0000-0000-0000000000a3'), 'a single-address burst does not lock');
select ok(exists (select 1 from ops.alerts where kind = 'staff_failures' and dedupe_key = 'staff_failures:00000000-0000-0000-0000-0000000000a5'), 'admin burst raises staff_failures');
select ok(exists (select 1 from ops.alerts where kind = 'staff_locked'), 'lock raises staff_locked');
select ok(exists (select 1 from ops.alerts where kind = 'auth_failure_burst' and severity = 'critical'), '30 failures raise a critical burst alert');

select * from finish();
rollback;
