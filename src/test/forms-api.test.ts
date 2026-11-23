import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHttpFormsApi, createMockFormsApi, errorKindOfResponse, FormsApiError } from "@/forms/api";
import { createFormsSubmitAdapter } from "@/forms/submitAdapter";
import type { SubmitPayload } from "@/questionnaires/adapters";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";

const FAKE_ID = (() => { for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(`12345678${d}`)) return `12345678${d}`; throw new Error("no check digit"); })();
const START = { first_name: "דנה", last_name: "בדיקה", national_id: FAKE_ID, phone: "0501234567", email: null, terms_privacy_approved: true as const };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function payload(over: Partial<SubmitPayload> = {}): SubmitPayload {
  return {
    idempotencyKey: "k", questionnaire: { key: "personal", version: 1 }, mode: "client-link", requestToken: null, stepKey: "first_name", stepCompleted: true, submit: false,
    completionPct: 10, fields: { first_name: { value: "דנה", source: "pre_treatment_questionnaire", rank: 4, answeredAt: "2026-11-23T10:00:00Z" } }, derived: {}, sentAt: "2026-11-23T10:00:00Z", ...over,
  };
}

beforeEach(() => { try { sessionStorage.clear(); } catch { /* jsdom */ } });

describe("forms http adapter", () => {
  it("start keeps the token in a closure and sessionStorage, sends it only in the header, and never in a URL", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      if (String(url).endsWith("/start")) return json({ session_token: "tok_" + "a".repeat(40), expires_at: "2099-01-01T00:00:00Z", health_stored: false });
      if (String(url).endsWith("/state")) return json({ status: "open", expires_at: "2099-01-01T00:00:00Z", submissions: [], documents: [] });
      return json({ error: "generic", code: "no_route" }, 404);
    }) as unknown as typeof fetch;
    const api = createHttpFormsApi({ baseUrl: "https://x.example/functions/v1/forms-intake/", fetchImpl });
    expect(api.hasSession()).toBe(false);
    await api.start(START);
    expect(api.hasSession()).toBe(true);
    expect(api.healthStored()).toBe(false);
    const s = await api.state();
    expect(s.status).toBe("open");
    expect(calls[1].url).toBe("https://x.example/functions/v1/forms-intake/state");
    expect((calls[1].init.headers as Record<string, string>)["x-forms-session"]).toMatch(/^tok_a+$/);
    expect(calls[1].init.credentials).toBe("omit");
    expect(JSON.parse(sessionStorage.getItem("seeld-forms:session") ?? "{}").token).toMatch(/^tok_/);
    // a new adapter in the same tab resumes the session
    expect(createHttpFormsApi({ baseUrl: "https://x.example", fetchImpl }).hasSession()).toBe(true);
    api.clear();
    expect(api.hasSession()).toBe(false);
    expect(sessionStorage.getItem("seeld-forms:session")).toBeNull();
  });

  it("maps refusals to kinds and keeps the server's short code; an expired session forgets the token", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      if (String(url).endsWith("/start")) return json({ session_token: "tok_" + "b".repeat(40), expires_at: "2099-01-01T00:00:00Z", health_stored: true });
      if (String(url).endsWith("/step")) return json({ error: "completed", code: "stale_draft" }, 409);
      return json({ error: "expired", code: "session_expired" }, 410);
    }) as unknown as typeof fetch;
    const api = createHttpFormsApi({ baseUrl: "https://x.example", fetchImpl, persist: false });
    await expect(api.state()).rejects.toMatchObject({ kind: "inactive", code: "no_session" });
    await api.start(START);
    expect(api.healthStored()).toBe(true);
    await expect(api.step({ card: "personal", questionnaire: "personal", version: 1, step_key: null, answers: {}, derived: {}, draft_version: 0, completion: 0 })).rejects.toMatchObject({ kind: "completed", code: "stale_draft" });
    await expect(api.state()).rejects.toMatchObject({ kind: "expired" });
    expect(api.hasSession()).toBe(false);
    expect(errorKindOfResponse(503, {})).toBe("unavailable");
    expect(errorKindOfResponse(400, { error: "locked" })).toBe("locked");
  });
});

describe("forms submit adapter (the Runner side)", () => {
  it("serialises saves so the draft version always follows the server, and sends the signer with the final submit", async () => {
    const api = createMockFormsApi();
    await api.start(START);
    const adapter = createFormsSubmitAdapter({ api, card: "personal", questionnaire: "personal", draftVersion: 0, sensitive: false, healthStored: false });
    const [a, b] = await Promise.all([adapter.saveStep(payload()), adapter.saveStep(payload({ stepKey: "last_name" }))]);
    expect(a).toMatchObject({ status: "saved", version: 1 });
    expect(b).toMatchObject({ status: "saved", version: 2 });
    expect(adapter.draftVersion).toBe(2);
    const r = await adapter.submit(payload({ submit: true, stepKey: null, completionPct: 100 }), { name: "דנה בדיקה", kind: "typed", hash: "a".repeat(64), signedAt: "2026-11-23T10:05:00Z" });
    expect(r.status).toBe("saved");
    const st = await api.state();
    expect(st.submissions[0]).toMatchObject({ questionnaire: "personal", status: "submitted", completion: 100 });
    expect((await adapter.submit(payload({ submit: true }), { name: "דנה בדיקה", kind: "typed", hash: "a".repeat(64), signedAt: "x" })).status).toBe("duplicate");
  });
  it("health: no answers leave the browser while the server does not store them; a stale draft calls back", async () => {
    const api = createMockFormsApi({ healthStored: false });
    await api.start(START);
    const stale = vi.fn();
    const adapter = createFormsSubmitAdapter({ api, card: "health", questionnaire: "health", draftVersion: 0, sensitive: true, healthStored: false, onStale: stale });
    await adapter.saveStep(payload({ questionnaire: { key: "health", version: 1 }, derived: { health_screening: { status: "all_clear" } } }));
    const st = await api.state();
    expect(st.submissions[0]).toMatchObject({ questionnaire: "health", answers_stored: false, answers: null, derived: { health_screening: { status: "all_clear" } } });
    const other = createFormsSubmitAdapter({ api, card: "health", questionnaire: "health", draftVersion: 0, sensitive: true, healthStored: false, onStale: stale });
    expect((await other.saveStep(payload({ questionnaire: { key: "health", version: 1 } }))).status).toBe("error");
    expect(stale).toHaveBeenCalledTimes(1);
  });
  it("mock fail modes reach the caller as FormsApiError", async () => {
    const api = createMockFormsApi({ fail: { kind: "inactive", on: "start", code: "switch_off" } });
    await expect(api.start(START)).rejects.toBeInstanceOf(FormsApiError);
    await expect(api.start(START)).rejects.toMatchObject({ kind: "inactive", code: "switch_off" });
  });
});
