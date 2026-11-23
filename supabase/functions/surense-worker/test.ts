// deno test supabase/functions/surense-worker  (synthetic data only; Surense and the DB are mocks)
import assert from "node:assert/strict";
import { createSurenseWorkerHandler } from "./handler.ts";
import { collectingDefer } from "../_shared/background.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";
import { createTokenSource, TOKEN_URL } from "../_shared/surense/auth.ts";
import type { JobRow } from "../_shared/surense/jobs.ts";

const SECRET = "cron-secret-for-tests";
const CID = "c0000000-0000-4000-8000-000000000001";

const eventJob = (id: number, type: string, payload: unknown): JobRow =>
  ({ id, kind: "surense.event", params: {}, event_id: id, event_type: type, payload: JSON.stringify(payload), attempts: 1 });

function queue(rows: JobRow[], extra: RpcScript = () => null): RpcScript {
  const q = [...rows];
  return (fn, a) => (fn === "surense_job_claim" ? q.splice(0, 5) : extra(fn, a));
}

function setup(script: RpcScript, route: (url: string, body: string) => Response = () => json({}), withTokens = true) {
  const rpc = mockRpc(script);
  const f = mockFetch((url, body) => (url === TOKEN_URL ? json({ access_token: "tok_test_aaaaaaaaaaaa", expires_in: 3600 }) : route(url, body)));
  const bg = collectingDefer();
  const tokens = withTokens ? createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch }) : null;
  const lines: string[] = [];
  const h = createSurenseWorkerHandler({
    env: testEnv(), rpc, log: silentLog(lines), defer: bg.defer, tokens, fetch: f.fetch, sleep: () => Promise.resolve(), minIntervalMs: 0,
  });
  return { h, rpc, f, bg, lines };
}

const cron = (headers: Record<string, string> = {}) =>
  new Request("https://x/functions/v1/surense-worker", { method: "POST", headers: { "x-cron-secret": SECRET, "x-job-run": "42", ...headers }, body: "{}" });

Deno.test("auth: wrong/missing secret 401, unset EDGE_CRON_SECRET 503, GET 405, no work", async () => {
  const { h, rpc } = setup(queue([]));
  assert.equal((await h(cron({ "x-cron-secret": "nope" }))).status, 401);
  assert.equal((await h(new Request("https://x", { method: "POST" }))).status, 401);
  assert.equal((await h(new Request("https://x", { method: "GET" }))).status, 405);
  const u = createSurenseWorkerHandler({ env: testEnv({ EDGE_CRON_SECRET: "" }), rpc: null, log: silentLog(), defer: collectingDefer().defer, tokens: null });
  assert.equal((await u(cron())).status, 503);
  assert.equal(rpc.calls.length, 0);
});

Deno.test("auth: without EDGE_CRON_SECRET the database decides (api.cron_secret_ok against the Vault); a refusal is 401", async () => {
  // low-entropy fixtures on purpose: the CI secret scanner must not mistake them for a real key
  const VAULT_VALUE = "vault-value-for-tests-aaaaaaaaaa";
  const OTHER_VALUE = "someone-elses-value-aaaaaaaaaa";
  const seen: unknown[] = [];
  const script: RpcScript = (fn, a) => {
    if (fn === "cron_secret_ok") { seen.push(a.p_secret); return a.p_secret === VAULT_VALUE; }
    return fn === "surense_job_claim" ? [] : null;
  };
  const rpc = mockRpc(script);
  const h = createSurenseWorkerHandler({ env: testEnv({ EDGE_CRON_SECRET: "" }), rpc, log: silentLog(), defer: collectingDefer().defer, tokens: null });
  assert.equal((await h(cron({ "x-cron-secret": VAULT_VALUE }))).status, 202);
  assert.equal((await h(cron({ "x-cron-secret": OTHER_VALUE }))).status, 401);
  assert.deepEqual(seen, [VAULT_VALUE, OTHER_VALUE]);
  // a stale function secret no longer blocks the tick: the Vault answer wins
  const stale = createSurenseWorkerHandler({ env: testEnv({ EDGE_CRON_SECRET: "old-copy-that-never-matched" }), rpc, log: silentLog(), defer: collectingDefer().defer, tokens: null });
  assert.equal((await stale(cron({ "x-cron-secret": VAULT_VALUE }))).status, 202);
});

Deno.test("no Surense credentials: nothing claimed, run fails with surense_not_configured", async () => {
  const { h, rpc, bg } = setup(queue([eventJob(1, "customer.created", {})]), undefined, false);
  assert.equal((await h(cron())).status, 202);
  await bg.settle();
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["job_finish"]);
  assert.equal(rpc.calls[0].args.p_error, "surense_not_configured");
});

