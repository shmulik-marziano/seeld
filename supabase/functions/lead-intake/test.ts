// deno test supabase/functions/lead-intake  (synthetic data only)
import assert from "node:assert/strict";
import { canonicalLead, createLeadHandler, createRejectCounter, REJECT_LIMIT } from "./handler.ts";
import { collectingDefer } from "../_shared/background.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";

const ORIGIN = "https://seeld.co.il";
const LEAD = { kind: "contact", full_name: "Test Person", phone: "050-0000000", consent: true, payload: { subject: "general", page: "/contact" } };

function setup(script: RpcScript, opts: { env?: Record<string, string>; turnstile?: boolean } = {}) {
  const rpc = mockRpc(script);
  const tsFetch = mockFetch(() => json({ success: opts.turnstile ?? true, hostname: "seeld.co.il" }));
  const bg = collectingDefer();
  const env = testEnv({ TURNSTILE_SECRET_KEY: "ts_secret", ...(opts.env ?? {}) });
  const h = createLeadHandler({ env, rpc, log: silentLog(), defer: bg.defer, rejects: createRejectCounter(), fetch: tsFetch.fetch });
  return { h, rpc, tsFetch, bg };
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://x/functions/v1/lead-intake", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json", "idempotency-key": "idem-key-0001", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("origin rejected: 403 and zero DB calls", async () => {
  const { h, rpc } = setup(() => null);
  const r = await h(post({ ...LEAD, turnstile_token: "t" }, { origin: "https://evil.example" }));
  assert.equal(r.status, 403);
  assert.equal(r.headers.get("access-control-allow-origin"), null);
  assert.deepEqual((await r.json()).error.details, { field: "origin" });
  assert.equal(rpc.calls.length, 0);
  const r2 = await h(post({ ...LEAD }, { origin: "" }));
  assert.equal(r2.status, 403);
  assert.equal(rpc.calls.length, 0);
});

Deno.test("shape rejects: 400 with a field, zero DB calls", async () => {
  const { h, rpc } = setup(() => null);
  for (const [body, field] of [
    [{ ...LEAD, phone: "123" }, "phone"],
    [{ ...LEAD, consent: false }, "consent"],
    [{ ...LEAD, phone: "", email: "" }, "contact"],
    [{ ...LEAD, national_id: "x" }, "payload_key"],
    [{ ...LEAD, payload: { page: "123456789" } }, "payload_value"],
    [{ ...LEAD, kind: "nope" }, "kind"],
  ] as const) {
    const r = await h(post(body));
    assert.equal(r.status, 400, field);
    assert.equal((await r.json()).error.details.field, field);
  }
  assert.equal((await h(post("{not json"))).status, 400);
  assert.equal((await h(post(LEAD, { "idempotency-key": "short" }))).status, 400);
  assert.equal(rpc.calls.length, 0);
});

Deno.test("too large: 413 without DB", async () => {
  const { h, rpc } = setup(() => null);
  const r = await h(post({ ...LEAD, message: "x".repeat(40_000) }));
  assert.equal(r.status, 413);
  assert.equal(rpc.calls.length, 0);
});

Deno.test("honeypot: {ok:true} and nothing stored", async () => {
  const { h, rpc } = setup(() => null);
  const r = await h(post({ ...LEAD, hp: "bot" }));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(rpc.calls.length, 0);
});

Deno.test("happy path: replay miss, Turnstile, submit; browser gets exactly {ok:true} even for a duplicate", async () => {
  const { h, rpc, tsFetch } = setup((fn) => fn === "submit_lead" ? { ok: true, id: "00000000-0000-4000-8000-000000000009", duplicate: true } : null);
  const r = await h(post({ ...LEAD, turnstile_token: "tok-1" }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
  assert.deepEqual(await r.json(), { ok: true });
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["lead_replay", "submit_lead"]);
  const submit = rpc.calls[1].args;
  assert.equal(submit.p_client_ip, "203.0.113.7");
  assert.equal(submit.p_idem_key, "idem-key-0001");
  assert.equal((submit.p_payload as Record<string, unknown>).turnstile_token, undefined);
  assert.equal(tsFetch.calls.length, 1);
  assert.ok(!tsFetch.calls[0].body.includes("idempotency_key"), "the lead key never goes to siteverify");
});

Deno.test("same key + new turnstile_token replays before Turnstile (token never in the hashed payload)", async () => {
  let stored: unknown = null;
  const { h, rpc, tsFetch } = setup((fn, args) => {
    if (fn === "lead_replay") return stored && JSON.stringify(args.p_payload) === JSON.stringify(stored) ? { ok: true, id: "x", replay: true } : null;
    if (fn === "submit_lead") { stored = args.p_payload; return { ok: true, id: "x" }; }
    return null;
  });
  assert.equal((await h(post({ ...LEAD, turnstile_token: "tok-1" }))).status, 200);
  const r2 = await h(post({ ...LEAD, turnstile_token: "tok-2" }));
  assert.deepEqual(await r2.json(), { ok: true });
  assert.equal(tsFetch.calls.length, 1, "second request did not spend a Turnstile token");
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["lead_replay", "submit_lead", "lead_replay"]);
  // nested shape {lead, turnstile_token} hashes the same canonical payload
  assert.deepEqual(canonicalLead({ lead: LEAD, turnstile_token: "z" }).payload, canonicalLead({ ...LEAD, turnstile_token: "y" }).payload);
});

