// deno test supabase/functions/_shared/surense/  (synthetic data only; no network: every fetch is a mock)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, silentLog, testEnv } from "../test_helpers.ts";
import { createTokenSource, TOKEN_URL } from "./auth.ts";
import { ALLOWED_HOSTS, apiUrl, assertAllowedUrl, createSurenseClient, pathLabel, SURENSE_API } from "./client.ts";
import { SurenseError } from "./errors.ts";
import { surenseApi } from "./api.ts";
import { verifyWebhook } from "./svix.ts";
import { CUSTOMER_INDEX_KEYS, DOCUMENT_INDEX_KEYS, mapCustomer, mapDocument, mapProduct, PRODUCT_INDEX_KEYS, TRANSPORT_KEYS } from "./mirror.ts";
import { eventRefs, planEvent, pullCustomers, pullDocuments, e9100Download } from "./sync.ts";
import { failureOutcome, runJob, type JobRow } from "./jobs.ts";
import { InputError } from "./errors.ts";
import { RpcError } from "../db.ts";
import { buildSyncDeps } from "./connector.ts";
import { isConfigured, isWebhookConfigured, surensePresence } from "./env.ts";
import { objectPath, sha256Hex } from "./storage.ts";

const CID = "c0000000-0000-4000-8000-000000000001";
const EVT = "e0000000-0000-4000-8000-000000000002";
const noSleep = () => Promise.resolve();
const tokenOk = (ttl = 3600) => json({ access_token: "tok_test_aaaaaaaaaaaa", token_type: "Bearer", expires_in: ttl, scope: "customers:read" });

function tokens(fetchFn = mockFetch(() => tokenOk()).fetch) {
  return createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: fetchFn });
}

// ---------------------------------------------------------------- env
Deno.test("env: configured only with both halves; presence is booleans", () => {
  assert.equal(isConfigured(testEnv()), false);
  const e = testEnv({ SURENSE_CLIENT_ID: "cid_test", SURENSE_CLIENT_SECRET: "test-secret", SURENSE_WEBHOOK_SECRET: "whsec_" + btoa("synthetic-test-value") });
  assert.equal(isConfigured(e), true);
  assert.equal(isWebhookConfigured(e), true);
  assert.deepEqual(surensePresence(e), { SURENSE_CLIENT_ID: true, SURENSE_CLIENT_SECRET: true, SURENSE_WEBHOOK_SECRET: true });
  assert.equal(isWebhookConfigured(testEnv({ SURENSE_WEBHOOK_SECRET: "plain" })), false);
});

// ---------------------------------------------------------------- auth
Deno.test("auth: form-encoded client_credentials, cached until 60 s before expiry", async () => {
  let t = 1_000_000;
  const f = mockFetch(() => tokenOk(3600));
  const ts = createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch, now: () => t });
  assert.equal(await ts.get(), "tok_test_aaaaaaaaaaaa");
  assert.equal(f.calls[0].url, TOKEN_URL);
  assert.equal((f.calls[0].init?.headers as Record<string, string>)["content-type"], "application/x-www-form-urlencoded");
  const form = new URLSearchParams(f.calls[0].body);
  assert.equal(form.get("grant_type"), "client_credentials");
  assert.equal(form.get("client_id"), "cid_test");
  assert.equal(form.get("client_secret"), "test-secret");
  t += 3539_000;
  await ts.get();
  assert.equal(f.calls.length, 1, "still cached at 3539 s");
  t += 2_000;
  await ts.get();
  assert.equal(f.calls.length, 2, "refreshed inside the 60 s margin");
  ts.invalidate();
  await ts.get();
  assert.equal(f.calls.length, 3, "invalidate drops the token");
});

Deno.test("auth: single flight; concurrent callers share one refresh", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  const f = mockFetch(async () => {
    await gate;
    return tokenOk();
  });
  const ts = tokens(f.fetch);
  const all = Promise.all([ts.get(), ts.get(), ts.get()]);
  release();
  assert.deepEqual(await all, ["tok_test_aaaaaaaaaaaa", "tok_test_aaaaaaaaaaaa", "tok_test_aaaaaaaaaaaa"]);
  assert.equal(f.calls.length, 1);
});

