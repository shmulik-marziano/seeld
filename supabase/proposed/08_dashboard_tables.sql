-- PATCHED COPY (review fixes, NOT executed against a database). Original untouched. See C:/tmp/infra/sql-review.md
-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).
-- Depends on: 02_audit_log.sql, 06_event_queue.sql, 07_source_precedence.sql. Apply 06 to 09 as one release.
--
-- Dashboard read model. TWO dedicated tables, never one mixed table, kept up to date by triggers on the save
-- events and by the queue worker; the UI never runs a heavy summary query:
--   A. agent_workbench     one flat row per CUSTOMER OR LEAD (key = internal_customer_id, never per case).
--                          Per-case Surense states live INSIDE the row (case_states jsonb) next to fast filter columns.
--                          The Salesforce handling status and the Surense case state are merged in this one row.
--   B. management_metrics  one row per agent per day (+ one 'system' row per day for queue-level numbers).
-- Roles are DATA (platform_user_roles), not names:
--   agent       own rows, or more per platform_settings.visibility_mode
--   manager     full read of both tables and queue health, plus normal operational actions
--   super_admin manager + system operations (rules, visibility_mode, alert recipients, DLQ operations, integration settings)
-- HARD RLS: revoke all from anon and authenticated on every table here, NO client-role policy at all. Access only through
-- role-gated SECURITY DEFINER RPCs that check the role. Privileged operations write to audit_log (who, what, when, before/after).
-- super_admin operations additionally require fresh TOTP step-up (aal2 + recent totp in the JWT amr claim), see require_super_admin_fresh().

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Roles as data + settings
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.platform_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('agent','manager','super_admin','insurance_lead','finance_lead')),
  agency_id uuid references public.agencies(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
comment on table public.platform_user_roles is 'Role assignments as data. No person is named in code or SQL. Seed rows are inserted by the owner after approval.';
create index if not exists platform_user_roles_agency_id_idx on public.platform_user_roles (agency_id);
alter table public.platform_user_roles enable row level security;
revoke all on public.platform_user_roles from anon, authenticated;

create table if not exists public.platform_settings (
  key text primary key check (key ~ '^[a-z_]+(\.[a-z_]+)*$'),
  value text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists platform_settings_updated_by_idx on public.platform_settings (updated_by);
alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon, authenticated;
insert into public.platform_settings (key, value) values
  ('visibility_mode', 'own_only'),                 -- 'own_only' | 'shared_pool_plus_own' | 'all_read_only'. Owner decides.
  ('response_target_minutes', '60'),               -- TODO(owner): service target for first response to a lead
  ('stepup_max_age_sec', '900')                    -- TODO(owner): how fresh the TOTP must be for super_admin operations
on conflict (key) do nothing;

-- Highest access role of the caller, or null for clients/anonymous. Existing agency users (profiles) count as agent.
create or replace function public.current_platform_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (select 1 from public.platform_user_roles r where r.user_id = (select auth.uid()) and r.active and r.role = 'super_admin') then 'super_admin'
    when exists (select 1 from public.platform_user_roles r where r.user_id = (select auth.uid()) and r.active and r.role = 'manager') then 'manager'
    -- FIX: the profiles fallback is removed. on_auth_user_created creates a profiles row for EVERY signup (clients included),
    --      so every logged-in client was an 'agent'. Seed existing agency staff into platform_user_roles instead.
    when exists (select 1 from public.platform_user_roles r where r.user_id = (select auth.uid()) and r.active and r.role in ('agent','insurance_lead','finance_lead')) then 'agent'
  end;
$$;

create or replace function public.platform_visibility_mode()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select value from public.platform_settings where key = 'visibility_mode'), 'own_only');
$$;

