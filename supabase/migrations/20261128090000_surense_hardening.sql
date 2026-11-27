-- Surense connector hardening (review 2026-11-27; aggregates seen in production the same day).
--
-- 1. The daily sweep re-pulled every customer without a production snapshot every day: 129 of 250 customers (pre-advice
--    only, or no portfolio data at all), 578 duplicate pre-advice snapshots in a week (~4 MB a day) and as many extra
--    Surense calls. A customer whose pull ran (any outcome) within min(p_max_age_days, 7) days is no longer due; the
--    production age rule is unchanged. The pull's dedupe key is 'portfolio:<customer id>' (jobs.ts portfolioNext).
-- 2. A write whose outcome is unknown (timed out, lost connection, 502/504; client.ts flags it ambiguous) is no longer
--    retried by the queue (jobs.ts failureOutcome ends it skipped with code ambiguous_*): retrying could create a second
--    customer, send a second consent SMS or a second clearing-house request. Ending it raises a warning alert so staff
--    check Surense before shipping again.
-- `create or replace` keeps the existing grants of both functions.

create index if not exists surense_jobs_dedupe_created_idx on ops.surense_jobs (dedupe_key, created_at desc) where dedupe_key is not null;

create or replace function api.surense_portfolio_due(p_max_age_days integer default 30, p_limit integer default 200)
returns table (surense_id uuid) language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.kill_switch('surense_enabled');
  perform private.kill_switch('surense_portfolio_enabled');
  if p_max_age_days is null or p_max_age_days not between 1 and 365 then raise exception 'invalid_input:max_age_days' using errcode = 'PT400'; end if;
  return query
    select c.id
      from crm.surense_customers c
      left join lateral (select max(p.fetched_at) as fetched_at
                           from crm.surense_portfolios p
                          where p.customer_surense_id = c.id and p.mode = 'production') lp on true
     where c.deleted_at is null
       and (lp.fetched_at is null or lp.fetched_at < now() - make_interval(days => p_max_age_days))
       and not exists (select 1 from ops.surense_jobs j
                        where j.dedupe_key = 'portfolio:' || c.id::text
                          and j.created_at > now() - make_interval(days => least(p_max_age_days, 7)))
     order by lp.fetched_at asc nulls first, c.id
     limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end $$;

create or replace function api.surense_job_complete(p_id bigint, p_attempts integer, p_result text, p_error text default null,
                                                    p_error_kind text default null, p_retry_after integer default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_attempts integer; v_kind text; v_event bigint; v_delay interval; v_after interval;
begin
  if p_attempts is null then raise exception 'invalid_input:attempts' using errcode = 'PT400'; end if;
  if p_result is null or p_result not in ('done', 'skipped', 'failed') then raise exception 'invalid_input:result' using errcode = 'PT400'; end if;
  if p_error is not null and p_error !~ '^[A-Za-z0-9_.:-]{1,200}$' then raise exception 'invalid_input:error' using errcode = 'PT400'; end if;
  if p_error_kind is not null and p_error_kind not in ('rate_limited', 'unavailable', 'auth', 'permanent', 'config', 'db', 'storage', 'input', 'internal') then
    raise exception 'invalid_input:error_kind' using errcode = 'PT400';
  end if;
  if p_retry_after is not null and p_retry_after not between 0 and 86400 then raise exception 'invalid_input:retry_after' using errcode = 'PT400'; end if;
  select j.attempts, j.kind, j.event_id into v_attempts, v_kind, v_event from ops.surense_jobs j
   where j.id = p_id and j.status = 'processing' and j.attempts = p_attempts for update;
  if v_attempts is null then return; end if;
  if p_result in ('done', 'skipped') then
    update ops.surense_jobs set status = p_result, processed_at = now(), locked_until = null, last_error = p_error,
           last_error_kind = p_error_kind where id = p_id;
    if v_event is not null then
      update ops.surense_events set processed_at = now() where id = v_event and processed_at is null;
    end if;
    if p_result = 'skipped' and p_error like 'ambiguous%' then
      perform ops.raise_alert('warning', 'surense_write_ambiguous',
                              'surense job id=' || p_id || ' (' || v_kind || ') may have reached Surense; check there before shipping again',
                              'surense_write_ambiguous:' || p_id);
    end if;
  elsif v_attempts >= 5 then
    update ops.surense_jobs set status = 'dead', processed_at = now(), locked_until = null, last_error = p_error,
           last_error_kind = p_error_kind where id = p_id;
    perform ops.raise_alert('critical', 'surense_job_dead', 'surense job id=' || p_id || ' (' || v_kind || ') is dead after 5 attempts',
                            'surense_job_dead');
  else
    v_after := make_interval(secs => coalesce(p_retry_after, 0));
    v_delay := greatest((array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours'])[greatest(v_attempts, 1)], v_after);
    v_delay := greatest(v_delay * (0.5 + random() * 0.5), v_after);
    update ops.surense_jobs set status = 'pending', locked_until = null, last_error = p_error, last_error_kind = p_error_kind,
           next_attempt_at = now() + v_delay
     where id = p_id;
  end if;
end $$;
