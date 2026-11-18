-- V2-11 (ADR-36): investment_tracks are REFRESHED AUTOMATICALLY from the live data.gov.il feed that fetch-cma-data loads.
-- gemelnet's Excel endpoint (Tokyo sync-tracks) is dead since 2026-03-26; the same funds are published on data.gov.il.
-- No new job and no new function: the watchdog step cma_refresh runs this right after the matviews, once per successful load.
alter table content.investment_tracks
  add column source        text,
  add column source_period integer check (source_period is null or source_period between 200001 and 210012);
comment on column content.investment_tracks.source_period is 'YYYYMM of the data.gov.il report period this row was derived from. The site shows it as the as-of date.';
comment on column content.investment_tracks.last_sync is 'Set by content.refresh_investment_tracks() on every successful CMA load.';
-- select * views are expanded at creation; re-create so the new columns are exposed (grants are kept)
create or replace view api.investment_tracks with (security_invoker = true) as select * from content.investment_tracks;

create or replace function content.refresh_investment_tracks()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_now timestamptz := now(); v_before integer; v_touched integer; v_off integer := 0;
begin
  if not private.flag('tracks_sync_enabled') then return jsonb_build_object('skipped', 'disabled'); end if;
  if not exists (select 1 from content.cma_board) then return jsonb_build_object('skipped', 'board_empty'); end if;
  select count(*) into v_before from content.investment_tracks where is_active;

  insert into content.investment_tracks as t (fund_number, name, company, product_type, specialization, stock_exposure,
    return_year1, return_year3, return_year5, return_month, fee_assets, fee_deposits, sharpe_ratio, total_assets, liquidity,
    report_period, foreign_exposure, currency_exposure, stocks_pct, is_active, last_sync, source, source_period)
  select distinct on (b.fund_id)
    b.fund_id,
    left(b.fund_name, 300),
    coalesce(nullif(b.company, ''), 'לא ידוע'),
    coalesce(b.board_product, 'unknown'),
    coalesce(b.track, 'general'),
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
    b.report_period::text,
    case when abs(b.foreign_pct) < 10000 then round(b.foreign_pct, 2) end,
    case when abs(b.fx_pct) < 10000 then round(b.fx_pct, 2) end,
    case when abs(b.stock_pct) < 10000 then round(b.stock_pct, 2) end,
    true, v_now, b.source, b.report_period
  from content.cma_board b
  where b.fund_id is not null and b.fund_name is not null
  order by b.fund_id, b.total_assets desc nulls last, b.source
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
      'tracks refresh touched ' || v_touched || ' of ' || v_before || ' active rows; nothing hidden', 'tracks_shrink', interval '24 hours');
  end if;
  return jsonb_build_object('upserted', v_touched, 'hidden', v_off);
end $$;
revoke all on function content.refresh_investment_tracks() from public, anon, authenticated;

insert into ops.config (key, value) values ('tracks_sync_enabled', 'true'), ('cma_refresh_pending', 'false')
on conflict (key) do nothing;
