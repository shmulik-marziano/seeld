-- PROPOSED, NOT APPLIED, needs owner approval. pgTAP test for 08_dashboard_tables.sql and 09 admin operations.
-- Role matrix:  client: nothing | agent: own rows (visibility_mode) | manager: both tables + queue health | super_admin: operations
-- Run only on a branch/preview database after 06..09 are applied. Fixed fake ids below, nothing real.
begin;
select plan(42);

-- Fixtures (as the table owner). A1/A2 agents, M manager, S super admin, C client (no role at all).
insert into auth.users (id, aud, role) values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated'),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated'),
  ('55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated');
insert into public.platform_user_roles (user_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'agent'),
  ('22222222-2222-4222-8222-222222222222', 'agent'),
  ('33333333-3333-4333-8333-333333333333', 'manager'),
  ('44444444-4444-4444-8444-444444444444', 'super_admin');
insert into public.identity_links (internal_customer_id) values
  ('aaaaaaa1-0000-4000-8000-000000000001'), ('aaaaaaa1-0000-4000-8000-000000000002'), ('aaaaaaa1-0000-4000-8000-000000000003');
insert into public.agent_workbench (customer_key, assigned_agent_id, assigned_at) values
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', now()),
  ('aaaaaaa1-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', now()),
  ('aaaaaaa1-0000-4000-8000-000000000003', null, null);
-- FIX (review 08-5): agents and rows now carry an agency; an agent WITHOUT agency must never match rows with a null agency.
insert into public.agencies (id, name) values ('acacacac-0000-4000-8000-000000000001', 'Agency A'), ('acacacac-0000-4000-8000-000000000002', 'Agency B');
update public.profiles set agency_id = 'acacacac-0000-4000-8000-000000000001' where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
update public.agent_workbench set agency_id = 'acacacac-0000-4000-8000-000000000001';
update public.platform_user_roles set agency_id = 'acacacac-0000-4000-8000-000000000001' where role = 'manager';   -- FIX: managers are agency-scoped
-- The workbench insert trigger already created the two agent metric rows; add the system row.
insert into public.management_metrics (metric_date, scope) values (current_date, 'system') on conflict (metric_date) where scope = 'system' do nothing;
select public.metrics_fold();   -- FIX: bump now writes an append-only buffer; fold it into the agent rows
update public.platform_settings set value = 'own_only' where key = 'visibility_mode';

-- 1. Structure: no client privilege, no policy, RLS on, for every platform table.
select is((select count(*) from (values ('agent_workbench'),('management_metrics'),('identity_links'),('assignment_rules'),('platform_settings'),('alert_recipients'),
      ('event_log'),('queue_destinations'),('field_values'),('questionnaire_drafts'),('ops_alerts'),('platform_user_roles'),('customer_queue_state'),('idempotency_keys')) t(tbl)
    cross join (values ('anon'),('authenticated')) r(rol) cross join (values ('select'),('insert'),('update'),('delete')) p(priv)
    where has_table_privilege(rol, 'public.' || tbl, priv)), 0::bigint, 'anon and authenticated hold no privilege on any platform table');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename in ('agent_workbench','management_metrics','identity_links','assignment_rules','platform_settings',
      'alert_recipients','event_log','queue_destinations','field_values','questionnaire_drafts','ops_alerts','platform_user_roles')), 0::bigint, 'no client-role policy exists');
select is((select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('agent_workbench','management_metrics','identity_links','assignment_rules','platform_settings','alert_recipients','event_log','queue_destinations','field_values','questionnaire_drafts','ops_alerts')
      and not c.relrowsecurity), 0::bigint, 'row level security enabled everywhere');

-- 2. CLIENT: nothing.
do $$ begin perform set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true); end $$;
set local role authenticated;
select throws_ok($$select * from public.agent_workbench$$, '42501', null, 'client cannot select agent_workbench');
select throws_ok($$select * from public.management_metrics$$, '42501', null, 'client cannot select management_metrics');
select throws_ok($$select * from public.get_agent_workbench()$$, '42501', null, 'client RPC get_agent_workbench refused');
select throws_ok($$select * from public.get_management_metrics()$$, '42501', null, 'client RPC get_management_metrics refused');
select throws_ok($$select public.get_queue_health()$$, '42501', null, 'client cannot read queue health');
select throws_ok($$select public.admin_set_setting('visibility_mode', 'all_read_only')$$, '42501', null, 'client cannot change settings');
select throws_ok($$select * from public.identity_links$$, '42501', null, 'client cannot read identity_links');
reset role;
set local role anon;
select throws_ok($$select * from public.get_agent_workbench()$$, '42501', null, 'anon cannot execute the RPC');
select throws_ok($$select * from public.agent_workbench$$, '42501', null, 'anon cannot select agent_workbench');
reset role;

