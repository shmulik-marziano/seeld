// deno test supabase/functions/_shared/poa/  (synthetic data only; no network: every fetch is a mock)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog } from "../test_helpers.ts";
import { RpcError } from "../db.ts";
import { SurenseError } from "../surense/errors.ts";
import { assertAllowedUrl } from "../surense/client.ts";
import type { SurenseApi } from "../surense/api.ts";
import { createDpClient, isBareHost, jarHeaders, mergeSetCookies, PREVIEW_OP } from "./dp.ts";
import { DEFAULT_DP_BASE } from "./config.ts";
import { PoaHttpError, PoaToolError, kindFromToolStatus, toPoaError } from "./errors.ts";
import { createSurenseEngine, finalUrlsOf, isActiveStatus, parseUrlId, pickLicensee, pickSwiftnessAccount } from "./engine/surense.ts";
import type { PoaIdentity } from "./engine/types.ts";
import { createPoaRpc, failCode, nextOf, parseModules } from "./rpc.ts";
import { loadPoaEnv } from "./config.ts";
import { generateToken, hashToken, TOKEN_RE } from "./session.ts";
import { PNG_URL, SYNTH_ID } from "./fixtures.ts";

const CID = "c0000000-0000-4000-8000-000000000001";
const OTHER = "c0000000-0000-4000-8000-000000000009";
const LIC = "10000000-0000-4000-8000-000000000001";
const ACC = "a0000000-0000-4000-8000-000000000001";
const URLID = "AbCd1234Ef";
const SID = "11111111-1111-4111-8111-111111111111";
const WHO: PoaIdentity = {
  firstName: "Dana", lastName: "Test", nationalId: SYNTH_ID, phone: "+972501234567", email: "dana@example.com", street: "Herzl 12", city: "Tel Aviv", zip: "6473912", marketingApproved: false,
};
const ALL = { maslaka: true, harbit: true, policies: true };
const REF = { customerId: CID, urlId: URLID, sid: SID, existing: false };
const PDF = new TextEncoder().encode("%PDF-1.4\nsynthetic");
const ACTIVE = "פעיל"; // the tool's Hebrew word for "active"
const INACTIVE = "לא פעיל";

type Calls = { name: string; arg?: unknown }[];

function fakeApi(over: { create?: (r: Record<string, unknown>) => unknown; search?: () => unknown; invite?: (r: Record<string, unknown>) => unknown } = {}) {
  const calls: Calls = [];
  const api = {
    customers: {
      create: async (r: Record<string, unknown>) => {
        calls.push({ name: "create", arg: r });
        return (over.create ?? (() => ({ id: CID })))(r);
      },
      search: async () => {
        calls.push({ name: "search" });
        return (over.search ?? (() => ({ results: [{ id: OTHER }] })))();
      },
    },
    licensees: { list: async () => (calls.push({ name: "licensees" }), [{ id: "10000000-0000-4000-8000-0000000000ff", archived: true }, { id: LIC, name: "x" }]) },
    swiftness: { accountsList: async () => (calls.push({ name: "accounts" }), [{ id: ACC, status: ACTIVE, defaultAccount: true }]) },
    proxies: {
      invite: async (r: Record<string, unknown>) => {
        calls.push({ name: "invite", arg: r });
        return (over.invite ?? (() => ({ url: `https://app.surense.com/app/p/${URLID}`, message: "do not forward" })))(r);
      },
    },
  } as unknown as SurenseApi;
  return { api, calls };
}

/** the page session lives in cookies: load sets them (as the tool does), start refreshes the XSRF token */
const COOKIE_LOAD = new Headers([["content-type", "application/json"], ["set-cookie", "connect.sid=s%3Aabc.def; Path=/; HttpOnly; Secure; SameSite=None"], ["set-cookie", "XSRF-TOKEN=tok%2D1; Path=/; Secure"]]);
function dpFetch(over: Partial<{ load: Response; start: Response }> = {}) {
  return mockFetch((url) => {
    if (url.includes("proxies/load")) return over.load ?? new Response(JSON.stringify({ sid: SID }), { status: 200, headers: COOKIE_LOAD });
    if (url.includes("proxies/start")) return over.start ?? json({ ok: true }, 200, { "set-cookie": "XSRF-TOKEN=tok%2D2; Path=/; Secure" });
    if (url.includes("proxies_preview")) return new Response(PDF, { status: 200, headers: { "content-type": "application/pdf" } });
    return json({ ok: true });
  });
}

function engineWith(api: SurenseApi, f = dpFetch(), managerId: string | null = "b0000000-0000-4000-8000-000000000001") {
  const audit: unknown[][] = [];
  const dp = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f.fetch, audit: async (op, ref, status, phase) => void audit.push([op, ref, status, phase]) });
  return { engine: createSurenseEngine({ api, dp, managerId, log: silentLog(), newSid: () => SID }), f, audit };
}

