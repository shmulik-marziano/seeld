/**
 * useCmaFunds — Hook למשיכת נתונים חיים מטבלת cma_funds ב-Supabase
 * עם fallback לנתונים סטטיים מ-cmaFundsData.ts
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { allFunds as staticFunds } from '@/data/cmaFundsData';
import type { Fund, ProductType, ManagingCompany, Specialization } from '@/types/fund';
import { companyLabels } from '@/types/fund';

// ─── Types for DB records ───────────────────────────────────────────

// Mirrors FUND_COLUMNS below, not the full view: fund_classification,
// yield_trailing_3yrs/5yrs and fetched_at exist in cma_funds_latest but nothing
// in the app reads them, so they are no longer fetched.
interface CmaFundRow {
  id: string;
  fund_id: string;
  fund_name: string;
  managing_company: string | null;
  source: 'gemelnet' | 'pensyanet' | 'bituachnet';
  product_type: string | null;
  specialization: string | null;
  report_period: number;
  total_assets: number | null;
  monthly_yield: number | null;
  ytd_yield: number | null;
  avg_annual_yield_3yrs: number | null;
  avg_annual_yield_5yrs: number | null;
  avg_annual_management_fee: number | null;
  avg_deposit_fee: number | null;
  standard_deviation: number | null;
  sharpe_ratio: number | null;
  stock_market_exposure: number | null;
  foreign_exposure: number | null;
  foreign_currency_exposure: number | null;
  actuarial_adjustment: number | null;
}

// ─── Map Hebrew company name to ManagingCompany key ─────────────────

const companyNameMap: Record<string, ManagingCompany> = {};
// Build reverse map from companyLabels
for (const [key, label] of Object.entries(companyLabels)) {
  companyNameMap[label] = key as ManagingCompany;
}
// Add common variants
const companyAliases: Record<string, ManagingCompany> = {
  'אלטשולר שחם': 'altshuler',
  'אלטשולר': 'altshuler',
  'כלל ביטוח': 'clal',
  'כלל פנסיה': 'clal',
  'כלל': 'clal',
  'הפניקס': 'fenix',
  'הפניקס אקסלנס': 'fenix',
  'הראל ביטוח': 'harel',
  'הראל פנסיה': 'harel',
  'הראל': 'harel',
  'מנורה מבטחים': 'menora',
  'מנורה': 'menora',
  'מגדל ביטוח': 'migdal',
  'מגדל': 'migdal',
  'מיטב דש': 'meitav',
  'מיטב': 'meitav',
  'פסגות': 'psagot',
  'ילין לפידות': 'yelin',
  'אי.בי.אי': 'ibi',
  'אינפיניטי': 'infinity',
  'מור': 'mor',
  'אנליסט': 'analyst',
  'איילון': 'ayalon',
};

function resolveCompany(name: string | null): ManagingCompany {
  if (!name) return 'clal';
  // Try exact match
  if (companyNameMap[name]) return companyNameMap[name];
  // Try alias
  for (const [alias, key] of Object.entries(companyAliases)) {
    if (name.includes(alias)) return key;
  }
  return 'clal'; // fallback
}

// ─── Map specialization string to Specialization key ────────────────

function resolveSpecialization(spec: string | null): Specialization {
  if (!spec) return 'general';
  const s = spec.trim();
  if (s.includes('מניות') && s.includes('סחיר')) return 'stocks_tradable';
  if (s.includes('מניות')) return 'stocks';
  if (s.includes('אג"ח') && s.includes('סחיר')) return 'bonds_tradable';
  if (s.includes('אג"ח')) return 'bonds';
  if (s.includes('כספי') || s.includes('שקלי')) return 'money_market';
  if (s.includes('חו"ל')) return 'foreign';
  if (s.includes('עוקב') || s.includes('מדד')) return 'index_tracking';
  if (s.includes('הלכ')) return 'halacha';
  if (s.includes('קיימות')) return 'sustainability';
  if (s.includes('מבטיח')) return 'guaranteed';
  if (s.includes('משולב') && s.includes('סחיר')) return 'combined_tradable';
  if (s.includes('50') && s.includes('מטה')) return 'age_under_50';
  if (s.includes('50') && s.includes('60')) return 'age_50_60';
  if (s.includes('60') && s.includes('מעלה')) return 'age_over_60';
  if (s.includes('כללי') || s === 'general') return 'general';
  return 'general';
}

// ─── Convert DB row to Fund type ────────────────────────────────────

function dbRowToFund(row: CmaFundRow): Fund {
  const company = resolveCompany(row.managing_company);
  const specialization = resolveSpecialization(row.specialization);
  const productType = (row.product_type || 'gemel') as ProductType;

  // total_assets arrives in millions ILS. stock_market_exposure is a monetary
  // amount in the same units (verified against source data: equity funds show
  // exposure ≈ assets) — the percentage is exposure / assets.
  const assetsMillions = row.total_assets ?? 0;
  const stockPct =
    row.stock_market_exposure !== null && assetsMillions > 0
      ? Math.round((row.stock_market_exposure / assetsMillions) * 1000) / 10
      : null;

  return {
    id: row.id,
    fundNumber: row.fund_id,
    name: row.fund_name,
    company,
    productType,
    specialization,
    stockExposure: stockPct,
    returns: {
      month: row.monthly_yield ?? 0,
      ytd: row.ytd_yield ?? 0,
      year1: row.ytd_yield ?? 0, // YTD — labeled as such in the UI
      year2: row.avg_annual_yield_3yrs ?? 0, // not displayed
      year3: row.avg_annual_yield_3yrs,
      year5: row.avg_annual_yield_5yrs,
    },
    monthlyReturns: [], // Not available per-row from CKAN (would need monthly query)
    fees: {
      // Kept null when the dataset has no figure — see ManagementFees.
      depositFeePercent: row.avg_deposit_fee,
      savingsFeePercent: row.avg_annual_management_fee,
      maxDepositFee: 4,
      maxSavingsFee: 1.05,
    },
    deepDrill: {
      // null = the public dataset doesn't carry this breakdown per fund
      directExpenses: null,
      expectedAnnualCost: (row.avg_annual_management_fee ?? 0) + (row.avg_deposit_fee ?? 0) * 0.1,
      foreignExposure: row.foreign_exposure ?? 0,
      currencyExposure: row.foreign_currency_exposure ?? 0,
      designatedBonds: null,
      govBondsTradable: null,
      corpBondsTradable: null,
      corpBondsNonTradable: null,
      stocksAndOptions: stockPct,
      deposits: null,
      mutualFunds: null,
      loans: null,
      cashEquivalents: null,
      otherAssets: null,
      stdDev36: row.standard_deviation ?? null,
      stdDev60: null,
      actuarialSurplus: row.actuarial_adjustment ?? null,
      sharpeRatio: row.sharpe_ratio ?? null,
    },
    totalAssets: Math.round(assetsMillions), // already in millions ILS
    lastUpdate: String(row.report_period),
    isActive: true,
  };
}

// ─── Fetch from Supabase ────────────────────────────────────────────

// The view carries 26 columns; dbRowToFund reads 18 of them. `select('*')` put
// the other 8 — classification strings, trailing-yield duplicates, fetched_at
// timestamps — on the wire for all ~1,400 funds on every visit to the fund
// finder and the return tables, for nothing.
const FUND_COLUMNS = [
  'id', 'fund_id', 'fund_name', 'managing_company', 'source', 'product_type',
  'specialization', 'report_period', 'total_assets', 'monthly_yield', 'ytd_yield',
  'avg_annual_yield_3yrs', 'avg_annual_yield_5yrs', 'avg_annual_management_fee',
  'avg_deposit_fee', 'standard_deviation', 'sharpe_ratio', 'stock_market_exposure',
  'foreign_exposure', 'foreign_currency_exposure', 'actuarial_adjustment',
].join(',');

async function fetchLiveFunds(): Promise<Fund[]> {
  // Use the cma_funds_latest view for latest data per fund
  const { data, error } = await supabase
    .from('cma_funds_latest' as any)
    .select(FUND_COLUMNS)
    .order('total_assets', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No records in cma_funds_latest');

  return (data as unknown as CmaFundRow[]).map(dbRowToFund);
}

// ─── Query: last sync info ──────────────────────────────────────────

async function fetchSyncStatus(): Promise<{
  lastSync: string | null;
  latestPeriod: number | null;
  totalFunds: number;
}> {
  const { data: syncLog } = await supabase
    .from('cma_sync_log')
    .select('completed_at, latest_period, records_upserted')
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1);

  const { count } = await supabase
    .from('cma_funds_latest' as any)
    .select('*', { count: 'exact', head: true });

  return {
    lastSync: syncLog?.[0]?.completed_at ?? null,
    latestPeriod: syncLog?.[0]?.latest_period ?? null,
    totalFunds: count ?? 0,
  };
}

// ─── Trigger manual sync ────────────────────────────────────────────

async function triggerSync(source?: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke('fetch-cma-data', {
    body: source ? { source } : {},
  });
  if (error) throw error;
  return data;
}

// ─── React Query Hooks ──────────────────────────────────────────────

/** Main hook — returns live funds from Supabase with fallback to static */
export function useCmaFunds() {
  return useQuery({
    queryKey: ['cma-funds'],
    queryFn: fetchLiveFunds,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
    retry: 1,
    placeholderData: staticFunds, // Show static data while loading
  });
}

/** Sync status hook */
export function useCmaSyncStatus() {
  return useQuery({
    queryKey: ['cma-sync-status'],
    queryFn: fetchSyncStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/** Manual sync trigger */
export function useTriggerCmaSync() {
  return { triggerSync };
}

// ─── Helper: get period display string ──────────────────────────────

export function formatPeriod(period: number | null): string {
  if (!period) return 'לא ידוע';
  const str = String(period);
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const months = [
    '', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ];
  return `${months[Number(month)] || month} ${year}`;
}
