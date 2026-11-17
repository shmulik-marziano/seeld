-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).
-- Depends on: 02, 06, 07, 08. Extensions pg_cron and pg_net must be enabled by the owner (Supabase Dashboard).
--
-- Contents: alert recipients (data, supplied by the owner), ops alerts raised from the audit log, queue health,
-- super_admin operations (all step-up protected and audited), and the pg_cron schedule PROPOSAL for the stateless worker.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. alert_recipients: configurable DATA. No person is named in code. The owner will supply the list.
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.alert_recipients (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 80),              -- a label, e.g. a role or a person, chosen by the owner
  channel text not null check (channel in ('email','sms','whatsapp','webhook')),
  address text not null check (char_length(address) between 3 and 300),       -- contact detail: treated as personal data, never logged
  min_severity text not null default 'critical' check (min_severity in ('warning','critical')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, address)
);
comment on table public.alert_recipients is 'Who receives operational alerts. Empty until the owner supplies the list. Edited only by super_admin (audited).';
alter table public.alert_recipients enable row level security;
revoke all on public.alert_recipients from anon, authenticated;
-- TODO(owner): supply the recipients, then insert them (via admin_upsert_alert_recipient). Example shape only:
-- insert into public.alert_recipients (name, channel, address, min_severity) values ('<label>', 'email', '<address>', 'critical');

-- ---------------------------------------------------------------------------------------------------------------
-- 2. ops_alerts: operational notifications (not a work queue). Filled from the audit log; delivered by the worker.
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.ops_alerts (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  severity text not null check (severity in ('warning','critical')),
  kind text not null check (char_length(kind) between 3 and 60),
  destination text check (destination in ('salesforce','surense')),
  customer_key uuid,
  dedupe_key text,
  summary text not null check (char_length(summary) <= 300),                  -- codes and ids only, no PII
  status text not null default 'pending' check (status in ('pending','sent','failed','no_recipients')),
  attempts integer not null default 0,
  claimed_until timestamptz,
  sent_at timestamptz
);
create unique index if not exists ops_alerts_pending_dedupe_uq on public.ops_alerts (dedupe_key) where status = 'pending' and dedupe_key is not null;
create index if not exists ops_alerts_status_at_idx on public.ops_alerts (status, at);
alter table public.ops_alerts enable row level security;
revoke all on public.ops_alerts from anon, authenticated;

create or replace function public.raise_ops_alert(p_severity text, p_kind text, p_destination text, p_customer uuid, p_dedupe text, p_summary text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ops_alerts (severity, kind, destination, customer_key, dedupe_key, summary)
  values (p_severity, p_kind, p_destination, p_customer, p_dedupe, left(p_summary, 300))
  on conflict (dedupe_key) where status = 'pending' and dedupe_key is not null do nothing;
$$;

-- Failure alerting hook: a dead-lettered message (third failure, or a poison message) raises a critical alert.
create or replace function public.alert_from_event_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.raise_ops_alert('critical', 'dead_letter', new.destination, new.customer_key,
    'dlq:' || new.destination || ':' || new.customer_key::text || ':' || new.seq::text,
    'message dead-lettered: destination=' || coalesce(new.destination, '-') || ' seq=' || coalesce(new.seq::text, '-') || ' code=' || coalesce(new.code, '-'));
  return new;
end;
$$;
drop trigger if exists event_log_alert_dead_letter on public.event_log;
create trigger event_log_alert_dead_letter after insert on public.event_log for each row
  when (new.event_type = 'message.dead_lettered') execute function public.alert_from_event_log();

-- Worker side: claim pending alerts (60 s claim so two workers never send the same alert), send, mark.
create or replace function public.alerts_claim_pending(p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  with c as (
    select id from public.ops_alerts where status = 'pending' and (claimed_until is null or claimed_until < now())
     order by at limit least(greatest(p_limit, 1), 20) for update skip locked
  ), u as (
    update public.ops_alerts a set claimed_until = now() + interval '60 seconds', attempts = attempts + 1 from c where a.id = c.id
    returning a.id, a.severity, a.kind, a.destination, a.summary
  )
  select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb) into r from u;
  return r;
end;
$$;

create or replace function public.alerts_mark(p_id bigint, p_status text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ops_alerts set status = p_status, sent_at = case when p_status = 'sent' then now() end, claimed_until = null
   where id = p_id and p_status in ('sent','failed','no_recipients');
$$;

create or replace function public.get_alert_recipients(p_severity text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'channel', channel, 'address', address)), '[]'::jsonb)
    from public.alert_recipients where enabled and (min_severity = 'warning' or p_severity = 'critical');
