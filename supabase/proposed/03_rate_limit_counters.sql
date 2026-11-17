-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).

-- rate_limit_counters: fixed-window counters behind supabase/functions/_shared/rateLimit.ts.
-- Service role only. consume_rate_limit() is one atomic upsert; stale windows are purged by a cron job later.

create table if not exists public.rate_limit_counters (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (key, window_start)
);

comment on table public.rate_limit_counters is 'Fixed-window rate limit counters. Keys are opaque (client:<id>, ip:<hash>). No PII.';
create index if not exists rate_limit_counters_window_start_idx on public.rate_limit_counters (window_start);

alter table public.rate_limit_counters enable row level security;
revoke all on public.rate_limit_counters from anon, authenticated;

create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_sec integer)
returns table (allowed boolean, remaining integer, retry_after_sec integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_sec) * p_window_sec);
  v_count integer;
begin
  insert into public.rate_limit_counters as c (key, window_start, count)
  values (p_key, v_start, 1)
  on conflict (key, window_start) do update set count = c.count + 1
  returning c.count into v_count;
  return query select v_count <= p_limit,
                      greatest(0, p_limit - v_count),
                      greatest(1, ceil(extract(epoch from (v_start + make_interval(secs => p_window_sec) - now())))::integer);
end;
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