Deno.test("auth: a token-endpoint 5xx is an outage, 403 stays permanent, never relabelled auth", async () => {
  const e500 = tokens(mockFetch(() => json({ statusCode: 500 }, 500)).fetch);
  await assert.rejects(e500.get(), (e) => e instanceof SurenseError && e.kind === "unavailable" && e.status === 500);
  const e403 = tokens(mockFetch(() => json({ statusCode: 403 }, 403)).fetch);
  await assert.rejects(e403.get(), (e) => e instanceof SurenseError && e.kind === "permanent" && e.status === 403);
});

Deno.test("redirects are never followed: token call, request() and putUpload refuse a 3xx and make no second fetch", async () => {
  const away = () => new Response(null, { status: 307, headers: { location: "https://evil.example/steal" } });
  const ft = mockFetch(away);
  await assert.rejects(tokens(ft.fetch).get(), (e) => e instanceof SurenseError && e.code === "redirect_refused" && e.status === 307);
  assert.equal(ft.calls.length, 1);
  assert.equal(ft.calls[0].init?.redirect, "manual");

  const fr = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : away()));
  const c = createSurenseClient({ tokens: tokens(fr.fetch), log: silentLog(), fetch: fr.fetch, sleep: noSleep });
  await assert.rejects(c.request("/user/info"), (e) => e instanceof SurenseError && e.code === "redirect_refused");
  await assert.rejects(c.request("/customers", { method: "POST", body: { firstName: "zz" } }), (e) => e instanceof SurenseError && e.code === "redirect_refused");
  const api = fr.calls.filter((x) => x.url !== TOKEN_URL);
  assert.equal(api.length, 2, "one fetch per call, no retry and no follow");
  assert.ok(api.every((x) => x.init?.redirect === "manual"));
  assert.ok(!fr.calls.some((x) => x.url.includes("evil.example")));

  const fu = mockFetch(away);
  const cu = createSurenseClient({ tokens: tokens(mockFetch(() => tokenOk()).fetch), log: silentLog(), fetch: fu.fetch, sleep: noSleep });
  await assert.rejects(cu.putUpload("https://api.surense.com/upload/1", new Uint8Array(1), "application/pdf"),
    (e) => e instanceof SurenseError && e.code === "redirect_refused");
  assert.equal(fu.calls.length, 1);
});

Deno.test("auth: bad credentials -> auth error; missing expires_in uses the default ttl", async () => {
  const bad = tokens(mockFetch(() => json({ statusCode: 401, errors: [{ code: 40100, message: "x" }] }, 401)).fetch);
  await assert.rejects(bad.get(), (e) => e instanceof SurenseError && e.kind === "auth" && e.code === "40100");
  const f = mockFetch(() => json({ access_token: "tok_test_bbbbbbbbbbbb" }));
  const ts = tokens(f.fetch);
  await ts.get();
  await ts.get();
  assert.equal(f.calls.length, 1);
});

// ---------------------------------------------------------------- client
Deno.test("client: host allowlist and path validation", () => {
  assert.equal(apiUrl("/customers/search"), `${SURENSE_API}/customers/search`);
  assert.equal(apiUrl("/licensees", { id: CID }), `${SURENSE_API}/licensees?id=${CID}`);
  for (const p of ["customers", "/../oauth/token", "//evil.example/x", "/a?b=c", "/a#b", "/x\\y", "https://evil.example/"]) {
    assert.throws(() => apiUrl(p), (e) => e instanceof SurenseError && e.kind === "config", p);
  }
  assert.equal(assertAllowedUrl("https://api.surense.com/files/1").hostname, "api.surense.com");
  for (const u of ["http://api.surense.com/x", "https://evil.example/x", "https://api.surense.com.evil.example/x", "https://u:p@api.surense.com/x",
    "https://api.surense.com:8443/x", "not a url"]) {
    assert.throws(() => assertAllowedUrl(u), (e) => e instanceof SurenseError && e.kind === "config", u);
  }
  assert.equal(pathLabel(`/customers/${CID}/portfolio`), "/customers/{id}/portfolio");
});

Deno.test("client: retries a read on 503 with backoff, then succeeds", async () => {
  const waits: number[] = [];
  let n = 0;
  const f = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : ++n < 3 ? json({ statusCode: 503 }, 503) : json([{ id: CID }])));
  const c = createSurenseClient({ tokens: tokens(f.fetch), log: silentLog(), fetch: f.fetch, sleep: (ms) => (waits.push(ms), Promise.resolve()) });
  const r = await c.request<Array<{ id: string }>>("/licensees");
  assert.equal(r[0].id, CID);
  assert.equal(n, 3);
  assert.deepEqual(waits, [500, 2000]);
});

