import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { POA_KINDS } from "@/lib/poa/config";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { blobBytes, createHttpPoaApi, errorKindOf, errorKindOfResponse, createMockPoaApi, poaFileName, POA_RESPONSE_KEYS, PoaApiError, type StartReq } from "@/lib/poa/api";

const font = (n: string) => new Uint8Array(fs.readFileSync(path.resolve("public/fonts", n)));
const fonts = { regular: font("Rubik-Regular.ttf"), bold: font("Rubik-Bold.ttf") };
const FAKE_ID = (() => { for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(`12345678${d}`)) return `12345678${d}`; throw new Error("no check digit"); })();
const REQ: StartReq = {
  first_name: "ישראל", last_name: "ישראלי", national_id: FAKE_ID, phone: "0501234567",
  email: "test@example.com", terms_privacy_approved: true, marketing_approved: false,
};
const latin1 = async (b: Blob) => Buffer.from(await blobBytes(b)).toString("latin1");
const keys = (o: object) => Object.keys(o).sort();

afterEach(() => vi.unstubAllGlobals());

describe("poa mock adapter: contract (provisional until PR 1)", () => {
  it("start / consent / state / preview answer with exactly the documented keys", async () => {
    const api = createMockPoaApi({ fonts });
    const s = await api.start(REQ);
    expect(keys(s)).toEqual([...POA_RESPONSE_KEYS.start].sort());
    for (const k of POA_KINDS) expect(keys(s.modules[k])).toEqual([...POA_RESPONSE_KEYS.module].sort());
    expect(s.next).toBe("maslaka");
    expect(POA_KINDS.every((k) => s.modules[k].enabled && !s.modules[k].performed)).toBe(true);

    const p = await api.preview("maslaka");
    expect(keys(p)).toEqual([...POA_RESPONSE_KEYS.preview].sort());
    expect(p.preview_sha256).toMatch(/^[0-9a-f]{64}$/);

    const c = await api.consent("maslaka", { preview_sha256: p.preview_sha256 });
    expect(keys(c)).toEqual([...POA_RESPONSE_KEYS.consent].sort());
    expect(c).toMatchObject({ kind: "maslaka", method: "check", valid_until: null, next: "harbit" });
    expect(c.modules.maslaka.performed).toBe(true);

    const st = await api.state();
    expect(keys(st)).toEqual([...POA_RESPONSE_KEYS.state].sort());
    expect(st.status).toBe("open");
  });

  it("preview and doc return a draft PDF blob", async () => {
    const api = createMockPoaApi({ fonts });
    await api.start(REQ);
    const p = await api.preview("harbit");
    expect(p.pdf.type).toBe("application/pdf");
    expect((await latin1(p.pdf)).startsWith("%PDF-1.7")).toBe(true);
    expect(await latin1(p.pdf)).not.toMatch(/EmbeddedFile/);
    await api.consent("harbit", { preview_sha256: p.preview_sha256, birth_date: "1980-02-01", issue_date: "2015-03-15" });
    const d = await api.doc("harbit");
    expect((await latin1(d)).startsWith("%PDF-1.7")).toBe(true);
  });

  it("refuses an approval whose hash is not the last preview shown", async () => {
    const api = createMockPoaApi({ fonts });
    await api.start(REQ);
    await expect(api.consent("maslaka", { preview_sha256: "0".repeat(64) })).rejects.toEqual(new PoaApiError("generic"));
    await api.preview("maslaka");
    await expect(api.consent("maslaka", { preview_sha256: "f".repeat(64) })).rejects.toBeInstanceOf(PoaApiError);
  });

  it("policies needs a signature, harbit needs both dates, and the flow ends with next=done", async () => {
    const api = createMockPoaApi({ fonts });
    await api.start(REQ);
    for (const k of POA_KINDS) {
      const p = await api.preview(k);
      if (k === "harbit") await expect(api.consent(k, { preview_sha256: p.preview_sha256 })).rejects.toBeInstanceOf(PoaApiError);
      if (k === "policies") await expect(api.consent(k, { preview_sha256: p.preview_sha256 })).rejects.toBeInstanceOf(PoaApiError);
      const extra = k === "harbit" ? { birth_date: "1980-02-01", issue_date: "2015-03-15" } : k === "policies" ? { signature_png: "data:image/png;base64,AAAA" } : {};
      const c = await api.consent(k, { preview_sha256: p.preview_sha256, ...extra });
      if (k === "policies") expect(c).toMatchObject({ method: "signature", next: "done" });
    }
    expect((await api.state()).status).toBe("completed");
  });

  it("skips modules the server disables", async () => {
    const api = createMockPoaApi({ fonts, modules: { maslaka: { enabled: false } } });
    expect((await api.start(REQ)).next).toBe("harbit");
  });

  it("the session ends after 60 minutes", async () => {
    let t = new Date("2026-01-10T10:00:00Z").getTime();
    const api = createMockPoaApi({ fonts, now: () => new Date(t) });
    const s = await api.start(REQ);
    expect(new Date(s.expires_at).getTime() - t).toBe(60 * 60_000);
    t += 59 * 60_000;
    await expect(api.preview("maslaka")).resolves.toBeTruthy();
    t += 60_000;
    await expect(api.preview("maslaka")).rejects.toEqual(new PoaApiError("expired"));
    expect((await api.state()).status).toBe("expired");
  });

  it("calls before start read as an inactive link", async () => {
    const api = createMockPoaApi({ fonts });
    await expect(api.preview("maslaka")).rejects.toEqual(new PoaApiError("inactive"));
    await expect(api.state()).rejects.toEqual(new PoaApiError("inactive"));
  });

  it("fail mode throws the chosen error, on every call or on one", async () => {
    await expect(createMockPoaApi({ fail: { code: "locked" } }).start(REQ)).rejects.toEqual(new PoaApiError("locked"));
    const api = createMockPoaApi({ fonts, fail: { code: "unavailable", on: "consent" } });
    await api.start(REQ);
    const p = await api.preview("maslaka");
    await expect(api.consent("maslaka", { preview_sha256: p.preview_sha256 })).rejects.toEqual(new PoaApiError("unavailable"));
  });

  it("sends nothing anywhere and writes no storage", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const set = vi.spyOn(Storage.prototype, "setItem");
    const api = createMockPoaApi({ fonts });
    await api.start(REQ);
    const p = await api.preview("maslaka");
    await api.consent("maslaka", { preview_sha256: p.preview_sha256 });
    await api.doc("maslaka");
    expect(f).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    set.mockRestore();
  });

  it("download file name is poa-{kind}-{YYYYMMDD}.pdf", () => {
    expect(poaFileName("policies", new Date(2026, 10, 5))).toBe("poa-policies-20261105.pdf");
  });
});

