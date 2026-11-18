// deno test supabase/functions  (pure logic of the shared modules; no network, no DB)
import assert from "node:assert/strict";
import { loadEnv, parseEmailList, parseStage, pickKey } from "./env.ts";
import { clientIp, isPublicIp } from "./ip.ts";
import { createTagger, hasCronSecret, shortHash, timingSafeEqual } from "./secret.ts";
import { createRpc, RpcError } from "./db.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { sendEmail } from "./resend.ts";
import { json, mockFetch } from "./test_helpers.ts";

Deno.test("env: stage defaults to production, keys and recipients", () => {
  assert.equal(parseStage(undefined), "production");
  assert.equal(parseStage("staging"), "staging");
  assert.equal(pickKey('{"default":"test-secret-a","automations":"test-secret-b"}'), "test-secret-a");
  assert.equal(pickKey("sb_plain"), "sb_plain");
  assert.equal(pickKey("{bad"), null);
  assert.deepEqual(parseEmailList("a@b.co, bad, c@d.co"), ["a@b.co", "c@d.co"]);
  const e = loadEnv(() => undefined);
  assert.equal(e.stage, "production");
  assert.equal(e.secretKey, null);
  assert.deepEqual(e.notifyTo.insurance, ["Moshe@seeld.info"]);
  assert.deepEqual(e.notifyTo.finance, ["Shmulik@seeld.info"]);
  assert.deepEqual(e.notifyTo.general, ["Shmulik@seeld.info"]);
  assert.equal(e.geminiModels[0], "gemini-3.5-flash-lite");
  const f = loadEnv((n) => ({ SUPABASE_SECRET_KEYS: '{"default":"test-secret-x"}', LEAD_NOTIFY_TO: "x@y.co", NOTIFY_TO_FINANCE: "f@y.co" } as Record<string, string>)[n]);
  assert.equal(f.secretKey, "test-secret-x");
  assert.equal(f.secretKeySource, "SUPABASE_SECRET_KEYS");
  assert.deepEqual(f.notifyTo.insurance, ["x@y.co"]);
  assert.deepEqual(f.notifyTo.finance, ["f@y.co"]);
});

Deno.test("ip: cf-connecting-ip, else the last PUBLIC x-forwarded-for hop", () => {
  assert.equal(isPublicIp("10.1.2.3"), false);
  assert.equal(isPublicIp("100.64.0.1"), false);
  assert.equal(isPublicIp("203.0.113.7"), true);
  assert.equal(isPublicIp("fd00::1"), false);
  assert.equal(isPublicIp("2a01:4f8::1"), true);
  assert.equal(isPublicIp("999.1.1.1"), false);
  const h = (o: Record<string, string>) => new Headers(o);
  assert.equal(clientIp(h({ "x-forwarded-for": "1.1.1.1, 203.0.113.7, 10.0.0.2" })), "203.0.113.7");
  assert.equal(clientIp(h({ "cf-connecting-ip": "198.51.100.4", "x-forwarded-for": "203.0.113.7" })), "198.51.100.4");
  assert.equal(clientIp(h({ "cf-connecting-ip": "10.0.0.1", "x-forwarded-for": "203.0.113.7" })), "203.0.113.7");
  assert.equal(clientIp(h({})), null);
});

Deno.test("secret: constant-time compare and fail-closed cron check", async () => {
  assert.equal(await timingSafeEqual("abc", "abc"), true);
  assert.equal(await timingSafeEqual("abc", "abd"), false);
  assert.equal(await timingSafeEqual("abc", "abcd"), false);
  const req = (v?: string) => new Request("http://x", { headers: v ? { "x-cron-secret": v } : {} });
  assert.equal(await hasCronSecret(req("s3cret"), "s3cret"), true);
  assert.equal(await hasCronSecret(req("nope"), "s3cret"), false);
  assert.equal(await hasCronSecret(req(), "s3cret"), false);
  assert.equal(await hasCronSecret(req("anything"), null), false);
});

Deno.test("db: apikey header only, schema profile, PT errors keep the short code", async () => {
  const f = mockFetch((url) => url.endsWith("/submit_lead") ? json({ code: "PT400", message: "invalid_input:phone", details: "row (secret)" }, 400) : json({ ok: true }));
  const rpc = createRpc({ url: "https://p.supabase.co", apikey: "test-secret-k", fetch: f.fetch });
  assert.deepEqual(await rpc.call("health"), { ok: true });
  const hdr = f.calls[0].init!.headers as Record<string, string>;
  assert.equal(hdr.apikey, "test-secret-k");
  assert.equal(hdr.authorization, undefined);
  assert.equal(hdr["content-profile"], "api");
  assert.equal(f.calls[0].url, "https://p.supabase.co/rest/v1/rpc/health");
  await assert.rejects(rpc.call("submit_lead", {}), (e: unknown) => {
    assert.ok(e instanceof RpcError);
    assert.equal(e.status, 400);
    assert.equal(e.code, "PT400");
    assert.equal(e.field, "phone");
    assert.ok(!e.message.includes("secret"));
    return true;
  });
});

