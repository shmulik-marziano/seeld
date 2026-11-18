-- FOUNDATION 08: say "no" explicitly on tables that only service_role / definer functions may touch.
-- RLS-with-no-policy already denies, but an explicit deny policy documents intent and silences advisor lint 0008.
create policy deny_api_roles on audit.log        for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.config       for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.outbox       for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.rate_limits  for all to anon, authenticated using (false) with check (false);
