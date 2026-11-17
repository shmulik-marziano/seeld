-- PROPOSED, NOT APPLIED, needs owner approval.
-- This file lives in supabase/proposed/ on purpose: the Supabase CLI and the migrations folder never read it.
-- To adopt: owner approves, then copy into supabase/migrations/<timestamp>_<name>.sql and apply on a
-- branch/preview database first. Review against the live schema (shared project, sibling products).

-- api_clients: external systems that call /api/v1 with an API key (server to server).
-- Keys are shown once at creation and stored only as a SHA-256 hash. Access: service role only
-- (RLS enabled, deliberately NO policies for anon/authenticated).

create table if not exists public.api_clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  key_prefix text not null check (char_length(key_prefix) = 8),      -- first 8 chars, for lookup and display
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'), -- sha256 hex of the full key
  scopes text[] not null default '{}',
  rate_limit_per_min integer not null default 60 check (rate_limit_per_min between 1 and 10000),
  status text not null default 'active' check (status in ('active','revoked')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);

comment on table public.api_clients is 'External API clients. Key stored hashed only. Service role access only.';
comment on column public.api_clients.key_hash is 'sha256 hex of the full API key. The plaintext key is never stored.';
comment on column public.api_clients.scopes is 'Granted scopes, e.g. documents:read. "*" grants all (avoid).';

-- indexes for foreign keys and lookup paths
create index if not exists api_clients_agency_id_idx on public.api_clients (agency_id);
create index if not exists api_clients_created_by_idx on public.api_clients (created_by);
create index if not exists api_clients_key_prefix_idx on public.api_clients (key_prefix) where status = 'active';

alter table public.api_clients enable row level security;
-- No policies: anon and authenticated are denied. The api-v1 function uses the service role.
revoke all on public.api_clients from anon, authenticated;
