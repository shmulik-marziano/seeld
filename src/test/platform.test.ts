import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseConfig, PlatformConfigError } from "@/platform/config";
import { backoffDelay, withRetry, isRetryAllowed, DEFAULT_RETRY } from "@/platform/api/retry";
import { ApiError, normalizeHttpError, normalizeThrown, parseRetryAfter, codeFromStatus } from "@/platform/api/errors";
import { ApiClient, buildUrl } from "@/platform/api/client";
import { clearingHouseRawSchema, harHabituachRawSchema, thirdSourceRawSchema } from "@/platform/documents/schemas";
import { canTransition, isTerminal } from "@/platform/documents/types";
import { listSources, getSource } from "@/platform/documents/registry";
import { runPipeline } from "@/platform/documents/pipeline";
import { resolveFlags, parseOverrides } from "@/platform/flags";
import { mergeAgentSecurity, meetsAgentPolicy } from "@/platform/auth/types";
import { scrubMeta } from "@/platform/events";

const goodEnv = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "x".repeat(40),
};

describe("platform config", () => {
  it("applies defaults", () => {
    const c = parseConfig({ ...goodEnv, MODE: "production" });
    expect(c.api).toEqual({ baseUrl: "/api/v1", timeoutMs: 15000, maxRetries: 2 });
    expect(c.env).toBe("production");
  });
  it("rejects a bad url and a short key", () => {
    expect(() => parseConfig({ VITE_SUPABASE_URL: "nope", VITE_SUPABASE_PUBLISHABLE_KEY: "x" })).toThrow(PlatformConfigError);
  });
  it("honours VITE_APP_ENV and coerces numbers", () => {
    const c = parseConfig({ ...goodEnv, VITE_APP_ENV: "preview", VITE_API_TIMEOUT_MS: "3000" });
    expect(c.env).toBe("preview");
    expect(c.api.timeoutMs).toBe(3000);
  });
  it("treats empty strings as unset", () => {
    expect(parseConfig({ ...goodEnv, VITE_API_BASE_URL: "  " }).api.baseUrl).toBe("/api/v1");
  });
});

describe("retry and backoff", () => {
  const p = { ...DEFAULT_RETRY, jitter: 0 };
  it("grows exponentially and caps", () => {
    expect(backoffDelay(1, p)).toBe(300);
    expect(backoffDelay(2, p)).toBe(600);
    expect(backoffDelay(10, p)).toBe(5000);
  });
  it("honours retry-after", () => {
    expect(backoffDelay(1, p, () => 0.5, 2000)).toBe(2000);
  });
  it("retries retryable errors then succeeds", async () => {
    let n = 0;
    const delays: number[] = [];
    const out = await withRetry(
      async () => {
        if (++n < 3) throw new ApiError({ code: "unavailable", message: "x", status: 503 });
        return "ok";
      },
      { policy: p, sleep: async (ms) => void delays.push(ms) },
    );
    expect(out).toBe("ok");
    expect(delays).toEqual([300, 600]);
  });
  it("does not retry non-retryable or disallowed", async () => {
    let n = 0;
    await expect(withRetry(async () => { n++; throw new ApiError({ code: "forbidden", message: "x", status: 403 }); }, { sleep: async () => {} })).rejects.toThrow();
    expect(n).toBe(1);
    n = 0;
    await expect(withRetry(async () => { n++; throw new ApiError({ code: "unavailable", message: "x" }); }, { allowed: false, sleep: async () => {} })).rejects.toThrow();
    expect(n).toBe(1);
  });
  it("only retries POST with an idempotency key", () => {
    expect(isRetryAllowed("POST", false)).toBe(false);
    expect(isRetryAllowed("POST", true)).toBe(true);
    expect(isRetryAllowed("GET", false)).toBe(true);
  });
});

describe("error normalisation", () => {
  it("maps statuses", () => {
    expect(codeFromStatus(401)).toBe("unauthenticated");
    expect(codeFromStatus(429)).toBe("rate_limited");
    expect(codeFromStatus(503)).toBe("unavailable");
    expect(codeFromStatus(500)).toBe("internal");
  });
  it("reads the standard envelope", () => {
    const h = new Headers({ "retry-after": "2" });
    const e = normalizeHttpError(429, { error: { code: "rate_limited", message: "slow", requestId: "r1" } }, h);
    expect(e.code).toBe("rate_limited");
    expect(e.requestId).toBe("r1");
    expect(e.retryAfterMs).toBe(2000);
    expect(e.retryable).toBe(true);
  });
  it("falls back for non-envelope bodies", () => {
    const e = normalizeHttpError(502, "<html>bad gateway</html>");
    expect(e.code).toBe("unavailable");
  });
  it("normalises thrown values", () => {
    expect(normalizeThrown(new TypeError("fetch failed")).code).toBe("network");
    expect(normalizeThrown(Object.assign(new Error("a"), { name: "AbortError" })).code).toBe("aborted");
    expect(normalizeThrown(new Error("a"), { timedOut: true }).code).toBe("timeout");
  });
  it("parses retry-after dates", () => {
    expect(parseRetryAfter("Wed, 21 Oct 2015 07:28:05 GMT", Date.parse("Wed, 21 Oct 2015 07:28:00 GMT"))).toBe(5000);
    expect(parseRetryAfter(null)).toBeUndefined();
  });
});

