/**
 * Edge Function: fetch-cma-data
 * ==============================
 * מושך נתוני תשואות, דמי ניהול וחשיפות מ-data.gov.il (CKAN Datastore API)
 *
 * מקורות:
 *   גמלנט  — resource_id: a30dcbea-a1d2-482c-ae29-8f781f5025fb (2024+)
 *   פנסיהנט — resource_id: 6d47d6b5-cb08-488b-b333-f1e717b1e1bd (2024+)
 *   ביטוחנט — resource_id: c6c62cc7-fe02-4b18-8f3e-813abfbb4647 (2024+)
 *
 * מתוזמן לרוץ פעמיים בשבוע (ראשון + רביעי) או ידנית דרך API call.
 * שומר לטבלת cma_funds ב-Supabase.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Data Source Configuration ───────────────────────────────────────

interface DataSource {
  name: string;
  source: "gemelnet" | "pensyanet" | "bituachnet";
  resourceId: string;
  mapProductType: (record: Record<string, any>) => string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: "גמלנט (קופות גמל + קרנות השתלמות)",
    source: "gemelnet",
    resourceId: "a30dcbea-a1d2-482c-ae29-8f781f5025fb",
    mapProductType: (r) => {
      const cls = (r.FUND_CLASSIFICATION || "").trim();
      const spec = (r.SPECIALIZATION || "").trim();
      const target = (r.TARGET_POPULATION || "").trim();
      if (cls.includes("השתלמות")) return "hishtalmut";
      if (cls.includes("גמל להשקעה") || cls.includes("להשקעה")) return "gemel_invest";
      if (target.includes("ילד") || spec.includes("ילד")) return "child_savings";
      return "gemel";
    },
  },
  {
    name: "פנסיהנט (קרנות פנסיה)",
    source: "pensyanet",
    resourceId: "6d47d6b5-cb08-488b-b333-f1e717b1e1bd",
    mapProductType: () => "pensia",
  },
  {
    name: "ביטוחנט (פוליסות ביטוח/חיסכון)",
    source: "bituachnet",
    resourceId: "c6c62cc7-fe02-4b18-8f3e-813abfbb4647",
    mapProductType: () => "polisa",
  },
];

const CKAN_BASE = "https://data.gov.il/api/3/action/datastore_search";
const BATCH_SIZE = 5000; // max records per API call

/**
 * Supabase throws PostgrestError objects, which are not Error instances — a
 * plain String() on one yields "[object Object]", which is what every failed
 * sync in cma_sync_log used to say. Keep the message readable instead.
 */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.details, e.hint, e.code].filter(Boolean).map(String);
    if (parts.length) return parts.join(" | ");
    try {
      return JSON.stringify(err).slice(0, 500);
    } catch {
      return "unserializable error object";
    }
  }
  return String(err);
}

// ─── Fetch Records from CKAN Datastore ──────────────────────────────

