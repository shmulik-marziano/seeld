// deno test supabase/functions/surense-webhook  (synthetic data only; the Svix secret is generated per run)
import assert from "node:assert/strict";
import { createWebhookHandler, DISABLED_RETRY_AFTER_SEC, eventType, MAX_BODY_BYTES, verifyAnySlot } from "./handler.ts";
import { envPresence } from "../_shared/env.ts";
import { isWebhookConfigured, webhookSecrets } from "../_shared/surense/env.ts";
import { mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";
import { createMemoryRateLimiter } from "../_shared/rateLimit.ts";
import { svixSignature } from "../_shared/surense/svix.ts";

const SECRET = "whsec_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
const NOW = 1_763_600_000;

/** pure idempotency model of the inbox: the first svix-id is stored, every repeat is a duplicate. The real dedupe
 *  (unique svix_id in ops.surense_events) is asserted in supabase/tests/11_surense_connector.test.sql. */
function inbox(): RpcScript {
  const seen = new Map<string, number>();
  return (fn, a) => {
    if (fn !== "surense_event_ingest") return null;
    const id = String(a.p_svix_id);
    if (seen.has(id)) return { id: seen.get(id), duplicate: true };
    seen.set(id, seen.size + 1);
    return { id: seen.size, duplicate: false, job_id: seen.size };
  };
}

function setup(script: RpcScript = inbox(), env: Record<string, string> = { SURENSE_WEBHOOK_SECRET: SECRET }) {
  const rpc = mockRpc(script);
  const lines: string[] = [];
  const h = createWebhookHandler({ env: testEnv(env), rpc, log: silentLog(lines), limiter: createMemoryRateLimiter(), nowSec: () => NOW });
  return { h, rpc, lines };
}

async function delivery(body: string, id = "msg_test0001", ts = NOW, secret = SECRET, extra: Record<string, string> = {}) {
  const sig = await svixSignature(secret, id, String(ts), body);
  return new Request("https://x/functions/v1/surense-webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "svix-id": id, "svix-timestamp": String(ts), "svix-signature": `v1,${sig}`, ...extra },
    body,
  });
}

const BODY = '{"type":"dataproxy.hei.approved","data":{"customerId":"c0000000-0000-4000-8000-000000000001","firstName":"Zzname"}}';

Deno.test("eventType: a well-formed string type, else unknown", () => {
  assert.equal(eventType({ type: "swiftness.e9100.completed" }), "swiftness.e9100.completed");
  assert.equal(eventType({ type: "Bad Type" }), "unknown");
  assert.equal(eventType([]), "unknown");
  assert.equal(eventType(null), "unknown");
});

Deno.test("signed delivery is stored once; a redelivery is a 200 duplicate (Svix must not retry)", async () => {
  const { h, rpc, lines } = setup();
  const r1 = await h(await delivery(BODY));
  assert.equal(r1.status, 200);
  assert.deepEqual(await r1.json(), { ok: true });
  const r2 = await h(await delivery(BODY));
  assert.equal(r2.status, 200);
  assert.equal(rpc.calls.length, 2);
  const a = rpc.calls[0].args;
  assert.equal(a.p_svix_id, "msg_test0001");
  assert.equal(a.p_type, "dataproxy.hei.approved");
  assert.equal(a.p_ts, new Date(NOW * 1000).toISOString());
  assert.equal(a.p_payload, BODY, "the raw body is stored as received (encrypted in SQL)");
  assert.ok(lines.some((l) => JSON.parse(l).duplicate === true));
  assert.ok(!lines.join("\n").includes("Zzname"), "the body never reaches a log line");
});

