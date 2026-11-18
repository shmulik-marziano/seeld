-- V2-08 (ADR-25, ADR-26, ADR-27): cron wrapper, job runs, alerts, outbox v2.
-- Precondition for http_invoke (not for this migration): Vault secrets project_url and edge_cron_secret (owner step 16).
-- Without them http_invoke raises 55000 vault_secret_missing; call_function never reaches it while edge_cron_enabled='false'.
-- Contract with every cron-invoked function: verify x-cron-secret, answer 202 at once, work in EdgeRuntime.waitUntil,
-- report completion ONLY through api.job_finish. The HTTP status says "request delivered", never "job done".
create extension if not exists pg_net with schema extensions;

create table ops.job_runs (
  id          bigint generated always as identity primary key,
  job         text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  ok          boolean,
  stats       jsonb not null default '{}'::jsonb,
  request_id  bigint,
  error       text
);
create index job_runs_job_started_idx on ops.job_runs (job, started_at desc);
create index job_runs_open_idx on ops.job_runs (started_at) where finished_at is null;

create table ops.alerts (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  severity   text not null check (severity in ('info', 'warning', 'critical')),
  kind       text not null,
  dedupe_key text,
  summary    text not null,
  status     text not null default 'pending' check (status in ('pending', 'sent', 'resolved'))
);
create unique index alerts_dedupe_idx on ops.alerts (dedupe_key) where status = 'pending' and dedupe_key is not null;
create index alerts_dedupe_at_idx on ops.alerts (dedupe_key, at desc);
create index alerts_pending_at_idx on ops.alerts (at) where status = 'pending';

