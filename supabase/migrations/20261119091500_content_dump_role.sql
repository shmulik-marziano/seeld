-- V2-16 (ADR-44, round-2 review): read-only role for the weekly content dump (content-dump.yml, Environment 'backup').
-- Its own migration, so a role-attribute failure can never roll back the 091400 security fixes.
-- NOLOGIN here; the owner sets LOGIN + password once in SQL Editor (owner step 27; prefer a SCRAM verifier).
-- Never an API role: no usage on api/staff/crm/core/ops/audit/private, select on content only.
-- BYPASSRLS is attempted first (pg_dump then needs no --enable-row-security). If the migrating role may not grant it,
-- the role is created without it and gets one select-only policy per RLS table in content instead (documented fallback:
-- those policies are on the using(true) allowlist of 00_policy_lint, and the dump must run with --enable-row-security).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'content_dump') then
    begin
      create role content_dump nologin noinherit bypassrls;
    exception when insufficient_privilege then
      create role content_dump nologin noinherit;
    end;
  end if;
end $$;

grant usage on schema content to content_dump;
grant select on all tables in schema content to content_dump;
grant select on all sequences in schema content to content_dump;
alter default privileges for role postgres in schema content grant select on tables to content_dump;

do $$
declare t record;
begin
  if not (select rolbypassrls from pg_roles where rolname = 'content_dump') then
    for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'content' and c.relkind in ('r', 'p') and c.relrowsecurity
    loop
      if not exists (select 1 from pg_policies where schemaname = 'content' and tablename = t.relname
                                                 and policyname = 'content_dump_select') then
        execute format('create policy content_dump_select on content.%I for select to content_dump using (true)', t.relname);
      end if;
    end loop;
  end if;
end $$;
