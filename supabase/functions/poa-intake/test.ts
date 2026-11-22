// deno test supabase/functions/poa-intake/  (synthetic data only; no network: engine, RPC, storage and fetch are mocks)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import { createPoaHandler, parseRoute, parseStart, poaCors, type PoaIntakeDeps, START_BUCKET_MS, START_MIN_MS, ZIP_LIMIT } from "./handler.ts";
import { PoaToolError } from "../_shared/poa/errors.ts";
import type { EngineRef, FinalUrls, PoaEngine } from "../_shared/poa/engine/types.ts";
import { createFinalDocFetcher } from "../_shared/poa/finaldocs.ts";
import { type Storage, StorageError } from "../_shared/surense/storage.ts";
import { POA_KINDS } from "../_shared/poa/engine/types.ts";
import { sha256Hex, TOKEN_RE } from "../_shared/poa/session.ts";
import { PNG_URL, SYNTH_ID } from "../_shared/poa/fixtures.ts";

const BASE = "https://example.supabase.co/functions/v1/poa-intake";
const ORIGIN = "https://seeld.co.il";
const IP = "203.0.113.9";
const SID = "c0000000-0000-4000-8000-0000000000aa";
const CID = "c0000000-0000-4000-8000-000000000001";
const HASH = "ab".repeat(32);
const bytea = (hex: string) => `\\x${hex}`;
const URLID = "UrlIdSecret99";
const ENGINE_SID = "engine-sid-secret-77";
const NOW = Date.UTC(2026, 10, 21, 12, 0, 0);
const PDF = new TextEncoder().encode("%PDF-1.4\nsynthetic preview");

const MODS = (performed: Partial<Record<string, boolean>> = {}) => Object.fromEntries(
  POA_KINDS.map((k) => [k, { enabled: true, required: false, performed: performed[k] === true }]),
);

const IDENTITY = {
  first_name: "Dana", last_name: "Testov", national_id: SYNTH_ID, phone: "050-123-4567", email: "dana.testov@example.com",
  street: "Herzl 12", city: "Tel Aviv", zip: "6473912", terms_privacy_approved: true, marketing_approved: false, turnstile_token: "ts-token-secret-1",
};

function session(over: Record<string, unknown> = {}) {
  return {
    session_id: SID, status: "open", expires_at: "2026-11-21T13:00:00Z", modules: MODS(), next: "maslaka", engine: "surense", surense_customer_id: CID,
    engine_ref: { customer_id: CID, sid: ENGINE_SID, url_id: URLID, existing: false }, preview_sha: { maslaka: HASH, harbit: HASH, policies: HASH },
    completed_at: null, ...over,
  };
}

function mockEngine(o: { existing?: boolean; startError?: unknown; consentError?: unknown; beforeStart?: () => void; finalUrls?: FinalUrls; refreshCookie?: string } = {}) {
  const calls: { name: string; args: unknown[] }[] = [];
  const engine: PoaEngine = {
    name: "surense",
    async start(who, modules) {
      calls.push({ name: "start", args: [who, modules] });
      o.beforeStart?.();
      if (o.startError) throw o.startError;
      return { customerId: CID, urlId: URLID, sid: ENGINE_SID, existing: o.existing === true, modules };
    },
    async consent(ref: EngineRef, kind, data) {
      calls.push({ name: "consent", args: [ref, kind, data] });
      if (o.refreshCookie) ref.cookie = o.refreshCookie;
      if (o.consentError) throw o.consentError;
      return kind === "policies" ? o.finalUrls ?? {} : {};
    },
    async preview(ref, kind) {
      calls.push({ name: "preview", args: [ref, kind] });
      return PDF;
    },
  };
  return { engine, calls };
}

type Script = Record<string, unknown | ((args: Record<string, unknown>) => unknown)>;

function setup(o: { script?: Script; engine?: ReturnType<typeof mockEngine>; env?: Record<string, string>; storage?: PoaIntakeDeps["storage"]; engineNull?: boolean; finalDocs?: PoaIntakeDeps["finalDocs"]; zip?: PoaIntakeDeps["zip"] } = {}) {
  const lines: string[] = [];
  let clock = NOW;
  const waits: number[] = [];
  const eng = o.engine ?? mockEngine();
  const defaults: Script = {
    poa_config: { poa_enabled: true, poa_docs_enabled: true, engine: "surense", native_shadow: false, turnstile_required: true, modules: { maslaka: true, harbit: true, policies: true } },
    poa_session_start: { ok: true, session_id: SID, expires_at: "2026-11-21T13:00:00Z", modules: MODS(), next: "maslaka", existing_customer: false },
    surense_gate: { ok: true },
    poa_engine_ref_set: { ok: true },
    poa_session_get: session(),
    poa_preview_set: { ok: true },
    poa_consent_record: { kind: "maslaka", method: "check", approved_at: "2026-11-21T12:00:01Z", valid_until: null, modules: MODS({ maslaka: true }), next: "harbit", complete: false },
    poa_session_complete: { complete: true },
    poa_session_fail: { ok: true },
    poa_doc_get: { storage_path: "surense/x/poa/y/z.pdf", sha256: null },
    poa_doc_claim: { ok: true },
    surense_job_enqueue: { id: 1 },
  };
  const script = { ...defaults, ...(o.script ?? {}) };
  const rpc = mockRpc((fn, args) => {
    const v = script[fn];
    if (typeof v === "function") return (v as (a: Record<string, unknown>) => unknown)(args);
    if (v instanceof Error) throw v;
    return v ?? null;
  });
  const f = mockFetch((url) => (url.includes("siteverify") ? json({ success: true, hostname: "seeld.co.il" }) : json({}, 404)));
  const handler = createPoaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret", ...(o.env ?? {}) }),
    rpc,
    log: silentLog(lines),
    engine: o.engineNull ? null : eng.engine,
    storage: o.storage ?? null,
    finalDocs: o.finalDocs ?? null,
    zip: o.zip ?? null,
    fetch: f.fetch,
    now: () => clock,
    wait: async (ms) => {
      waits.push(ms);
      clock += ms;
    },
  });
  return { handler, rpc, lines, eng, waits, f, tick: (ms: number) => (clock += ms) };
}

const hdr = (extra: Record<string, string> = {}) => ({ origin: ORIGIN, "cf-connecting-ip": IP, "user-agent": "test-agent", ...extra });
const post = (path: string, body: unknown, extra: Record<string, string> = {}) =>
  new Request(`${BASE}/${path}`, { method: "POST", headers: { ...hdr(extra), "content-type": "application/json" }, body: JSON.stringify(body) });
const get = (path: string, extra: Record<string, string> = {}) => new Request(`${BASE}/${path}`, { method: "GET", headers: hdr(extra) });
const TOKEN = "T".repeat(43);
const withSession = { "x-poa-session": TOKEN };
const keys = (o: unknown) => Object.keys(o as object).sort();

// ---------------------------------------------------------------- contract: /start
Deno.test("start: response keys are exactly the contract; the token is returned once and only its hash reaches the database", async () => {
  const s = setup();
  const res = await s.handler(post("start", IDENTITY));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(keys(body), ["expires_at", "modules", "next", "session_token"]);
  assert.deepEqual(keys(body.modules), ["harbit", "maslaka", "policies"]);
  assert.deepEqual(keys(body.modules.maslaka), ["enabled", "performed", "required"]);
  assert.match(body.session_token, TOKEN_RE);
  assert.equal(body.next, "maslaka");
  const start = s.rpc.calls.find((c) => c.fn === "poa_session_start")!;
  assert.equal(start.args.p_token_hash, bytea(await sha256Hex(body.session_token)));
  assert.ok(!JSON.stringify(s.rpc.calls).includes(body.session_token), "the token itself never reaches the database");
  assert.equal(start.args.p_phone, "+972501234567", "local form converted before the DB");
  assert.equal(start.args.p_national_id, SYNTH_ID);
  assert.deepEqual(start.args.p_identity, { first_name: "Dana", last_name: "Testov", email: "dana.testov@example.com", street: "Herzl 12", city: "Tel Aviv", zip: "6473912" });
  assert.equal(start.args.p_marketing, false);
  assert.equal(start.args.p_ip, IP);
  assert.equal(start.args.p_ua_hash, bytea(await sha256Hex("test-agent")), "the user agent is stored as a hash only");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
  // switch order: config -> session -> surense gate -> engine -> engine ref
  assert.deepEqual(s.rpc.calls.map((c) => c.fn), ["poa_config", "poa_session_start", "surense_gate", "poa_engine_ref_set"]);
  assert.deepEqual(s.rpc.calls[2].args, { p_write: true, p_action: "invite-proxies" });
  assert.deepEqual(s.rpc.calls[3].args, { p_session: SID, p_ref: { customer_id: CID, sid: ENGINE_SID, url_id: URLID, existing: false } });
});

