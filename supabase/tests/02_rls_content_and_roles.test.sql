-- 02: anon / authenticated / staff(aal1) / staff(aal2) / manager against public content and private data.
-- v2: leads are read only through staff.leads_list (api.leads was dropped in 090300); every identity row is agency-scoped.
begin;
select no_plan();

-- fixtures (as postgres)
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'),   -- agent, agency A
  ('00000000-0000-0000-0000-0000000000a2'),   -- manager, agency A
  ('00000000-0000-0000-0000-0000000000a3'),   -- plain authenticated (client or nobody)
  ('00000000-0000-0000-0000-0000000000b1');   -- agent, agency B
insert into core.agencies (id, name) values ('5eed0000-0000-4000-8000-0000000000b2', 'Agency B');
insert into core.staff (user_id, role, display_name, agency_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'agent', 'Agent One', (select value::uuid from ops.config where key = 'default_agency_id')),
  ('00000000-0000-0000-0000-0000000000a2', 'manager', 'Manager One', (select value::uuid from ops.config where key = 'default_agency_id')),
  ('00000000-0000-0000-0000-0000000000b1', 'agent', 'Agent Bee', '5eed0000-0000-4000-8000-0000000000b2');

insert into content.blog_posts (slug, title, content, status, published_at) values
  ('pub-1', 'Published', 'x', 'published', now() - interval '1 day'),
  ('draft-1', 'Draft', 'x', 'draft', null),
  ('future-1', 'Future', 'x', 'published', now() + interval '1 day'),
  ('arch-1', 'Archived', 'x', 'archived', now() - interval '9 days');
insert into content.travel_companies (slug, name, active) values ('t-active', 'A', true), ('t-off', 'B', false);
insert into content.investment_tracks (fund_number, name, company, product_type, specialization, is_active)
  values ('F1', 'n', 'c', 'p', 's', true), ('F2', 'n', 'c', 'p', 's', false);
insert into content.cma_funds (fund_id, fund_name, managing_company, source, product_type, report_period, total_assets, monthly_yield)
  select 'FUND' || g, 'קרן ' || g, 'הראל פנסיה', 'gemelnet', 'gemel', p, 1000, 0.5
  from generate_series(1, 3) g, unnest(array[202601, 202602, 202603]) p;
select content.refresh_fund_views();
insert into crm.leads (agency_id, kind, full_name, phone, consent_at, consent_version) values
  ((select value::uuid from ops.config where key = 'default_agency_id'), 'contact', 'Seed Lead', '0501234567', now(), 'v1'),
  ('5eed0000-0000-4000-8000-0000000000b2', 'contact', 'Other Agency Lead', '0501234568', now(), 'v1');

-- ===== anon =====
set local role anon;
select is((select count(*)::int from api.blog_posts), 1, 'anon sees only the published, already-live post');
select is((select count(*)::int from api.travel_companies), 1, 'anon sees only active travel companies');
select is((select count(*)::int from api.investment_tracks), 1, 'anon sees only active tracks');
select is((select count(*)::int from api.cma_board), 3, 'anon reads the board view');
select is((select count(*)::int from api.cma_funds_latest), 3, 'anon reads latest funds view');
select throws_ok($$select count(*) from crm.leads$$, '42501', null, 'anon cannot read crm.leads (no schema usage)');
select throws_ok($$select * from staff.leads_list()$$, '42501', null, 'anon cannot reach staff.leads_list (no usage on staff)');
select ok(to_regclass('api.leads') is null, 'api.leads no longer exists');
select throws_ok($$select count(*) from content.cma_funds$$, '42501', null, 'anon cannot read the raw funds table');
select throws_ok($$select count(*) from core.staff$$, '42501', null, 'anon cannot read staff');
select throws_ok($$select * from audit.log$$, '42501', null, 'anon cannot read audit');
select throws_ok($$insert into api.blog_posts (slug, title, content) values ('x', 'x', 'x')$$, '42501', null, 'anon cannot insert blog posts');
select throws_ok($$update api.blog_posts set title = 'hacked'$$, '42501', null, 'anon cannot update blog posts');
select throws_ok($$delete from api.travel_companies$$, '42501', null, 'anon cannot delete');
select throws_ok($$truncate content.blog_posts$$, '42501', null, 'anon cannot truncate');
select throws_ok($$select ops.cleanup()$$, '42501', null, 'anon cannot run ops.cleanup');
select throws_ok($$select private.is_staff()$$, '42501', null, 'anon cannot call private helpers');
select is((api.health()) ->> 'ok', 'true', 'anon can call api.health');
reset role;

