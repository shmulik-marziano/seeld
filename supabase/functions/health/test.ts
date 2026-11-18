// deno test supabase/functions/health
import assert from "node:assert/strict";
import { createHealthHandler } from "./handler.ts";
import { createMemoryRateLimiter } from "../_shared/rateLimit.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";

function setup(script: RpcScript, staffFetch?: ReturnType<typeof mockFetch>) {
  const rpc = mockRpc(script);
  return { rpc, h: createHealthHandler({ env: testEnv(), rpc, log: silentLog(), limiter: createMemoryRateLimiter(), fetch: staffFetch?.fetch }) };
}
const get = (headers: Record<string, string> = {}) => new Request("https://x/functions/v1/health", { headers: { "x-forwarded-for": "203.0.113.7", ...headers } });

Deno.test("public GET returns exactly three keys", async () => {
  const { h } = setup(() => ({ ok: true, degraded: false, cma_age_bucket: "fresh", extra: "never shown" }));
  const r = await h(get());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.deepEqual(await r.json(), { ok: true, degraded: false, cma_age_bucket: "fresh" });
});

Deno.test("DB unreachable: 503 with the same three keys, degraded true", async () => {
  const { h } = setup(() => { throw rpcError(0, "network", "x"); });
  const r = await h(get());
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { ok: false, degraded: true, cma_age_bucket: "unknown" });
});

Deno.test("cron secret adds the edge view (names/booleans only); POST 405", async () => {
  const { h } = setup(() => ({ ok: true, degraded: true, cma_age_bucket: "none" }));
  const b = await (await h(get({ "x-cron-secret": "cron-secret-for-tests" }))).json();
  assert.equal(b.edge.stage, "development");
  assert.equal(b.edge.secret_key, "SEELD_SECRET_KEY");
  assert.equal(b.edge.ip.source, "x-forwarded-for");
  assert.ok(!JSON.stringify(b).includes("test-secret-key") && !JSON.stringify(b).includes("203.0.113.7"));
  const plain = await (await h(get({ "x-cron-secret": "wrong" }))).json();
  assert.equal(plain.edge, undefined);
  assert.equal((await h(new Request("https://x", { method: "POST" }))).status, 405);
});

Deno.test("staff bearer: staff.ops_health through the staff profile; a refused token keeps the public 200 body", async () => {
  const ok = mockFetch(() => json({ degraded: false, outbox_pending: 0 }));
  const { h } = setup(() => ({ ok: true, degraded: false, cma_age_bucket: "fresh" }), ok);
  const jwt = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJlLXNpZ25hdHVyZQ";
  const b = await (await h(get({ authorization: `Bearer ${jwt}` }))).json();
  assert.deepEqual(b.staff, { degraded: false, outbox_pending: 0 });
  const hdr = ok.calls[0].init!.headers as Record<string, string>;
  assert.equal(hdr["accept-profile"], "staff");
  assert.equal(hdr.apikey, "sb_publishable_test");
  const no = mockFetch(() => json({ code: "PT403", message: "forbidden" }, 403));
  const s2 = setup(() => ({ ok: true, degraded: false, cma_age_bucket: "fresh" }), no);
  const refused = await s2.h(get({ authorization: `Bearer ${jwt}` }));
  assert.equal(refused.status, 200);
  assert.deepEqual(await refused.json(), { ok: true, degraded: false, cma_age_bucket: "fresh" });
  const down = mockFetch(() => { throw new Error("network"); });
  const s3 = setup(() => ({ ok: true, degraded: false, cma_age_bucket: "fresh" }), down);
  const r3 = await s3.h(get({ authorization: `Bearer ${jwt}` }));
  assert.equal(r3.status, 200);
  assert.deepEqual(Object.keys(await r3.json()).sort(), ["cma_age_bucket", "degraded", "ok"]);
});
