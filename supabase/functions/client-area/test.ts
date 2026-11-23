// deno test supabase/functions/client-area/  (synthetic data only; no network: RPC, SMS provider, Turnstile and storage are mocks)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import { type ClientAreaDeps, createClientAreaHandler, LOGIN_BUCKET_MS, LOGIN_MIN_MS, parseRoute, parseStart, parseVerify, toClientError } from "./handler.ts";
import { MICROPAY_OTP_URL } from "../_shared/sms/micropay.ts";
import { sha256Hex, TOKEN_RE } from "../_shared/poa/session.ts";
import { SYNTH_ID } from "../_shared/poa/fixtures.ts";
import type { ObjectSigner } from "../_shared/poa/storage.ts";

const BASE = "https://example.supabase.co/functions/v1/client-area";
const ORIGIN = "https://seeld.co.il";
const IP = "203.0.113.9";
const CH = "c5000000-0000-4000-8000-0000000000c1";
const SID = "c5000000-0000-4000-8000-0000000000e1";
const DOC = "d5400000-0000-4000-8000-000000000001";
const PRODUCT = "d5100000-0000-4000-8000-000000000001";
const PHONE = "0501234567";
const SMS_TOKEN = "micropay-token-for-tests-aaaaaaaaaa";
const bytea = (hex: string) => `\\x${hex}`;
const NOW = Date.UTC(2026, 10, 23, 20, 0, 0);

type Script = Record<string, unknown | ((args: Record<string, unknown>) => unknown)>;

function setup(o: { script?: Script; env?: Record<string, string>; sms?: (body: Record<string, unknown>) => Response; signer?: ObjectSigner | null; noSms?: boolean } = {}) {
  const lines: string[] = [];
  let clock = NOW;
  const waits: number[] = [];
  const defaults: Script = {
    client_area_config: { enabled: true, turnstile_required: true },
    client_login_start: { challenge_id: CH, phone_tail: "67", expires_in_sec: 600, matched: true, phone: PHONE },
    client_login_challenge_use: { status: "pending", matched: true, attempts: 1, phone: PHONE },
    client_login_verify: { session_id: SID, expires_at: "2026-12-23T20:00:00Z", client: { first_name: "Zz", last_name: "Client" } },
    client_session_get: { session_id: SID, customer_id: "c5000000-0000-4000-8000-000000000001", expires_at: "2026-12-23T20:00:00Z", client: { first_name: "Zz", last_name: "Client", agency_name: "SEELD" } },
    client_portfolio_get: {
      as_of: "2026-11-20",
      products: [{ id: PRODUCT, source: "מסלקה_פנסיונית", company_id: 11, product_type: 1, modified_at: null, details: { accountPolicyNumber: "123456789", accumulation: 1000, shemTohnit: "Zz-Plan", idNumber: SYNTH_ID } }],
    },
    client_documents_list: { poa: [{ id: DOC, kind: "maslaka", created_at: "2026-11-22T10:00:00Z", downloadable: true }], surense: [{ id: "d5200000-0000-4000-8000-000000000001", name: "Zz-Doc.pdf", size_bytes: 1234, created_at: "2026-11-01T10:00:00Z", downloadable: false }] },
    client_document_get: { storage_path: "poa/a/b/maslaka-c.pdf", sha256: null, kind: "maslaka" },
    client_logout: { revoked: true },
  };
  const script = { ...defaults, ...(o.script ?? {}) };
  const rpc = mockRpc((fn, args) => {
    const v = script[fn];
    if (typeof v === "function") return (v as (a: Record<string, unknown>) => unknown)(args);
    if (v instanceof Error) throw v;
    return v ?? null;
  });
  const sms = o.sms ?? ((body) => body.code !== undefined
    ? json({ status: 1, message: body.code === "123456" ? "CODE_VALID" : "WRONG_CODE", data: { remoteIP: "x", ...(body.code === "123456" ? {} : { triesLeft: 3 }) } })
    : json({ status: 1, message: "CODE_SENT", data: { remoteIP: "x", channel: "sms" } }));
  const f = mockFetch((url, body) => {
    if (url.includes("siteverify")) return json({ success: true, hostname: "seeld.co.il" });
    if (url === MICROPAY_OTP_URL) return sms(JSON.parse(body));
    return json({}, 404);
  });
  const signer: ObjectSigner | null = o.signer === undefined
    ? { sign: async (path) => `https://example.supabase.co/storage/v1/object/sign/client-docs/${path}?token=signed-for-tests` }
    : o.signer;
  const handler = createClientAreaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret", ...(o.noSms ? {} : { SMS_API_TOKEN: SMS_TOKEN, SMS_SENDER_ID: "SEELD" }), ...(o.env ?? {}) }),
    rpc, log: silentLog(lines), signer, fetch: f.fetch, now: () => clock,
    wait: async (ms) => { waits.push(ms); clock += ms; },
  });
  return { handler, rpc, lines, f, waits, tick: (ms: number) => (clock += ms) };
}

