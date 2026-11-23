// fetch-cma-data: weekly CMA (רשות שוק ההון) sync from data.gov.il CKAN into content.cma_funds.
// Rewrite of supabase/_archive_tokyo/functions/fetch-cma-data (same three resources, same field mapping, latest
// REPORT_PERIOD only). v2 contract (FOUNDATION §7, §9): pg_cron 'cma-sync-weekly' -> ops.call_function ->
// x-cron-secret, 202 at once, work in EdgeRuntime.waitUntil in slices of <= 60 s. A slice that runs out of time
// persists its cursor with api.job_continue (which invokes the next slice with {cursor}); pages of 2,000 rows go to
// api.cma_upsert_batch; each source ends with api.cma_finish_sync (sync log + cma_refresh_pending, so ops.watchdog
// refreshes the matviews and content.refresh_investment_tracks within 10 minutes); the run ends with api.job_finish.
// Manual run (no x-job-run): POST with the secret and optional {"source":"gemelnet"}; it runs in one invocation.
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { cronSecretViaRpc, requireCronSecret } from "../_shared/secret.ts";
import { type Defer, jobRunId, sleep } from "../_shared/background.ts";

export const CKAN_BASE = "https://data.gov.il/api/3/action/datastore_search";
export const PAGE_SIZE = 2000;
export const SLICE_MS = 50_000; // leaves headroom inside the 60 s slice for the last page + job_continue
export const JOB = "fetch-cma-data";

type CkanRecord = Record<string, unknown>;
export type SourceName = "gemelnet" | "pensyanet" | "bituachnet";

export interface DataSource {
  source: SourceName;
  resourceId: string;
  productType: (r: CkanRecord) => string;
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

export const DATA_SOURCES: DataSource[] = [
  {
    source: "gemelnet", // קופות גמל + קרנות השתלמות
    resourceId: "a30dcbea-a1d2-482c-ae29-8f781f5025fb",
    productType: (r) => {
      const cls = s(r.FUND_CLASSIFICATION);
      const spec = s(r.SPECIALIZATION);
      const target = s(r.TARGET_POPULATION);
      if (cls.includes("השתלמות")) return "hishtalmut";
      if (cls.includes("גמל להשקעה") || cls.includes("להשקעה")) return "gemel_invest";
      if (target.includes("ילד") || spec.includes("ילד")) return "child_savings";
      return "gemel";
    },
  },
  { source: "pensyanet", resourceId: "6d47d6b5-cb08-488b-b333-f1e717b1e1bd", productType: () => "pensia" },
  { source: "bituachnet", resourceId: "c6c62cc7-fe02-4b18-8f3e-813abfbb4647", productType: () => "polisa" },
];

export function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "NULL") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const str = (v: unknown): string | null => {
  const t = s(v);
  return t ? t : null;
};

/** Pure: CKAN record -> api.cma_upsert_batch row (no raw_data). null when the row has no fund id or period. */
export function mapRecord(r: CkanRecord, ds: DataSource): Record<string, unknown> | null {
  const fundId = s(r.FUND_ID);
  const period = Number(r.REPORT_PERIOD);
  if (!fundId || !Number.isInteger(period) || period < 190001 || period > 299912) return null;
  return {
    fund_id: fundId,
    fund_name: s(r.FUND_NAME),
    fund_classification: str(r.FUND_CLASSIFICATION),
    managing_company: str(r.MANAGING_CORPORATION) ?? str(r.PARENT_COMPANY_NAME) ?? str(r.CONTROLLING_CORPORATION),
    managing_company_id: str(r.MANAGING_CORPORATION_LEGAL_ID) ?? str(r.PARENT_COMPANY_ID),
    source: ds.source,
    product_type: ds.productType(r),
    specialization: str(r.SPECIALIZATION),
    sub_specialization: str(r.SUB_SPECIALIZATION),
    target_population: str(r.TARGET_POPULATION),
    report_period: period,
    inception_date: str(r.INCEPTION_DATE),
    total_assets: parseNum(r.TOTAL_ASSETS),
    deposits: parseNum(r.DEPOSITS),
    withdrawals: parseNum(r.WITHDRAWLS),
    internal_transfers: parseNum(r.INTERNAL_TRANSFERS),
    net_monthly_deposits: parseNum(r.NET_MONTHLY_DEPOSITS),
    monthly_yield: parseNum(r.MONTHLY_YIELD),
    ytd_yield: parseNum(r.YEAR_TO_DATE_YIELD),
    yield_trailing_3yrs: parseNum(r.YIELD_TRAILING_3_YRS),
    yield_trailing_5yrs: parseNum(r.YIELD_TRAILING_5_YRS),
    avg_annual_yield_3yrs: parseNum(r.AVG_ANNUAL_YIELD_TRAILING_3YRS),
    avg_annual_yield_5yrs: parseNum(r.AVG_ANNUAL_YIELD_TRAILING_5YRS),
    avg_annual_management_fee: parseNum(r.AVG_ANNUAL_MANAGEMENT_FEE),
    avg_deposit_fee: parseNum(r.AVG_DEPOSIT_FEE),
    standard_deviation: parseNum(r.STANDARD_DEVIATION),
    alpha: parseNum(r.ALPHA),
    sharpe_ratio: parseNum(r.SHARPE_RATIO),
    liquid_assets_percent: parseNum(r.LIQUID_ASSETS_PERCENT),
    stock_market_exposure: parseNum(r.STOCK_MARKET_EXPOSURE),
    foreign_exposure: parseNum(r.FOREIGN_EXPOSURE),
    foreign_currency_exposure: parseNum(r.FOREIGN_CURRENCY_EXPOSURE),
    actuarial_adjustment: parseNum(r.ACTUARIAL_ADJUSTMENT),
  };
}

