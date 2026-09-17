/**
 * useCmaBoard — the returns board data layer.
 *
 * Reads cma_board (one row per fund at the latest report period, with trailing
 * 3/6/12-month returns computed from the monthly history, 3y/5y, fees, risk,
 * exposures, 12-month net inflows and the 12-month series) through the cached
 * edge route /api/board, falling back to a direct Supabase query under
 * `vite dev` / `vite preview`. Same pattern as useCmaFunds.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────

export type BoardProduct = "pensia" | "hishtalmut" | "gemel" | "gemel_invest" | "polisa" | "child_savings";

export interface BoardFund {
  fund_id: string;
  source: "gemelnet" | "pensyanet" | "bituachnet";
  fund_name: string;
  company: string;
  board_product: BoardProduct;
  track: string;
  report_period: number;
  inception_date: string | null;
  total_assets: number | null;      // ₪ millions
  monthly_yield: number | null;     // %
  ytd_yield: number | null;         // %
  ret_3m: number | null;            // % cumulative, last 3 months
  ret_6m: number | null;            // % cumulative, last 6 months
  ret_12m: number | null;           // % cumulative, last 12 months
  ret_3y: number | null;            // % cumulative, 36 months (source figure)
  ret_5y: number | null;            // % cumulative, 60 months (source figure)
  avg_annual_yield_3yrs: number | null;
  avg_annual_yield_5yrs: number | null;
  mgmt_fee: number | null;          // % of savings, annual average
  deposit_fee: number | null;       // % of deposits
  std_dev: number | null;
  sharpe: number | null;
  stock_pct: number | null;
  foreign_pct: number | null;
  fx_pct: number | null;
  inflow_12m: number | null;        // ₪ millions, net, last 12 months
  inflow_months: number | null;
  months_12m: number | null;
  series_12m: { p: number; y: number | null }[] | null;
}

export interface CompanyMapRow {
  company: string;
  board_product: BoardProduct;
  funds: number;
  assets: number | null;
  inflow_12m: number | null;
  inflow_complete: boolean;
  report_period: number;
}

// ─── Product & track metadata ───────────────────────────────────────

export const PRODUCTS: { key: BoardProduct; slug: string; label: string; short: string }[] = [
  { key: "pensia", slug: "pension", label: "קרנות פנסיה", short: "קרן פנסיה" },
  { key: "hishtalmut", slug: "hishtalmut", label: "קרנות השתלמות", short: "קרן השתלמות" },
  { key: "gemel", slug: "gemel", label: "קופות גמל", short: "קופת גמל" },
  { key: "gemel_invest", slug: "gemel-invest", label: "קופות גמל להשקעה", short: "גמל להשקעה" },
  { key: "polisa", slug: "policies", label: "פוליסות חיסכון", short: "פוליסת חיסכון" },
  { key: "child_savings", slug: "child-savings", label: "חיסכון לכל ילד", short: "חיסכון לכל ילד" },
];

export const productBySlug = (slug: string | undefined) => PRODUCTS.find((p) => p.slug === slug);
export const productByKey = (key: string | undefined) => PRODUCTS.find((p) => p.key === key);

export const TRACKS: Record<string, { label: string; description: string }> = {
  general: { label: "כללי", description: "המסלול המשלב מניות, אג״ח ואפיקים נוספים לפי שיקול דעת מנהל ההשקעות. כאן נמצא רוב הכסף." },
  stocks: { label: "מניות", description: "מסלול המשקיע בעיקר במניות, בארץ ובחו״ל." },
  sp500: { label: "עוקב מדד S&P 500", description: "מסלול פאסיבי העוקב אחר מדד 500 החברות הגדולות בארצות הברית." },
  nasdaq: { label: "עוקב מדד נאסד״ק", description: "מסלול פאסיבי העוקב אחר מדד הנאסד״ק." },
  index: { label: "עוקבי מדדים אחרים", description: "מסלולים פאסיביים העוקבים אחר מדדים או שילובי מדדים." },
  credit_bonds: { label: "אשראי ואג״ח עד 25% מניות", description: "מסלול המשקיע בעיקר באג״ח ובאשראי, עם חשיפה מוגבלת למניות." },
  bonds: { label: "אג״ח", description: "מסלול המשקיע באג״ח ממשלתי וקונצרני." },
  bonds_tradable: { label: "אג״ח סחיר", description: "מסלול אג״ח המשקיע בנכסים סחירים בלבד." },
  stocks_tradable: { label: "מניות סחיר", description: "מסלול מניות המשקיע בנכסים הנסחרים בבורסה בלבד, ללא השקעות לא סחירות." },
  combined_tradable: { label: "משולב סחיר", description: "מסלול מעורב המשקיע בנכסים סחירים בלבד." },
  money_market: { label: "שקלי וכספי", description: "מסלול לטווח קצר, בפיקדונות ובאג״ח קצר, ברמת סיכון נמוכה." },
  halacha: { label: "הלכתי", description: "מסלול המנוהל לפי כללי ההלכה." },
  sustainability: { label: "קיימות", description: "מסלול המשקיע לפי עקרונות סביבה, חברה וממשל תאגידי." },
  foreign: { label: "חו״ל", description: "מסלול המשקיע בעיקר בנכסים מחוץ לישראל." },
  guaranteed: { label: "מבטיח תשואה", description: "מסלולים ותיקים עם תשואה מובטחת, סגורים למצטרפים חדשים." },
  age_under_50: { label: "תלוי גיל, עד 50", description: "מסלול לחוסכים עד גיל 50 במודל תלוי הגיל." },
  age_50_60: { label: "תלוי גיל, 50 עד 60", description: "מסלול לחוסכים בגילאי 50 עד 60 במודל תלוי הגיל." },
  age_over_60: { label: "תלוי גיל, 60 ומעלה", description: "מסלול לחוסכים מגיל 60 במודל תלוי הגיל." },
  annuity: { label: "מקבלי קצבה", description: "מסלולים לחוסכים שכבר מקבלים קצבה." },
  participating: { label: "פוליסות משתתפות ברווחים", description: "פוליסות ותיקות (קרן י' וקרן ט') המשתתפות ברווחי ההשקעות." },
  self_managed: { label: "בניהול אישי", description: "מסלולים שבהם החוסך בוחר את ההשקעות בעצמו." },
  risk_high: { label: "סיכון מוגבר", description: "מסלול חיסכון לילד לחוסכים המעדיפים סיכון מוגבר." },
  risk_mid: { label: "סיכון בינוני", description: "מסלול חיסכון לילד לחוסכים המעדיפים סיכון בינוני." },
  risk_low: { label: "סיכון מועט", description: "מסלול חיסכון לילד לחוסכים המעדיפים סיכון מועט." },
  other: { label: "מסלולים נוספים", description: "מסלולים שאינם נכנסים לאחת הקטגוריות המרכזיות." },
};

export const trackLabel = (key: string) => TRACKS[key]?.label ?? key;

// ─── Fetch ──────────────────────────────────────────────────────────

const BOARD_COLUMNS = [
  "fund_id", "source", "fund_name", "company", "board_product", "track", "report_period",
  "inception_date", "total_assets", "monthly_yield", "ytd_yield", "ret_3m", "ret_6m", "ret_12m",
  "ret_3y", "ret_5y", "avg_annual_yield_3yrs", "avg_annual_yield_5yrs", "mgmt_fee", "deposit_fee",
  "std_dev", "sharpe", "stock_pct", "foreign_pct", "fx_pct", "inflow_12m", "inflow_months",
  "months_12m", "series_12m",
].join(",");

async function fetchBoard(): Promise<BoardFund[]> {
  try {
    const res = await fetch("/api/board");
    if (res.ok) {
      const rows = (await res.json()) as BoardFund[];
      if (Array.isArray(rows) && rows.length > 0) return rows;
    }
  } catch {
    // fall through to the direct query
  }
  // Supabase returns at most 1,000 rows per request; the board has more.
  const PAGE = 1000;
  const rows: BoardFund[] = [];
  for (let from = 0; from < 20000; from += PAGE) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("cma_board" as any)
      .select(BOARD_COLUMNS)
      .order("total_assets", { ascending: false, nullsFirst: false })
      .order("fund_id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as BoardFund[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  if (rows.length === 0) throw new Error("No records in cma_board");
  return rows;
}

async function fetchCompanyMap(): Promise<CompanyMapRow[]> {
  try {
    const res = await fetch("/api/company-map");
    if (res.ok) {
      const rows = (await res.json()) as CompanyMapRow[];
      if (Array.isArray(rows) && rows.length > 0) return rows;
    }
  } catch {
    // fall through
  }
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("cma_company_map" as any)
    .select("company,board_product,funds,assets,inflow_12m,inflow_complete,report_period")
    .order("assets", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as CompanyMapRow[];
}

export function useCmaBoard() {
  return useQuery({
    queryKey: ["cma-board"],
    queryFn: fetchBoard,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

export function useCompanyMap() {
  return useQuery({
    queryKey: ["cma-company-map"],
    queryFn: fetchCompanyMap,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

// ─── Formatting helpers ─────────────────────────────────────────────

const MONTHS = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

/** 202607 → "יולי 2026" */
export const periodLabel = (period: number | null | undefined) => {
  if (!period) return "";
  const s = String(period);
  return `${MONTHS[Number(s.slice(4, 6))] ?? s.slice(4, 6)} ${s.slice(0, 4)}`;
};

