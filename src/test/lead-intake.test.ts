import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  INTAKE_PAYLOAD_KEYS, buildLeadPayload, leadErrorMessage, newIdempotencyKey, postLead, readUtm,
  type LeadInput, type LeadKind,
} from "@/lib/leadIntake";

const ROOT = join(__dirname, "..", "..");
// Synthetic visitor only (no real personal data in tests).
const BASE: LeadInput = {
  kind: "contact", name: "  ישראלה בדיקה ", phone: "050-0000000", email: " Test@Example.COM ",
  topic: "תיאום פגישה", message: "  שלום  ", consent: true, sourcePage: "/contact",
};
const TOP_LEVEL = ["kind", "full_name", "phone", "email", "message", "payload", "utm", "consent", "consent_version", "source", "hp"];

describe("canonical lead payload", () => {
  it("INTAKE_PAYLOAD_KEYS is exactly ops.intake_payload_keys from migration 090500", () => {
    const sql = readFileSync(join(ROOT, "supabase", "migrations", "20261119090500_submit_lead_v2.sql"), "utf8");
    const block = sql.match(/insert into ops\.intake_payload_keys[\s\S]*?\) t\(k, v\);/)?.[0];
    expect(block).toBeTruthy();
    const fromSql: Record<string, string[]> = {};
    for (const m of block!.matchAll(/\('(\w+)', array\[([^\]]*)\]\)/g)) {
      fromSql[m[1]] = [...m[2].matchAll(/'([a-z0-9_]+)'/g)].map((x) => x[1]).sort();
    }
    const fromTs = Object.fromEntries(Object.entries(INTAKE_PAYLOAD_KEYS).map(([k, v]) => [k, [...v].sort()]));
    expect(fromTs).toEqual(fromSql);
  });

  it("uses only the top-level keys submit_lead accepts, trims and lower-cases", () => {
    const body = buildLeadPayload(BASE, {});
    for (const k of Object.keys(body)) expect(TOP_LEVEL).toContain(k);
    expect(body).toEqual({
      kind: "contact",
      full_name: "ישראלה בדיקה",
      phone: "050-0000000",
      email: "test@example.com",
      message: "שלום",
      payload: { subject: "תיאום פגישה", page: "/contact" },
      consent: true,
      consent_version: "v1",
      source: "/contact",
    });
  });

  it.each<[LeadKind, string]>([
    ["insurance", "insurance_type"], ["pension", "focus_area"], ["contact", "subject"],
    ["portfolio_review", "subject"], ["report", "subject"],
  ])("maps the topic of kind %s to payload.%s", (kind, key) => {
    expect(buildLeadPayload({ ...BASE, kind, topic: "x-topic" }, {}).payload[key]).toBe("x-topic");
  });

  it("drops keys outside the allowlist, national-id-like values and empty values", () => {
    const body = buildLeadPayload({
      ...BASE,
      kind: "insurance",
      details: {
        id_number: "000000018", bank_account: "12345", salary: 20000, // never allowed
        destination: "123456789", // id-like (9 digits) -> dropped
        travelers_count: "2", travel_start_date: "2026-12-01", vehicle_year: "", property_type: undefined,
      },
    }, {});
    expect(body.payload).toEqual({ insurance_type: "תיאום פגישה", travelers_count: "2", travel_start_date: "2026-12-01", page: "/contact" });
    expect(JSON.stringify(body)).not.toMatch(/id_number|bank|salary|123456789/);
  });

  it("is deterministic (the idempotency hash sees the same JSON for the same form)", () => {
    expect(JSON.stringify(buildLeadPayload(BASE, { utm_source: "g" }))).toBe(JSON.stringify(buildLeadPayload({ ...BASE }, { utm_source: "g" })));
  });

  it("reads only the UTM keys submit_lead accepts, capped at 100 chars", () => {
    const utm = readUtm(`?utm_source=google&utm_medium=cpc&gclid=abc&ref=${"r".repeat(150)}`);
    expect(utm).toEqual({ utm_source: "google", utm_medium: "cpc", ref: "r".repeat(100) });
  });

  it("carries the honeypot only when filled, and consent as given", () => {
    expect(buildLeadPayload({ ...BASE, hp: "" }, {}).hp).toBeUndefined();
    expect(buildLeadPayload({ ...BASE, hp: "bot" }, {}).hp).toBe("bot");
    expect(buildLeadPayload({ ...BASE, consent: false }, {}).consent).toBe(false);
  });

  it("idempotency keys fit the lead-intake pattern", () => {
    const k = newIdempotencyKey();
    expect(k).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(newIdempotencyKey()).not.toBe(k);
  });
});