const hdr = (extra: Record<string, string> = {}) => ({ origin: ORIGIN, "cf-connecting-ip": IP, "user-agent": "test-agent", ...extra });
const post = (path: string, body: unknown, extra: Record<string, string> = {}) =>
  new Request(`${BASE}/${path}`, { method: "POST", headers: { ...hdr(extra), "content-type": "application/json" }, body: JSON.stringify(body) });
const get = (path: string, extra: Record<string, string> = {}) => new Request(`${BASE}/${path}`, { method: "GET", headers: hdr(extra) });
const TOKEN = "T".repeat(43);
const auth = { authorization: `Bearer ${TOKEN}` };
const keys = (o: unknown) => Object.keys(o as object).sort();
const START = { national_id: SYNTH_ID, phone: "050-123-4567", turnstile_token: "ts-token-aaaaaaaaaa" };

Deno.test("routes and parsers", () => {
  assert.deepEqual(parseRoute("POST", "/functions/v1/client-area/login/start"), { name: "login_start" });
  assert.deepEqual(parseRoute("POST", "/client-area/login/verify"), { name: "login_verify" });
  assert.deepEqual(parseRoute("GET", "/client-area/me"), { name: "me" });
  assert.deepEqual(parseRoute("GET", `/client-area/documents/${DOC.toUpperCase()}`), { name: "document", id: DOC });
  assert.equal(parseRoute("GET", "/client-area/login/start"), "method");
  assert.equal(parseRoute("GET", "/client-area/documents/not-a-uuid"), null);
  assert.deepEqual(parseStart(START), { nationalId: SYNTH_ID, phone: PHONE, turnstileToken: "ts-token-aaaaaaaaaa" });
  assert.throws(() => parseStart({ national_id: "123456789", phone: PHONE }), /invalid_national_id/);
  assert.throws(() => parseStart({ national_id: SYNTH_ID, phone: "031234567" }), /invalid_phone/);
  assert.throws(() => parseStart({ national_id: SYNTH_ID, phone: PHONE, extra: 1 }), /unknown_key/);
  assert.deepEqual(parseVerify({ challenge_id: CH.toUpperCase(), code: "12 34 56" }), { challengeId: CH, code: "123456" });
  assert.throws(() => parseVerify({ challenge_id: CH, code: "abc" }), /invalid_code/);
  assert.equal(toClientError(rpcError(423, "PT423")).code, "inactive");
  assert.equal(toClientError(rpcError(401, "PT401")).code, "unauthenticated");
  assert.equal(toClientError(rpcError(410, "PT410")).code, "expired");
  assert.equal(toClientError(rpcError(429, "PT429")).status, 429);
  assert.equal(toClientError(new Error("x")).status, 500);
});

