-- 00: policy lint. Every boundary of the foundation as a failing test. Catalog-based (pg_class / pg_proc / aclexplode),
-- never information_schema (it hides grants whose grantor is not the current role, e.g. supabase_admin).
-- Runs as postgres (replay-local.sh and `supabase test db`). Descriptions avoid the word e-r-r-o-r.
begin;
select no_plan();

select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')), 0, 'public holds no tables or views');

-- content_dump_select policies exist only in the no-BYPASSRLS fallback of 091500 and are checked separately below
select set_eq(
  $$ select schemaname || '.' || tablename || ':' || policyname from pg_policies
      where schemaname in ('api', 'staff', 'content', 'crm', 'core', 'ops', 'audit', 'private')
        and (qual = 'true' or with_check = 'true')
        and not (policyname = 'content_dump_select' and roles = '{content_dump}') $$,
  $$ values ('content.cma_sync_log:sync_log_select_anon'), ('content.cma_sync_log:sync_log_select_auth'),
            ('core.invitations:invitations_select_auth_admin'), ('audit.auth_events:auth_events_insert_auth_admin') $$,
  'using(true)/with check(true) allowlist');

select set_eq(
  $$ select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('api', 'staff', 'private', 'ops', 'audit', 'content', 'crm', 'core')
        and has_function_privilege('anon', p.oid, 'execute') $$,
  $$ values ('api.health') $$,
  'anon executes exactly api.health');

select set_eq(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'api' and has_function_privilege('service_role', p.oid, 'execute')
        and not has_function_privilege('authenticated', p.oid, 'execute') and not has_function_privilege('anon', p.oid, 'execute') $$,
  $$ values ('submit_lead'), ('lead_replay'), ('intake_note_reject'), ('outbox_claim'), ('outbox_complete'), ('job_finish'),
            ('job_continue'), ('cma_upsert_batch'), ('cma_finish_sync'), ('chat_session_touch'), ('chat_append'),
            ('invitation_create'), ('invitation_resend'), ('staff_provision'),
            ('surense_gate'), ('surense_event_ingest'), ('surense_job_enqueue'), ('surense_job_claim'), ('surense_job_complete'),
            ('surense_sync_state_get'), ('surense_sync_state_set'), ('surense_customers_upsert'), ('surense_customer_mark_deleted'),
            ('surense_documents_upsert'), ('surense_document_mark_deleted'), ('surense_file_record'), ('surense_portfolio_store'),
            ('surense_audit'),
            ('poa_session_start'), ('poa_session_get'), ('poa_engine_ref_set'), ('poa_preview_set'), ('poa_consent_record'),
            ('poa_session_fail'), ('poa_session_complete'), ('poa_document_link'), ('poa_document_stored'), ('poa_document_from_url'), ('poa_doc_get'), ('poa_doc_claim'), ('poa_config'),
            ('poa_ship_enqueue'), ('poa_ship_get'), ('poa_ship_set'), ('cron_secret_ok'),
            ('form_config'), ('form_session_start'), ('form_session_get'), ('form_step_save'), ('form_submit'), ('form_session_fail'),
            ('form_document_add'), ('form_document_stored') $$,
  'service-only RPCs in api (53)');

-- the documented advisor exceptions (lints 0028/0029): exactly these SECURITY DEFINER functions are callable by API roles
select set_eq(
  $$ select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('api', 'staff') and p.prosecdef and has_function_privilege('anon', p.oid, 'execute') $$,
  $$ values ('api.health') $$,
  'lint 0028 exception list (anon)');
select set_eq(
  $$ select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('api', 'staff') and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute') $$,
  $$ values ('api.health'), ('api.me'), ('staff.leads_list'), ('staff.lead_get'), ('staff.lead_set_status'), ('staff.lead_assign'),
            ('staff.lead_note_add'), ('staff.lead_soft_delete'), ('staff.admin_assert_fresh'), ('staff.admin_config_set'),
            ('staff.admin_staff_disable'), ('staff.admin_staff_unlock'), ('staff.ops_health'),
            ('staff.admin_staff_enable'), ('staff.admin_alert_resolve'),
            ('staff.poa_session_list'), ('staff.poa_session_verify'), ('staff.client_doc_get'), ('staff.poa_ship_retry'),
            ('staff.form_submission_list'), ('staff.form_submission_get'), ('staff.form_submission_set_status') $$,
  'lint 0029 exception list (authenticated, 22 entries)');

select is_empty($$ select jobname from cron.job where command ~* 'http|secret|bearer|apikey' $$, 'cron commands carry no URL or secret');
select set_eq($$ select jobname from cron.job $$,
  $$ values ('ops-cleanup'), ('cma-freshness-monthly'), ('notify-worker-tick'), ('cma-sync-weekly'), ('ops-watchdog'), ('surense-worker-tick') $$,
  'exactly six cron jobs');

select is_empty($$ select schemaname || '.' || tablename || ':' || policyname from pg_policies
                    where schemaname in ('crm', 'core') and 'anon' = any (roles) and qual is distinct from 'false' $$,
  'no permissive anon policy on PII schemas');