Deno.test("start: identical shape and identical timing whether or not the person is already a customer", async () => {
  const fresh = setup({ engine: mockEngine({ existing: false }) });
  const known = setup({ engine: mockEngine({ existing: false }), script: { poa_session_start: { ok: true, session_id: SID, expires_at: "2026-11-21T13:00:00Z", modules: MODS(), next: "maslaka", existing_customer: true } } });
  const a = await (await fresh.handler(post("start", IDENTITY))).json();
  const b = await (await known.handler(post("start", IDENTITY))).json();
  assert.deepEqual(keys(a), keys(b));
  assert.deepEqual(a.modules, b.modules);
  assert.deepEqual(fresh.waits, [START_MIN_MS]);
  assert.deepEqual(known.waits, [START_MIN_MS], "padded to the same floor");
  // the marker lives server side only
  const refOf = (t: typeof known) => (t.rpc.calls.find((c) => c.fn === "poa_engine_ref_set")!.args.p_ref as { existing: boolean }).existing;
  assert.equal(refOf(fresh), false);
  assert.equal(refOf(known), true, "a customer the database knows blocks the automatic launch");
  assert.ok(!JSON.stringify(b).includes("existing"));
  // Surense-side duplicate: same shape again
  const dup = setup({ engine: mockEngine({ existing: true }) });
  const c = await (await dup.handler(post("start", IDENTITY))).json();
  assert.deepEqual(keys(c), keys(a));
  assert.equal(refOf(dup), true);
});

Deno.test("start: a failure is padded to the same floor too", async () => {
  const s = setup({ engine: mockEngine({ startError: new PoaToolError("unavailable", "dp_timeout") }) });
  const res = await s.handler(post("start", IDENTITY));
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "unavailable" });
  assert.deepEqual(s.waits, [START_MIN_MS]);
  const fail = s.rpc.calls.find((c) => c.fn === "poa_session_fail")!;
  assert.deepEqual(fail.args, { p_session: SID, p_code: "dp_timeout" });
});

Deno.test("start: timing is quantised: a slow chain and a fast one land in the same bucket; an overrun rounds up to the next bucket", async () => {
  const totals = async (spendMs: number, known: boolean) => {
    const s: ReturnType<typeof setup> = setup({ engine: mockEngine({ beforeStart: () => void s.tick(spendMs) }), script: { poa_session_start: { ok: true, session_id: SID, expires_at: "2026-11-21T13:00:00Z", modules: MODS(), next: "maslaka", existing_customer: known } } });
    const t0 = s.tick(0);
    const res = await s.handler(post("start", IDENTITY));
    assert.equal(res.status, 200);
    return s.tick(0) - t0;
  };
  // a fresh identity (cheap chain) and a Surense-known one (extra round trip): both inside the floor -> exactly the floor
  assert.equal(await totals(3500, false), START_MIN_MS);
  assert.equal(await totals(5800, true), START_MIN_MS, "an extra round trip inside the floor is invisible");
  // beyond the floor: rounded up to the next multiple of the bucket, so nearby durations still answer alike
  assert.equal(await totals(START_MIN_MS + 200, false), START_MIN_MS + START_BUCKET_MS);
  assert.equal(await totals(START_MIN_MS + START_BUCKET_MS - 200, true), START_MIN_MS + START_BUCKET_MS, "different durations, same bucket, same total");
  assert.equal(await totals(START_MIN_MS + START_BUCKET_MS + 1, true), START_MIN_MS + 2 * START_BUCKET_MS);
  // the floor and the bucket are configurable (POA_START_MIN_MS / POA_START_BUCKET_MS)
  const cfg: ReturnType<typeof setup> = setup({ engine: mockEngine({ beforeStart: () => void cfg.tick(900) }) });
  const h = createPoaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret" }), rpc: cfg.rpc, log: silentLog(), engine: cfg.eng.engine, storage: null, fetch: cfg.f.fetch,
    now: () => cfg.tick(0), wait: async (ms) => void cfg.tick(ms), startMinMs: 500, startBucketMs: 400,
  });
  const before = cfg.tick(0);
  assert.equal((await h(post("start", IDENTITY))).status, 200);
  assert.equal(cfg.tick(0) - before, 1200, "900 ms of work with a 500 ms floor and 400 ms buckets -> 1200");
});

Deno.test("start: switch off -> 503 {error:inactive}, and nothing is written or sent anywhere", async () => {
  const s = setup({ script: { poa_config: { poa_enabled: false, engine: "surense", turnstile_required: true, modules: {} } } });
  const res = await s.handler(post("start", IDENTITY));
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "inactive" });
  assert.deepEqual(s.rpc.calls.map((c) => c.fn), ["poa_config"]);
  assert.equal(s.eng.calls.length, 0);
  assert.equal(s.f.calls.length, 0, "Turnstile token not spent while the feature is closed");
  // the SQL kill switch gives the same answer
  const t = setup({ script: { poa_session_start: rpcError(423, "PT423", "feature_disabled:poa_enabled") } });
  const r2 = await t.handler(post("start", IDENTITY));
  assert.equal(r2.status, 503);
  assert.deepEqual(await r2.json(), { error: "inactive" });
  assert.equal(t.eng.calls.length, 0);
});

Deno.test("start: Turnstile required -> 400 without a token, 400 when rejected, 503 when siteverify is down; off -> not called", async () => {
  const noToken = setup();
  const { turnstile_token: _t, ...noTs } = IDENTITY;
  const r1 = await noToken.handler(post("start", noTs));
  assert.equal(r1.status, 400);
  assert.deepEqual(await r1.json(), { error: "generic" });
  assert.deepEqual(noToken.rpc.calls.map((c) => c.fn), ["poa_config"], "no session before the check passed");

  const rejected = setup();
  rejected.f.calls.length = 0;
  const h = createPoaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret" }), rpc: rejected.rpc, log: silentLog(), engine: rejected.eng.engine, storage: null,
    fetch: mockFetch(() => json({ success: false, "error-codes": ["invalid-input-response"] })).fetch, now: () => NOW, wait: async () => {},
  });
  assert.equal((await h(post("start", IDENTITY))).status, 400);

  const down = createPoaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret" }), rpc: setup().rpc, log: silentLog(), engine: mockEngine().engine, storage: null,
    fetch: mockFetch(() => new Response("x", { status: 500 })).fetch, now: () => NOW, wait: async () => {},
  });
  assert.equal((await down(post("start", IDENTITY))).status, 503);

  const off = setup({ script: { poa_config: { poa_enabled: true, engine: "surense", turnstile_required: false, modules: { maslaka: true, harbit: true, policies: true } } } });
  assert.equal((await off.handler(post("start", noTs))).status, 200);
  assert.equal(off.f.calls.length, 0, "siteverify not called when the switch is off");
});

Deno.test("start: a request without a usable client address is refused BEFORE Turnstile (its single-use token is not spent)", async () => {
  const s = setup();
  const res = await s.handler(new Request(`${BASE}/start`, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify(IDENTITY) }));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "generic" });
  assert.equal(s.f.calls.length, 0, "no siteverify call");
  assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_session_start"));
});

Deno.test("start: Origin allowlist, preflight headers, unknown routes and methods", async () => {
  const s = setup();
  const bad = await s.handler(new Request(`${BASE}/start`, { method: "POST", headers: { origin: "https://evil.example.com", "cf-connecting-ip": IP }, body: JSON.stringify(IDENTITY) }));
  assert.equal(bad.status, 403);
  assert.deepEqual(await bad.json(), { error: "generic" });
  assert.equal(bad.headers.get("access-control-allow-origin"), null);
  const none = await s.handler(new Request(`${BASE}/start`, { method: "POST", headers: { "cf-connecting-ip": IP }, body: "{}" }));
  assert.equal(none.status, 403);
  assert.equal(s.rpc.calls.length, 0, "origin refusals make no database call");

  const pre = await s.handler(new Request(`${BASE}/start`, { method: "OPTIONS", headers: { origin: ORIGIN } }));
  assert.equal(pre.status, 204);
  assert.match(pre.headers.get("access-control-allow-headers") ?? "", /x-poa-session/);
  assert.match(pre.headers.get("access-control-expose-headers") ?? "", /x-poa-preview-sha256/);
  assert.match(pre.headers.get("access-control-expose-headers") ?? "", /content-disposition/);
  assert.equal(poaCors("https://evil.example.com", [ORIGIN])["Access-Control-Allow-Origin"], undefined);

  assert.equal((await s.handler(get("start"))).status, 405);
  assert.equal((await s.handler(post("state", {}))).status, 405);
  assert.equal((await s.handler(get("nope"))).status, 404);
  assert.equal((await s.handler(get("preview/other"))).status, 404);
  assert.deepEqual(parseRoute("GET", "/functions/v1/poa-intake/doc/policies"), { name: "doc", kind: "policies" });
  assert.deepEqual(parseRoute("POST", "/harbit"), { name: "consent", kind: "harbit" });
  assert.deepEqual(parseRoute("GET", "/functions/v1/poa-intake/zip"), { name: "zip" });
  assert.equal(parseRoute("POST", "/zip"), "method");
});

