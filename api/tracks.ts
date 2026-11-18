// Cached read of investment_tracks, served from Vercel's Frankfurt edge.
// Same reasoning as api/funds.ts: the table is refreshed by the weekly
// sync-tracks cron, so a per-visitor round trip to Tokyo buys nothing.
//
// Keep TRACK_COLUMNS identical to the copy in src/hooks/useInvestmentTracks.ts,
// which still queries Supabase directly when this route is absent. A test
// asserts the two agree.
//
// Backend switch (docs/platform/FRONTEND-BACKEND-V2.md): VITE_SEELD_BACKEND=v2 reads seeld-site through the
// `api` schema (Accept-Profile: api) in 200-row Range pages with count=exact, with no Tokyo fallback. There the
// tracks are refreshed automatically from data.gov.il (content.refresh_investment_tracks, ADR-36) and each row
// carries source_period (YYYYMM), which the tracks page shows as the as-of date.

// Node.js runtime (Fluid), region fra1 and maxDuration 10 come from vercel.json (Vercel recommends Node over
// Edge; IMPLEMENTATION-PLAN item 22). Web signature: the default export is an object with fetch(Request).

const V2 = process.env.VITE_SEELD_BACKEND === "v2";

const SUPABASE_URL = V2
  ? (process.env.VITE_SUPABASE_URL ?? "")
  : (process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co");

// Publishable (anon) key — the same value the browser bundle already carries.
const SUPABASE_KEY = V2
  ? (process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")
  : (process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E");

const TRACK_COLUMNS = [
  "fund_number", "name", "company", "product_type", "specialization",
  "stock_exposure", "return_year1", "return_year3", "return_year5", "return_month",
  "fee_assets", "fee_deposits", "sharpe_ratio", "total_assets", "liquidity",
  "report_period", "foreign_exposure", "currency_exposure", "stocks_pct",
  "gov_bonds_pct", "corp_bonds_pct", "cash_pct", "other_pct",
].join(",");

// v2 only (the column exists only on seeld-site). Same list in src/hooks/useInvestmentTracks.ts.
const TRACK_COLUMNS_V2 = TRACK_COLUMNS + ",source_period";

/** v2: max_rows on seeld-site. */
const API_PAGE = 200;

/** v2: every row of `api.<path>`, in Range pages that follow the server's count=exact total. */
async function readAllV2(path: string): Promise<unknown[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("not configured");
  const rows: unknown[] = [];
  let total = Number.POSITIVE_INFINITY;
  while (rows.length < total && rows.length < 50000) {
    const from = rows.length;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        "Accept-Profile": "api",
        Range: `${from}-${from + API_PAGE - 1}`,
        "Range-Unit": "items",
        Prefer: "count=exact",
      },
    });
    if (!res.ok && res.status !== 206) throw new Error(`upstream ${res.status}`);
    const page = (await res.json()) as unknown[];
    const count = Number(res.headers.get("content-range")?.split("/")[1]);
    if (Number.isFinite(count)) total = count;
    rows.push(...page);
    if (page.length === 0 || (!Number.isFinite(count) && page.length < API_PAGE)) break;
  }
  return rows;
}

async function handler(): Promise<Response> {
  if (V2) {
    try {
      const rows = await readAllV2(
        `investment_tracks?select=${TRACK_COLUMNS_V2}&is_active=eq.true&order=return_year1.desc.nullslast,fund_number.asc`,
      );
      return new Response(JSON.stringify(rows), { headers: CACHED });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "upstream unreachable");
    }
  }

  const url =
    `${SUPABASE_URL}/rest/v1/investment_tracks` +
    `?select=${TRACK_COLUMNS}&is_active=eq.true&order=return_year1.desc`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
  } catch {
    return fail("upstream unreachable");
  }

  if (!upstream.ok) return fail(`upstream ${upstream.status}`);

  return new Response(upstream.body, { headers: CACHED });
}

const CACHED = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

// The reason goes to the function log only; the public body stays generic so it never reveals
// configuration state ("not configured") or the upstream status.
function fail(reason: string): Response {
  console.error(`[api] upstream read failed: ${reason}`);
  return new Response(JSON.stringify({ error: "unavailable" }), {
    status: 502,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default { fetch: handler };