// ---------------------------------------------------------------- engine
Deno.test("engine start: customer -> licensee -> account -> invite (url only) -> dp load -> dp start", async () => {
  const { api, calls } = fakeApi();
  const { engine, f, audit } = engineWith(api);
  const out = await engine.start(WHO, ALL);
  assert.deepEqual(calls.map((c) => c.name), ["create", "licensees", "accounts", "invite"]);
  assert.deepEqual(out, { customerId: CID, urlId: URLID, sid: SID, existing: false, cookie: "connect.sid=s%3Aabc.def; XSRF-TOKEN=tok%2D2", modules: ALL });
  const create = calls[0].arg as Record<string, unknown>;
  assert.equal(create.managerId, "b0000000-0000-4000-8000-000000000001");
  assert.equal(create.idNumber, SYNTH_ID);
  assert.equal(create.phoneNumber1, "+972501234567");
  assert.equal(create.street, "Herzl", "street without the house number");
  assert.equal(create.streetNumber, "12");
  assert.equal(create.city, "Tel Aviv");
  assert.equal(create.postalCode, 6473912, "zip as the tool's integer postalCode");
  const inv = calls[3].arg as Record<string, unknown>;
  assert.deepEqual(inv, {
    customerId: CID, licenseeId: LIC, cellNumber: "+972501234567", email: "dana@example.com",
    nispahAlef: true, swiftnessAccountId: ACC, nispahHei: true, nispahBet: true,
  });
  assert.equal(f.calls.length, 2);
  assert.ok(f.calls[0].url.startsWith("https://dp.example.test/api/proxies/load"));
  // as the page itself: sid and names null on load, the server mints the sid (verified 2026-11-22 in the page bundle)
  assert.deepEqual(JSON.parse(f.calls[0].body), { sid: null, urlId: URLID, firstName: null, lastName: null });
  assert.deepEqual(JSON.parse(f.calls[1].body), {
    sid: SID, firstName: "Dana", lastName: "Test", idType: 1, idNumber: SYNTH_ID, email: "dana@example.com", cellNumber: "+972501234567",
    employerName: null, notes: null, termsPrivacyApproved: true, marketingApproved: false,
  });
  // the page session is cookies (verified 2026-11-22): nothing on load, then everything the tool set, plus X-XSRF-TOKEN
  const hdr = (i: number) => f.calls[i].init?.headers as Record<string, string>;
  assert.equal(hdr(0).cookie, undefined, "load carries no cookie");
  assert.equal(hdr(0).origin, "https://surense.com");
  assert.equal(hdr(1).cookie, "connect.sid=s%3Aabc.def; XSRF-TOKEN=tok%2D1");
  assert.equal(hdr(1)["x-xsrf-token"], "tok-1", "axios decodes the XSRF cookie into the header");
  assert.equal(out.cookie, "connect.sid=s%3Aabc.def; XSRF-TOKEN=tok%2D2", "the reference keeps the jar as refreshed by start");
  assert.ok(!f.calls.some((c) => c.body.includes("do not forward")));
  // every dp call is audited: pending then result, ref = the customer id, no values
  assert.deepEqual(audit, [
    ["poa.dp.load", CID, null, "pending"], ["poa.dp.load", CID, 200, "result"],
    ["poa.dp.start", CID, null, "pending"], ["poa.dp.start", CID, 200, "result"],
  ]);
});

Deno.test("engine start: only the enabled modules are invited; no account lookup without maslaka", async () => {
  const { api, calls } = fakeApi();
  const { engine } = engineWith(api);
  await engine.start(WHO, { maslaka: false, harbit: true, policies: false });
  assert.deepEqual(calls.map((c) => c.name), ["create", "licensees", "invite"]);
  assert.deepEqual(calls[2].arg, { customerId: CID, licenseeId: LIC, cellNumber: "+972501234567", email: "dana@example.com", nispahHei: true });
  await assert.rejects(engine.start(WHO, { maslaka: false, harbit: false, policies: false }), (e) => e instanceof PoaToolError && e.code === "no_modules");
});

Deno.test("engine start: fails closed without a manager id or a usable link", async () => {
  const a = fakeApi();
  await assert.rejects(engineWith(a.api, dpFetch(), null).engine.start(WHO, ALL), (e) => e instanceof PoaToolError && e.kind === "unavailable" && e.code === "manager_id_missing");
  assert.equal(a.calls.length, 0, "nothing was sent to Surense");
  const b = fakeApi({ invite: () => ({ url: "https://app.surense.com/somewhere/else" }) });
  await assert.rejects(engineWith(b.api).engine.start(WHO, ALL), (e) => e instanceof PoaToolError && e.code === "bad_invite_url");
});

