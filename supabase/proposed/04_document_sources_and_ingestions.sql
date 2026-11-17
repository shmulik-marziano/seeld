-- PATCHED COPY (review fixes, NOT executed against a database). Original untouched. See C:/tmp/infra/sql-review.md
-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).

-- document_sources: catalog of supported source types (clearing house, Har HaBituach, third TBD).
-- document_ingestions: one row per uploaded file and its processing status.
-- Mirrors src/platform/documents (types.ts, schemas.ts). No parsing happens in the database.

create table if not exists public.document_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null unique check (source_type in ('clearing-house','har-habituach','third-source')),
  display_name text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.document_sources is 'Catalog of supported document source types. Edited by service role only.';

alter table public.document_sources enable row level security;
revoke all on public.document_sources from anon, authenticated;
grant select on public.document_sources to authenticated;
drop policy if exists "signed-in users read the enabled source catalog" on public.document_sources;
create policy "signed-in users read the enabled source catalog"
  on public.document_sources for select to authenticated
  using (enabled);

insert into public.document_sources (source_type, display_name, enabled) values
  ('clearing-house', 'מסלקה פנסיונית', false),
  ('har-habituach', 'הר הביטוח', false),
  ('third-source', 'מקור שלישי (טרם הוגדר)', false)
on conflict (source_type) do nothing;

create table if not exists public.document_ingestions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  source_id uuid not null references public.document_sources(id),
  source_type text not null check (source_type in ('clearing-house','har-habituach','third-source')),
  status text not null default 'uploaded'
    check (status in ('uploaded','validating','parsing','normalising','ready','failed','rejected')),
  error_code text,                                -- machine code only, never file content
  storage_path text not null,                     -- private bucket path, prefixed by owner_id
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);
comment on table public.document_ingestions is 'One row per uploaded file. Status transitions are written by the service role only.';
comment on column public.document_ingestions.storage_path is 'Path in a PRIVATE storage bucket, prefixed by owner_id.';

create index if not exists document_ingestions_owner_id_idx on public.document_ingestions (owner_id, created_at desc);
create index if not exists document_ingestions_agency_id_idx on public.document_ingestions (agency_id);
create index if not exists document_ingestions_source_id_idx on public.document_ingestions (source_id);
create index if not exists document_ingestions_open_status_idx on public.document_ingestions (status)
  where status not in ('ready','rejected');

alter table public.document_ingestions enable row level security;
revoke all on public.document_ingestions from anon, authenticated;
grant select, insert on public.document_ingestions to authenticated;

drop policy if exists "owners read their ingestions" on public.document_ingestions;
create policy "owners read their ingestions"
  on public.document_ingestions for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "agency members read their agency ingestions" on public.document_ingestions;
create policy "agency members read their agency ingestions"
  on public.document_ingestions for select to authenticated
  using (agency_id is not null and agency_id = (select public.get_user_agency_id((select auth.uid()))));

drop policy if exists "owners start an ingestion for themselves" on public.document_ingestions;
create policy "owners start an ingestion for themselves"
  on public.document_ingestions for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'uploaded'
    -- FIX: path must be inside the caller's own folder, agency must be the caller's own (or null), source must be enabled and match source_type
    and storage_path like (select auth.uid())::text || '/%'
    and (agency_id is null or agency_id = (select public.get_user_agency_id((select auth.uid()))))
    and exists (select 1 from public.document_sources s where s.id = source_id and s.enabled and s.source_type = document_ingestions.source_type));
-- No update/delete policy: status changes are made by the processing worker (service role).
