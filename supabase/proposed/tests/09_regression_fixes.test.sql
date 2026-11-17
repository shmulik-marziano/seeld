-- PROPOSED, NOT APPLIED, needs owner approval. pgTAP regression tests: one or more assertions per bug found by the review and
-- confirmed by REAL execution (see C:/tmp/infra/sql-verification.md). Run on a branch/preview database after 01..09 are applied.
-- Fixed fake ids only. Everything runs inside one transaction that is rolled back.
begin;
select plan(62);

-- Fixtures (table owner). Users: C client with a profiles row (trigger), A1/A2 agents of agency A, AN agent WITHOUT agency,
-- MA manager of agency A, MB manager of agency B, MN manager without agency, S super admin.
do $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform vault.create_secret('test-hmac-key-do-not-use', 'national_id_hmac_key');
  perform vault.create_secret('test-enc-key-do-not-use', 'national_id_enc_key');
  perform vault.create_secret('test-event-hash-key-do-not-use', 'event_hash_key');
  update public.queue_destinations set enabled = true;
end $$;
insert into public.agencies (id, name) values ('acacacac-0000-4000-8000-0000000000a1', 'Agency A'), ('acacacac-0000-4000-8000-0000000000b2', 'Agency B');
insert into auth.users (id, aud, role) values
  ('c0c0c0c0-0000-4000-8000-000000000001', 'authenticated', 'authenticated'),   -- C
  ('a1a1a1a1-0000-4000-8000-000000000001', 'authenticated', 'authenticated'),   -- A1
  ('a2a2a2a2-0000-4000-8000-000000000002', 'authenticated', 'authenticated'),   -- A2
  ('a3a3a3a3-0000-4000-8000-000000000003', 'authenticated', 'authenticated'),   -- AN
  ('b1b1b1b1-0000-4000-8000-000000000001', 'authenticated', 'authenticated'),   -- MA
  ('b2b2b2b2-0000-4000-8000-000000000002', 'authenticated', 'authenticated'),   -- MB
  ('b3b3b3b3-0000-4000-8000-000000000003', 'authenticated', 'authenticated'),   -- MN
  ('d0d0d0d0-0000-4000-8000-000000000001', 'authenticated', 'authenticated');   -- S
update public.profiles set agency_id = 'acacacac-0000-4000-8000-0000000000a1' where user_id in ('a1a1a1a1-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002');
insert into public.platform_user_roles (user_id, role, agency_id) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'agent', 'acacacac-0000-4000-8000-0000000000a1'),
  ('a2a2a2a2-0000-4000-8000-000000000002', 'agent', 'acacacac-0000-4000-8000-0000000000a1'),
  ('a3a3a3a3-0000-4000-8000-000000000003', 'agent', null),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'manager', 'acacacac-0000-4000-8000-0000000000a1'),
  ('b2b2b2b2-0000-4000-8000-000000000002', 'manager', 'acacacac-0000-4000-8000-0000000000b2'),
  ('b3b3b3b3-0000-4000-8000-000000000003', 'manager', null),
  ('d0d0d0d0-0000-4000-8000-000000000001', 'super_admin', null);
create temp table t as select public.identity_create_pending('acacacac-0000-4000-8000-0000000000a1') as a, public.identity_create_pending('acacacac-0000-4000-8000-0000000000a1') as b,
                              public.identity_create_pending(null) as n;
grant select on t to authenticated;
create function pg_temp.mid(q text, c uuid, s int) returns bigint language plpgsql as $f$
declare r bigint;
begin
  execute format('select msg_id from pgmq.%I where message->>''customerKey'' = $1 and (message->>''seq'')::int = $2', 'q_' || q) into r using c::text, s;
  return r;
end $f$;