Deno.test("client: a write is not retried on 503 but is retried on 429 (retry-after)", async () => {
  const f1 = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : json({ statusCode: 503 }, 503)));
  const c1 = createSurenseClient({ tokens: tokens(f1.fetch), log: silentLog(), fetch: f1.fetch, sleep: noSleep });
  await assert.rejects(c1.request("/customers", { method: "POST", body: {} }), (e) => e instanceof SurenseError && e.status === 503);
  assert.equal(f1.calls.filter((c) => c.url !== TOKEN_URL).length, 1);

  const waits: number[] = [];
  let n = 0;
  const f2 = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : ++n === 1 ? json({}, 429, { "retry-after": "3" }) : json({ id: CID })));
  const c2 = createSurenseClient({ tokens: tokens(f2.fetch), log: silentLog(), fetch: f2.fetch, sleep: (ms) => (waits.push(ms), Promise.resolve()) });
  assert.equal((await c2.request<{ id: string }>("/customers", { method: "POST", body: {} })).id, CID);
  assert.deepEqual(waits, [3000]);
});

Deno.test("client: timeout per attempt, retried for reads, surfaced as unavailable", async () => {
  const f = mockFetch((url, _b, init) =>
    url === TOKEN_URL ? tokenOk() : new Promise<Response>((_, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("aborted")))));
  const c = createSurenseClient({ tokens: tokens(f.fetch), log: silentLog(), fetch: f.fetch, sleep: noSleep, timeoutMs: 10 });
  await assert.rejects(c.request("/user/info"), (e) => e instanceof SurenseError && e.code === "timeout" && e.kind === "unavailable");
  assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 3);
});

Deno.test("client: 401 drops the token and retries once with a fresh one", async () => {
  let tok = 0, api = 0;
  const f = mockFetch((url) => {
    if (url === TOKEN_URL) return json({ access_token: `tok_test_${++tok}_aaaaaaaa`, expires_in: 3600 });
    return ++api === 1 ? json({ statusCode: 401 }, 401) : json({ userId: CID });
  });
  const c = createSurenseClient({ tokens: tokens(f.fetch), log: silentLog(), fetch: f.fetch, sleep: noSleep });
  assert.equal((await c.request<{ userId: string }>("/user/info")).userId, CID);
  assert.equal(tok, 2);
  const auths = f.calls.filter((x) => x.url !== TOKEN_URL).map((x) => (x.init?.headers as Record<string, string>).authorization);
  assert.deepEqual(auths, ["Bearer tok_test_1_aaaaaaaa", "Bearer tok_test_2_aaaaaaaa"]);
});

Deno.test("client: error body -> SurenseError(status, numeric code); server text and values never surface or log", async () => {
  const lines: string[] = [];
  const f = mockFetch((url) =>
    url === TOKEN_URL ? tokenOk() : json({ statusCode: 400, errors: [{ code: 40204, message: "conflict with zz-marker 0501234567" }] }, 400));
  const c = createSurenseClient({ tokens: tokens(f.fetch), log: silentLog(lines), fetch: f.fetch, sleep: noSleep });
  const err = await c.request("/customers/lead_customer", { method: "POST", body: { firstName: "zz-body-marker" }, query: { q: "zz-query-marker" } })
    .catch((e) => e);
  assert.ok(err instanceof SurenseError);
  assert.equal(err.status, 400);
  assert.equal(err.code, "40204");
  assert.equal(err.kind, "permanent");
  assert.ok(!err.message.includes("zz-marker"));
  const all = lines.join("\n");
  assert.ok(!all.includes("zz-") && !all.includes("tok_test"), "no body, query value or token in logs");
  assert.ok(lines.some((l) => JSON.parse(l).path === "/customers/lead_customer" && JSON.parse(l).status === 400));
});

Deno.test("client: writes leave a pending audit entry before the request and a result after (op, ref, status, phase), reads none", async () => {
  const audits: unknown[] = [];
  const f = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : json({ url: "https://example.test/p/x" })));
  const c = createSurenseClient({ tokens: tokens(f.fetch), log: silentLog(), fetch: f.fetch, sleep: noSleep, audit: (...a) => (audits.push(a), Promise.resolve()) });
  const api = surenseApi(c);
  await api.proxies.invite({ customerId: CID, nispahHei: true });
  await api.licensees.list();
  assert.deepEqual(audits, [["proxies.invite", CID, null, "pending"], ["proxies.invite", CID, 200, "result"]]);
});

