-- 05 (T4): investment_tracks refresh normalised to the site slugs (095000, collisions + unmapped counts 095300), the retired
-- sealed customers import (095100 -> 095300) and the details "narrow" procedure (095300).
-- Synthetic rows only (no real names or ids). Vault keys are created inside this rolled-back transaction when absent; the
-- customers part is skipped when Vault is missing. Replay/branch databases only, like 09.
begin;
select no_plan();

-- ===== tracks: helpers =====
select is(private.track_company_slug('הראל'), 'harel', 'board company הראל maps to harel');
select is(private.track_company_slug('הראל פנסיה'), 'harel', 'a company followed by a word maps by prefix');
select is(private.track_company_slug('מנורה מבטחים'), 'menora', 'the longest name wins');
select is(private.track_company_slug('מורגן'), null, 'a prefix inside a word does not map');
select is(private.track_company_slug('גלובלנט'), null, 'a company the site does not list is not published');
select is(private.track_specialization('index'), 'index_tracking', 'board index -> index_tracking');
select is(private.track_specialization('sp500'), 'index_tracking', 'board sp500 -> index_tracking');
select is(private.track_specialization('risk_high'), 'other', 'unknown track -> other');
select is(private.track_specialization('halacha'), 'halacha', 'a site value passes through');
select is(private.hebrew_period(202609), 'ספטמבר 2026', 'YYYYMM -> Hebrew month');
select is(private.hebrew_period(202613), null, 'a bad period gives null');
select has_column('content', 'investment_tracks', 'source_period', 'investment_tracks.source_period exists');
select ok(not has_function_privilege('anon', 'content.refresh_investment_tracks()', 'execute')
          and not has_function_privilege('authenticated', 'content.refresh_investment_tracks()', 'execute'),
          'API client roles cannot run the refresh');
select ok(not has_table_privilege('service_role', 'private.track_company_slugs', 'select'), 'slug map is private');

-- ===== tracks: refresh end to end =====
insert into content.cma_funds (fund_id, fund_name, managing_company, source, product_type, report_period, total_assets, monthly_yield)
  select f.id, 'מסלול ' || f.id, f.co, 'gemelnet', 'gemel', 202609, 1000, 0.5
  from (values ('T4F1', 'הראל'), ('T4F2', 'מנורה מבטחים'), ('T4F3', 'גלובלנט')) f(id, co);
-- the same id in a second dataset (a real case on seeld-site: one id is a gemelnet fund and a bituachnet policy)
insert into content.cma_funds (fund_id, fund_name, managing_company, source, product_type, report_period, total_assets, monthly_yield)
  values ('T4F1', 'פוליסה ' || 'T4F1', 'הפניקס', 'bituachnet', 'polisa', 202609, 2000, 0.4);
select content.refresh_fund_views();
insert into content.investment_tracks (fund_number, name, company, product_type, specialization, is_active)
  values ('T4OLD', 'old track', 'harel', 'gemel', 'general', true);
select 'tracks refreshed' from (select set_config('t.r', content.refresh_investment_tracks()::text, true)) s;
select ok((current_setting('t.r')::jsonb ->> 'upserted')::int >= 2, 'mapped funds are upserted');
select ok(not exists (select 1 from content.investment_tracks where fund_number = 'T4F3'), 'an unmapped company is not published');
select is((select company from content.investment_tracks where fund_number = 'T4F1'), 'harel', 'company stored as the site slug');
select is((select company from content.investment_tracks where fund_number = 'T4F2'), 'menora', 'second company slug');
select is((select source_period from content.investment_tracks where fund_number = 'T4F1'), 202609, 'source_period is the as-of period');
select is((select report_period from content.investment_tracks where fund_number = 'T4F1'), 'ספטמבר 2026', 'report_period is shown in Hebrew');
select is((select source from content.investment_tracks where fund_number = 'T4F1'), 'data.gov.il:gemelnet', 'source names the official dataset');
select ok((select specialization from content.investment_tracks where fund_number = 'T4F1')
          in ('general', 'stocks', 'bonds', 'bonds_tradable', 'money_market', 'foreign', 'index_tracking', 'halacha', 'sustainability',
              'guaranteed', 'combined_tradable', 'stocks_tradable', 'age_under_50', 'age_50_60', 'age_over_60', 'credit_bonds', 'other'),
          'specialization is a site value');
select is((select is_active from content.investment_tracks where fund_number = 'T4OLD'), false, 'a fund that left the feed is hidden, not deleted');
select is((select count(*)::int from content.investment_tracks where fund_number = 'T4OLD'), 1, 'hidden row still exists');
select ok(not exists (select 1 from content.investment_tracks t where t.is_active
                        and t.company not in (select slug from private.track_company_slugs)), 'every active row has a known slug');