-- 1. National id normalisation (06-3): empty / null / all-zero / too long / non-digit are rejected, never mapped to 000000000.
select is(public.identity_normalize_national_id(''), null, 'empty string is rejected');
select is(public.identity_normalize_national_id(null), null, 'null is rejected');
select is(public.identity_normalize_national_id('0'), null, 'all zero is rejected');
select is(public.identity_normalize_national_id('1234567890'), null, 'ten digits are rejected (lpad used to truncate)');
select is(public.identity_normalize_national_id('12a456782'), null, 'non digit is rejected');
select is(public.identity_normalize_national_id('000-000-018'), '000000018', 'separators are stripped, then padded and checked');
select throws_ok($$select public.save_lead('lead-key-empty-id', '{}'::jsonb, 'insurance', '', null, null)$$, '22023', 'invalid_national_id', 'save_lead with an empty national id is refused');
select throws_ok($$select public.identity_hash_national_id('')$$, '22023', 'invalid_national_id', 'hashing an empty id is refused');

-- 2. Platform role (08-1): a client who only has the profiles row created by on_auth_user_created is NOT an agent.
select is((select count(*) from public.profiles where user_id = 'c0c0c0c0-0000-4000-8000-000000000001'), 1::bigint, 'precondition: the signup trigger created a profiles row for the client');
do $$ begin perform set_config('request.jwt.claims', '{"sub":"c0c0c0c0-0000-4000-8000-000000000001","role":"authenticated"}', true); end $$;
select is(public.current_platform_role(), null, 'client with a profiles row has no platform role');
select is(public.platform_can_write_customer((select a from t)), false, 'client cannot write for a customer that is not theirs');
set local role authenticated;
select throws_ok($$select public.save_questionnaire_step('client-key-0001', (select a from t), 'pre', '{"customer.phone":"0501234567"}'::jsonb, 's1', 10, true, false, null)$$, '42501', 'forbidden', 'client cannot call save_questionnaire_step for another customer');
reset role;

-- 3. Document ingestion insert policy (04-2): path bound to owner, agency bound to caller, source enabled and matching.
update public.document_sources set enabled = true where source_type = 'clearing-house';
create temp table src as select id, source_type from public.document_sources;   -- visible ids (a disabled source is invisible to the client role)
grant select on src to authenticated;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"a1a1a1a1-0000-4000-8000-000000000001","role":"authenticated"}', true); end $$;
set local role authenticated;
select lives_ok($$insert into public.document_ingestions (owner_id, agency_id, source_id, source_type, storage_path)
  select 'a1a1a1a1-0000-4000-8000-000000000001', 'acacacac-0000-4000-8000-0000000000a1', id, 'clearing-house', 'a1a1a1a1-0000-4000-8000-000000000001/f1.pdf' from public.document_sources where source_type = 'clearing-house'$$, 'own folder, own agency, enabled source: allowed');
select throws_ok($$insert into public.document_ingestions (owner_id, source_id, source_type, storage_path)
  select 'a1a1a1a1-0000-4000-8000-000000000001', id, 'clearing-house', 'a2a2a2a2-0000-4000-8000-000000000002/f2.pdf' from public.document_sources where source_type = 'clearing-house'$$, '42501', null, 'path in another user''s folder: refused');
select throws_ok($$insert into public.document_ingestions (owner_id, source_id, source_type, storage_path)
  select 'a1a1a1a1-0000-4000-8000-000000000001', id, 'clearing-house', 'a1a1a1a1-0000-4000-8000-000000000001/../a2a2a2a2-0000-4000-8000-000000000002/f3.pdf' from public.document_sources where source_type = 'clearing-house'$$, '42501', null, 'path traversal: refused');
select throws_ok($$insert into public.document_ingestions (owner_id, agency_id, source_id, source_type, storage_path)
  select 'a1a1a1a1-0000-4000-8000-000000000001', 'acacacac-0000-4000-8000-0000000000b2', id, 'clearing-house', 'a1a1a1a1-0000-4000-8000-000000000001/f4.pdf' from public.document_sources where source_type = 'clearing-house'$$, '42501', null, 'another agency id: refused');
