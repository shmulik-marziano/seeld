import { describe, it, expect } from "vitest";
import { createLogger, redact, redactString } from "../../supabase/functions/_shared/logger.ts";
import { createMemoryRateLimiter } from "../../supabase/functions/_shared/rateLimit.ts";
import { HttpError, errorResponse } from "../../supabase/functions/_shared/errors.ts";
import { authenticate } from "../../supabase/functions/_shared/auth.ts";
import { corsHeaders, parseAllowedOrigins } from "../../supabase/functions/_shared/cors.ts";
import { apiPath, handle } from "../../supabase/functions/api-v1/router.ts";

describe("logger redaction", () => {
  it("redacts ids, phones, emails, tokens", () => {
    expect(redactString("id 123456789 ok")).toBe("id [redacted-id] ok");
    expect(redactString("call 052-309-7444 now")).toContain("[redacted-phone]");
    expect(redactString("+972523097444")).toBe("[redacted-phone]");
    expect(redactString("a.b@seeld.co.il")).toBe("[redacted-email]");
    expect(redactString("Bearer abcdefghijklmnop")).toBe("Bearer [redacted]");
  });
  it("redacts by key and nested", () => {
    expect(redact({ phone: "1", nested: { email: "a@b.co", ok: 5 }, list: ["0501234567"] })).toEqual({
      phone: "[redacted]",
      nested: { email: "[redacted]", ok: 5 },
      list: ["[redacted-phone]"],
    });
  });
  it("emits one json line and respects level", () => {
    const lines: string[] = [];
    const l = createLogger({ fn: "t" }, { write: (s) => lines.push(s), now: () => new Date(0) });
    l.debug("no");
    l.info("hi 123456789", { requestId: "r" });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ level: "info", msg: "hi [redacted-id]", fn: "t", requestId: "r", ts: "1970-01-01T00:00:00.000Z" });
  });
});

describe("rate limiter", () => {
  it("allows up to the limit then blocks, then resets", async () => {
    let t = 0;
    const rl = createMemoryRateLimiter(() => t);
    expect((await rl.consume("k", 2, 60)).allowed).toBe(true);
    expect((await rl.consume("k", 2, 60)).allowed).toBe(true);
    const third = await rl.consume("k", 2, 60);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
    t = 61_000;
    expect((await rl.consume("k", 2, 60)).allowed).toBe(true);
  });
});

describe("errors, auth, cors", () => {
  it("formats the standard envelope and hides internals", async () => {
    const r = errorResponse(new Error("db password leaked"), "rid");
    expect(r.status).toBe(500);
    const b = await r.json();
    expect(b).toEqual({ error: { code: "internal", message: "Internal error", requestId: "rid" } });
    expect(errorResponse(new HttpError("rate_limited", "x"), "r").status).toBe(429);
  });
  it("authenticates api keys and bearer tokens", async () => {
    const v = {
      verifyJwt: async (t: string) => (t === "good" ? { userId: "u1", aal: "aal2" as const } : null),
      verifyApiKey: async (k: string) => (k === "key" ? { clientId: "c1", scopes: ["a"], rateLimitPerMin: 5 } : null),
    };
    expect((await authenticate(new Request("http://x", { headers: { "x-api-key": "key" } }), v)).kind).toBe("client");
    expect((await authenticate(new Request("http://x", { headers: { authorization: "Bearer good" } }), v)).kind).toBe("user");
    await expect(authenticate(new Request("http://x"), v)).rejects.toMatchObject({ code: "unauthenticated" });
  });
  it("cors allow-list", () => {
    const allowed = parseAllowedOrigins(undefined);
    expect(corsHeaders("https://seeld.co.il", allowed)["Access-Control-Allow-Origin"]).toBe("https://seeld.co.il");
    expect(corsHeaders("https://evil.example", allowed)["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

describe("api-v1 router", () => {
  const deps = { logger: createLogger({}, { write: () => {} }), allowedOrigins: ["https://seeld.co.il"], commit: "abc", now: () => new Date(0) };
  it("maps mount prefixes", () => {
    expect(apiPath("/functions/v1/api-v1/health")).toBe("/health");
    expect(apiPath("/api/v1/version/")).toBe("/version");
    expect(apiPath("/api-v1")).toBe("/");
  });
  it("serves health and version", async () => {
    const h = await handle(new Request("http://x/api/v1/health"), deps);
    expect(h.status).toBe(200);
    expect(await h.json()).toEqual({ status: "ok", time: "1970-01-01T00:00:00.000Z" });
    const v = await handle(new Request("http://x/api/v1/version"), deps);
    expect(await v.json()).toMatchObject({ name: "seeld-api", commit: "abc" });
  });
  it("404 and 405", async () => {
    expect((await handle(new Request("http://x/api/v1/nope"), deps)).status).toBe(404);
    expect((await handle(new Request("http://x/api/v1/health", { method: "POST" }), deps)).status).toBe(405);
  });
});
