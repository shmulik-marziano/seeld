-- V2-01 (ADR-39): seal schema public. The live pg_default_acl on seeld-site still grants arwdDxtm to anon/authenticated in public.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
revoke all on schema public from anon, authenticated;
-- supabase_admin-grantor rows in pg_default_acl are platform-managed and stay. USAGE held by PUBLIC on public is not revoked here.

-- RLS safety net now also covers public and staff
create or replace function private.ensure_rls()
returns event_trigger language plpgsql security definer set search_path = pg_catalog as $$
declare cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name in ('core', 'crm', 'content', 'ops', 'audit', 'api', 'staff', 'public') then
      execute format('alter table if exists %s enable row level security', cmd.object_identity);
    end if;
  end loop;
end;
$$;
revoke all on function private.ensure_rls() from public, anon, authenticated;
