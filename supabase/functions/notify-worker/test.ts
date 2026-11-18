// deno test supabase/functions/notify-worker  (synthetic data only)
import assert from "node:assert/strict";
import { alertEmail, createWorkerHandler, departmentFor, leadEmail, type OutboxRow } from "./handler.ts";
import { collectingDefer } from "../_shared/background.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";

const SECRET = "cron-secret-for-tests";
const LEAD_ROW: OutboxRow = { id: 11, topic: "lead.created", attempts: 1, payload: { lead_id: "00000000-0000-4000-8000-0000000000aa", kind: "insurance", request_id: "r1" } };
const ALERT_ROW: OutboxRow = { id: 12, topic: "alert", attempts: 1, payload: { alert_id: 5, severity: "warning", kind: "tracks_stale", summary: "tracks not refreshed", recipients: ["ops@example.com"] } };

function queue(rows: OutboxRow[]): RpcScript {
  const q = [...rows];
  return (fn) => {
    if (fn === "outbox_claim") return q.splice(0, 20);
    return null;
  };
}

function setup(script: RpcScript, env: Record<string, string> = {}, resendStatus = 200) {
  const rpc = mockRpc(script);
  const mail = mockFetch(() => resendStatus === 200 ? json({ id: "em" }) : json({ name: "application_error" }, resendStatus));
  const bg = collectingDefer();
  const h = createWorkerHandler({ env: testEnv(env), rpc, log: silentLog(), defer: bg.defer, fetch: mail.fetch });
  return { h, rpc, mail, bg };
}

const cron = (headers: Record<string, string> = {}) =>
  new Request("https://x/functions/v1/notify-worker", { method: "POST", headers: { "x-cron-secret": SECRET, "x-job-run": "42", ...headers }, body: "{}" });

Deno.test("auth: wrong/missing secret 401, unset EDGE_CRON_SECRET 503, GET 405", async () => {
  const { h, rpc } = setup(queue([]));
  assert.equal((await h(cron({ "x-cron-secret": "nope" }))).status, 401);
  assert.equal((await h(new Request("https://x", { method: "POST" }))).status, 401);
  assert.equal((await h(new Request("https://x", { method: "GET" }))).status, 405);
  const u = setup(queue([]), { EDGE_CRON_SECRET: "" });
  assert.equal((await u.h(cron())).status, 503);
  assert.equal(rpc.calls.length + u.rpc.calls.length, 0);
});

Deno.test("202 at once; work in background: claim -> Resend (outbox-<id>) -> complete -> job_finish(run)", async () => {
  const { h, rpc, mail, bg } = setup(queue([LEAD_ROW, ALERT_ROW]));
  const r = await h(cron());
  assert.equal(r.status, 202);
  assert.deepEqual(await r.json(), { accepted: true, run: 42 });
  await bg.settle();
  assert.equal(mail.calls.length, 2);
  const keys = mail.calls.map((c) => (c.init!.headers as Record<string, string>)["idempotency-key"]);
  assert.deepEqual(keys, ["outbox-11", "outbox-12"]);
  const sentTo = mail.calls.map((c) => JSON.parse(c.body).to);
  assert.deepEqual(sentTo, [["Moshe@seeld.info"], ["ops@example.com"]]);
  const completes = rpc.calls.filter((c) => c.fn === "outbox_complete").map((c) => c.args);
  assert.deepEqual(completes, [{ p_id: 11, p_ok: true, p_error: null }, { p_id: 12, p_ok: true, p_error: null }]);
  const fin = rpc.calls.find((c) => c.fn === "job_finish")!;
  assert.equal(fin.args.p_run, 42);
  assert.equal(fin.args.p_ok, true);
  assert.equal((fin.args.p_stats as Record<string, number>).sent, 2);
});

Deno.test("alert with no recipients at claim time: complete(false,'no_recipients'), nothing sent", async () => {
  const { h, rpc, mail, bg } = setup(queue([{ ...ALERT_ROW, payload: { ...ALERT_ROW.payload, recipients: [] } }]));
  await h(cron());
  await bg.settle();
  assert.equal(mail.calls.length, 0);
  assert.deepEqual(rpc.calls.find((c) => c.fn === "outbox_complete")!.args, { p_id: 12, p_ok: false, p_error: "no_recipients" });
});

Deno.test("Resend 500: complete(false) for DB backoff; the run itself is still ok", async () => {
  const { h, rpc, bg } = setup(queue([LEAD_ROW]), {}, 500);
  await h(cron());
  await bg.settle();
  const c = rpc.calls.find((x) => x.fn === "outbox_complete")!.args;
  assert.equal(c.p_ok, false);
  assert.match(String(c.p_error), /^resend_/);
  assert.equal(rpc.calls.find((x) => x.fn === "job_finish")!.args.p_ok, true);
});

Deno.test("RESEND_API_KEY missing: outbox untouched, job_finish(false)", async () => {
  const { h, rpc, bg } = setup(queue([LEAD_ROW]), { RESEND_API_KEY: "" });
  assert.equal((await h(cron())).status, 202);
  await bg.settle();
  assert.deepEqual(rpc.calls.map((c) => c.fn), ["job_finish"]);
  assert.equal(rpc.calls[0].args.p_error, "resend_not_configured");
});

