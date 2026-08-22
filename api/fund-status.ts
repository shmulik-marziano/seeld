// Cached "last sync" banner data for the fund finder and the return tables.
//
// This was two more Tokyo round trips on every view — a read of cma_sync_log
// and an exact-count HEAD against cma_funds_latest, together ~750ms — to render
// one line of text that changes when the daily 03:15 cron runs. Same edge cache
// as api/funds.ts.

export const config = { runtime: "edge", regions: ["fra1"] };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";

// Publishable (anon) key — the same value the browser bundle already carries.
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";

const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

export default async function handler(): Promise<Response> {
  try {
    const [logRes, countRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/cma_sync_log` +
          `?select=completed_at,latest_period&status=eq.success` +
          `&order=completed_at.desc&limit=1`,
        { headers: HEADERS },
      ),
      // head=true still needs a select target; fund_id is the cheapest one.
      fetch(`${SUPABASE_URL}/rest/v1/cma_funds_latest?select=fund_id`, {
        method: "HEAD",
        headers: { ...HEADERS, Prefer: "count=exact" },
      }),
    ]);

    if (!logRes.ok) return fail(`sync log ${logRes.status}`);

    const log = (await logRes.json()) as
      | { completed_at: string; latest_period: number }[]
      | null;

    // content-range comes back as "0-999/1399"; the total is after the slash.
    const total = Number(countRes.headers.get("content-range")?.split("/")[1]);

    return new Response(
      JSON.stringify({
        lastSync: log?.[0]?.completed_at ?? null,
        latestPeriod: log?.[0]?.latest_period ?? null,
        totalFunds: Number.isFinite(total) ? total : 0,
      }),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return fail("upstream unreachable");
  }
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
