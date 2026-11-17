-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).
-- Depends on: 06_event_queue.sql (event_log). Apply 06 to 09 as one release.
--
-- Two rules decide who may change a field:
--   1. FIELD OWNERSHIP (field_ownership): every field has exactly ONE system of record. A write from a non-owner
--      system is rejected (or routed as a proposal). Portal/manual are input channels, not systems of record.
--      The operational DB is NOT the source of truth for final commissions or long-term regulatory history
--      (store_policy = 'never_store').
--   2. TRUST RANKING (data_sources): for fields where several sources legitimately contribute (multi_source),
--      a lower-ranked source never overwrites a higher-ranked value; it may fill an EMPTY field.
--      1 clearing house, 2 Har HaBituach, 3 Surense agent report, 4 pre-treatment questionnaire, 5 manual template.
-- Provenance is kept per field (value, source, rank, observed_at) plus an append-only history.
-- Mirrors: src/platform/sources/{ranks,precedence,ownership}.ts (same decisions, tested on both sides).

-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.data_sources (
  source text primary key check (source ~ '^[a-z_]{3,40}$'),
  source_rank smallint not null unique check (source_rank between 1 and 5),
  label_he text not null
);
comment on table public.data_sources is 'Trust ranking. LOWER number = MORE trusted. Callers pass the source name; the rank is derived here so it cannot be forged.';
insert into public.data_sources (source, source_rank, label_he) values
  ('clearing_house', 1, 'מסלקה פנסיונית'),
  ('har_habituach', 2, 'הר הביטוח'),
  ('surense_agent_report', 3, 'דוח סוכן Surense'),
  ('pre_treatment_questionnaire', 4, 'שאלון טרום טיפול'),
  ('manual_template', 5, 'תבנית ידנית')
on conflict (source) do nothing;
alter table public.data_sources enable row level security;
revoke all on public.data_sources from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.field_ownership (
  field_key text primary key check (field_key ~ '^[a-z_]+(\.[a-z_]+)+$'),
  owner_system text not null check (owner_system in ('salesforce','surense','operational_db')),   -- exactly ONE system of record
  replicate_to text[] not null default '{}' check (replicate_to <@ array['salesforce','surense']),  -- read-only copies
  multi_source boolean not null default false,                                                    -- trust ranking arbitrates
  input_channels text[] not null default '{}' check (input_channels <@ array['portal','manual']),
  store_policy text not null default 'source_of_truth' check (store_policy in ('source_of_truth','mirror_readonly','never_store')),
  non_owner_mode text not null default 'reject' check (non_owner_mode in ('reject','propose')),
  category text not null,
  notes text
);
comment on table public.field_ownership is 'One system of record per field. Field keys below are PROPOSED categories: TODO(owner) map to the real Salesforce / Surense field names.';
alter table public.field_ownership enable row level security;
revoke all on public.field_ownership from anon, authenticated;

-- Proposed seed (owner approves the split). store_policy never_store = the operational DB must not hold it.
insert into public.field_ownership (field_key, owner_system, replicate_to, multi_source, input_channels, store_policy, non_owner_mode, category) values
  -- Salesforce: lead lifecycle, customer relationship, agent tasks, sales/service process, questionnaire summary
  ('lead.status',                  'salesforce', '{}',            false, '{}',          'source_of_truth', 'reject',  'lead_lifecycle'),
  ('lead.source_channel',          'salesforce', '{}',            false, '{portal}',    'source_of_truth', 'reject',  'lead_lifecycle'),
  ('customer.full_name',           'salesforce', '{surense}',     false, '{portal,manual}', 'source_of_truth', 'propose', 'customer_relationship'),
  ('customer.phone',               'salesforce', '{surense}',     false, '{portal,manual}', 'source_of_truth', 'propose', 'customer_relationship'),
  ('customer.email',               'salesforce', '{surense}',     false, '{portal,manual}', 'source_of_truth', 'propose', 'customer_relationship'),
  ('task.agent_task',              'salesforce', '{}',            false, '{manual}',    'source_of_truth', 'reject',  'agent_tasks'),
  ('process.sales_stage',          'salesforce', '{}',            false, '{}',          'source_of_truth', 'reject',  'sales_service_process'),
  ('process.service_stage',        'salesforce', '{}',            false, '{}',          'source_of_truth', 'reject',  'sales_service_process'),
  ('questionnaire.summary',        'salesforce', '{}',            false, '{portal}',    'source_of_truth', 'reject',  'questionnaire_summary'),
  -- Surense: institutional case state, clearing house / Har HaBituach ingestion, agent reports, coverages, accumulations, fees
  ('case.state',                   'surense',    '{salesforce}',  false, '{}',          'source_of_truth', 'reject',  'institutional_case'),
  ('ingestion.clearing_house',     'surense',    '{}',            false, '{}',          'source_of_truth', 'reject',  'ingestion'),
  ('ingestion.har_habituach',      'surense',    '{}',            false, '{}',          'source_of_truth', 'reject',  'ingestion'),
  ('report.agent_report',          'surense',    '{}',            false, '{}',          'source_of_truth', 'reject',  'agent_reports'),
  ('coverage.items',               'surense',    '{salesforce}',  true,  '{portal}',    'source_of_truth', 'reject',  'coverages'),
  ('accumulation.total',           'surense',    '{salesforce}',  true,  '{portal}',    'source_of_truth', 'reject',  'accumulations'),
  ('fees.management_fee',          'surense',    '{}',            true,  '{portal}',    'source_of_truth', 'reject',  'management_fees'),
  -- Operational DB: identity index, questionnaire drafts, queues, dashboard summaries (not routed anywhere)
  ('identity.index',               'operational_db', '{}',        false, '{}',          'source_of_truth', 'reject',  'operational'),
  ('questionnaire.draft',          'operational_db', '{}',        false, '{portal}',    'source_of_truth', 'reject',  'operational'),
  -- Never stored here: final commission calculations and long-term regulatory history stay in the system of record.
  ('commission.final',             'surense',    '{}',            false, '{}',          'never_store',     'reject',  'commissions'),
  ('regulatory.history',           'surense',    '{}',            false, '{}',          'never_store',     'reject',  'regulatory')