async function fetchAllRecords(
  resourceId: string,
  latestPeriodOnly: boolean = true
): Promise<{ records: Record<string, any>[]; total: number; latestPeriod: number | null }> {
  // Find the latest report period. NOTE: data.gov.il blocks the
  // datastore_search_sql endpoint with 403, so asking datastore_search for a
  // single record sorted by period descending is the only way to read it. When
  // this silently failed the whole sync fell back to "fetch every period",
  // pulling ~21,500 rows a run instead of the ~700 of the current month.
  let latestPeriod: number | null = null;

  if (latestPeriodOnly) {
    const metaUrl = `${CKAN_BASE}?resource_id=${resourceId}&limit=1&sort=${encodeURIComponent("REPORT_PERIOD desc")}`;
    const metaRes = await fetch(metaUrl, { headers: { "User-Agent": "SEELD-Platform/1.0" } });
    if (!metaRes.ok) {
      throw new Error(`CKAN period lookup returned ${metaRes.status}: ${(await metaRes.text()).slice(0, 200)}`);
    }
    const metaJson = await metaRes.json();
    const period = Number(metaJson?.result?.records?.[0]?.REPORT_PERIOD);
    if (!metaJson?.success || !Number.isFinite(period)) {
      throw new Error(`CKAN period lookup gave no usable REPORT_PERIOD: ${JSON.stringify(metaJson?.error ?? metaJson).slice(0, 200)}`);
    }
    latestPeriod = period;
  }

  // Fetch records (latest period or all)
  const allRecords: Record<string, any>[] = [];
  let offset = 0;
  let total = 0;

  while (true) {
    let url: string;
    if (latestPeriod) {
      url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${BATCH_SIZE}&offset=${offset}&filters=${encodeURIComponent(
        JSON.stringify({ REPORT_PERIOD: latestPeriod })
      )}`;
    } else {
      url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${BATCH_SIZE}&offset=${offset}&sort=REPORT_PERIOD desc`;
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "SEELD-Platform/1.0" },
    });

    if (!res.ok) {
      throw new Error(`CKAN API returned ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(`CKAN API error: ${JSON.stringify(json.error)}`);
    }

    const records = json.result.records || [];
    total = json.result.total || 0;
    allRecords.push(...records);

    // If we got less than BATCH_SIZE, we're done
    if (records.length < BATCH_SIZE || allRecords.length >= total) break;
    offset += BATCH_SIZE;

    // Safety limit
    if (allRecords.length > 50000) break;
  }

  return { records: allRecords, total, latestPeriod };
}

// ─── Map CKAN Record to DB Row ──────────────────────────────────────

function mapRecord(
  record: Record<string, any>,
  ds: DataSource
): Record<string, any> {
  return {
    fund_id: String(record.FUND_ID || record._id || ""),
    fund_name: record.FUND_NAME || "",
    fund_classification: record.FUND_CLASSIFICATION || null,
    managing_company:
      record.MANAGING_CORPORATION ||
      record.PARENT_COMPANY_NAME ||
      record.CONTROLLING_CORPORATION ||
      null,
    managing_company_id:
      record.MANAGING_CORPORATION_LEGAL_ID ||
      record.PARENT_COMPANY_ID ||
      null,
    source: ds.source,
    product_type: ds.mapProductType(record),
    specialization: record.SPECIALIZATION || null,
    sub_specialization: record.SUB_SPECIALIZATION || null,
    target_population: record.TARGET_POPULATION || null,
    report_period: record.REPORT_PERIOD || 0,
    inception_date: record.INCEPTION_DATE || null,
    total_assets: parseNum(record.TOTAL_ASSETS),
    deposits: parseNum(record.DEPOSITS),
    withdrawals: parseNum(record.WITHDRAWLS),
    internal_transfers: parseNum(record.INTERNAL_TRANSFERS),
    net_monthly_deposits: parseNum(record.NET_MONTHLY_DEPOSITS),
    monthly_yield: parseNum(record.MONTHLY_YIELD),
    ytd_yield: parseNum(record.YEAR_TO_DATE_YIELD),
    yield_trailing_3yrs: parseNum(record.YIELD_TRAILING_3_YRS),
    yield_trailing_5yrs: parseNum(record.YIELD_TRAILING_5_YRS),
    avg_annual_yield_3yrs: parseNum(record.AVG_ANNUAL_YIELD_TRAILING_3YRS),
    avg_annual_yield_5yrs: parseNum(record.AVG_ANNUAL_YIELD_TRAILING_5YRS),
    avg_annual_management_fee: parseNum(record.AVG_ANNUAL_MANAGEMENT_FEE),
    avg_deposit_fee: parseNum(record.AVG_DEPOSIT_FEE),
    standard_deviation: parseNum(record.STANDARD_DEVIATION),
    alpha: parseNum(record.ALPHA),
    sharpe_ratio: parseNum(record.SHARPE_RATIO),
    liquid_assets_percent: parseNum(record.LIQUID_ASSETS_PERCENT),
    stock_market_exposure: parseNum(record.STOCK_MARKET_EXPOSURE),
    foreign_exposure: parseNum(record.FOREIGN_EXPOSURE),
    foreign_currency_exposure: parseNum(record.FOREIGN_CURRENCY_EXPOSURE),
    actuarial_adjustment: parseNum(record.ACTUARIAL_ADJUSTMENT),
    raw_data: record,
    fetched_at: new Date().toISOString(),
  };
}

function parseNum(v: any): number | null {
  if (v === null || v === undefined || v === "" || v === "NULL") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ─── Upsert Records into Supabase ───────────────────────────────────

async function upsertBatch(
  supabase: ReturnType<typeof createClient>,
  rows: Record<string, any>[]
): Promise<number> {
  if (rows.length === 0) return 0;

  // Upsert in chunks of 500
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("cma_funds")
      .upsert(chunk, { onConflict: "fund_id,report_period,source" });

    if (error) {
      console.error(`Upsert error at chunk ${i}:`, error.message);
      throw error;
    }
    upserted += chunk.length;
  }
  return upserted;
}

// ─── Sync a Single Data Source ──────────────────────────────────────

async function syncSource(
  supabase: ReturnType<typeof createClient>,
  ds: DataSource
): Promise<{
  source: string;
  status: "success" | "error";
  recordsFetched: number;
  recordsUpserted: number;
  latestPeriod: number | null;
  error?: string;
  durationMs: number;
}> {
  const start = Date.now();
  try {
    console.log(`[${ds.source}] Fetching from data.gov.il...`);
    const { records, total, latestPeriod } = await fetchAllRecords(ds.resourceId);
    console.log(`[${ds.source}] Fetched ${records.length}/${total} records (period: ${latestPeriod})`);

    const rows = records.map((r) => mapRecord(r, ds));
    const upserted = await upsertBatch(supabase, rows);
    console.log(`[${ds.source}] Upserted ${upserted} records`);

    const durationMs = Date.now() - start;

    // Log sync
    await supabase.from("cma_sync_log").insert({
      source: ds.source,
      status: "success",
      records_fetched: records.length,
      records_upserted: upserted,
      latest_period: latestPeriod,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    });

    return {
      source: ds.source,
      status: "success",
      recordsFetched: records.length,
      recordsUpserted: upserted,
      latestPeriod,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const errorMsg = describeError(err);
    console.error(`[${ds.source}] Error:`, errorMsg);

    await supabase.from("cma_sync_log").insert({
      source: ds.source,
      status: "error",
      error_message: errorMsg,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    });

    return {
      source: ds.source,
      status: "error",
      recordsFetched: 0,
      recordsUpserted: 0,
      latestPeriod: null,
      error: errorMsg,
      durationMs,
    };
  }
}

// ─── Main Handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: sync specific source only
    let sourcesToSync = DATA_SOURCES;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.source) {
          sourcesToSync = DATA_SOURCES.filter((ds) => ds.source === body.source);
        }
      } catch {
        // No body or invalid JSON — sync all
      }
    }

    console.log(`Starting CMA sync for ${sourcesToSync.length} sources...`);

    // Sync all sources in parallel
    const results = await Promise.all(
      sourcesToSync.map((ds) => syncSource(supabase, ds))
    );

    const totalFetched = results.reduce((s, r) => s + r.recordsFetched, 0);
    const totalUpserted = results.reduce((s, r) => s + r.recordsUpserted, 0);
    const allSuccess = results.every((r) => r.status === "success");

    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: `CMA sync completed: ${totalFetched} fetched, ${totalUpserted} upserted`,
        sources: results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: allSuccess ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("CMA sync fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: describeError(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
