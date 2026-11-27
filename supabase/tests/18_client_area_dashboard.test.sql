-- 18: personal-area dashboard (20261127090000): product type/source backfill from snapshots, client requests as leads.
-- Synthetic values only (valid-checksum fake ids). Runs as postgres; everything rolls back.
begin;
select no_plan();

select set_config('t.has_vault', (to_regclass('vault.secrets') is not null)::text, true);
do $$
begin
  if current_setting('t.has_vault')::boolean then
    if not exists (select 1 from vault.secrets where name = 'pii_enc_key') then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'pii_enc_key');
    end if;
    if not exists (select 1 from vault.secrets where name = 'national_id_hmac_key') then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'national_id_hmac_key');
    end if;
  end if;
end $$;
select ok(current_setting('t.has_vault')::boolean, 'Vault is present');

-- ---------------------------------------------------------------- switch, privileges
select is((select value from ops.config where key = 'client_area_requests_enabled'), 'false', 'requests switch is seeded closed');
select ok(has_function_privilege('service_role', 'api.client_request_create(bytea, text, text, text)', 'execute')
          and not has_function_privilege('authenticated', 'api.client_request_create(bytea, text, text, text)', 'execute')
          and not has_function_privilege('anon', 'api.client_request_create(bytea, text, text, text)', 'execute'), 'request_create: service role only');
select ok(has_function_privilege('service_role', 'api.client_requests_list(bytea)', 'execute')
          and not has_function_privilege('anon', 'api.client_requests_list(bytea)', 'execute'), 'requests_list: service role only');
select ok(not has_function_privilege('service_role', 'private.surense_products_type_backfill()', 'execute'), 'backfill not exposed');

-- ---------------------------------------------------------------- 1. backfill (type / source objects in the snapshot)
insert into crm.surense_products (id, customer_surense_id, details_enc)
values ('c8400000-0000-4000-8000-000000000001', 'c8100000-0000-4000-8000-000000000001', private.pii_encrypt('{}')),
       ('c8400000-0000-4000-8000-000000000002', 'c8100000-0000-4000-8000-000000000001', private.pii_encrypt('{}'));
update crm.surense_products set product_type = 7 where id = 'c8400000-0000-4000-8000-000000000002';
insert into crm.surense_portfolios (customer_surense_id, mode, product_count, snapshot_enc, fetched_at)
values ('c8100000-0000-4000-8000-000000000001', 'production', 2, private.pii_encrypt(
          '{"products":[{"id":"c8400000-0000-4000-8000-000000000001","type":{"code":3,"description":"x"},"source":{"code":1,"description":"מסלקה פנסיונית"}},
                        {"id":"c8400000-0000-4000-8000-000000000002","type":{"code":12},"source":{"code":3,"description":"פרודוקציה פרט"}}]}'),
        now() - interval '2 days'),
       ('c8100000-0000-4000-8000-000000000001', 'production', 1, private.pii_encrypt(
          '{"products":[{"id":"c8400000-0000-4000-8000-000000000001","type":{"code":12},"source":"הר_הביטוח"}]}'),
        now() - interval '1 day');
select is(private.surense_products_type_backfill(), 2, 'two rows filled');
select is((select product_type from crm.surense_products where id = 'c8400000-0000-4000-8000-000000000001'), 12, 'type from the latest snapshot');
select is((select source from crm.surense_products where id = 'c8400000-0000-4000-8000-000000000001'), 'הר_הביטוח', 'string source kept as is');
select is((select product_type from crm.surense_products where id = 'c8400000-0000-4000-8000-000000000002'), 7, 'a set type is never overwritten');
select is((select source from crm.surense_products where id = 'c8400000-0000-4000-8000-000000000002'), 'פרודוקציה_פרט', 'object source -> description with underscores');
select is(private.surense_products_type_backfill(), 0, 'second run changes nothing');

-- ---------------------------------------------------------------- 2. requests
select is(private.client_request_kind('insurance'), 'insurance', 'insurance -> insurance desk');
select is(private.client_request_kind('savings'), 'pension', 'savings -> pension (finance)');
select is(private.client_request_kind('other'), 'contact', 'other -> contact (general)');
select is(private.client_request_kind('x'), null, 'unknown topic -> null');