-- 3. AGENT A1, visibility_mode own_only.
do $$ begin perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true); end $$;
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 1::bigint, 'agent sees exactly one row');
select is((select customer_key from public.get_agent_workbench()), 'aaaaaaa1-0000-4000-8000-000000000001'::uuid, 'and it is their own');
select is((select count(*) from public.get_agent_workbench() where assigned_agent_id = '22222222-2222-4222-8222-222222222222'), 0::bigint, 'another agent''s rows are invisible in own_only');
select is((select count(*) from public.get_management_metrics()), 1::bigint, 'agent sees only their own metrics row');
select is((select count(*) from public.get_management_metrics() where scope = 'system'), 0::bigint, 'agent never sees the system row');
select throws_ok($$select public.get_queue_health()$$, '42501', null, 'agent cannot read queue health');
select throws_ok($$select public.admin_set_setting('visibility_mode', 'all_read_only')$$, '42501', null, 'agent cannot change settings');
select throws_ok($$select public.assign_lead_manual('aaaaaaa1-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'x')$$, '42501', null, 'agent cannot override assignment');
reset role;

-- visibility_mode is data: the owner can widen it.
update public.platform_settings set value = 'shared_pool_plus_own' where key = 'visibility_mode';
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 2::bigint, 'shared_pool_plus_own: own plus the unassigned pool');
reset role;
update public.platform_settings set value = 'all_read_only' where key = 'visibility_mode';
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 3::bigint, 'all_read_only: everything in the agency, read only');
reset role;
update public.platform_settings set value = 'own_only' where key = 'visibility_mode';

-- 4. MANAGER: both tables fully, queue health, normal operational actions, no system operations.
do $$ begin perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true); end $$;
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 3::bigint, 'manager reads the whole workbench');
select is((select count(*) from public.get_management_metrics()), 2::bigint, 'manager reads the agent metric rows of their own agency');
select is((select count(*) from public.get_management_metrics() where scope = 'system'), 0::bigint, 'manager never reads the cross-agency system row');
select lives_ok($$select public.get_queue_health()$$, 'manager reads queue health');
select throws_ok($$select public.admin_set_setting('visibility_mode', 'all_read_only')$$, '42501', null, 'manager cannot change system settings');
select throws_ok($$select public.admin_purge_dlq('surense', 0)$$, '42501', null, 'manager cannot purge dead letters');
select lives_ok($$select public.assign_lead_manual('aaaaaaa1-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'balance load')$$, 'manager can override an assignment');
reset role;
select is((select count(*) from public.audit_log where action = 'assignment.manual_override'), 1::bigint, 'manual override is audited');

-- 5. SUPER ADMIN: operations need fresh TOTP step-up.
do $$ begin perform set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","aal":"aal1"}', true); end $$;
set local role authenticated;
select throws_ok($$select public.admin_set_setting('visibility_mode', 'shared_pool_plus_own')$$, '42501', 'stepup_required', 'no aal2: refused');
do $$ begin perform set_config('request.jwt.claims', jsonb_build_object('sub','44444444-4444-4444-8444-444444444444','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', (extract(epoch from now()) - 7200)::bigint)))::text, true); end $$;
select throws_ok($$select public.admin_set_setting('visibility_mode', 'shared_pool_plus_own')$$, '42501', 'stepup_expired', 'stale TOTP: refused');
do $$ begin perform set_config('request.jwt.claims', jsonb_build_object('sub','44444444-4444-4444-8444-444444444444','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
select lives_ok($$select public.admin_set_setting('visibility_mode', 'shared_pool_plus_own')$$, 'fresh TOTP: super admin changes visibility_mode');
select throws_ok($$select public.admin_set_setting('visibility_mode', 'everyone')$$, 'P0001', 'bad_visibility_mode', 'invalid value refused');
select lives_ok($$select public.admin_purge_dlq('surense', 0)$$, 'super admin purges dead letters (archive, not delete)');
select lives_ok($$select public.admin_upsert_alert_recipient(null, 'label', 'email', 'someone@example.invalid', 'critical', true)$$, 'super admin edits alert recipients');
select is((select count(*) from public.get_agent_workbench()), 3::bigint, 'super admin reads the whole workbench');
select is((select count(*) from public.get_management_metrics()), 3::bigint, 'super admin reads all metrics incl. the system row');
reset role;

-- 6. Audit trail: who, what, when, before/after, and never the contact address.
select is((select meta -> 'before' ->> 'value' from public.audit_log where action = 'setting.changed'), 'own_only', 'audit keeps the before value');
select is((select meta -> 'after' ->> 'value' from public.audit_log where action = 'setting.changed'), 'shared_pool_plus_own', 'audit keeps the after value');
select is((select count(*) from public.audit_log where meta::text like '%example.invalid%'), 0::bigint, 'alert recipient address never reaches the audit log');
select ok((select actor_id = '44444444-4444-4444-8444-444444444444'::uuid and at is not null from public.audit_log where action = 'setting.changed'), 'audit records who and when');

select * from finish();
rollback;