export interface SourceResult {
  source: SourceName;
  status: "success" | "error";
  fetched: number;
  upserted: number;
  period: number | null;
  error?: string;
}

export interface Cursor {
  v: 1;
  sources: SourceName[];
  i: number;
  offset: number;
  period: number | null;
  fetched: number;
  upserted: number;
  sourceStartedAt: number;
  results: SourceResult[];
}

export function newCursor(only: string | null, now: number): Cursor {
  const all = DATA_SOURCES.map((d) => d.source);
  const sources = only && (all as string[]).includes(only) ? [only as SourceName] : all;
  return { v: 1, sources, i: 0, offset: 0, period: null, fetched: 0, upserted: 0, sourceStartedAt: now, results: [] };
}

export function parseCursor(v: unknown): Cursor | null {
  if (!v || typeof v !== "object") return null;
  const c = v as Cursor;
  const names = DATA_SOURCES.map((d) => d.source as string);
  if (c.v !== 1 || !Array.isArray(c.sources) || !c.sources.every((x) => names.includes(x)) || !Number.isInteger(c.i) ||
    !Number.isInteger(c.offset) || !Array.isArray(c.results)) return null;
  return c;
}

class SyncError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export interface CmaDeps {
  env: Env;
  rpc: Rpc | null;
  log: Logger;
  defer: Defer;
  fetch?: FetchFn;
  now?: () => number;
  sliceMs?: number;
  retryDelayMs?: number;
}

async function ckan(d: CmaDeps, params: Record<string, string>): Promise<{ records: CkanRecord[]; total: number }> {
  const url = `${CKAN_BASE}?${new URLSearchParams(params)}`;
  let last = "ckan_network";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep((d.retryDelayMs ?? 2000) * attempt);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const res = await (d.fetch ?? fetch)(url, { headers: { "user-agent": "SEELD-Platform/2.0" }, signal: ctrl.signal });
      if (!res.ok) {
        await res.body?.cancel().catch(() => {});
        last = `ckan_http_${res.status}`;
        if (res.status < 500 && res.status !== 429) break;
        continue;
      }
      const j = (await res.json()) as { success?: boolean; result?: { records?: CkanRecord[]; total?: number } };
      if (!j.success || !Array.isArray(j.result?.records)) {
        last = "ckan_bad_response";
        continue;
      }
      return { records: j.result!.records!, total: Number(j.result!.total ?? 0) };
    } catch {
      last = ctrl.signal.aborted ? "ckan_timeout" : "ckan_network";
    } finally {
      clearTimeout(timer);
    }
  }
  throw new SyncError(last);
}

