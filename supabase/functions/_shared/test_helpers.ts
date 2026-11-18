// Test doubles for the Deno tests (supabase/functions/**/test.ts). Never imported by an index.ts.
import { type Rpc, RpcError } from "./db.ts";
import { type Env, loadEnv } from "./env.ts";
import { createLogger, type Logger } from "./logger.ts";

export type RpcCall = { fn: string; args: Record<string, unknown> };
export type RpcScript = (fn: string, args: Record<string, unknown>) => unknown | Promise<unknown>;

/** Mock Rpc: records every call; the script returns a value or throws (use rpcError()). */
export function mockRpc(script: RpcScript = () => null): Rpc & { calls: RpcCall[] } {
  const calls: RpcCall[] = [];
  return {
    calls,
    async call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
      calls.push({ fn, args: structuredClone(args) });
      return (await script(fn, args)) as T;
    },
  };
}

export function rpcError(status: number, code: string, message = "x"): RpcError {
  return new RpcError(status, code, message);
}

export function testEnv(over: Record<string, string> = {}): Env {
  const base: Record<string, string> = {
    ENV: "development",
    SUPABASE_URL: "https://example.supabase.co",
    SEELD_SECRET_KEY: "test-secret-key",
    SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_test"}',
    ALLOWED_ORIGINS: "https://seeld.co.il,https://www.seeld.co.il",
    EDGE_CRON_SECRET: "cron-secret-for-tests",
    RESEND_API_KEY: "re_test",
    GOOGLE_AI_API_KEY: "g_test",
    ...over,
  };
  return loadEnv((n) => (n in base ? base[n] : undefined));
}

export function silentLog(lines: string[] = []): Logger {
  return createLogger({}, { write: (l) => lines.push(l), level: "debug" });
}

export type FetchCall = { url: string; init?: RequestInit; body: string };

/** Mock fetch: routes by URL substring; records calls (body read as text). */
export function mockFetch(route: (url: string, body: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: FetchCall[] = [];
  const fn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const b = init?.body;
    const body = typeof b === "string" ? b : b instanceof URLSearchParams ? b.toString() : "";
    calls.push({ url, init, body });
    return await route(url, body, init);
  };
  return { fetch: fn, calls };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

export function sse(chunks: string[]): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: ch } }] })}\n\n`));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
}