Deno.test("claim failure: job_finish(false) with the code; manual run without x-job-run finishes nothing", async () => {
  const { h, rpc, bg } = setup((fn) => { if (fn === "outbox_claim") throw rpcError(503, "network", "x"); return null; });
  await h(cron());
  await bg.settle();
  assert.deepEqual(rpc.calls.find((c) => c.fn === "job_finish")!.args, { p_run: 42, p_ok: false, p_stats: {}, p_error: "network" });
  const m = setup(queue([]));
  await m.h(new Request("https://x", { method: "POST", headers: { "x-cron-secret": SECRET } }));
  await m.bg.settle();
  assert.equal(m.rpc.calls.some((c) => c.fn === "job_finish"), false);
});

Deno.test("overlapping runs: a row claimed by one run is never sent twice (skip-locked queue)", async () => {
  const rows = Array.from({ length: 30 }, (_, i) => ({ ...LEAD_ROW, id: 100 + i }));
  const script = queue(rows); // one shared queue: claim pops, like FOR UPDATE SKIP LOCKED
  const a = setup(script);
  const b = setup(script);
  await Promise.all([a.h(cron({ "x-job-run": "1" })), b.h(cron({ "x-job-run": "2" }))]);
  await Promise.all([a.bg.settle(), b.bg.settle()]);
  const ids = [...a.mail.calls, ...b.mail.calls].map((c) => (c.init!.headers as Record<string, string>)["idempotency-key"]);
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
});

Deno.test("lead e-mail: department routing and no PII without details", () => {
  const env = testEnv();
  assert.equal(departmentFor("insurance"), "insurance");
  assert.equal(departmentFor("pension"), "finance");
  assert.equal(departmentFor("portfolio_review"), "finance");
  assert.equal(departmentFor("contact"), "general");
  assert.equal(departmentFor("contact", { payload: { subject: "ביטוח רכב" } }), "insurance");
  const e = leadEmail(env, { ...LEAD_ROW, payload: { ...LEAD_ROW.payload, kind: "pension" } }, null);
  assert.deepEqual(e.to, ["Shmulik@seeld.info"]);
  assert.equal(e.subject, "פנייה חדשה (פנסיה וחיסכון)");
  assert.ok(e.html.includes("/app/leads/00000000-0000-4000-8000-0000000000aa"));
  assert.ok(!e.html.includes("טלפון") && !e.html.includes("אימייל"));
  const withPii = leadEmail(env, LEAD_ROW, { full_name: "<b>Test</b>", phone: "0500000000", payload: {} });
  assert.ok(withPii.html.includes("&lt;b&gt;Test&lt;/b&gt;"));
  const routed = testEnv({ NOTIFY_TO_INSURANCE: "ins@example.com" });
  assert.deepEqual(leadEmail(routed, LEAD_ROW, null).to, ["ins@example.com"]);
});

Deno.test("e-mail bodies are deterministic per row (same Idempotency-Key => same payload on every retry)", async () => {
  const env = testEnv();
  const a1 = JSON.stringify(leadEmail(env, LEAD_ROW, null));
  const b1 = JSON.stringify(alertEmail(env, ALERT_ROW));
  await new Promise((r) => setTimeout(r, 1100)); // across a second boundary: a clock-based body would differ
  assert.equal(JSON.stringify(leadEmail(env, LEAD_ROW, null)), a1);
  assert.equal(JSON.stringify(alertEmail(env, ALERT_ROW)), b1);
  // a stored timestamp (details.created_at) is shown, and it is the same on every attempt
  const d = { created_at: "2026-11-19T08:00:00Z", payload: {} };
  assert.equal(JSON.stringify(leadEmail(env, LEAD_ROW, d)), JSON.stringify(leadEmail(env, LEAD_ROW, d)));
  assert.ok(leadEmail(env, LEAD_ROW, d).html.includes("התקבלה"));
});

Deno.test("Resend 409 invalid_idempotent_request counts as sent; concurrent_idempotent_requests stays a retry", async () => {
  for (const [name, ok] of [["invalid_idempotent_request", true], ["concurrent_idempotent_requests", false]] as const) {
    const rpc = mockRpc(queue([LEAD_ROW]));
    const mail = mockFetch(() => json({ name }, 409));
    const bg = collectingDefer();
    const h = createWorkerHandler({ env: testEnv(), rpc, log: silentLog(), defer: bg.defer, fetch: mail.fetch });
    await h(cron());
    await bg.settle();
    const c = rpc.calls.find((x) => x.fn === "outbox_complete")!.args;
    assert.equal(c.p_ok, ok, name);
    if (!ok) assert.equal(c.p_error, `resend_${name}`);
  }
});

Deno.test("NOTIFY_INCLUDE_PII with a missing lead_notify_details RPC falls back to the PII-free e-mail", async () => {
  const q = queue([LEAD_ROW]);
  const { h, mail, bg } = setup((fn, a) => { if (fn === "lead_notify_details") throw rpcError(404, "PGRST202", "x"); return q(fn, a); }, { NOTIFY_INCLUDE_PII: "true" });
  await h(cron());
  await bg.settle();
  assert.equal(mail.calls.length, 1);
});

Deno.test("alert e-mail ignores malformed recipients", () => {
  const e = alertEmail(testEnv(), { ...ALERT_ROW, payload: { ...ALERT_ROW.payload, recipients: ["ok@example.com", "bad", 3] } });
  assert.deepEqual(e?.to, ["ok@example.com"]);
});
