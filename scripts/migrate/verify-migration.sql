-- T4 verification queries: counts and digests only, never row values. Run the TOKYO block on lvifatyksqizwcutfbqp
-- (read-only SELECTs) and the SEELD-SITE block on qxhpolktdfgcbxtfxgov; the digests must be equal.
-- Results of the 2026-11-18 run are recorded in docs/platform/DATA-MIGRATION.md.

-- ===== TOKYO =====
select 'customers' as dataset, count(*) as n,
       md5(string_agg(c.id::text, ',' order by c.id::text collate "C")) as ids_md5,
       md5(string_agg(c.id::text || '|' || left(btrim(c.first_name), 80) || '|' || left(btrim(c.last_name), 80) || '|'
                      || lpad(regexp_replace(c.id_number, '[^0-9]', '', 'g'), 9, '0'), ',' order by c.id::text collate "C")) as content_md5
  from public.customers c
union all
select 'travel_companies', count(*), md5(string_agg(t.id::text, ',' order by t.id::text collate "C")),
       md5(string_agg(to_jsonb(t)::text, ',' order by t.id::text collate "C"))
  from public.travel_companies t;

-- ===== SEELD-SITE =====
select private.customers_checksum();                      -- count, ids_md5, content_md5, mapped
select 'travel_companies' as dataset, count(*) as n,
       md5(string_agg(id::text, ',' order by id::text collate "C")) as ids_md5
  from content.travel_companies;
select count(*) filter (where is_active) as tracks_active, count(*) filter (where not is_active) as tracks_hidden,
       max(source_period) filter (where is_active) as source_as_of, max(last_sync) as last_sync,
       count(*) filter (where is_active and company not in (select slug from private.track_company_slugs)) as bad_slug
  from content.investment_tracks;
select dataset, batch_label, source_count, result - 'invalid_ids' as result, ran_at
  from private.data_migration_runs order by id;