$$;

-- Watchdog: a queue whose oldest visible message is too old means the worker is not draining (or the system is down).
create or replace function public.queue_watchdog()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare d record; v_age bigint; v_max integer := coalesce((select value::integer from public.platform_settings where key = 'queue_stale_sec'), 900);   -- TODO(owner)
begin
  for d in select destination, queue_name from public.queue_destinations where enabled loop
    select oldest_msg_age_sec into v_age from pgmq.metrics(d.queue_name);
    if v_age is not null and v_age > v_max then
      perform public.raise_ops_alert('warning', 'queue_stale', d.destination, null, 'stale:' || d.destination, 'queue ' || d.destination || ' oldest message age sec=' || v_age::text);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Queue health (manager and super_admin read) and super_admin operations (step-up + audit)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.get_queue_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare d record; r jsonb := '[]'::jsonb; m record; dm record;
begin
  if public.current_platform_role() not in ('manager','super_admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  for d in select * from public.queue_destinations order by destination loop
    select queue_length, oldest_msg_age_sec into m from pgmq.metrics(d.queue_name);
    select queue_length into dm from pgmq.metrics(d.dlq_name);
    r := r || jsonb_build_object('destination', d.destination, 'enabled', d.enabled, 'pending', m.queue_length, 'oldest_age_sec', m.oldest_msg_age_sec,
             'dead_letters', dm.queue_length, 'halted_customers', (select count(*) from public.customer_queue_state s where s.destination = d.destination and s.halted));
  end loop;
  return r;
end;
$$;

create or replace function public.admin_resolve_halt(p_destination text, p_customer uuid, p_action text, p_dlq_msg_id bigint default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_before jsonb; v_res text;
begin
  perform public.require_super_admin_fresh();
  select jsonb_build_object('halted', halted, 'halted_seq', halted_seq, 'last_completed_seq', last_completed_seq) into v_before
    from public.customer_queue_state where customer_key = p_customer and destination = p_destination;
  v_res := public.queue_resolve_halt(p_destination, p_customer, p_action, p_dlq_msg_id);
  perform public.platform_audit('queue.resolve_halt', 'customer_queue_state', p_destination || ':' || p_customer::text, v_before,
    jsonb_build_object('action', p_action, 'result', v_res));
  return v_res;
end;
$$;

-- "Purge" dead letters = move them to the pgmq archive (kept for audit), never a hard delete.
create or replace function public.admin_purge_dlq(p_destination text, p_older_than_sec integer default 0)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare d public.queue_destinations; v_ids bigint[]; v_n integer := 0;
begin
  perform public.require_super_admin_fresh();
  select * into d from public.queue_destinations where destination = p_destination;
  if not found then raise exception 'bad_destination'; end if;
  execute format('select coalesce(array_agg(msg_id), ''{}'') from pgmq.%I where enqueued_at <= now() - make_interval(secs => $1)', 'q_' || d.dlq_name) into v_ids using greatest(p_older_than_sec, 0);
  if cardinality(v_ids) > 0 then perform pgmq.archive(d.dlq_name, v_ids); v_n := cardinality(v_ids); end if;
  perform public.platform_audit('queue.purge_dlq', 'queue', d.dlq_name, null, jsonb_build_object('archived', v_n, 'older_than_sec', p_older_than_sec));
  return v_n;
end;
$$;

create or replace function public.admin_upsert_alert_recipient(p_id bigint, p_name text, p_channel text, p_address text, p_min_severity text, p_enabled boolean)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare v_id bigint; v_before jsonb;
begin
  perform public.require_super_admin_fresh();
  if p_id is null then
    insert into public.alert_recipients (name, channel, address, min_severity, enabled) values (p_name, p_channel, p_address, p_min_severity, p_enabled) returning id into v_id;
  else
    select jsonb_build_object('channel', channel, 'min_severity', min_severity, 'enabled', enabled) into v_before from public.alert_recipients where id = p_id;   -- address never audited
    update public.alert_recipients set name = p_name, channel = p_channel, address = p_address, min_severity = p_min_severity, enabled = p_enabled, updated_at = now() where id = p_id returning id into v_id;
  end if;
  perform public.platform_audit('alert_recipient.changed', 'alert_recipients', v_id::text, v_before, jsonb_build_object('channel', p_channel, 'min_severity', p_min_severity, 'enabled', p_enabled));
  return v_id;
end;
$$;

-- Integration switch: which destinations run, and their queue policy. The config switch for surense_only / salesforce_only / both_parallel.
create or replace function public.admin_configure_destination(p_destination text, p_enabled boolean, p_vt integer, p_batch integer, p_drain integer, p_max_attempts integer, p_backoff integer[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_before jsonb;
begin
  perform public.require_super_admin_fresh();
  select to_jsonb(q) - 'updated_at' into v_before from public.queue_destinations q where destination = p_destination;
  update public.queue_destinations
     set enabled = p_enabled, visibility_timeout_sec = p_vt, batch_size = p_batch, drain_interval_sec = p_drain, max_attempts = p_max_attempts, backoff_sec = p_backoff, updated_at = now()
   where destination = p_destination;
  if not found then raise exception 'bad_destination'; end if;
  perform public.platform_audit('queue.configure_destination', 'queue_destinations', p_destination, v_before,
    (select to_jsonb(q) - 'updated_at' from public.queue_destinations q where destination = p_destination));
end;
$$;

-- Retention helpers (cron). TODO(owner): confirm retention periods. event_log is append-only and is NOT purged here.
create or replace function public.platform_retention_purge()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.idempotency_keys where expires_at < now();                              -- >= 24 h retention (default 48 h)
  delete from public.event_registry where first_seen_at < now() - interval '30 days';        -- TODO(owner): echo detection window
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'get_queue_health()', 'admin_resolve_halt(text,uuid,text,bigint)', 'admin_purge_dlq(text,integer)',
    'admin_upsert_alert_recipient(bigint,text,text,text,text,boolean)', 'admin_configure_destination(text,boolean,integer,integer,integer,integer,integer[])'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
  foreach f in array array[
    'raise_ops_alert(text,text,text,uuid,text,text)', 'alerts_claim_pending(integer)', 'alerts_mark(bigint,text)', 'get_alert_recipients(text)',
    'queue_watchdog()', 'platform_retention_purge()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------------------------
-- 4. pg_cron + pg_net schedule PROPOSAL (do not run before the worker is deployed and the owner approved).
-- Secrets live in Vault, created by the owner: 'queue_worker_url' (function URL) and 'queue_worker_secret' (shared secret
-- the worker checks in header x-worker-secret). Nothing secret is in this file.
-- Two jobs, one per destination, so a slow or locked system never delays the other. Two overlapping invocations are safe:
-- the visibility timeout (60 s) and the per-customer lease stop double processing.
-- ---------------------------------------------------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;

-- select cron.schedule('queue-worker-salesforce', '10 seconds', $cron$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'queue_worker_url'),
--     headers := jsonb_build_object('content-type', 'application/json',
--                                   'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'queue_worker_secret')),
--     body := jsonb_build_object('destination', 'salesforce'),
--     timeout_milliseconds := 55000);
-- $cron$);   -- TODO(owner): interval mirrors queue_destinations.drain_interval_sec (placeholder)

-- select cron.schedule('queue-worker-surense', '30 seconds', $cron$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'queue_worker_url'),
--     headers := jsonb_build_object('content-type', 'application/json',
--                                   'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'queue_worker_secret')),
--     body := jsonb_build_object('destination', 'surense'),
--     timeout_milliseconds := 55000);
-- $cron$);   -- TODO(owner): slower drain for the slower system (placeholder)

-- select cron.schedule('platform-metrics-refresh', '*/10 * * * *', $cron$ select public.metrics_refresh_daily(); $cron$);
-- select cron.schedule('platform-workbench-time-flags', '*/5 * * * *', $cron$ select public.workbench_refresh_time_flags(); $cron$);
-- select cron.schedule('platform-queue-watchdog', '*/5 * * * *', $cron$ select public.queue_watchdog(); $cron$);
-- select cron.schedule('platform-retention-purge', '17 * * * *', $cron$ select public.platform_retention_purge(); $cron$);
-- Rollback: select cron.unschedule('<job name>');