select throws_ok($$insert into public.document_ingestions (owner_id, source_id, source_type, storage_path)
  select 'a1a1a1a1-0000-4000-8000-000000000001', id, 'har-habituach', 'a1a1a1a1-0000-4000-8000-000000000001/f5.pdf' from public.document_sources where source_type = 'clearing-house'$$, '42501', null, 'source_type that does not match the source: refused');
select throws_ok($$insert into public.document_ingestions (owner_id, source_id, source_type, storage_path)
  select 'a1a1a1a1-0000-4000-8000-000000000001', id, 'har-habituach', 'a1a1a1a1-0000-4000-8000-000000000001/f6.pdf' from pg_temp.src where source_type = 'har-habituach'$$, '42501', null, 'disabled source: refused');
reset role;

-- 4. Echo window (06-5) and keyed content hash (06-4).
do $$ begin perform set_config('request.jwt.claims', '{"role":"service_role"}', true); end $$;
create temp table h as select public.content_hash_jsonb('{"customer.phone":"0501234567"}'::jsonb) as v;
select is((select v from h), encode(extensions.hmac(convert_to('{"customer.phone": "0501234567"}', 'utf8'), convert_to('test-event-hash-key-do-not-use', 'utf8'), 'sha256'), 'hex'), 'content hash is HMAC-SHA256 with the vault key');
select isnt((select v from h), encode(extensions.digest(convert_to('{"customer.phone": "0501234567"}', 'utf8'), 'sha256'), 'hex'), 'content hash is no longer a plain SHA-256');
select is((select count(*) from pgmq.q_surense_outbound), 0::bigint, 'precondition: empty surense queue');
select is((public.queue_enqueue_event('portal', gen_random_uuid(), (select v from h), (select b from t), 'customer.upserted', array['customer.phone'], null, null))->>'status', 'accepted', 'portal event accepted');
select is((public.queue_enqueue_event('salesforce', gen_random_uuid(), (select v from h), (select b from t), 'customer.upserted', array['customer.phone'], null, null))->>'reason', 'echo', 'echo inside the window is dropped');
update public.event_registry set first_seen_at = now() - interval '3 days' where customer_key = (select b from t);
select is((public.queue_enqueue_event('salesforce', gen_random_uuid(), (select v from h), (select b from t), 'customer.upserted', array['customer.phone'], null, null))->>'status', 'accepted', 'identical content after the echo window is a real change: accepted');
select is((public.queue_enqueue_event('portal', '77777777-0000-4000-8000-000000000001', repeat('a', 64), (select b from t), 'customer.upserted', array['customer.phone'], null, null))->>'status', 'accepted', 'first event id accepted');
select is((public.queue_enqueue_event('portal', '77777777-0000-4000-8000-000000000001', repeat('a', 64), (select b from t), 'customer.upserted', array['customer.phone'], null, null))->>'reason', 'duplicate_event', 'same event id again: dropped, no error');

-- 5. Idempotency key bound to the customer (06-7).
select is((public.save_questionnaire_step('shared-key-0001', (select a from t), 'pre', '{"customer.phone":"0501111111"}'::jsonb, 's1', 10, true, false, null))->>'status', 'saved', 'customer A saves with a key');
select throws_ok($$select public.save_questionnaire_step('shared-key-0001', (select n from t), 'pre', '{"customer.phone":"0502222222"}'::jsonb, 's1', 10, true, false, null)$$, '23505', 'idempotency_key_conflict', 'the same key for another customer does not return A''s stored result');

-- 6. DLQ replay checks customer ownership (06-8).
select is(public.queue_claim('surense', pg_temp.mid('surense_outbound', (select a from t), 1), (select a from t), 1, 'w1'), 'process', 'A claimed');
select lives_ok(format('select public.queue_dead_letter(%L, %s, %L, 1, %L::jsonb, %L, %L)', 'surense', pg_temp.mid('surense_outbound', (select a from t), 1), (select a from t),
  jsonb_build_object('customerKey', (select a from t), 'seq', 1)::text, 'permanent', 'x'), 'A dead-lettered');
