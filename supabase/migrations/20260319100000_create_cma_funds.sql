-- =====================================================
-- CMA Funds Table — נתוני קופות מרשות שוק ההון
-- מקור: data.gov.il (גמלנט, ביטוחנט, פנסיהנט)
-- מתעדכן אוטומטית פעמיים בשבוע
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cma_funds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- זיהוי
  fund_id TEXT NOT NULL,                       -- FUND_ID מהמקור
  fund_name TEXT NOT NULL,                     -- FUND_NAME
  fund_classification TEXT,                    -- FUND_CLASSIFICATION
  managing_company TEXT,                       -- MANAGING_CORPORATION / PARENT_COMPANY_NAME
  managing_company_id TEXT,                    -- MANAGING_CORPORATION_LEGAL_ID / PARENT_COMPANY_ID

  -- סיווג
  source TEXT NOT NULL CHECK (source IN ('gemelnet', 'pensyanet', 'bituachnet')),
  product_type TEXT,                           -- mapped: gemel, hishtalmut, pensia, polisa, etc.
  specialization TEXT,                         -- SPECIALIZATION
  sub_specialization TEXT,                     -- SUB_SPECIALIZATION
  target_population TEXT,                      -- TARGET_POPULATION

  -- תקופת דיווח
  report_period INTEGER NOT NULL,             -- REPORT_PERIOD (YYYYMM)
  inception_date TEXT,                         -- INCEPTION_DATE

  -- נכסים ותנועות
  total_assets NUMERIC,                        -- TOTAL_ASSETS (אלפי ₪)
  deposits NUMERIC,                            -- DEPOSITS
  withdrawals NUMERIC,                         -- WITHDRAWLS
  internal_transfers NUMERIC,                  -- INTERNAL_TRANSFERS
  net_monthly_deposits NUMERIC,                -- NET_MONTHLY_DEPOSITS

  -- תשואות
  monthly_yield NUMERIC,                       -- MONTHLY_YIELD
  ytd_yield NUMERIC,                           -- YEAR_TO_DATE_YIELD
  yield_trailing_3yrs NUMERIC,                 -- YIELD_TRAILING_3_YRS (מצטברת)
  yield_trailing_5yrs NUMERIC,                 -- YIELD_TRAILING_5_YRS (מצטברת)
  avg_annual_yield_3yrs NUMERIC,               -- AVG_ANNUAL_YIELD_TRAILING_3YRS
  avg_annual_yield_5yrs NUMERIC,               -- AVG_ANNUAL_YIELD_TRAILING_5YRS

  -- דמי ניהול
  avg_annual_management_fee NUMERIC,           -- AVG_ANNUAL_MANAGEMENT_FEE (מצבירה)
  avg_deposit_fee NUMERIC,                     -- AVG_DEPOSIT_FEE (מהפקדה)

  -- סיכון
  standard_deviation NUMERIC,                  -- STANDARD_DEVIATION
  alpha NUMERIC,                               -- ALPHA
  sharpe_ratio NUMERIC,                        -- SHARPE_RATIO

  -- חשיפות
  liquid_assets_percent NUMERIC,               -- LIQUID_ASSETS_PERCENT
  stock_market_exposure NUMERIC,               -- STOCK_MARKET_EXPOSURE
  foreign_exposure NUMERIC,                    -- FOREIGN_EXPOSURE
  foreign_currency_exposure NUMERIC,           -- FOREIGN_CURRENCY_EXPOSURE

  -- פנסיה בלבד
  actuarial_adjustment NUMERIC,                -- ACTUARIAL_ADJUSTMENT (פנסיהנט)

  -- מטא
  raw_data JSONB,                              -- כל השדות המקוריים
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- ייחודיות: קופה + תקופה + מקור
  UNIQUE (fund_id, report_period, source)
);

-- Enable trigram extension for Hebrew text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- אינדקסים לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_cma_funds_source ON public.cma_funds (source);
CREATE INDEX IF NOT EXISTS idx_cma_funds_report_period ON public.cma_funds (report_period DESC);
CREATE INDEX IF NOT EXISTS idx_cma_funds_fund_id ON public.cma_funds (fund_id);
CREATE INDEX IF NOT EXISTS idx_cma_funds_product_type ON public.cma_funds (product_type);
CREATE INDEX IF NOT EXISTS idx_cma_funds_managing_company ON public.cma_funds (managing_company);
CREATE INDEX IF NOT EXISTS idx_cma_funds_fund_name ON public.cma_funds USING gin (fund_name gin_trgm_ops);

-- =====================================================
-- טבלת סינכרון — מעקב אחרי ריצות
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cma_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_fetched INTEGER DEFAULT 0,
  records_upserted INTEGER DEFAULT 0,
  latest_period INTEGER,               -- תקופה אחרונה שנמשכה
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- View: נתונים עדכניים ביותר לכל קופה (דה-דופליקציה)
-- =====================================================
CREATE OR REPLACE VIEW public.cma_funds_latest AS
SELECT DISTINCT ON (fund_id, source)
  id,
  fund_id,
  fund_name,
  fund_classification,
  managing_company,
  source,
  product_type,
  specialization,
  sub_specialization,
  report_period,
  total_assets,
  monthly_yield,
  ytd_yield,
  yield_trailing_3yrs,
  yield_trailing_5yrs,
  avg_annual_yield_3yrs,
  avg_annual_yield_5yrs,
  avg_annual_management_fee,
  avg_deposit_fee,
  standard_deviation,
  sharpe_ratio,
  stock_market_exposure,
  foreign_exposure,
  foreign_currency_exposure,
  actuarial_adjustment,
  fetched_at
FROM public.cma_funds
ORDER BY fund_id, source, report_period DESC;

-- =====================================================
-- RLS: Public read access, service role write
-- =====================================================
ALTER TABLE public.cma_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cma_sync_log ENABLE ROW LEVEL SECURITY;

-- Anyone can read fund data
CREATE POLICY "Public read cma_funds" ON public.cma_funds
  FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "Service write cma_funds" ON public.cma_funds
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read cma_sync_log" ON public.cma_sync_log
  FOR SELECT USING (true);

CREATE POLICY "Service write cma_sync_log" ON public.cma_sync_log
  FOR ALL USING (auth.role() = 'service_role');