-- Fresh authentication for super_admin operations: role + aal2 + a TOTP method in amr no older than stepup_max_age_sec.
create or replace function public.require_super_admin_fresh()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_last bigint; v_max integer;
begin
  if public.current_platform_role() is distinct from 'super_admin' then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce((select auth.jwt()) ->> 'aal', '') <> 'aal2' then raise exception 'stepup_required' using errcode = '42501'; end if;
  select max((e ->> 'timestamp')::bigint) into v_last
    from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) e where e ->> 'method' = 'totp';
  select coalesce((select value::integer from public.platform_settings where key = 'stepup_max_age_sec'), 900) into v_max;
  if v_last is null or extract(epoch from now()) - v_last > v_max then raise exception 'stepup_expired' using errcode = '42501'; end if;
end;
$$;

-- Privileged operations leave a trail: who, what, when, before/after (settings and rule values only, no PII).
create or replace function public.platform_audit(p_action text, p_resource_type text, p_resource_id text, p_before jsonb, p_after jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, actor_kind, action, resource_type, resource_id, meta)
  values ((select auth.uid()), 'user', p_action, p_resource_type, p_resource_id, jsonb_build_object('before', p_before, 'after', p_after));
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Table A: agent_workbench
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.agent_workbench (
  customer_key uuid primary key references public.identity_links(internal_customer_id) on delete cascade,  -- also the reference to the encrypted national id (never copied here)
  agency_id uuid references public.agencies(id) on delete set null,
  -- identity and assignment
  full_name text,
  phone text,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  first_response_at timestamptz,
  line_of_business text check (line_of_business in ('insurance','finance')),
  -- lead and questionnaire state (operational DB + Salesforce)
  process_stage text not null default 'new_lead',
  sf_handling_status text,                       -- Salesforce handling status (system of record: Salesforce)
  sf_status_at timestamptz,
  questionnaire_pct smallint not null default 0 check (questionnaire_pct between 0 and 100),
  last_saved_step text,
  last_customer_action_at timestamptz,
  -- unified case picture (Surense)
  active_cases integer not null default 0,
  total_accumulation numeric(16,2) not null default 0,
  institutions text[] not null default '{}',
  active_trust_rank smallint check (active_trust_rank between 1 and 5),     -- best (lowest) rank among the data held
  case_states jsonb not null default '{}'::jsonb,   -- { "<case_ref>": { "state": "...", "institution": "...", "accumulation": 0, "rank": 3, "at": "..." } }
  -- urgency and sync health
  urgency_score smallint not null default 1 check (urgency_score between 1 and 100),
  response_breach boolean not null default false,
  last_sync_status text not null default 'ok' check (last_sync_status in ('ok','pending','retrying','error','halted')),
  last_error_message text check (char_length(last_error_message) <= 200),     -- machine code / short text, never PII
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.agent_workbench is 'Read model: one flat row per customer or lead. Personal data: service role + gated RPC only.';
-- Millisecond work list for one agent.
create index if not exists agent_workbench_agent_urgency_idx on public.agent_workbench (assigned_agent_id, urgency_score desc);
-- Hot leads (threshold 70 is a constant of the index; keep workbench_urgency() and get_agent_workbench in sync). TODO(owner): confirm threshold.
create index if not exists agent_workbench_hot_idx on public.agent_workbench (assigned_agent_id, urgency_score desc) where urgency_score >= 70;
create index if not exists agent_workbench_sync_error_idx on public.agent_workbench (assigned_agent_id, last_sync_at desc) where last_sync_status in ('error','halted');
create index if not exists agent_workbench_breach_idx on public.agent_workbench (assigned_agent_id) where response_breach;
create index if not exists agent_workbench_pool_idx on public.agent_workbench (agency_id, urgency_score desc) where assigned_agent_id is null;
create index if not exists agent_workbench_agency_id_idx on public.agent_workbench (agency_id);
alter table public.agent_workbench enable row level security;
revoke all on public.agent_workbench from anon, authenticated;

create or replace function public.workbench_urgency(p_breach boolean, p_stage text, p_pct smallint, p_last_action timestamptz, p_sync text)
returns smallint
language sql
stable   -- FIX: uses now(), cannot be immutable
set search_path = ''
as $$
  -- TODO(owner): placeholder formula, to be tuned with real agent feedback. Always 1..100.
  select greatest(1, least(100,
      1
    + case when p_breach then 45 else 0 end
    + case when p_stage = 'new_lead' then 20 else 0 end
    + case when p_pct between 1 and 99 and p_last_action > now() - interval '2 days' then 15 else 0 end   -- active but unfinished questionnaire
    + case when p_sync in ('error','halted') then 15 else 0 end
  ))::smallint;
$$;

create or replace function public.workbench_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_target integer := coalesce((select value::integer from public.platform_settings where key = 'response_target_minutes'), 60);
begin
  new.response_breach := new.assigned_at is not null and new.first_response_at is null and new.assigned_at < now() - make_interval(mins => v_target);
  new.urgency_score := public.workbench_urgency(new.response_breach, new.process_stage, new.questionnaire_pct, new.last_customer_action_at, new.last_sync_status);
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists agent_workbench_before_write on public.agent_workbench;
create trigger agent_workbench_before_write before insert or update on public.agent_workbench for each row execute function public.workbench_before_write();

-- Recompute from the case_states jsonb (called by the worker after a Surense status arrives).
create or replace function public.workbench_set_case_state(p_customer uuid, p_case_ref text, p_state text, p_institution text, p_accumulation numeric, p_rank smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.agent_workbench (customer_key) values (p_customer) on conflict (customer_key) do nothing;
  update public.agent_workbench w
     set case_states = w.case_states || jsonb_build_object(p_case_ref, jsonb_build_object('state', p_state, 'institution', p_institution, 'accumulation', p_accumulation, 'rank', p_rank, 'at', now())),
         last_sync_at = now()
   where customer_key = p_customer;
  update public.agent_workbench w
     set active_cases = (select count(*) from jsonb_each(w.case_states) c where c.value ->> 'state' not in ('closed','cancelled')),   -- TODO(owner): terminal Surense states
         total_accumulation = (select coalesce(sum((c.value ->> 'accumulation')::numeric), 0) from jsonb_each(w.case_states) c),
         institutions = (select coalesce(array_agg(distinct c.value ->> 'institution') filter (where c.value ->> 'institution' is not null), '{}') from jsonb_each(w.case_states) c),
         active_trust_rank = (select min((c.value ->> 'rank')::smallint) from jsonb_each(w.case_states) c)
   where customer_key = p_customer;
end;
$$;

create or replace function public.workbench_set_sf_status(p_customer uuid, p_status text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.agent_workbench (customer_key, sf_handling_status, sf_status_at) values (p_customer, p_status, now())
  on conflict (customer_key) do update set sf_handling_status = excluded.sf_handling_status, sf_status_at = now();
$$;

-- Save event: questionnaire draft written -> workbench row follows in the same transaction.
create or replace function public.workbench_from_draft()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.agent_workbench as w (customer_key, questionnaire_pct, last_saved_step, last_customer_action_at, process_stage)
  values (new.customer_key, new.completion_pct, new.last_step, now(), case when new.submitted_at is not null then 'questionnaire_done' else 'questionnaire' end)
  on conflict (customer_key) do update
    set questionnaire_pct = excluded.questionnaire_pct, last_saved_step = excluded.last_saved_step, last_customer_action_at = now(),
        process_stage = case when new.submitted_at is not null then 'questionnaire_done' when w.process_stage = 'new_lead' then 'questionnaire' else w.process_stage end;
  return new;
end;
$$;
drop trigger if exists questionnaire_drafts_to_workbench on public.questionnaire_drafts;
create trigger questionnaire_drafts_to_workbench after insert or update on public.questionnaire_drafts for each row execute function public.workbench_from_draft();

-- Field events: name, phone, accumulation total.
create or replace function public.workbench_from_field()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.entity_type <> 'customer' or new.field_key not in ('customer.full_name','customer.phone') then return new; end if;
  insert into public.agent_workbench as w (customer_key, full_name, phone)
  values (new.entity_id::uuid, case when new.field_key = 'customer.full_name' then new.value #>> '{}' end, case when new.field_key = 'customer.phone' then new.value #>> '{}' end)
  on conflict (customer_key) do update
    set full_name = coalesce(case when new.field_key = 'customer.full_name' then new.value #>> '{}' end, w.full_name),
        phone = coalesce(case when new.field_key = 'customer.phone' then new.value #>> '{}' end, w.phone);
  return new;
end;
$$;
drop trigger if exists field_values_to_workbench on public.field_values;
create trigger field_values_to_workbench after insert or update on public.field_values for each row execute function public.workbench_from_field();

-- Queue worker events (written to event_log by queue_complete / queue_record_failure / queue_dead_letter) drive the sync health columns.
create or replace function public.workbench_from_event_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.customer_key is null then return new; end if;
  update public.agent_workbench set
    last_sync_status = case when new.event_type = 'message.completed' and exists (select 1 from public.customer_queue_state s where s.customer_key = new.customer_key and s.halted) then 'halted'   -- FIX: a success on one destination must not hide a DLQ halt on the other
                            when new.event_type = 'message.completed' then 'ok' when new.event_type = 'message.failed' then 'retrying' else 'halted' end,
    last_error_message = case new.event_type when 'message.completed' then null else left(coalesce(new.destination, '-') || ':' || coalesce(new.code, 'error'), 200) end,
    last_sync_at = new.at
  where customer_key = new.customer_key;
  return new;
end;
$$;
drop trigger if exists event_log_to_workbench on public.event_log;
create trigger event_log_to_workbench after insert on public.event_log for each row
  when (new.event_type in ('message.completed','message.failed','message.dead_lettered'))
  execute function public.workbench_from_event_log();

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Table B: management_metrics
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.management_metrics (
  id bigint generated always as identity primary key,
  metric_date date not null,
  scope text not null check (scope in ('agent','system')),
  agent_id uuid references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  new_leads integer not null default 0,
  questionnaires_in_progress integer not null default 0,
  questionnaires_completed integer not null default 0,
  questionnaire_abandonment_rate numeric(5,2),
  step_dropoff jsonb not null default '{}'::jsonb,         -- { "<step>": count }
  active_customers integer not null default 0,
  avg_lead_response_minutes numeric(8,2),
  service_breaches integer not null default 0,
  cases_updated integer not null default 0,
  clearing_house_ingested integer not null default 0,      -- TODO(owner): count of FILES once 04_document_sources is applied; now: applied field updates
  har_habituach_ingested integer not null default 0,
  institution_gaps integer not null default 0,             -- TODO(owner): definition of "gap vs institution"
  ingested_rank_1 integer not null default 0,
  ingested_rank_2 integer not null default 0,
  ingested_rank_3 integer not null default 0,
  ingested_rank_4 integer not null default 0,
  ingested_rank_5 integer not null default 0,
  pending_salesforce integer,                              -- system row only
  pending_surense integer,                                 -- system row only
  failed_three_times integer not null default 0,           -- messages dead-lettered
  updated_at timestamptz not null default now(),
  check ((scope = 'agent' and agent_id is not null) or (scope = 'system' and agent_id is null))
);
comment on table public.management_metrics is 'Read model: one row per agent per day, plus one system row per day. Aggregates only, no PII.';
create unique index if not exists management_metrics_agent_day_uq on public.management_metrics (metric_date, agent_id) where scope = 'agent';
create unique index if not exists management_metrics_system_day_uq on public.management_metrics (metric_date) where scope = 'system';
create index if not exists management_metrics_agent_id_idx on public.management_metrics (agent_id, metric_date desc);
create index if not exists management_metrics_agency_id_idx on public.management_metrics (agency_id);
alter table public.management_metrics enable row level security;
revoke all on public.management_metrics from anon, authenticated;

-- Counter bump (whitelisted columns). Used by triggers on save events and by the worker.
create or replace function public.metrics_bump(p_agent uuid, p_col text, p_delta integer default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_col not in ('new_leads','questionnaires_in_progress','questionnaires_completed','service_breaches','cases_updated','clearing_house_ingested',
                   'har_habituach_ingested','ingested_rank_1','ingested_rank_2','ingested_rank_3','ingested_rank_4','ingested_rank_5','failed_three_times') then
    raise exception 'bad_metric_column';
  end if;
  if p_agent is null then
    execute format('insert into public.management_metrics as m (metric_date, scope, %1$I) values (current_date, ''system'', greatest(0, $1))
                    on conflict (metric_date) where scope = ''system'' do update set %1$I = greatest(0, m.%1$I + $1), updated_at = now()', p_col) using p_delta;
  else
    execute format('insert into public.management_metrics as m (metric_date, scope, agent_id, %1$I) values (current_date, ''agent'', $2, greatest(0, $1))
                    on conflict (metric_date, agent_id) where scope = ''agent'' do update set %1$I = greatest(0, m.%1$I + $1), updated_at = now()', p_col) using p_delta, p_agent;
  end if;
end;
$$;

create or replace function public.metrics_from_workbench_insert() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_agent_id is not null then perform public.metrics_bump(new.assigned_agent_id, 'new_leads', 1); end if;
  return new;
end; $$;
drop trigger if exists workbench_metrics_insert on public.agent_workbench;
create trigger workbench_metrics_insert after insert on public.agent_workbench for each row execute function public.metrics_from_workbench_insert();

create or replace function public.metrics_from_event_log() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.event_type = 'message.dead_lettered' then perform public.metrics_bump(null, 'failed_three_times', 1); end if;
  if new.event_type = 'message.completed' and new.destination = 'surense' then
    perform public.metrics_bump((select assigned_agent_id from public.agent_workbench where customer_key = new.customer_key), 'cases_updated', 1);
  end if;
  return new;
end; $$;
drop trigger if exists event_log_metrics on public.event_log;
create trigger event_log_metrics after insert on public.event_log for each row
  when (new.event_type in ('message.dead_lettered','message.completed')) execute function public.metrics_from_event_log();

create or replace function public.metrics_from_field_history() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.decision like 'apply\_%' then
    perform public.metrics_bump(null, 'ingested_rank_' || new.source_rank::text, 1);
    if new.source = 'clearing_house' then perform public.metrics_bump(null, 'clearing_house_ingested', 1); end if;
    if new.source = 'har_habituach' then perform public.metrics_bump(null, 'har_habituach_ingested', 1); end if;
  end if;
  return new;
end; $$;
drop trigger if exists field_history_metrics on public.field_value_history;
create trigger field_history_metrics after insert on public.field_value_history for each row execute function public.metrics_from_field_history();

-- Reconciliation, run by pg_cron (09): ratios, time based numbers and queue depth. Idempotent, set based.
create or replace function public.metrics_refresh_daily()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_pending_sf integer; v_pending_su integer;
begin
  insert into public.management_metrics as m (metric_date, scope, agent_id, agency_id, active_customers, avg_lead_response_minutes, service_breaches,
                                              questionnaires_in_progress, questionnaires_completed)
  select current_date, 'agent', w.assigned_agent_id, max(w.agency_id::text)::uuid,
         count(*) filter (where w.process_stage <> 'closed'),
         round(avg(extract(epoch from (w.first_response_at - w.assigned_at)) / 60) filter (where w.first_response_at is not null and w.assigned_at::date = current_date)::numeric, 2),
         count(*) filter (where w.response_breach),
         count(*) filter (where w.process_stage = 'questionnaire'),
         count(*) filter (where w.process_stage = 'questionnaire_done')
    from public.agent_workbench w where w.assigned_agent_id is not null group by w.assigned_agent_id
  on conflict (metric_date, agent_id) where scope = 'agent' do update
    set active_customers = excluded.active_customers, avg_lead_response_minutes = excluded.avg_lead_response_minutes, service_breaches = excluded.service_breaches,
        questionnaires_in_progress = excluded.questionnaires_in_progress, questionnaires_completed = greatest(m.questionnaires_completed, excluded.questionnaires_completed),
        updated_at = now();

  -- Abandonment: started more than 7 days ago, never submitted. Per step drop-off by last_step.
  update public.management_metrics m set
    questionnaire_abandonment_rate = (select round(100.0 * count(*) filter (where d.submitted_at is null and d.updated_at < now() - interval '7 days') / nullif(count(*), 0), 2) from public.questionnaire_drafts d),
    step_dropoff = (select coalesce(jsonb_object_agg(s.last_step, s.n), '{}'::jsonb)
                      from (select coalesce(last_step, 'unknown') as last_step, count(*) as n from public.questionnaire_drafts
                             where submitted_at is null and updated_at < now() - interval '7 days' group by 1) s)
   where m.metric_date = current_date and m.scope = 'system';

  select (select queue_length from pgmq.metrics('salesforce_events')), (select queue_length from pgmq.metrics('surense_outbound')) into v_pending_sf, v_pending_su;
  insert into public.management_metrics as m (metric_date, scope, pending_salesforce, pending_surense) values (current_date, 'system', v_pending_sf, v_pending_su)
  on conflict (metric_date) where scope = 'system' do update set pending_salesforce = excluded.pending_salesforce, pending_surense = excluded.pending_surense, updated_at = now();
end;
$$;

-- Time based flags (response breach) flip without any event: touch only rows whose flag would change.
create or replace function public.workbench_refresh_time_flags()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_target integer := coalesce((select value::integer from public.platform_settings where key = 'response_target_minutes'), 60); n integer;
begin
  update public.agent_workbench set updated_at = now()   -- the BEFORE trigger recomputes breach and urgency
   where not response_breach and assigned_at is not null and first_response_at is null and assigned_at < now() - make_interval(mins => v_target);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 4. Assignment rules (data) and assign_lead
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.assignment_rules (
  id bigint generated always as identity primary key,
  priority integer not null default 100,
  line_of_business text not null check (line_of_business in ('insurance','finance','any')),
  required_role text check (required_role in ('insurance_lead','finance_lead','agent')),
  sticky boolean not null default true,                         -- existing customers keep their agent
  strategy text not null default 'round_robin' check (strategy in ('round_robin','least_loaded')),
  load_cap integer check (load_cap is null or load_cap > 0),    -- TODO(owner): cap per agent
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
comment on table public.assignment_rules is 'Configurable assignment rules. No names; roles only. Changed only by super_admin through admin_upsert_assignment_rule (audited).';
alter table public.assignment_rules enable row level security;
revoke all on public.assignment_rules from anon, authenticated;
insert into public.assignment_rules (priority, line_of_business, required_role, sticky, strategy, load_cap)
select * from (values (10, 'insurance', 'insurance_lead', true, 'round_robin', null::integer),
                      (20, 'finance',   'finance_lead',   true, 'round_robin', null::integer)) v
 where not exists (select 1 from public.assignment_rules);

-- Pure twin: src/platform/assignment/assign.ts. Manual override is audited by the caller wrapper.
create or replace function public.assign_lead(p_customer uuid, p_line_of_business text, p_manual_agent uuid default null, p_agency uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule public.assignment_rules;
  v_existing uuid;
  v_agent uuid;
  v_reason text;
  v_row_exists boolean;
begin
  if p_line_of_business is null or p_line_of_business not in ('insurance','finance') then raise exception 'bad_line_of_business'; end if;   -- FIX
  perform pg_advisory_xact_lock(hashtext('assign_lead:' || p_line_of_business));     -- serialise: fair round robin, honest load cap
  select assigned_agent_id into v_existing from public.agent_workbench where customer_key = p_customer;
  v_row_exists := found;
  if p_manual_agent is not null then
    v_agent := p_manual_agent; v_reason := 'manual_override';
  else
    select * into rule from public.assignment_rules where enabled and line_of_business in (p_line_of_business, 'any') order by priority limit 1;
    if not found then
      v_reason := 'no_rule';
    else
      if rule.sticky and v_existing is not null and exists (
           select 1 from public.platform_user_roles r where r.user_id = v_existing and r.active and (rule.required_role is null or r.role = rule.required_role)) then
        v_agent := v_existing; v_reason := 'sticky';
      else
        select c.user_id into v_agent from (
          select r.user_id,
                 (select count(*) from public.agent_workbench w where w.assigned_agent_id = r.user_id and w.process_stage <> 'closed') as load,
                 (select max(w.assigned_at) from public.agent_workbench w where w.assigned_agent_id = r.user_id) as last_at
            from public.platform_user_roles r
           where r.active and r.role = coalesce(rule.required_role, 'agent') and (p_agency is null or r.agency_id is null or r.agency_id = p_agency)
        ) c
        where rule.load_cap is null or c.load < rule.load_cap
        order by case when rule.strategy = 'least_loaded' then c.load end asc nulls last, c.last_at asc nulls first, c.user_id
        limit 1;
        v_reason := case when v_agent is null then 'no_capacity' else rule.strategy end;
      end if;
    end if;
  end if;

  insert into public.agent_workbench as w (customer_key, agency_id, assigned_agent_id, assigned_at, line_of_business)
  values (p_customer, p_agency, v_agent, case when v_agent is not null then now() end, p_line_of_business)
  on conflict (customer_key) do update
    -- FIX: never un-assign an existing agent just because no rule/capacity matched now
    set assigned_agent_id = coalesce(excluded.assigned_agent_id, w.assigned_agent_id),
        assigned_at = case when excluded.assigned_agent_id is not null and excluded.assigned_agent_id is distinct from w.assigned_agent_id then excluded.assigned_at else w.assigned_at end,
        line_of_business = excluded.line_of_business, agency_id = coalesce(w.agency_id, excluded.agency_id);
  -- FIX: the insert trigger only counts brand-new rows; a lead whose row already existed (name/phone trigger ran first) was never counted.
  if v_row_exists and v_agent is not null and v_existing is null then perform public.metrics_bump(v_agent, 'new_leads', 1); end if;
  return jsonb_build_object('agent_id', coalesce(v_agent, v_existing), 'reason', v_reason);
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 5. Role-gated read RPCs (the ONLY way a logged-in user reads the two tables)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.get_agent_workbench(p_limit integer default 50, p_offset integer default 0, p_only_hot boolean default false, p_only_sync_errors boolean default false)
returns setof public.agent_workbench
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_role text := public.current_platform_role(); v_uid uuid := (select auth.uid()); v_mode text; v_agency uuid;
begin
  if v_role is null then raise exception 'forbidden' using errcode = '42501'; end if;
  p_limit := least(greatest(coalesce(p_limit, 50), 1), 200);
  if v_role in ('manager','super_admin') then
    return query select * from public.agent_workbench w
      where (not p_only_hot or w.urgency_score >= 70) and (not p_only_sync_errors or w.last_sync_status in ('error','halted'))
      order by w.urgency_score desc, w.customer_key limit p_limit offset p_offset;
    return;
  end if;
  v_mode := public.platform_visibility_mode();
  v_agency := public.get_user_agency_id(v_uid);
  return query select * from public.agent_workbench w
    where (not p_only_hot or w.urgency_score >= 70) and (not p_only_sync_errors or w.last_sync_status in ('error','halted'))
      and ( w.assigned_agent_id = v_uid
         or (v_mode = 'shared_pool_plus_own' and w.assigned_agent_id is null and v_agency is not null and w.agency_id = v_agency)   -- FIX: null agency matched every null-agency row
         or (v_mode = 'all_read_only' and v_agency is not null and w.agency_id = v_agency) )
    order by w.urgency_score desc, w.customer_key limit p_limit offset p_offset;
end;
$$;

create or replace function public.get_management_metrics(p_from date default current_date - 30, p_to date default current_date)
returns setof public.management_metrics
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_role text := public.current_platform_role(); v_uid uuid := (select auth.uid()); v_mode text;
begin
  if v_role is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_role in ('manager','super_admin') then
    return query select * from public.management_metrics m where m.metric_date between p_from and p_to order by m.metric_date desc, m.scope, m.agent_id;
    return;
  end if;
  v_mode := public.platform_visibility_mode();
  return query select * from public.management_metrics m
    where m.metric_date between p_from and p_to and m.scope = 'agent' and (m.agent_id = v_uid or v_mode = 'all_read_only')   -- never the system row for agents
    order by m.metric_date desc;
end;
$$;

-- Manager+ operational action: manual assignment override (audited).
create or replace function public.assign_lead_manual(p_customer uuid, p_agent uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_before uuid; v_res jsonb;
begin
  if coalesce(public.current_platform_role(), '') not in ('manager','super_admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  select assigned_agent_id into v_before from public.agent_workbench where customer_key = p_customer;
  v_res := public.assign_lead(p_customer, coalesce((select line_of_business from public.agent_workbench where customer_key = p_customer), 'insurance'), p_agent, null);
  perform public.platform_audit('assignment.manual_override', 'agent_workbench', p_customer::text, jsonb_build_object('agent', v_before), jsonb_build_object('agent', p_agent, 'reason', left(p_reason, 80)));
  return v_res;
end;
$$;

-- Super admin: settings (visibility_mode, targets, feature flags 'flag.*', integration switches). Step-up required, before/after audited.
create or replace function public.admin_set_setting(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_before text;
begin
  perform public.require_super_admin_fresh();
  if p_key not in ('visibility_mode','response_target_minutes') and p_key !~ '^(flag|integration)\.[a-z_.]+$' then raise exception 'setting_not_editable'; end if;
  if p_key = 'visibility_mode' and p_value not in ('own_only','shared_pool_plus_own','all_read_only') then raise exception 'bad_visibility_mode'; end if;
  -- FIX: workbench_before_write casts this value to integer on EVERY workbench write; a bad value would break all saves.
  if p_key = 'response_target_minutes' and p_value !~ '^[1-9][0-9]{0,4}$' then raise exception 'bad_response_target'; end if;
  select value into v_before from public.platform_settings where key = p_key;
  insert into public.platform_settings as s (key, value, updated_by) values (p_key, p_value, (select auth.uid()))
  on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
  perform public.platform_audit('setting.changed', 'platform_settings', p_key, jsonb_build_object('value', v_before), jsonb_build_object('value', p_value));
end;
$$;

create or replace function public.admin_upsert_assignment_rule(p_id bigint, p_priority integer, p_lob text, p_required_role text, p_sticky boolean, p_strategy text, p_load_cap integer, p_enabled boolean)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare v_before jsonb; v_id bigint;
begin
  perform public.require_super_admin_fresh();
  if p_id is not null then select to_jsonb(r) into v_before from public.assignment_rules r where id = p_id; end if;
  if p_id is null then
    insert into public.assignment_rules (priority, line_of_business, required_role, sticky, strategy, load_cap, enabled) values (p_priority, p_lob, p_required_role, p_sticky, p_strategy, p_load_cap, p_enabled) returning id into v_id;
  else
    update public.assignment_rules set priority = p_priority, line_of_business = p_lob, required_role = p_required_role, sticky = p_sticky, strategy = p_strategy, load_cap = p_load_cap, enabled = p_enabled, updated_at = now() where id = p_id returning id into v_id;
  end if;
  perform public.platform_audit('assignment_rule.changed', 'assignment_rules', v_id::text, v_before, (select to_jsonb(r) from public.assignment_rules r where id = v_id));
  return v_id;
end;
$$;

-- Execute rights. Read RPCs and manager actions: authenticated (they check the role themselves). Internals: service role only.
do $$
declare f text;
begin
  foreach f in array array[
    'current_platform_role()', 'platform_visibility_mode()', 'require_super_admin_fresh()',
    'get_agent_workbench(integer,integer,boolean,boolean)', 'get_management_metrics(date,date)',
    'assign_lead_manual(uuid,uuid,text)', 'admin_set_setting(text,text)',
    'admin_upsert_assignment_rule(bigint,integer,text,text,boolean,text,integer,boolean)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
  foreach f in array array[
    'platform_audit(text,text,text,jsonb,jsonb)', 'workbench_set_case_state(uuid,text,text,text,numeric,smallint)', 'workbench_set_sf_status(uuid,text)',
    'metrics_bump(uuid,text,integer)', 'metrics_refresh_daily()', 'workbench_refresh_time_flags()', 'assign_lead(uuid,text,uuid,uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
