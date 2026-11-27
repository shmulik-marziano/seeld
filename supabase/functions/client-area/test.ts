// deno test supabase/functions/client-area/  (synthetic data only; no network: RPC, SMS provider, Turnstile and storage are mocks)
import assert from "node:assert/strict";
import { collectingDefer } from "../_shared/background.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import {
  type ClientAreaDeps, createClientAreaHandler, LOGIN_BUCKET_MS, LOGIN_MIN_MS, MAX_HARB_JSON_BYTES, OTP, parseRequestCreate, parseRoute, parseStart, parseVerify, toClientError, XLSX_MIME,
} from "./handler.ts";
import { MICROPAY_OTP_URL } from "../_shared/sms/micropay.ts";
import { sha256Hex, TOKEN_RE } from "../_shared/poa/session.ts";
import { SYNTH_ID } from "../_shared/poa/fixtures.ts";
import type { ObjectSigner } from "../_shared/poa/storage.ts";
import type { Storage } from "../_shared/surense/storage.ts";
import { buildHarbXlsx, OTHER_HARB_ID, SYNTH_HARB_ID } from "../_shared/harb/fixtures.ts";

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

const HARB_DOC = "d7000000-0000-4000-8000-000000000001";
const HARB_PATH = `harb/5eed0000-0000-4000-8000-000000000001/c5000000-0000-4000-8000-000000000001/harb_xlsx-${HARB_DOC}.xlsx`;