Deno.test("zip: GET /zip answers the lookup's zip (or null), needs street + city, no session, origin-gated, rate-limited", async () => {
  const asked: unknown[] = [];
  const zip = { lookup: (q: unknown) => { asked.push(q); return Promise.resolve("6473912"); } };
  const s = setup({ zip });
  const ok = await s.handler(get("zip?street=" + encodeURIComponent("Herzl 12") + "&city=" + encodeURIComponent("Tel Aviv")));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { zip: "6473912" });
  assert.deepEqual(asked, [{ city: "Tel Aviv", street: "Herzl", house: "12" }], "house number split off, nothing else sent");
  assert.ok(!s.rpc.calls.some((c) => c.fn !== "poa_config"), "no database call for a zip lookup");
  // no house number: nothing to look up
  const noHouse = await s.handler(get("zip?street=Herzl&city=Tel%20Aviv"));
  assert.deepEqual(await noHouse.json(), { zip: null });
  assert.equal(asked.length, 1);
  // missing / bad params are refused early
  assert.equal((await s.handler(get("zip?street=Herzl%2012"))).status, 400);
  assert.equal((await s.handler(get("zip?street=%3Cx%3E&city=Tel%20Aviv"))).status, 400);
  // wrong origin
  const foreign = new Request(`${BASE}/zip?street=Herzl%2012&city=Tel%20Aviv`, { headers: { origin: "https://evil.example", "cf-connecting-ip": IP } });
  assert.equal((await s.handler(foreign)).status, 403);
  // without a lookup the route still answers
  const none = setup();
  assert.deepEqual(await (await none.handler(get("zip?street=Herzl%2012&city=Tel%20Aviv"))).json(), { zip: null });
  // the per-address limit
  const limited = setup({ zip });
  let last = 200;
  for (let i = 0; i < ZIP_LIMIT + 1; i++) last = (await limited.handler(get("zip?street=Herzl%2012&city=Tel%20Aviv"))).status;
  assert.equal(last, 429);
});

Deno.test("start: validation rejects unknown keys, bad ids, landlines, missing terms", async () => {
  const bad = (patch: Record<string, unknown>) => parseStart({ ...IDENTITY, ...patch });
  assert.ok(parseStart(IDENTITY));
  for (const patch of [{ extra: 1 }, { national_id: "000000019" }, { national_id: 5 }, { phone: "0212345678" }, { phone: "+14155550123" }, { terms_privacy_approved: false },
    { terms_privacy_approved: undefined }, { first_name: "" }, { last_name: "<x>" }, { email: "nope" }, { marketing_approved: "yes" }, { turnstile_token: 5 },
    { street: "" }, { street: undefined }, { street: "<x>" }, { city: "x".repeat(81) }, { city: 7 }, { zip: "" }, { zip: undefined }, { zip: "12345" }, { zip: "abcdefg" }, { zip: 6473912 }]) {
    assert.throws(() => bad(patch), (e) => (e as { kind?: string }).kind === "generic", JSON.stringify(patch));
  }
  assert.equal(parseStart({ ...IDENTITY, email: null }).identity.email, null);
  assert.equal(parseStart(IDENTITY).identity.phone, "+972501234567");
  const s = setup();
  const res = await s.handler(post("start", { ...IDENTITY, national_id: "000000019" }));
  assert.equal(res.status, 400);
  assert.equal(s.rpc.calls.length, 0, "validation failures make no database call");
  const big = await s.handler(post("start", { ...IDENTITY, first_name: "x".repeat(9000) }));
  assert.equal(big.status, 413);
});

Deno.test("start: Surense switch off -> unavailable and the engine is never called; native engine -> unavailable; no engine -> unavailable", async () => {
  const s = setup({ script: { surense_gate: rpcError(423, "PT423", "feature_disabled:surense_write_enabled") } });
  const r = await s.handler(post("start", IDENTITY));
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: "unavailable" });
  assert.equal(s.eng.calls.length, 0);
  const n = setup({ script: { poa_config: { poa_enabled: true, engine: "native", turnstile_required: false, modules: {} } } });
  assert.deepEqual(await (await n.handler(post("start", IDENTITY))).json(), { error: "unavailable" });
  const none = setup({ engineNull: true });
  assert.deepEqual(await (await none.handler(post("start", IDENTITY))).json(), { error: "unavailable" });
});

Deno.test("memory reject counter cuts an address off after repeated refusals, before any DB call", async () => {
  const s = setup();
  for (let i = 0; i < 30; i++) await s.handler(new Request(`${BASE}/start`, { method: "POST", headers: { origin: "https://evil.example.com", "cf-connecting-ip": IP }, body: "{}" }));
  const res = await s.handler(post("start", IDENTITY));
  assert.equal(res.status, 429);
  assert.deepEqual(await res.json(), { error: "locked" });
  assert.equal(s.rpc.calls.length, 0);
});

// ---------------------------------------------------------------- state / preview / consent
Deno.test("state: exact keys; an expired session is a 200 with status expired; no header -> inactive", async () => {
  const s = setup();
  const res = await s.handler(get("state", withSession));
  assert.equal(res.status, 200);
  assert.deepEqual(keys(await res.json()), ["expires_at", "modules", "next", "status"]);
  assert.equal(s.rpc.calls[0].args.p_token_hash, bytea(await sha256Hex(TOKEN)));
  const e = setup({ script: { poa_session_get: session({ status: "expired" }) } });
  assert.equal((await (await e.handler(get("state", withSession))).json()).status, "expired");
  const none = await s.handler(get("state"));
  assert.equal(none.status, 401);
  assert.deepEqual(await none.json(), { error: "inactive" });
  const unknown = setup({ script: { poa_session_get: rpcError(401, "PT401", "session_unknown") } });
  assert.deepEqual(await (await unknown.handler(get("state", withSession))).json(), { error: "inactive" });
});

Deno.test("session routes: well-formed tokens the database does not know count as refusals; an address rotating them is cut off", async () => {
  const s = setup({ script: { poa_session_get: rpcError(401, "PT401", "session_inactive") } });
  for (let i = 0; i < 30; i++) {
    const r = await s.handler(get("state", { "x-poa-session": "A".repeat(42) + String(i % 10) }));
    assert.equal(r.status, 401);
  }
  const before = s.rpc.calls.length;
  const cut = await s.handler(get("state", withSession));
  assert.equal(cut.status, 429);
  assert.deepEqual(await cut.json(), { error: "locked" });
  assert.equal(s.rpc.calls.length, before, "no database call once the address is cut off");
  // the doc route counts them too
  const d = setup({ storage: { get: async () => null }, script: { poa_doc_get: rpcError(401, "PT401", "session_inactive") } });
  for (let i = 0; i < 30; i++) assert.equal((await d.handler(get("doc/maslaka", withSession))).status, 401);
  assert.equal((await d.handler(get("doc/maslaka", withSession))).status, 429);
});

Deno.test("preview: PDF bytes, hash in x-poa-preview-sha256 equal to the bytes' SHA-256 and stored in the session", async () => {
  const s = setup();
  const res = await s.handler(get("preview/harbit", withSession));
  assert.equal(res.status, 200);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual(bytes, PDF);
  const sha = await sha256Hex(PDF);
  assert.equal(res.headers.get("x-poa-preview-sha256"), sha);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  const set = s.rpc.calls.find((c) => c.fn === "poa_preview_set")!;
  assert.deepEqual(set.args, { p_session: SID, p_kind: "harbit", p_sha256: sha });
  assert.equal(s.eng.calls[0].name, "preview");
  assert.equal((s.eng.calls[0].args[1]), "harbit");
});