Deno.test("login/start: a match sends the code with the documented options and answers the contract keys; nothing personal is logged", async () => {
  const s = setup();
  const res = await s.handler(post("login/start", START));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { challenge_id: CH, phone_tail: "67", expires_in_sec: 600 });
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
  const start = s.rpc.calls.find((c) => c.fn === "client_login_start")!;
  assert.deepEqual(start.args, { p_national_id: SYNTH_ID, p_phone: PHONE, p_ip: IP, p_ua_hash: bytea(await sha256Hex("test-agent")) });
  const sms = s.f.calls.find((c) => c.url === MICROPAY_OTP_URL)!;
  assert.deepEqual(JSON.parse(sms.body), {
    token: SMS_TOKEN, phone: PHONE, type: "sms", codelen: "6", minvalid: "10", maxsms: "2", maxtries: "5", clearcodes: "send", smsfrom: "SEELD", lang: "he", webotp: "seeld.co.il",
  });
  assert.ok(s.f.calls.some((c) => c.url.includes("siteverify")), "Turnstile checked");
  const all = s.lines.join("\n");
  assert.ok(!all.includes(PHONE) && !all.includes(SYNTH_ID) && !all.includes(SMS_TOKEN), "no phone, id or token in the logs");
});

Deno.test("login/start: a miss answers the same keys, sends nothing and takes the same padded time", async () => {
  const hit = setup();
  const r1 = await hit.handler(post("login/start", START));
  assert.equal(r1.status, 200);
  const miss = setup({ script: { client_login_start: { challenge_id: CH, phone_tail: "67", expires_in_sec: 600, matched: false, phone: null } } });
  const r2 = await miss.handler(post("login/start", START));
  assert.equal(r2.status, 200);
  assert.deepEqual(keys(await r1.json()), keys(await r2.json()));
  assert.equal(miss.f.calls.filter((c) => c.url === MICROPAY_OTP_URL).length, 0, "no SMS for a miss");
  assert.deepEqual(hit.waits, [LOGIN_MIN_MS]);
  assert.deepEqual(miss.waits, [LOGIN_MIN_MS]);
  assert.ok(LOGIN_BUCKET_MS > 0);
});

Deno.test("login/start: the provider's quota keeps the same answer; a provider outage is unavailable; Turnstile is skipped when the switch says so", async () => {
  const quota = setup({ sms: () => json({ status: 1, message: "MAX_SENT", data: { remoteIP: "x" } }) });
  assert.equal((await quota.handler(post("login/start", START))).status, 200);
  const down = setup({ sms: () => new Response("busy", { status: 503 }) });
  const r = await down.handler(post("login/start", START));
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: { code: "unavailable" } });
  const noTs = setup({ script: { client_area_config: { enabled: true, turnstile_required: false } } });
  assert.equal((await noTs.handler(post("login/start", { national_id: SYNTH_ID, phone: PHONE }))).status, 200);
  assert.equal(noTs.f.calls.filter((c) => c.url.includes("siteverify")).length, 0);
  const noToken = setup({ noSms: true });
  assert.equal((await noToken.handler(post("login/start", START))).status, 503);
});

Deno.test("login/start: refusals before any DB call (origin, shape, Turnstile, switch off, rate limit)", async () => {
  const s = setup();
  assert.equal((await s.handler(post("login/start", START, { origin: "https://evil.example" }))).status, 403);
  assert.equal((await s.handler(post("login/start", { national_id: "1", phone: PHONE }))).status, 400);
  assert.equal(s.rpc.calls.length, 0);
  const closed = setup({ script: { client_area_config: { enabled: false, turnstile_required: true } } });
  const r = await closed.handler(post("login/start", START));
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: { code: "inactive" } });
  const limited = setup({ script: { client_login_start: rpcError(429, "PT429") } });
  const l = await limited.handler(post("login/start", START));
  assert.equal(l.status, 429);
  assert.equal(l.headers.get("retry-after"), "600");
  const badTs = setup();
  badTs.f.calls.length = 0;
  const bt = setup({ script: {} });
  // a rejected Turnstile answer never reaches the database
  const rej = mockFetch(() => json({ success: false, "error-codes": ["invalid-input-response"] }));
  const h = createClientAreaHandler({ env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret", SMS_API_TOKEN: SMS_TOKEN }), rpc: bt.rpc, log: silentLog(), signer: null, fetch: rej.fetch, wait: async () => {} });
  assert.equal((await h(post("login/start", START))).status, 400);
  assert.equal(bt.rpc.calls.filter((c) => c.fn === "client_login_start").length, 0);
});