Deno.test("engine start: duplicate phone/e-mail (40204) retries with forceCreation; duplicate id (40205) reuses the customer and flags it", async () => {
  let n = 0;
  const a = fakeApi({ create: (r) => {
    if (++n === 1) throw new SurenseError(400, "40204", "permanent");
    assert.equal(r.forceCreation, true);
    return { id: CID };
  } });
  const out = await engineWith(a.api).engine.start(WHO, ALL);
  assert.equal(out.customerId, CID);
  assert.equal(out.existing, false);

  const b = fakeApi({ create: () => { throw new SurenseError(400, "40205", "permanent"); } });
  const o2 = await engineWith(b.api).engine.start(WHO, ALL);
  assert.equal(o2.customerId, OTHER);
  assert.equal(o2.existing, true, "flag kept server side only");
  assert.deepEqual(b.calls.map((c) => c.name).slice(0, 3), ["create", "search", "licensees"]);

  // an ambiguous create is never papered over
  const c = fakeApi({ create: () => { throw new SurenseError(0, "timeout", "unavailable").asAmbiguous(); } });
  await assert.rejects(engineWith(c.api).engine.start(WHO, ALL), (e) => e instanceof SurenseError && e.ambiguous);
  // a duplicate whose owner cannot be found stays opaque
  const d = fakeApi({ create: () => { throw new SurenseError(400, "40205", "permanent"); }, search: () => ({ results: [] }) });
  await assert.rejects(engineWith(d.api).engine.start(WHO, ALL), (e) => e instanceof PoaToolError && e.code === "customer_conflict");
});

Deno.test("engine consent: swiftness {sid}, hb {sid,dates}, policies {sid,signature}; preview flags sw|hb|p; cookies travel with the reference", async () => {
  const { engine, f } = engineWith(fakeApi().api);
  const ref = { ...REF, cookie: "connect.sid=s%3Aabc.def; XSRF-TOKEN=tok%2D2" };
  await engine.consent(ref, "maslaka", {});
  assert.equal((f.calls[0].init?.headers as Record<string, string>).cookie, "connect.sid=s%3Aabc.def; XSRF-TOKEN=tok%2D2");
  assert.equal((f.calls[0].init?.headers as Record<string, string>)["x-xsrf-token"], "tok-2");
  await engine.consent(ref, "harbit", { birthDate: "1990-05-17", issueDate: "2015-01-02" });
  await engine.consent(ref, "policies", { signaturePng: PNG_URL });
  assert.ok(f.calls[0].url.includes("/proxies/swiftness"));
  assert.deepEqual(JSON.parse(f.calls[0].body), { sid: SID });
  assert.deepEqual(JSON.parse(f.calls[1].body), { sid: SID, birthDate: "1990-05-17", nationalIdCardIssuingDate: "2015-01-02" });
  assert.deepEqual(JSON.parse(f.calls[2].body), { sid: SID, signature: PNG_URL });
  await assert.rejects(engine.consent(REF, "harbit", { birthDate: "1990-05-17" }), (e) => e instanceof PoaToolError && e.code === "bad_consent_data");
  await assert.rejects(engine.consent(REF, "policies", { signaturePng: "data:text/plain;base64,AAAA" }), (e) => e instanceof PoaToolError && e.code === "bad_consent_data");
  for (const [kind, flag] of [["maslaka", "sw"], ["harbit", "hb"], ["policies", "p"]] as const) {
    const bytes = await engine.preview(ref, kind);
    assert.equal((f.calls[f.calls.length - 1].init?.headers as Record<string, string>).cookie, ref.cookie, "preview carries the jar too");
    assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
    const u = new URL(f.calls[f.calls.length - 1].url);
    assert.equal(u.searchParams.get(flag), "true", "verified 2026-11-22: ?sw=true | hb=true | p=true");
    assert.equal(u.searchParams.get("flag"), null);
    assert.equal(u.searchParams.get("sid"), SID);
    assert.equal(u.searchParams.size, 2);
  }
});

const S3 = "https://surense-accounts-docs.s3.eu-west-1.amazonaws.com";
Deno.test("engine consent policies: returns the pre-signed links (swiftness optional); other kinds return {}", async () => {
  const f = mockFetch((url) => {
    if (url.includes("proxies/policies")) {
      return json({ nextStep: 7, hbProxyUrl: `${S3}/aaaa?X-Amz-Signature=x`, policiesProxyUrl: `${S3}/bbbb?X-Amz-Signature=y`, swiftnessProxyUrl: `${S3}/cccc?X-Amz-Signature=z` });
    }
    return json({ nextStep: 5, sid: SID });
  });
  const { engine } = engineWith(fakeApi().api, f);
  assert.deepEqual(await engine.consent(REF, "maslaka", {}), {});
  assert.deepEqual(await engine.consent(REF, "harbit", { birthDate: "1990-05-17", issueDate: "2015-01-02" }), {});
  assert.deepEqual(await engine.consent(REF, "policies", { signaturePng: PNG_URL }), {
    hb: `${S3}/aaaa?X-Amz-Signature=x`, policies: `${S3}/bbbb?X-Amz-Signature=y`, swiftness: `${S3}/cccc?X-Amz-Signature=z`,
  });
  assert.deepEqual(finalUrlsOf({ hbProxyUrl: 5, policiesProxyUrl: "", swiftnessProxyUrl: null }), {}, "non-strings and empty values are dropped");
  assert.deepEqual(finalUrlsOf({ nextStep: 7, policiesProxyUrl: `${S3}/b` }), { policies: `${S3}/b` });
});

