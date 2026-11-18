-- 08: retention (091200). ops.cleanup purges exactly what the policy says and nothing newer. Runs as postgres.
begin;
select no_plan();

-- audit: 25 months
insert into audit.log (at, table_name, op) values (now() - interval '24 months', 'test.keep', 'ACTION'), (now() - interval '26 months', 'test.purge', 'ACTION');
insert into audit.access_log (at, action, subject) values (now() - interval '24 months', 'keep', 'test'), (now() - interval '26 months', 'purge', 'test');
insert into audit.auth_events (at, kind, ok, source) values (now() - interval '24 months', 'keep', true, 'hook'), (now() - interval '26 months', 'purge', true, 'hook');
-- ops
insert into ops.idempotency_keys (key, request_hash, response, created_at) values
  ('idem-keep-0001', '\x00', '{}', now() - interval '47 hours'), ('idem-purge-001', '\x00', '{}', now() - interval '49 hours');
insert into ops.job_runs (job, started_at, finished_at, ok) values
  ('notify-worker', now() - interval '8 days', now() - interval '8 days', true),
  ('notify-worker', now() - interval '6 days', now() - interval '6 days', true),
  ('notify-worker', now() - interval '8 days', now() - interval '8 days', false),
  ('fetch-cma-data', now() - interval '89 days', now() - interval '89 days', true),
  ('fetch-cma-data', now() - interval '91 days', now() - interval '91 days', true);
insert into ops.alerts (at, severity, kind, summary, status) values
  (now() - interval '91 days', 'info', 'sent_old', 's', 'sent'),
  (now() - interval '91 days', 'info', 'undeliverable_old', 's', 'undeliverable'),
  (now() - interval '89 days', 'info', 'sent_recent', 's', 'sent'),
  (now() - interval '31 days', 'info', 'pending_stuck', 's', 'pending');
insert into ops.outbox (topic, status, processed_at) values ('t', 'dead', now() - interval '31 days'), ('t', 'dead', now() - interval '29 days'),
  ('t', 'sent', now() - interval '15 days');
-- invitations
insert into core.invitations (email, kind, role, agency_id, expires_at, accepted_at) values
  ('unused-old@example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001', now() - interval '31 days', null),
  ('unused-recent@example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001', now() - interval '29 days', null),
  ('accepted-old@example.com', 'staff', 'agent', '5eed0000-0000-4000-8000-000000000001', now() - interval '100 days', now() - interval '91 days');
-- leads: soft-deleted 13 months ago
insert into crm.leads (agency_id, kind, full_name, phone, consent_at, consent_version, deleted_at) values
  ('5eed0000-0000-4000-8000-000000000001', 'contact', 'Old Deleted', '0501234567', now(), 'v1', now() - interval '13 months');

select set_config('t.r1', ops.cleanup()::text, true);
select is((select count(*)::int from audit.log where table_name = 'test.keep'), 1, 'audit row at 24 months kept');
select is((select count(*)::int from audit.log where table_name = 'test.purge'), 0, 'audit row at 26 months purged');
select is((select count(*)::int from audit.access_log where subject = 'test'), 1, 'access_log: 24 months kept, 26 purged');
select is((select count(*)::int from audit.auth_events where kind in ('keep', 'purge')), 1, 'auth_events: 24 months kept, 26 purged');
select is((select string_agg(key, ',') from ops.idempotency_keys), 'idem-keep-0001', 'idempotency 49h purged, 47h kept');
select is((select count(*)::int from ops.job_runs where job = 'notify-worker'), 2, 'ok notify-worker run 8d purged; 6d and failed 8d kept');
select is((select count(*)::int from ops.job_runs where job = 'fetch-cma-data'), 1, 'other jobs kept 90 days');
select is((select string_agg(kind, ',' order by kind) from ops.alerts where kind <> 'alerts_purged_undelivered'), 'sent_recent', 'sent 91d and undeliverable 91d purged; stuck pending >30d purged');
select is((select count(*)::int from ops.alerts where kind = 'pending_stuck'), 0, 'stuck pending alert purged');
select ok((current_setting('t.r1')::jsonb ->> 'alerts_stuck')::int = 1, 'the purge of a stuck alert is counted');
select is((select count(*)::int from ops.outbox where status = 'dead'), 1, 'dead outbox 31d purged, 29d kept');
select is((select count(*)::int from ops.outbox where status = 'sent'), 0, 'sent outbox 15d purged');
select is((select string_agg(email, ',') from core.invitations), 'unused-recent@example.com', 'expired 31d and accepted 91d invitations purged');
select is((select count(*)::int from crm.leads where full_name = 'Old Deleted'), 1, 'soft-deleted lead kept while lead_retention_enabled is false');

update ops.config set value = 'true' where key = 'lead_retention_enabled';
select lives_ok($$select ops.cleanup()$$, 'cleanup with lead retention on');
select is((select count(*)::int from crm.leads where full_name = 'Old Deleted'), 0, 'soft-deleted lead purged after 12 months when the flag is true');
select ok(exists (select 1 from ops.alerts where kind = 'alerts_purged_undelivered'), 'purged stuck alerts raise a warning');

select * from finish();
rollback;