describe("postLead", () => {
  const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  it("POSTs JSON to lead-intake with the Idempotency-Key and the Turnstile token in the body", async () => {
    const f = vi.fn(async () => ok());
    const body = buildLeadPayload(BASE, {});
    const r = await postLead(body, { idempotencyKey: "key-12345678", turnstileToken: "tok", fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/functions\/v1\/lead-intake$/);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe("key-12345678");
    expect(JSON.parse(String(init.body))).toEqual({ ...body, turnstile_token: "tok" });
  });

  it("sends no token field when there is no widget (non-production without a site key)", async () => {
    const f = vi.fn(async () => ok());
    await postLead(buildLeadPayload(BASE, {}), { idempotencyKey: "key-12345678", fetchImpl: f as unknown as typeof fetch });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body))).not.toHaveProperty("turnstile_token");
  });

  it("refuses to send without consent", async () => {
    const f = vi.fn(async () => ok());
    const r = await postLead(buildLeadPayload({ ...BASE, consent: false }, {}), { idempotencyKey: "key-12345678", fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("consent");
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    [400, { error: { code: "bad_request", message: "x", details: { field: "phone" } } }, "invalid_input", /טלפון/],
    [400, { error: "invalid_input:email" }, "invalid_input", /אימייל/],
    // the real lead-intake shape for an Origin OR a Turnstile reject (handler.ts: HttpError("forbidden"))
    [403, { error: { code: "forbidden", message: "x" } }, "forbidden", /רעננו.*חייגו/],
    [403, { error: "origin" }, "origin", /לא אושרה.*חייגו/],
    [403, { error: "turnstile" }, "turnstile", /אנושית.*חייגו/],
    [403, null, "forbidden", /חייגו/],
    [409, { error: { code: "conflict", message: "x" } }, "conflict", /שוב/],
    [429, { error: { code: "rate_limited", message: "x" } }, "rate_limited", /כמה דקות/],
    [503, { error: { code: "unavailable", message: "x" } }, "unavailable", /לא זמין/],
    [500, null, "unavailable", /לא זמין/],
  ])("maps HTTP %i to a Hebrew message (%#)", async (status, json, code, text) => {
    const f = vi.fn(async () => new Response(json === null ? "" : JSON.stringify(json), { status }));
    const r = await postLead(buildLeadPayload(BASE, {}), { idempotencyKey: "key-12345678", fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(status);
    expect(r.code).toBe(code);
    expect(r.message).toMatch(text);
    expect(r.message).not.toMatch(/bad_request|forbidden|requestId/);
  });

  it("maps a network failure to a calm retry message", async () => {
    const f = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    const r = await postLead(buildLeadPayload(BASE, {}), { idempotencyKey: "key-12345678", fetchImpl: f as unknown as typeof fetch });
    expect(r).toMatchObject({ ok: false, status: 0, code: "network" });
  });

  it("knows the field messages lead-intake can report", () => {
    for (const f of ["full_name", "phone", "email", "contact", "consent", "message"]) {
      expect(leadErrorMessage(400, `invalid_input:${f}`).message).not.toMatch(/חלק מהפרטים/);
    }
    expect(leadErrorMessage(400, "invalid_input:payload_key").message).toMatch(/חלק מהפרטים/);
  });
});

describe("public forms never send national id, bank, salary or health fields", () => {
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((e) => {
      const full = join(dir, e);
      return statSync(full).isDirectory() ? files(full) : /\.tsx?$/.test(e) ? [full] : [];
    });
  }
  const callers = files(join(ROOT, "src"))
    .filter((f) => !/[\\/]src[\\/]test[\\/]/.test(f))
    .filter((f) => readFileSync(f, "utf8").includes("intake.submit("));

  it("there are v2 callers for every public lead form", () => {
    const names = callers.map((f) => f.replace(/\\/g, "/").split("/src/")[1]).sort();
    expect(names).toEqual([
      "components/InsuranceEnrollmentForm.tsx", "components/PensionAnalysisForm.tsx",
      "components/PortfolioReviewForm.tsx", "components/retire/RetireForm.tsx",
      "pages/BlogPost.tsx", "pages/Contact.tsx", "pages/Index.tsx", "pages/Report.tsx",
    ]);
  });

  it.each(callers.map((f) => [f.replace(/\\/g, "/").split("/src/")[1], f]))("%s", (_name, file) => {
    const src = readFileSync(file, "utf8");
    const call = src.slice(src.indexOf("intake.submit("), src.indexOf("});", src.indexOf("intake.submit(")));
    expect(call).not.toMatch(/id_?number|idNumber|bank|branch|account|salary|birth|smoker|pre_?existing|conditions|license|plate/i);
  });
});
