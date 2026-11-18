-- T4 data-import helpers for the one-time copy of the Tokyo customers (ADR-41, owner decision 2026-11-18).
-- The rows travel SEALED: the Tokyo side SELECTs them as one pgp_sym_encrypt(...) armored blob under a transport key
-- that lives in this project's Vault ('customers_transport_key'); this side opens the blob in memory, hands the array to
-- private.customers_import (091300/091400: HMAC + pgcrypto, PII-safe errors) and records counts and checksums only.
-- No statement on this side ever carries a plaintext row, so neither the Postgres log nor an error DETAIL can hold one.
-- Nothing here is reachable by an API role.

-- run log: counts and checksums only, never row values
create table private.data_migration_runs (
  id              bigint generated always as identity primary key,
  dataset         text not null check (dataset ~ '^[a-z_]{1,40}$'),
  source_project  text not null check (char_length(source_project) <= 40),
  batch_label     text check (char_length(batch_label) <= 40),
  source_count    integer,
  source_checksum text check (source_checksum is null or source_checksum ~ '^[0-9a-f]{32}$'),
  result          jsonb not null default '{}'::jsonb,
  ran_at          timestamptz not null default now()
);
comment on table private.data_migration_runs is 'T4 data migration log: per batch counts, md5 checksums and the import result (legacy ids of invalid rows only). No personal values.';
alter table private.data_migration_runs enable row level security;
revoke all on private.data_migration_runs from public, anon, authenticated, service_role;

-- migration map: Tokyo id -> new id. Holds no personal data, so it cannot be used to rebuild a customer.
create table private.customers_migration_map (
  legacy_id   uuid primary key,
  customer_id uuid not null unique references crm.customers (id) on delete cascade,
  run_id      bigint references private.data_migration_runs (id),
  mapped_at   timestamptz not null default now()
);
comment on table private.customers_migration_map is 'Tokyo public.customers.id -> crm.customers.id. No personal values.';
alter table private.customers_migration_map enable row level security;
revoke all on private.customers_migration_map from public, anon, authenticated, service_role;

-- p_sealed: armor(pgp_sym_encrypt(<json array of import rows>, <customers_transport_key>)) produced by the Tokyo SELECT in
-- scripts/migrate/copy-customers.sql. p_source_count / p_source_checksum: the same batch's count and md5 over its ids.
create or replace function private.customers_import_sealed(p_sealed text, p_batch_label text,
                                                           p_source_count integer, p_source_checksum text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_rows jsonb; v_res jsonb; v_run bigint; v_ids_md5 text;
begin
  if p_sealed is null or char_length(p_sealed) > 4000000 then raise exception 'invalid_input:sealed' using errcode = 'PT400'; end if;
  v_rows := extensions.pgp_sym_decrypt(extensions.dearmor(p_sealed), private.vault_secret('customers_transport_key'))::jsonb;
  if jsonb_typeof(v_rows) <> 'array' then raise exception 'invalid_input:rows' using errcode = 'PT400'; end if;
  select md5(coalesce(string_agg(e ->> 'legacy_id', ',' order by (e ->> 'legacy_id') collate "C"), '')) into v_ids_md5
    from jsonb_array_elements(v_rows) e;
  if p_source_count is distinct from jsonb_array_length(v_rows) or p_source_checksum is distinct from v_ids_md5 then
    raise exception 'checksum_mismatch' using errcode = 'PT409';
  end if;

  v_res := private.customers_import(v_rows);
  insert into private.data_migration_runs (dataset, source_project, batch_label, source_count, source_checksum, result)
  values ('customers', 'tokyo', left(p_batch_label, 40), p_source_count, p_source_checksum, v_res)
  returning id into v_run;

  insert into private.customers_migration_map (legacy_id, customer_id, run_id)
  select c.legacy_id, c.id, v_run
    from crm.customers c
   where c.legacy_id in (select (e ->> 'legacy_id')::uuid from jsonb_array_elements(v_rows) e
                          where (e ->> 'legacy_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  on conflict (legacy_id) do nothing;
  return v_res || jsonb_build_object('run_id', v_run, 'ids_md5', v_ids_md5);
end $$;

-- Verification without reading values out: count, md5 over the sorted legacy ids, and md5 over
-- legacy_id|first_name|last_name|normalised national id (decrypted inside the database). The Tokyo side computes the same
-- two digests with scripts/migrate/copy-customers.sql (source checksum query); equal digests prove an exact copy.
create or replace function private.customers_checksum()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'count', count(*),
    'ids_md5', md5(coalesce(string_agg(c.legacy_id::text, ',' order by c.legacy_id::text collate "C"), '')),
    'content_md5', md5(coalesce(string_agg(c.legacy_id::text || '|' || c.first_name || '|' || c.last_name || '|'
                                            || private.pii_decrypt(c.national_id_enc), ',' order by c.legacy_id::text collate "C"), '')),
    'with_phone', count(c.mobile_phone), 'with_email', count(c.email), 'with_details', count(c.details_enc),
    'mapped', (select count(*) from private.customers_migration_map))
  from crm.customers c where c.legacy_id is not null
$$;

revoke all on function private.customers_import_sealed(text, text, integer, text), private.customers_checksum()
  from public, anon, authenticated, service_role;
