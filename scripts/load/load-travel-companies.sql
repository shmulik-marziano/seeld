-- T4: copy Tokyo public.travel_companies (6 rows, public content, no personal data) into content.travel_companies.
-- Ran once on 2026-11-18 (6 inserted, digest d7afc28c09f21e20f58d8ac84ebd8654 equal on both sides). Idempotent: on conflict (slug) do nothing.
-- The rows travel as one compressed pgp blob only to keep the statement small (the key is not a secret: public data).
--
-- step 1 (Tokyo, read-only):
select count(*) as n, md5(string_agg(to_jsonb(t)::text, ',' order by t.id::text collate "C")) as row_md5,
       replace(extensions.armor(extensions.pgp_sym_encrypt(jsonb_agg(to_jsonb(t) order by t.id::text collate "C")::text,
               'travel-public-transport', 'compress-algo=2, compress-level=9')), chr(10), '|') as packed
  from public.travel_companies t;

-- step 2 (seeld-site): :PACKED and :ROW_MD5 from step 1. Nothing is inserted unless the digest matches.
-- Mapping: id, slug, name kept; note -> description; agent_link -> website_url; logo -> logo_url; sort -> sort_order;
-- active, updated_at kept; every other Tokyo column (insurer, model, medical, deductible, prices, strengths, ...) -> coverage jsonb.
with src as (select extensions.pgp_sym_decrypt(extensions.dearmor(replace(':PACKED', '|', chr(10))), 'travel-public-transport')::jsonb a),
el as (select e from src, jsonb_array_elements(src.a) e),
chk as (select md5(string_agg(e::text, ',' order by (e->>'id') collate "C")) m, count(*) n from el),
ins as (
  insert into content.travel_companies (id, slug, name, description, website_url, logo_url, coverage, sort_order, active, updated_at)
  select (e->>'id')::uuid, e->>'slug', e->>'name', nullif(e->>'note', ''), nullif(e->>'agent_link', ''), nullif(e->>'logo', ''),
         e - array['id','slug','name','note','agent_link','logo','sort','active','updated_at'],
         coalesce((e->>'sort')::int, 100), coalesce((e->>'active')::boolean, true), coalesce((e->>'updated_at')::timestamptz, now())
    from el where (select m from chk) = ':ROW_MD5'
  on conflict (slug) do nothing returning 1)
select (select m from chk) as md5, (select n from chk) as n, (select count(*) from ins) as inserted;