create table ops.alert_recipients (
  email  text primary key check (email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  active boolean not null default true
);

alter table ops.job_runs enable row level security;
alter table ops.alerts enable row level security;
alter table ops.alert_recipients enable row level security;
revoke all on ops.job_runs, ops.alerts, ops.alert_recipients from anon, authenticated;
grant select, insert, update, delete on ops.job_runs, ops.alerts, ops.alert_recipients to service_role;
create policy deny_api_roles on ops.job_runs for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.alerts for all to anon, authenticated using (false) with check (false);
create policy deny_api_roles on ops.alert_recipients for all to anon, authenticated using (false) with check (false);

-- at most one alert per dedupe key per window (default 1 hour); each new alert becomes an outbox message for notify-worker
create or replace function ops.raise_alert(p_sev text, p_kind text, p_summary text, p_dedupe text default null,
                                           p_window interval default interval '1 hour')
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  if p_dedupe is not null and exists (
      select 1 from ops.alerts a where a.dedupe_key = p_dedupe and a.at > now() - p_window) then
    return null;
  end if;
  insert into ops.alerts (severity, kind, summary, dedupe_key) values (p_sev, p_kind, left(p_summary, 500), p_dedupe)
  on conflict (dedupe_key) where status = 'pending' and dedupe_key is not null do nothing
  returning id into v_id;
  if v_id is not null then
    perform private.enqueue('alert', jsonb_build_object('alert_id', v_id, 'severity', p_sev, 'kind', p_kind,
      'summary', left(p_summary, 500),
      'recipients', (select coalesce(jsonb_agg(r.email order by r.email), '[]'::jsonb) from ops.alert_recipients r where r.active)));
  end if;
  return v_id;
end $$;

-- the only place that builds a function URL: project_url and edge_cron_secret come from Vault (per environment)
create or replace function ops.http_invoke(p_run bigint, p_name text, p_body jsonb default '{}'::jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secret text; v_req bigint;
begin
  if p_name !~ '^[a-z][a-z0-9-]{1,40}$' then raise exception 'invalid_input:function' using errcode = '22023'; end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'edge_cron_secret';
  if v_url is null or v_secret is null then
    raise exception 'vault_secret_missing' using errcode = '55000';
  end if;
  select net.http_post(
    url := v_url || '/functions/v1/' || p_name || '?forceFunctionRegion=eu-central-1',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', v_secret,
                                  'x-request-id', gen_random_uuid()::text, 'x-job-run', p_run::text),
    body := coalesce(p_body, '{}'::jsonb),
    timeout_milliseconds := 5000) into v_req;
  update ops.job_runs set request_id = v_req where id = p_run;
  return v_req;
end $$;

-- R2-F11 (moved here from 091400 so no cron job is ever scheduled ungated): no Edge call from cron until the functions
-- are deployed. The owner flips edge_cron_enabled to 'true' on day 2, after the Vault secrets (project_url,
-- edge_cron_secret) exist and notify-worker/fetch-cma-data/health are deployed. A missing key reads as closed.
insert into ops.config (key, value) values ('edge_cron_enabled', 'false') on conflict (key) do nothing;

create or replace function ops.call_function(p_name text, p_body jsonb default '{}'::jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_run bigint;
begin
  if not private.flag('edge_cron_enabled') then return null; end if;
  insert into ops.job_runs (job) values (p_name) returning id into v_run;
  return ops.http_invoke(v_run, p_name, p_body);
end $$;

create or replace function ops.job_finish(p_run bigint, p_ok boolean, p_stats jsonb default '{}'::jsonb, p_error text default null)
returns void language sql security definer set search_path = '' as $$
  update ops.job_runs
     set finished_at = now(), ok = p_ok, stats = stats || coalesce(p_stats, '{}'::jsonb), error = left(p_error, 500)
   where id = p_run and finished_at is null
$$;

-- resumable long jobs (fetch-cma-data): persist the cursor on the same run and invoke the next slice.
create or replace function ops.job_continue(p_run bigint, p_name text, p_cursor jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_hops integer;
begin
  update ops.job_runs
     set stats = stats || jsonb_build_object('cursor', p_cursor, 'hops', coalesce((stats ->> 'hops')::int, 0) + 1)
   where id = p_run and job = p_name and finished_at is null
  returning (stats ->> 'hops')::int into v_hops;
  if v_hops is null then raise exception 'not_found:job_run' using errcode = 'PT404'; end if;
  if v_hops > 40 then
    update ops.job_runs set finished_at = now(), ok = false, error = 'too_many_hops' where id = p_run;
    perform ops.raise_alert('warning', 'job_too_many_hops', p_name || ' run ' || p_run || ' exceeded 40 slices', 'job_hops:' || p_name);
    return null;
  end if;
  return ops.http_invoke(p_run, p_name, jsonb_build_object('cursor', p_cursor));
end $$;

-- outbox v2 (table has 0 rows in prod; failed -> dead for safety)
alter table ops.outbox drop constraint outbox_status_check;
update ops.outbox set status = 'dead' where status = 'failed';
alter table ops.outbox
  add column next_attempt_at timestamptz not null default now(),
  add column locked_until    timestamptz,
  add column last_error      text;
alter table ops.outbox add constraint outbox_status_check check (status in ('pending', 'processing', 'sent', 'dead'));
drop index ops.outbox_pending_idx;
create index outbox_due_idx on ops.outbox (next_attempt_at) where status in ('pending', 'processing');
create index outbox_dead_idx on ops.outbox (processed_at) where status = 'dead';

create or replace function ops.outbox_claim(p_limit integer default 20)
returns setof ops.outbox language sql security definer set search_path = '' as $$
  with c as (
    select o.id from ops.outbox o
     where (o.status = 'pending' or (o.status = 'processing' and o.locked_until < now()))
       and o.next_attempt_at <= now()
     order by o.id
     limit least(greatest(coalesce(p_limit, 20), 1), 50)
     for update skip locked)
  update ops.outbox o set status = 'processing', locked_until = now() + interval '2 minutes', attempts = o.attempts + 1
    from c where o.id = c.id
  returning o.*
$$;

create or replace function ops.outbox_complete(p_id bigint, p_ok boolean, p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempts int; v_topic text; v_payload jsonb;
begin
  if p_ok then
    update ops.outbox set status = 'sent', processed_at = now(), locked_until = null, last_error = null
     where id = p_id returning topic, payload into v_topic, v_payload;
    if v_topic = 'alert' then
      update ops.alerts set status = 'sent' where id = (v_payload ->> 'alert_id')::bigint and status = 'pending';
    end if;
    return;
  end if;
  select attempts into v_attempts from ops.outbox where id = p_id;
  if v_attempts is null then return; end if;
  if v_attempts >= 5 then
    update ops.outbox set status = 'dead', processed_at = now(), last_error = left(p_error, 500), locked_until = null where id = p_id;
    perform ops.raise_alert('critical', 'outbox_dead', 'outbox id=' || p_id || ' is dead after 5 attempts', 'outbox_dead');
  else
    update ops.outbox set status = 'pending', last_error = left(p_error, 500), locked_until = null,
           next_attempt_at = now() + (array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours'])[v_attempts]
     where id = p_id;
  end if;
end $$;

revoke all on function ops.raise_alert(text, text, text, text, interval), ops.http_invoke(bigint, text, jsonb),
  ops.call_function(text, jsonb), ops.job_finish(bigint, boolean, jsonb, text), ops.job_continue(bigint, text, jsonb),
  ops.outbox_claim(integer), ops.outbox_complete(bigint, boolean, text) from public, anon, authenticated;
grant execute on function ops.raise_alert(text, text, text, text, interval), ops.job_finish(bigint, boolean, jsonb, text),
  ops.outbox_claim(integer), ops.outbox_complete(bigint, boolean, text) to service_role;