Deno.test("preview: closed, expired, disabled or rate limited sessions never reach the tool", async () => {
  for (const [status, code, kind] of [["expired", 410, "expired"], ["locked", 403, "locked"], ["completed", 409, "completed"]] as const) {
    const s = setup({ script: { poa_session_get: session({ status }) } });
    const r = await s.handler(get("preview/maslaka", withSession));
    assert.equal(r.status, code);
    assert.deepEqual(await r.json(), { error: kind });
    assert.equal(s.eng.calls.length, 0);
  }
  const m = session({ modules: { ...MODS(), policies: { enabled: false, required: false, performed: false } } });
  const off = setup({ script: { poa_session_get: m } });
  assert.equal((await off.handler(get("preview/policies", withSession))).status, 400);
  assert.equal(off.eng.calls.length, 0);
  const lim = setup();
  let last = 200;
  for (let i = 0; i < 21; i++) last = (await lim.handler(get("preview/maslaka", withSession))).status;
  assert.equal(last, 429);
});

Deno.test("consent maslaka: exact response keys, engine called, database records it", async () => {
  const s = setup();
  const res = await s.handler(post("maslaka", { preview_sha256: HASH }, withSession));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(keys(body), ["approved_at", "kind", "method", "modules", "next", "valid_until"]);
  assert.equal(body.kind, "maslaka");
  assert.equal(body.method, "check");
  assert.equal(body.next, "harbit");
  assert.equal(s.eng.calls[0].name, "consent");
  assert.equal(s.eng.calls[0].args[1], "maslaka");
  const rec = s.rpc.calls.find((c) => c.fn === "poa_consent_record")!;
  assert.equal(rec.args.p_session, SID);
  assert.equal(rec.args.p_method, "check");
  assert.equal(rec.args.p_extra, null);
  assert.equal(rec.args.p_signature, null);
  assert.equal(rec.args.p_preview_sha256, HASH);
  assert.equal(rec.args.p_ip, IP);
  assert.ok(!s.rpc.calls.some((c) => c.fn === "surense_job_enqueue"), "not the last module: no launch");
});

Deno.test("consent: wrong or missing preview hash, unknown keys, bad dates and bad signatures are refused before the tool", async () => {
  const s = setup();
  const tries: [string, unknown][] = [
    ["maslaka", { preview_sha256: "cd".repeat(32) }],
    ["maslaka", {}],
    ["maslaka", { preview_sha256: HASH, extra: 1 }],
    ["harbit", { preview_sha256: HASH, birth_date: "1990-05-17" }],
    ["harbit", { preview_sha256: HASH, birth_date: "2999-01-01", issue_date: "2015-01-01" }],
    ["harbit", { preview_sha256: HASH, birth_date: "1990-05-17", issue_date: "1980-01-01" }],
    ["harbit", { preview_sha256: HASH, birth_date: "1990-05-17", issue_date: "1990-05-17" }],
    ["harbit", { preview_sha256: HASH, birth_date: "2026-11-21", issue_date: "2026-11-21" }],
    ["harbit", { preview_sha256: HASH, birth_date: "17/05/1990", issue_date: "2015-01-01" }],
    ["policies", { preview_sha256: HASH }],
    ["policies", { preview_sha256: HASH, signature_png: "data:text/html;base64,AAAA" }],
  ];
  for (const [kind, body] of tries) {
    const r = await s.handler(post(kind, body, withSession));
    assert.equal(r.status, 400, `${kind} ${JSON.stringify(body).slice(0, 60)}`);
    assert.deepEqual(await r.json(), { error: "generic" });
  }
  assert.equal(s.eng.calls.length, 0);
  assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_consent_record"));
});

Deno.test("consent replay: a module already performed answers 200 with the recorded approval; the tool and the launch are not touched", async () => {
  const rec = { kind: "maslaka", method: "check", approved_at: "2026-11-21T12:00:01Z", valid_until: null, modules: MODS({ maslaka: true }), next: "harbit", complete: false };
  const done = setup({ script: { poa_session_get: session({ modules: MODS({ maslaka: true }) }), poa_consent_record: rec } });
  const res = await done.handler(post("maslaka", { preview_sha256: HASH }, withSession));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(keys(body), ["approved_at", "kind", "method", "modules", "next", "valid_until"]);
  assert.equal(body.next, "harbit");
  assert.equal(done.eng.calls.length, 0, "nothing reaches the tool");
  assert.ok(!done.rpc.calls.some((c) => c.fn === "surense_job_enqueue" || c.fn === "poa_session_complete" || c.fn === "poa_session_fail"));
  const call = done.rpc.calls.find((c) => c.fn === "poa_consent_record")!;
  assert.equal(call.args.p_method, "check");
  assert.equal(call.args.p_signature, null);
  // the preview hash is still checked
  const wrong = await done.handler(post("maslaka", { preview_sha256: "cd".repeat(32) }, withSession));
  assert.equal(wrong.status, 400);

  // policies of a COMPLETED session (the last answer was lost): replayed with the recorded approval, no second launch, still no tool call
  const all = MODS({ maslaka: true, harbit: true, policies: true });
  const last = setup({ script: {
    poa_session_get: session({ status: "completed", modules: all, completed_at: "2026-11-21T12:00:01Z", engine_ref: null }),
    poa_consent_record: { ...rec, kind: "policies", method: "signature", modules: all, next: "done" },
  } });
  const r2 = await last.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession));
  assert.equal(r2.status, 200);
  assert.equal((await r2.json()).next, "done");
  assert.equal(last.eng.calls.length, 0);
  assert.equal((last.rpc.calls.find((c) => c.fn === "poa_consent_record")!.args).p_method, "check", "a replay never needs the signature again");
  assert.ok(!last.rpc.calls.some((c) => c.fn === "surense_job_enqueue"), "no second launch");
  // an expired or locked session is not replayed
  const exp = setup({ script: { poa_session_get: session({ status: "expired", modules: MODS({ maslaka: true }) }) } });
  assert.equal((await exp.handler(post("maslaka", { preview_sha256: HASH }, withSession))).status, 410);
});

Deno.test("consent: a database failure after the tool accepted leaves a code on the session; the retry (tool says completed) records it", async () => {
  // 1. the tool accepts, the database refuses (rate limit): the code is stored, the browser sees the mapped kind
  const s = setup({ script: { poa_consent_record: rpcError(429, "PT429", "rate_limited") } });
  const res = await s.handler(post("maslaka", { preview_sha256: HASH }, withSession));
  assert.equal(res.status, 429);
  assert.deepEqual(await res.json(), { error: "locked" });
  assert.equal(s.eng.calls[0].name, "consent");
  assert.deepEqual(s.rpc.calls.find((c) => c.fn === "poa_session_fail")!.args, { p_session: SID, p_code: "consent_record_pt429" });
  // an unknown failure shape still stores a code
  const t = setup({ script: { poa_consent_record: new Error("boom") } });
  assert.equal((await t.handler(post("maslaka", { preview_sha256: HASH }, withSession))).status, 500);
  assert.deepEqual(t.rpc.calls.find((c) => c.fn === "poa_session_fail")!.args, { p_session: SID, p_code: "consent_record_unknown" });
  // 2. the retry: the module is still open in our session, the tool answers 409 (it holds the approval) -> we record it
  const r = setup({ engine: mockEngine({ consentError: new PoaToolError("completed", "dp_http_409") }) });
  const again = await r.handler(post("maslaka", { preview_sha256: HASH }, withSession));
  assert.equal(again.status, 200);
  assert.equal((await again.json()).next, "harbit");
  assert.ok(r.rpc.calls.some((c) => c.fn === "poa_consent_record"), "recorded although the tool said completed");
  assert.ok(!r.rpc.calls.some((c) => c.fn === "poa_session_fail"), "and no failure code for it");
});

Deno.test("consent: states and tool errors map to the six kinds", async () => {
  for (const [status, code, kind] of [["expired", 410, "expired"], ["locked", 403, "locked"], ["completed", 409, "completed"]] as const) {
    const s = setup({ script: { poa_session_get: session({ status }) } });
    const r = await s.handler(post("maslaka", { preview_sha256: HASH }, withSession));
    assert.equal(r.status, code);
    assert.deepEqual(await r.json(), { error: kind });
  }
  const noHeader = await setup().handler(post("maslaka", { preview_sha256: HASH }));
  assert.equal(noHeader.status, 401);
  for (const [err, kind, status] of [
    [new PoaToolError("inactive", "dp_http_404"), "inactive", 401], [new PoaToolError("locked", "dp_http_429"), "locked", 403],
    [new PoaToolError("expired", "dp_http_410"), "expired", 410],
    [new PoaToolError("unavailable", "dp_timeout", true), "unavailable", 503], [new Error("boom"), "generic", 500],
  ] as const) {
    const s = setup({ engine: mockEngine({ consentError: err }) });
    const r = await s.handler(post("maslaka", { preview_sha256: HASH }, withSession));
    assert.equal(r.status, status);
    assert.deepEqual(await r.json(), { error: kind });
    assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_consent_record"), "nothing recorded when the tool refused");
  }
});