describe("api client", () => {
  it("builds urls", () => {
    expect(buildUrl("/api/v1/", "health", { a: 1, b: undefined })).toBe("/api/v1/health?a=1");
  });
  it("injects auth + request id and retries a 503 GET", async () => {
    const seen: Record<string, string>[] = [];
    let n = 0;
    const fetchImpl = (async (_u: string, init: RequestInit) => {
      seen.push(init.headers as Record<string, string>);
      return ++n === 1
        ? new Response("{}", { status: 503 })
        : new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }) as unknown as typeof fetch;
    const c = new ApiClient({ baseUrl: "/api/v1", getToken: () => "tok", fetchImpl, makeRequestId: () => "rid", sleep: async () => {}, retry: { jitter: 0 } });
    const out = await c.get<{ status: string }>("/health");
    expect(out.status).toBe("ok");
    expect(n).toBe(2);
    expect(seen[0].authorization).toBe("Bearer tok");
    expect(seen[0]["x-request-id"]).toBe("rid");
  });
  it("normalises a 403", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ error: { code: "forbidden", message: "no" } }), { status: 403 })) as unknown as typeof fetch;
    const c = new ApiClient({ baseUrl: "/x", fetchImpl });
    await expect(c.get("/a")).rejects.toMatchObject({ code: "forbidden", status: 403 });
  });
});

describe("document sources", () => {
  it("registers three source types", () => {
    expect(listSources().map((s) => s.type).sort()).toEqual(["clearing-house", "har-habituach", "third-source"]);
  });
  it("raw schemas have the expected shape and default arrays", () => {
    expect(clearingHouseRawSchema.parse({}).accounts).toEqual([]);
    expect(harHabituachRawSchema.parse({}).policies).toEqual([]);
    expect(thirdSourceRawSchema.safeParse({ anything: 1 }).success).toBe(true);
    expect(clearingHouseRawSchema.safeParse({ accounts: [{}] }).success).toBe(false);
  });
  it("status transitions", () => {
    expect(canTransition("uploaded", "validating")).toBe(true);
    expect(canTransition("ready", "parsing")).toBe(false);
    expect(canTransition("failed", "uploaded")).toBe(true);
    expect(isTerminal("ready")).toBe(true);
  });
  it("pipeline rejects bad files and fails cleanly while parsers are unbuilt", async () => {
    const a = getSource("clearing-house");
    const bad = await runPipeline(a, { name: "a.exe", mimeType: "application/x-msdownload", sizeBytes: 10 }, new Uint8Array());
    expect(bad).toMatchObject({ status: "rejected", errorCode: "unsupported_mime_type" });
    const seen: string[] = [];
    const nope = await runPipeline(a, { name: "a.pdf", mimeType: "application/pdf", sizeBytes: 10 }, new Uint8Array(), { onStatus: (s) => seen.push(s) });
    expect(nope).toMatchObject({ status: "failed", errorCode: "not_implemented" });
    expect(seen).toEqual(["validating", "parsing", "failed"]);
  });
});

describe("flags, auth settings, audit", () => {
  it("defaults off, overrides apply, unknown ignored", () => {
    expect(resolveFlags()["portal.enabled"]).toBe(false);
    expect(resolveFlags("portal.enabled=true,bogus=true")["portal.enabled"]).toBe(true);
    expect(parseOverrides("bogus=true")).toEqual({});
  });
  it("agent security defaults require TOTP", () => {
    const s = mergeAgentSecurity();
    expect(meetsAgentPolicy(s, "aal1")).toBe(false);
    expect(meetsAgentPolicy(s, "aal2")).toBe(true);
    expect(mergeAgentSecurity({ idleTimeoutMinutes: 0 }).idleTimeoutMinutes).toBe(1);
  });
  it("scrubs pii-looking keys", () => {
    expect(scrubMeta({ phone: "050", count: 2, email: "a@b" })).toEqual({ count: 2 });
  });
});

describe("platform isolation", () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.(ts|tsx)$/.test(f)) out.push(p);
    }
    return out;
  }
  const src = join(__dirname, "..");
  it("no file outside src/platform and src/test imports the platform layer", () => {
    const offenders = walk(src)
      .filter((f) => !f.includes(`${join("src", "platform")}`) && !f.includes(`${join("src", "test")}`))
      .filter((f) => /from\s+["'](@\/platform|(\.\.?\/)+platform)/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
  it("platform never imports pages, components or the app supabase client", () => {
    const offenders = walk(join(src, "platform")).filter((f) =>
      /from\s+["']@\/(pages|components|hooks|contexts|integrations)/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