Deno.test("turnstile: skip outside production, fail closed in production, verify + hostname", async () => {
  assert.deepEqual(await verifyTurnstile("t", "203.0.113.7", { secret: null, production: false, hostnames: [] }), { ok: true, skipped: true });
  assert.deepEqual(await verifyTurnstile("t", "203.0.113.7", { secret: null, production: true, hostnames: [] }), { ok: false, reason: "not_configured" });
  const f = mockFetch(() => json({ success: true, hostname: "seeld.co.il" }));
  const ok = await verifyTurnstile("tok", "203.0.113.7", { secret: "s", production: true, hostnames: ["seeld.co.il"], fetch: f.fetch });
  assert.deepEqual(ok, { ok: true, skipped: false });
  assert.ok(f.calls[0].body.includes("remoteip=203.0.113.7"));
  assert.ok(!f.calls[0].body.includes("idempotency_key"), "no idempotency_key to siteverify (Cloudflare wants a UUID and caches failures)");
  const g = mockFetch(() => json({ success: true, hostname: "evil.example" }));
  assert.deepEqual(await verifyTurnstile("tok", null, { secret: "s", production: true, hostnames: ["seeld.co.il"], fetch: g.fetch }), { ok: false, reason: "hostname" });
  const noHost = mockFetch(() => json({ success: true }));
  assert.deepEqual(await verifyTurnstile("tok", null, { secret: "s", production: true, hostnames: ["seeld.co.il"], fetch: noHost.fetch }), { ok: false, reason: "hostname" });
  const noHostDev = mockFetch(() => json({ success: true }));
  assert.deepEqual(await verifyTurnstile("tok", null, { secret: "s", production: false, hostnames: ["seeld.co.il"], fetch: noHostDev.fetch }), { ok: true, skipped: false });
  assert.deepEqual(await verifyTurnstile(null, null, { secret: "s", production: true, hostnames: [] }), { ok: false, reason: "missing_token" });
});

Deno.test("ip tag: keyed per isolate, stable within a key, not the plain sha256 prefix", async () => {
  const ip = "203.0.113.7";
  const a = createTagger();
  const b = createTagger();
  const ta = await a(ip);
  assert.match(ta, /^[0-9a-f]{12}$/);
  assert.equal(await a(ip), ta, "stable inside one isolate key (limiters and reject counter keep working)");
  assert.notEqual(await b(ip), ta, "a different key gives a different tag");
  const plain = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))).slice(0, 6),
    (x) => x.toString(16).padStart(2, "0")).join("");
  assert.notEqual(ta, plain);
  assert.notEqual(await shortHash(ip), plain, "the exported isolate tagger is keyed too");
  assert.equal(await shortHash(ip), await shortHash(ip));
  assert.notEqual(await shortHash(ip), await shortHash("203.0.113.8"));
});

Deno.test("resend: 409 invalid_idempotent_request keeps its code (the worker treats it as sent)", async () => {
  const f = mockFetch(() => json({ name: "invalid_idempotent_request" }, 409));
  assert.deepEqual(await sendEmail("k", { from: "a", to: ["b"], subject: "s", html: "h" }, "outbox-1", { fetch: f.fetch }),
    { ok: false, status: 409, retryable: false, code: "invalid_idempotent_request" });
});

Deno.test("resend: idempotency header and retry classification", async () => {
  const f = mockFetch(() => json({ id: "em_1" }));
  const r = await sendEmail("re_k", { from: "a@b.co", to: ["c@d.co"], subject: "s", html: "h" }, "outbox-7", { fetch: f.fetch });
  assert.deepEqual(r, { ok: true, id: "em_1" });
  assert.equal((f.calls[0].init!.headers as Record<string, string>)["idempotency-key"], "outbox-7");
  const g = mockFetch(() => json({ name: "rate_limit_exceeded" }, 429));
  assert.deepEqual(await sendEmail("k", { from: "a", to: ["b"], subject: "s", html: "h" }, "x", { fetch: g.fetch }),
    { ok: false, status: 429, retryable: true, code: "rate_limit_exceeded" });
  const h = mockFetch(() => json({ name: "validation_error" }, 422));
  const v = await sendEmail("k", { from: "a", to: ["b"], subject: "s", html: "h" }, "x", { fetch: h.fetch });
  assert.equal(v.ok, false);
  assert.equal((v as { retryable: boolean }).retryable, false);
});