Deno.test("launch: the last module queues surense.e9100_submit with today's date and an e9100: dedupe; existing customers wait; a closed switch is fine", async () => {
  const last = { poa_consent_record: { approved_at: "2026-11-21T12:00:01Z", valid_until: null, modules: MODS({ maslaka: true, harbit: true, policies: true }), next: "done" } };
  const s = setup({ script: { ...last, poa_session_get: session({ modules: MODS({ maslaka: true, harbit: true }) }) } });
  const res = await s.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.method, "signature");
  assert.equal(body.next, "done");
  const rec = s.rpc.calls.find((c) => c.fn === "poa_consent_record")!;
  assert.equal(rec.args.p_signature, PNG_URL);
  assert.equal(rec.args.p_method, "signature");
  assert.deepEqual(s.eng.calls[0].args[2], { birthDate: undefined, issueDate: undefined, signaturePng: PNG_URL });
  const enq = s.rpc.calls.find((c) => c.fn === "surense_job_enqueue")!;
  assert.deepEqual(enq.args, { p_kind: "surense.e9100_submit", p_params: { customer_id: CID, proxy_approval_date: "2026-11-21" }, p_dedupe: `e9100:${CID}` });
  assert.ok(s.rpc.calls.some((c) => c.fn === "poa_session_complete"));

  const existing = setup({ script: { ...last, poa_session_get: session({ engine_ref: { customer_id: CID, sid: ENGINE_SID, url_id: URLID, existing: true } }) } });
  assert.equal((await existing.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession))).status, 200);
  assert.ok(!existing.rpc.calls.some((c) => c.fn === "surense_job_enqueue"), "a pre-existing customer is not launched automatically");

  // the tool's page-session cookies ride inside the engine reference: read back from the session, handed to the engine,
  // and stored again when the tool refreshed them (never when unchanged)
  const jarRef = { customer_id: CID, sid: ENGINE_SID, url_id: URLID, existing: false, cookie: "connect.sid=abc; XSRF-TOKEN=t1" };
  const refreshed = setup({ engine: mockEngine({ refreshCookie: "connect.sid=abc; XSRF-TOKEN=t2" }), script: { ...last, poa_session_get: session({ engine_ref: jarRef }) } });
  assert.equal((await refreshed.handler(post("maslaka", { preview_sha256: HASH }, withSession))).status, 200);
  assert.equal((refreshed.eng.calls.find((c) => c.name === "consent")!.args[0] as { cookie?: string }).cookie, "connect.sid=abc; XSRF-TOKEN=t2");
  const setAgain = refreshed.rpc.calls.filter((c) => c.fn === "poa_engine_ref_set");
  assert.equal(setAgain.length, 1, "a refreshed jar is stored once");
  assert.deepEqual(setAgain[0].args.p_ref, { customer_id: CID, sid: ENGINE_SID, url_id: URLID, existing: false, cookie: "connect.sid=abc; XSRF-TOKEN=t2" });
  const same = setup({ engine: mockEngine({ refreshCookie: "connect.sid=abc; XSRF-TOKEN=t1" }), script: { ...last, poa_session_get: session({ engine_ref: jarRef }) } });
  assert.equal((await same.handler(post("maslaka", { preview_sha256: HASH }, withSession))).status, 200);
  assert.ok(!same.rpc.calls.some((c) => c.fn === "poa_engine_ref_set"), "an unchanged jar is not stored again");

  const closed = setup({ script: { ...last, surense_job_enqueue: rpcError(423, "PT423", "feature_disabled:surense_enabled") } });
  assert.equal((await closed.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession))).status, 200);
  // ... and the dropped launch leaves a trace on the completed session (staff see it in the list)
  assert.deepEqual(closed.rpc.calls.find((c) => c.fn === "poa_session_fail")!.args, { p_session: SID, p_code: "launch_423" });
  assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_session_fail"), "a launch that was queued leaves nothing");
});

Deno.test("harbit: valid dates reach the tool and the database as ISO dates", async () => {
  const s = setup();
  const r = await s.handler(post("harbit", { preview_sha256: HASH, birth_date: "1990-05-17", issue_date: "2015-01-02" }, withSession));
  assert.equal(r.status, 200);
  assert.deepEqual(s.eng.calls[0].args[2], { birthDate: "1990-05-17", issueDate: "2015-01-02", signaturePng: undefined });
  const rec = s.rpc.calls.find((c) => c.fn === "poa_consent_record")!;
  assert.deepEqual(rec.args.p_extra, { birth_date: "1990-05-17", issue_date: "2015-01-02" });
  assert.equal(rec.args.p_method, "check");
});

// ---------------------------------------------------------------- doc download
Deno.test("doc: streams the stored PDF once with attachment, no-store, no-referrer; hash and window are enforced", async () => {
  const bytes = new TextEncoder().encode("%PDF-1.4\nfinal synthetic");
  const sha = await sha256Hex(bytes);
  const storage = { get: async (p: string) => (p === "surense/x/poa/y/z.pdf" ? bytes : null) };
  const s = setup({ storage, script: { poa_doc_get: { storage_path: "surense/x/poa/y/z.pdf", sha256: sha } } });
  const res = await s.handler(get("doc/policies", withSession));
  assert.equal(res.status, 200);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), bytes);
  assert.match(res.headers.get("content-disposition") ?? "", /^attachment; filename="poa-policies\.pdf"$/);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.deepEqual(s.rpc.calls.find((c) => c.fn === "poa_doc_get")!.args, { p_token_hash: bytea(await sha256Hex(TOKEN)), p_kind: "policies" });

  const mismatch = setup({ storage, script: { poa_doc_get: { storage_path: "surense/x/poa/y/z.pdf", sha256: "00".repeat(32) } } });
  assert.equal((await mismatch.handler(get("doc/policies", withSession))).status, 500);
  const gone = setup({ storage: { get: async () => null }, script: { poa_doc_get: { storage_path: "surense/x/poa/y/z.pdf", sha256: null } } });
  assert.equal((await gone.handler(get("doc/policies", withSession))).status, 404);
  const late = setup({ storage, script: { poa_doc_get: rpcError(410, "PT410", "download_window_over") } });
  assert.deepEqual(await (await late.handler(get("doc/policies", withSession))).json(), { error: "expired" });
  const twice = setup({ storage, script: { poa_doc_get: rpcError(409, "PT409", "already_downloaded") } });
  assert.deepEqual(await (await twice.handler(get("doc/policies", withSession))).json(), { error: "completed" });
  const off = setup({ storage, script: { poa_doc_get: rpcError(423, "PT423", "feature_disabled:poa_docs_enabled") } });
  assert.equal((await off.handler(get("doc/policies", withSession))).status, 503);
  const noStorage = setup({ script: { poa_doc_get: { storage_path: "surense/x/poa/y/z.pdf", sha256: null } } });
  assert.equal((await noStorage.handler(get("doc/policies", withSession))).status, 503);
});

