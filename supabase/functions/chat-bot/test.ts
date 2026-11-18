// deno test supabase/functions/chat-bot  (synthetic data only)
import assert from "node:assert/strict";
import { collectSse, createChatHandler, MESSAGES, parseTurns } from "./handler.ts";
import { collectingDefer } from "../_shared/background.ts";
import { createMemoryRateLimiter } from "../_shared/rateLimit.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, sse, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";

const ORIGIN = "https://seeld.co.il";
const SESSION = "sess_0123456789abcdef";

function setup(script: RpcScript, gemini: (model: string) => Response, env: Record<string, string> = {}) {
  const rpc = mockRpc(script);
  const g = mockFetch((_url, body) => gemini(JSON.parse(body).model));
  const bg = collectingDefer();
  const h = createChatHandler({ env: testEnv(env), rpc, log: silentLog(), defer: bg.defer, limiter: createMemoryRateLimiter(), fetch: g.fetch });
  return { h, rpc, g, bg };
}

const touchOk: RpcScript = (fn) => fn === "chat_session_touch" ? { session_id: "00000000-0000-4000-8000-0000000000c1", message_count: 1 } : null;

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://x/functions/v1/chat-bot", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json", "x-forwarded-for": "203.0.113.7", "x-chat-session": SESSION, ...headers },
    body: JSON.stringify(body),
  });
}

Deno.test("parseTurns: canonical and legacy shapes, window, masking", () => {
  const legacy = parseTurns({ message: "my phone is 050-123-4567", history: [{ role: "assistant", content: "hi" }] });
  assert.deepEqual(legacy.map((t) => t.role), ["assistant", "user"]);
  assert.ok(legacy[1].content.includes("[redacted-phone]"));
  const many = parseTurns({ messages: Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` })) });
  assert.equal(many.length, 12);
  assert.throws(() => parseTurns({ messages: [] }));
  assert.throws(() => parseTurns({ messages: [{ role: "user", content: "x".repeat(5001) }] }));
});

Deno.test("origin rejected: 403, no DB, no Gemini", async () => {
  const { h, rpc, g } = setup(touchOk, () => sse(["x"]));
  const r = await h(post({ messages: [{ role: "user", content: "hi" }] }, { origin: "https://evil.example" }));
  assert.equal(r.status, 403);
  assert.equal(rpc.calls.length + g.calls.length, 0);
});

Deno.test("stream: session touch, user + assistant stored, only masked user text and prompt go to Gemini", async () => {
  const { h, rpc, g, bg } = setup(touchOk, () => sse(["שלום", " עולם"]));
  const r = await h(post({ messages: [{ role: "user", content: "mail me at a.b@example.com" }], page: "/contact" }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "text/event-stream");
  assert.equal(r.headers.get("x-chat-session"), SESSION);
  assert.equal(await collectSse(r.body!), "שלום עולם");
  await bg.settle();
  const sent = JSON.parse(g.calls[0].body);
  assert.equal(sent.model, "gemini-3.5-flash-lite");
  assert.equal(sent.max_tokens, 700);
  assert.equal(sent.messages[0].role, "system");
  assert.ok(sent.messages.at(-1).content.includes("[redacted-email]"));
  assert.ok(!g.calls[0].body.includes("203.0.113.7") && !g.calls[0].body.includes(SESSION));
  assert.deepEqual(rpc.calls[0], { fn: "chat_session_touch", args: { p_session_key: SESSION, p_client_ip: "203.0.113.7" } });
  const appends = rpc.calls.filter((c) => c.fn === "chat_append").map((c) => c.args.p_role);
  assert.deepEqual(appends.sort(), ["assistant", "user"]);
  assert.equal(rpc.calls.find((c) => c.fn === "chat_append" && c.args.p_role === "assistant")!.args.p_content, "שלום עולם");
});

Deno.test("model chain: 503 on the first model falls back to the next", async () => {
  const { h, g } = setup(touchOk, (m) => m === "gemini-3.5-flash-lite" ? json({}, 503) : sse(["ok"]));
  const r = await h(post({ messages: [{ role: "user", content: "hi" }] }));
  assert.equal(r.status, 200);
  assert.deepEqual(g.calls.map((c) => JSON.parse(c.body).model), ["gemini-3.5-flash-lite", "gemini-3.5-flash"]);
});

Deno.test("all models busy: 503 with the Hebrew busy message; a 400 stops the chain", async () => {
  const { h } = setup(touchOk, () => json({}, 503));
  const r = await h(post({ messages: [{ role: "user", content: "hi" }] }));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error.message, MESSAGES.busy);
  const b = setup(touchOk, () => json({}, 400));
  const r2 = await b.h(post({ messages: [{ role: "user", content: "hi" }] }));
  assert.equal(r2.status, 500);
  assert.equal(b.g.calls.length, 1);
});

Deno.test("DB limits and kill switch: PT429 -> 429, PT423 -> 503 disabled, no Gemini call", async () => {
  const a = setup((fn) => { if (fn === "chat_session_touch") throw rpcError(429, "PT429", "rate_limited"); return null; }, () => sse(["x"]));
  assert.equal((await a.h(post({ messages: [{ role: "user", content: "hi" }] }))).status, 429);
  assert.equal(a.g.calls.length, 0);
  const b = setup((fn) => { if (fn === "chat_session_touch") throw rpcError(423, "PT423", "feature_disabled:chat_enabled"); return null; }, () => sse(["x"]));
  const r = await b.h(post({ messages: [{ role: "user", content: "hi" }] }));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error.message, MESSAGES.disabled);
});

Deno.test("unreachable DB gate fails closed: 503 disabled, no Gemini call, nothing stored", async () => {
  const { h, rpc, g, bg } = setup((fn) => { if (fn === "chat_session_touch") throw rpcError(0, "network", "x"); return null; }, () => sse(["ok"]));
  const r = await h(post({ messages: [{ role: "user", content: "hi" }] }));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error.message, MESSAGES.disabled);
  await bg.settle();
  assert.equal(g.calls.length, 0);
  assert.equal(rpc.calls.filter((c) => c.fn === "chat_append").length, 0);
});

Deno.test("no client IP or no DB client: the gate is never skipped (503, no Gemini call)", async () => {
  const a = setup(touchOk, () => sse(["x"]));
  const r = await a.h(post({ messages: [{ role: "user", content: "hi" }] }, { "x-forwarded-for": "10.0.0.2" }));
  assert.equal(r.status, 503);
  assert.equal(a.g.calls.length + a.rpc.calls.length, 0);
  const g = mockFetch(() => sse(["x"]));
  const bg = collectingDefer();
  const h = createChatHandler({ env: testEnv(), rpc: null, log: silentLog(), defer: bg.defer, limiter: createMemoryRateLimiter(), fetch: g.fetch });
  assert.equal((await h(post({ messages: [{ role: "user", content: "hi" }] }))).status, 503);
  assert.equal(g.calls.length, 0);
});

Deno.test("no GOOGLE_AI_API_KEY: 503, not a crash; bad session header gets a fresh key", async () => {
  const { h } = setup(touchOk, () => sse(["x"]), { GOOGLE_AI_API_KEY: "" });
  assert.equal((await h(post({ messages: [{ role: "user", content: "hi" }] }))).status, 503);
  const s = setup(touchOk, () => sse(["x"]));
  const r = await s.h(post({ messages: [{ role: "user", content: "hi" }] }, { "x-chat-session": "short" }));
  assert.match(r.headers.get("x-chat-session") ?? "", /^[A-Za-z0-9_-]{16,128}$/);
  await r.body?.cancel();
});
