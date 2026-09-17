-- לוח התשואות (cma_board): שכבת נתונים מחושבת מעל cma_funds.
--
-- לכל קופה/מסלול בתקופת הדיווח האחרונה: זיהוי, חברה מקוצרת, מוצר ומסלול
-- (קטגוריה מחושבת משם הקופה והסיווגים), תשואות 1/3/6/12 חודשים (מצטברות
-- מהתשואות החודשיות של גמלנט/פנסיהנט/ביטוחנט), 3 ו־5 שנים, דמי ניהול, סיכון,
-- חשיפות באחוזים, גיוסים נטו ב־12 חודשים וסדרת 12 החודשים לגרף.
--
-- הרענון: פעם ביום ב־03:15 UTC (יחד עם cma_funds_latest) ואחרי הסנכרון החודשי.

create or replace function public.cma_board_product(fund_name text, product_type text)
returns text language sql immutable as $$
  select case
    when lower(replace(replace(coalesce(fund_name,''), '״', '"'), '''', '"')) ~ 'חיסכון לילד|לכל ילד|חסכון לילד|ארוך טווח לילד'
      then 'child_savings'
    else product_type end
$$;

create or replace function public.cma_track_key(fund_name text, specialization text, sub_specialization text, product_type text)
returns text language sql immutable as $$
  with v as (
    select lower(replace(replace(coalesce(fund_name,''), '״', '"'), '''', '"')) n,
           coalesce(sub_specialization,'') sub,
           coalesce(specialization,'') spec
  )
  select case
    when public.cma_board_product(fund_name, product_type) = 'child_savings' then
      case when n ~ 'הלכ' then 'halacha'
           when n ~ 'מוגבר|גבוה' then 'risk_high'
           when n ~ 'בינוני' then 'risk_mid'
           when n ~ 'מועט|נמוך' then 'risk_low'
           else 'other' end
    when n ~ 'מקבלי קצבה|מקבלי קיצבה' then 'annuity'
    when n ~ 'קרן י"|קרן ט"|משתתף ברווחים|משתתפת ברווחים' then 'participating'
    when n ~ 's&p|s & p|sp ?500|אס אנד פי' then 'sp500'
    when n ~ 'נאסד|nasdaq' then 'nasdaq'
    when n ~ 'מניות סחיר' or sub ~ 'מניות סחיר' then 'stocks_tradable'
    when n ~ 'משולב סחיר' or sub ~ 'משולב סחיר' then 'combined_tradable'
    when n ~ 'אג"ח סחיר' or sub ~ 'אג"ח סחיר' then 'bonds_tradable'
    when n ~ 'עוקב|מחקה|מדד' or spec ~ 'עוקבי מדדים' then 'index'
    when n ~ 'אשראי ואג|אג"ח עם מניות|עד 25%|עד 20%|עד 15%|עד 10%' or sub ~ 'אשראי ואג' then 'credit_bonds'
    when n ~ 'שקלי|שיקלי|כספי|טווח קצר|מק"מ' or sub ~ 'שיקלי|שקלי|כספי' then 'money_market'
    when n ~ 'הלכ|כשר' or sub ~ 'הלכ' then 'halacha'
    when n ~ 'קיימות|esg' then 'sustainability'
    when n ~ 'מבטיח' or spec ~ 'מבטיח' then 'guaranteed'
    when n ~ 'אג"ח|אגח' or sub ~ 'אג"ח' then 'bonds'
    when n ~ 'חו"ל|גלובלי|בינלאומי' or sub ~ 'חו"ל' then 'foreign'
    when n ~ 'מניות' or sub ~ 'מניות' then 'stocks'
    when n ~ '50 ומטה|עד 50|עד גיל 50|לבני 50|צעירים' then 'age_under_50'
    when n ~ '50 עד 60|50-60|50 - 60|בני 50 עד|בין 50' then 'age_50_60'
    when n ~ '60 ומעלה|מעל 60|בני 60|מגיל 60' then 'age_over_60'
    when n ~ 'בניהול אישי' then 'self_managed'
    when n ~ 'כללי|רגיל|קלאסי' or spec = 'כללי' or sub = 'כללי' then 'general'
    else 'other' end
  from v
$$;

create or replace function public.cma_company_short(c text)
returns text language sql immutable as $$
  select case
    when c ilike 'הראל%' then 'הראל'
    when c ilike 'מיטב%' then 'מיטב'
    when c ilike 'מנורה%' then 'מנורה מבטחים'
    when c ilike 'הפניקס%' then 'הפניקס'
    when c ilike 'מגדל%' then 'מגדל'
    when c ilike 'כלל%' then 'כלל'
    when c ilike 'מור %' or c ilike 'מור-%' or c ilike 'מור גמל%' then 'מור'
    when c ilike 'אלטשולר%' then 'אלטשולר שחם'
    when c ilike 'אינפיניטי%' then 'אינפיניטי'
    when c ilike 'אנליסט%' then 'אנליסט'
    when c ilike 'ילין%' then 'ילין לפידות'
    when c ilike 'הכשרה%' then 'הכשרה'
    when c ilike 'איילון%' then 'איילון'
    when c ilike 'פסגות%' then 'פסגות'
    when c ilike 'אי.בי.אי%' or c ilike 'איביאי%' or c ilike 'ibi%' then 'אי.בי.אי'
    when c ilike 'סלייס%' then 'סלייס'
    when c ilike 'גלובלנט%' then 'גלובלנט'
    when c ilike 'aig%' then 'AIG'
    when c ilike 'מבטחים מוסד%' then 'מבטחים מוסד'
    else trim(regexp_replace(coalesce(c,''), '\s*(בע"מ|בע״מ)\s*$', ''))
  end
$$;

drop materialized view if exists public.cma_board;

create materialized view public.cma_board as
with maxp as (
  select max(report_period) p from public.cma_funds
),
hist as (
  select f.fund_id, f.source, f.report_period, f.monthly_yield, f.net_monthly_deposits,
         row_number() over (partition by f.fund_id, f.source order by f.report_period desc) rn
  from public.cma_funds f, maxp
  where f.report_period <= maxp.p and f.report_period > maxp.p - 200
),
agg as (
  select fund_id, source,
    count(monthly_yield) filter (where rn <= 3)  m3,
    count(monthly_yield) filter (where rn <= 6)  m6,
    count(monthly_yield) filter (where rn <= 12) m12,
    (exp(sum(ln(1 + monthly_yield / 100.0)) filter (where rn <= 3  and monthly_yield > -100)) - 1) * 100 ret_3m_raw,
    (exp(sum(ln(1 + monthly_yield / 100.0)) filter (where rn <= 6  and monthly_yield > -100)) - 1) * 100 ret_6m_raw,
    (exp(sum(ln(1 + monthly_yield / 100.0)) filter (where rn <= 12 and monthly_yield > -100)) - 1) * 100 ret_12m_raw,
    sum(net_monthly_deposits) filter (where rn <= 12) inflow_12m_raw,
    count(net_monthly_deposits) filter (where rn <= 12) inflow_months,
    jsonb_agg(jsonb_build_object('p', report_period, 'y', monthly_yield) order by report_period) filter (where rn <= 12) series_12m
  from hist
  group by fund_id, source
)
select
  l.id, l.fund_id, l.source, l.fund_name, l.managing_company,
  public.cma_company_short(l.managing_company) company,
  l.product_type,
  public.cma_board_product(l.fund_name, l.product_type) board_product,
  public.cma_track_key(l.fund_name, l.specialization, l.sub_specialization, l.product_type) track,
  l.specialization, l.sub_specialization, l.report_period, l.inception_date,
  l.total_assets,
  l.monthly_yield, l.ytd_yield,
  case when a.m3  = 3  then round(a.ret_3m_raw::numeric, 2)  end ret_3m,
  case when a.m6  = 6  then round(a.ret_6m_raw::numeric, 2)  end ret_6m,
  case when a.m12 = 12 then round(a.ret_12m_raw::numeric, 2) end ret_12m,
  l.yield_trailing_3yrs ret_3y,
  l.yield_trailing_5yrs ret_5y,
  l.avg_annual_yield_3yrs, l.avg_annual_yield_5yrs,
  l.avg_annual_management_fee mgmt_fee,
  l.avg_deposit_fee deposit_fee,
  l.standard_deviation std_dev,
  l.sharpe_ratio sharpe,
  case when l.total_assets > 0 and l.stock_market_exposure     is not null then round((l.stock_market_exposure     / l.total_assets * 100)::numeric, 1) end stock_pct,
  case when l.total_assets > 0 and l.foreign_exposure          is not null then round((l.foreign_exposure          / l.total_assets * 100)::numeric, 1) end foreign_pct,
  case when l.total_assets > 0 and l.foreign_currency_exposure is not null then round((l.foreign_currency_exposure / l.total_assets * 100)::numeric, 1) end fx_pct,
  l.liquid_assets_percent liquid_pct,
  l.net_monthly_deposits net_deposits_month,
  case when a.inflow_months > 0 then round(a.inflow_12m_raw::numeric, 1) end inflow_12m,
  a.inflow_months,
  a.m12 months_12m,
  a.series_12m,
  l.fetched_at
from public.cma_funds l
join maxp on l.report_period = maxp.p
left join agg a on a.fund_id = l.fund_id and a.source = l.source;

create unique index cma_board_uidx on public.cma_board (fund_id, source);
create index cma_board_product_idx on public.cma_board (board_product, track);

create or replace view public.cma_company_map as
select company, board_product,
       count(*) funds,
       sum(total_assets) assets,
       sum(inflow_12m) inflow_12m,
       bool_and(inflow_12m is not null) inflow_complete,
       max(report_period) report_period
from public.cma_board
group by company, board_product;

grant select on public.cma_board to anon, authenticated;
grant select on public.cma_company_map to anon, authenticated;

-- הרענון היומי (03:15 UTC) מרענן גם את הלוח; ואחרי הסנכרון החודשי (8 בחודש 04:00) רענון נוסף.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'refresh-cma-funds-latest'),
  command := 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.cma_funds_latest; REFRESH MATERIALIZED VIEW CONCURRENTLY public.cma_board;'
);
select cron.schedule('refresh-cma-board-monthly', '30 4 8 * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.cma_board;');