insert into crm.customers (id, agency_id, first_name, last_name, mobile_phone, national_id_hmac, national_id_enc)
values ('c8000000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', 'Zz-Req', 'Test', '0501234567',
        private.national_id_hmac('000000018'), private.pii_encrypt('000000018')),
       ('c8000000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001', 'Zz-Other', 'Test', '0509999999',
        private.national_id_hmac('000000026'), private.pii_encrypt('000000026'));
insert into crm.client_sessions (id, customer_id, agency_id, token_hash, expires_at)
values ('c8200000-0000-4000-8000-000000000001', 'c8000000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001',
        extensions.digest('req-fixture-token-1', 'sha256'), now() + interval '30 days'),
       ('c8200000-0000-4000-8000-000000000002', 'c8000000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001',
        extensions.digest('req-fixture-token-2', 'sha256'), now() + interval '30 days');
select set_config('t.th', encode(extensions.digest('req-fixture-token-1', 'sha256'), 'hex'), true);
select set_config('t.th2', encode(extensions.digest('req-fixture-token-2', 'sha256'), 'hex'), true);

update ops.config set value = 'true' where key = 'client_area_enabled';
select is((api.client_requests_list(decode(current_setting('t.th'), 'hex')) ->> 'enabled'), 'false', 'list while the switch is off: enabled false');
select throws_ok($$select api.client_request_create(decode(current_setting('t.th'), 'hex'), 'insurance', null, 'phone')$$,
  'PT423', 'feature_disabled:client_area_requests_enabled', 'create while the switch is off');

update ops.config set value = 'true' where key = 'client_area_requests_enabled';
select throws_ok($$select api.client_request_create(decode(current_setting('t.th'), 'hex'), 'claims', null, 'phone')$$,
  'PT400', 'invalid_input:topic', 'unknown topic refused');
select throws_ok($$select api.client_request_create(decode(current_setting('t.th'), 'hex'), 'insurance', null, 'fax')$$,
  'PT400', 'invalid_input:contact', 'unknown contact refused');
select throws_ok($$select api.client_request_create(decode(current_setting('t.th'), 'hex'), 'insurance', repeat('x', 1001), 'phone')$$,
  'PT400', 'invalid_input:message', 'message over 1000 refused');

select set_config('t.lead', api.client_request_create(decode(current_setting('t.th'), 'hex'), 'insurance', '  שאלה על הפוליסה  ', 'whatsapp') ->> 'id', true);
select is((select kind || '|' || source || '|' || phone || '|' || message || '|' || full_name from crm.leads where id = current_setting('t.lead')::uuid),
  'insurance|client_area|0501234567|שאלה על הפוליסה|Zz-Req Test', 'the lead carries the client''s own name and mobile, trimmed message');
select is((select payload ->> 'customer_id' from crm.leads where id = current_setting('t.lead')::uuid), 'c8000000-0000-4000-8000-000000000001', 'payload links the customer');
select is((select count(*)::int from ops.outbox where topic = 'lead.created' and payload ->> 'lead_id' = current_setting('t.lead')), 1, 'lead.created queued once');
select lives_ok($$select api.client_request_create(decode(current_setting('t.th'), 'hex'), 'savings', null, 'phone')$$, 'empty message is fine');

select is(jsonb_array_length(api.client_requests_list(decode(current_setting('t.th'), 'hex')) -> 'requests'), 2, 'the client sees two requests');
select is((api.client_requests_list(decode(current_setting('t.th'), 'hex')) -> 'requests' -> 1 ->> 'status'), 'received', 'new -> received');
update crm.leads set status = 'contacted' where id = current_setting('t.lead')::uuid;
select is((select r ->> 'status' from jsonb_array_elements(api.client_requests_list(decode(current_setting('t.th'), 'hex')) -> 'requests') r
            where r ->> 'id' = current_setting('t.lead')), 'done', 'contacted -> done');
select is(jsonb_array_length(api.client_requests_list(decode(current_setting('t.th2'), 'hex')) -> 'requests'), 0, 'another client sees none of them');
update crm.leads set status = 'spam' where id = current_setting('t.lead')::uuid;
select is(jsonb_array_length(api.client_requests_list(decode(current_setting('t.th'), 'hex')) -> 'requests'), 1, 'spam is hidden');

select * from finish();
rollback;
