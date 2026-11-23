-- 2026-11-23: two manual steps that were never completed kept the POA flow from working end to end, so both become
-- database state that the owner (or a session with the MCP) edits directly, with no function secret involved:
--   1. api.cron_secret_ok(p_secret)  the cron-invoked functions ask the database whether the presented x-cron-secret equals
--      Vault 'edge_cron_secret' (constant-time digest comparison). EDGE_CRON_SECRET stays as a fast path when it is set and
--      equal; the Vault is the single source of truth. service_role only; never returns the secret.
--   2. ops.config poa_licensee_name / _license / _phone / _email  the licence holder printed by the native engine, returned by
--      api.poa_config as 'licensee' (service_role only). The POA_LICENSEE_* function secrets remain as a fallback.
-- Nothing here deletes anything. Applying needs no secret.

create or replace function api.cron_secret_ok(p_secret text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_secret text;
begin
  if p_secret is null or length(p_secret) < 16 or length(p_secret) > 256 then return false; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'edge_cron_secret';
  if v_secret is null then return false; end if;
  return extensions.digest(p_secret, 'sha256') = extensions.digest(v_secret, 'sha256');
end $$;
comment on function api.cron_secret_ok(text) is 'cron-invoked functions: does the presented x-cron-secret equal Vault edge_cron_secret (digest comparison, never returns the secret)';
revoke all on function api.cron_secret_ok(text) from public, anon, authenticated;
grant execute on function api.cron_secret_ok(text) to service_role;

insert into ops.config (key, value) values
  ('poa_licensee_name', ''), ('poa_licensee_license', ''), ('poa_licensee_phone', ''), ('poa_licensee_email', '')
on conflict (key) do nothing;

create or replace function api.poa_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'poa_enabled', private.flag('poa_enabled'),
    'engine', case when (select c.value from ops.config c where c.key = 'poa_engine') = 'native' then 'native' else 'surense' end,
    'turnstile_required', coalesce((select c.value from ops.config c where c.key = 'poa_turnstile_required'), 'true') <> 'false',
    'modules', jsonb_build_object('maslaka', private.flag('poa_module_maslaka'), 'harbit', private.flag('poa_module_harbit'),
                                  'policies', private.flag('poa_module_policies')),
    'licensee', jsonb_build_object(
      'name', (select c.value from ops.config c where c.key = 'poa_licensee_name'),
      'license', (select c.value from ops.config c where c.key = 'poa_licensee_license'),
      'phone', (select c.value from ops.config c where c.key = 'poa_licensee_phone'),
      'email', (select c.value from ops.config c where c.key = 'poa_licensee_email')))
$$;
revoke all on function api.poa_config() from public, anon, authenticated;
grant execute on function api.poa_config() to service_role;
