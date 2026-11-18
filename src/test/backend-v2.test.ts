import { describe, it, expect, vi, afterEach } from "vitest";
import { readAllPages } from "@/lib/apiPaging";

// Build-time backend switch (docs/platform/FRONTEND-BACKEND-V2.md). Both modes are exercised here:
// legacy must stay exactly as before (Tokyo defaults), v2 must use seeld-site's api schema and never Tokyo.

const TOKYO = "lvifatyksqizwcutfbqp";
const V2_URL = "https://v2-test.supabase.co";
const V2_KEY = "sb_publishable_test_only";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  delete process.env.VITE_SEELD_BACKEND;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
});

describe("config: legacy mode (default)", () => {
  it("keeps the Tokyo defaults and IS_V2 = false", async () => {
    vi.resetModules();
    const c = await import("@/integrations/supabase/config");
    expect(c.IS_V2).toBe(false);
    expect(c.SEELD_BACKEND).toBe("legacy");
    expect(c.SUPABASE_URL).toContain(TOKYO);
    expect(c.SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ")).toBe(true);
  });

  it("legacy client is the persisted-session auth client on the default (public) schema", async () => {
    vi.resetModules();
    const { supabase } = await import("@/integrations/supabase/client");
    const { siteSupabase } = await import("@/integrations/supabase/site-client");
    expect(siteSupabase).toBe(supabase);
    const f = vi.fn(async () => new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", f);
    await siteSupabase.from("blog_posts").select("slug").limit(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain(TOKYO);
    const h = new Headers(init.headers);
    expect(h.get("accept-profile")).not.toBe("api");
  });
});

describe("config + client: v2 mode", () => {
  it("reads URL/key from the env, with no Tokyo fallback", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_SUPABASE_URL", V2_URL);
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", V2_KEY);
    vi.resetModules();
    const c = await import("@/integrations/supabase/config");
    expect(c.IS_V2).toBe(true);
    expect(c.SUPABASE_URL).toBe(V2_URL);
    expect(c.SUPABASE_PUBLISHABLE_KEY).toBe(V2_KEY);
  });

  it("an unset URL stays empty in v2 (never Tokyo)", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_SUPABASE_URL", undefined as unknown as string);
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", undefined as unknown as string);
    vi.resetModules();
    const c = await import("@/integrations/supabase/config");
    expect(c.SUPABASE_URL).toBe("");
    expect(c.SUPABASE_PUBLISHABLE_KEY).toBe("");
  });

  it("the one client reads the api schema, stores no session, and hasStoredSession() is false", async () => {
    vi.stubEnv("VITE_SEELD_BACKEND", "v2");
    vi.stubEnv("VITE_SUPABASE_URL", V2_URL);
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", V2_KEY);
    vi.resetModules();
    localStorage.setItem("sb-x-auth-token", "{}");
    const { supabase } = await import("@/integrations/supabase/client");
    const { apiSupabase } = await import("@/integrations/supabase/v2-client");
    const { hasStoredSession } = await import("@/integrations/supabase/lazy");
    const { siteSupabase } = await import("@/integrations/supabase/site-client");
    expect(apiSupabase as unknown).toBe(supabase);
    expect(hasStoredSession()).toBe(false);
    localStorage.removeItem("sb-x-auth-token");
    const f = vi.fn(async () => new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", f);
    await siteSupabase.from("blog_posts").select("slug").limit(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url).startsWith(`${V2_URL}/rest/v1/blog_posts`)).toBe(true);
    expect(new Headers(init.headers).get("accept-profile")).toBe("api");
  });
});

describe("readAllPages", () => {
  it("follows count=exact across 200-row pages", async () => {
    const all = Array.from({ length: 450 }, (_, i) => i);
    const seen: Array<[number, number]> = [];
    const rows = await readAllPages<number>(async (from, to) => {
      seen.push([from, to]);
      return { data: all.slice(from, to + 1), error: null, count: all.length };
    });
    expect(rows).toEqual(all);
    expect(seen).toEqual([[0, 199], [200, 399], [400, 599]]);
  });

  it("does not stop early when the server caps pages below the requested size", async () => {
    const all = Array.from({ length: 250 }, (_, i) => i);
    const rows = await readAllPages<number>(async (from) => ({ data: all.slice(from, from + 100), error: null, count: 250 }));
    expect(rows).toHaveLength(250);
  });

  it("throws the first error", async () => {
    await expect(readAllPages(async () => ({ data: null, error: new Error("boom") }))).rejects.toThrow("boom");
  });
});

// ── api/*.ts serverless proxies ──────────────────────────────────────────────

type Req = { url: string; headers: Record<string, string>; method?: string };

function servePostgrest(total: number) {
  const reqs: Req[] = [];
  const f = vi.fn(async (url: string, init: RequestInit = {}) => {
    // plain-object headers, lower-cased by hand (jsdom's Headers drops Range)
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
    reqs.push({ url, headers, method: init.method });
    const [a, b] = (headers.range ?? "0-999").split("-").map(Number);
    const to = Math.min(b, total - 1);
    const page = a >= total ? [] : Array.from({ length: to - a + 1 }, (_, i) => ({ n: a + i }));
    return new Response(JSON.stringify(page), {
      status: 206,
      headers: { "content-type": "application/json", "content-range": `${a}-${to}/${total}` },
    });
  });
  vi.stubGlobal("fetch", f);
  return reqs;
}

async function loadRoute(name: string, v2: boolean) {
  vi.resetModules();
  if (v2) {
    process.env.VITE_SEELD_BACKEND = "v2";
    process.env.VITE_SUPABASE_URL = V2_URL;
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = V2_KEY;
  }
  const mod = (await import(`../../api/${name}.ts`)) as { default: { fetch: (r: Request) => Promise<Response> } };
  return mod.default.fetch;
}

describe("api proxies, v2", () => {
  it.each([
    ["board", 1257, "cma_board?"],
    ["funds", 1442, "cma_funds_latest?"],
    ["tracks", 571, "investment_tracks?"],
    ["company-map", 120, "cma_company_map?"],
  ])("api/%s reads all %i rows of api.* in 200-row Range pages with count=exact", async (name, total, path) => {
    const reqs = servePostgrest(total);
    const handler = await loadRoute(name, true);
    const res = await handler(new Request(`https://seeld.co.il/api/${name}`));
    expect(res.status).toBe(200);
    expect(((await res.json()) as unknown[]).length).toBe(total);
    expect(reqs.length).toBe(Math.ceil(total / 200));
    reqs.forEach((r, i) => {
      expect(r.url.startsWith(`${V2_URL}/rest/v1/${path}`)).toBe(true);
      expect(r.headers["accept-profile"]).toBe("api");
      expect(r.headers.prefer).toBe("count=exact");
      expect(r.headers.range).toBe(`${i * 200}-${i * 200 + 199}`);
      expect(r.headers.apikey).toBe(V2_KEY);
      expect(r.headers.authorization).toBeUndefined();
    });
    if (name === "tracks") expect(reqs[0].url).toContain("source_period");
  });

  it("api/fund-status reads api.cma_sync_log and the exact count", async () => {
    const reqs = servePostgrest(1442);
    const handler = await loadRoute("fund-status", true);
    const res = await handler(new Request("https://seeld.co.il/api/fund-status"));
    expect(res.status).toBe(200);
    expect(reqs.every((r) => r.url.startsWith(V2_URL) && r.headers["accept-profile"] === "api")).toBe(true);
    expect(((await res.json()) as { totalFunds: number }).totalFunds).toBe(1442);
  });

  it("fails closed (502, no-store) when the v2 URL is not configured", async () => {
    vi.resetModules();
    process.env.VITE_SEELD_BACKEND = "v2";
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const mod = (await import("../../api/funds.ts")) as { default: { fetch: (r: Request) => Promise<Response> } };
    const res = await mod.default.fetch(new Request("https://seeld.co.il/api/funds"));
    expect(res.status).toBe(502);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ error: "unavailable" }); // the reason stays in the function log
    expect(f).not.toHaveBeenCalled();
  });
});

describe("api proxies, legacy (unchanged)", () => {
  it("api/board still pages Tokyo 1,000 rows at a time with the anon JWT", async () => {
    const reqs = servePostgrest(1257);
    const handler = await loadRoute("board", false);
    const res = await handler(new Request("https://seeld.co.il/api/board"));
    expect(((await res.json()) as unknown[]).length).toBe(1257);
    expect(reqs.map((r) => r.headers.range)).toEqual(["0-999", "1000-1999"]);
    expect(reqs[0].url).toContain(TOKYO);
    expect(reqs[0].headers.authorization?.startsWith("Bearer eyJ")).toBe(true);
    expect(reqs[0].headers["accept-profile"]).toBeUndefined();
  });

  it("api/tracks still asks Tokyo for the legacy column list (no source_period)", async () => {
    const reqs = servePostgrest(10);
    const handler = await loadRoute("tracks", false);
    await handler(new Request("https://seeld.co.il/api/tracks"));
    expect(reqs[0].url).toContain(TOKYO);
    expect(reqs[0].url).not.toContain("source_period");
  });
});