/** 202607 → "07/26" (axis ticks) */
export const periodShort = (period: number) => {
  const s = String(period);
  return `${s.slice(4, 6)}/${s.slice(2, 4)}`;
};

export const fmtPct = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? null : `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`;

/** Plain percentage without sign (exposures, fees) */
export const fmtPlainPct = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined || !Number.isFinite(v) ? null : `${v.toFixed(digits)}%`;

export const fmtNum = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? null : v.toFixed(digits);

/** ₪ millions → "1,234" (millions) */
export const fmtMillions = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v).toLocaleString("en-US");

/** ₪ millions → "241.9 מיליארד ₪" / "820 מיליון ₪" */
export const fmtAssets = (millions: number | null | undefined) => {
  if (millions === null || millions === undefined || !Number.isFinite(millions)) return null;
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)} מיליארד ₪`;
  return `${Math.round(millions).toLocaleString("en-US")} מיליון ₪`;
};

/** Cumulative growth of the 12-month series, as % from the start, per month. */
export const cumulativeSeries = (series: BoardFund["series_12m"]) => {
  if (!series) return [];
  let acc = 1;
  return series.map((pt) => {
    if (pt.y === null || pt.y === undefined) return { p: pt.p, v: null as number | null };
    acc *= 1 + pt.y / 100;
    return { p: pt.p, v: (acc - 1) * 100 };
  });
};