Deno.test("client: a write that times out is not retried, is flagged ambiguous and audited as such", async () => {
  const audits: unknown[] = [];
  const f = mockFetch((url, _b, init) =>
    url === TOKEN_URL ? tokenOk() : new Promise<Response>((_, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("aborted")))));
  const c = createSurenseClient({ tokens: tokens(f.fetch), log: silentLog(), fetch: f.fetch, sleep: noSleep, timeoutMs: 10,
    audit: (...a) => (audits.push(a), Promise.resolve()) });
  await assert.rejects(surenseApi(c).proxies.invite({ customerId: CID, nispahHei: true }),
    (e) => e instanceof SurenseError && e.code === "timeout" && e.ambiguous);
  assert.equal(f.calls.filter((x) => x.url !== TOKEN_URL).length, 1);
  assert.deepEqual(audits, [["proxies.invite", CID, null, "pending"], ["proxies.invite", CID, 0, "ambiguous"]]);
  // a read timing out is never ambiguous
  await assert.rejects(c.request("/user/info"), (e) => e instanceof SurenseError && e.code === "timeout" && !e.ambiguous);
});

Deno.test("client: maxAttempts 1 makes one call and passes retry-after (503 too) on the error; a long retry-after is never slept", async () => {
  const f1 = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : json({ statusCode: 503 }, 503, { "retry-after": "90" })));
  const c1 = createSurenseClient({ tokens: tokens(f1.fetch), log: silentLog(), fetch: f1.fetch, sleep: noSleep, maxAttempts: 1 });
  await assert.rejects(c1.request("/licensees"), (e) => e instanceof SurenseError && e.retryable && e.kind === "unavailable" && e.retryAfterSec === 90);
  assert.equal(f1.calls.filter((x) => x.url !== TOKEN_URL).length, 1);

  const waits: number[] = [];
  const f2 = mockFetch((url) => (url === TOKEN_URL ? tokenOk() : json({}, 429, { "retry-after": "30" })));
  const c2 = createSurenseClient({ tokens: tokens(f2.fetch), log: silentLog(), fetch: f2.fetch, sleep: (ms) => (waits.push(ms), Promise.resolve()) });
  await assert.rejects(c2.request("/licensees"), (e) => e instanceof SurenseError && e.kind === "rate_limited" && e.retryAfterSec === 30);
  assert.equal(f2.calls.filter((x) => x.url !== TOKEN_URL).length, 1, "30 s is over MAX_INLINE_WAIT_MS: handed back, not slept");
  assert.deepEqual(waits, []);
});

Deno.test("client: downloads and uploads are host-locked", async () => {
  const f = mockFetch(() => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "application/pdf" } }));
  const c = createSurenseClient({ tokens: tokens(mockFetch(() => tokenOk()).fetch), log: silentLog(), fetch: f.fetch, sleep: noSleep });
  await assert.rejects(c.downloadFile("https://bucket.s3.example.test/f.pdf"), (e) => e instanceof SurenseError && e.code === "host_not_allowed");
  await assert.rejects(c.putUpload("https://bucket.s3.example.test/u", new Uint8Array(1), "application/pdf"), (e) => e instanceof SurenseError);
  assert.equal(f.calls.length, 0, "nothing left the process");
  const ok = await c.downloadFile("https://api.surense.com/files/1");
  assert.equal(ok.bytes.byteLength, 3);
  assert.equal(ok.mime, "application/pdf");
});

Deno.test("client: the approved S3 docs host is downloadable without Authorization; uploads there and redirects are refused", async () => {
  const S3 = "https://surense-accounts-docs.s3.eu-west-1.amazonaws.com/0f0f0f0f?X-Amz-Signature=x";
  assert.ok(ALLOWED_HOSTS.includes("surense-accounts-docs.s3.eu-west-1.amazonaws.com"));
  const seen: (Headers | undefined)[] = [];
  const f = mockFetch((_url, _b, init) => {
    seen.push(new Headers(init?.headers));
    return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "application/pdf" } });
  });
  const c = createSurenseClient({ tokens: tokens(mockFetch(() => tokenOk()).fetch), log: silentLog(), fetch: f.fetch, sleep: noSleep });
  assert.equal((await c.downloadFile(S3)).bytes.byteLength, 3);
  assert.equal(seen[0]?.get("authorization"), null, "no bearer token to the S3 host");
  await c.downloadFile("https://api.surense.com/files/1");
  assert.ok(seen[1]?.get("authorization")?.startsWith("Bearer "), "the bearer still goes to api.surense.com");
  await assert.rejects(c.putUpload(S3, new Uint8Array(1), "application/pdf"), (e) => e instanceof SurenseError && e.code === "host_not_allowed");
  const r = mockFetch(() => new Response(null, { status: 302, headers: { location: "https://evil.example.test/x" } }));
  const c2 = createSurenseClient({ tokens: tokens(mockFetch(() => tokenOk()).fetch), log: silentLog(), fetch: r.fetch, sleep: noSleep });
  await assert.rejects(c2.downloadFile(S3), (e) => e instanceof SurenseError && e.code === "redirect_refused");
  assert.equal(r.calls.length, 1, "the redirect target is never requested");
});

