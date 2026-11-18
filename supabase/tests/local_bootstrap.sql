-- Only for replaying migrations on a bare supabase/postgres container (no GoTrue running).
-- The real Supabase stack (CLI `supabase start`, hosted) already has these; this is idempotent and harmless there.
-- Run as supabase_admin.
create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;
grant execute on function auth.jwt() to anon, authenticated, service_role, postgres;
-- the bare image ships the legacy auth.uid() (reads request.jwt.claim.sub only); GoTrue's current one reads the claims JSON
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
create extension if not exists pgtap with schema extensions;
