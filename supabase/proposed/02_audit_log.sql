-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).

-- audit_log: append-only record of security relevant actions. No PII in meta (ids and codes only).
-- Writes: service role only. Reads: members of the same agency. Updates and deletes are blocked by trigger.

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  agency_id uuid references public.agencies(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_kind text not null default 'user' check (actor_kind in ('user','api_client','system')),
  action text not null check (char_length(action) between 3 and 80),
  resource_type text,
  resource_id text,
  request_id text,
  meta jsonb not null default '{}'::jsonb
);

comment on table public.audit_log is 'Append-only audit trail. Never store PII in meta.';
comment on column public.audit_log.meta is 'Small non-PII metadata: codes, counts, booleans.';

create index if not exists audit_log_agency_id_at_idx on public.audit_log (agency_id, at desc);
create index if not exists audit_log_actor_id_idx on public.audit_log (actor_id);
create index if not exists audit_log_action_at_idx on public.audit_log (action, at desc);

create or replace function public.audit_log_block_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

drop trigger if exists audit_log_no_update on public.audit_log;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_block_mutation();
drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_block_mutation();

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "agency members read their audit log"
  on public.audit_log for select to authenticated
  using (agency_id is not null and agency_id = (select public.get_user_agency_id((select auth.uid()))));
-- No insert/update/delete policy: only the service role (bypasses RLS) can append.