function setup(o: {
  script?: Script; env?: Record<string, string>; sms?: (body: Record<string, unknown>) => Response; signer?: ObjectSigner | null; noSms?: boolean;
  storage?: Storage | null;
} = {}) {
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
    client_harb_status: { enabled: true, last: null },
    client_harb_add: { ok: true, duplicate: false, document_id: HARB_DOC, storage_path: HARB_PATH },
    client_harb_stored: { stored: true, queued: true },
    client_requests_list: { enabled: true, requests: [{ id: REQ, topic: "insurance", message: "Zz-question", contact: "phone", created_at: "2026-11-27T08:00:00Z", status: "received" }] },
    client_request_create: { id: REQ, created_at: "2026-11-27T08:00:00Z" },
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
  const puts: Array<{ path: string; bytes: Uint8Array; contentType: string }> = [];
  const storage: Storage | null = o.storage === undefined ? { put: async (path, bytes, contentType) => { puts.push({ path, bytes, contentType }); return "stored"; } } : o.storage;
  const bg = collectingDefer();
  const handler = createClientAreaHandler({
    env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret", ...(o.noSms ? {} : { SMS_API_TOKEN: SMS_TOKEN, SMS_SENDER_ID: "SEELD" }), ...(o.env ?? {}) }),
    rpc, log: silentLog(lines), signer, storage, fetch: f.fetch, now: () => clock,
    wait: async (ms) => { waits.push(ms); clock += ms; }, defer: bg.defer,
  });
  return { handler, rpc, lines, f, waits, puts, settle: bg.settle, tick: (ms: number) => (clock += ms) };
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
  // the SMS goes out after the answer (background), so the answer never waits on the provider
  await s.settle();
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

Deno.test("login/start: the provider's quota and a provider outage keep the same answer; an outage is reported to staff; Turnstile is skipped when the switch says so", async () => {
  const quota = setup({ sms: () => json({ status: 1, message: "MAX_SENT", data: { remoteIP: "x" } }) });
  assert.equal((await quota.handler(post("login/start", START))).status, 200);
  await quota.settle();
  assert.equal(quota.rpc.calls.filter((c) => c.fn === "sms_report").length, 0, "the client's own quota is not a provider failure");
  const down = setup({ sms: () => new Response("busy", { status: 503 }) });
  const r = await down.handler(post("login/start", START));
  assert.equal(r.status, 200, "a hit answers like a miss even while the provider is down");
  assert.deepEqual(keys(await r.json()), ["challenge_id", "expires_in_sec", "phone_tail"]);
  assert.deepEqual(down.waits, [LOGIN_MIN_MS]);
  await down.settle();
  const rep = down.rpc.calls.find((c) => c.fn === "sms_report")!;
  assert.equal(rep.args.p_ok, false);
  assert.match(String(rep.args.p_code), /^[a-z0-9_]{1,40}$/);
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
  // the count comes from the challenge (attempt 1 of OTP.maxTries), not from the provider's own number
  assert.deepEqual(await wrong.json(), { error: { code: "wrong_code", tries_left: 4 } });

  const locked = setup({ sms: () => json({ status: 1, message: "MAX_TRIES", data: { remoteIP: "x" } }) });
  assert.deepEqual(await (await locked.handler(post("login/verify", { challenge_id: CH, code: "000000" }))).json(), { error: { code: "max_tries" } });
  const dbLocked = setup({ script: { client_login_challenge_use: { status: "failed", matched: true, attempts: 10, phone: null } } });
  assert.deepEqual(await (await dbLocked.handler(post("login/verify", { challenge_id: CH, code: "123456" }))).json(), { error: { code: "max_tries" } });
  const expired = setup({ script: { client_login_challenge_use: rpcError(410, "PT410") } });
  assert.deepEqual(await (await expired.handler(post("login/verify", { challenge_id: CH, code: "123456" }))).json(), { error: { code: "expired" } });
  const miss = setup({ script: { client_login_challenge_use: { status: "pending", matched: false, attempts: 2, phone: null } } });
  const m = await miss.handler(post("login/verify", { challenge_id: CH, code: "123456" }));
  assert.deepEqual(await m.json(), { error: { code: "wrong_code", tries_left: 3 } });
  assert.equal(miss.f.calls.filter((c) => c.url === MICROPAY_OTP_URL).length, 0, "no provider call without a match");
  assert.ok(!miss.rpc.calls.some((c) => c.fn === "client_login_verify"));
});

Deno.test("login/verify: a hit and a miss answer alike on every attempt (2026-11-27 review: 10 - n against 5 - n told who is a client)", async () => {
  for (let n = 1; n <= OTP.maxTries + 2; n++) {
    const hit = setup({ script: { client_login_challenge_use: { status: "pending", matched: true, attempts: n, phone: PHONE } } });
    const miss = setup({ script: { client_login_challenge_use: { status: "pending", matched: false, attempts: n, phone: null } } });
    const a = await hit.handler(post("login/verify", { challenge_id: CH, code: "000000" }));
    const b = await miss.handler(post("login/verify", { challenge_id: CH, code: "000000" }));
    assert.equal(a.status, b.status, `attempt ${n}: status`);
    assert.deepEqual(await a.json(), await b.json(), `attempt ${n}: body`);
    if (n > OTP.maxTries) assert.equal(hit.f.calls.filter((c) => c.url === MICROPAY_OTP_URL).length, 0, "past the limit the provider is not asked");
    assert.deepEqual(hit.waits, miss.waits, `attempt ${n}: padded time`);
  }
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

// ---------------------------------------------------------------- Har HaBituach (client path)
const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const harbPost = async (bytes: Uint8Array, extra: Record<string, string> = auth) => post("harb", { bytes_base64: b64(bytes) }, extra);

Deno.test("harb: routes; the card follows the switch and shows the last file without its import details", async () => {
  assert.deepEqual(parseRoute("GET", "/client-area/harb"), { name: "harb_status" });
  assert.deepEqual(parseRoute("POST", "/client-area/harb"), { name: "harb_upload" });
  assert.equal(parseRoute("PUT", "/client-area/harb"), "method");
  const off = setup({ script: { client_harb_status: { enabled: false, last: null } } });
  assert.deepEqual(await (await off.handler(get("harb", auth))).json(), { enabled: false, last_upload: null });
  const on = setup({ script: { client_harb_status: { enabled: true, last: { id: HARB_DOC, created_at: "2026-11-25T08:00:00Z", import_status: "processed" } } } });
  assert.deepEqual(await (await on.handler(get("harb", auth))).json(), { enabled: true, last_upload: { created_at: "2026-11-25T08:00:00Z", processed: true } });
  assert.equal((await on.handler(get("harb"))).status, 401, "a session is required");
});

Deno.test("harb: a valid export -> id compared in SQL, bytes stored at the DB path, stored mark; nothing personal logged", async () => {
  const s = setup();
  const xlsx = await buildHarbXlsx();
  const res = await s.handler(await harbPost(xlsx));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { document_id: HARB_DOC, duplicate: false, queued: true });
  const add = s.rpc.calls.find((c) => c.fn === "client_harb_add")!;
  assert.deepEqual(add.args, { p_token_hash: bytea(await sha256Hex(TOKEN)), p_national_id: SYNTH_HARB_ID, p_sha256: await sha256Hex(xlsx), p_rows: 3 });
  assert.equal(s.puts.length, 1);
  assert.equal(s.puts[0].path, HARB_PATH);
  assert.equal(s.puts[0].contentType, XLSX_MIME);
  assert.deepEqual(s.puts[0].bytes, xlsx);
  assert.deepEqual(s.rpc.calls.find((c) => c.fn === "client_harb_stored")!.args, { p_token_hash: bytea(await sha256Hex(TOKEN)), p_document: HARB_DOC, p_path: HARB_PATH });
  const logs = s.lines.join("\n");
  assert.ok(!logs.includes(SYNTH_HARB_ID) && !logs.includes("12344"), "the id is never logged");
});

Deno.test("harb: refusals carry a reason code; a file of someone else never reaches storage", async () => {
  const reason = async (r: Response) => ({ status: r.status, body: await r.json() });
  const notX = setup();
  assert.deepEqual(await reason(await notX.handler(await harbPost(new TextEncoder().encode("Zz not a spreadsheet, just text bytes ".repeat(5))))),
    { status: 422, body: { error: { code: "harb_invalid", reason: "not_xlsx" } } });
  assert.equal(notX.rpc.calls.filter((c) => c.fn === "client_harb_add").length, 0, "refused before the database");

  const two = setup();
  assert.deepEqual((await reason(await two.handler(await harbPost(await buildHarbXlsx({ ids: [12344, Number(OTHER_HARB_ID)] }))))).body,
    { error: { code: "harb_invalid", reason: "id_mismatch" } });
  const empty = setup();
  assert.deepEqual((await reason(await empty.handler(await harbPost(await buildHarbXlsx({ ids: [] }))))).body, { error: { code: "harb_invalid", reason: "empty" } });

  const notMine = setup({ script: { client_harb_add: { ok: false, error: "id_mismatch" } } });
  const nm = await notMine.handler(await harbPost(await buildHarbXlsx()));
  assert.deepEqual(await reason(nm), { status: 422, body: { error: { code: "harb_invalid", reason: "id_mismatch" } } });
  assert.equal(notMine.puts.length, 0, "nothing stored");
  assert.equal(notMine.rpc.calls.filter((c) => c.fn === "client_harb_stored").length, 0);

  const big = setup();
  const huge = new Request(`${BASE}/harb`, { method: "POST", headers: { ...hdr(auth), "content-type": "application/json" }, body: "x".repeat(MAX_HARB_JSON_BYTES + 10) });
  assert.deepEqual((await reason(await big.handler(huge))).body, { error: { code: "harb_invalid", reason: "too_large" } });
  const shape = setup();
  assert.equal((await shape.handler(post("harb", { bytes_base64: "AAAA", extra: 1 }, auth))).status, 400, "unknown keys refused");
  assert.deepEqual((await reason(await shape.handler(post("harb", { bytes_base64: "not base64!" }, auth)))).body, { error: { code: "harb_invalid", reason: "not_xlsx" } });
});

Deno.test("harb: duplicate, switch off, storage down and an unconfigured bucket", async () => {
  const dup = setup({ script: { client_harb_add: { ok: true, duplicate: true, document_id: HARB_DOC } } });
  const d = await dup.handler(await harbPost(await buildHarbXlsx()));
  assert.deepEqual(await d.json(), { document_id: HARB_DOC, duplicate: true, queued: false });
  assert.equal(dup.puts.length, 0);

  const off = setup({ script: { client_harb_add: rpcError(423, "PT423", "feature_disabled:client_area_harb_upload_enabled") } });
  const o = await off.handler(await harbPost(await buildHarbXlsx()));
  assert.equal(o.status, 503);
  assert.deepEqual(await o.json(), { error: { code: "inactive" } });

  const down = setup({ storage: { put: async () => { throw new Error("boom"); } } });
  const dn = await down.handler(await harbPost(await buildHarbXlsx()));
  assert.equal(dn.status, 503);
  assert.equal(down.rpc.calls.filter((c) => c.fn === "client_harb_stored").length, 0, "no stored mark without the bytes");

  const none = setup({ storage: null });
  assert.equal((await none.handler(await harbPost(await buildHarbXlsx()))).status, 503);
});

const REQ = "d5300000-0000-4000-8000-000000000001";

Deno.test("requests: routes and the body parser (closed lists, trimmed message, 1000 max)", () => {
  assert.deepEqual(parseRoute("GET", "/client-area/requests"), { name: "requests_list" });
  assert.deepEqual(parseRoute("POST", "/client-area/requests"), { name: "request_create" });
  assert.equal(parseRoute("DELETE", "/client-area/requests"), "method");
  assert.deepEqual(parseRequestCreate({ topic: "savings", contact: "whatsapp", message: "  Zz  " }), { topic: "savings", message: "Zz", contact: "whatsapp" });
  assert.deepEqual(parseRequestCreate({ topic: "other", contact: "phone" }), { topic: "other", message: null, contact: "phone" });
  assert.throws(() => parseRequestCreate({ topic: "claims", contact: "phone" }));
  assert.throws(() => parseRequestCreate({ topic: "insurance", contact: "fax" }));
  assert.throws(() => parseRequestCreate({ topic: "insurance", contact: "phone", message: "x".repeat(1001) }));
  assert.throws(() => parseRequestCreate({ topic: "insurance", contact: "phone", extra: 1 }));
});

Deno.test("requests: list and create go through the token-scoped RPCs; the message is never logged", async () => {
  const s = setup();
  const list = await s.handler(get("requests", auth));
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), { enabled: true, requests: [{ id: REQ, topic: "insurance", message: "Zz-question", contact: "phone", created_at: "2026-11-27T08:00:00Z", status: "received" }] });
  const res = await s.handler(post("requests", { topic: "insurance", contact: "phone", message: "Zz-private-words" }, auth));
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { id: REQ, created_at: "2026-11-27T08:00:00Z" });
  assert.deepEqual(s.rpc.calls.find((c) => c.fn === "client_request_create")!.args,
    { p_token_hash: bytea(await sha256Hex(TOKEN)), p_topic: "insurance", p_message: "Zz-private-words", p_contact: "phone" });
  assert.ok(!s.lines.join("\n").includes("Zz-private-words"), "the message is not logged");
  assert.equal((await s.handler(post("requests", { topic: "x", contact: "phone" }, auth))).status, 400);
  assert.equal((await s.handler(get("requests"))).status, 401, "a session is required");
  const off = setup({ script: { client_requests_list: { enabled: false, requests: [] } } });
  assert.deepEqual(await (await off.handler(get("requests", auth))).json(), { enabled: false, requests: [] });
});