Deno.test("login/verify: the right code opens a session (token returned once, hash to the DB); wrong code, lock, expiry and a miss map to their codes", async () => {
  const s = setup();
  const res = await s.handler(post("login/verify", { challenge_id: CH, code: "123456" }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(keys(body), ["client", "expires_at", "token"]);
  assert.match(body.token, TOKEN_RE);
  assert.deepEqual(body.client, { first_name: "Zz", last_name: "Client" });
  const v = s.rpc.calls.find((c) => c.fn === "client_login_verify")!;
  assert.equal(v.args.p_token_hash, bytea(await sha256Hex(body.token)));
  assert.equal(v.args.p_user_agent, "test-agent");
  assert.ok(!JSON.stringify(s.rpc.calls).includes(body.token), "the token itself never reaches the database");
  const sms = s.f.calls.find((c) => c.url === MICROPAY_OTP_URL)!;
  assert.deepEqual(JSON.parse(sms.body), { token: SMS_TOKEN, phone: PHONE, code: "123456" });
  assert.deepEqual(s.waits, [LOGIN_MIN_MS]);

  const wrong = await s.handler(post("login/verify", { challenge_id: CH, code: "000000" }));
  assert.equal(wrong.status, 400);
  assert.deepEqual(await wrong.json(), { error: { code: "wrong_code", tries_left: 3 } });

  const locked = setup({ sms: () => json({ status: 1, message: "MAX_TRIES", data: { remoteIP: "x" } }) });
  assert.deepEqual(await (await locked.handler(post("login/verify", { challenge_id: CH, code: "000000" }))).json(), { error: { code: "max_tries" } });
  const dbLocked = setup({ script: { client_login_challenge_use: { status: "failed", matched: true, attempts: 10, phone: null } } });
  assert.deepEqual(await (await dbLocked.handler(post("login/verify", { challenge_id: CH, code: "123456" }))).json(), { error: { code: "max_tries" } });
  const expired = setup({ script: { client_login_challenge_use: rpcError(410, "PT410") } });
  assert.deepEqual(await (await expired.handler(post("login/verify", { challenge_id: CH, code: "123456" }))).json(), { error: { code: "expired" } });
  const miss = setup({ script: { client_login_challenge_use: { status: "pending", matched: false, attempts: 2, phone: null } } });
  const m = await miss.handler(post("login/verify", { challenge_id: CH, code: "123456" }));
  assert.deepEqual(await m.json(), { error: { code: "wrong_code", tries_left: 8 } });
  assert.equal(miss.f.calls.filter((c) => c.url === MICROPAY_OTP_URL).length, 0, "no provider call without a match");
  assert.ok(!miss.rpc.calls.some((c) => c.fn === "client_login_verify"));
});

Deno.test("session routes: Bearer token required; an unknown token is 401 and counts as a refusal", async () => {
  const s = setup();
  assert.equal((await s.handler(get("me"))).status, 401);
  assert.equal((await s.handler(get("me", { authorization: "Bearer short" }))).status, 401);
  const unknown = setup({ script: { client_session_get: rpcError(401, "PT401") } });
  const r = await unknown.handler(get("me", auth));
  assert.equal(r.status, 401);
  assert.deepEqual(await r.json(), { error: { code: "unauthenticated" } });
  const closed = setup({ script: { client_session_get: rpcError(423, "PT423") } });
  assert.equal((await closed.handler(get("me", auth))).status, 503);
});

Deno.test("me / portfolio / documents: shaped, masked, token-scoped", async () => {
  const s = setup();
  const me = await s.handler(get("me", auth));
  assert.equal(me.status, 200);
  const mb = await me.json();
  assert.deepEqual(keys(mb), ["client", "data_as_of", "session", "summary"]);
  assert.deepEqual(mb.client, { first_name: "Zz", last_name: "Client", agency_name: "SEELD" });
  assert.equal(mb.data_as_of, "2026-11-20");
  assert.deepEqual(mb.summary, { products: 1, categories: [{ key: "pension", label: "פנסיה", count: 1 }] });
  assert.equal(s.rpc.calls.find((c) => c.fn === "client_session_get")!.args.p_token_hash, bytea(await sha256Hex(TOKEN)));

  const pf = await (await s.handler(get("portfolio", auth))).json();
  assert.deepEqual(keys(pf), ["as_of", "categories"]);
  const p = pf.categories[0].products[0];
  assert.equal(p.policy_number_masked, "****6789");
  assert.equal(p.type_label, "קרן פנסיה חדשה מקיפה");
  assert.equal(p.balance, 1000);
  assert.ok(!JSON.stringify(pf).includes(SYNTH_ID) && !JSON.stringify(pf).includes("123456789"), "no id, no full policy number");

  const dl = await (await s.handler(get("documents", auth))).json();
  assert.deepEqual(dl, { documents: [
    { id: DOC, title: "ייפוי כוח למסלקה הפנסיונית", kind: "maslaka", created_at: "2026-11-22T10:00:00Z", size_bytes: null, downloadable: true },
    { id: "d5200000-0000-4000-8000-000000000001", title: "Zz-Doc.pdf", kind: "surense", created_at: "2026-11-01T10:00:00Z", size_bytes: 1234, downloadable: false },
  ] });

  const one = await s.handler(get(`documents/${DOC}`, auth));
  assert.equal(one.status, 200);
  const ob = await one.json();
  assert.equal(ob.expires_in_sec, 300);
  assert.ok(ob.url.startsWith("https://example.supabase.co/storage/v1/object/sign/client-docs/poa/a/b/maslaka-c.pdf"));
  assert.equal(s.rpc.calls.find((c) => c.fn === "client_document_get")!.args.p_document, DOC);
  assert.ok(!s.lines.join("\n").includes("signed-for-tests"), "the signed url is never logged");

  const notMine = setup({ script: { client_document_get: rpcError(404, "PT404") } });
  assert.deepEqual(await (await notMine.handler(get(`documents/${DOC}`, auth))).json(), { error: { code: "not_found" } });
  const noSigner = setup({ signer: null });
  assert.equal((await noSigner.handler(get(`documents/${DOC}`, auth))).status, 503);
  const gone = setup({ signer: { sign: async () => null } });
  assert.equal((await gone.handler(get(`documents/${DOC}`, auth))).status, 404);
});

Deno.test("logout: 204 and the hash goes to the database; a repeated logout is still 204", async () => {
  const s = setup();
  const r = await s.handler(post("logout", {}, auth));
  assert.equal(r.status, 204);
  assert.equal(s.rpc.calls.find((c) => c.fn === "client_logout")!.args.p_token_hash, bytea(await sha256Hex(TOKEN)));
  const again = setup({ script: { client_logout: { revoked: false } } });
  assert.equal((await again.handler(post("logout", {}, auth))).status, 204);
});

Deno.test("unconfigured function: 503 unavailable; unknown route 404; wrong method 405; preflight 204", async () => {
  const h = createClientAreaHandler({ env: testEnv(), rpc: null, log: silentLog(), signer: null });
  assert.equal((await h(post("login/start", START))).status, 503);
  assert.equal((await h(get("nothing"))).status, 404);
  assert.equal((await h(get("login/start"))).status, 405);
  assert.equal((await h(new Request(`${BASE}/me`, { method: "OPTIONS", headers: { origin: ORIGIN } }))).status, 204);
});

Deno.test("deps shape", () => {
  const d: ClientAreaDeps = { env: testEnv(), rpc: null, log: silentLog(), signer: null };
  assert.ok(d);
});