on conflict (field_key) do nothing;

-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.field_values (
  entity_type text not null check (entity_type in ('customer','case')),
  entity_id text not null check (char_length(entity_id) between 8 and 64),
  field_key text not null references public.field_ownership(field_key),
  value jsonb not null,                                   -- personal data: service role only
  source text not null references public.data_sources(source),
  source_rank smallint not null check (source_rank between 1 and 5),
  origin_system text not null check (origin_system in ('operational_db','salesforce','surense','portal','manual')),
  observed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id, field_key)
);
comment on table public.field_values is 'Current winning value per field with provenance (source, rank, observed_at).';
create index if not exists field_values_field_key_idx on public.field_values (field_key);
create index if not exists field_values_source_idx on public.field_values (source);
alter table public.field_values enable row level security;
revoke all on public.field_values from anon, authenticated;

create table if not exists public.field_value_history (
  id bigint generated always as identity primary key,
  recorded_at timestamptz not null default now(),
  entity_type text not null,
  entity_id text not null,
  field_key text not null,
  decision text not null,
  value jsonb,                                            -- stored only when the decision applied the value
  source text not null,
  source_rank smallint not null,
  origin_system text not null,
  observed_at timestamptz not null
);
comment on table public.field_value_history is 'Append-only record of every considered update and its decision (applied or rejected).';
create index if not exists field_value_history_entity_idx on public.field_value_history (entity_type, entity_id, field_key, recorded_at desc);
alter table public.field_value_history enable row level security;
revoke all on public.field_value_history from anon, authenticated;
create or replace function public.field_history_block_mutation() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'field_value_history is append-only'; end; $$;
drop trigger if exists field_value_history_no_mutation on public.field_value_history;
create trigger field_value_history_no_mutation before update or delete on public.field_value_history for each row execute function public.field_history_block_mutation();

