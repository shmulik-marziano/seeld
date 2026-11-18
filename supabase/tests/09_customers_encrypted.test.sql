-- 09: encrypted customers (091300) and the PII-safe import (091400). Synthetic rows only (no real names or ids).
-- The two Vault keys are created inside this rolled-back transaction when absent; the file is skipped when Vault is missing.
-- Never run this file against a database that holds the real keys (it is for replay/branch databases only).
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

select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((private.customers_import('[
    {"legacy_id":"c0000000-0000-4000-8000-000000000001","first_name":"Test","last_name":"One","id_number":"12345678","mobile_phone":"050-000 0001","email":"One@Example.com","details":{"city":"x"}},
    {"legacy_id":"c0000000-0000-4000-8000-000000000002","first_name":"Test","last_name":"Two","id_number":"012345678"}
  ]'::jsonb)) - 'invalid_ids', '{"received": 2, "inserted": 1, "skipped": 1, "invalid": 0}'::jsonb, 'ids 12345678 and 012345678 are one person: inserted 1, skipped 1')
  end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((select private.pii_decrypt(national_id_enc) from crm.customers where legacy_id = 'c0000000-0000-4000-8000-000000000001'), '012345678', 'decrypt gives the normalized id')
  end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok((select mobile_phone = '0500000001' and email = 'one@example.com' and details_enc is not null and octet_length(national_id_hmac) = 32
             from crm.customers where legacy_id = 'c0000000-0000-4000-8000-000000000001'), 'phone/email normalized, details encrypted, hmac 32 bytes')
  end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((private.customers_import('[{"legacy_id":"c0000000-0000-4000-8000-000000000001","first_name":"Test","last_name":"One","id_number":"12345678"}]'::jsonb)) ->> 'inserted',
          '0', 'a re-run inserts 0')
  end;
-- PII-safe import: bad rows are skipped and reported by legacy_id (or ordinal), never raised with row values
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else lives_ok($$select set_config('t.bad', private.customers_import('[
    {"legacy_id":"c0000000-0000-4000-8000-000000000003","first_name":"Test","last_name":"Three","id_number":"23456789"},
    {"legacy_id":"c0000000-0000-4000-8000-000000000004","first_name":"Test","last_name":"  ","id_number":"34567890"},
    {"legacy_id":"c0000000-0000-4000-8000-000000000005","first_name":"Test","last_name":"Five","id_number":"abc"},
    "not-an-object",
    {"legacy_id":"bad-id","first_name":"Test","last_name":"Six","id_number":"45678901"}
  ]'::jsonb)::text, true)$$, 'a batch with bad rows raises nothing')
  end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is(current_setting('t.bad')::jsonb, '{"received": 5, "inserted": 1, "skipped": 4, "invalid": 4,
           "invalid_ids": ["c0000000-0000-4000-8000-000000000004", "c0000000-0000-4000-8000-000000000005", "#4", "#5"]}'::jsonb,
          'inserted 1, invalid 4, invalid_ids by legacy_id or ordinal only')
  end;
select throws_ok($$select private.customers_import('{}'::jsonb)$$, 'PT400', 'invalid_input:rows', 'a non-array is rejected');
select throws_ok($$select private.national_id_norm('1234')$$, 'PT400', 'invalid_input:national_id', 'a too-short id is rejected by the normalizer');

-- nobody but the owner can read or call any of it
set local role service_role;
select throws_ok($$select count(*) from crm.customers$$, '42501', null, 'service_role select gives 42501');
select throws_ok($$select private.pii_decrypt('\x00'::bytea)$$, '42501', null, 'service_role cannot decrypt');
reset role;
set local role authenticated;
select throws_ok($$select count(*) from crm.customers$$, '42501', null, 'authenticated select gives 42501');
reset role;
set local role anon;
select throws_ok($$select count(*) from crm.customers$$, '42501', null, 'anon select gives 42501');
reset role;
select is((select count(*)::int from audit.log where table_name = 'crm.customers' and (new_data is not null or old_data is not null)), 0, 'customer audit keeps no values');

select * from finish();
rollback;
