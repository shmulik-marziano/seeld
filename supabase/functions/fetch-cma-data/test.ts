// deno test supabase/functions/fetch-cma-data  (synthetic CKAN records)
import assert from "node:assert/strict";
import { createCmaHandler, DATA_SOURCES, mapRecord, newCursor, PAGE_SIZE, parseCursor } from "./handler.ts";
import { collectingDefer } from "../_shared/background.ts";
import { json, mockFetch, mockRpc, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";

const SECRET = "cron-secret-for-tests";
const RES = Object.fromEntries(DATA_SOURCES.map((d) => [d.resourceId, d.source]));
const COUNTS: Record<string, number> = { gemelnet: PAGE_SIZE + 5, pensyanet: 7, bituachnet: 3 };

function rec(i: number) {
  return { _id: i, FUND_ID: 1000 + i, FUND_NAME: `Fund ${i}`, FUND_CLASSIFICATION: "קרנות השתלמות", REPORT_PERIOD: 202609, MONTHLY_YIELD: "0.5", WITHDRAWLS: "", PARENT_COMPANY_ID: "14" };
}

function ckan(fail: string | null = null) {
  return mockFetch((url) => {
    const u = new URL(url);
    const src = RES[u.searchParams.get("resource_id") ?? ""];
    if (src === fail) return json({}, 500);
    const limit = Number(u.searchParams.get("limit"));
    const offset = Number(u.searchParams.get("offset") ?? "0");
    const total = COUNTS[src];
    if (limit === 1) return json({ success: true, result: { total, records: [rec(0)] } });
    const n = Math.max(0, Math.min(limit, total - offset));
    return json({ success: true, result: { total, records: Array.from({ length: n }, (_, i) => rec(offset + i)) } });
  });
}

const script: RpcScript = (fn, args) => fn === "cma_upsert_batch" ? { upserted: (args.p_rows as unknown[]).length } : fn === "cma_finish_sync" ? { ok: true } : null;

function setup(f: ReturnType<typeof mockFetch>, opts: { sliceMs?: number; now?: () => number } = {}) {
  const rpc = mockRpc(script);
  const bg = collectingDefer();
  const h = createCmaHandler({ env: testEnv(), rpc, log: silentLog(), defer: bg.defer, fetch: f.fetch, retryDelayMs: 1, ...opts });
  return { h, rpc, bg };
}

const cron = (body: unknown = {}, run = "77") =>
  new Request("https://x/functions/v1/fetch-cma-data", { method: "POST", headers: { "x-cron-secret": SECRET, ...(run ? { "x-job-run": run } : {}) }, body: JSON.stringify(body) });

Deno.test("mapRecord keeps the Tokyo mapping and drops rows without id/period", () => {
  const ds = DATA_SOURCES[0];
  const r = mapRecord(rec(1), ds)!;
  assert.equal(r.fund_id, "1001");
  assert.equal(r.product_type, "hishtalmut");
  assert.equal(r.monthly_yield, 0.5);
  assert.equal(r.withdrawals, null);
  assert.equal(r.managing_company_id, "14");
  assert.equal(r.report_period, 202609);
  assert.equal("raw_data" in r, false);
  assert.equal(mapRecord({ ...rec(1), FUND_ID: "" }, ds), null);
  assert.equal(mapRecord({ ...rec(1), REPORT_PERIOD: "x" }, ds), null);
});

Deno.test("full run: pages of <= 2000, finish_sync per source, job_finish ok", async () => {
  const { h, rpc, bg } = setup(ckan());
  const r = await h(cron());
  assert.equal(r.status, 202);
  await bg.settle();
  const batches = rpc.calls.filter((c) => c.fn === "cma_upsert_batch").map((c) => (c.args.p_rows as unknown[]).length);
  assert.deepEqual(batches, [PAGE_SIZE, 5, 7, 3]);
  const fins = rpc.calls.filter((c) => c.fn === "cma_finish_sync").map((c) => [c.args.p_source, c.args.p_status]);
  assert.deepEqual(fins, [["gemelnet", "success"], ["pensyanet", "success"], ["bituachnet", "success"]]);
  const job = rpc.calls.find((c) => c.fn === "job_finish")!;
  assert.equal(job.args.p_run, 77);
  assert.equal(job.args.p_ok, true);
  assert.equal((job.args.p_stats as Record<string, number>).upserted, PAGE_SIZE + 15);
});

Deno.test("slice budget exhausted: api.job_continue with the cursor, no job_finish", async () => {
  let t = 0;
  const { h, rpc, bg } = setup(ckan(), { sliceMs: 10, now: () => (t += 6) });
  await h(cron());
  await bg.settle();
  const cont = rpc.calls.find((c) => c.fn === "job_continue")!;
  assert.equal(cont.args.p_run, 77);
  assert.equal(cont.args.p_name, "fetch-cma-data");
  assert.ok(parseCursor(cont.args.p_cursor));
  assert.equal(rpc.calls.some((c) => c.fn === "job_finish"), false);
  // the next slice resumes from the cursor and finishes the run
  const next = setup(ckan());
  await next.h(cron({ cursor: cont.args.p_cursor }));
  await next.bg.settle();
  assert.equal(next.rpc.calls.find((c) => c.fn === "job_finish")!.args.p_ok, true);
});

Deno.test("a failing source is logged as error; the run is not ok; others still load", async () => {
  const { h, rpc, bg } = setup(ckan("pensyanet"));
  await h(cron());
  await bg.settle();
  const fins = rpc.calls.filter((c) => c.fn === "cma_finish_sync").map((c) => [c.args.p_source, c.args.p_status]);
  assert.deepEqual(fins, [["gemelnet", "success"], ["pensyanet", "error"], ["bituachnet", "success"]]);
  const job = rpc.calls.find((c) => c.fn === "job_finish")!;
  assert.equal(job.args.p_ok, false);
  assert.match(String(job.args.p_error), /pensyanet:ckan_http_500/);
});

Deno.test("manual single-source run without x-job-run; auth and bad cursor", async () => {
  const { h, rpc, bg } = setup(ckan());
  const r = await h(cron({ source: "bituachnet" }, ""));
  assert.deepEqual((await r.json()).sources, ["bituachnet"]);
  await bg.settle();
  assert.deepEqual(rpc.calls.filter((c) => c.fn === "cma_finish_sync").map((c) => c.args.p_source), ["bituachnet"]);
  assert.equal(rpc.calls.some((c) => c.fn === "job_finish"), false);
  assert.equal((await h(new Request("https://x", { method: "POST", headers: { "x-cron-secret": "no" } }))).status, 401);
  assert.equal((await h(cron({ cursor: { v: 9 } }))).status, 400);
  assert.equal(newCursor("nope", 0).sources.length, 3);
});
