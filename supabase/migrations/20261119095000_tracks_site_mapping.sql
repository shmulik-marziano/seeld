-- T4 (ADR-36 follow-up): content.refresh_investment_tracks() (091000) copied content.cma_board values verbatim into
-- investment_tracks. The site (src/types/fund.ts) reads company / specialization / product_type as fixed slugs and indexes
-- companyLabels[company] directly (search box: companyLabels[f.company].includes(q)), so a Hebrew company name such as
-- 'הראל' or a board track such as 'index' breaks the tracks page. This migration keeps the 091000 contract (same
-- return shape, same hide-never-delete rule, same tracks_shrink guard) and only normalises the values the site reads:
--   * company        -> slug through private.track_company_slugs (data, extendable without DDL); unmapped companies are
--                       not published (the Tokyo sync-tracks did the same: detectCompany() == null -> skipped)
--   * specialization -> one of the site's Specialization values (board 'index'/'sp500' -> index_tracking, unknown -> other)
--   * product_type   -> only the site's ProductType values are published
--   * report_period  -> Hebrew 'month YYYY' text as the site already shows it; source_period keeps YYYYMM (the as-of)
--   * source         -> 'data.gov.il:<gemelnet|pensyanet|bituachnet>'
create table private.track_company_slugs (
  company_name text primary key check (char_length(company_name) between 1 and 120),
  slug         text not null check (slug ~ '^[a-z][a-z0-9_]{1,30}$')
);
comment on table private.track_company_slugs is 'cma_board.company (data.gov.il short name) -> site ManagingCompany slug. A board company equal to company_name, or starting with company_name followed by a space, maps to slug; the longest match wins. Add a row when the site adds a company to companyLabels.';
alter table private.track_company_slugs enable row level security;
revoke all on private.track_company_slugs from public, anon, authenticated, service_role;

insert into private.track_company_slugs (company_name, slug) values
  ('אלטשולר שחם', 'altshuler'), ('אנליסט', 'analyst'), ('איילון', 'ayalon'), ('כלל', 'clal'), ('הפניקס', 'fenix'),
  ('הראל', 'harel'), ('אי.בי.אי', 'ibi'), ('אינפיניטי', 'infinity'), ('מיטב', 'meitav'), ('מנורה מבטחים', 'menora'),
  ('מנורה', 'menora'), ('מגדל', 'migdal'), ('מור', 'mor'), ('פסגות', 'psagot'), ('ילין לפידות', 'yelin')
on conflict (company_name) do nothing;

create or replace function private.track_company_slug(p_company text)
returns text language sql stable security definer set search_path = '' as $$
  select s.slug from private.track_company_slugs s
   where btrim(p_company) = s.company_name or btrim(p_company) like s.company_name || ' %'
   order by char_length(s.company_name) desc limit 1
$$;

create or replace function private.track_specialization(p_track text)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_track in ('general', 'stocks', 'bonds', 'bonds_tradable', 'money_market', 'foreign', 'index_tracking', 'halacha',
                     'sustainability', 'guaranteed', 'combined_tradable', 'stocks_tradable', 'age_under_50', 'age_50_60',
                     'age_over_60', 'credit_bonds', 'other') then p_track
    when p_track in ('index', 'sp500') then 'index_tracking'
    when p_track is null then 'general'
    else 'other' end
$$;

create or replace function private.hebrew_period(p_period integer)
returns text language sql immutable set search_path = '' as $$
  select case when p_period between 200001 and 210012 and p_period % 100 between 1 and 12
    then (array['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'])[p_period % 100]
         || ' ' || (p_period / 100)::text end
$$;

revoke all on function private.track_company_slug(text), private.track_specialization(text), private.hebrew_period(integer)
  from public, anon, authenticated, service_role;

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
    m.slug,
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
  from content.cma_board b
  cross join lateral (select private.track_company_slug(b.company) as slug) m
  where b.fund_id is not null and b.fund_name is not null and m.slug is not null
    and b.board_product in ('gemel', 'gemel_invest', 'hishtalmut', 'pensia', 'polisa', 'child_savings')
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
comment on function content.refresh_investment_tracks() is 'ADR-36: run by the ops.watchdog step cma_refresh after every successful fetch-cma-data load (data.gov.il gemelnet/pensyanet/bituachnet datasets). Values are normalised to the site slugs (095000).';
