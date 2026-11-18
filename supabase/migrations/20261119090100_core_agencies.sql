-- V2-02 (ADR-24): agency boundary from day 1, applied to EVERY policy that reads identity rows.
create table core.agencies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 120),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table core.agencies enable row level security;
revoke all on core.agencies from anon, authenticated;
grant select on core.agencies to authenticated;
grant select, insert, update on core.agencies to service_role;
create trigger agencies_set_updated_at before update on core.agencies for each row execute function private.set_updated_at();
create trigger agencies_audit after insert or update or delete on core.agencies for each row execute function audit.log_change();
insert into core.agencies (id, name) values ('5eed0000-0000-4000-8000-000000000001', 'SEELD');

-- switches. A missing key reads as closed, except intake_enabled/chat_enabled (private.flag, V2-03).
insert into ops.config (key, value) values
  ('default_agency_id', '5eed0000-0000-4000-8000-000000000001'),
  ('intake_enabled', 'true'), ('chat_enabled', 'true'), ('portal_enabled', 'false'),
  ('tracks_sync_enabled', 'true'), ('stepup_max_age_sec', '900')
on conflict (key) do nothing;

alter table core.staff
  add column agency_id    uuid not null default '5eed0000-0000-4000-8000-000000000001' references core.agencies (id),
  add column locked_until timestamptz;
alter table core.staff alter column agency_id drop default;
alter table crm.leads
  add column agency_id  uuid not null default '5eed0000-0000-4000-8000-000000000001' references core.agencies (id),
  add column suspect    boolean not null default false,
  add column request_id text check (request_id is null or char_length(request_id) <= 64);
alter table crm.leads alter column agency_id drop default;
create index leads_agency_idx on crm.leads (agency_id);
create index staff_agency_idx on core.staff (agency_id);

create or replace function private.my_agency_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select s.agency_id from core.staff s where s.user_id = (select auth.uid()) and s.active
$$;
revoke all on function private.my_agency_id() from public, anon;
grant execute on function private.my_agency_id() to authenticated, service_role;

create policy agencies_select_authenticated on core.agencies for select to authenticated
  using (id = (select private.my_agency_id()));

-- review fix: the applied policies were agency-blind (a manager saw every agency's staff; any staff saw every client account)
drop policy staff_select on core.staff;
create policy staff_select on core.staff for select to authenticated
  using (user_id = (select auth.uid())
         or ((select private.is_manager()) and agency_id = (select private.my_agency_id())));
drop policy client_accounts_select on core.client_accounts;
create policy client_accounts_select on core.client_accounts for select to authenticated
  using (user_id = (select auth.uid()));
