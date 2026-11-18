-- V2-14 (ADR-41): the 191 Tokyo customers, copied ENCRYPTED. National id = HMAC (lookup/dedupe) + pgp ciphertext;
-- other personal details = one encrypted JSON blob. Keys live only in Vault (pii_enc_key, national_id_hmac_key) and in the
-- owner's offline escrow. No API role can read this table; the rebuilt agents app will read it through a logging staff RPC.
-- Applying this file needs no secret. The Vault keys are a precondition of the IMPORT only (owner step 16): without them
-- private.vault_secret raises 55000 vault_secret_missing:<name> and nothing is written. customers_import is replaced in 091400.
create table crm.customers (
  id               uuid primary key default gen_random_uuid(),
  agency_id        uuid not null references core.agencies (id),
  legacy_id        uuid unique,
  first_name       text not null check (char_length(first_name) between 1 and 80),
  last_name        text not null check (char_length(last_name) between 1 and 80),
  mobile_phone     text check (mobile_phone is null or mobile_phone ~ '^0[2-9][0-9]{7,8}$'),
  email            text check (email is null or (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')),
  national_id_hmac bytea not null check (octet_length(national_id_hmac) = 32),
  national_id_enc  bytea not null,
  details_enc      bytea,
  status           text not null default 'active' check (status in ('active', 'inactive')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table crm.customers is 'PII. Imported encrypted from Tokyo (2026-11). No API role has any privilege; reads only through a future logging staff RPC.';
create unique index customers_agency_national_id_idx on crm.customers (agency_id, national_id_hmac);
create index customers_agency_idx on crm.customers (agency_id);
alter table crm.customers enable row level security;
revoke all on crm.customers from anon, authenticated, service_role;
create policy deny_api_roles on crm.customers for all to anon, authenticated using (false) with check (false);
create trigger customers_set_updated_at before update on crm.customers for each row execute function private.set_updated_at();
create trigger customers_audit after insert or update or delete on crm.customers for each row execute function audit.log_change('no_values');

create or replace function private.vault_secret(p_name text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = p_name;
  if v is null or char_length(v) < 32 then
    raise exception 'vault_secret_missing:%', p_name using errcode = '55000';
  end if;
  return v;
end $$;

-- digits only, left-padded to 9; anything longer than 9 digits or empty is rejected
create or replace function private.national_id_norm(p_id text)
returns text language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p_id, ''), '[^0-9]', '', 'g');
begin
  if char_length(d) not between 5 and 9 then raise exception 'invalid_input:national_id' using errcode = 'PT400'; end if;
  return lpad(d, 9, '0');
end $$;

create or replace function private.national_id_hmac(p_id text)
returns bytea language sql stable security definer set search_path = '' as $$
  select extensions.hmac(convert_to(private.national_id_norm(p_id), 'utf8'),
                         convert_to(private.vault_secret('national_id_hmac_key'), 'utf8'), 'sha256')
$$;

create or replace function private.pii_encrypt(p_text text)
returns bytea language sql volatile security definer set search_path = '' as $$
  select case when p_text is null then null
              else extensions.pgp_sym_encrypt(p_text, private.vault_secret('pii_enc_key'), 'cipher-algo=aes256') end
$$;

create or replace function private.pii_decrypt(p_data bytea)
returns text language sql stable security definer set search_path = '' as $$
  select case when p_data is null then null
              else extensions.pgp_sym_decrypt(p_data, private.vault_secret('pii_enc_key')) end
$$;

-- one-shot import, run by the owner as postgres (scripts/load/copy-customers.mjs streams Tokyo rows straight in; no file, no dump).
-- p_rows: [{legacy_id, first_name, last_name, id_number, mobile_phone, email, details:{...approved columns only}}]
create or replace function private.customers_import(p_rows jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_agency uuid := (select value::uuid from ops.config where key = 'default_agency_id'); n_in integer; n_total integer;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 1000 then
    raise exception 'invalid_input:rows' using errcode = 'PT400';
  end if;
  n_total := jsonb_array_length(p_rows);
  insert into crm.customers (agency_id, legacy_id, first_name, last_name, mobile_phone, email,
                             national_id_hmac, national_id_enc, details_enc)
  select v_agency, (r ->> 'legacy_id')::uuid, left(btrim(r ->> 'first_name'), 80), left(btrim(r ->> 'last_name'), 80),
         case when x.phone ~ '^0[2-9][0-9]{7,8}$' then x.phone end,
         case when char_length(x.email) <= 254 and x.email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then x.email end,
         private.national_id_hmac(r ->> 'id_number'),
         private.pii_encrypt(private.national_id_norm(r ->> 'id_number')),
         case when jsonb_typeof(r -> 'details') = 'object' and r -> 'details' <> '{}'::jsonb
              then private.pii_encrypt((r -> 'details')::text) end
    from jsonb_array_elements(p_rows) r
    cross join lateral (select regexp_replace(regexp_replace(coalesce(r ->> 'mobile_phone', ''), '[^0-9+]', '', 'g'), '^(\+972|972)', '0') as phone,
                               lower(btrim(coalesce(r ->> 'email', ''))) as email) x
  on conflict do nothing;
  get diagnostics n_in = row_count;
  return jsonb_build_object('received', n_total, 'inserted', n_in, 'skipped', n_total - n_in);
end $$;

revoke all on function private.vault_secret(text), private.national_id_norm(text), private.national_id_hmac(text),
  private.pii_encrypt(text), private.pii_decrypt(bytea), private.customers_import(jsonb)
  from public, anon, authenticated, service_role;