Deno.test("doc: peek -> read -> claim; a storage miss or error never burns the download; no session lookup; poa_enabled off does not matter", async () => {
  const bytes = new TextEncoder().encode("%PDF-1.4 final synthetic 2");
  const sha = await sha256Hex(bytes);
  const peek = { storage_path: "surense/x/poa/y/z.pdf", sha256: sha };
  const fns = (t: ReturnType<typeof setup>) => t.rpc.calls.map((c) => c.fn);
  // no storage configured: refused before the database is even asked
  const none = setup();
  assert.equal((await none.handler(get("doc/policies", withSession))).status, 503);
  assert.deepEqual(fns(none), []);
  // object missing / storage error / hash mismatch: the single download is NOT claimed
  const miss = setup({ storage: { get: async () => null }, script: { poa_doc_get: peek } });
  assert.equal((await miss.handler(get("doc/policies", withSession))).status, 404);
  assert.deepEqual(fns(miss), ["poa_doc_get"], "storage miss does not consume the download");
  const boom = setup({ storage: { get: async () => { throw new Error("storage 503"); } }, script: { poa_doc_get: peek } });
  assert.equal((await boom.handler(get("doc/policies", withSession))).status, 500);
  assert.deepEqual(fns(boom), ["poa_doc_get"]);
  const bad = setup({ storage: { get: async () => bytes }, script: { poa_doc_get: { ...peek, sha256: "00".repeat(32) } } });
  assert.equal((await bad.handler(get("doc/policies", withSession))).status, 500);
  assert.deepEqual(fns(bad), ["poa_doc_get"]);
  // success: peek, then claim; no api.poa_session_get at all (the download has its own switch), even while poa_enabled is off
  const ok = setup({ storage: { get: async () => bytes }, script: { poa_doc_get: peek, poa_session_get: rpcError(423, "PT423", "feature_disabled:poa_enabled") } });
  const res = await ok.handler(get("doc/maslaka", withSession));
  assert.equal(res.status, 200);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), bytes);
  assert.deepEqual(fns(ok), ["poa_doc_get", "poa_doc_claim"]);
  assert.deepEqual(ok.rpc.calls[1].args, { p_token_hash: bytea(await sha256Hex(TOKEN)), p_kind: "maslaka" });
  // two clicks at once: the loser's claim fails and the bytes are not served
  const race = setup({ storage: { get: async () => bytes }, script: { poa_doc_get: peek, poa_doc_claim: rpcError(410, "PT410", "document_gone") } });
  const lost = await race.handler(get("doc/maslaka", withSession));
  assert.equal(lost.status, 410);
  assert.deepEqual(await lost.json(), { error: "expired" });
  // a module the session never enabled: the database refuses (PT400) -> generic
  const off = setup({ storage: { get: async () => bytes }, script: { poa_doc_get: rpcError(400, "PT400", "invalid_input:kind") } });
  assert.equal((await off.handler(get("doc/harbit", withSession))).status, 400);
});

Deno.test("start without api.poa_config: Turnstile stays required, the session row decides the engine, SQL switches still answer", async () => {
  const noCfg = { poa_config: rpcError(404, "PGRST202", "x") };
  const s = setup({ script: noCfg });
  assert.equal((await s.handler(post("start", IDENTITY))).status, 200);
  assert.deepEqual(s.rpc.calls.map((c) => c.fn), ["poa_config", "poa_session_start", "poa_session_get", "surense_gate", "poa_engine_ref_set"]);
  const { turnstile_token: _t, ...noTs } = IDENTITY;
  const t = setup({ script: noCfg });
  assert.equal((await t.handler(post("start", noTs))).status, 400, "fail closed: a token is required when the switch cannot be read");
  const native = setup({ script: { ...noCfg, poa_session_get: session({ engine: "native" }) } });
  const r = await native.handler(post("start", IDENTITY));
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: "unavailable" });
  assert.equal(native.eng.calls.length, 0);
  const off = setup({ script: { ...noCfg, poa_session_start: rpcError(423, "PT423", "feature_disabled:poa_enabled") } });
  const o = await off.handler(post("start", IDENTITY));
  assert.equal(o.status, 503);
  assert.deepEqual(await o.json(), { error: "inactive" });
});

Deno.test("start: the daily cap answers {ok:false} from the database -> locked 429, nothing sent to Surense", async () => {
  const s = setup({ script: { poa_session_start: { ok: false, error: "rate_limited" } } });
  const r = await s.handler(post("start", IDENTITY));
  assert.equal(r.status, 429);
  assert.deepEqual(await r.json(), { error: "locked" });
  assert.equal(s.eng.calls.length, 0);
});

// ---------------------------------------------------------------- logs
Deno.test("logs: no personal value, token, link id, session id of the tool or signature ever reaches the logger", async () => {
  const bytes = new TextEncoder().encode("%PDF-1.4\nfinal");
  const s = setup({
    storage: { get: async () => bytes },
    script: {
      poa_doc_get: { storage_path: "surense/x/poa/y/z.pdf", sha256: null },
      poa_consent_record: { approved_at: "2026-11-21T12:00:01Z", valid_until: null, modules: MODS({ maslaka: true, harbit: true, policies: true }), next: "done" },
    },
  });
  // any direct console call from the POA code while it handles real-looking requests fails the test
  const consoleSeen: unknown[][] = [];
  const saved = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  for (const k of Object.keys(saved) as (keyof typeof saved)[]) console[k] = (...a: unknown[]) => void consoleSeen.push(a);
  let token = "";
  const e = setup({ engine: mockEngine({ startError: new Error(`leak ${IDENTITY.first_name} ${SYNTH_ID} ${IDENTITY.email}`) }) });
  try {
  const start = await s.handler(post("start", IDENTITY));
  token = (await start.json()).session_token as string;
  const sess = { "x-poa-session": token };
  await s.handler(get("state", sess));
  await s.handler(get("preview/maslaka", sess));
  await s.handler(post("maslaka", { preview_sha256: HASH }, sess));
  await s.handler(post("harbit", { preview_sha256: HASH, birth_date: "1990-05-17", issue_date: "2015-01-02" }, sess));
  await s.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, sess));
  await s.handler(get("doc/maslaka", sess));
  // also the failure paths
  await s.handler(post("start", { ...IDENTITY, national_id: "000000019" }));
  await s.handler(post("start", { ...IDENTITY, turnstile_token: undefined }));
  await e.handler(post("start", IDENTITY));
  } finally {
    Object.assign(console, saved);
  }
  assert.equal(consoleSeen.length, 0, "no console.* call with request data (spec section 6 row 6)");

  const all = [...s.lines, ...e.lines].join("\n");
  assert.ok(all.length > 0, "something was logged");
  for (const secret of [IDENTITY.first_name, IDENTITY.last_name, SYNTH_ID, "0501234567", "050-123-4567", "+972501234567", IDENTITY.email, IDENTITY.turnstile_token, token, TOKEN, URLID,
    ENGINE_SID, PNG_URL.slice(30, 80), HASH, IP, "test-agent"]) {
    assert.ok(!all.includes(secret), `a log line contains a value: ${secret.slice(0, 12)}`);
  }
});

// ---------------------------------------------------------------- final documents (policies step)
const S3 = "https://surense-accounts-docs.s3.eu-west-1.amazonaws.com";
const AGENCY = "5eed0000-0000-4000-8000-000000000001";
const DOC = (n: number) => `d3000000-0000-4000-8000-00000000000${n}`;
const LAST = { poa_consent_record: { approved_at: "2026-11-21T12:00:01Z", valid_until: null, modules: MODS({ maslaka: true, harbit: true, policies: true }), next: "done" } };

function docsKit(route: (url: string, init?: RequestInit) => Response | Promise<Response> = () => new Response(PDF, { headers: { "content-type": "application/pdf" } })) {
  const fetched = mockFetch((url, _b, init) => route(url, init));
  const puts: { path: string; bytes: Uint8Array; type: string }[] = [];
  const storage: Storage = {
    async put(path, bytes, type) {
      puts.push({ path, bytes, type });
      return "stored";
    },
  };
  const log = silentLog();
  return { fetched, puts, deps: { fetcher: createFinalDocFetcher({ fetch: fetched.fetch, log }), storage, log } };
}
const fromUrlScript = (over: Record<string, unknown> = {}) => (a: Record<string, unknown>) => ({
  linked: true, session_id: a.p_session, agency_id: AGENCY, document_id: DOC(a.p_kind === "maslaka" ? 1 : a.p_kind === "harbit" ? 2 : 3), stored: false, complete: false, ...over,
});
const policiesReq = () => post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession);

