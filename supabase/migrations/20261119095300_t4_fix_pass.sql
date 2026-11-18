-- T4 fix pass (review of 095000/095100):
--  1. The one-time sealed customers copy is DONE (191/191). private.customers_import_sealed is retired: its body now
--     refuses every call before touching the argument, so the transport path cannot be reused and no decrypt/cast can
--     ever echo row content into an error DETAIL again. The dead 'customers_transport_key' Vault secret stays until the
--     owner approves deleting it.
--  2. private.customers_details_drop_keys: the documented "narrow" procedure for any details column the owner rejects
--     at step 24 (approve-after-the-fact). Runs inside the database, returns a count only, and masks every error so no
--     DETAIL/CONTEXT carries row content (same rule as R2-F5 / 091400).
--  3. Unindexed FK private.customers_migration_map.run_id (performance advisor INFO).
--  4. content.refresh_investment_tracks (replaces 095000; same contract, same guards):
--     * fund-id collisions across datasets: data.gov.il ids are unique per dataset only (e.g. one id is both a gemelnet
--       fund and a bituachnet policy). The dataset with the lowest rank (gemelnet, pensyanet, bituachnet) keeps the plain
--       id; every other dataset sharing that id is keyed as <G|P|B><id>, so no real track is silently dropped. Ids that
--       collide inside one dataset still keep the largest fund. The count is returned as 'collisions'.
--     * mapping visibility: 'unmapped_companies' / 'unmapped_funds' (board companies the site does not list) are returned
--       and land in the watchdog cma-refresh job_run stats, so a slug-map regression is visible before the shrink guard.

create index if not exists customers_migration_map_run_idx on private.customers_migration_map (run_id);

