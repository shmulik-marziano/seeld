// CI coverage for the pure Surense connector modules (the Deno suites under supabase/functions are not run by CI).
// Synthetic data only; the Svix secret is generated per run.
import { describe, expect, it } from "vitest";
import { svixSignature, SVIX_TOLERANCE_SEC, verifyWebhook } from "../../supabase/functions/_shared/surense/svix.ts";
import { apiUrl, assertAllowedUrl, pathLabel, SURENSE_API } from "../../supabase/functions/_shared/surense/client.ts";
import { fromResponse, surenseCode } from "../../supabase/functions/_shared/surense/errors.ts";
import { CUSTOMER_INDEX_KEYS, mapCustomer, TRANSPORT_KEYS } from "../../supabase/functions/_shared/surense/mirror.ts";
import { planEvent } from "../../supabase/functions/_shared/surense/sync.ts";

const CID = "c0000000-0000-4000-8000-000000000001";
const NOW = 1_763_600_000;
const secret = () => "whsec_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
const headers = (id: string, ts: number, sig: string) => new Headers({ "svix-id": id, "svix-timestamp": String(ts), "svix-signature": sig });

describe("surense svix verification", () => {
  it("accepts a valid v1 signature and refuses tampering and skew", async () => {
    const s = secret();
    const body = '{"type":"customer.created"}';
    const sig = await svixSignature(s, "msg_vitest", String(NOW), body);
    expect(await verifyWebhook(headers("msg_vitest", NOW, `v1,${sig}`), body, s, NOW)).toEqual({ ok: true, id: "msg_vitest", ts: NOW });
    expect(await verifyWebhook(headers("msg_vitest", NOW, `v1,${sig}`), body + "x", s, NOW)).toEqual({ ok: false, reason: "signature" });
    const late = NOW + SVIX_TOLERANCE_SEC + 1;
    expect(await verifyWebhook(headers("msg_vitest", NOW, `v1,${sig}`), body, s, late)).toEqual({ ok: false, reason: "timestamp" });
    expect(await verifyWebhook(headers("msg_vitest", NOW, `v1,${sig}`), body, null, NOW)).toEqual({ ok: false, reason: "secret" });
  });
});

describe("surense client host lock", () => {
  it("builds only api.surense.com/api/v1 URLs", () => {
    expect(apiUrl("/customers/search")).toBe(`${SURENSE_API}/customers/search`);
    for (const p of ["/../oauth/token", "//evil.example/x", "x", "/a?b"]) expect(() => apiUrl(p)).toThrow();
    expect(() => assertAllowedUrl("https://evil.example/f")).toThrow();
    expect(assertAllowedUrl("https://api.surense.com/f").hostname).toBe("api.surense.com");
    expect(pathLabel(`/customers/${CID}`)).toBe("/customers/{id}");
  });
  it("keeps the numeric code and drops the server message", () => {
    const body = JSON.stringify({ statusCode: 400, errors: [{ code: 40001, message: "zz echoed value" }] });
    expect(surenseCode(400, body)).toBe("40001");
    const e = fromResponse(new Response(body, { status: 400 }), body);
    expect(e.message).not.toContain("zz");
    expect([e.status, e.code, e.kind]).toEqual([400, "40001", "permanent"]);
    expect(fromResponse(new Response("", { status: 429, headers: { "retry-after": "5" } }), "").retryAfterSec).toBe(5);
  });
});

describe("surense mirror mapping", () => {
  it("puts no personal value in an indexable column", () => {
    const row = mapCustomer({ id: CID, firstName: "Zzfirst", lastName: "Zzlast", idType: { code: 1 }, idNumber: "012345678", email: "zz@example.test",
      cellNumber: "+972500000000", statusName: "active" }) as Record<string, unknown>;
    const allowed = [...CUSTOMER_INDEX_KEYS, ...TRANSPORT_KEYS] as string[];
    expect(Object.keys(row).every((k) => allowed.includes(k))).toBe(true);
    const index = JSON.stringify(Object.fromEntries(Object.entries(row).filter(([k]) => (CUSTOMER_INDEX_KEYS as readonly string[]).includes(k))));
    for (const v of ["Zzfirst", "Zzlast", "012345678", "zz@example.test", "+972500000000"]) expect(index).not.toContain(v);
  });
  it("routes webhook events by type", () => {
    expect(planEvent("dataproxy.bet.approved", { data: { customerId: CID } })).toEqual({ action: "pull_documents", customerId: CID, poaKind: "policies" });
    expect(planEvent("activity.created", {})).toEqual({ action: "skip", reason: "no_handler" });
  });
});
