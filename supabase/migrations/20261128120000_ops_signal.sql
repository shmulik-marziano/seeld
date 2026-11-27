-- Operations signal (review 2026-11-27; aggregates seen in production the same day).
--
-- 1. Alert noise: about 20 job_not_finished e-mails a day (85 in 5 days). Every late run re-raised the same alert every hour
--    for 24 hours; sms-health and surense-probe (run by hand through ops.call_function) never closed their runs; a few
--    pg_net calls timed out on DNS and stayed open. Now: a late run whose HTTP call failed is closed with the reason, the
--    rest raise one alert per job per 24 h naming the job, and both probes call api.job_finish (code in this PR).
-- 2. Nobody watched the SMS provider: the Micropay token was wrong for about 2.5 days (sms-health by hand on 11-24..11-26)
--    and client logins would have answered `unavailable`. sms-health now runs hourly and reports through api.sms_report,
--    which raises a critical sms_unavailable (once per 6 h) or a warning sms_low_credit (once per 24 h, threshold in
--    ops.config sms_low_credit_threshold). client-area reports a failed login SMS the same way.
-- ops.watchdog is re-created in full from 20261121150000 (applied files are never edited); only the jobs step changed.

-- the budget after which an open run is late (the CASE of the old jobs step)
create or replace function ops.job_budget(p_job text)
returns interval language sql immutable set search_path = '' as $$
  select case p_job when 'notify-worker' then interval '5 minutes'
                    when 'surense-worker' then interval '5 minutes'
                    when 'ops-watchdog' then interval '5 minutes'
                    when 'fetch-cma-data' then interval '120 minutes'
                    else interval '30 minutes' end
$$;
revoke all on function ops.job_budget(text) from public, anon, authenticated;

insert into ops.config (key, value) values ('sms_low_credit_threshold', '200') on conflict (key) do nothing;

