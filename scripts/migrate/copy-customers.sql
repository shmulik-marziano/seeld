-- ######################################################################################################################
-- EXECUTED 2026-11-18 (191/191) AND RETIRED 2026-11-19. DO NOT RUN AGAIN.
-- private.customers_import_sealed now raises PT410 'retired' (migration 20261119095300), and customers_transport_key in
-- seeld-site Vault holds a dead value (kept until the owner approves deleting it). This file is kept as the record of
-- what ran. Deviation from the plan (owner machine + bind parameters, no agent sees data) and the transcript exposure
-- are documented in docs/platform/DATA-MIGRATION.md section 2a and docs/platform/FOUNDATION-REVIEW-LOG.md.
-- Rejected details columns are removed with private.customers_details_drop_keys (DATA-MIGRATION.md section 2b);
-- approved extra columns need a details-merge, never a re-import.
-- ######################################################################################################################
-- One-time copy of the Tokyo customers (lvifatyksqizwcutfbqp, public.customers, 191 rows) into seeld-site
-- (qxhpolktdfgcbxtfxgov, crm.customers), sealed in transit. Contract: docs/platform/DATA-MIGRATION.md section 2.
-- No statement here, and no file anywhere, holds a customer value: the rows leave Tokyo only as a pgp_sym_encrypt blob
-- and are opened inside seeld-site by private.customers_import_sealed (migration 20261119095100).
-- Tokyo is READ-ONLY: every Tokyo statement below is a plain SELECT.
--
-- Placeholders (substituted in memory by the operator, never saved):
--   :TRANSPORT_KEY  the transport key (step 1). NEVER select a Vault secret into a client: this is what exposed it.
--   :OFFSET         0, 50, 100, 150                                             (step 2, one batch each)
--   :SEALED, :N, :IDS_MD5                                                       (step 3, from the step-2 result)
--
-- COPIED COLUMN LIST (copied BEFORE owner step 24; awaiting approve-after-the-fact, see DATA-MIGRATION.md section 2b):
--   top level : id -> legacy_id, first_name, last_name, id_number, mobile_phone, email
--   details   : id_type, birth_date, gender, marital_status, other_phone, city, street, house_number, apartment_number,
--               zip_code, source -> legacy_source, status -> legacy_status, created_at -> legacy_created_at
--   NOT copied: bank/branch/account_*, all income and budget fields, every health/medical/smoking field, internal_notes,
--               bank_notes, beneficiaries, spouse_name, extended_data, linked_user_id, agent_id, agency_id.

-- ===== step 0 (seeld-site, once): keys exist (created with gen_random_bytes; values are never printed) =====
select name, char_length(decrypted_secret) as len
  from vault.decrypted_secrets where name in ('pii_enc_key', 'national_id_hmac_key', 'customers_transport_key');
-- expected: 3 rows, len 64 each

-- ===== step 0b (Tokyo): source digests (no values) =====
select count(*) as n,
       md5(string_agg(c.id::text, ',' order by c.id::text collate "C")) as ids_md5,
       md5(string_agg(c.id::text || '|' || left(btrim(c.first_name), 80) || '|' || left(btrim(c.last_name), 80) || '|'
                      || lpad(regexp_replace(c.id_number, '[^0-9]', '', 'g'), 9, '0'), ',' order by c.id::text collate "C")) as content_md5
  from public.customers c;

-- ===== step 1 (seeld-site): REMOVED =====
-- The 2026-11-18 run selected the transport key out of vault.decrypted_secrets into the agent session, which printed a
-- Vault secret into the transcript. A Vault secret must never be selected into a client. The statement is not kept here.

-- ===== step 2 (Tokyo, once per batch): seal one batch of 50 =====
with b as (
  select c.* from public.customers c order by c.id::text collate "C" limit 50 offset :OFFSET
), j as (
  select c.id::text as legacy_id, jsonb_build_object(
    'legacy_id', c.id, 'first_name', c.first_name, 'last_name', c.last_name, 'id_number', c.id_number,
    'mobile_phone', c.mobile_phone, 'email', c.email,
    'details', jsonb_strip_nulls(jsonb_build_object('id_type', c.id_type, 'birth_date', c.birth_date, 'gender', c.gender,
       'marital_status', c.marital_status, 'other_phone', c.other_phone, 'city', c.city, 'street', c.street,
       'house_number', c.house_number, 'apartment_number', c.apartment_number, 'zip_code', c.zip_code,
       'legacy_source', c.source, 'legacy_status', c.status, 'legacy_created_at', c.created_at))) as r
  from b c)
select count(*) as n,
       md5(string_agg(legacy_id, ',' order by legacy_id collate "C")) as ids_md5,
       replace(extensions.armor(extensions.pgp_sym_encrypt(jsonb_agg(r order by legacy_id collate "C")::text, ':TRANSPORT_KEY',
               'compress-algo=2, compress-level=9, cipher-algo=aes256')), chr(10), '|') as sealed
  from j;

-- ===== step 3 (seeld-site, once per batch): open + import (idempotent; a re-run inserts 0) =====
select private.customers_import_sealed(replace(':SEALED', '|', chr(10)), 'tokyo-offset-:OFFSET', :N, ':IDS_MD5');
-- expected per batch: {"received": N, "inserted": N, "skipped": 0, "invalid": 0, "invalid_ids": [], "run_id": .., "ids_md5": ..}

-- ===== step 4 (seeld-site): verify against step 0b =====
select private.customers_checksum();
-- expected: count 191, ids_md5 and content_md5 equal to step 0b, mapped 191
select private.pii_decrypt(national_id_enc) ~ '^[0-9]{9}$' as one_decrypt_ok from crm.customers order by id limit 1;
select count(*) as runs, sum((result ->> 'inserted')::int) as inserted, sum((result ->> 'invalid')::int) as invalid
  from private.data_migration_runs where dataset = 'customers';

-- ===== step 5 (seeld-site): kill the transport key (the copy is one-time; the key is useless afterwards) =====
select vault.update_secret(id, encode(extensions.gen_random_bytes(32), 'hex'), 'customers_transport_key',
                           'T4: rotated to a dead value after the one-time customers copy')
  from vault.secrets where name = 'customers_transport_key';
