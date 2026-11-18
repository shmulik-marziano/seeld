-- FOUNDATION 03: operational plumbing: config, rate limits, transactional outbox, cleanup job.
-- Cleanup includes cron.job_run_details: in the old Tokyo project it grew to 122k rows (21MB) and
-- contributed to Disk IO pressure. Retention is a first-class job here, not an afterthought.

create table ops.config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
comment on table ops.config is 'Server-side settings. Service role / definer functions only. Secrets that must be rotatable live here or in Vault, never in git.';
revoke all on ops.config from anon, authenticated;

-- per-environment random pepper for hashing network identifiers (generated at migration time, never in git)
insert into ops.config (key, value)
values ('rate_limit_pepper', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create table ops.rate_limits (
  bucket       text not null,
  key_hash     bytea not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, key_hash, window_start)
);
create index rate_limits_window_idx on ops.rate_limits (window_start);
revoke all on ops.rate_limits from anon, authenticated;

-- returns true when the call is allowed. Fixed windows via date_bin.
create or replace function private.check_rate_limit(p_bucket text, p_key text, p_limit integer, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pepper text;
  v_hash bytea;
  v_start timestamptz := date_bin(p_window, now(), timestamptz 'epoch');
  v_hits integer;
begin
  select value into v_pepper from ops.config where key = 'rate_limit_pepper';
  v_hash := extensions.hmac(convert_to(coalesce(p_key, ''), 'utf8'), convert_to(coalesce(v_pepper, ''), 'utf8'), 'sha256');
  insert into ops.rate_limits as r (bucket, key_hash, window_start, hits)
  values (p_bucket, v_hash, v_start, 1)
  on conflict (bucket, key_hash, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

-- best-effort client address from PostgREST request headers (Vercel/Supabase edge set x-forwarded-for)
create or replace function private.client_ip()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(trim(split_part(coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'cf-connecting-ip',
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for',
    ''), ',', 1)), '')
$$;

create table ops.outbox (
  id           bigint generated always as identity primary key,
  topic        text not null,
  payload      jsonb not null default '{}'::jsonb,
  status       text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts     integer not null default 0,
  created_at   timestamptz not null default now(),
  processed_at timestamptz
);
comment on table ops.outbox is 'Transactional outbox: rows are written in the same transaction as the business change. A worker (edge function) drains it. The event platform (pgmq, proposed/06) later consumes this table.';
create index outbox_pending_idx on ops.outbox (id) where status = 'pending';
revoke all on ops.outbox from anon, authenticated;
grant select, insert, update, delete on ops.outbox, ops.config, ops.rate_limits to service_role;

create or replace function private.enqueue(p_topic text, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into ops.outbox (topic, payload) values (p_topic, p_payload);
$$;

-- retention ---------------------------------------------------------------------
create or replace function ops.cleanup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_rate bigint; n_outbox bigint; n_audit bigint; n_cron bigint := 0;
begin
  delete from ops.rate_limits where window_start < now() - interval '2 days';
  get diagnostics n_rate = row_count;

  delete from ops.outbox where status = 'sent' and processed_at < now() - interval '14 days';
  get diagnostics n_outbox = row_count;

  perform set_config('audit.allow_purge', 'on', true);
  delete from audit.log where at < now() - interval '400 days';
  get diagnostics n_audit = row_count;
  perform set_config('audit.allow_purge', 'off', true);

  if to_regclass('cron.job_run_details') is not null then
    delete from cron.job_run_details where end_time < now() - interval '7 days';
    get diagnostics n_cron = row_count;
  end if;

  return jsonb_build_object('rate_limits', n_rate, 'outbox', n_outbox, 'audit', n_audit, 'cron_runs', n_cron);
end;
$$;
revoke all on function ops.cleanup() from public, anon, authenticated;
grant execute on function ops.cleanup() to service_role;

-- hourly; idempotent by job name
select cron.schedule('ops-cleanup', '17 * * * *', 'select ops.cleanup()');