Deno.test("Turnstile failure: 403, only the read-only replay touched the DB, no reject note", async () => {
  const { h, rpc, bg } = setup(() => null, { turnstile: false });
  const r = await h(post({ ...LEAD, turnstile_token: "bad" }));
  await bg.settle();
  assert.equal(r.status, 403);
  assert.deepEqual((await r.json()).error.details, { field: "turnstile" }, "told apart from the origin 403");
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["lead_replay"]);
});

Deno.test("production without TURNSTILE_SECRET_KEY: 503, nothing written", async () => {
  const { h, rpc } = setup(() => null, { env: { ENV: "production", TURNSTILE_SECRET_KEY: "" } });
  const r = await h(post({ ...LEAD, turnstile_token: "t" }));
  assert.equal(r.status, 503);
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["lead_replay"]);
});

Deno.test("non-production without TURNSTILE_SECRET_KEY: skipped with a warning", async () => {
  const { h, rpc } = setup((fn) => fn === "submit_lead" ? { ok: true, id: "x" } : null, { env: { TURNSTILE_SECRET_KEY: "" } });
  assert.equal((await h(post(LEAD))).status, 200);
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["lead_replay", "submit_lead"]);
});

Deno.test("DB rejects after Turnstile: mapped status + intake_note_reject; the 9th request in 10 min gets 429", async () => {
  let n = 0;
  const { h, rpc, bg } = setup((fn) => {
    if (fn === "submit_lead") {
      n++;
      if (n > 8) throw rpcError(429, "PT429", "rate_limited");
      return { ok: true, id: "x" };
    }
    return null;
  });
  for (let i = 0; i < 8; i++) assert.equal((await h(post({ ...LEAD, turnstile_token: "t" }, { "idempotency-key": `idem-key-${1000 + i}` }))).status, 200);
  const r = await h(post({ ...LEAD, turnstile_token: "t" }, { "idempotency-key": "idem-key-9999" }));
  await bg.settle();
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("retry-after"), "600");
  const note = rpc.calls.find((c) => c.fn === "intake_note_reject");
  assert.deepEqual(note?.args, { p_reason: "rate_limited", p_client_ip: "203.0.113.7" });
});

Deno.test("DB PT400/PT409/PT423 map to 400 (field) / 409 / 423 with Hebrew messages", async () => {
  for (const [err, status, reason] of [
    [rpcError(400, "PT400", "invalid_input:email"), 400, "invalid_input"],
    [rpcError(409, "PT409", "idempotency_conflict"), 409, "idempotency_conflict"],
    [rpcError(423, "PT423", "feature_disabled:intake_enabled"), 423, "feature_disabled"],
  ] as const) {
    const { h, rpc, bg } = setup((fn) => { if (fn === "submit_lead") throw err; return null; });
    const r = await h(post({ ...LEAD, turnstile_token: "t" }));
    await bg.settle();
    assert.equal(r.status, status);
    const b = await r.json();
    assert.match(b.error.message, /[֐-׿]/);
    assert.equal(rpc.calls.find((c) => c.fn === "intake_note_reject")?.args.p_reason, reason);
  }
});

Deno.test("replay conflict before Turnstile: 409, no Turnstile call, no write", async () => {
  const { h, rpc, tsFetch } = setup((fn) => { if (fn === "lead_replay") throw rpcError(409, "PT409", "idempotency_conflict"); return null; });
  const r = await h(post({ ...LEAD, turnstile_token: "t" }));
  assert.equal(r.status, 409);
  assert.equal(tsFetch.calls.length, 0);
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["lead_replay"]);
});

Deno.test("an address with 30 early rejects is cut off in memory (429, no DB)", async () => {
  const { h, rpc } = setup(() => null);
  for (let i = 0; i < REJECT_LIMIT; i++) await h(post({ ...LEAD, phone: "1" }));
  const r = await h(post({ ...LEAD, turnstile_token: "t" }));
  assert.equal(r.status, 429);
  assert.equal(rpc.calls.length, 0);
});

Deno.test("OPTIONS preflight and 405", async () => {
  const { h } = setup(() => null);
  const p = await h(new Request("https://x", { method: "OPTIONS", headers: { origin: ORIGIN } }));
  assert.equal(p.status, 204);
  assert.equal(p.headers.get("access-control-allow-origin"), ORIGIN);
  assert.ok((p.headers.get("access-control-allow-headers") ?? "").includes("idempotency-key"));
  assert.equal((await h(new Request("https://x", { method: "GET", headers: { origin: ORIGIN } }))).status, 405);
});
