// deno test supabase/functions/_shared/poa/  (the ship job: a session completed on our side is replayed into the tool; synthetic values)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog } from "../test_helpers.ts";
import { RpcError } from "../db.ts";
import { createSurenseClient } from "../surense/client.ts";
import { createTokenSource } from "../surense/auth.ts";
import { surenseApi } from "../surense/api.ts";
import { auditSink } from "../surense/connector.ts";
import { type JobRow, runJob } from "../surense/jobs.ts";
import type { SyncDeps } from "../surense/sync.ts";
import type { EngineRef, PoaEngine, PoaIdentity } from "./engine/types.ts";
import { PoaToolError } from "./errors.ts";
import { PNG_URL, SYNTH_ID } from "./fixtures.ts";

const CID = "c0000000-0000-4000-8000-000000000001";
const SESSION = "50000000-0000-4000-8000-000000000002";
const tokenOk = () => json({ access_token: "tok_test_aaaaaaaaaaaa", token_type: "Bearer", expires_in: 3600, scope: "x" });

function deps(rpcScript: (fn: string, args: Record<string, unknown>) => unknown = () => ({})) {
  const f = mockFetch((url) => (url.includes("oauth") || url.includes("/token") ? tokenOk() : json({})));
  const tokens = createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch });
  const rpc = mockRpc(rpcScript);
  const client = createSurenseClient({ tokens, log: silentLog(), fetch: f.fetch, sleep: () => Promise.resolve(), maxAttempts: 1, audit: auditSink(rpc) });
  const d: SyncDeps = { api: surenseApi(client), client, rpc, log: silentLog(), storage: null, now: () => Date.UTC(2026, 10, 21, 12, 0, 0) };
  return { d, f, rpc };
}

const IDENTITY = { first_name: "Zz", last_name: "Test", email: null, national_id: SYNTH_ID, phone: "+972501234567", street: "Herzl 12", city: "Tel Aviv", zip: "6473912", marketing_approved: true };
const DATA = (over: Record<string, unknown> = {}) => ({
  session_id: SESSION, ship_status: "pending", surense_customer_id: null,
  modules: { maslaka: { enabled: true, required: true, performed: true }, harbit: { enabled: true, required: true, performed: true }, policies: { enabled: true, required: true, performed: true } },
  identity: IDENTITY,
  consents: {
    maslaka: { approved_at: "2026-11-21T12:00:01Z", birth_date: null, issue_date: null, signature: null },
    harbit: { approved_at: "2026-11-21T12:00:02Z", birth_date: "1990-05-17", issue_date: "2015-01-01", signature: null },
    policies: { approved_at: "2026-11-21T12:00:03Z", birth_date: null, issue_date: null, signature: PNG_URL },
  },
  ...over,
});
const job = (params: Record<string, unknown> | null): JobRow => ({ id: 7, kind: "surense.poa_ship", params, event_id: null, event_type: null, payload: null, attempts: 1 });

function engine(o: { existing?: boolean; startError?: unknown; consentError?: unknown } = {}) {
  const calls: { name: string; args: unknown[] }[] = [];
  const e: PoaEngine = {
    name: "surense",
    async start(who: PoaIdentity, modules) {
      calls.push({ name: "start", args: [who, modules] });
      if (o.startError) throw o.startError;
      return { customerId: CID, urlId: "UrlId99", sid: "sid-9", existing: o.existing === true, cookie: "a=1", modules };
    },
    async consent(ref: EngineRef, kind, data) {
      calls.push({ name: "consent", args: [ref, kind, data] });
      if (o.consentError) throw o.consentError;
      return kind === "policies" ? { hb: "https://x/1" } : {};
    },
    async preview() {
      return new Uint8Array();
    },
  };
  return { e, calls };
}

Deno.test("poa_ship: bad params skip; no engine fails (config); the write switch off skips and marks the session", async () => {
  const t = deps();
  assert.deepEqual(await runJob(t.d, job(null), Date.now()), { result: "skipped", code: "bad_input" });
  assert.deepEqual(await runJob(t.d, job({ session_id: "nope" }), Date.now()), { result: "skipped", code: "bad_input" });
  assert.deepEqual(await runJob(t.d, job({ session_id: SESSION }), Date.now()), { result: "failed", code: "engine_not_configured", kind: "config" });
  assert.equal(t.rpc.calls.length, 0);
  const off = deps((fn) => { if (fn === "surense_gate") throw rpcError(423, "PT423", "feature_disabled:surense_write_enabled"); return {}; });
  off.d.poaEngine = engine().e;
  assert.deepEqual(await runJob(off.d, job({ session_id: SESSION }), Date.now()), { result: "skipped", code: "write_switch_off" });
  assert.deepEqual(off.rpc.calls.map((c) => c.fn), ["surense_gate", "poa_ship_set"]);
  assert.deepEqual(off.rpc.calls[1].args, { p_session: SESSION, p_status: "failed", p_code: "write_switch_off", p_customer: null });
  assert.equal(off.f.calls.length, 0, "nothing sent to the tool");
});