select is_empty(
  $$ select r.rolname || ' ' || p.priv || ' ' || n.nspname || '.' || c.relname
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       cross join (values ('anon'), ('authenticated')) r(rolname)
       cross join (values ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(priv)
      where n.nspname in ('api', 'staff', 'content', 'crm', 'core', 'ops', 'audit', 'private')
        and c.relkind in ('r', 'v', 'm', 'p') and has_table_privilege(r.rolname, c.oid, p.priv) $$,
  'no DELETE/TRUNCATE/REFERENCES/TRIGGER for API roles');

select is_empty(
  $$ select n.nspname || '.' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname in ('ops', 'audit', 'pgmq', 'vault', 'crm') and c.relkind in ('r', 'v', 'm', 'p')
        and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
             or has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')) $$,
  'no API-role table privileges in ops/audit/pgmq/vault/crm (PII is read through logging RPCs only)');

select is_empty(
  $$ select d.defaclobjtype::text || ' ' || a.grantee::regrole::text from pg_default_acl d, aclexplode(d.defaclacl) a
      where d.defaclnamespace = 0 and a.grantee in ('anon'::regrole, 'authenticated'::regrole) and d.defaclobjtype in ('r', 'S') $$,
  'no global default table/sequence grants to API roles');
select is((select count(*)::int from pg_default_acl d, aclexplode(d.defaclacl) a
            where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace
              and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)), 0,
  'no postgres default grants to API roles in public');
select is_empty($$ select a.privilege_type from pg_namespace n, aclexplode(n.nspacl) a
                    where n.nspname = 'public' and a.grantee in ('anon'::regrole, 'authenticated'::regrole) $$,
  'no explicit grants to API roles on schema public');

select is_empty($$ select n.nspname || '.' || c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname in ('api', 'staff') and c.relkind = 'v'
                      and not coalesce('security_invoker=true' = any (c.reloptions), false) $$,
  'every view in api and staff is security_invoker');
select ok(not has_schema_privilege('anon', 'staff', 'usage'), 'anon has no usage on staff');
select ok(not has_schema_privilege('authenticated', 'crm', 'usage'), 'authenticated has no usage on crm');
select is((select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime'), 0, 'realtime publication empty');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname in ('api', 'staff', 'private', 'ops', 'audit', 'content', 'crm', 'core') and p.prosecdef
              and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')), 0,
  'every security definer pins search_path');

-- content_dump (091500): select-only on content, never an API role, never able to log in until the owner says so
select is((select rolcanlogin from pg_roles where rolname = 'content_dump'), false, 'content_dump has no LOGIN after the migration');
select ok((select not rolsuper and not rolcreaterole and not rolcreatedb and not rolreplication from pg_roles where rolname = 'content_dump'),
  'content_dump holds no admin attribute');
-- Guard for later migrations: 091500 creates the fallback content_dump_select policies only for content tables that exist
-- when it runs. In an environment without BYPASSRLS, a content table added later needs its own
-- `create policy content_dump_select ... for select to content_dump using (true)`, or the dump would silently come back
-- empty for it. This assertion fails CI in exactly that case (hosted seeld-site has BYPASSRLS, so it passes there).
select ok((select rolbypassrls from pg_roles where rolname = 'content_dump')
          or not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                          where n.nspname = 'content' and c.relkind in ('r', 'p') and c.relrowsecurity
                            and not exists (select 1 from pg_policies p where p.schemaname = 'content' and p.tablename = c.relname
                                              and p.policyname = 'content_dump_select' and p.cmd = 'SELECT')),
  'content_dump reads every content table (BYPASSRLS, or the select-only policy fallback)');
select is_empty($$ select n.nspname || ':' || a.privilege_type from pg_namespace n, aclexplode(n.nspacl) a
                    where a.grantee = 'content_dump'::regrole and n.nspname <> 'content' $$,
  'content_dump has no explicit schema grant outside content');
select set_eq($$ select a.privilege_type from pg_namespace n, aclexplode(n.nspacl) a
                 where a.grantee = 'content_dump'::regrole and n.nspname = 'content' $$,
  $$ values ('USAGE') $$, 'content_dump has only USAGE on content');
select is_empty($$ select n.nspname || '.' || c.relname || ':' || a.privilege_type
                     from pg_class c join pg_namespace n on n.oid = c.relnamespace, aclexplode(c.relacl) a
                    where a.grantee = 'content_dump'::regrole and (n.nspname <> 'content' or a.privilege_type <> 'SELECT') $$,
  'content_dump holds only SELECT, and only on content relations');
select is_empty($$ select m.roleid::regrole::text from pg_auth_members m where m.member = 'content_dump'::regrole $$,
  'content_dump is a member of no role');
select is_empty($$ select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace, aclexplode(p.proacl) a
                    where a.grantee = 'content_dump'::regrole $$,
  'content_dump has no explicit function grant');

-- probe inside the rolled-back transaction: a table born in public gets RLS and no API access
create table public.zz_probe (x int);
select ok((select relrowsecurity from pg_class where oid = 'public.zz_probe'::regclass), 'tables born in public get RLS');
select ok(not has_table_privilege('anon', 'public.zz_probe', 'select'), 'tables born in public are not readable by anon');
select ok(not has_table_privilege('authenticated', 'public.zz_probe', 'select'), 'tables born in public are not readable by authenticated');

select * from finish();
rollback;