Deno.test("dp jar: Set-Cookie merge (repeat, expire, oversize), Cookie + X-XSRF-TOKEN headers, a refreshed jar is written back to the reference", async () => {
  const jar = { cookie: "" };
  mergeSetCookies(jar, new Response("", { headers: new Headers([["set-cookie", "a=1; Path=/"], ["set-cookie", "XSRF-TOKEN=x%3Dy; Secure"]]) }));
  assert.equal(jar.cookie, "a=1; XSRF-TOKEN=x%3Dy");
  assert.deepEqual(jarHeaders(jar), { cookie: "a=1; XSRF-TOKEN=x%3Dy", "x-xsrf-token": "x=y" });
  mergeSetCookies(jar, new Response("", { headers: new Headers([["set-cookie", "a=2"], ["set-cookie", "b=3; Max-Age=0"], ["set-cookie", "c=4; Expires=Thu, 01 Jan 1970 00:00:00 GMT"]]) }));
  assert.equal(jar.cookie, "a=2; XSRF-TOKEN=x%3Dy", "a replaced; expired b and c never kept");
  mergeSetCookies(jar, new Response("", { headers: new Headers([["set-cookie", "a=; Path=/"]]) }));
  assert.equal(jar.cookie, "XSRF-TOKEN=x%3Dy", "an empty value removes the cookie");
  const before = jar.cookie;
  mergeSetCookies(jar, new Response("", { headers: new Headers([["set-cookie", `huge=${"z".repeat(1500)}`]]) }));
  assert.equal(jar.cookie, before, "a jar past the reference's size keeps the previous jar");
  assert.deepEqual(jarHeaders(undefined), {});
  assert.deepEqual(jarHeaders({ cookie: "" }), {});
  // the engine writes the refreshed jar back to the reference it was given, also when the call fails
  const f = mockFetch((url) => url.includes("proxies/swiftness") ? json({ error: { code: "X" } }, 400, { "set-cookie": "XSRF-TOKEN=fresh" }) : json({}));
  const { engine } = engineWith(fakeApi().api, f);
  const ref = { ...REF, cookie: "XSRF-TOKEN=old" };
  await assert.rejects(engine.consent(ref, "maslaka", {}));
  assert.equal(ref.cookie, "XSRF-TOKEN=fresh");
});

Deno.test("dp client: the default base path is /api/v1/ifs/public", async () => {
  assert.equal(DEFAULT_DP_BASE, "/api/v1/ifs/public");
  const f = dpFetch();
  const dp = createDpClient({ host: "dp.example.test", basePath: DEFAULT_DP_BASE, log: silentLog(), fetch: f.fetch });
  await dp.post("swiftness", { sid: SID }, null);
  assert.equal(f.calls[0].url, "https://dp.example.test/api/v1/ifs/public/proxies/swiftness");
});

Deno.test("dp client: a 400 maps to the generic kind (one mapping, kindFromToolStatus); the tool's reason joins the code, values stripped", async () => {
  const f = mockFetch(() => json({ message: "x" }, 400));
  const dp = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f.fetch });
  await assert.rejects(dp.post("start", { sid: SID }, null), (e) => e instanceof PoaToolError && e.kind === "generic" && e.code === "dp_http_400_x");
  assert.equal(kindFromToolStatus(400), "generic");
  const f2 = mockFetch(() => json({ error: { code: "SESSION_NOT_FOUND", displayMessage: "התהליך לא נמצא" } }, 400));
  const dp2 = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f2.fetch });
  await assert.rejects(dp2.post("start", { sid: SID }, null), (e) => e instanceof PoaToolError && e.code === "dp_http_400_SESSION_NOT_FOUND");
  const f3 = mockFetch(() => json({ error: { displayMessage: `מספר סלולרי לא חוקי ${SYNTH_ID} dana@example.com` } }, 400));
  const dp3 = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f3.fetch });
  await assert.rejects(dp3.post("start", { sid: SID }, null), (e) => e instanceof PoaToolError && e.code === "dp_http_400_מספר_סלולרי_לא_חוקי");
  const f4 = mockFetch(() => new Response("<html>nope</html>", { status: 400 }));
  const dp4 = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f4.fetch });
  await assert.rejects(dp4.post("start", { sid: SID }, null), (e) => e instanceof PoaToolError && e.code === "dp_http_400");
});

