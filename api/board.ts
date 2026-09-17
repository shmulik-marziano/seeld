// Cached read of cma_board (the returns board), served from Vercel's Frankfurt edge.
//
// cma_board is a materialized view over the CMA monthly history: one row per
// fund at the latest report period with trailing 3/6/12-month returns, 3y/5y,
// fees, risk, exposures, 12-month net inflows and the 12-month series for the
// chart. It is refreshed by the daily 03:15 cron (together with
// cma_funds_latest) and after the monthly sync, so the payload is effectively
// static: one origin fetch per hour serves everybody.
//
// `?product=hishtalmut` narrows the payload to one board product
// (pensia | hishtalmut | gemel | gemel_invest | polisa | child_savings).

export const config = { runtime: "edge", regions: ["fra1"] };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";

// Publishable (anon) key — the same value the browser bundle already carries.
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";

export const BOARD_COLUMNS = [
  "fund_id", "source", "fund_name", "company", "board_product", "track", "report_period",
  "inception_date", "total_assets", "monthly_yield", "ytd_yield", "ret_3m", "ret_6m", "ret_12m",
  "ret_3y", "ret_5y", "avg_annual_yield_3yrs", "avg_annual_yield_5yrs", "mgmt_fee", "deposit_fee",
  "std_dev", "sharpe", "stock_pct", "foreign_pct", "fx_pct", "inflow_12m", "inflow_months",
  "months_12m", "series_12m",
].join(",");

const PRODUCTS = new Set(["pensia", "hishtalmut", "gemel", "gemel_invest", "polisa", "child_savings"]);

export default async function handler(req: Request): Promise<Response> {
  const product = new URL(req.url).searchParams.get("product");
  const filter = product && PRODUCTS.has(product) ? `&board_product=eq.${product}` : "";
  const url =
    `${SUPABASE_URL}/rest/v1/cma_board` +
    `?select=${BOARD_COLUMNS}&order=total_assets.desc.nullslast${filter}`;

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
      // One origin fetch per hour; served stale for a day while revalidating.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

// Never cache a failure — the client falls back to a direct query, and a cached
// 502 would keep it there long after the database recovered.
function fail(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 502,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