// ---------------------------------------------------------------- svix
const enc = new TextEncoder();
function randomSecret(): string {
  return "whsec_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
}
/** independent reference implementation (WebCrypto) of the Svix v1 signature */
async function sign(secret: string, id: string, ts: number, body: string): Promise<string> {
  const raw = Uint8Array.from(atob(secret.slice(6)), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${body}`)));
  return btoa(String.fromCharCode(...mac));
}
const svixHeaders = (id: string, ts: number, sig: string) => new Headers({ "svix-id": id, "svix-timestamp": String(ts), "svix-signature": sig });

Deno.test("svix: valid signature passes, including one of several (rotation)", async () => {
  const secret = randomSecret();
  const now = 1_763_600_000;
  const body = '{"type":"customer.created","data":{"id":"x"}}';
  const sig = await sign(secret, "msg_test1", now, body);
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test1", now, `v1,${sig}`), body, secret, now), { ok: true, id: "msg_test1", ts: now });
  const other = await sign(randomSecret(), "msg_test1", now, body);
  assert.equal((await verifyWebhook(svixHeaders("msg_test1", now, `v1,${other} v1,${sig}`), body, secret, now)).ok, true);
});

// Surense's Svix app sends the Standard Webhooks names (webhook-id / webhook-timestamp / webhook-signature), not svix-*
// (seen live on the first test delivery, 2026-11-21). Both families verify identically; svix-* wins when both exist.
Deno.test("svix: Standard Webhooks header names (webhook-*) verify like svix-*", async () => {
  const secret = randomSecret();
  const now = 1_763_600_000;
  const body = '{"type":"customer.created","data":{"id":"x"}}';
  const sig = await sign(secret, "msg_std1", now, body);
  const std = new Headers({ "webhook-id": "msg_std1", "webhook-timestamp": String(now), "webhook-signature": `v1,${sig}`, "webhook-test": "true" });
  assert.deepEqual(await verifyWebhook(std, body, secret, now), { ok: true, id: "msg_std1", ts: now });
  const bad = new Headers({ "webhook-id": "msg_std1", "webhook-timestamp": String(now), "webhook-signature": `v1,${await sign(randomSecret(), "msg_std1", now, body)}` });
  assert.deepEqual(await verifyWebhook(bad, body, secret, now), { ok: false, reason: "signature" });
  const onlyId = new Headers({ "webhook-id": "msg_std1" });
  assert.deepEqual(await verifyWebhook(onlyId, body, secret, now), { ok: false, reason: "headers" });
});

// replay of the same svix-id is deduped by the DB (unique svix_id): asserted in supabase/tests/11_surense_connector.test.sql
Deno.test("svix: tampered body, id/signature mismatch, wrong secret and wrong version fail", async () => {
  const secret = randomSecret();
  const now = 1_763_600_000;
  const body = '{"type":"lead.created"}';
  const sig = await sign(secret, "msg_test2", now, body);
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test2", now, `v1,${sig}`), body + " ", secret, now), { ok: false, reason: "signature" });
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test3", now, `v1,${sig}`), body, secret, now), { ok: false, reason: "signature" });
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test2", now, `v1,${sig}`), body, randomSecret(), now), { ok: false, reason: "signature" });
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test2", now, `v2,${sig}`), body, secret, now), { ok: false, reason: "signature" });
  assert.deepEqual(await verifyWebhook(svixHeaders("bad id!", now, `v1,${sig}`), body, secret, now), { ok: false, reason: "headers" });
  assert.deepEqual(await verifyWebhook(new Headers(), body, secret, now), { ok: false, reason: "headers" });
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test2", now, `v1,${sig}`), body, null, now), { ok: false, reason: "secret" });
  assert.deepEqual(await verifyWebhook(svixHeaders("msg_test2", now, `v1,${sig}`), body, "whsec_!!!not-base64!!!", now), { ok: false, reason: "secret" });
});

Deno.test("svix: timestamp skew over 5 minutes is refused both ways", async () => {
  const secret = randomSecret();
  const now = 1_763_600_000;
  for (const ts of [now - 301, now + 301]) {
    const sig = await sign(secret, "msg_test4", ts, "{}");
    assert.deepEqual(await verifyWebhook(svixHeaders("msg_test4", ts, `v1,${sig}`), "{}", secret, now), { ok: false, reason: "timestamp" });
  }
  const ts = now - 299;
  assert.equal((await verifyWebhook(svixHeaders("msg_test4", ts, `v1,${await sign(secret, "msg_test4", ts, "{}")}`), "{}", secret, now)).ok, true);
});

// ---------------------------------------------------------------- mirror
const PII = { firstName: "Zzfirst", lastName: "Zzlast", fullName: "Zzfirst Zzlast", idNumber: "012345678", cellNumber: "+972500000000",
  email: "zz@example.test", street: "Zzstreet", city: "Zzcity", bankAccountNumber: "999999", notes: "zz free text" };
const PII_VALUES = Object.values(PII);
function noPiiIn(row: Record<string, unknown>, indexKeys: readonly string[]) {
  const keys = Object.keys(row);
  for (const k of keys) assert.ok(indexKeys.includes(k) || (TRANSPORT_KEYS as readonly string[]).includes(k), `unexpected key ${k}`);
  const index = JSON.stringify(Object.fromEntries(keys.filter((k) => indexKeys.includes(k)).map((k) => [k, row[k]])));
  for (const v of PII_VALUES) assert.ok(!index.includes(v), `PII value in an indexable column: ${v}`);
}

Deno.test("mirror: customer row keys are the index columns + transport; no PII in index columns", () => {
  const row = mapCustomer({
    id: CID, agencyId: EVT, managerId: CID, managers: [CID, "nope"], statusId: CID, statusName: "פעיל", statusActive: true, sourceName: "API",
    idType: { code: 1, description: "ת.ז" }, idNumberLocked: true, cellNumberVerified: false, createdDate: "2026-11-01T10:00:00Z",
    lastModifiedDate: "2026-11-20T10:00:00.123Z", version: 7, swiftnessProxySignDate: "2026-11-02", cellNumberFormatted: "050-000", cellNumberUri: "tel:x",
    ...PII,
  });
  noPiiIn(row, CUSTOMER_INDEX_KEYS);
  assert.equal(row.national_id, "012345678", "national id travels once, for the SQL HMAC");
  assert.deepEqual(row.manager_ids, [CID]);
  assert.equal(row.swiftness_proxy_signed_on, "2026-11-02");
  assert.equal((row.details as Record<string, unknown>).firstName, "Zzfirst", "personal data goes to details (encrypted in SQL)");
  assert.equal((row.details as Record<string, unknown>).cellNumberUri, undefined, "display duplicates dropped");
  assert.equal(mapCustomer({ id: CID, idType: { code: 2 }, idNumber: "AB123" }).national_id, null, "passport: no national id hmac");
  assert.throws(() => mapCustomer({ id: "not-a-uuid" }));
});

Deno.test("mirror: document and product rows keep names, notes and policy numbers out of index columns", () => {
  const doc = mapDocument({ id: CID, customerId: CID, typeId: EVT, name: "Zzfirst ID 012345678.pdf", mime: "application/pdf", fileExtension: "PDF",
    size: 1234, source: "system", notes: PII.notes, linkedProducts: [{ accountPolicyNumber: "999999" }] });
  noPiiIn(doc, DOCUMENT_INDEX_KEYS);
  assert.equal(doc.file_extension, "pdf");
  const prod = mapProduct({ id: EVT, source: "מסלקה_פנסיונית", companyId: 12, type: 1, accountPolicyNumber: "999999", hidden: false }, CID);
  noPiiIn(prod, PRODUCT_INDEX_KEYS);
  assert.equal(prod.customer_surense_id, CID);
  assert.equal((prod.details as Record<string, unknown>).accountPolicyNumber, "999999");
});

// ---------------------------------------------------------------- event routing
Deno.test("events: refs and plans by type (payload schema unknown: ids only)", () => {
  assert.deepEqual(eventRefs({ type: "x", data: { customerId: CID.toUpperCase(), name: "Zz" } }).customerId, CID);
  assert.deepEqual(planEvent("dataproxy.hei.approved", { data: { customerId: CID } }), { action: "pull_documents", customerId: CID, poaKind: "harbit" });
  assert.deepEqual(planEvent("swiftness.e9100.completed", { data: { customerId: CID, eventId: EVT } }), { action: "e9100_download", customerId: CID, eventId: EVT });
  assert.deepEqual(planEvent("swiftness.e9100.completed", { data: { customerId: CID, id: EVT } }).action, "e9100_download", "id doubles as event id");
  assert.deepEqual(planEvent("swiftness.e9100.completed", { data: { customerId: CID } }), { action: "skip", reason: "no_e9100_ref" });
  assert.deepEqual(planEvent("customer.updated", { data: { id: CID } }), { action: "pull_customer", customerId: CID });
  assert.deepEqual(planEvent("customer.deleted", { id: CID }), { action: "mark_customer_deleted", customerId: CID });
  assert.deepEqual(planEvent("document.deleted", { data: { id: EVT } }), { action: "mark_document_deleted", documentId: EVT });
  assert.deepEqual(planEvent("lead.created", { data: { id: EVT } }), { action: "skip", reason: "no_lead_mirror" });
  assert.deepEqual(planEvent("meeting.created", {}), { action: "skip", reason: "no_handler" });
  assert.deepEqual(planEvent("dataproxy.aleph.approved", { data: {} }), { action: "skip", reason: "no_customer_ref" });
});

Deno.test("jobs: failure mapping keeps codes only", () => {
  assert.deepEqual(failureOutcome(new SurenseError(503, "http_503", "unavailable", 120)),
    { result: "failed", code: "surense_http_503", kind: "unavailable", retryAfterSec: 120 });
  assert.deepEqual(failureOutcome(new SurenseError(400, "40000", "permanent")), { result: "skipped", code: "surense_400_40000", kind: "permanent" });
  assert.deepEqual(failureOutcome(new SurenseError(401, "40100", "auth")), { result: "failed", code: "surense_40100", kind: "auth", retryAfterSec: null });
  assert.deepEqual(failureOutcome(new RpcError(503, "55000", "vault_secret_missing:pii_enc_key")), { result: "failed", code: "db_55000", kind: "db" });
  assert.deepEqual(failureOutcome(new Error("Zz secret text")), { result: "failed", code: "internal", kind: "internal" });
  assert.deepEqual(failureOutcome(new InputError("bad_id")), { result: "skipped", code: "bad_input", kind: "input" });
  assert.deepEqual(failureOutcome(new TypeError("x is not iterable")), { result: "failed", code: "internal", kind: "internal" },
    "a runtime bug retries and dead-letters");
});

// ---------------------------------------------------------------- sync (mock Surense + mock RPC)
function syncSetup(route: (url: string, body: string) => Response | Promise<Response>, rpcScript = (_fn: string, _a: Record<string, unknown>): unknown => null) {
  const f = mockFetch((url, body) => (url === TOKEN_URL ? tokenOk() : route(url, body)));
  const rpc = mockRpc(rpcScript);
  const env = testEnv({ SURENSE_CLIENT_ID: "cid_test", SURENSE_CLIENT_SECRET: "test-secret" });
  const d = buildSyncDeps({ env, rpc, log: silentLog(), tokens: tokens(f.fetch), fetch: f.fetch, sleep: noSleep, minIntervalMs: 0 });
  return { d, f, rpc };
}

Deno.test("sync: pullCustomers pages by cursor, upserts mapped rows and saves the cursor after each page", async () => {
  const pages: Record<string, unknown> = {
    "": { results: [{ id: CID, ...PII }], hasNextPage: true, nextCursor: "cur_2" },
    cur_2: { results: [{ id: EVT }, { id: "bad" }], hasNextPage: false, nextCursor: null },
  };
  const { d, rpc, f } = syncSetup((_u, body) => json(pages[JSON.parse(body).cursor]), (fn) =>
    fn === "surense_sync_state_get" ? { cursor: null } : fn === "surense_customers_upsert" ? { upserted: 1 } : null);
  const s = await pullCustomers(d, { deadline: Date.now() + 60_000 });
  assert.deepEqual(s, { pages: 2, rows: 2, upserted: 2, bad: 1, done: true });
  const sets = rpc.calls.filter((c) => c.fn === "surense_sync_state_set").map((c) => [c.args.p_cursor, c.args.p_done]);
  assert.deepEqual(sets, [["cur_2", false], [null, true]]);
  const sent = f.calls.filter((c) => c.url.endsWith("/customers/search")).map((c) => JSON.parse(c.body));
  assert.deepEqual(sent, [{ cursor: "", pageSize: 100 }, { cursor: "cur_2", pageSize: 100 }]);
  const firstRow = (rpc.calls.find((c) => c.fn === "surense_customers_upsert")!.args.p_rows as Record<string, unknown>[])[0];
  noPiiIn(firstRow, CUSTOMER_INDEX_KEYS);
});

Deno.test("sync: e9100Download refuses links off the allowlist; allowed ones are stored hash-named", async () => {
  const off = syncSetup(() => json({ files: [{ name: "Zz 012345678.xml", url: "https://bucket.s3.example.test/f.xml" }] }));
  assert.deepEqual(await e9100Download(off.d, { customerId: CID, eventId: EVT }), { files: 1, stored: 0, existing: 0, refusedHost: 1, partial: false });
  assert.equal(off.rpc.calls.length, 0);

  const bytes = new Uint8Array([7, 7, 7]);
  const sha = await sha256Hex(bytes);
  const on = syncSetup((url) => {
    if (url.endsWith("/swiftness/e9100/download")) return json({ files: [{ name: "Zz 012345678.XML", url: "https://api.surense.com/files/abc" }] });
    if (url === "https://api.surense.com/files/abc") return new Response(bytes, { headers: { "content-type": "application/xml" } });
    if (url.includes("/storage/v1/object/client-docs/")) return json({ Key: "x" });
    return json({}, 404);
  });
  assert.deepEqual(await e9100Download(on.d, { customerId: CID, eventId: EVT }), { files: 1, stored: 1, existing: 0, refusedHost: 0, partial: false });
  const path = objectPath(CID, "e9100", EVT, sha, ".xml");
  assert.ok(on.f.calls.some((c) => c.url.endsWith(`/storage/v1/object/client-docs/${path}`)));
  const rec = on.rpc.calls.find((c) => c.fn === "surense_file_record")!;
  assert.equal(rec.args.p_path, path);
  assert.ok(!String(rec.args.p_path).includes("012345678"), "the file name never reaches the object path");
});

Deno.test("sync: e9100Download stops before a file once the deadline passed; the job retries with code deadline", async () => {
  const { d, f } = syncSetup((url) =>
    url.endsWith("/swiftness/e9100/download") ? json({ files: [{ name: "a.xml", url: "https://api.surense.com/files/a" }] }) : json({}, 404));
  const s = await e9100Download(d, { customerId: CID, eventId: EVT, deadline: Date.now() - 1 });
  assert.deepEqual(s, { files: 1, stored: 0, existing: 0, refusedHost: 0, partial: true });
  assert.ok(!f.calls.some((c) => c.url.endsWith("/files/a")), "no download after the deadline");
  const job: JobRow = { id: 1, kind: "surense.e9100_download", params: { customer_id: CID, event_id: EVT }, event_id: null, event_type: null,
    payload: null, attempts: 1 };
  const out = await runJob(d, job, Date.now() - 1);
  assert.deepEqual([out.result, out.code], ["failed", "deadline"]);
});

Deno.test("sync: a document pass cut by the deadline continues in a follow-up job from its offset", async () => {
  let t = 0;
  const { d } = syncSetup(() => json({ results: [{ id: EVT }], hasNextPage: true }), (fn) => (fn === "surense_documents_upsert" ? { upserted: 1 } : null));
  d.now = () => t++; // one tick per deadline check: two pages, then the deadline
  const s = await pullDocuments(d, { customerId: CID, startRow: 200, deadline: 2 });
  assert.deepEqual([s.pages, s.done, s.nextStart], [2, false, 400]);
  await assert.rejects(pullDocuments(d, { customerId: CID, startRow: 150, deadline: 10 }), (e) => e instanceof InputError);

  t = 0;
  const job: JobRow = { id: 2, kind: "surense.pull_documents", params: { customer_id: CID, start_row: 100 }, event_id: null, event_type: null,
    payload: null, attempts: 1 };
  const out = await runJob(d, job, 2);
  assert.equal(out.result, "done");
  assert.deepEqual(out.next, { kind: "surense.pull_documents", params: { start_row: 300, customer_id: CID }, dedupe: "docs:" + CID });
  const bad = await runJob(d, { ...job, params: { customer_id: CID, start_row: 150 } }, 2);
  assert.deepEqual([bad.result, bad.code], ["skipped", "bad_input"]);
});