Deno.test("engine start: a 'no session' refusal of start opens the page again exactly once; other refusals do not", async () => {
  let starts = 0;
  const f = mockFetch((url) => {
    if (url.includes("proxies/load")) return json({ sid: SID }, 200, { "set-cookie": "connect.sid=fresh" });
    if (url.includes("proxies/start")) return ++starts === 1 ? json({ error: { displayMessage: "אין session או session פג תוקף" } }, 400) : json({ nextStep: 4, sid: SID });
    return json({});
  });
  const { engine } = engineWith(fakeApi().api, f);
  const out = await engine.start(WHO, ALL);
  assert.equal(starts, 2);
  assert.equal(f.calls.filter((c) => c.url.includes("proxies/load")).length, 2, "load, start (refused), load, start");
  assert.equal(out.cookie, "connect.sid=fresh");
  let n = 0;
  const g = mockFetch((url) => url.includes("proxies/load") ? json({ sid: SID }) : (n++, json({ error: { displayMessage: "מספר סלולרי לא חוקי" } }, 400)));
  await assert.rejects(engineWith(fakeApi().api, g).engine.start(WHO, ALL), (e) => e instanceof PoaToolError && e.code === "dp_http_400_מספר_סלולרי_לא_חוקי");
  assert.equal(n, 1, "a validation refusal is not retried");
  let m = 0;
  const h = mockFetch((url) => url.includes("proxies/load") ? json({ sid: SID }) : (m++, json({ error: { displayMessage: "אין session" } }, 400)));
  await assert.rejects(engineWith(fakeApi().api, h).engine.start(WHO, ALL), (e) => e instanceof PoaToolError && /session/.test(e.code));
  assert.equal(m, 2, "one retry, then the refusal surfaces");
});

Deno.test("engine start: a load answer without the server's sid stops before start (dp_no_sid)", async () => {
  const { api, calls } = fakeApi();
  const f = dpFetch({ load: json({ skipWelcomeStep: true }) });
  const { engine } = engineWith(api, f);
  await assert.rejects(engine.start(WHO, ALL), (e) => e instanceof PoaToolError && e.code === "dp_no_sid");
  assert.equal(f.calls.length, 1, "start was never sent");
  assert.ok(calls.some((c) => c.name === "invite"));
});

Deno.test("engine helpers: link id, licensee and account picking, status shapes", () => {
  assert.equal(parseUrlId(`https://app.surense.com/app/p/${URLID}`), URLID);
  assert.equal(parseUrlId(`https://app.surense.com/app/p/${URLID}/`), URLID);
  assert.equal(parseUrlId(`https://app.surense.com/app/p/${URLID}?x=1`), URLID);
  assert.equal(parseUrlId(`http://app.surense.com/app/p/${URLID}`), null);
  assert.equal(parseUrlId("https://app.surense.com/app/q/abcd1234"), null);
  assert.equal(parseUrlId("https://app.surense.com/app/p/a"), null);
  assert.equal(parseUrlId("not a url"), null);
  assert.equal(parseUrlId(undefined), null);
  assert.equal(pickLicensee([{ id: LIC, active: false }, { id: OTHER, accessible: false }, { id: ACC }]), ACC);
  assert.equal(pickLicensee([]), null);
  assert.equal(isActiveStatus(ACTIVE), true);
  assert.equal(isActiveStatus(INACTIVE), false);
  assert.equal(isActiveStatus({ code: 2, description: "inactive" }), false);
  assert.equal(isActiveStatus(undefined), true);
  assert.equal(pickSwiftnessAccount([{ id: ACC, status: INACTIVE }, { id: CID, status: { code: 1, description: ACTIVE } }, { id: OTHER, status: ACTIVE, defaultAccount: true }]), OTHER);
  assert.equal(pickSwiftnessAccount([{ id: ACC, status: INACTIVE }]), null);
});

// ---------------------------------------------------------------- dp client
Deno.test("dp: the host allowlist is exactly api.surense.com plus the configured dp host, bare hostnames only", () => {
  const dp = createDpClient({ host: "DP.Example.Test", basePath: "/api", log: silentLog() });
  assert.deepEqual([...dp.allowedHosts], ["api.surense.com", "dp.example.test"]);
  assert.throws(() => assertAllowedUrl("https://evil.example.com/x", dp.allowedHosts));
  assert.throws(() => assertAllowedUrl("https://dp.example.test:8443/x", dp.allowedHosts), "no ports");
  assert.throws(() => assertAllowedUrl("http://dp.example.test/x", dp.allowedHosts), "https only");
  for (const bad of ["https://dp.example.test", "dp.example.test:8443", "dp.example.test/path", "localhost", "127.0.0.1", "user@dp.example.test", "", "dp .example.test", "a..b.com"]) {
    assert.equal(isBareHost(bad), false, bad);
    assert.throws(() => createDpClient({ host: bad, basePath: "/api", log: silentLog() }), (e) => e instanceof PoaToolError && e.code === "bad_dp_host");
  }
  assert.throws(() => createDpClient({ host: "dp.example.test", basePath: "/../x", log: silentLog() }), (e) => e instanceof PoaToolError && e.code === "bad_dp_base");
  assert.throws(() => createDpClient({ host: "dp.example.test", basePath: "//evil.com", log: silentLog() }), (e) => e instanceof PoaToolError);
});

