// Cached read of cma_company_map: assets and 12-month net inflows per managing
// company and board product, for the market-map table on the returns board.
// Same edge cache as api/board.ts; the view derives from cma_board, so it moves
// with the daily refresh.

export const config = { runtime: "edge", regions: ["fra1"] };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";

// Publishable (anon) key — the same value the browser bundle already carries.
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";

export default async function handler(): Promise<Response> {
  const url =
    `${SUPABASE_URL}/rest/v1/cma_company_map` +
    `?select=company,board_product,funds,assets,inflow_12m,inflow_complete,report_period&order=assets.desc.nullslast`;

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
