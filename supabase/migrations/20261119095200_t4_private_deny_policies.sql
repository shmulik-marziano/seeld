-- T4: explicit deny policies on the three private tables added by 095000/095100 (same pattern as crm.customers), so the
-- advisor list stays at the documented 0028/0029 set (no 0008 rls_enabled_no_policy). The tables already have RLS on and
-- no grants to any API role; this only makes the intent explicit.
create policy deny_api_roles on private.track_company_slugs for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on private.data_migration_runs for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on private.customers_migration_map for all to anon, authenticated using (false) with check (false);
