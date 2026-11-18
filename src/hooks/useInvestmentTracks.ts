import { useState, useEffect } from "react";
import { cleanFundName } from "@/lib/utils";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { apiSupabase } from "@/integrations/supabase/v2-client";
import { IS_V2 } from "@/integrations/supabase/config";
import { readAllPages, type PageResult } from "@/lib/apiPaging";
import { allFunds as staticFunds } from "@/data/cmaFundsData";
import type { Fund } from "@/types/fund";
import type { ManagingCompany, ProductType, Specialization } from "@/types/fund";

// investment_tracks is not in the generated site types; minimal local shape for the one query below.
interface UntypedTracksClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: unknown): {
        order(column: string, opts: { ascending: boolean }): PromiseLike<{ data: unknown[] | null; error: unknown }>;
      };
    };
  };
}

interface DBTrack {
  fund_number: string;
  name: string;
  company: string;
  product_type: string;
  specialization: string;
  stock_exposure: number;
  return_year1: number;
  return_year3: number;
  return_year5: number;
  return_month: number;
  fee_assets: number;
  fee_deposits: number;
  sharpe_ratio: number | null;
  total_assets: number;
  liquidity: number | null;
  report_period: string | null;
  foreign_exposure: number;
  currency_exposure: number;
  stocks_pct: number;
  gov_bonds_pct: number;
  corp_bonds_pct: number;
  cash_pct: number;
  other_pct: number;
}

// v2 (seeld-site) rows also carry source_period: YYYYMM of the data.gov.il report the row was refreshed from
// (content.refresh_investment_tracks, ADR-36). The page shows it as the as-of date.
interface DBTrackV2 extends DBTrack {
  source_period?: number | null;
}

/** 202609 -> "2026-09" (the lastUpdate format the tracks page already shows); null when absent or malformed. */
export function sourcePeriodToYm(p: number | null | undefined): string | null {
  if (typeof p !== "number" || !Number.isInteger(p) || p < 200001 || p > 210012) return null;
  const s = String(p);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}`;
}

function dbToFund(row: DBTrackV2, idx: number): Fund {
  return {
    id: String(idx + 1),
    fundNumber: row.fund_number,
    name: cleanFundName(row.name),
    company: row.company as ManagingCompany,
    productType: row.product_type as ProductType,
    specialization: row.specialization as Specialization,
    stockExposure: row.stock_exposure,
    returns: {
      month: row.return_month,
      ytd: +(row.return_year1 / 2).toFixed(2),
      year1: row.return_year1,
      year2: +(row.return_year3 * 0.95).toFixed(2),
      year3: row.return_year3,
      year5: row.return_year5,
    },
    monthlyReturns: [],
    fees: {
      depositFeePercent: row.fee_deposits,
      savingsFeePercent: row.fee_assets,
      maxDepositFee: 4,
      maxSavingsFee: 1.05,
    },
    deepDrill: {
      directExpenses: 0.07,
      expectedAnnualCost: row.fee_assets + 0.07,
      foreignExposure: row.foreign_exposure,
      currencyExposure: row.currency_exposure,
      designatedBonds: 0,
      govBondsTradable: row.gov_bonds_pct,
      corpBondsTradable: row.corp_bonds_pct * 0.7,
      corpBondsNonTradable: row.corp_bonds_pct * 0.3,
      stocksAndOptions: row.stocks_pct,
      deposits: 2,
      mutualFunds: 3,
      loans: 0,
      cashEquivalents: row.cash_pct,
      otherAssets: row.other_pct,
      stdDev36: null,
      stdDev60: null,
      actuarialSurplus: null,
      sharpeRatio: row.sharpe_ratio,
    },
    totalAssets: Math.round(row.total_assets),
    lastUpdate: (IS_V2 ? sourcePeriodToYm(row.source_period) : null) || row.report_period || "2026-02",
    isActive: true,
  };
}

// Exactly the columns DBTrack declares. `select("*")` was shipping the whole
// row — internal sync bookkeeping included — for all ~570 active tracks.
const TRACK_COLUMNS = [
  'fund_number', 'name', 'company', 'product_type', 'specialization',
  'stock_exposure', 'return_year1', 'return_year3', 'return_year5', 'return_month',
  'fee_assets', 'fee_deposits', 'sharpe_ratio', 'total_assets', 'liquidity',
  'report_period', 'foreign_exposure', 'currency_exposure', 'stocks_pct',
  'gov_bonds_pct', 'corp_bonds_pct', 'cash_pct', 'other_pct',
].join(',');

// v2 asks for source_period as well (the column exists only on seeld-site). Same list in api/tracks.ts.
const TRACK_COLUMNS_V2 = TRACK_COLUMNS + ',source_period';

/** seeld-site: api.investment_tracks (active rows) in 200-row Range pages with count=exact. */
async function readTracksV2(): Promise<DBTrackV2[]> {
  return readAllPages<DBTrackV2>((from, to) =>
    apiSupabase
      .from("investment_tracks")
      .select(TRACK_COLUMNS_V2, { count: "exact" })
      .eq("is_active", true)
      .order("return_year1", { ascending: false, nullsFirst: false })
      .order("fund_number", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PageResult<DBTrackV2>>);
}

export function useInvestmentTracks() {
  const [funds, setFunds] = useState<Fund[]>(staticFunds);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        // /api/tracks is cached at Vercel's Frankfurt edge; the direct query
        // below is the fallback for `vite dev` and `vite preview`, which serve
        // no /api routes.
        let rows: DBTrackV2[] | null = null;

        try {
          const res = await fetch("/api/tracks");
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json) && json.length > 0) rows = json as DBTrack[];
          }
        } catch {
          // fall through to the direct query
        }

        if (!rows && IS_V2) {
          const v2 = await readTracksV2();
          if (v2.length > 0) rows = v2;
        } else if (!rows) {
          const { data, error } = await (siteSupabase as unknown as UntypedTracksClient)
            .from("investment_tracks")
            .select(TRACK_COLUMNS)
            .eq("is_active", true)
            .order("return_year1", { ascending: false });
          if (!error && data && data.length > 0) rows = data as DBTrack[];
        }

        if (rows && rows.length > 0) {
          setFunds(rows.map((row, i) => dbToFund(row, i)));
          setIsLive(true);
        }
      } catch {
        // Fallback to static data — already set
      }
      setLoading(false);
    };
    fetchTracks();
  }, []);

  return { funds, isLive, loading };
}