Deno.test("final docs: after the policies step each link is fetched (no Authorization), hashed, uploaded to poa/{agency}/{session}/{kind}-{doc}.pdf and recorded", async () => {
  const kit = docsKit();
  const urls = { swiftness: `${S3}/aaaaaaaa?X-Amz-Signature=1`, hb: `${S3}/bbbbbbbb?X-Amz-Signature=2`, policies: `${S3}/cccccccc?X-Amz-Signature=3` };
  const s = setup({
    engine: mockEngine({ finalUrls: urls }), finalDocs: kit.deps,
    script: { ...LAST, poa_document_from_url: fromUrlScript(), poa_document_stored: { ok: true } },
  });
  const res = await s.handler(policiesReq());
  assert.equal(res.status, 200);
  assert.deepEqual(keys(await res.json()), ["approved_at", "kind", "method", "modules", "next", "valid_until"], "the response shape is unchanged");
  const sha = await sha256Hex(PDF);
  assert.deepEqual(kit.fetched.calls.map((c) => c.url), [urls.swiftness, urls.hb, urls.policies]);
  for (const c of kit.fetched.calls) {
    const h = new Headers(c.init?.headers);
    assert.equal(h.get("authorization"), null, "pre-signed link: no Authorization header");
    assert.equal(c.init?.redirect, "manual");
    assert.equal(c.init?.credentials, "omit");
  }
  assert.deepEqual(s.rpc.calls.filter((c) => c.fn === "poa_document_from_url").map((c) => c.args), [
    { p_session: SID, p_kind: "maslaka", p_sha256: sha, p_source: "surense" }, { p_session: SID, p_kind: "harbit", p_sha256: sha, p_source: "surense" }, { p_session: SID, p_kind: "policies", p_sha256: sha, p_source: "surense" },
  ]);
  assert.deepEqual(kit.puts.map((p) => p.path), [
    `poa/${AGENCY}/${SID}/maslaka-${DOC(1)}.pdf`, `poa/${AGENCY}/${SID}/harbit-${DOC(2)}.pdf`, `poa/${AGENCY}/${SID}/policies-${DOC(3)}.pdf`,
  ]);
  assert.ok(kit.puts.every((p) => p.type === "application/pdf" && p.bytes.byteLength === PDF.byteLength));
  assert.deepEqual(s.rpc.calls.filter((c) => c.fn === "poa_document_stored").map((c) => c.args), [
    { p_document: DOC(1), p_path: `poa/${AGENCY}/${SID}/maslaka-${DOC(1)}.pdf`, p_sha256: sha },
    { p_document: DOC(2), p_path: `poa/${AGENCY}/${SID}/harbit-${DOC(2)}.pdf`, p_sha256: sha },
    { p_document: DOC(3), p_path: `poa/${AGENCY}/${SID}/policies-${DOC(3)}.pdf`, p_sha256: sha },
  ]);
  assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_session_fail"), "nothing failed");
  assert.ok(!s.lines.join("\n").includes("X-Amz"), "no link in the logs");
});

Deno.test("final docs: only the kinds that came with a link are stored; a non-policies step never fetches", async () => {
  const kit = docsKit();
  const s = setup({
    engine: mockEngine({ finalUrls: { policies: `${S3}/cccccccc?X-Amz-Signature=3` } }), finalDocs: kit.deps,
    script: { ...LAST, poa_document_from_url: fromUrlScript(), poa_document_stored: { ok: true } },
  });
  await s.handler(policiesReq());
  assert.equal(kit.fetched.calls.length, 1);
  assert.deepEqual(kit.puts.map((p) => p.path), [`poa/${AGENCY}/${SID}/policies-${DOC(3)}.pdf`]);
  const m = setup({ finalDocs: kit.deps, engine: mockEngine({ finalUrls: { policies: `${S3}/x` } }) });
  await m.handler(post("maslaka", { preview_sha256: HASH }, withSession));
  assert.equal(kit.fetched.calls.length, 1, "maslaka consent starts no download");
});

Deno.test("final docs: another host, http, an oversize file, a wrong type, a redirect, a non-PDF: refused; consent still 200 and a docs_ code is recorded", async () => {
  const pdfOk = () => new Response(PDF, { headers: { "content-type": "application/pdf" } });
  const cases: [string, (url: string) => Response | Promise<Response>, string, string][] = [
    ["other host", pdfOk, "https://evil.example.test/a?X-Amz-Signature=1", "docs_host"],
    ["http, not https", pdfOk, "http://surense-accounts-docs.s3.eu-west-1.amazonaws.com/a", "docs_host"],
    ["api host", pdfOk, "https://api.surense.com/files/1", "docs_host"],
    ["declared oversize", () => new Response(PDF, { headers: { "content-type": "application/pdf", "content-length": String(2 * 1024 * 1024 + 1) } }), `${S3}/a`, "docs_too_large"],
    ["streamed oversize", () => new Response(new Uint8Array(2 * 1024 * 1024 + 1).fill(37), { headers: { "content-type": "application/pdf" } }), `${S3}/a`, "docs_too_large"],
    ["wrong type", () => new Response(PDF, { headers: { "content-type": "text/html" } }), `${S3}/a`, "docs_type"],
    ["not a pdf", () => new Response(new TextEncoder().encode("<html>not a pdf</html>"), { headers: { "content-type": "application/pdf" } }), `${S3}/a`, "docs_not_pdf"],
    ["redirect", () => new Response(null, { status: 302, headers: { location: "https://evil.example.test/x" } }), `${S3}/a`, "docs_redirect"],
    ["403 (expired link)", () => new Response("denied", { status: 403 }), `${S3}/a`, "docs_http_403"],
  ];
  for (const [name, route, url, code] of cases) {
    const kit = docsKit(route);
    const s = setup({
      engine: mockEngine({ finalUrls: { policies: url } }), finalDocs: kit.deps,
      script: { ...LAST, poa_document_from_url: fromUrlScript(), poa_document_stored: { ok: true } },
    });
    const res = await s.handler(policiesReq());
    assert.equal(res.status, 200, `${name}: the consent response is not failed by the storage step`);
    assert.deepEqual(kit.puts, [], `${name}: nothing stored`);
    assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_document_from_url" || c.fn === "poa_document_stored"), `${name}: nothing recorded`);
    assert.deepEqual(s.rpc.calls.filter((c) => c.fn === "poa_session_fail").map((c) => c.args), [{ p_session: SID, p_code: code }], name);
    if (name === "other host" || name === "http, not https" || name === "api host") assert.equal(kit.fetched.calls.length, 0, `${name}: nothing left the process`);
    if (name === "redirect") assert.equal(kit.fetched.calls.length, 1, "the redirect target is never requested");
  }
});

Deno.test("final docs: storage / database failures never fail the consent; a closed docs switch is not a failure; one bad kind does not stop the others", async () => {
  const urls = { swiftness: `${S3}/a`, hb: `${S3}/b`, policies: `${S3}/c` };
  const ok = { ...LAST, poa_document_from_url: fromUrlScript(), poa_document_stored: { ok: true } };
  // the bucket write fails for every kind
  const bad = docsKit();
  bad.deps.storage = { put() { throw new StorageError(500); } };
  const s1 = setup({ engine: mockEngine({ finalUrls: urls }), finalDocs: bad.deps, script: ok });
  assert.equal((await s1.handler(policiesReq())).status, 200);
  assert.ok(!s1.rpc.calls.some((c) => c.fn === "poa_document_stored"), "nothing is recorded as stored when the upload failed");
  assert.deepEqual(s1.rpc.calls.filter((c) => c.fn === "poa_session_fail").map((c) => c.args), [{ p_session: SID, p_code: "docs_storage_500" }]);
  // the database refuses the row
  const k2 = docsKit();
  const s2 = setup({ engine: mockEngine({ finalUrls: urls }), finalDocs: k2.deps, script: { ...ok, poa_document_from_url: rpcError(500, "XX000") } });
  assert.equal((await s2.handler(policiesReq())).status, 200);
  assert.deepEqual(s2.rpc.calls.filter((c) => c.fn === "poa_session_fail").map((c) => c.args), [{ p_session: SID, p_code: "docs_db_500" }]);
  // switch off (423): not a failure, nothing further is attempted
  const k3 = docsKit();
  const s3 = setup({ engine: mockEngine({ finalUrls: urls }), finalDocs: k3.deps, script: { ...ok, poa_document_from_url: rpcError(423, "PT423") } });
  assert.equal((await s3.handler(policiesReq())).status, 200);
  assert.ok(!s3.rpc.calls.some((c) => c.fn === "poa_session_fail"));
  assert.equal(s3.rpc.calls.filter((c) => c.fn === "poa_document_from_url").length, 1, "the first 423 ends the attempt");
  // the first kind is on a bad host, the others are stored
  const k4 = docsKit();
  const s4 = setup({ engine: mockEngine({ finalUrls: { ...urls, swiftness: "https://evil.example.test/a" } }), finalDocs: k4.deps, script: ok });
  assert.equal((await s4.handler(policiesReq())).status, 200);
  assert.equal(k4.puts.length, 2, "harbit and policies are still stored");
  assert.deepEqual(s4.rpc.calls.filter((c) => c.fn === "poa_session_fail").map((c) => c.args), [{ p_session: SID, p_code: "docs_host" }]);
  // a row that already holds a stored file is left alone
  const k5 = docsKit();
  const s5 = setup({ engine: mockEngine({ finalUrls: { policies: `${S3}/c` } }), finalDocs: k5.deps, script: { ...ok, poa_document_from_url: fromUrlScript({ stored: true }) } });
  await s5.handler(policiesReq());
  assert.deepEqual(k5.puts, []);
  assert.ok(!s5.rpc.calls.some((c) => c.fn === "poa_document_stored"));
  // no finalDocs dependency (storage not configured): skipped silently
  const s6 = setup({ engine: mockEngine({ finalUrls: urls }), script: LAST });
  assert.equal((await s6.handler(policiesReq())).status, 200);
  assert.ok(!s6.rpc.calls.some((c) => c.fn === "poa_document_from_url"));
});