Deno.test("dp: no Authorization header, no redirects followed, a 3xx is refused", async () => {
  const f = mockFetch(() => new Response(null, { status: 302, headers: { location: "https://evil.example.com/" } }));
  const dp = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f.fetch });
  await assert.rejects(dp.post("load", { sid: SID }, null), (e) => e instanceof PoaToolError && e.code === "dp_redirect_refused");
  const h = f.calls[0].init?.headers as Record<string, string>;
  assert.equal(Object.keys(h).some((k) => k.toLowerCase() === "authorization"), false);
  assert.equal(f.calls[0].init?.redirect, "manual");
  assert.equal(f.calls.length, 1, "the Location was not followed");
});

Deno.test("dp: the per-call timeout (abort) is unavailable and an ambiguous write", async () => {
  const audit: unknown[][] = [];
  const hang = (_u: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("aborted"))));
  const dp = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: hang, timeoutMs: 20, audit: async (...a) => void audit.push(a) });
  await assert.rejects(dp.post("hb", { sid: SID }, CID), (e) => e instanceof PoaToolError && e.kind === "unavailable" && e.code === "dp_timeout" && e.ambiguous);
  assert.deepEqual(audit.map((a) => a[3]), ["pending", "ambiguous"]);
  // a read (preview) that times out is not ambiguous
  const audit2: unknown[][] = [];
  const dp2 = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: hang, timeoutMs: 20, audit: async (...a) => void audit2.push(a) });
  await assert.rejects(dp2.preview(SID, "sw", CID), (e) => e instanceof PoaToolError && !e.ambiguous);
  assert.equal(audit2[0][0], PREVIEW_OP);
  assert.deepEqual(audit2.map((a) => a[3]), ["pending", "result"]);
});

Deno.test("dp: no audit, no request; HTTP status maps to the screen-8 kinds", async () => {
  const f = mockFetch(() => json({}));
  const dp = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f.fetch, audit: async () => { throw new Error("db down"); } });
  await assert.rejects(dp.post("load", { sid: SID }, null), (e) => e instanceof PoaToolError && e.code === "audit_failed");
  assert.equal(f.calls.length, 0);
  const cases: [number, string][] = [[404, "inactive"], [410, "expired"], [409, "completed"], [423, "locked"], [429, "locked"], [500, "unavailable"], [503, "unavailable"], [0, "unavailable"], [400, "generic"], [422, "generic"]];
  for (const [status, kind] of cases) assert.equal(kindFromToolStatus(status), kind, String(status));
  const f2 = mockFetch(() => new Response("{}", { status: 504 }));
  const dp2 = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f2.fetch });
  await assert.rejects(dp2.post("policies", { sid: SID }, null), (e) => e instanceof PoaToolError && e.kind === "unavailable" && e.ambiguous);
  const f3 = mockFetch(() => new Response("<html>not a pdf</html>", { status: 200 }));
  const dp3 = createDpClient({ host: "dp.example.test", basePath: "/api", log: silentLog(), fetch: f3.fetch });
  await assert.rejects(dp3.preview(SID, "p", null), (e) => e instanceof PoaToolError && e.code === "dp_not_pdf");
});

// ---------------------------------------------------------------- error mapping
Deno.test("errors: every thrown value ends as one of six kinds with a code and no text", () => {
  const rows: [unknown, string, number][] = [
    [new SurenseError(429, "http_429", "rate_limited", 30), "unavailable", 503],
    [new SurenseError(401, "http_401", "auth"), "unavailable", 503],
    [new SurenseError(0, "redirect_refused", "config"), "unavailable", 503],
    [new SurenseError(504, "http_504", "unavailable").asAmbiguous(), "unavailable", 503],
    [new SurenseError(400, "40001", "permanent"), "generic", 502],
    [new RpcError(401, "PT401", "x"), "inactive", 401],
    [new RpcError(403, "PT403", "x"), "locked", 403],
    [new RpcError(409, "PT409", "x"), "completed", 409],
    [new RpcError(410, "PT410", "x"), "expired", 410],
    [new RpcError(423, "PT423", "feature_disabled:poa_enabled"), "inactive", 503],
    [new RpcError(429, "PT429", "rate_limited"), "locked", 429],
    [new RpcError(400, "PT400", "invalid_input:phone"), "generic", 400],
    [new RpcError(0, "timeout", "x"), "unavailable", 503],
    [new RpcError(404, "PGRST202", "x"), "unavailable", 503],
    [new PoaToolError("completed", "dp_http_409"), "completed", 409],
    [new Error("secret text 0501234567"), "generic", 500],
  ];
  for (const [e, kind, status] of rows) {
    const p = toPoaError(e);
    assert.equal(p.kind, kind);
    assert.equal(p.status, status);
    assert.ok(!/secret text|0501234567/.test(p.code + p.message), "no text from the cause survives");
  }
  assert.ok(toPoaError(new PoaHttpError("expired", "x")) instanceof PoaHttpError);
});

