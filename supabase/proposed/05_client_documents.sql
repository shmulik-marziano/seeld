-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).
-- Depends on: 04_document_sources_and_ingestions.sql

-- client_documents: normalised results of an ingestion, shown in the client's personal area.
-- Source-agnostic product facts (see NormalisedProduct in src/platform/documents/types.ts).
-- Written by the processing worker (service role). Clients read their own; agency members read their agency's.

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  ingestion_id uuid not null references public.document_ingestions(id) on delete cascade,
  source_type text not null check (source_type in ('clearing-house','har-habituach','third-source')),
  source_ref text not null,                      -- stable id inside the source file, for de-duplication
  category text not null check (category in ('pension','provident','study-fund','life','health','other')),
  provider_name text,
  data jsonb not null default '{}'::jsonb,       -- TODO(owner): promote fields to columns after sample review
  report_date date,
  created_at timestamptz not null default now(),
  unique (ingestion_id, source_ref)
);
comment on table public.client_documents is 'Normalised product rows derived from uploads. Personal financial data: RLS is mandatory.';

create index if not exists client_documents_owner_id_idx on public.client_documents (owner_id, category);
create index if not exists client_documents_agency_id_idx on public.client_documents (agency_id);
create index if not exists client_documents_ingestion_id_idx on public.client_documents (ingestion_id);

alter table public.client_documents enable row level security;
revoke all on public.client_documents from anon, authenticated;
grant select on public.client_documents to authenticated;

create policy "owners read their documents"
  on public.client_documents for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "agency members read their agency documents"
  on public.client_documents for select to authenticated
  using (agency_id is not null and agency_id = (select public.get_user_agency_id((select auth.uid()))));
-- No insert/update/delete policy: service role only.