// ---- HTTP adapter (poa-intake) ----------------------------------------------------------------------------------

const BASE = "https://intake.example.test/functions/v1/poa-intake";
const SHA = "ab".repeat(32);
const MODULES = Object.fromEntries(POA_KINDS.map((k) => [k, { enabled: true, required: true, performed: false }]));
const START_RES = { session_token: "tok_" + "x".repeat(40), expires_at: "2026-11-21T12:00:00.000Z", modules: MODULES, next: "maslaka" };
const jsonRes = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const pdfRes = (headers: Record<string, string> = { "x-preview-sha256": SHA }) =>
  new Response("%PDF-1.7 test", { status: 200, headers: { "content-type": "application/pdf", ...headers } });

type Call = { url: string; init: RequestInit };
function http(script: Array<Response | Error>) {
  const calls: Call[] = [];
  const q = [...script];
  const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = q.shift();
    if (!next) throw new Error("unscripted call");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { calls, api: createHttpPoaApi({ baseUrl: BASE + "/", fetchImpl }) };
}
const hdr = (c: Call, name: string) => new Headers(c.init.headers).get(name);

describe("poa http adapter", () => {
  it("start: POST /start with the StartReq keys and the Turnstile token, no cookies, no session header", async () => {
    const { api, calls } = http([jsonRes(200, START_RES)]);
    const res = await api.start({ ...REQ, turnstile_token: "ts-token" });
    expect(keys(res)).toEqual([...POA_RESPONSE_KEYS.start].sort());
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${BASE}/start`);
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.credentials).toBe("omit");
    expect(hdr(calls[0], "content-type")).toBe("application/json");
    expect(hdr(calls[0], "x-poa-session")).toBeNull();
    const body = JSON.parse(String(calls[0].init.body));
    expect(keys(body)).toEqual(["email", "first_name", "last_name", "marketing_approved", "national_id", "phone", "terms_privacy_approved", "turnstile_token"]);
    expect(body.turnstile_token).toBe("ts-token");
  });

  it("calls before start never touch the network and read as an inactive link", async () => {
    const { api, calls } = http([]);
    await expect(api.state()).rejects.toEqual(new PoaApiError("inactive"));
    await expect(api.preview("maslaka")).rejects.toEqual(new PoaApiError("inactive"));
    await expect(api.doc("maslaka")).rejects.toEqual(new PoaApiError("inactive"));
    await expect(api.consent("maslaka", { preview_sha256: SHA })).rejects.toEqual(new PoaApiError("inactive"));
    expect(calls).toHaveLength(0);
  });

  it("after start every call carries the session token in x-poa-session; routes and methods follow the contract", async () => {
    const consentRes = { kind: "harbit", method: "check", approved_at: "2026-11-21T11:00:00.000Z", valid_until: null, modules: MODULES, next: "policies" };
    const stateRes = { status: "open", expires_at: START_RES.expires_at, modules: MODULES, next: "maslaka" };
    const { api, calls } = http([jsonRes(200, START_RES), pdfRes(), jsonRes(200, consentRes), jsonRes(200, stateRes), pdfRes({})]);
    await api.start(REQ);
    const p = await api.preview("harbit");
    const c = await api.consent("harbit", { preview_sha256: p.preview_sha256, birth_date: "1980-02-01", issue_date: "2015-03-15" });
    const st = await api.state();
    const d = await api.doc("policies");
    expect(keys(c)).toEqual([...POA_RESPONSE_KEYS.consent].sort());
    expect(keys(st)).toEqual([...POA_RESPONSE_KEYS.state].sort());
    expect(d.size).toBeGreaterThan(0);
    expect(calls.map((x) => `${x.init.method} ${x.url.replace(BASE, "")}`)).toEqual([
      "POST /start", "GET /preview/harbit", "POST /harbit", "GET /state", "GET /doc/policies",
    ]);
    for (const x of calls.slice(1)) expect(hdr(x, "x-poa-session")).toBe(START_RES.session_token);
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ preview_sha256: SHA, birth_date: "1980-02-01", issue_date: "2015-03-15" });
    expect(calls[1].init.body).toBeUndefined();
    expect(calls.every((x) => x.init.credentials === "omit")).toBe(true);
  });

  it("preview returns the PDF blob and the hash from the response header; a missing or malformed hash is refused", async () => {
    const { api } = http([jsonRes(200, START_RES), pdfRes(), pdfRes({}), pdfRes({ "x-preview-sha256": "xyz" })]);
    await api.start(REQ);
    const p = await api.preview("maslaka");
    expect(keys(p)).toEqual([...POA_RESPONSE_KEYS.preview].sort());
    expect(p.preview_sha256).toBe(SHA);
    expect(await latin1(p.pdf)).toContain("%PDF");
    await expect(api.preview("maslaka")).rejects.toEqual(new PoaApiError("generic"));
    await expect(api.preview("maslaka")).rejects.toEqual(new PoaApiError("generic"));
  });

  it("maps a failed response to a screen: details.reason first, then the status", async () => {
    const err = (status: number, details?: object) => jsonRes(status, { error: { code: "x", message: "x", requestId: "r", ...(details ? { details } : {}) } });
    const cases: Array<[Response, string]> = [
      [err(401), "inactive"], [err(404), "inactive"], [err(410), "expired"], [err(403), "locked"], [err(429), "locked"],
      [err(409), "completed"], [err(423), "unavailable"], [err(503), "unavailable"], [err(500), "unavailable"],
      [err(400), "generic"], [err(422), "generic"],
      [err(403, { field: "turnstile" }), "generic"], [err(403, { field: "origin" }), "generic"],
      [err(500, { reason: "expired" }), "expired"], [err(400, { reason: "completed" }), "completed"],
      [err(400, { reason: "something else" }), "generic"],
      [new Response("<html>bad gateway</html>", { status: 502 }), "unavailable"],
    ];
    for (const [res, kind] of cases) {
      const { api } = http([res]);
      const e = await api.start(REQ).then(() => null, (x) => x);
      expect(e, kind).toBeInstanceOf(PoaApiError);
      expect(errorKindOf(e), kind).toBe(kind);
    }
    expect(errorKindOfResponse(400, null)).toBe("generic");
    // poa-intake answers {"error":"<kind>"}: the kind wins over the status
    expect(errorKindOfResponse(503, { error: "inactive" })).toBe("inactive");
    expect(errorKindOfResponse(403, { error: "generic" })).toBe("generic");
    expect(errorKindOfResponse(403, { error: "locked" })).toBe("locked");
    expect(errorKindOfResponse(400, { error: "nonsense" })).toBe("generic");
  });

  it("a network failure or a timeout reads as unavailable", async () => {
    const { api } = http([new TypeError("Failed to fetch")]);
    expect(errorKindOf(await api.start(REQ).then(() => null, (x) => x))).toBe("unavailable");

    const hang = vi.fn((_u: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_r, rej) => {
      init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    })) as unknown as typeof fetch;
    const slow = createHttpPoaApi({ baseUrl: BASE, fetchImpl: hang, timeoutMs: 20 });
    expect(errorKindOf(await slow.start(REQ).then(() => null, (x) => x))).toBe("unavailable");
  });

  it("a start answer without a session token is refused and leaves the adapter without a session", async () => {
    const { api, calls } = http([jsonRes(200, { expires_at: "x" })]);
    await expect(api.start(REQ)).rejects.toEqual(new PoaApiError("generic"));
    await expect(api.state()).rejects.toEqual(new PoaApiError("inactive"));
    expect(calls).toHaveLength(1);
  });

  it("without a baseUrl it posts under .../poa-intake/ and writes no storage", async () => {
    const set = vi.spyOn(Storage.prototype, "setItem");
    const f = vi.fn(async () => jsonRes(200, START_RES));
    const api = createHttpPoaApi({ fetchImpl: f as unknown as typeof fetch });
    await api.start(REQ);
    const url = String((f.mock.calls[0] as unknown[])[0]);
    expect(url).toMatch(/\/poa-intake\/start$/);
    expect(set).not.toHaveBeenCalled();
    set.mockRestore();
  });
});
