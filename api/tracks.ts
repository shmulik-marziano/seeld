// Cached read of investment_tracks, served from Vercel's Frankfurt edge.
// Same reasoning as api/funds.ts: the table is refreshed by the weekly
// sync-tracks cron, so a per-visitor round trip to Tokyo buys nothing.
//
// Keep TRACK_COLUMNS identical to the copy in src/hooks/useInvestmentTracks.ts,
// which still queries Supabase directly when this route is absent. A test
// asserts the two agree.

export const config = { runtime: "edge", regions: ["fra1"] };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";

// Publishable (anon) key — the same value the browser bundle already carries.
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";

const TRACK_COLUMNS = [
  "fund_number", "name", "company", "product_type", "specialization",
  "stock_exposure", "return_year1", "return_year3", "return_year5", "return_month",
  "fee_assets", "fee_deposits", "sharpe_ratio", "total_assets", "liquidity",
  "report_period", "foreign_exposure", "currency_exposure", "stocks_pct",
  "gov_bonds_pct", "corp_bonds_pct", "cash_pct", "other_pct",
].join(",");

export default async function handler(): Promise<Response> {
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

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function fail(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 502,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
