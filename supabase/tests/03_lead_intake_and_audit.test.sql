-- 03: lead intake v2 (090500). api.submit_lead(jsonb, text, text) is service_role only; lead-intake calls it after Origin,
-- api.lead_replay and Turnstile. Idempotency, closed payload keys, client ip, kill switch, rate limit, audit without PII.
-- Synthetic test values only (example.com, 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24).
begin;
select no_plan();

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000c1');
insert into core.staff (user_id, role, display_name, agency_id)
values ('00000000-0000-0000-0000-0000000000c1', 'agent', 'Agent C', (select value::uuid from ops.config where key = 'default_agency_id'));

-- the v1 signature is gone and api.leads is gone
select ok(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'api' and p.proname = 'submit_lead' and p.pronargs <> 3), 'only the v2 submit_lead signature exists');
select ok(to_regclass('api.leads') is null, 'api.leads is dropped');

-- anon and authenticated cannot call intake at all
set local role anon;
select throws_ok($$select api.submit_lead('{"kind":"contact"}'::jsonb, 'idem-anon-0001', '192.0.2.10')$$, '42501', null, 'anon cannot call submit_lead');
select throws_ok($$select api.lead_replay('idem-anon-0001', '{}'::jsonb)$$, '42501', null, 'anon cannot call lead_replay');
select throws_ok($$select api.intake_note_reject('origin', '192.0.2.10')$$, '42501', null, 'anon cannot call intake_note_reject');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$select api.submit_lead('{"kind":"contact"}'::jsonb, 'idem-auth-0001', '192.0.2.10')$$, '42501', null, 'authenticated cannot call submit_lead');
reset role;

-- service_role (lead-intake)
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config('request.headers', '{"x-request-id":"req-test-0001"}', true);
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','contact','full_name','ישראל','phone','0501112222','consent',true), 'idem-0000-0001')$$,
  'PT400', 'invalid_input:client_ip', 'service_role without p_client_ip is rejected');
select is((api.submit_lead(jsonb_build_object('kind','insurance','full_name','ישראל ישראלי','phone','050-111 2222','email','Test@Example.com',
            'payload',jsonb_build_object('insurance_type','car'),'consent',true), 'idem-0000-0002', '192.0.2.10')) ->> 'ok', 'true', 'valid lead accepted');
select is((api.lead_replay('idem-0000-0002', jsonb_build_object('kind','insurance','full_name','ישראל ישראלי','phone','050-111 2222','email','Test@Example.com',
            'payload',jsonb_build_object('insurance_type','car'),'consent',true))) ->> 'replay', 'true', 'lead_replay answers before Turnstile');
select is((api.submit_lead(jsonb_build_object('consent',true,'payload',jsonb_build_object('insurance_type','car'),'email','Test@Example.com',
            'phone','050-111 2222','full_name','ישראל ישראלי','kind','insurance'), 'idem-0000-0002', '192.0.2.10')) ->> 'replay', 'true',
  'same key + same body in another key order replays');
select is(api.lead_replay('idem-0000-0099', '{}'::jsonb), null, 'unknown key gives null');
select throws_ok($$select api.lead_replay('idem-0000-0002', '{"kind":"contact"}'::jsonb)$$, 'PT409', 'idempotency_conflict', 'lead_replay: different body gives 409');
select throws_ok($$select api.submit_lead('{"kind":"contact"}'::jsonb, 'idem-0000-0002', '192.0.2.10')$$, 'PT409', 'idempotency_conflict', 'submit_lead: different body gives 409');
select is((api.submit_lead(jsonb_build_object('kind','insurance','full_name','ישראל ישראלי','phone','+972501112222','consent',true), 'idem-0000-0003', '192.0.2.10')) ->> 'duplicate',
  'true', 'same person + kind within 10 minutes is flagged duplicate to the service caller (lead-intake forwards only ok:true)');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','pension','full_name','ישראל','phone','0501113333','payload',jsonb_build_object('tz','123456782'),'consent',true), 'idem-0000-0004', '192.0.2.10')$$,
  'PT400', 'invalid_input:payload_key', 'tz key rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','pension','full_name','ישראל','phone','0501113333','payload',jsonb_build_object('focus_area','123456782'),'consent',true), 'idem-0000-0005', '192.0.2.10')$$,
  'PT400', 'invalid_input:payload_value', 'an id-like value is rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','pension','full_name','ישראל','phone','0501113333','turnstile_token','x','consent',true), 'idem-0000-0006', '192.0.2.10')$$,
  'PT400', 'invalid_input:payload_key', 'turnstile_token never reaches the hash');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','insurance','full_name','A','phone','0501234567','consent',true), 'idem-0000-0007', '192.0.2.10')$$,
  'PT400', 'invalid_input:full_name', 'short name rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','insurance','full_name','Valid Name','phone','12345','consent',true), 'idem-0000-0008', '192.0.2.10')$$,
  'PT400', 'invalid_input:phone', 'bad phone rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','insurance','full_name','Valid Name','email','not-an-email','consent',true), 'idem-0000-0009', '192.0.2.10')$$,
  'PT400', 'invalid_input:email', 'bad email rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','insurance','full_name','Valid Name','phone','0501234568','consent',false), 'idem-0000-0010', '192.0.2.10')$$,
  'PT400', 'invalid_input:consent', 'missing consent rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','hack','full_name','Valid Name','phone','0501234568','consent',true), 'idem-0000-0011', '192.0.2.10')$$,
  'PT400', 'invalid_input:kind', 'unknown kind rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','insurance','full_name','Valid Name','consent',true), 'idem-0000-0012', '192.0.2.10')$$,
  'PT400', 'invalid_input:contact', 'no contact method rejected');
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','contact','full_name','Valid Name','phone','0501234568','consent',true), 'short', '192.0.2.10')$$,
  'PT400', 'invalid_input:idempotency_key', 'short idempotency key rejected');
