-- 15: cron secret from the Vault + licensee in ops.config (20261123150000). Synthetic values only. Runs as postgres.
begin;
select no_plan();

select set_config('t.has_vault', (to_regclass('vault.secrets') is not null)::text, true);
select ok(current_setting('t.has_vault')::boolean, 'Vault is present');

-- a test secret of our own (the local database has no edge_cron_secret unless an earlier test made one)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'edge_cron_secret') then
    perform vault.create_secret('test-cron-secret-0123456789abcdef', 'edge_cron_secret');
  else
    perform vault.update_secret((select id from vault.secrets where name = 'edge_cron_secret'), 'test-cron-secret-0123456789abcdef');
  end if;
end $$;

select has_function('api', 'cron_secret_ok', array['text'], 'api.cron_secret_ok exists');
select ok(has_function_privilege('service_role', 'api.cron_secret_ok(text)', 'execute'), 'cron_secret_ok: service_role');
select ok(not has_function_privilege('anon', 'api.cron_secret_ok(text)', 'execute') and not has_function_privilege('authenticated', 'api.cron_secret_ok(text)', 'execute'), 'cron_secret_ok: not for API roles');
select is(api.cron_secret_ok('test-cron-secret-0123456789abcdef'), true, 'the Vault value is accepted');
select is(api.cron_secret_ok('test-cron-secret-0123456789abcdeX'), false, 'a different value is refused');
select is(api.cron_secret_ok(null), false, 'null is refused');
select is(api.cron_secret_ok('short'), false, 'a short value is refused without touching the Vault');
select is(api.cron_secret_ok(repeat('a', 257)), false, 'an oversized value is refused');

-- licensee rows exist and reach api.poa_config
select is((select count(*) from ops.config where key in ('poa_licensee_name', 'poa_licensee_license', 'poa_licensee_phone', 'poa_licensee_email')), 4::bigint, 'four licensee rows');
update ops.config set value = 'Zz Agent' where key = 'poa_licensee_name';
update ops.config set value = 'L-00000000' where key = 'poa_licensee_license';
update ops.config set value = '050-000-0000' where key = 'poa_licensee_phone';
update ops.config set value = 'agent@example.com' where key = 'poa_licensee_email';
select is(api.poa_config() -> 'licensee', '{"name": "Zz Agent", "license": "L-00000000", "phone": "050-000-0000", "email": "agent@example.com"}'::jsonb, 'poa_config carries the licensee');
select ok(not has_function_privilege('anon', 'api.poa_config()', 'execute'), 'poa_config stays service-only');

select * from finish();
rollback;
