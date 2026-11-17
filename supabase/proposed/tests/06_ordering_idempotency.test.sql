-- PROPOSED, NOT APPLIED, needs owner approval. pgTAP test, run only on a branch/preview database after 06..09 are applied:
--   supabase test db   (or: pg_prove supabase/proposed/tests/*.sql)
-- Covers: one-transaction enqueue, idempotency, per-customer per-destination ordering, no head-of-line blocking,
-- visibility timeout, dead letter + alert, echo / loop prevention, identity uniqueness and no plaintext national id.
begin;
select plan(37);

create function pg_temp.mid(q text, c uuid, s int) returns bigint language plpgsql as $f$
declare r bigint;
begin
  execute format('select msg_id from pgmq.%I where message->>''customerKey'' = $1 and (message->>''seq'')::int = $2', 'q_' || q) into r using c::text, s;
  return r;
end $f$;

do $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform vault.create_secret('test-hmac-key-do-not-use', 'national_id_hmac_key');
  perform vault.create_secret('test-enc-key-do-not-use', 'national_id_enc_key');
  update public.queue_destinations set enabled = true;
end $$;
create temp table t as select public.identity_create_pending(null) as a, public.identity_create_pending(null) as b;

select has_extension('pgmq', 'pgmq is installed');

-- 1. One transaction: the save writes the draft/fields AND enqueues to both destination queues (owner + replica).
select is((public.save_questionnaire_step('key-0001-aaaa', (select a from t), 'pre', '{"customer.phone":"0501234567"}'::jsonb, 's1', 25, true, false, 'req-1'))->>'status', 'saved', 'first save');
select is((select count(*) from pgmq.q_salesforce_events), 1::bigint, 'salesforce queue got one message');
select is((select count(*) from pgmq.q_surense_events), 1::bigint, 'surense queue got one message');

-- 2. Idempotency: a double click returns the stored result and creates nothing.
select is((public.save_questionnaire_step('key-0001-aaaa', (select a from t), 'pre', '{"customer.phone":"0501234567"}'::jsonb, 's1', 25, true, false, 'req-1'))->>'duplicate', 'true', 'duplicate flagged');
select is((select count(*) from pgmq.q_salesforce_events), 1::bigint, 'no second message after duplicate');
select is((select count(*) from public.idempotency_keys where key = 'key-0001-aaaa'), 1::bigint, 'one idempotency row');

-- 3. Per-customer sequence per destination.
select is((public.save_questionnaire_step('key-0002-aaaa', (select a from t), 'pre', '{"customer.phone":"0509999999"}'::jsonb, 's2', 50, true, false, 'req-2'))->>'status', 'saved', 'second save');
select is((select last_enqueued_seq from public.customer_queue_state where customer_key = (select a from t) and destination = 'salesforce'), 2::bigint, 'salesforce seq 2');
select is((select last_enqueued_seq from public.customer_queue_state where customer_key = (select a from t) and destination = 'surense'), 2::bigint, 'surense seq 2 (independent counter)');

-- 4. Visibility timeout: a read hides the messages, a second read right after gets nothing.
select is(jsonb_array_length(public.queue_read_batch('salesforce')), 2, 'first read returns both messages');
select is(jsonb_array_length(public.queue_read_batch('salesforce')), 0, 'visibility timeout hides them from a parallel worker');

-- 5. Ordering gate.
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select a from t), 2), (select a from t), 2, 'w1'), 'not_ready', 'seq 2 waits for seq 1');
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select a from t), 1), (select a from t), 1, 'w1'), 'process', 'seq 1 may run');
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select a from t), 2), (select a from t), 2, 'w2'), 'locked', 'second worker is locked out of this customer');
select lives_ok(format('select public.queue_complete(%L, %s, %L, 1, %L, null)', 'salesforce', pg_temp.mid('salesforce_events', (select a from t), 1), (select a from t), 'w1'), 'complete seq 1');
select is(public.queue_claim('salesforce', pg_temp.mid('salesforce_events', (select a from t), 2), (select a from t), 2, 'w2'), 'process', 'seq 2 runs after seq 1 completed');
select throws_ok(format('select public.queue_complete(%L, %s, %L, 1, %L, null)', 'salesforce', pg_temp.mid('salesforce_events', (select a from t), 1), (select a from t), 'w1'), '40001', null, 'completing out of order is refused');

-- 6. A stuck customer never blocks another customer; dead letter halts only that customer and raises an alert.
select is((public.save_questionnaire_step('key-0003-bbbb', (select b from t), 'pre', '{"customer.phone":"0508888888"}'::jsonb, 's1', 10, true, false, 'req-3'))->>'status', 'saved', 'customer B saved');
select lives_ok(format('select public.queue_dead_letter(%L, %s, %L, 1, %L::jsonb, %L, %L)', 'surense', pg_temp.mid('surense_events', (select a from t), 1), (select a from t), '{}', 'max_attempts', 'http_503'), 'dead letter A on surense');
select is((select count(*) from pgmq.q_surense_events_dlq), 1::bigint, 'dead-letter queue has the message');
select is((select halted from public.customer_queue_state where customer_key = (select a from t) and destination = 'surense'), true, 'customer A halted on surense');
select is((select count(*) from public.ops_alerts where kind = 'dead_letter' and status = 'pending'), 1::bigint, 'operational alert raised');
select is(public.queue_claim('surense', pg_temp.mid('surense_events', (select a from t), 2), (select a from t), 2, 'w1'), 'halted', 'A later message waits');
select is(public.queue_claim('surense', pg_temp.mid('surense_events', (select b from t), 1), (select b from t), 1, 'w1'), 'process', 'B is not blocked (no head-of-line blocking)');

-- 7. Loop prevention.
select is((public.queue_enqueue_event('salesforce', gen_random_uuid(), public.content_hash_jsonb('{"customer.phone":"0501234567"}'::jsonb), (select a from t), 'customer.upserted', array['customer.phone'], null, null))->>'reason', 'echo', 'echo from Salesforce dropped');
select is((public.queue_enqueue_event('salesforce', gen_random_uuid(), repeat('c', 64), (select a from t), 'customer.upserted', array['customer.phone'], null, null))->'sent_to', '["surense"]'::jsonb, 'never routed back to the origin');

-- 8. Constraints.
select throws_ok($$update public.queue_destinations set batch_size = 21$$, '23514', null, 'batch size capped at 20');
select throws_ok($$update public.event_log set code = 'x'$$, 'P0001', 'event_log is append-only', 'event_log is append-only');

-- 9. Identity.
select is(public.identity_normalize_national_id('18'), '000000018', 'left pads to nine digits');
select is(public.identity_normalize_national_id('123456789'), null, 'bad check digit gives null');
select is(public.identity_upsert_verified('123-456-782', 'agent'), public.identity_upsert_verified('123456782', 'agent'), 'same person resolves to one identity');
select ok((select national_id_hash is not null and octet_length(national_id_hash) = 32 from public.identity_links where status = 'verified' limit 1), 'keyed hash stored (HMAC-SHA256, 32 bytes)');
select is((select count(*) from public.identity_links where national_id_enc = convert_to('123456782', 'utf8')), 0::bigint, 'national id is not stored in plaintext');
select is(public.identity_set_external_id((select a from t), 'salesforce', 'sf-1'), 'ok', 'link salesforce id');
select is(public.identity_set_external_id((select b from t), 'salesforce', 'sf-1'), 'conflict', 'same salesforce id on another customer is a conflict');
select throws_ok(format('update public.identity_links set surense_id = %L where internal_customer_id in (%L, %L)', 'su-1', (select a from t), (select b from t)), '23505', null, 'surense id is unique');

select * from finish();
rollback;
