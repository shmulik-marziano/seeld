import { useState, useEffect } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { allFunds as staticFunds } from "@/data/cmaFundsData";
import type { Fund } from "@/types/fund";
import type { ManagingCompany, ProductType, Specialization } from "@/types/fund";

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

function dbToFund(row: DBTrack, idx: number): Fund {
  return {
    id: String(idx + 1),
    fundNumber: row.fund_number,
    name: row.name,
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
    lastUpdate: row.report_period || "2026-02",
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
        let rows: DBTrack[] | null = null;

        try {
          const res = await fetch("/api/tracks");
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json) && json.length > 0) rows = json as DBTrack[];
          }
        } catch {
          // fall through to the direct query
        }

        if (!rows) {
          const { data, error } = await (siteSupabase as any)
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