// ---------------------------------------------------------------- rpc wrappers, token, env
const MODS = {
  maslaka: { enabled: true, required: false, performed: false },
  harbit: { enabled: true, required: false, performed: true },
  policies: { enabled: false, required: false, performed: false },
};

Deno.test("rpc: argument names follow the migration, bytea literals, answers parsed defensively", async () => {
  const hash = "a".repeat(64);
  const bytea = `\\x${hash}`;
  const rpc = mockRpc((fn) => {
    if (fn === "poa_session_start") return { ok: true, session_id: SID, expires_at: "2026-11-21T10:00:00Z", modules: MODS, existing_customer: true };
    if (fn === "poa_session_get") {
      return {
        session_id: SID, status: "open", expires_at: "x", modules: MODS, surense_customer_id: CID,
        engine_ref: { customer_id: CID, sid: SID, url_id: URLID, existing: true }, preview_sha: { maslaka: hash, harbit: "nothex" },
      };
    }
    if (fn === "poa_consent_record") return { approved_at: "2026-11-21T09:00:00Z", valid_until: null, modules: MODS, complete: false };
    if (fn === "poa_doc_get") return { storage_path: "poa/x.pdf", sha256: hash };
    return { ok: true, complete: true };
  });
  const p = createPoaRpc(rpc);
  const s = await p.sessionStart({
    tokenHash: hash, uaHash: hash, firstName: "Dana", lastName: "Test", email: null, street: "Herzl 12", city: "Tel Aviv", zip: "6473912", nationalId: SYNTH_ID, phone: "+972501234567", marketing: true, clientIp: "203.0.113.5",
  });
  assert.equal(s.next, "maslaka", "derived from the modules when the database does not say");
  assert.equal(s.existingCustomer, true);
  assert.deepEqual(rpc.calls[0].args, {
    p_token_hash: bytea, p_identity: { first_name: "Dana", last_name: "Test", email: null, street: "Herzl 12", city: "Tel Aviv", zip: "6473912" }, p_national_id: SYNTH_ID, p_phone: "+972501234567",
    p_ua_hash: bytea, p_ip: "203.0.113.5", p_marketing: true,
  });
  const g = await p.sessionGet(hash);
  assert.deepEqual(g.engineRef, { customerId: CID, sid: SID, urlId: URLID, existing: true });
  assert.deepEqual(g.previewSha256, { maslaka: hash });
  assert.equal(g.customerId, CID);
  await p.engineRefSet(SID, { customerId: CID, sid: "s-1234567", urlId: URLID, existing: false });
  assert.deepEqual(rpc.calls[rpc.calls.length - 1].args, { p_session: SID, p_ref: { customer_id: CID, sid: "s-1234567", url_id: URLID, existing: false } });
  await p.engineRefSet(SID, { customerId: CID, sid: "s-1234567", urlId: URLID, existing: false, cookie: "a=1; XSRF-TOKEN=t" });
  assert.deepEqual(rpc.calls[rpc.calls.length - 1].args, { p_session: SID, p_ref: { customer_id: CID, sid: "s-1234567", url_id: URLID, existing: false, cookie: "a=1; XSRF-TOKEN=t" } });
  const c = await p.consentRecord({ sessionId: SID, kind: "harbit", previewSha256: hash, birthDate: "1990-05-17", issueDate: "2015-01-02", signature: null, clientIp: "203.0.113.5", userAgent: "ua" });
  assert.equal(c.validUntil, null);
  assert.deepEqual(rpc.calls[rpc.calls.length - 1].args.p_extra, { birth_date: "1990-05-17", issue_date: "2015-01-02" });
  assert.equal(rpc.calls[rpc.calls.length - 1].args.p_method, "check");
  assert.deepEqual((await p.docGet(hash, "maslaka")).storagePath, "poa/x.pdf");
  assert.equal(failCode("DB_PT400 x"), "db_pt400_x");
  await p.sessionFail(SID, "DP_HTTP_500");
  assert.deepEqual(rpc.calls[rpc.calls.length - 1].args, { p_session: SID, p_code: "dp_http_500" });
  assert.equal((await p.sessionComplete(SID)).complete, true);
  await p.enqueueLaunch(CID, "2026-11-21");
  const last = rpc.calls[rpc.calls.length - 1];
  assert.equal(last.fn, "surense_job_enqueue");
  assert.deepEqual(last.args, { p_kind: "surense.e9100_submit", p_params: { customer_id: CID, proxy_approval_date: "2026-11-21" }, p_dedupe: `e9100:${CID}` });
  await assert.rejects(p.sessionGet("short"), (e) => e instanceof RpcError && e.code === "bad_hash");
  const broken = createPoaRpc(mockRpc(() => ({ status: "open", modules: { maslaka: {} } })));
  await assert.rejects(broken.sessionGet(hash), (e) => e instanceof RpcError && e.code === "bad_shape");
  const capped = createPoaRpc(mockRpc(() => ({ ok: false, error: "rate_limited" })));
  await assert.rejects(
    capped.sessionStart({ tokenHash: hash, uaHash: null, firstName: "a", lastName: "b", email: null, nationalId: SYNTH_ID, phone: "+972501234567", marketing: false, clientIp: "203.0.113.5" }),
    (e) => e instanceof RpcError && e.status === 429,
  );
  assert.throws(() => parseModules(null));
  assert.equal(nextOf(parseModules(MODS)), "maslaka");
  assert.equal(await createPoaRpc(mockRpc(() => { throw rpcError(404, "PGRST202"); })).config(), null, "no api.poa_config in the database");
  const cfg = await createPoaRpc(mockRpc(() => ({ poa_enabled: true, modules: { maslaka: true } }))).config();
  assert.deepEqual(cfg, { poaEnabled: true, engine: "surense", turnstileRequired: true, modules: { maslaka: true, harbit: false, policies: false }, licensee: null });
  const withLic = await createPoaRpc(mockRpc(() => ({ poa_enabled: true, engine: "native", licensee: { name: "Zz Agent", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" } }))).config();
  assert.deepEqual(withLic?.licensee, { name: "Zz Agent", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" });
  const partial = await createPoaRpc(mockRpc(() => ({ poa_enabled: true, licensee: { name: "Zz Agent", license: "", phone: "", email: "" } }))).config();
  assert.equal(partial?.licensee, null, "empty ops.config rows are no licensee");
});

Deno.test("session token: 32 random bytes, base64url, only the hash is stored; env settings", async () => {
  const a = generateToken();
  const b = generateToken();
  assert.match(a, TOKEN_RE);
  assert.equal(a.length, 43);
  assert.notEqual(a, b);
  assert.match(await hashToken(a), /^[0-9a-f]{64}$/);
  assert.equal(await hashToken("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.deepEqual(loadPoaEnv(() => undefined), { dpHost: "dp.surense.com", dpBase: "/api/v1/ifs/public", startMinMs: 6000, startBucketMs: 3000, managerId: null, licensee: null });
  const e = loadPoaEnv((n) => ({ SURENSE_DP_HOST: " DP.Example.Test ", SURENSE_DP_BASE: "/v2", SURENSE_MANAGER_ID: CID.toUpperCase() } as Record<string, string>)[n]);
  assert.deepEqual(e, { dpHost: "dp.example.test", dpBase: "/v2", startMinMs: 6000, startBucketMs: 3000, managerId: CID, licensee: null });
  const t = loadPoaEnv((n) => ({ POA_START_MIN_MS: "8000", POA_START_BUCKET_MS: "2000" } as Record<string, string>)[n]);
  assert.equal(t.startMinMs, 8000);
  assert.equal(t.startBucketMs, 2000);
  const junk = loadPoaEnv((n) => ({ POA_START_MIN_MS: "-5", POA_START_BUCKET_MS: "0" } as Record<string, string>)[n]);
  assert.equal(junk.startMinMs, 6000, "out of range or not a number: the default");
  assert.equal(junk.startBucketMs, 3000);
  assert.equal(loadPoaEnv((n) => (n === "SURENSE_MANAGER_ID" ? "not-a-uuid" : undefined)).managerId, null);
  // the licence holder of the native engine: all four or nothing
  const lic = { POA_LICENSEE_NAME: " Zz Agent ", POA_LICENSEE_LICENSE: "L-00000000", POA_LICENSEE_PHONE: "050-000-0000", POA_LICENSEE_EMAIL: "agent@example.com" } as Record<string, string>;
  assert.deepEqual(loadPoaEnv((n) => lic[n]).licensee, { name: "Zz Agent", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" });
  assert.equal(loadPoaEnv((n) => ({ ...lic, POA_LICENSEE_EMAIL: "" } as Record<string, string>)[n]).licensee, null);
  assert.equal(loadPoaEnv((n) => ({ ...lic, POA_LICENSEE_LICENSE: "no spaces allowed" } as Record<string, string>)[n]).licensee, null);
});
