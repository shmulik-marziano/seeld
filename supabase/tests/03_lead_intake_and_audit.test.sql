-- api.submit_lead contract, rate limiting, idempotency, audit trail.
begin;
select no_plan();

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000b1');
insert into core.staff (user_id, role, display_name) values ('00000000-0000-0000-0000-0000000000b1', 'agent', 'Agent B');

set local role anon;
set local request.headers = '{"x-forwarded-for":"203.0.113.7, 10.0.0.1"}';

select is(
  (select (api.submit_lead('insurance', 'ישראל ישראלי', '050-123 4567', 'Test@Example.com', null, '{"type":"vehicle"}', true, 'v1', '/insurances', '{"utm_source":"g"}', null)) ->> 'ok'),
  'true', 'valid lead accepted');

select is(
  (select (api.submit_lead('insurance', 'ישראל ישראלי', '+972501234567', null, null, '{}', true)) ->> 'duplicate'),
  'true', 'same person within 10 minutes returns the same lead (idempotent)');

select is(
  (select (api.submit_lead('contact', 'Bot Name', '0501111111', null, null, '{}', true, 'v1', null, '{}', 'i am a bot')) ->> 'id'),
  null, 'honeypot returns ok with no id');

select throws_ok($$select api.submit_lead('insurance', 'A', '0501234567', null, null, '{}', true)$$, 'PT400', 'invalid_input:full_name', 'short name rejected');
select throws_ok($$select api.submit_lead('insurance', 'Valid Name', '12345', null, null, '{}', true)$$, 'PT400', 'invalid_input:phone', 'bad phone rejected');
select throws_ok($$select api.submit_lead('insurance', 'Valid Name', null, 'not-an-email', null, '{}', true)$$, 'PT400', 'invalid_input:email', 'bad email rejected');
select throws_ok($$select api.submit_lead('insurance', 'Valid Name', '0501234568', null, null, '{}', false)$$, 'PT400', 'invalid_input:consent', 'missing consent rejected');
select throws_ok($$select api.submit_lead('hack', 'Valid Name', '0501234568', null, null, '{}', true)$$, 'PT400', 'invalid_input:kind', 'unknown kind rejected');
select throws_ok($$select api.submit_lead('insurance', 'Valid Name', null, null, null, '{}', true)$$, 'PT400', 'invalid_input:contact', 'no contact method rejected');
select throws_ok($$select api.submit_lead('insurance', 'Valid Name', '0501234568', null, null, '[1]', true)$$, 'PT400', 'invalid_input:payload', 'array payload rejected');
select throws_ok(format($q$select api.submit_lead('insurance', 'Valid Name', '0501234568', null, null, %L::jsonb, true)$q$, jsonb_build_object('x', repeat('a', 17000))),
  'PT400', 'invalid_input:payload', 'oversized payload rejected');

-- direct writes stay impossible
select throws_ok($$insert into crm.leads (kind, full_name, phone, consent_at, consent_version) values ('contact', 'Direct', '0501234567', now(), 'v1')$$, '42501', null, 'anon cannot insert into crm.leads');
select throws_ok($$insert into api.leads (kind, full_name, phone, consent_at, consent_version) values ('contact', 'Direct', '0501234567', now(), 'v1')$$, '42501', null, 'anon cannot insert into api.leads');

-- rate limit: 8 per IP per 10 minutes (1 valid + 1 duplicate + honeypot... counted: every call)
select lives_ok($$select api.submit_lead('contact', 'Rate Test', '052000000' || g, null, null, '{}', true) from generate_series(0, 0) g$$, 'call within limit works');
reset role;
-- calls so far from this IP: valid, duplicate, honeypot, 10 rejected (rolled back by throws_ok savepoints? no: counted only if committed) -> inspect
select ok((select coalesce(sum(hits), 0) from ops.rate_limits where bucket = 'lead_ip') >= 3, 'rate limit counters are persisted for successful calls');

-- burn the remaining allowance, then expect PT429
do $$
begin
  for i in 1..10 loop
    perform private.check_rate_limit('lead_ip', '203.0.113.7', 8, interval '10 minutes');
  end loop;
end $$;
set local role anon;
set local request.headers = '{"x-forwarded-for":"203.0.113.7"}';
select throws_ok($$select api.submit_lead('contact', 'Too Many', '0523333333', null, null, '{}', true)$$, 'PT429', 'rate_limited', 'rate limit returns PT429');
set local request.headers = '{"x-forwarded-for":"198.51.100.9"}';
select lives_ok($$select api.submit_lead('contact', 'Other Ip', '0524444444', null, null, '{}', true)$$, 'a different address is not limited');
reset role;

-- what was stored
select is((select count(*)::int from crm.leads where kind = 'insurance'), 1, 'exactly one insurance lead stored (dedupe worked)');
select is((select phone from crm.leads where kind = 'insurance'), '0501234567', 'phone normalized to 05XXXXXXXX');
select is((select email from crm.leads where kind = 'insurance'), 'test@example.com', 'email normalized to lower case');
select ok((select ip_hash is not null and octet_length(ip_hash) = 32 from crm.leads where kind = 'insurance'), 'ip stored only as keyed hash');
select is((select count(*)::int from ops.outbox where topic = 'lead.created'), (select count(*)::int from crm.leads where created_at > now() - interval '1 minute'), 'one outbox event per stored lead');

-- audit trail: values omitted for PII
select ok((select count(*) from audit.log where table_name = 'crm.leads' and op = 'INSERT') >= 1, 'lead inserts are audited');
select is((select count(*)::int from audit.log where table_name = 'crm.leads' and (old_data is not null or new_data is not null)), 0, 'audit of crm.leads stores no PII values');

-- staff status change is audited with column names
insert into crm.leads (kind, full_name, phone, consent_at, consent_version) values ('contact', 'Audit Me', '0505555555', now(), 'v1');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","aal":"aal2"}';
select lives_ok($$update api.leads set status = 'qualified' where full_name = 'Audit Me'$$, 'staff updates status');
reset role;
select is((select changed_cols from audit.log where table_name = 'crm.leads' and op = 'UPDATE' order by id desc limit 1), array['status'], 'audit records changed column names');
select is((select actor from audit.log where table_name = 'crm.leads' and op = 'UPDATE' order by id desc limit 1), '00000000-0000-0000-0000-0000000000b1'::uuid, 'audit records the actor');

-- audit is append-only
select throws_ok($$delete from audit.log$$, '42501', 'audit.log is append-only', 'audit delete blocked');
select throws_ok($$update audit.log set actor = null$$, '42501', 'audit.log is append-only', 'audit update blocked');

-- retention job works and only purges what it should
select lives_ok($$select ops.cleanup()$$, 'ops.cleanup runs');
select ok((select count(*) from audit.log where table_name = 'crm.leads') >= 2, 'recent audit survives cleanup');
select is((select (ops.cleanup() ->> 'audit')::int), 0, 'cleanup purges no recent audit rows');

select * from finish();
rollback;