/** Runs pages until done or out of the slice budget; mutates and returns the cursor. */
export async function runSlice(d: CmaDeps, rpc: Rpc, c: Cursor, log: Logger, budgetMs: number | null): Promise<{ done: boolean; cursor: Cursor }> {
  const now = d.now ?? Date.now;
  const t0 = now();
  while (c.i < c.sources.length) {
    if (budgetMs !== null && now() - t0 > budgetMs) return { done: false, cursor: c };
    const ds = DATA_SOURCES.find((x) => x.source === c.sources[c.i])!;
    const finish = async (status: "success" | "error", error?: string) => {
      const stats = {
        records_fetched: c.fetched, records_upserted: c.upserted, latest_period: c.period,
        duration_ms: Math.max(0, now() - c.sourceStartedAt), ...(error ? { error_message: error } : {}),
      };
      try {
        await rpc.call("cma_finish_sync", { p_source: ds.source, p_status: status, p_stats: stats });
      } catch (e) {
        log.error("cma_finish_sync failed", { source: ds.source, code: e instanceof RpcError ? e.code : "unknown" });
        if (status === "success") { status = "error"; error = "finish_sync_failed"; }
      }
      c.results.push({ source: ds.source, status, fetched: c.fetched, upserted: c.upserted, period: c.period, ...(error ? { error } : {}) });
      log.info("source done", { source: ds.source, status, fetched: c.fetched, upserted: c.upserted, period: c.period, error });
      c.i++;
      c.offset = 0;
      c.period = null;
      c.fetched = 0;
      c.upserted = 0;
      c.sourceStartedAt = now();
    };
    try {
      if (c.period === null) {
        // datastore_search_sql is blocked (403) on data.gov.il: the newest record sorted by period gives the period
        const meta = await ckan(d, { resource_id: ds.resourceId, limit: "1", sort: "REPORT_PERIOD desc" });
        const p = Number(meta.records[0]?.REPORT_PERIOD);
        if (!Number.isInteger(p)) throw new SyncError("ckan_no_period");
        c.period = p;
      }
      const page = await ckan(d, {
        resource_id: ds.resourceId, limit: String(PAGE_SIZE), offset: String(c.offset),
        filters: JSON.stringify({ REPORT_PERIOD: c.period }), sort: "_id asc",
      });
      const rows = page.records.map((r) => mapRecord(r, ds)).filter((r): r is Record<string, unknown> => r !== null);
      if (rows.length) {
        try {
          const res = await rpc.call<{ upserted?: number }>("cma_upsert_batch", { p_rows: rows });
          c.upserted += Number(res?.upserted ?? 0);
        } catch (e) {
          throw new SyncError(e instanceof RpcError ? `rpc_${e.code}` : "rpc_error");
        }
      }
      c.fetched += page.records.length;
      c.offset += page.records.length;
      if (page.records.length < PAGE_SIZE || c.offset >= page.total || c.offset >= 50_000) {
        if (c.fetched === 0) await finish("error", "ckan_empty");
        else await finish("success");
      }
    } catch (e) {
      await finish("error", e instanceof SyncError ? e.code : "unexpected");
    }
  }
  return { done: true, cursor: c };
}

export function createCmaHandler(d: CmaDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const rid = requestIdFor(req);
    const log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
      await requireCronSecret(req, d.env.cronSecret, d.rpc ? cronSecretViaRpc(d.rpc) : undefined);
      if (!d.rpc) throw new HttpError("unavailable", "Not configured");
      const rpc = d.rpc;
      const run = jobRunId(req);
      const body = (await req.json().catch(() => ({}))) as { cursor?: unknown; source?: unknown };
      const now = d.now ?? Date.now;
      let cursor: Cursor;
      if (body.cursor !== undefined) {
        const parsed = parseCursor(body.cursor);
        if (!parsed) throw new HttpError("bad_request", "bad cursor");
        cursor = parsed;
      } else {
        cursor = newCursor(typeof body.source === "string" ? body.source : null, now());
      }
      d.defer((async () => {
        try {
          // with a run id: slices + job_continue; manual (no run): one invocation does everything
          const { done, cursor: c } = await runSlice(d, rpc, cursor, log, run ? d.sliceMs ?? SLICE_MS : null);
          if (!done && run) {
            await rpc.call("job_continue", { p_run: run, p_name: JOB, p_cursor: c });
            log.info("slice handed over", { run, next: c.sources[c.i], offset: c.offset });
            return;
          }
          const ok = c.results.length > 0 && c.results.every((r) => r.status === "success");
          const stats = { results: c.results, fetched: c.results.reduce((a, r) => a + r.fetched, 0), upserted: c.results.reduce((a, r) => a + r.upserted, 0) };
          log.info("cma sync done", { run, ok, ...stats, results: undefined });
          if (run) {
            await rpc.call("job_finish", {
              p_run: run, p_ok: ok, p_stats: stats,
              p_error: ok ? null : c.results.filter((r) => r.status !== "success").map((r) => `${r.source}:${r.error}`).join(",").slice(0, 300),
            });
          }
        } catch (e) {
          const code = e instanceof RpcError ? e.code : e instanceof Error ? e.name : "unknown";
          log.error("cma sync failed", { run, code });
          if (run) await rpc.call("job_finish", { p_run: run, p_ok: false, p_stats: {}, p_error: code }).catch(() => {});
        }
      })());
      return jsonResponse({ accepted: true, run, sources: cursor.sources.slice(cursor.i) }, rid, { status: 202 });
    } catch (e) {
      if (!(e instanceof HttpError)) log.error("fetch-cma-data error", { error: e instanceof Error ? e.name : "unknown" });
      return errorResponse(e, rid);
    }
  };
}