Deno.test("poa_ship: replays the stored approvals in order, marks shipped with the customer id, queues the launch", async () => {
  const e = engine();
  const t = deps((fn) => (fn === "poa_ship_get" ? DATA() : {}));
  t.d.poaEngine = e.e;
  const out = await runJob(t.d, job({ session_id: SESSION }), Date.now() + 60_000);
  assert.deepEqual(out, {
    result: "done", stats: { modules: 3, existing: false },
    next: { kind: "surense.e9100_submit", params: { customer_id: CID, proxy_approval_date: "2026-11-21" }, dedupe: `e9100:${CID}` },
  });
  assert.deepEqual(e.calls.map((c) => c.name), ["start", "consent", "consent", "consent"]);
  const who = e.calls[0].args[0] as PoaIdentity;
  assert.equal(who.nationalId, SYNTH_ID);
  assert.equal(who.zip, "6473912");
  assert.equal(who.marketingApproved, true);
  assert.deepEqual(e.calls[0].args[1], { maslaka: true, harbit: true, policies: true });
  assert.equal(e.calls[1].args[1], "maslaka");
  assert.deepEqual(e.calls[2].args[2], { birthDate: "1990-05-17", issueDate: "2015-01-01", signaturePng: undefined });
  assert.equal(e.calls[3].args[1], "policies");
  assert.equal((e.calls[3].args[2] as { signaturePng?: string }).signaturePng, PNG_URL);
  assert.deepEqual(t.rpc.calls.map((c) => c.fn), ["surense_gate", "poa_ship_get", "poa_ship_set"]);
  assert.deepEqual(t.rpc.calls[2].args, { p_session: SESSION, p_status: "shipped", p_code: null, p_customer: CID });
  assert.ok(!JSON.stringify(out).includes(SYNTH_ID), "the outcome holds counts only");
});

Deno.test("poa_ship: an existing customer is shipped but not launched; shipped / nothing performed are skipped", async () => {
  const e = engine({ existing: true });
  const t = deps((fn) => (fn === "poa_ship_get" ? DATA() : {}));
  t.d.poaEngine = e.e;
  assert.deepEqual(await runJob(t.d, job({ session_id: SESSION }), Date.now() + 60_000), { result: "done", stats: { modules: 3, existing: true } });
  const done = deps((fn) => (fn === "poa_ship_get" ? DATA({ ship_status: "shipped" }) : {}));
  done.d.poaEngine = engine().e;
  assert.deepEqual(await runJob(done.d, job({ session_id: SESSION }), Date.now()), { result: "skipped", code: "already_shipped" });
  const none = deps((fn) => (fn === "poa_ship_get" ? DATA({ consents: {} }) : {}));
  none.d.poaEngine = engine().e;
  assert.deepEqual(await runJob(none.d, job({ session_id: SESSION }), Date.now()), { result: "skipped", code: "nothing_to_ship" });
});

Deno.test("poa_ship: a tool failure marks the session failed with the code; unavailable is retried, a permanent refusal is skipped; a db failure retries", async () => {
  const down = deps((fn) => (fn === "poa_ship_get" ? DATA() : {}));
  down.d.poaEngine = engine({ consentError: new PoaToolError("unavailable", "dp_http_503", true) }).e;
  assert.deepEqual(await runJob(down.d, job({ session_id: SESSION }), Date.now() + 60_000), { result: "failed", code: "dp_dp_http_503", kind: "unavailable" });
  assert.deepEqual(down.rpc.calls.at(-1)!.args, { p_session: SESSION, p_status: "failed", p_code: "dp_dp_http_503", p_customer: null });
  const bad = deps((fn) => (fn === "poa_ship_get" ? DATA() : {}));
  bad.d.poaEngine = engine({ startError: new PoaToolError("inactive", "dp_http_404") }).e;
  assert.deepEqual(await runJob(bad.d, job({ session_id: SESSION }), Date.now() + 60_000), { result: "skipped", code: "dp_dp_http_404", kind: "permanent" });
  const db = deps((fn) => { if (fn === "poa_ship_get") throw new RpcError(500, "XX000", "x"); return {}; });
  db.d.poaEngine = engine().e;
  assert.deepEqual(await runJob(db.d, job({ session_id: SESSION }), Date.now()), { result: "failed", code: "db_XX000", kind: "db" });
  assert.ok(!db.rpc.calls.some((c) => c.fn === "poa_ship_set"), "a failed read marks nothing");
});