Deno.test("unsigned, tampered or stale deliveries are 401 and never reach the DB", async () => {
  const { h, rpc } = setup();
  const good = await delivery(BODY);
  const tampered = new Request(good.url, { method: "POST", headers: good.headers, body: BODY.replace("Zzname", "Zzother") });
  assert.equal((await h(tampered)).status, 401);
  assert.equal((await h(new Request(good.url, { method: "POST", body: BODY }))).status, 401);
  assert.equal((await h(await delivery(BODY, "msg_old", NOW - 400))).status, 401);
  const other = "whsec_" + btoa("another-random-secret-value");
  assert.equal((await h(await delivery(BODY, "msg_x", NOW, other))).status, 401);
  assert.equal(rpc.calls.length, 0);
});

Deno.test("fail closed: no secret or no DB -> 503; switch off (PT423) -> 503 disabled; GET -> 405", async () => {
  const noSecret = setup(inbox(), {});
  assert.equal((await noSecret.h(await delivery(BODY))).status, 503);
  const h = createWebhookHandler({ env: testEnv({ SURENSE_WEBHOOK_SECRET: SECRET }), rpc: null, log: silentLog(), limiter: createMemoryRateLimiter(), nowSec: () => NOW });
  assert.equal((await h(await delivery(BODY))).status, 503);
  const off = setup(() => {
    throw rpcError(423, "PT423", "feature_disabled:surense_webhook_enabled");
  });
  const r = await off.h(await delivery(BODY));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error.message, "disabled");
  assert.equal((await off.h(new Request("https://x", { method: "GET" }))).status, 405);
});

Deno.test("limits: body over 256 KB -> 413; DB rate limit -> 429; bad JSON -> 400", async () => {
  const { h, rpc } = setup();
  const big = JSON.stringify({ type: "x.y", pad: "a".repeat(MAX_BODY_BYTES) });
  assert.equal((await h(await delivery(big))).status, 413);
  assert.equal((await h(await delivery("{not json", "msg_bad"))).status, 400);
  assert.equal(rpc.calls.length, 0);
  const limited = setup(() => {
    throw rpcError(429, "PT429", "rate_limited");
  });
  const r = await limited.h(await delivery(BODY));
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("retry-after"), "60");
});

Deno.test("an unknown or missing type is stored as 'unknown' (payload schema not published yet)", async () => {
  const { h, rpc } = setup();
  assert.equal((await h(await delivery('{"data":{}}', "msg_untyped"))).status, 200);
  assert.equal(rpc.calls[0].args.p_type, "unknown");
});

Deno.test("a chunked body without content-length is cut at 256 KB while streaming", async () => {
  const { h, rpc } = setup();
  let pulled = 0;
  const chunk = new Uint8Array(64 * 1024).fill(97);
  const stream = new ReadableStream<Uint8Array>({
    pull(c) {
      pulled++;
      if (pulled > 50) c.close();
      else c.enqueue(chunk);
    },
  });
  const req = new Request("https://x/functions/v1/surense-webhook", { method: "POST", headers: { "svix-id": "msg_big" }, body: stream });
  assert.equal(req.headers.get("content-length"), null);
  assert.equal((await h(req)).status, 413);
  assert.ok(pulled <= 8, "stopped early");
  assert.equal(rpc.calls.length, 0);
});

Deno.test("switch off (PT423) -> 503 with retry-after: 300, nothing stored", async () => {
  const off = setup(() => {
    throw rpcError(423, "PT423", "feature_disabled:surense_webhook_enabled");
  });
  const r = await off.h(await delivery(BODY));
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("retry-after"), String(DISABLED_RETRY_AFTER_SEC));
  assert.equal(r.headers.get("retry-after"), "300");
  // the other 503 paths (no secret, no DB) are configuration problems on our side: no retry hint
  const noSecret = setup(inbox(), {});
  assert.equal((await noSecret.h(await delivery(BODY))).headers.get("retry-after"), null);
});

const NEXT = "whsec_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));