// ---------------------------------------------------------------- the native engine (own rendering; the tool fed afterwards by the ship job)
import { createNativeEngine } from "../_shared/poa/engine/native.ts";
import { rubikFonts } from "../_shared/pdfkit/fonts.ts";

const LICENSEE = { name: "Zz Agent", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" };
const NATIVE_CFG = { poa_config: { poa_enabled: true, poa_docs_enabled: true, engine: "native", native_shadow: false, turnstile_required: true, modules: { maslaka: true, harbit: true, policies: true } } };
const NATIVE_REF = {
  sid: "sid-native-1", url_id: "native", existing: false,
  i_first_name: "Dana", i_last_name: "Testov", i_national_id: SYNTH_ID, i_phone: "+972501234567", i_street: "Herzl 12", i_city: "Tel Aviv", i_zip: "6473912", i_marketing: false,
  l_name: LICENSEE.name, l_license: LICENSEE.license, l_phone: LICENSEE.phone, l_email: LICENSEE.email,
};
const nativeEngine = (licensee: typeof LICENSEE | null = LICENSEE) => createNativeEngine({ licensee, fonts: rubikFonts, log: silentLog(), now: () => NOW, newSid: () => "sid-native-1" });

function nativeSetup(o: { script?: Script; storagePut?: (p: string) => Promise<"stored" | "exists">; licensee?: typeof LICENSEE | null } = {}) {
  const puts: string[] = [];
  const base = setup({ script: {
    ...NATIVE_CFG,
    poa_session_get: session({ engine: "native", surense_customer_id: null, engine_ref: NATIVE_REF }),
    poa_document_from_url: { linked: true, session_id: SID, agency_id: "5eed0000-0000-4000-8000-000000000001", document_id: "d0000000-0000-4000-8000-0000000000d1", stored: false, complete: false },
    poa_document_stored: { ok: true }, poa_ship_enqueue: { ok: true, duplicate: false },
    ...(o.script ?? {}),
  } });
  const storage: Storage = { put: o.storagePut ?? (async (p) => (puts.push(p), "stored" as const)) };
  const handler = createPoaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret" }), rpc: base.rpc, log: silentLog(base.lines), engine: null, native: nativeEngine(o.licensee), storage: null,
    finalDocs: { fetcher: createFinalDocFetcher({ log: silentLog() }), storage, log: silentLog() }, fetch: base.f.fetch, now: () => NOW, wait: async () => {},
  });
  return { ...base, handler, puts };
}

Deno.test("native start: no Surense gate, no tool call; the reference stored holds the identity and licensee snapshot; refused without a licensee", async () => {
  const s = nativeSetup();
  const res = await s.handler(post("start", IDENTITY));
  assert.equal(res.status, 200);
  assert.deepEqual(keys(await res.json()), ["expires_at", "modules", "next", "session_token"]);
  assert.ok(!s.rpc.calls.some((c) => c.fn === "surense_gate"), "the write switch of the tool is not consulted: nothing is sent");
  assert.equal(s.f.calls.filter((c) => !c.url.includes("siteverify")).length, 0, "no network call besides Turnstile");
  const ref = s.rpc.calls.find((c) => c.fn === "poa_engine_ref_set")!.args.p_ref as Record<string, unknown>;
  assert.equal(ref.url_id, "native");
  assert.ok(!("customer_id" in ref));
  assert.equal(ref.i_national_id, SYNTH_ID);
  assert.equal(ref.i_zip, "6473912");
  assert.equal(ref.l_license, LICENSEE.license);
  const none = nativeSetup({ licensee: null });
  const r2 = await none.handler(post("start", IDENTITY));
  assert.equal(r2.status, 503);
  assert.deepEqual(await r2.json(), { error: "unavailable" });
  assert.deepEqual(none.rpc.calls.find((c) => c.fn === "poa_session_fail")!.args, { p_session: SID, p_code: "licensee_not_configured" });
});

Deno.test("native preview: a rendered PDF from the snapshot, hashed and recorded like the tool preview", async () => {
  const s = nativeSetup();
  const res = await s.handler(get("preview/maslaka", withSession));
  assert.equal(res.status, 200);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
  assert.equal(res.headers.get("x-poa-preview-sha256"), await sha256Hex(bytes));
  assert.deepEqual(s.rpc.calls.find((c) => c.fn === "poa_preview_set")!.args, { p_session: SID, p_kind: "maslaka", p_sha256: await sha256Hex(bytes) });
  assert.equal(s.f.calls.length, 0, "no network call");
});

Deno.test("native consent: records the approval, renders the final file with the evidence and stores it as source native under the mandated path", async () => {
  const s = nativeSetup();
  const res = await s.handler(post("harbit", { preview_sha256: HASH, birth_date: "1990-05-17", issue_date: "2015-01-01" }, withSession));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).next, "harbit");
  const rec = s.rpc.calls.find((c) => c.fn === "poa_consent_record")!;
  assert.deepEqual(rec.args.p_extra, { birth_date: "1990-05-17", issue_date: "2015-01-01" });
  const from = s.rpc.calls.find((c) => c.fn === "poa_document_from_url")!;
  assert.equal(from.args.p_kind, "harbit");
  assert.equal(from.args.p_source, "native");
  assert.match(from.args.p_sha256 as string, /^[0-9a-f]{64}$/);
  assert.deepEqual(s.puts, ["poa/5eed0000-0000-4000-8000-000000000001/" + SID + "/harbit-d0000000-0000-4000-8000-0000000000d1.pdf"]);
  assert.equal(s.rpc.calls.find((c) => c.fn === "poa_document_stored")!.args.p_path, s.puts[0]);
  assert.ok(!s.rpc.calls.some((c) => c.fn === "poa_session_fail"));
  assert.equal(s.f.calls.length, 0, "no network call");
});

Deno.test("native consent: the last module completes the session and queues the ship (not the launch); a closed queue leaves a ship_ code; a storage failure leaves a docs_ code", async () => {
  const last = { poa_consent_record: { kind: "policies", method: "signature", approved_at: "2026-11-21T12:00:01Z", valid_until: null, modules: MODS({ maslaka: true, harbit: true, policies: true }), next: "done" } };
  const s = nativeSetup({ script: last });
  const res = await s.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).next, "done");
  assert.ok(s.rpc.calls.some((c) => c.fn === "poa_session_complete"));
  assert.deepEqual(s.rpc.calls.find((c) => c.fn === "poa_ship_enqueue")!.args, { p_session: SID });
  assert.ok(!s.rpc.calls.some((c) => c.fn === "surense_job_enqueue"), "the launch is queued by the ship job, not here");
  assert.equal(s.puts.length, 1, "the signed policies file is stored");
  const closed = nativeSetup({ script: { ...last, poa_ship_enqueue: rpcError(423, "PT423", "feature_disabled:surense_enabled") } });
  assert.equal((await closed.handler(post("policies", { preview_sha256: HASH, signature_png: PNG_URL }, withSession))).status, 200);
  assert.deepEqual(closed.rpc.calls.find((c) => c.fn === "poa_session_fail")!.args, { p_session: SID, p_code: "ship_423" });
  const broken = nativeSetup({ storagePut: async () => { throw new StorageError(500); } });
  assert.equal((await broken.handler(post("maslaka", { preview_sha256: HASH }, withSession))).status, 200, "a storage failure never fails the consent");
  assert.deepEqual(broken.rpc.calls.find((c) => c.fn === "poa_session_fail")!.args, { p_session: SID, p_code: "docs_storage_500" });
});

Deno.test("native: a native session with no native engine configured is unavailable and the surense engine is never asked", async () => {
  const s = setup({ script: { poa_session_get: session({ engine: "native", engine_ref: NATIVE_REF }) } });
  const r = await s.handler(get("preview/maslaka", withSession));
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: "unavailable" });
  assert.equal(s.eng.calls.length, 0);
});