-- the SMS provider's health, reported by sms-health (hourly) and by client-area when a login SMS fails. Codes only.
create or replace function api.sms_report(p_ok boolean, p_code text default null, p_credit integer default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_min integer;
begin
  if p_ok is null then raise exception 'invalid_input:ok' using errcode = 'PT400'; end if;
  if p_code is not null and p_code !~ '^[a-z0-9_]{1,40}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  if not p_ok then
    perform ops.raise_alert('critical', 'sms_unavailable',
      'SMS provider failed (' || coalesce(p_code, 'unknown') || '): client logins get no code until it is fixed; run sms-health after the fix',
      'sms_unavailable', interval '6 hours');
    return;
  end if;
  v_min := coalesce(nullif((select c.value from ops.config c where c.key = 'sms_low_credit_threshold'), '')::integer, 200);
  if p_credit is not null and p_credit < v_min then
    perform ops.raise_alert('warning', 'sms_low_credit', 'SMS credit is ' || p_credit || ' (threshold ' || v_min || '): top up at Micropay',
                            'sms_low_credit', interval '24 hours');
  end if;
end $$;
revoke all on function api.sms_report(boolean, text, integer) from public, anon, authenticated;
grant execute on function api.sms_report(boolean, text, integer) to service_role;

create or replace function ops.watchdog()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_run bigint; v_failed text[] := '{}'; v_copied integer := 0; v_fail integer; v_locked integer := 0; r record;
  v_n bigint; v_min bigint; v_poa_first uuid; v_late record; v_close record;
  v_actions text := coalesce((select value from ops.config where key = 'auth_failure_actions'), '');
begin
  insert into ops.job_runs (job) values ('ops-watchdog') returning id into v_run;

  begin
    perform ops.cron_http_audit();
  exception when others then
    v_failed := v_failed || 'cron_http_audit'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'cron_http_audit: SQLSTATE ' || sqlstate, 'watchdog_step:cron_http_audit', interval '24 hours');
  end;

  begin
    v_copied := ops.copy_auth_events();
  exception when others then
    v_failed := v_failed || 'copy_auth_events'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'copy_auth_events: SQLSTATE ' || sqlstate, 'watchdog_step:copy_auth_events', interval '24 hours');
  end;

  begin
    if exists (select 1 from ops.outbox o
                where (o.status = 'pending' and o.next_attempt_at < now() - interval '15 minutes')
                   or (o.status = 'processing' and o.locked_until < now() - interval '5 minutes')) then
      perform ops.raise_alert('critical', 'outbox_backlog', 'outbox rows overdue > 15 min (worker not draining)', 'outbox_backlog');
    end if;
    if exists (select 1 from ops.outbox o where o.status = 'pending' and o.attempts >= 3) then
      perform ops.raise_alert('warning', 'outbox_retrying', 'outbox rows on their 3rd+ attempt', 'outbox_retrying', interval '6 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'outbox'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'outbox: SQLSTATE ' || sqlstate, 'watchdog_step:outbox', interval '24 hours');
  end;

  begin
    -- 20261128120000: a late run whose HTTP call timed out or failed is closed with that reason (the next tick runs again);
    -- past its budget, a function that was reached would have finished. Five such closures in an hour raise one warning.
    -- (alias h, not r: r is this function's record variable, and r.id would read it)
    for v_close in
      select j.id, case when coalesce(h.timed_out, false) then 'http_timeout' else 'http_' || coalesce(h.status_code::text, 'error') end as reason
        from ops.job_runs j join net._http_response h on h.id = j.request_id
       where j.finished_at is null and j.id <> v_run
         and j.started_at < now() - ops.job_budget(j.job)
         and (coalesce(h.timed_out, false) or h.status_code is null or h.status_code >= 400)
    loop
      update ops.job_runs set finished_at = now(), ok = false, error = v_close.reason where id = v_close.id and finished_at is null;
    end loop;
    if (select count(*) from ops.job_runs j
         where j.error = 'http_timeout' and j.started_at > now() - interval '3 hours' and j.finished_at > now() - interval '1 hour') >= 5 then
      perform ops.raise_alert('warning', 'cron_http_timeouts', '5+ cron calls closed as http_timeout in the last hour', 'cron_http_timeouts',
                              interval '6 hours');
    end if;
    -- any other late run: one alert per job per 24 h with the job name and count (was one every hour for 24 h after each run)
    for v_late in
      select j.job, count(*)::int as n from ops.job_runs j
       where j.finished_at is null and j.id <> v_run and j.started_at > now() - interval '1 day'
         and j.started_at < now() - ops.job_budget(j.job)
       group by j.job order by j.job
    loop
      perform ops.raise_alert('warning', 'job_not_finished', v_late.job || ': ' || v_late.n || ' run(s) did not report job_finish in time',
                              'job_not_finished:' || v_late.job, interval '24 hours');
    end loop;
    if exists (select 1 from ops.job_runs where job = 'fetch-cma-data')
       and not exists (select 1 from ops.job_runs where job = 'fetch-cma-data' and ok and finished_at > now() - interval '8 days') then
      perform ops.raise_alert('warning', 'cma_stale', 'no successful fetch-cma-data run in 8 days', 'cma_stale', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'jobs'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'jobs: SQLSTATE ' || sqlstate, 'watchdog_step:jobs', interval '24 hours');
  end;

  -- refresh after a successful load (flag set by api.cma_finish_sync); runs here because pg_cron has no PostgREST timeout
  begin
    if private.flag('cma_refresh_pending') then
      declare v_r bigint; v_t jsonb;
      begin
        insert into ops.job_runs (job) values ('cma-refresh') returning id into v_r;
        perform content.refresh_fund_views();
        v_t := content.refresh_investment_tracks();
        update ops.config set value = 'false', updated_at = now() where key = 'cma_refresh_pending';
        update ops.job_runs set finished_at = now(), ok = true, stats = jsonb_build_object('tracks', v_t) where id = v_r;
      end;
    end if;
    if private.flag('tracks_sync_enabled')
       and exists (select 1 from content.investment_tracks where is_active)
       and (select max(last_sync) from content.investment_tracks where is_active) < now() - interval '9 days' then
      perform ops.raise_alert('warning', 'tracks_stale', 'investment_tracks not refreshed for 9 days', 'tracks_stale', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'cma_refresh'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'cma_refresh: SQLSTATE ' || sqlstate, 'watchdog_step:cma_refresh', interval '24 hours');
  end;

  begin
    -- rejected requests roll back inside submit_lead; lead-intake records them via api.intake_note_reject (separate request)
    if (select coalesce(sum(hits), 0) from ops.rate_limits where bucket = 'intake_reject' and window_start > now() - interval '1 hour') >= 200 then
      perform ops.raise_alert('warning', 'intake_rejects', '200+ rejected intake requests in the last hour', 'intake_rejects');
    end if;
    if (select coalesce(max(hits), 0) from ops.rate_limits where bucket = 'lead_all' and window_start > now() - interval '1 hour') >= 250 then
      perform ops.raise_alert('warning', 'intake_near_cap', 'accepted leads at 250 of the 300/hour cap; real visitors are next', 'intake_near_cap');
    end if;
  exception when others then
    v_failed := v_failed || 'intake'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'intake: SQLSTATE ' || sqlstate, 'watchdog_step:intake', interval '24 hours');
  end;

  begin
    if v_actions = '' then
      perform ops.raise_alert('warning', 'auth_failure_detection_unverified',
        'auth_failure_actions is empty: failed-login detection and auto-lock are OFF until verified on a branch',
        'auth_failure_detection_unverified', interval '24 hours');
    end if;
    if exists (select 1 from core.staff where active)
       and not exists (select 1 from audit.auth_events where source = 'gotrue' and at > now() - interval '7 days') then
      perform ops.raise_alert('warning', 'auth_feed_silent', 'no GoTrue audit event copied in 7 days', 'auth_feed_silent', interval '24 hours');
    end if;
    if v_actions <> '' then
      select count(*) into v_fail from audit.auth_events where not ok and at > now() - interval '15 minutes';
      if v_fail >= 30 then
        perform ops.raise_alert('critical', 'auth_failure_burst', v_fail || ' auth failures in 15 min', 'auth_burst_critical');
      elsif v_fail >= 10 then
        perform ops.raise_alert('warning', 'auth_failure_burst', v_fail || ' auth failures in 15 min', 'auth_burst_warning');
      end if;
    end if;
    if v_actions <> '' and private.flag('auth_lock_enabled') then
      for r in
        select e.user_id, s.role, count(*) as n, count(distinct e.ip_hash) as ips
          from audit.auth_events e join core.staff s on s.user_id = e.user_id and s.active
         where not e.ok and e.source = 'gotrue' and e.at > now() - interval '15 minutes'
           and (s.locked_until is null or s.locked_until < now())
         group by e.user_id, s.role having count(*) >= 10
      loop
        if r.role = 'admin' or r.ips < 2 then
          -- admins are never auto-locked (a locked last admin has no way back); single-source bursts are left to GoTrue limits + CAPTCHA
          perform ops.raise_alert('critical', 'staff_failures', r.role || ' account: ' || r.n || ' failures in 15 min (not locked)',
                                  'staff_failures:' || r.user_id);
        else
          update core.staff set locked_until = now() + interval '30 minutes' where user_id = r.user_id;
          insert into audit.log (actor, actor_role, table_name, op, pk, changed_cols, new_data)
          values (null, 'watchdog', 'core.staff', 'ACTION', r.user_id::text, array['locked_until'],
                  jsonb_build_object('action', 'staff_auto_lock', 'failures', r.n));
          perform ops.raise_alert('critical', 'staff_locked', 'staff account locked 30 min after ' || r.n || ' failures', 'staff_locked:' || r.user_id);
          v_locked := v_locked + 1;
        end if;
      end loop;
    end if;
  exception when others then
    v_failed := v_failed || 'auth'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'auth: SQLSTATE ' || sqlstate, 'watchdog_step:auth', interval '24 hours');
  end;

  -- Surense connector (20261120200000). Ids and counts only, never a payload or a name.
  begin
    select count(*), min(j.id) into v_n, v_min from ops.surense_jobs j
     where j.status = 'pending' and j.next_attempt_at < now() - interval '15 minutes';
    if v_n > 0 then
      perform ops.raise_alert('critical', 'surense_backlog',
        'surense jobs pending > 15 min past due: count=' || v_n || ' oldest_id=' || v_min || ' (worker not draining)', 'surense_backlog');
    end if;
    select count(*), min(j.id) into v_n, v_min from ops.surense_jobs j
     where j.status = 'processing' and j.locked_until < now() - interval '10 minutes';
    if v_n > 0 then
      perform ops.raise_alert('critical', 'surense_job_stuck',
        'surense jobs processing with a lock expired > 10 min: count=' || v_n || ' oldest_id=' || v_min, 'surense_job_stuck');
    end if;
    select count(*), min(j.id) into v_n, v_min from ops.surense_jobs j
     where j.status = 'dead' and j.processed_at > now() - interval '24 hours';
    if v_n > 0 then
      perform ops.raise_alert('warning', 'surense_dead_24h', 'surense dead jobs in 24h: count=' || v_n || ' first_id=' || v_min,
                              'surense_dead_24h', interval '24 hours');
    end if;
    -- silence: the webhook switch has been on for 24h+ and no event arrived in 24h (Svix endpoint disabled, secret drift)
    if private.flag('surense_webhook_enabled')
       and (select c.updated_at from ops.config c where c.key = 'surense_webhook_enabled') < now() - interval '24 hours'
       and not exists (select 1 from ops.surense_events e where e.received_at > now() - interval '24 hours') then
      perform ops.raise_alert('warning', 'surense_events_silent', 'no surense webhook event in 24h while surense_webhook_enabled is on',
                              'surense_events_silent', interval '24 hours');
    end if;
    -- intake left off: only once the connector is in use (surense_enabled on), else this would fire daily before go-live
    if private.flag('surense_enabled') and not private.flag('surense_webhook_enabled')
       and coalesce((select c.updated_at from ops.config c where c.key = 'surense_webhook_enabled'), '-infinity') < now() - interval '24 hours' then
      perform ops.raise_alert('warning', 'surense_webhook_off', 'surense_webhook_enabled is off for more than 24h while surense_enabled is on',
                              'surense_webhook_off', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'surense'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'surense: SQLSTATE ' || sqlstate, 'watchdog_step:surense', interval '24 hours');
  end;


  -- POA wizard (20261121150000). Ids and counts only.
  begin
    select count(*), (array_agg(x.id order by x.completed_at, x.id))[1] into v_n, v_poa_first
      from crm.poa_sessions x
     where x.status = 'completed' and x.completed_at < now() - interval '1 hour'
       and (select count(*) from crm.documents d where d.session_id = x.id and d.status <> 'revoked') < private.poa_enabled_count(x.modules);
    if v_n > 0 then
      perform ops.raise_alert('warning', 'poa_docs_missing',
        'poa sessions completed >1h ago with documents missing: count=' || v_n || ' first_id=' || v_poa_first, 'poa_docs_missing', interval '24 hours');
    end if;
  exception when others then
    v_failed := v_failed || 'poa'::text;
    perform ops.raise_alert('warning', 'watchdog_step_failed', 'poa: SQLSTATE ' || sqlstate, 'watchdog_step:poa', interval '24 hours');
  end;

  update ops.job_runs set finished_at = now(), ok = cardinality(v_failed) = 0,
         stats = jsonb_build_object('failed_steps', to_jsonb(v_failed), 'auth_events_copied', v_copied, 'locked', v_locked)
   where id = v_run;
  return jsonb_build_object('ok', cardinality(v_failed) = 0, 'failed_steps', to_jsonb(v_failed),
                            'auth_events_copied', v_copied, 'locked', v_locked);
end $$;

revoke all on function ops.watchdog() from public, anon, authenticated;

-- hourly provider probe (balance only, sends nothing); a no-op while edge_cron_enabled is off
select cron.schedule('sms-health-hourly', '41 * * * *', $$select ops.call_function('sms-health')$$);
