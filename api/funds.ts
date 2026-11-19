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
//
// Backend switch (docs/platform/FRONTEND-BACKEND-V2.md): VITE_SEELD_BACKEND=v2 reads seeld-site through the
// `api` schema (Accept-Profile: api) in 200-row Range pages with count=exact, with no Tokyo fallback.

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

const FUND_COLUMNS = [
  "id", "fund_id", "fund_name", "managing_company", "source", "product_type",
  "specialization", "report_period", "total_assets", "monthly_yield", "ytd_yield",
  "avg_annual_yield_3yrs", "avg_annual_yield_5yrs", "avg_annual_management_fee",
  "avg_deposit_fee", "standard_deviation", "sharpe_ratio", "stock_market_exposure",
  "foreign_exposure", "foreign_currency_exposure", "actuarial_adjustment",
].join(",");

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
      const rows = await readAllV2(`cma_funds_latest?select=${FUND_COLUMNS}&order=total_assets.desc.nullslast,id.asc`);
      return new Response(JSON.stringify(rows), { headers: CACHED });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "upstream unreachable");
    }
  }

  // `id.asc` is the tiebreaker that keeps the pages below disjoint and complete.
  const url =
    `${SUPABASE_URL}/rest/v1/cma_funds_latest` +
    `?select=${FUND_COLUMNS}&order=total_assets.desc,id.asc`;

  // PostgREST caps one response at 1,000 rows (Supabase max_rows) and the view
  // holds more than that (1,442 funds), so the rows are read in pages and
  // joined here — the same loop as api/board.ts. Before this, the fund finder
  // and the return tables saw only the 1,000 largest funds.
  const PAGE = 1000;
  const rows: unknown[] = [];
  for (let from = 0; from < 20000; from += PAGE) {
    let upstream: Response;
    try {
      upstream = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${from}-${from + PAGE - 1}`,
          "Range-Unit": "items",
        },
      });
    } catch {
      return fail("upstream unreachable");
    }
    if (!upstream.ok && upstream.status !== 206) return fail(`upstream ${upstream.status}`);
    const page = (await upstream.json()) as unknown[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  return new Response(JSON.stringify(rows), { headers: CACHED });
}

const CACHED = {
  "Content-Type": "application/json; charset=utf-8",
  // One origin fetch per hour; served stale for a day while revalidating.
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

// Never cache a failure — the client falls back to its bundled snapshot, and a
// cached 502 would keep it there long after the database recovered.
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
