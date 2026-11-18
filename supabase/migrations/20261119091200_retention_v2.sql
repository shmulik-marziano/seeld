-- V2-13 (ADR-34): retention for audit (25 months) and for every new table; lead retention behind a switch (owner decision).
insert into ops.config (key, value) values ('lead_retention_enabled', 'false') on conflict (key) do nothing;

create or replace function ops.cleanup()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  n_rate bigint; n_outbox bigint; n_dead bigint; n_idem bigint; n_jobs bigint; n_alerts bigint; n_alerts_stuck bigint;
  n_chat_m bigint; n_chat_s bigint; n_inv bigint; n_audit bigint; n_access bigint; n_auth bigint; n_cron bigint := 0;
  n_lead_soft bigint := 0; n_lead_hard bigint := 0;
begin
  delete from ops.rate_limits where window_start < now() - interval '2 days';
  get diagnostics n_rate = row_count;
  delete from ops.outbox where status = 'sent' and processed_at < now() - interval '14 days';
  get diagnostics n_outbox = row_count;
  delete from ops.outbox where status = 'dead' and processed_at < now() - interval '30 days';
  get diagnostics n_dead = row_count;
  delete from ops.idempotency_keys where created_at < now() - interval '48 hours';
  get diagnostics n_idem = row_count;
  -- successful notify-worker ticks (1,440/day) are kept 7 days; everything else 90 days
  delete from ops.job_runs where started_at < now() - interval '90 days'
     or (job = 'notify-worker' and ok and started_at < now() - interval '7 days');
  get diagnostics n_jobs = row_count;
  delete from ops.alerts where status <> 'pending' and at < now() - interval '90 days';
  get diagnostics n_alerts = row_count;
  delete from ops.alerts where status = 'pending' and at < now() - interval '30 days';
  get diagnostics n_alerts_stuck = row_count;
  delete from crm.chat_messages where created_at < now() - interval '90 days';
  get diagnostics n_chat_m = row_count;
  delete from crm.chat_sessions where last_seen_at < now() - interval '90 days';
  get diagnostics n_chat_s = row_count;
  -- invitations hold e-mail addresses: unused ones go 30 days after expiry, accepted ones after 90 days
  delete from core.invitations
   where (accepted_at is null and expires_at < now() - interval '30 days') or accepted_at < now() - interval '90 days';
  get diagnostics n_inv = row_count;

  perform set_config('audit.allow_purge', 'on', true);
  delete from audit.log where at < now() - interval '25 months';
  get diagnostics n_audit = row_count;
  delete from audit.access_log where at < now() - interval '25 months';
  get diagnostics n_access = row_count;
  delete from audit.auth_events where at < now() - interval '25 months';
  get diagnostics n_auth = row_count;
  perform set_config('audit.allow_purge', 'off', true);

  if private.flag('lead_retention_enabled') then
    update crm.leads set deleted_at = now()
     where deleted_at is null and status in ('lost', 'spam') and updated_at < now() - interval '24 months';
    get diagnostics n_lead_soft = row_count;
    -- any status: a lead soft-deleted by staff (or by the rule above) is hard-deleted 12 months later
    delete from crm.leads where deleted_at is not null and deleted_at < now() - interval '12 months';
    get diagnostics n_lead_hard = row_count;
  end if;

  if to_regclass('cron.job_run_details') is not null then
    delete from cron.job_run_details where end_time < now() - interval '7 days';
    get diagnostics n_cron = row_count;
  end if;

  if n_alerts_stuck > 0 then
    perform ops.raise_alert('warning', 'alerts_purged_undelivered', n_alerts_stuck || ' alerts were still pending after 30 days and were purged',
                            'alerts_purged_undelivered', interval '24 hours');
  end if;

  return jsonb_build_object('rate_limits', n_rate, 'outbox', n_outbox, 'outbox_dead', n_dead, 'idempotency', n_idem,
    'job_runs', n_jobs, 'alerts', n_alerts, 'alerts_stuck', n_alerts_stuck, 'chat_messages', n_chat_m, 'chat_sessions', n_chat_s,
    'invitations', n_inv, 'audit', n_audit, 'access_log', n_access, 'auth_events', n_auth, 'cron_runs', n_cron,
    'leads_soft', n_lead_soft, 'leads_hard', n_lead_hard);
end $$;
revoke all on function ops.cleanup() from public, anon, authenticated;
grant execute on function ops.cleanup() to service_role;