-- Non-owner writes in 'propose' mode land here for the owning system's team (or an agent) to accept.
create table if not exists public.field_update_proposals (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  entity_type text not null,
  entity_id text not null,
  field_key text not null references public.field_ownership(field_key),
  proposed_value jsonb not null,
  source text not null references public.data_sources(source),
  origin_system text not null,
  status text not null default 'open' check (status in ('open','accepted','rejected')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz
);
create index if not exists field_update_proposals_open_idx on public.field_update_proposals (field_key) where status = 'open';
create index if not exists field_update_proposals_decided_by_idx on public.field_update_proposals (decided_by);
alter table public.field_update_proposals enable row level security;
revoke all on public.field_update_proposals from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Pure decision functions (twins of the TypeScript ones; table-driven pgTAP test in tests/07_source_precedence.test.sql)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.field_value_is_empty(p_value jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select p_value is null or p_value = 'null'::jsonb or (jsonb_typeof(p_value) = 'string' and btrim(p_value #>> '{}') = '');
$$;

create or replace function public.field_precedence_decision(
  p_cur_exists boolean, p_cur_value jsonb, p_cur_rank smallint, p_cur_observed timestamptz,
  p_in_value jsonb, p_in_rank smallint, p_in_observed timestamptz
) returns text language sql immutable set search_path = '' as $$
  select case
    when public.field_value_is_empty(p_in_value) then 'ignore_empty_incoming'
    when not p_cur_exists then 'apply_new'
    when public.field_value_is_empty(p_cur_value) then 'apply_fill_empty'
    when p_in_rank < p_cur_rank then 'apply_override'
    when p_in_rank > p_cur_rank then 'keep_higher_rank'
    when p_in_observed >= p_cur_observed then 'apply_newer_same_rank'
    else 'keep_newer_existing'
  end;
$$;

create or replace function public.field_ownership_decision(
  p_known boolean, p_owner text, p_multi boolean, p_inputs text[], p_store text, p_mode text, p_origin text
) returns text language sql immutable set search_path = '' as $$
  select case
    when not p_known then 'reject_unknown_field'
    when p_store = 'never_store' then 'reject_never_store'
    when p_multi then 'allow'
    when p_origin in ('salesforce','surense','operational_db') and p_origin = p_owner then 'allow'
    when p_origin in ('portal','manual') and p_origin = any (p_inputs) then 'allow'
    when p_mode = 'propose' then 'propose_not_owner'
    else 'reject_not_owner'
  end;
$$;

-- Destinations that must hear about a change: owner + replicas of the changed fields, minus the origin, only enabled queues.
create or replace function public.route_destinations(p_origin text, p_field_keys text[])
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct d), '{}')
    from (
      select f.owner_system as d from public.field_ownership f where f.field_key = any (p_field_keys) and f.owner_system in ('salesforce','surense')
      union
      select unnest(f.replicate_to) from public.field_ownership f where f.field_key = any (p_field_keys)
    ) t
    join public.queue_destinations q on q.destination = t.d and q.enabled
   where t.d <> p_origin;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- The ONLY write path into field_values.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.apply_field_update(
  p_entity_type text, p_entity_id text, p_field_key text, p_value jsonb,
  p_source text, p_observed_at timestamptz, p_origin text
) returns table (decision text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  fo public.field_ownership;
  v_rank smallint;
  v_own text;
  v_dec text;
  cur public.field_values;
  v_inserted integer;
begin
  select source_rank into v_rank from public.data_sources where source = p_source;
  if v_rank is null then raise exception 'unknown_source' using errcode = '22023'; end if;
  select * into fo from public.field_ownership where field_key = p_field_key;
  v_own := public.field_ownership_decision(found, fo.owner_system, fo.multi_source, fo.input_channels, fo.store_policy, fo.non_owner_mode, p_origin);

  if v_own <> 'allow' then
    if v_own = 'propose_not_owner' then
      insert into public.field_update_proposals (entity_type, entity_id, field_key, proposed_value, source, origin_system)
      values (p_entity_type, p_entity_id, p_field_key, p_value, p_source, p_origin);
    end if;
    -- unknown field: no FK-safe history row possible for the key, log to event_log instead (no value, no PII)
    insert into public.event_log (event_type, origin_system, code, meta) values ('field.rejected', p_origin, v_own, jsonb_build_object('field', p_field_key));
    return query select v_own;
    return;
  end if;

  -- Lock the current row (or create it). Two writers on the same field serialise here.
  insert into public.field_values (entity_type, entity_id, field_key, value, source, source_rank, origin_system, observed_at)
  select p_entity_type, p_entity_id, p_field_key, p_value, p_source, v_rank, p_origin, p_observed_at
   where not public.field_value_is_empty(p_value)
  on conflict (entity_type, entity_id, field_key) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    v_dec := 'apply_new';
  else
    select * into cur from public.field_values where entity_type = p_entity_type and entity_id = p_entity_id and field_key = p_field_key for update;
    v_dec := public.field_precedence_decision(found, cur.value, cur.source_rank, cur.observed_at, p_value, v_rank, p_observed_at);
    if v_dec like 'apply\_%' then
      update public.field_values
         set value = p_value, source = p_source, source_rank = v_rank, origin_system = p_origin, observed_at = p_observed_at, updated_at = now()
       where entity_type = p_entity_type and entity_id = p_entity_id and field_key = p_field_key;
    end if;
  end if;

  insert into public.field_value_history (entity_type, entity_id, field_key, decision, value, source, source_rank, origin_system, observed_at)
  values (p_entity_type, p_entity_id, p_field_key, v_dec, case when v_dec like 'apply\_%' then p_value end, p_source, v_rank, p_origin, p_observed_at);
  return query select v_dec;
end;
$$;

-- Winning values for the worker (it builds the outbound call from these; PII stays out of the queue).
create or replace function public.queue_load_fields(p_customer uuid, p_field_keys text[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(field_key, value), '{}'::jsonb)
    from public.field_values where entity_type = 'customer' and entity_id = p_customer::text and field_key = any (p_field_keys);
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'route_destinations(text,text[])',
    'apply_field_update(text,text,text,jsonb,text,timestamptz,text)',
    'queue_load_fields(uuid,text[])'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