create or replace function private.customers_import_sealed(p_sealed text, p_batch_label text,
                                                           p_source_count integer, p_source_checksum text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  raise exception 'retired:customers_import_sealed' using errcode = 'PT410',
    hint = 'the one-time Tokyo customers copy finished on 2026-11-18 (191/191); see docs/platform/DATA-MIGRATION.md';
end $$;
revoke all on function private.customers_import_sealed(text, text, integer, text) from public, anon, authenticated, service_role;
comment on function private.customers_import_sealed(text, text, integer, text) is 'RETIRED (095300). The one-time sealed customers copy ran on 2026-11-18; every call raises PT410.';

-- p_keys: details keys to remove from every customer's encrypted details blob (only keys of the copied list are allowed).
-- Returns {"updated": n}. Never returns, logs or raises a value.
create or replace function private.customers_details_drop_keys(p_keys text[])
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_n integer := 0;
begin
  if p_keys is null or cardinality(p_keys) = 0 or not (p_keys <@ array['id_type', 'birth_date', 'gender', 'marital_status',
       'other_phone', 'city', 'street', 'house_number', 'apartment_number', 'zip_code', 'legacy_source', 'legacy_status',
       'legacy_created_at']) then
    raise exception 'invalid_input:keys' using errcode = 'PT400';
  end if;
  begin
    with d as (
      select c.id, private.pii_decrypt(c.details_enc)::jsonb as j from crm.customers c where c.details_enc is not null
    )
    update crm.customers c set details_enc = private.pii_encrypt((d.j - p_keys)::text)
      from d where d.id = c.id and d.j ?| p_keys;
    get diagnostics v_n = row_count;
  exception when others then
    raise exception 'details_drop_failed' using errcode = 'PT500';
  end;
  return jsonb_build_object('updated', v_n);
end $$;
revoke all on function private.customers_details_drop_keys(text[]) from public, anon, authenticated, service_role;

create or replace function content.refresh_investment_tracks()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_now timestamptz := now(); v_before integer; v_touched integer; v_off integer := 0;
        v_coll integer; v_unm_co integer; v_unm_f integer;
begin
  if not private.flag('tracks_sync_enabled') then return jsonb_build_object('skipped', 'disabled'); end if;
  if not exists (select 1 from content.cma_board) then return jsonb_build_object('skipped', 'board_empty'); end if;
  select count(*) into v_before from content.investment_tracks where is_active;

  select count(distinct x.company) filter (where x.slug is null), count(distinct x.fund_id) filter (where x.slug is null)
    into v_unm_co, v_unm_f
    from (select b.company, b.fund_id, private.track_company_slug(b.company) as slug from content.cma_board b
           where b.fund_id is not null and b.fund_name is not null
             and b.board_product in ('gemel', 'gemel_invest', 'hishtalmut', 'pensia', 'polisa', 'child_savings')) x;
  select count(*) into v_coll
    from (select b.fund_id from content.cma_board b
           where b.fund_id is not null and b.fund_name is not null
             and b.board_product in ('gemel', 'gemel_invest', 'hishtalmut', 'pensia', 'polisa', 'child_savings')
             and private.track_company_slug(b.company) is not null
           group by b.fund_id having count(distinct b.source) > 1) c;

  insert into content.investment_tracks as t (fund_number, name, company, product_type, specialization, stock_exposure,
    return_year1, return_year3, return_year5, return_month, fee_assets, fee_deposits, sharpe_ratio, total_assets, liquidity,
    report_period, foreign_exposure, currency_exposure, stocks_pct, is_active, last_sync, source, source_period)
  with src as (
    select b.*, m.slug,
           dense_rank() over (partition by b.fund_id order by case b.source when 'gemelnet' then 1 when 'pensyanet' then 2
                                                                when 'bituachnet' then 3 else 4 end, b.source) as src_rank
      from content.cma_board b
      cross join lateral (select private.track_company_slug(b.company) as slug) m
     where b.fund_id is not null and b.fund_name is not null and m.slug is not null
       and b.board_product in ('gemel', 'gemel_invest', 'hishtalmut', 'pensia', 'polisa', 'child_savings')
  ), keyed as (
    -- one key per (dataset, id): the lowest-ranked dataset keeps the plain id, the others get a one-letter prefix
    select s.*, case when s.src_rank = 1 then s.fund_id else upper(left(s.source, 1)) || s.fund_id end as track_key from src s
  )
  select distinct on (b.track_key)
    b.track_key,
    left(b.fund_name, 300),
    b.slug,
    b.board_product,
    private.track_specialization(b.track),
    case when b.stock_pct between 0 and 100 then round(b.stock_pct)::int end,
    case when abs(b.ret_12m) < 1000000 then round(b.ret_12m, 2) end,
    case when abs(b.ret_3y) < 1000000 then round(b.ret_3y, 2) end,
    case when abs(b.ret_5y) < 1000000 then round(b.ret_5y, 2) end,
    case when abs(b.monthly_yield) < 1000000 then round(b.monthly_yield, 2) end,
    case when abs(b.mgmt_fee) < 1000 then round(b.mgmt_fee, 3) end,
    case when abs(b.deposit_fee) < 1000 then round(b.deposit_fee, 3) end,
    case when abs(b.sharpe) < 1000 then round(b.sharpe, 3) end,
    case when abs(b.total_assets) < 10000000000 then round(b.total_assets, 2) end,
    case when abs(b.liquid_pct) < 10000 then round(b.liquid_pct, 2) end,
    coalesce(private.hebrew_period(b.report_period), b.report_period::text),
    case when abs(b.foreign_pct) < 10000 then round(b.foreign_pct, 2) end,
    case when abs(b.fx_pct) < 10000 then round(b.fx_pct, 2) end,
    case when abs(b.stock_pct) < 10000 then round(b.stock_pct, 2) end,
    true, v_now, 'data.gov.il:' || b.source, b.report_period
  from keyed b
  order by b.track_key, b.total_assets desc nulls last, b.source
  on conflict (fund_number) do update set
    (name, company, product_type, specialization, stock_exposure, return_year1, return_year3, return_year5, return_month,
     fee_assets, fee_deposits, sharpe_ratio, total_assets, liquidity, report_period, foreign_exposure, currency_exposure,
     stocks_pct, is_active, last_sync, source, source_period)
  = (excluded.name, excluded.company, excluded.product_type, excluded.specialization, excluded.stock_exposure,
     excluded.return_year1, excluded.return_year3, excluded.return_year5, excluded.return_month, excluded.fee_assets,
     excluded.fee_deposits, excluded.sharpe_ratio, excluded.total_assets, excluded.liquidity, excluded.report_period,
     excluded.foreign_exposure, excluded.currency_exposure, excluded.stocks_pct, true, excluded.last_sync, excluded.source,
     excluded.source_period);
  get diagnostics v_touched = row_count;

  -- funds that left the feed are hidden, never deleted; a suspiciously small feed hides nothing and alerts instead
  if v_touched >= v_before / 2 then
    update content.investment_tracks set is_active = false where is_active and last_sync is distinct from v_now;
    get diagnostics v_off = row_count;
  else
    perform ops.raise_alert('warning', 'tracks_shrink',
      'tracks refresh touched ' || v_touched || ' of ' || v_before || ' active rows (unmapped board funds: ' || v_unm_f
      || '); nothing hidden', 'tracks_shrink', interval '24 hours');
  end if;
  -- the 091000 keys stay exactly as they were; the diagnostics are added only when non-zero (absent = 0)
  return jsonb_build_object('upserted', v_touched, 'hidden', v_off)
         || jsonb_strip_nulls(jsonb_build_object('collisions', nullif(v_coll, 0),
                                                 'unmapped_companies', nullif(v_unm_co, 0), 'unmapped_funds', nullif(v_unm_f, 0)));
end $$;
revoke all on function content.refresh_investment_tracks() from public, anon, authenticated;
comment on function content.refresh_investment_tracks() is 'ADR-36: run by the ops.watchdog step cma_refresh after every successful fetch-cma-data load (data.gov.il gemelnet/pensyanet/bituachnet datasets). Values are normalised to the site slugs (095000); cross-dataset id collisions are keyed <G|P|B><id> and unmapped counts are reported (095300). Do not re-apply the 091000 body.';
