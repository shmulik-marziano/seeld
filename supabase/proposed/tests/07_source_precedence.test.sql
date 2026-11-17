-- PROPOSED, NOT APPLIED, needs owner approval. pgTAP test for 07_source_precedence.sql (twin of src/test/event-platform.test.ts).
-- Precedence matrix, ownership matrix, provenance, history, proposals, routing.
begin;
select plan(23);

do $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.queue_destinations set enabled = true;
end $$;

-- Precedence: full 5 x 5 matrix, newer incoming observation. Lower rank number = more trusted.
select results_eq(
  $$select cur::int, inc::int, public.field_precedence_decision(true, '"a"'::jsonb, cur::smallint, now(), '"b"'::jsonb, inc::smallint, now() + interval '1 second')
      from generate_series(1,5) cur, generate_series(1,5) inc order by 1, 2$$,
  $$select cur::int, inc::int, case when inc < cur then 'apply_override' when inc > cur then 'keep_higher_rank' else 'apply_newer_same_rank' end
      from generate_series(1,5) cur, generate_series(1,5) inc order by 1, 2$$,
  'precedence matrix');
select is(public.field_precedence_decision(true, '"a"'::jsonb, 3::smallint, now(), '"b"'::jsonb, 3::smallint, now() - interval '1 hour'), 'keep_newer_existing', 'same rank, stale observation kept out');
select is(public.field_precedence_decision(true, '"a"'::jsonb, 3::smallint, now() - interval '1 hour', '"b"'::jsonb, 3::smallint, now()), 'apply_newer_same_rank', 'same rank, newer observation wins');
select is(public.field_precedence_decision(true, '"a"'::jsonb, 5::smallint, now(), '""'::jsonb, 1::smallint, now()), 'ignore_empty_incoming', 'empty never erases');
select is(public.field_precedence_decision(true, '""'::jsonb, 1::smallint, now(), '"x"'::jsonb, 4::smallint, now()), 'apply_fill_empty', 'questionnaire fills an empty field');
select is(public.field_precedence_decision(false, null, null, null, '"x"'::jsonb, 4::smallint, now()), 'apply_new', 'no value yet');

-- Ownership matrix.
select results_eq(
  $$select public.field_ownership_decision(known, owner, multi, inputs, store, mode, origin) from (values
      (true,  'salesforce', false, '{}'::text[],       'source_of_truth', 'reject',  'salesforce'),
      (true,  'salesforce', false, '{}'::text[],       'source_of_truth', 'reject',  'surense'),
      (true,  'surense',    false, '{}'::text[],       'source_of_truth', 'reject',  'salesforce'),
      (true,  'salesforce', false, '{}'::text[],       'source_of_truth', 'propose', 'surense'),
      (true,  'salesforce', false, '{portal}'::text[], 'source_of_truth', 'reject',  'portal'),
      (true,  'salesforce', false, '{}'::text[],       'source_of_truth', 'reject',  'portal'),
      (true,  'surense',    true,  '{}'::text[],       'source_of_truth', 'reject',  'portal'),
      (true,  'surense',    false, '{}'::text[],       'never_store',     'reject',  'surense'),
      (false, null,         false, '{}'::text[],       'source_of_truth', 'reject',  'surense')
    ) as v(known, owner, multi, inputs, store, mode, origin)$$,
  $$values ('allow'), ('reject_not_owner'), ('reject_not_owner'), ('propose_not_owner'), ('allow'), ('reject_not_owner'), ('allow'), ('reject_never_store'), ('reject_unknown_field')$$,
  'ownership matrix');

-- apply_field_update end to end (service role context).
create temp table c as select gen_random_uuid()::text as id;
select is((select decision from public.apply_field_update('customer', (select id from c), 'accumulation.total', '"Q"'::jsonb, 'pre_treatment_questionnaire', now(), 'portal')), 'apply_new', 'questionnaire sets a value');
select is((select decision from public.apply_field_update('customer', (select id from c), 'accumulation.total', '"CH"'::jsonb, 'clearing_house', now(), 'surense')), 'apply_override', 'clearing house overrides the questionnaire');
select is((select decision from public.apply_field_update('customer', (select id from c), 'accumulation.total', '"Q2"'::jsonb, 'pre_treatment_questionnaire', now(), 'portal')), 'keep_higher_rank', 'questionnaire cannot override clearing house');
select is((select value #>> '{}' from public.field_values where entity_id = (select id from c) and field_key = 'accumulation.total'), 'CH', 'clearing house value kept');
select is((select source_rank from public.field_values where entity_id = (select id from c) and field_key = 'accumulation.total'), 1::smallint, 'provenance rank kept');
select is((select count(*) from public.field_value_history where entity_id = (select id from c)), 3::bigint, 'every decision is in the history');
select is((select decision from public.apply_field_update('customer', (select id from c), 'customer.phone', '"050"'::jsonb, 'surense_agent_report', now(), 'surense')), 'propose_not_owner', 'non owner in propose mode');
select is((select count(*) from public.field_update_proposals where entity_id = (select id from c)), 1::bigint, 'proposal stored');
select is((select decision from public.apply_field_update('customer', (select id from c), 'case.state', '"open"'::jsonb, 'surense_agent_report', now(), 'salesforce')), 'reject_not_owner', 'Salesforce cannot write a Surense field');
select is((select decision from public.apply_field_update('customer', (select id from c), 'commission.final', '"1"'::jsonb, 'surense_agent_report', now(), 'surense')), 'reject_never_store', 'final commissions are never stored here');
select is((select decision from public.apply_field_update('customer', (select id from c), 'made.up_field', '"1"'::jsonb, 'manual_template', now(), 'manual')), 'reject_unknown_field', 'unknown field rejected');
select throws_ok(format('select * from public.apply_field_update(%L, %L, %L, %L::jsonb, %L, now(), %L)', 'customer', (select id from c), 'accumulation.total', '"x"', 'not_a_source', 'portal'), '22023', null, 'unknown source cannot forge a rank');
select throws_ok($$update public.field_value_history set decision = 'x'$$, 'P0001', 'field_value_history is append-only', 'history is append-only');

-- Routing.
select is(public.route_destinations('portal', array['customer.phone']), array['salesforce','surense'], 'portal change reaches owner and replica');
select is(public.route_destinations('salesforce', array['customer.phone']), array['surense'], 'never back to the origin');
select is(public.route_destinations('portal', array['identity.index']), '{}'::text[], 'operational db fields are not routed');

select * from finish();
rollback;