Deno.test("rotation: a delivery signed with either slot verifies; the log names the slot, never the value", async () => {
  const both = setup(inbox(), { SURENSE_WEBHOOK_SECRET: SECRET, SURENSE_WEBHOOK_SECRET_NEXT: NEXT });
  assert.equal((await both.h(await delivery(BODY, "msg_cur0001"))).status, 200);
  assert.equal((await both.h(await delivery(BODY, "msg_next001", NOW, NEXT))).status, 200);
  const slots = both.lines.map((l) => JSON.parse(l)).filter((j) => j.msg === "surense event stored").map((j) => j.slot);
  assert.deepEqual(slots, ["SURENSE_WEBHOOK_SECRET", "SURENSE_WEBHOOK_SECRET_NEXT"]);
  const all = both.lines.join("\n");
  for (const s of [SECRET, NEXT, SECRET.slice(6), NEXT.slice(6)]) assert.ok(!all.includes(s), "no secret value in the log");

  // a signature from neither slot is 401; nothing reaches the DB
  const other = "whsec_" + btoa("another-random-secret-value");
  const calls = both.rpc.calls.length;
  assert.equal((await both.h(await delivery(BODY, "msg_other01", NOW, other))).status, 401);
  assert.equal(both.rpc.calls.length, calls);
});

Deno.test("rotation: only _NEXT set still works; current slot malformed + valid _NEXT is accepted and logged by name", async () => {
  const onlyNext = setup(inbox(), { SURENSE_WEBHOOK_SECRET_NEXT: NEXT });
  assert.equal((await onlyNext.h(await delivery(BODY, "msg_only001", NOW, NEXT))).status, 200);
  assert.equal((await onlyNext.h(await delivery(BODY, "msg_only002"))).status, 401, "the unset current slot verifies nothing");

  const broken = setup(inbox(), { SURENSE_WEBHOOK_SECRET: "plain-not-svix", SURENSE_WEBHOOK_SECRET_NEXT: NEXT });
  assert.equal((await broken.h(await delivery(BODY, "msg_brk0001", NOW, NEXT))).status, 200);
  const warn = broken.lines.map((l) => JSON.parse(l)).find((j) => j.msg === "surense webhook secret slot malformed");
  assert.deepEqual(warn?.badSlots, ["SURENSE_WEBHOOK_SECRET"]);
  assert.ok(!broken.lines.join("\n").includes("plain-not-svix"));

  // both slots malformed: our misconfiguration -> 503, not 401
  const bad = setup(inbox(), { SURENSE_WEBHOOK_SECRET: "plain-a", SURENSE_WEBHOOK_SECRET_NEXT: "plain-b" });
  assert.equal((await bad.h(await delivery(BODY))).status, 503);
  assert.equal(bad.rpc.calls.length, 0);
});

Deno.test("verifyAnySlot: header/timestamp problems stop at the first slot; env exposes NEXT as a boolean only", async () => {
  const h = new Headers({ "svix-id": "msg_x", "svix-timestamp": String(NOW - 999), "svix-signature": "v1,AAAA" });
  const r = await verifyAnySlot(h, BODY, [{ slot: "SURENSE_WEBHOOK_SECRET", secret: SECRET }, { slot: "SURENSE_WEBHOOK_SECRET_NEXT", secret: NEXT }], NOW);
  assert.deepEqual(r, { ok: false, reason: "timestamp", badSlots: [] });
  const e = testEnv({ SURENSE_WEBHOOK_SECRET_NEXT: NEXT });
  assert.equal(isWebhookConfigured(e), true);
  assert.deepEqual(webhookSecrets(e).map((s) => s.slot), ["SURENSE_WEBHOOK_SECRET_NEXT"]);
  assert.equal(envPresence(e).SURENSE_WEBHOOK_SECRET_NEXT, true);
  assert.equal(envPresence(testEnv({})).SURENSE_WEBHOOK_SECRET_NEXT, false);
  // the same value in both slots is verified once
  assert.equal(webhookSecrets(testEnv({ SURENSE_WEBHOOK_SECRET: SECRET, SURENSE_WEBHOOK_SECRET_NEXT: SECRET })).length, 1);
});
