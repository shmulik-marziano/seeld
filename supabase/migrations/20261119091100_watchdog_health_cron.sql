-- V2-12 (ADR-27, ADR-28): silent-failure detection that cannot itself fail silently; coarse public health; cron 7 -> 5.
-- Delivery failures (outbox stuck, alerts undelivered, watchdog not running) surface through api.health.degraded,
-- which the GitHub site-watch workflow polls: that is the out-of-band channel when outbox -> notify-worker -> Resend is down.
-- Review fixes (round 2): watchdog step alerts carry only the SQLSTATE, never sqlerrm (an error text can hold row values and
-- alerts are e-mailed). The two ops.call_function crons below are no-ops while ops.config edge_cron_enabled = 'false'
-- (090700), so applying this file before the Vault secrets / Edge functions exist causes no 404s and no alerts.
-- Until the owner flips edge_cron_enabled on day 2, api.health reports degraded=true (watchdog alerts wait in the outbox
-- with no notify-worker draining it). That is expected and documented in the runbook.

-- HTTP layer only: functions answer 202 at once, so a timeout is not a job failure (job_not_finished covers that)
create or replace function ops.cron_http_audit()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform ops.raise_alert('warning', 'cron_http_failed',
    'cron http failures last 10m: ' || count(*) || ' first_status=' || coalesce(min(r.status_code)::text, 'none'),
    'cron_http_failed')
  from net._http_response r
  where r.created > now() - interval '10 minutes'
    and (r.status_code >= 400 or (r.status_code is null and not coalesce(r.timed_out, false)))
  having count(*) > 0;
end $$;

-- delivery/plumbing health only. Security alerts (auth bursts, locks) never flip the public flag.
create or replace function private.health_degraded()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from ops.outbox o
                  where (o.status = 'pending' and o.next_attempt_at < now() - interval '15 minutes')
                     or (o.status = 'processing' and o.locked_until < now() - interval '5 minutes')
                     or (o.status = 'dead' and o.processed_at > now() - interval '24 hours'))
      or exists (select 1 from ops.alerts a where a.status = 'pending' and a.at < now() - interval '30 minutes')
      or not exists (select 1 from ops.job_runs j
                      where j.job = 'ops-watchdog' and j.finished_at > now() - interval '30 minutes')
$$;
revoke all on function private.health_degraded() from public, anon, authenticated;

create or replace function ops.watchdog()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_run bigint; v_failed text[] := '{}'; v_copied integer := 0; v_fail integer; v_locked integer := 0; r record;
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
    if exists (select 1 from ops.job_runs j
                where j.finished_at is null and j.id <> v_run and j.started_at > now() - interval '1 day'
                  and j.started_at < now() - case j.job when 'notify-worker' then interval '5 minutes'
                                                        when 'ops-watchdog' then interval '5 minutes'
                                                        when 'fetch-cma-data' then interval '120 minutes'
                                                        else interval '30 minutes' end) then
      perform ops.raise_alert('warning', 'job_not_finished', 'a job run did not report job_finish in time', 'job_not_finished');
    end if;
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

  update ops.job_runs set finished_at = now(), ok = cardinality(v_failed) = 0,
         stats = jsonb_build_object('failed_steps', to_jsonb(v_failed), 'auth_events_copied', v_copied, 'locked', v_locked)
   where id = v_run;
  return jsonb_build_object('ok', cardinality(v_failed) = 0, 'failed_steps', to_jsonb(v_failed),
                            'auth_events_copied', v_copied, 'locked', v_locked);
end $$;

create or replace function api.health()
returns jsonb language sql stable security definer set search_path = '' as $$
  with c as (select max(finished_at) t from ops.job_runs where job = 'fetch-cma-data' and ok)
  select jsonb_build_object(
    'ok', true,
    'degraded', private.health_degraded(),
    'cma_age_bucket', case when c.t is null then 'none'
                           when c.t > now() - interval '8 days' then 'fresh'
                           when c.t > now() - interval '35 days' then 'aging'
                           else 'stale' end)
  from c
$$;
revoke all on function api.health() from public;
grant execute on function api.health() to anon, authenticated, service_role;

create or replace function staff.ops_health()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff();
begin
  return jsonb_build_object(
    'degraded', private.health_degraded(),
    'outbox_pending', (select count(*) from ops.outbox where status in ('pending', 'processing')),
    'outbox_dead', (select count(*) from ops.outbox where status = 'dead'),
    'alerts_pending', (select count(*) from ops.alerts where status = 'pending'),
    'last_runs', (select coalesce(jsonb_object_agg(j.job, jsonb_build_object('started_at', j.started_at, 'finished_at', j.finished_at, 'ok', j.ok)), '{}'::jsonb)
                    from (select distinct on (job) job, started_at, finished_at, ok from ops.job_runs order by job, started_at desc) j),
    'cma_last_ok', (select max(finished_at) from ops.job_runs where job = 'fetch-cma-data' and ok),
    'tracks_last_sync', (select max(last_sync) from content.investment_tracks where is_active),
    'auth_failures_24h', (select count(*) from audit.auth_events where not ok and at > now() - interval '24 hours'),
    'auth_detection_verified', coalesce((select value from ops.config where key = 'auth_failure_actions'), '') <> '');
end $$;
revoke all on function ops.cron_http_audit(), ops.watchdog() from public, anon, authenticated;
revoke all on function staff.ops_health() from public, anon;
grant execute on function staff.ops_health() to authenticated;

-- cron 7 -> 5. Supersedes the header comment of 20261118162656 (applied files are never edited).
select cron.unschedule(jobid) from cron.job where jobname = 'cma-refresh-views-daily';
select cron.schedule('notify-worker-tick', '* * * * *', $$select ops.call_function('notify-worker')$$);
select cron.schedule('cma-sync-weekly', '0 3 * * 0', $$select ops.call_function('fetch-cma-data')$$);
select cron.schedule('ops-watchdog', '*/10 * * * *', 'select ops.watchdog()');
comment on function content.refresh_fund_views() is 'Called only by the ops.watchdog step cma_refresh after api.cma_finish_sync flags a successful load. No daily job since v2.';