Deno.test("event jobs: routed by type; unknown types skipped; payload never logged", async () => {
  const rows = [
    eventJob(1, "customer.updated", { data: { id: CID, firstName: "Zzname" } }),
    eventJob(2, "meeting.created", { data: { id: CID } }),
    { ...eventJob(3, "customer.created", {}), payload: "{not json" },
  ];
  const { h, rpc, bg, f, lines } = setup(queue(rows, (fn) => (fn === "surense_customers_upsert" ? { upserted: 1 } : null)), (url) =>
    url.endsWith(`/customers/${CID}`) ? json({ id: CID, firstName: "Zzname", lastModifiedDate: "2026-11-20T10:00:00Z" }) : json({}, 404));
  assert.equal((await h(cron())).status, 202);
  await bg.settle();
  const completes = rpc.calls.filter((c) => c.fn === "surense_job_complete").map((c) => [c.args.p_id, c.args.p_result, c.args.p_error]);
  assert.deepEqual(completes, [[1, "done", null], [2, "skipped", "no_handler"], [3, "skipped", "bad_payload"]]);
  assert.ok(f.calls.some((c) => c.url.endsWith(`/customers/${CID}`)));
  const finish = rpc.calls.find((c) => c.fn === "job_finish")!;
  assert.equal(finish.args.p_ok, true);
  assert.equal((finish.args.p_stats as Record<string, number>).done, 1);
  assert.ok(!lines.join("\n").includes("Zzname"));
});

Deno.test("a Surense outage fails the job (DB backoff), not the run", async () => {
  const { h, rpc, bg } = setup(queue([eventJob(1, "customer.updated", { data: { id: CID } })]), () => json({}, 503));
  await h(cron());
  await bg.settle();
  const c = rpc.calls.find((x) => x.fn === "surense_job_complete")!;
  assert.deepEqual([c.args.p_result, c.args.p_error], ["failed", "surense_http_503"]);
  assert.equal(rpc.calls.find((x) => x.fn === "job_finish")!.args.p_ok, true);
});

Deno.test("one retry layer: a 503 makes exactly one HTTP call; the job goes back retryable with the Retry-After seconds", async () => {
  const sleeps: number[] = [];
  const rpc = mockRpc(queue([eventJob(7, "customer.updated", { data: { id: CID } })]));
  const f = mockFetch((url) =>
    url === TOKEN_URL ? json({ access_token: "tok_test_aaaaaaaaaaaa", expires_in: 3600 }) : json({ statusCode: 503 }, 503, { "retry-after": "120" }));
  const bg = collectingDefer();
  const h = createSurenseWorkerHandler({
    env: testEnv(), rpc, log: silentLog(), defer: bg.defer, fetch: f.fetch, minIntervalMs: 0,
    tokens: createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch }),
    sleep: (ms) => (sleeps.push(ms), Promise.resolve()),
  });
  await h(cron());
  await bg.settle();
  assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 1, "no in-client retry");
  assert.deepEqual(sleeps, [], "no in-client wait inside the job lease");
  const c = rpc.calls.find((x) => x.fn === "surense_job_complete")!;
  assert.deepEqual(c.args, { p_id: 7, p_attempts: 1, p_result: "failed", p_error: "surense_http_503", p_error_kind: "unavailable", p_retry_after: 120 });
});

Deno.test("a permanent refusal is skipped with its kind and no retry-after", async () => {
  const { h, rpc, bg, f } = setup(queue([eventJob(8, "customer.updated", { data: { id: CID } })]), () =>
    json({ statusCode: 400, errors: [{ code: 40000, message: "x" }] }, 400));
  await h(cron());
  await bg.settle();
  assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 1);
  const c = rpc.calls.find((x) => x.fn === "surense_job_complete")!;
  assert.deepEqual([c.args.p_result, c.args.p_error, c.args.p_error_kind, c.args.p_retry_after], ["skipped", "surense_400_40000", "permanent", null]);
});

Deno.test("an unfinished customers pass queues its next slice after completing", async () => {
  const job: JobRow = { id: 9, kind: "surense.pull_customers", params: {}, event_id: null, event_type: null, payload: null, attempts: 1 };
  const order: string[] = [];
  const { h, rpc, bg } = setup(queue([job], (fn) => {
    order.push(fn);
    return fn === "surense_sync_state_get" ? { cursor: null } : fn === "surense_customers_upsert" ? { upserted: 1 } : null;
  }), () => json({ results: [{ id: CID }], hasNextPage: true, nextCursor: "cur_2" })); // never-ending pass: stops at maxPages
  await h(cron());
  await bg.settle();
  const i = order.indexOf("surense_job_complete");
  assert.ok(i > 0 && order.indexOf("surense_job_enqueue") > i, "enqueue after complete (dedupe key is free again)");
  const enq = rpc.calls.find((c) => c.fn === "surense_job_enqueue")!;
  assert.deepEqual(enq.args, { p_kind: "surense.pull_customers", p_params: {}, p_dedupe: "pull_customers" });
});

Deno.test("switch off: claim raises PT423 -> run ends ok with disabled=true", async () => {
  const { h, rpc, bg } = setup((fn) => {
    if (fn === "surense_job_claim") throw rpcError(423, "PT423", "feature_disabled:surense_enabled");
    return null;
  });
  await h(cron());
  await bg.settle();
  const finish = rpc.calls.find((c) => c.fn === "job_finish")!;
  assert.equal(finish.args.p_ok, true);
  assert.equal((finish.args.p_stats as Record<string, unknown>).disabled, true);
});