select is(public.queue_claim('surense', pg_temp.mid('surense_outbound', (select b from t), 1), (select b from t), 1, 'w1'), 'process', 'B claimed');
select lives_ok(format('select public.queue_dead_letter(%L, %s, %L, 1, %L::jsonb, %L, %L)', 'surense', pg_temp.mid('surense_outbound', (select b from t), 1), (select b from t),
  jsonb_build_object('customerKey', (select b from t), 'seq', 1)::text, 'permanent', 'x'), 'B dead-lettered');
select is(public.queue_resolve_halt('surense', (select b from t), 'replay', (select msg_id from pgmq.q_surense_outbound_dlq where message->>'customerKey' = (select a from t)::text)), 'dlq_message_other_customer', 'replaying A''s dead letter to release B is refused');
select is(public.queue_resolve_halt('surense', (select b from t), 'replay', (select msg_id from pgmq.q_surense_outbound_dlq where message->>'customerKey' = (select b from t)::text)), 'ok', 'replaying B''s own dead letter works');

-- 7. assign_lead keeps an existing assignment (08-2).
select is((public.assign_lead((select a from t), 'insurance', 'a1a1a1a1-0000-4000-8000-000000000001', 'acacacac-0000-4000-8000-0000000000a1'))->>'agent_id', 'a1a1a1a1-0000-4000-8000-000000000001', 'manual assignment');
update public.assignment_rules set enabled = false;
select is((public.assign_lead((select a from t), 'insurance', null, 'acacacac-0000-4000-8000-0000000000a1'))->>'reason', 'no_rule', 'no rule matches now');
select is((select assigned_agent_id from public.agent_workbench where customer_key = (select a from t)), 'a1a1a1a1-0000-4000-8000-000000000001'::uuid, 'the existing agent is not wiped');

-- 8. Null agency and manager agency scope (08-5).
insert into public.agent_workbench (customer_key, agency_id, assigned_agent_id) values ((select n from t), null, null) on conflict (customer_key) do nothing;
update public.platform_settings set value = 'all_read_only' where key = 'visibility_mode';
do $$ begin perform set_config('request.jwt.claims', '{"sub":"a3a3a3a3-0000-4000-8000-000000000003","role":"authenticated"}', true); end $$;
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 0::bigint, 'an agent without agency sees no null-agency rows (all_read_only)');
reset role;
update public.platform_settings set value = 'shared_pool_plus_own' where key = 'visibility_mode';
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 0::bigint, 'an agent without agency sees no unassigned null-agency rows (shared_pool_plus_own)');
reset role;
update public.platform_settings set value = 'own_only' where key = 'visibility_mode';
do $$ begin perform set_config('request.jwt.claims', '{"sub":"b2b2b2b2-0000-4000-8000-000000000002","role":"authenticated"}', true); end $$;
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 0::bigint, 'manager of agency B sees nothing of agency A');
select throws_ok($$select public.assign_lead_manual((select a from t), 'a1a1a1a1-0000-4000-8000-000000000001', 'x')$$, '42501', null, 'manager of B cannot reassign a lead of agency A');
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"b3b3b3b3-0000-4000-8000-000000000003","role":"authenticated"}', true); end $$;
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 0::bigint, 'manager without agency sees nothing, not even null-agency rows');
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"sub":"b1b1b1b1-0000-4000-8000-000000000001","role":"authenticated"}', true); end $$;
set local role authenticated;
select is((select count(*) from public.get_agent_workbench()), 1::bigint, 'manager of agency A sees agency A rows');
select throws_ok($$select public.assign_lead_manual((select a from t), 'c0c0c0c0-0000-4000-8000-000000000001', 'x')$$, '22023', 'target_not_an_active_agent', 'manager cannot assign a lead to a non-agent');
select lives_ok($$select public.assign_lead_manual((select a from t), 'a2a2a2a2-0000-4000-8000-000000000002', 'balance')$$, 'manager of A reassigns within agency A');
reset role;