-- ===== authenticated, not staff =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated","aal":"aal1"}';
select is((select count(*)::int from api.blog_posts), 1, 'non-staff user sees only published posts');
select throws_ok($$select * from staff.leads_list()$$, 'PT403', 'forbidden:staff_aal2', 'non-staff user gets PT403 from staff.leads_list');
select throws_ok($$insert into api.blog_posts (slug, title, content) values ('y', 'y', 'y')$$, '42501', null, 'non-staff cannot insert posts (RLS)');
select throws_ok($$select count(*) from audit.log$$, '42501', null, 'authenticated cannot read audit');
select is((select count(*)::int from core.staff), 0, 'non-staff cannot read staff rows');
reset role;

-- ===== staff agent WITHOUT second factor (aal1) =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}';
select throws_ok($$select * from staff.leads_list()$$, 'PT403', 'forbidden:staff_aal2', 'agent at aal1 gets PT403 (MFA required)');
select is((select count(*)::int from api.blog_posts), 1, 'agent at aal1 sees only published posts');
reset role;

-- ===== staff agent at aal2 =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}';
select is((select count(*)::int from staff.leads_list()), 1, 'agent at aal2 sees the own-agency lead only');
select is((select count(*)::int from api.blog_posts), 4, 'agent at aal2 sees all posts incl. drafts');
select lives_ok($$update api.blog_posts set title = 'Draft v2' where slug = 'draft-1'$$, 'agent can edit posts');
select is((staff.lead_set_status((select l.id from staff.leads_list() l limit 1), 'contacted')) ->> 'ok', 'true', 'agent changes lead status through the RPC');
select throws_ok($$update crm.leads set full_name = 'tamper'$$, '42501', null, 'agent cannot rewrite lead identity columns');
select throws_ok($$update crm.leads set consent_at = now() - interval '1 year'$$, '42501', null, 'agent cannot rewrite consent evidence');
select throws_ok($$delete from crm.leads$$, '42501', null, 'agent cannot hard-delete leads');
select throws_ok($$delete from api.blog_posts where slug = 'arch-1'$$, '42501', null, 'agent cannot delete posts');
select lives_ok($$update api.blog_posts set status = 'archived' where slug = 'draft-1'$$, 'agent archives by update');
select is((select count(*)::int from core.staff), 1, 'agent sees only the own staff row');
reset role;

-- ===== manager at aal2 =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated","aal":"aal2"}';
select throws_ok($$delete from api.blog_posts where slug = 'arch-1'$$, '42501', null, 'manager cannot delete posts either (archive only)');
select throws_ok($$delete from api.travel_companies where slug = 't-off'$$, '42501', null, 'manager cannot delete travel companies');
select lives_ok($$update api.travel_companies set active = false where slug = 't-active'$$, 'manager deactivates by update');
select is((select (api.me()) ->> 'staff_role'), 'manager', 'api.me() reports role');
select is((select count(*)::int from core.staff), 2, 'manager sees the staff of the own agency only');
select is((select count(*)::int from core.staff where user_id = '00000000-0000-0000-0000-0000000000b1'), 0, 'agency-B staff is not visible');
reset role;
select is((select count(*)::int from content.blog_posts where slug = 'arch-1'), 1, 'no post was hard-deleted');

-- ===== a deactivated staff member loses access immediately =====
update core.staff set active = false where user_id = '00000000-0000-0000-0000-0000000000a1';
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}';
select throws_ok($$select * from staff.leads_list()$$, 'PT403', 'forbidden:staff_aal2', 'deactivated agent gets PT403 at once');
reset role;

select * from finish();
rollback;
