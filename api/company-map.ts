// Cached read of cma_company_map: assets and 12-month net inflows per managing
// company and board product, for the market-map table on the returns board.
// Same edge cache as api/board.ts; the view derives from cma_board, so it moves
// with the daily refresh.
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

const MAP_COLUMNS = "company,board_product,funds,assets,inflow_12m,inflow_complete,report_period";

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
        `cma_company_map?select=${MAP_COLUMNS}&order=assets.desc.nullslast,company.asc,board_product.asc`,
      );
      return new Response(JSON.stringify(rows), { headers: CACHED });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "upstream unreachable");
    }
  }

  const url =
    `${SUPABASE_URL}/rest/v1/cma_company_map` +
    `?select=${MAP_COLUMNS}&order=assets.desc.nullslast`;

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