-- 9. response_target_minutes validation (08-7).
do $$ begin perform set_config('request.jwt.claims', jsonb_build_object('sub','d0d0d0d0-0000-4000-8000-000000000001','role','authenticated','aal','aal2',
  'amr', jsonb_build_array(jsonb_build_object('method','totp','timestamp', extract(epoch from now())::bigint)))::text, true); end $$;
set local role authenticated;
select throws_ok($$select public.admin_set_setting('response_target_minutes', 'abc')$$, 'P0001', 'bad_response_target', 'non numeric target refused');
select lives_ok($$select public.admin_set_setting('response_target_minutes', '45')$$, 'numeric target accepted');
reset role;
select lives_ok($$update public.agent_workbench set full_name = 'x' where customer_key = (select a from t)$$, 'workbench writes still work after a setting change');

-- 10. Metrics buffer (08-6): bump never touches the shared daily row; fold applies it once, in order.
do $$ begin perform set_config('request.jwt.claims', '{"role":"service_role"}', true); end $$;
select public.metrics_fold();
create temp table m0 as select coalesce(sum(failed_three_times), 0) as v from public.management_metrics where scope = 'system';
select public.metrics_bump(null, 'failed_three_times', 3);
select public.metrics_bump(null, 'failed_three_times', 2);
select is((select count(*) from public.metrics_deltas), 2::bigint, 'bump writes append-only buffer rows');
select is((select coalesce(sum(failed_three_times), 0) from public.management_metrics where scope = 'system'), (select v from m0), 'the shared system row is untouched by bump');
select is(public.metrics_fold(), 1, 'fold merges the buffer into one upsert');
select is((select sum(failed_three_times) from public.management_metrics where scope = 'system'), (select v from m0) + 5, 'folded total is exact');
select is(public.metrics_fold(), 0, 'second fold is a no-op');
select throws_ok($$select public.metrics_bump(null, 'id; drop table x', 1)$$, 'P0001', 'bad_metric_column', 'bump column whitelist still enforced');

-- 11. Worker crash counting (06-10) and release frees the lease (06-9). A fresh customer on the salesforce queue.
create temp table q as select public.identity_create_pending(null) as c, public.identity_create_pending(null) as r;
select public.save_questionnaire_step('crash-key-0001', (select c from q), 'pre', '{"customer.phone":"0503333333"}'::jsonb, 's1', 10, true, false, null);
select public.save_questionnaire_step('rel-key-0001', (select r from q), 'pre', '{"customer.phone":"0504444444"}'::jsonb, 's1', 10, true, false, null);
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select c from q), 1), (select c from q), 1, 'w1'), 'process', 'crash test: first claim');
update public.customer_queue_state set lease_until = now() - interval '1 second' where customer_key = (select c from q) and destination = 'salesforce';
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select c from q), 1), (select c from q), 1, 'w2'), 'process', 'crash 1: reclaim after lease expiry counts a failure, still retried');
update public.customer_queue_state set lease_until = now() - interval '1 second' where customer_key = (select c from q) and destination = 'salesforce';
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select c from q), 1), (select c from q), 1, 'w3'), 'process', 'crash 2: still retried');
update public.customer_queue_state set lease_until = now() - interval '1 second' where customer_key = (select c from q) and destination = 'salesforce';
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select c from q), 1), (select c from q), 1, 'w4'), 'poison', 'crash 3: max_attempts reached, caller dead-letters');
select is((select count(*) from public.event_log where customer_key = (select c from q) and code = 'worker_crash'), 3::bigint, 'each crash is in the audit log');
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select r from q), 1), (select r from q), 1, 'w1'), 'process', 'release test: claimed');
select lives_ok(format('select public.queue_release(%L, %s, 0, %L, %L)', 'salesforce', pg_temp.mid('salesforce_events', (select r from q), 1), (select r from q), 'w1'), 'released with lease reset');
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select r from q), 1), (select r from q), 1, 'w2'), 'process', 'a released message is claimable at once (no stale lease bounce)');

select * from finish();
rollback;