select is((api.submit_lead(jsonb_build_object('kind','contact','full_name','Bot Name','phone','0501111111','consent',true,'hp','i am a bot'), 'idem-0000-0013', '192.0.2.10')) ->> 'id',
  null, 'honeypot returns ok with no id');
select lives_ok($$select api.intake_note_reject('turnstile', '192.0.2.10')$$, 'reject noted');
select throws_ok($$select api.intake_note_reject('bogus', '192.0.2.10')$$, 'PT400', 'invalid_input:reason', 'unknown reject reason rejected');
reset role;

-- what was stored
select is((select count(*)::int from crm.leads where kind = 'insurance'), 1, 'exactly one insurance lead stored (dedupe worked)');
select is((select phone from crm.leads where kind = 'insurance'), '0501112222', 'phone normalized to 05XXXXXXXX');
select is((select email from crm.leads where kind = 'insurance'), 'test@example.com', 'email normalized to lower case');
select is((select request_id from crm.leads where kind = 'insurance'), 'req-test-0001', 'request id stored');
select is((select agency_id from crm.leads where kind = 'insurance'), (select value::uuid from ops.config where key = 'default_agency_id'), 'lead belongs to the default agency');
select ok((select ip_hash is not null and octet_length(ip_hash) = 32 from crm.leads where kind = 'insurance'), 'ip stored only as keyed hash');
select is((select count(*)::int from ops.outbox where topic = 'lead.created'), (select count(*)::int from crm.leads), 'one outbox event per stored lead');
select is((select count(*)::int from ops.outbox where topic = 'lead.created' and payload ? 'full_name'), 0, 'outbox event carries no name');

-- client ip: cf-connecting-ip, else the LAST public hop of x-forwarded-for
select set_config('request.headers', '{"x-forwarded-for":"198.51.100.1, 203.0.113.7, 10.0.0.1"}', true);
select is(private.client_ip(), '203.0.113.7', 'last public hop');
select set_config('request.headers', '{"cf-connecting-ip":"198.51.100.20","x-forwarded-for":"203.0.113.7"}', true);
select is(private.client_ip(), '198.51.100.20', 'cf-connecting-ip wins');
select set_config('request.headers', '{"x-request-id":"req-test-0002"}', true);

-- kill switch
update ops.config set value = 'false' where key = 'intake_enabled';
set local role service_role;
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','contact','full_name','Valid Name','phone','0502222222','consent',true), 'idem-0000-0020', '192.0.2.10')$$,
  'PT423', 'feature_disabled:intake_enabled', 'intake_enabled=false gives PT423');
reset role;
update ops.config set value = 'true' where key = 'intake_enabled';

-- rate limit: 8 per address per 10 minutes
do $$ begin
  for i in 1..10 loop perform private.check_rate_limit('lead_ip', '192.0.2.50', 8, interval '10 minutes'); end loop;
end $$;
set local role service_role;
select throws_ok($$select api.submit_lead(jsonb_build_object('kind','contact','full_name','Too Many','phone','0523333333','consent',true), 'idem-0000-0021', '192.0.2.50')$$,
  'PT429', 'rate_limited', 'rate limit gives PT429');
select lives_ok($$select api.submit_lead(jsonb_build_object('kind','contact','full_name','Other Ip','phone','0524444444','consent',true), 'idem-0000-0022', '192.0.2.51')$$,
  'a different address is not limited');
reset role;

-- audit trail: values omitted for PII
select ok((select count(*) from audit.log where table_name = 'crm.leads' and op = 'INSERT') >= 1, 'lead inserts are audited');
select is((select count(*)::int from audit.log where table_name = 'crm.leads' and op in ('INSERT', 'UPDATE', 'DELETE')
            and (old_data is not null or new_data is not null)), 0, 'audit of crm.leads stores no PII values');

-- staff status change: column-name audit + an ACTION row with actor_role agent
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
select is((staff.lead_set_status((select id from staff.leads_list() where full_name = 'Other Ip'), 'qualified')) ->> 'ok', 'true', 'staff updates status via RPC');
reset role;
select is((select changed_cols from audit.log where table_name = 'crm.leads' and op = 'UPDATE' order by id desc limit 1), array['status'], 'audit records changed column names');
select is((select actor from audit.log where table_name = 'crm.leads' and op = 'UPDATE' order by id desc limit 1), '00000000-0000-0000-0000-0000000000c1'::uuid, 'audit records the actor');
select is((select actor_role from audit.log where table_name = 'crm.leads' and op = 'ACTION' order by id desc limit 1), 'agent', 'the ACTION row has actor_role agent');
select is((select new_data ->> 'to' from audit.log where table_name = 'crm.leads' and op = 'ACTION' order by id desc limit 1), 'qualified', 'the ACTION row names the new status');

-- audit is append-only
select throws_ok($$delete from audit.log$$, '42501', 'audit.log is append-only', 'audit delete blocked');
select throws_ok($$update audit.log set actor = null$$, '42501', 'audit.log is append-only', 'audit update blocked');

select * from finish();
rollback;
