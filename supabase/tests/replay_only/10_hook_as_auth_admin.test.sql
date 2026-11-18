-- 10 (replay only): the Before User Created hook called AS supabase_auth_admin, the role GoTrue really uses (R3-B2).
-- replay-local.sh runs this directory as supabase_admin (REPLAY_ADMIN_USER), which may switch to supabase_auth_admin.
-- It lives outside supabase/tests/*.test.sql so CI's `supabase test db supabase/tests/*.test.sql` (as postgres) never runs it,
-- and if any runner does pick it up without the membership, the psql \if guard turns it into one skip (no failure).
-- Synthetic e-mails only, inside a rolled-back transaction.
begin;
select no_plan();
select pg_has_role(current_user, 'supabase_auth_admin', 'member') as can_switch \gset
\if :can_switch
insert into core.invitations (email, kind, role, agency_id)
  values ('Mixed.Case@Example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001');
insert into core.invitations (email, kind, agency_id)
  values ('client-r10@example.com', 'client', '5eed0000-0000-4000-8000-000000000001');
select set_config('t.denied0', (select count(*)::text from audit.auth_events where kind = 'user_created_denied' and source = 'hook'), true);

set local role supabase_auth_admin;
select set_config('t.who', current_user::text, true);
select set_config('t.staff', private.hook_before_user_created('{"user":{"email":"mixed.case@example.com"}}'::jsonb)::text, true);
select set_config('t.client', private.hook_before_user_created('{"user":{"email":"client-r10@example.com"}}'::jsonb)::text, true);
select set_config('t.nobody', private.hook_before_user_created('{"user":{"email":"nobody-r10@example.com"}}'::jsonb)::text, true);
do $$
begin
  insert into core.invitations (email, kind, role, agency_id)
    values ('sneaky-r10@example.com', 'staff', 'admin', '5eed0000-0000-4000-8000-000000000001');
  perform set_config('t.write', 'allowed', true);
exception when insufficient_privilege then
  perform set_config('t.write', 'denied', true);
end $$;
do $$
declare v int;
begin
  select count(*) into v from audit.auth_events;
  perform set_config('t.read_events', 'rows:' || v, true);
exception when insufficient_privilege then
  perform set_config('t.read_events', 'denied', true);
end $$;
reset role;

select is(current_setting('t.who'), 'supabase_auth_admin', 'the hook calls below ran as supabase_auth_admin');
select is(current_setting('t.staff')::jsonb, '{}'::jsonb, 'open staff invitation (different case) gives {} for the real hook role');
select is(current_setting('t.client')::jsonb #>> '{error,http_code}', '403', 'open client invitation gives 403 for the real hook role');
select is(current_setting('t.nobody')::jsonb #>> '{error,http_code}', '403', 'no invitation gives 403 for the real hook role');
select is((select count(*)::int from audit.auth_events where kind = 'user_created_denied' and source = 'hook')
          - current_setting('t.denied0')::int, 2, 'both denials were recorded through the hook role''s insert policy');
select is(current_setting('t.write'), 'denied', 'supabase_auth_admin cannot write invitations (42501)');
select ok(current_setting('t.read_events') in ('denied', 'rows:0'), 'supabase_auth_admin sees no auth_events rows (insert only)');
\else
select skip('session role cannot switch to supabase_auth_admin; replay-local.sh runs this file as supabase_admin', 1);
\endif
select * from finish();
rollback;