select is((select company from content.investment_tracks where fund_number = 'BT4F1'), 'fenix',
          'an id shared by two datasets: the second dataset is keyed with its prefix, not dropped');
select is((select source from content.investment_tracks where fund_number = 'T4F1'), 'data.gov.il:gemelnet',
          'gemelnet keeps the plain id on a collision');
select ok((current_setting('t.r')::jsonb ->> 'collisions')::int >= 1, 'collisions are counted in the result');
select ok((current_setting('t.r')::jsonb ->> 'unmapped_funds')::int >= 1
          and (current_setting('t.r')::jsonb ->> 'unmapped_companies')::int >= 1, 'unmapped board companies/funds are reported');
select ok(exists (select 1 from pg_indexes where schemaname = 'private' and tablename = 'customers_migration_map'
                    and indexdef like '%(run_id)%'), 'migration map run_id FK is indexed');

-- ===== customers: retired sealed import, narrow procedure =====
select 'vault checked' from (select set_config('t.has_vault', (to_regclass('vault.secrets') is not null)::text, true)) s;
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

-- the sealed transport is retired: every call is refused before the argument is read
select throws_ok($q$select private.customers_import_sealed('x', 'b1', 1, md5('x'))$q$, 'PT410',
                 'retired:customers_import_sealed', 'the sealed import is retired');

-- synthetic rows through the T0 importer, then the narrow procedure
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else lives_ok($q$select set_config('t.res', private.customers_import('[
      {"legacy_id":"d0000000-0000-4000-8000-000000000001","first_name":"Synth","last_name":"Alpha","id_number":"000000018",
       "mobile_phone":"+972-50-000-0001","email":"a@example.com","details":{"city":"x","birth_date":"2000-01-01","gender":"z"}},
      {"legacy_id":"d0000000-0000-4000-8000-000000000002","first_name":"Synth","last_name":"Beta","id_number":"00000026",
       "details":{"gender":"z"}},
      {"legacy_id":"d0000000-0000-4000-8000-000000000003","first_name":"","last_name":"Gamma","id_number":"00000034"}]'::jsonb)::text, true)$q$,
      'synthetic customers import') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((current_setting('t.res')::jsonb) - 'invalid_ids', '{"received": 3, "inserted": 2, "skipped": 1, "invalid": 1}'::jsonb,
          'received 3, inserted 2, one invalid row skipped') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok((select mobile_phone = '0500000001' and private.pii_decrypt(national_id_enc) = '000000018'
             from crm.customers where legacy_id = 'd0000000-0000-4000-8000-000000000001'), 'phone normalised; national id decrypts to 9 digits') end;
select throws_ok($q$select private.customers_details_drop_keys(array['bank_account'])$q$, 'PT400', 'invalid_input:keys',
                 'narrow accepts only keys of the copied list');
select throws_ok($q$select private.customers_details_drop_keys('{}'::text[])$q$, 'PT400', 'invalid_input:keys', 'narrow needs a key');
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok((private.customers_details_drop_keys(array['birth_date', 'gender']) ->> 'updated')::int >= 2,
          'narrow re-encrypts every row that holds a rejected key') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((select private.pii_decrypt(details_enc)::jsonb from crm.customers where legacy_id = 'd0000000-0000-4000-8000-000000000001'),
          '{"city": "x"}'::jsonb, 'rejected keys are gone, approved keys stay') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else is((private.customers_details_drop_keys(array['birth_date']) ->> 'updated')::int, 0, 'narrow is idempotent') end;
select case when not current_setting('t.has_vault')::boolean then skip('Vault is not installed', 1)
  else ok(private.customers_checksum() ? 'content_md5', 'checksum reports counts and digests') end;

-- nobody but the owner can reach any of it
select ok(not has_function_privilege('service_role', 'private.customers_import_sealed(text,text,integer,text)', 'execute')
          and not has_function_privilege('authenticated', 'private.customers_import_sealed(text,text,integer,text)', 'execute')
          and not has_function_privilege('anon', 'private.customers_import_sealed(text,text,integer,text)', 'execute'), 'sealed import is owner-only');
select ok(not has_function_privilege('service_role', 'private.customers_checksum()', 'execute'), 'checksum is owner-only');
select ok(not has_function_privilege('service_role', 'private.customers_details_drop_keys(text[])', 'execute')
          and not has_function_privilege('authenticated', 'private.customers_details_drop_keys(text[])', 'execute')
          and not has_function_privilege('anon', 'private.customers_details_drop_keys(text[])', 'execute'), 'narrow is owner-only');
select ok(not has_table_privilege('service_role', 'private.customers_migration_map', 'select')
          and not has_table_privilege('authenticated', 'private.data_migration_runs', 'select'), 'map and run log are private');

select * from finish();
rollback;
