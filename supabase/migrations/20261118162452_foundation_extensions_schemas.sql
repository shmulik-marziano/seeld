-- FOUNDATION 01: extensions, schemas, default privileges, RLS safety net.
-- Principle: nothing is reachable by anon/authenticated unless a later migration grants it explicitly.
-- Exposed API schema = `api` only (set in dashboard: Settings > API > Exposed schemas = api).
-- Data lives in unexposed schemas: core (identity), crm (private business data), content (site-public data),
-- ops (queues, limits, config), audit (change log), private (helper functions).

-- extensions never live in public
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists pg_cron;   -- hosted: installs into pg_catalog (platform managed)

create schema if not exists private;
create schema if not exists core;
create schema if not exists crm;
create schema if not exists content;
create schema if not exists ops;
create schema if not exists audit;
create schema if not exists api;

comment on schema private is 'Helper/security-definer functions. NEVER add to exposed schemas.';
comment on schema core    is 'Identity and roles: staff, client_accounts. Private.';
comment on schema crm     is 'Private business data: leads and later clients, questionnaires, reports. Private.';
comment on schema content is 'Site-public content: blog, travel, tracks, fund returns. Read by anon through api views only.';
comment on schema ops     is 'Operational plumbing: rate limits, outbox, config. Private.';
comment on schema audit   is 'Append-only change log. Private.';
comment on schema api     is 'The ONLY schema exposed to PostgREST: views (security_invoker) and RPC functions.';

-- Lock the door first: nobody gets implicit access to anything.
revoke all on schema private, core, crm, content, ops, audit, api from public;
revoke all on schema private, core, crm, content, ops, audit, api from anon, authenticated;

-- usage only where a role legitimately evaluates objects in that schema
grant usage on schema api     to anon, authenticated, service_role;
grant usage on schema content to anon, authenticated, service_role;   -- invoker views read content tables
grant usage on schema crm     to authenticated, service_role;         -- staff read via invoker views + RLS
grant usage on schema core    to authenticated, service_role;
grant usage on schema private to authenticated, service_role;         -- policies call private.is_staff()
grant usage on schema ops     to service_role;
grant usage on schema audit   to service_role;

-- New functions are not executable by PUBLIC by default (explicit grant per function).
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema core, crm, content, ops, audit, private, api
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema core, crm, content, ops, audit, private, api
  revoke all on sequences from anon, authenticated;

-- Safety net: every table created in a managed schema gets RLS enabled automatically.
create or replace function private.ensure_rls()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name in ('core', 'crm', 'content', 'ops', 'audit', 'api') then
      execute format('alter table if exists %s enable row level security', cmd.object_identity);
    end if;
  end loop;
end;
$$;
revoke all on function private.ensure_rls() from public, anon, authenticated;

drop event trigger if exists foundation_ensure_rls;
create event trigger foundation_ensure_rls on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function private.ensure_rls();
