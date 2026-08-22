// Cached read of cma_funds_latest, served from Vercel's Frankfurt edge.
//
// The database is in ap-northeast-1 (Tokyo) and the visitors are in Israel, so
// every fund-finder and return-tables view was paying ~1.7s to pull ~120KB
// gzipped halfway around the world. The underlying materialized view is
// refreshed once a day by the refresh-cma-funds-latest cron at 03:15, so the
// payload is effectively static: one origin fetch per hour serves everybody,
// and stale-while-revalidate means nobody ever waits for the refresh.
//
// Keep FUND_COLUMNS identical to the copy in src/hooks/useCmaFunds.ts — the
// hook falls back to querying Supabase directly when this route is absent, as
// it is under `vite dev` and `vite preview`. A test asserts the two agree.

export const config = { runtime: "edge", regions: ["fra1"] };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";

// Publishable (anon) key — the same value the browser bundle already carries.
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";

const FUND_COLUMNS = [
  "id", "fund_id", "fund_name", "managing_company", "source", "product_type",
  "specialization", "report_period", "total_assets", "monthly_yield", "ytd_yield",
  "avg_annual_yield_3yrs", "avg_annual_yield_5yrs", "avg_annual_management_fee",
  "avg_deposit_fee", "standard_deviation", "sharpe_ratio", "stock_market_exposure",
  "foreign_exposure", "foreign_currency_exposure", "actuarial_adjustment",
].join(",");

export default async function handler(): Promise<Response> {
  const url =
    `${SUPABASE_URL}/rest/v1/cma_funds_latest` +
    `?select=${FUND_COLUMNS}&order=total_assets.desc`;

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

// Never cache a failure — the client falls back to its bundled snapshot, and a
// cached 502 would keep it there long after the database recovered.
function fail(reason: string): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status: 502,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
