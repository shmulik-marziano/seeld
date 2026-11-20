import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { POA_KINDS } from "@/lib/poa/config";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { blobBytes, createHttpPoaApi, createMockPoaApi, poaFileName, POA_RESPONSE_KEYS, PoaApiError, type StartReq } from "@/lib/poa/api";

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

  it("the real adapter is a typed stub that is not configured", async () => {
    await expect(createHttpPoaApi().start(REQ)).rejects.toThrow("not configured");
  });

  it("download file name is poa-{kind}-{YYYYMMDD}.pdf", () => {
    expect(poaFileName("policies", new Date(2026, 10, 5))).toBe("poa-policies-20261105.pdf");
  });
});
