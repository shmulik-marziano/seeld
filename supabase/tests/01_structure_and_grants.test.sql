-- Structural guarantees that must hold forever (they are the acceptance tests for the old Tokyo defects).
begin;
select no_plan();

-- every table in a managed schema has RLS
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'crm', 'content', 'ops', 'audit') and c.relkind in ('r', 'p') and not c.relrowsecurity),
  0, 'RLS enabled on every table in core/crm/content/ops/audit');

-- API roles never hold TRUNCATE / REFERENCES / TRIGGER anywhere in managed schemas (Tokyo defect 2)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    cross join unnest(array['anon', 'authenticated']) r
    cross join unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER']) p
    where n.nspname in ('api', 'core', 'crm', 'content', 'ops', 'audit', 'private') and c.relkind in ('r', 'v', 'm', 'p')
      and has_table_privilege(r, c.oid, p)),
  0, 'anon/authenticated hold no TRUNCATE/REFERENCES/TRIGGER');

-- anon cannot even see private schemas
select is(
  (select count(*)::int from unnest(array['core', 'crm', 'ops', 'audit', 'private']) s where has_schema_privilege('anon', s, 'USAGE')),
  0, 'anon has no USAGE on core/crm/ops/audit/private');

-- no unconditional policy on private schemas (Tokyo defect 1: USING(true))
select is(
  (select count(*)::int from pg_policies
    where schemaname in ('core', 'crm', 'ops', 'audit') and (qual = 'true' or with_check = 'true')),
  0, 'no USING(true) policies on private data');

-- every policy names its roles (no accidental PUBLIC)
select is(
  (select count(*)::int from pg_policies
    where schemaname in ('core', 'crm', 'content', 'ops', 'audit') and roles = '{public}'),
  0, 'every policy has an explicit TO role');

-- auth helper calls inside policies are wrapped in (select ...) (initplan caching)
select is(
  (select count(*)::int from pg_policies
    where schemaname in ('core', 'crm', 'content', 'ops', 'audit')
      and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'private\.(is_staff|is_manager|has_role)\('
      and (coalesce(qual, '') || coalesce(with_check, '')) !~ 'SELECT private\.(is_staff|is_manager|has_role)\('),
  0, 'policies wrap private.* helpers in (select ...)');

-- all security definer functions pin search_path
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('api', 'core', 'crm', 'content', 'ops', 'audit', 'private') and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')),
  0, 'every SECURITY DEFINER function pins search_path');

-- anon may execute exactly one function: api.submit_lead (documented exception)
select is(
  (select string_agg(n.nspname || '.' || p.proname, ',' order by p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('api', 'core', 'crm', 'content', 'ops', 'audit', 'private')
      and has_function_privilege('anon', p.oid, 'EXECUTE')),
  'api.submit_lead', 'anon can execute only api.submit_lead');

-- the public API exposes no matview and no base table
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'api' and c.relkind in ('r', 'm', 'p')),
  0, 'api schema holds only views and functions');

-- every view in api is security_invoker
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'api' and c.relkind = 'v'
      and not coalesce('security_invoker=true' = any (c.reloptions), false)),
  0, 'every api view is security_invoker');

-- public schema stays empty
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')),
  0, 'public schema holds no tables or views');

-- Tokyo defect 5: sync log accepts status stale
select lives_ok(
  $$insert into content.cma_sync_log (source, status) values ('test-source', 'stale')$$,
  'cma_sync_log accepts stale');

select * from finish();
rollback;
