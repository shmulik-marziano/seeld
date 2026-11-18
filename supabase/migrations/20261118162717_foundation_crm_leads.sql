-- FOUNDATION 06: private lead store. One table for every intake form (insurance, pension, contact,
-- portfolio review, report). Kind-specific answers live in payload (validated size/type, schema-checked in the app).
-- Replaces Tokyo insurance_leads / pension_analysis_leads / contact_submissions (and the NEW-ONLY onboarding flow
-- later gets its own table in crm when the questionnaire platform is adopted).

create table crm.leads (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null check (kind in ('insurance', 'pension', 'contact', 'portfolio_review', 'report')),
  status          text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')),
  full_name       text not null check (char_length(full_name) between 2 and 120),
  phone           text check (phone is null or phone ~ '^0[2-9][0-9]{7,8}$'),
  email           text check (email is null or (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  message         text check (message is null or char_length(message) <= 4000),
  payload         jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 16000),
  source          text check (source is null or char_length(source) <= 300),
  utm             jsonb not null default '{}'::jsonb check (jsonb_typeof(utm) = 'object' and octet_length(utm::text) <= 2000),
  consent_at      timestamptz not null,
  consent_version text not null check (char_length(consent_version) between 1 and 40),
  ip_hash         bytea,
  assigned_to     uuid references core.staff (user_id) on delete set null,
  notes           text check (notes is null or char_length(notes) <= 8000),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (phone is not null or email is not null)
);
comment on table crm.leads is 'PII. Staff (aal2) only. Insert path for the public is api.submit_lead(). Soft delete via deleted_at; hard delete is service_role only.';
create index leads_inbox_idx on crm.leads (status, created_at desc) where deleted_at is null;
create index leads_assigned_idx on crm.leads (assigned_to) where assigned_to is not null;
create index leads_dedupe_email_idx on crm.leads (kind, lower(email), created_at desc) where email is not null;
create index leads_dedupe_phone_idx on crm.leads (kind, phone, created_at desc) where phone is not null;

create trigger leads_set_updated_at before update on crm.leads
  for each row execute function private.set_updated_at();
create trigger leads_audit after insert or update or delete on crm.leads
  for each row execute function audit.log_change('no_values');

alter table crm.leads enable row level security;

grant select, insert on crm.leads to authenticated;
-- staff may change only workflow columns, never consent/identity/IP evidence
grant update (status, assigned_to, notes, deleted_at) on crm.leads to authenticated;
grant select, insert, update, delete on crm.leads to service_role;

create policy leads_select on crm.leads for select to authenticated
  using ((select private.is_staff()));
create policy leads_insert on crm.leads for insert to authenticated
  with check ((select private.is_staff()));
create policy leads_update on crm.leads for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
-- no delete policy for authenticated: soft delete only
