import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLeadIntake } from "@/hooks/useLeadIntake";
import type { LeadInput } from "@/lib/leadIntake";

// Synthetic visitor only.
const INPUT: Omit<LeadInput, "hp"> = {
  kind: "contact", name: "בדיקה סינתטית", phone: "050-0000000", topic: "אחר", consent: true, sourcePage: "/contact",
};

type Call = { key: string; body: Record<string, unknown> };

function stubFetch(statuses: number[]) {
  const calls: Call[] = [];
  let i = 0;
  const f = vi.fn(async (_url: string, init: RequestInit) => {
    calls.push({ key: (init.headers as Record<string, string>)["idempotency-key"], body: JSON.parse(String(init.body)) });
    const status = statuses[Math.min(i++, statuses.length - 1)];
    return new Response(JSON.stringify(status === 200 ? { ok: true } : { error: { code: "unavailable", message: "x" } }), { status });
  });
  vi.stubGlobal("fetch", f);
  return { f, calls };
}

describe("useLeadIntake (v2 form state)", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("a double click sends ONE request", async () => {
    const { f } = stubFetch([200]);
    const { result } = renderHook(() => useLeadIntake());
    let a!: Promise<unknown>, b!: Promise<unknown>;
    await act(async () => {
      a = result.current.submit(INPUT);
      b = result.current.submit(INPUT);
      await Promise.all([a, b]);
    });
    expect(a).toBe(b);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("a retry of the same form reuses the Idempotency-Key; an edited form or a new lead gets a new one", async () => {
    const { calls } = stubFetch([503, 200, 200]);
    const { result } = renderHook(() => useLeadIntake());
    await act(async () => { await result.current.submit(INPUT); });          // 503
    await act(async () => { await result.current.submit(INPUT); });          // retry -> same key, 200
    await act(async () => { await result.current.submit({ ...INPUT, message: "עוד" }); }); // after success -> new key
    expect(calls[1].key).toBe(calls[0].key);
    expect(calls[2].key).not.toBe(calls[1].key);
    expect(calls[0].body).not.toHaveProperty("turnstile_token"); // no site key in tests -> no widget, no token
  });

  it("an edit after a failure starts a new attempt (new key)", async () => {
    const { calls } = stubFetch([503, 200]);
    const { result } = renderHook(() => useLeadIntake());
    await act(async () => { await result.current.submit(INPUT); });
    await act(async () => { await result.current.submit({ ...INPUT, phone: "050-0000001" }); });
    expect(calls[1].key).not.toBe(calls[0].key);
  });
});
