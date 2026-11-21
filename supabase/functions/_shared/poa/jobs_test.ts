// deno test supabase/functions/_shared/poa/  (the connector side of the POA wizard: the E9100 launch job and the document link)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog } from "../test_helpers.ts";
import { RpcError } from "../db.ts";
import { createSurenseClient } from "../surense/client.ts";
import { createTokenSource } from "../surense/auth.ts";
import { surenseApi } from "../surense/api.ts";
import { auditSink } from "../surense/connector.ts";
import { HANDLERS, type JobRow, runJob } from "../surense/jobs.ts";
import { linkPoaDocument, planEvent, type SyncDeps } from "../surense/sync.ts";
import { sha256Hex } from "../surense/storage.ts";
import { poaStoragePath } from "./storage.ts";

const CID = "c0000000-0000-4000-8000-000000000001";
const DOC1 = "d0000000-0000-4000-8000-000000000001";
const DOC2 = "d0000000-0000-4000-8000-000000000002";
const ACC = "a0000000-0000-4000-8000-000000000001";
const EVT = "e0000000-0000-4000-8000-000000000002";
const tokenOk = () => json({ access_token: "tok_test_aaaaaaaaaaaa", token_type: "Bearer", expires_in: 3600, scope: "x" });
const noSleep = () => Promise.resolve();

function deps(route: (url: string, body: string) => Response, rpcScript: (fn: string, args: Record<string, unknown>) => unknown = () => ({}), storage: SyncDeps["storage"] = null) {
  const f = mockFetch((url, body) => (url.includes("oauth") || url.includes("/token") ? tokenOk() : route(url, body)));
  const tokens = createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch });
  const rpc = mockRpc(rpcScript);
  const client = createSurenseClient({ tokens, log: silentLog(), fetch: f.fetch, sleep: noSleep, maxAttempts: 1, audit: auditSink(rpc) });
  const d: SyncDeps = { api: surenseApi(client), client, rpc, log: silentLog(), storage };
  return { d, f, rpc };
}

const submitJob = (params: Record<string, unknown> | null): JobRow => ({ id: 1, kind: "surense.e9100_submit", params, event_id: null, event_type: null, payload: null, attempts: 0 });

// ---------------------------------------------------------------- E9100 launch handler
Deno.test("e9100_submit: both switches off -> skipped e9100_switch_off, and nothing is sent to Surense", async () => {
  const t = deps(() => json({}), (fn) => { if (fn === "surense_gate") throw rpcError(423, "PT423", "feature_disabled:surense_e9100_enabled"); return {}; });
  const out = await runJob(t.d, submitJob({ customer_id: CID, proxy_approval_date: "2026-11-21" }), Date.now() + 60_000);
  assert.deepEqual(out, { result: "skipped", code: "e9100_switch_off" });
  assert.deepEqual(t.rpc.calls, [{ fn: "surense_gate", args: { p_write: true, p_action: "e9100-submit" } }]);
  assert.equal(t.f.calls.length, 0, "no Surense call at all");
});

Deno.test("e9100_submit: switches on -> submits with the first active swiftness account; the completed E9100 follows the existing path", async () => {
  const t = deps((url, body) => {
    if (url.endsWith("/swiftness/accounts/list")) return json([{ id: "a0000000-0000-4000-8000-0000000000ff", status: "inactive" }, { id: ACC, status: "active", defaultAccount: true }]);
    if (url.endsWith("/swiftness/e9100/events")) {
      assert.deepEqual(JSON.parse(body), { customerId: CID, registrationId: ACC, proxyApprovalDate: "2026-11-21" });
      return json({ id: EVT, e9100Progress: 0, rejected: false, files: [] });
    }
    return json({}, 404);
  });
  const out = await runJob(t.d, submitJob({ customer_id: CID, proxy_approval_date: "2026-11-21" }), Date.now() + 60_000);
  assert.deepEqual(out, { result: "done", stats: { rejected: false, progress: 0 } });
  assert.equal(t.rpc.calls[0].fn, "surense_gate");
  // the write was audited like every Surense write
  assert.ok(t.rpc.calls.some((c) => c.fn === "surense_audit" && c.args.p_op === "swiftness.e9100.submit"));
  // ... and its completion event takes the E9100 download path unchanged
  assert.deepEqual(planEvent("swiftness.e9100.completed", { data: { customerId: CID, eventId: EVT } }), { action: "e9100_download", customerId: CID, eventId: EVT });
});

Deno.test("e9100_submit: bad params skip, a missing account fails (retried), a non-423 gate error is a failure", async () => {
  const t = deps(() => json([]));
  for (const p of [null, {}, { customer_id: "nope", proxy_approval_date: "2026-11-21" }, { customer_id: CID, proxy_approval_date: "21/11/2026" }, { customer_id: CID }]) {
    assert.deepEqual(await runJob(t.d, submitJob(p), Date.now()), { result: "skipped", code: "bad_input" });
  }
  assert.equal(t.rpc.calls.length, 0);
  const none = await runJob(t.d, submitJob({ customer_id: CID, proxy_approval_date: "2026-11-21" }), Date.now());
  assert.equal(none.result, "failed");
  assert.equal(none.code, "no_swiftness_account");
  const down = deps(() => json({}), (fn) => { if (fn === "surense_gate") throw new RpcError(0, "timeout", "x"); return {}; });
  const o2 = await runJob(down.d, submitJob({ customer_id: CID, proxy_approval_date: "2026-11-21" }), Date.now());
  assert.deepEqual(o2, { result: "failed", code: "db_timeout", kind: "db" });
  assert.ok(typeof HANDLERS["surense.e9100_submit"] === "function");
});

// ---------------------------------------------------------------- document link
Deno.test("events: dataproxy.aleph|hei|bet.approved carry the POA kind", () => {
  assert.deepEqual(planEvent("dataproxy.aleph.approved", { data: { customerId: CID } }), { action: "pull_documents", customerId: CID, poaKind: "maslaka" });
  assert.deepEqual(planEvent("dataproxy.hei.approved", { data: { customerId: CID } }), { action: "pull_documents", customerId: CID, poaKind: "harbit" });
  assert.deepEqual(planEvent("dataproxy.bet.approved", { data: { customerId: CID } }), { action: "pull_documents", customerId: CID, poaKind: "policies" });
  assert.deepEqual(planEvent("document.uploaded", { data: { customerId: CID } }), { action: "pull_documents", customerId: CID }, "other uploads stay plain pulls");
});

function eventJob(type: string): JobRow {
  return { id: 2, kind: "surense.event", params: null, event_id: 9, event_type: type, payload: JSON.stringify({ data: { customerId: CID } }), attempts: 0 };
}

const SESSION = "50000000-0000-4000-8000-000000000001";
const AGENCY = "5eed0000-0000-4000-8000-000000000001";
const PDFDOC = "d0000000-0000-4000-8000-0000000000aa"; // the database's own document row id
const BYTES = new TextEncoder().encode("%PDF-1.4\nsynthetic");

const docsRoute = (urlHost: string) => (url: string, body: string) => {
  if (url.endsWith("/documents/search")) {
    return json({
      results: [
        { id: DOC1, customerId: CID, createdDate: "2026-11-21T10:00:00Z", mime: "application/pdf" },
        { id: DOC2, customerId: CID, createdDate: "2026-11-21T10:05:00Z", mime: "application/pdf" },
      ],
      hasNextPage: false,
    });
  }
  if (url.endsWith("/documents/urls")) {
    assert.deepEqual(JSON.parse(body).documents[0].docId, DOC2, "the newest document is the one linked");
    return json({ entries: [{ documentId: DOC2, name: "x.pdf", url: `https://${urlHost}/files/x` }] });
  }
  if (url === "https://api.surense.com/files/x") return new Response(BYTES, { status: 200, headers: { "content-type": "application/pdf" } });
  return json({}, 404);
};

Deno.test("document link: a dataproxy approval pulls, links the newest document, then hashes, stores and records the bytes (host allowed)", async () => {
  const puts: string[] = [];
  const sha = await sha256Hex(BYTES);
  const t = deps(docsRoute("api.surense.com"), (fn, args) => {
    if (fn === "surense_documents_upsert") return { upserted: 2 };
    if (fn === "poa_document_link") {
      return { linked: true, complete: args.p_sha256 !== null, session_id: SESSION, document_id: PDFDOC, agency_id: AGENCY };
    }
    return {};
  }, { put: async (p) => (puts.push(p), "stored" as const) });
  const out = await runJob(t.d, eventJob("dataproxy.hei.approved"), Date.now() + 60_000);
  assert.equal(out.result, "done");
  assert.equal(out.stats?.poaLinked, true);
  assert.equal(out.stats?.poaHashed, true);
  assert.equal(out.stats?.poaComplete, true);
  const links = t.rpc.calls.filter((c) => c.fn === "poa_document_link");
  assert.deepEqual(links.map((c) => c.args), [
    { p_customer: CID, p_kind: "harbit", p_document_id: DOC2, p_sha256: null },
    { p_customer: CID, p_kind: "harbit", p_document_id: DOC2, p_sha256: sha },
  ]);
  const path = `poa/${AGENCY}/${SESSION}/harbit-${PDFDOC}.pdf`;
  assert.equal(poaStoragePath(AGENCY, SESSION, "harbit", PDFDOC), path);
  assert.deepEqual(puts, [path]);
  assert.deepEqual(t.rpc.calls.find((c) => c.fn === "poa_document_stored")!.args, { p_document: PDFDOC, p_path: path, p_sha256: sha });
});

Deno.test("document link: without the agency id in the link result the bytes are hashed and linked but not stored (document stays not ready)", async () => {
  const puts: string[] = [];
  const t = deps(docsRoute("api.surense.com"), (fn) => (fn === "poa_document_link" ? { linked: true, complete: false, session_id: SESSION, document_id: PDFDOC } : { upserted: 2 }),
    { put: async (p) => (puts.push(p), "stored" as const) });
  const out = await runJob(t.d, eventJob("dataproxy.bet.approved"), Date.now() + 60_000);
  assert.equal(out.stats?.poaLinked, true);
  assert.equal(out.stats?.poaHashed, true);
  assert.deepEqual(puts, []);
  assert.ok(!t.rpc.calls.some((c) => c.fn === "poa_document_stored"));
});

Deno.test("document link: a download host that is not allowed links metadata only (nothing fetched, not a failure)", async () => {
  const t = deps(docsRoute("files.example.com"), (fn) => (fn === "poa_document_link" ? { linked: true, complete: true } : { upserted: 2 }), { put: async () => "stored" });
  const out = await runJob(t.d, eventJob("dataproxy.aleph.approved"), Date.now() + 60_000);
  assert.equal(out.result, "done");
  assert.equal(out.stats?.poaLinked, true);
  assert.equal(out.stats?.poaHashed, false);
  assert.equal(out.stats?.poaComplete, true);
  const links = t.rpc.calls.filter((c) => c.fn === "poa_document_link");
  assert.deepEqual(links.map((c) => c.args), [{ p_customer: CID, p_kind: "maslaka", p_document_id: DOC2, p_sha256: null }]);
  assert.ok(!t.f.calls.some((c) => c.url.includes("files.example.com")), "the disallowed host was never contacted");
});

Deno.test("document link: a newest document that already backs another kind is skipped; the next newest is linked (one file, one kind)", async () => {
  const taken = (fn: string, args: Record<string, unknown>) => {
    if (fn !== "poa_document_link") return { upserted: 2 };
    return args.p_document_id === DOC2 ? { linked: false, session_id: SESSION, reason: "already_linked" } : { linked: true, complete: false, session_id: SESSION, document_id: PDFDOC };
  };
  const t = deps(docsRoute("files.example.com"), taken);
  const out = await runJob(t.d, eventJob("dataproxy.hei.approved"), Date.now() + 60_000);
  assert.equal(out.result, "done");
  assert.equal(out.stats?.poaLinked, true);
  assert.equal(out.stats?.poaComplete, false, "linked, but one document is still missing");
  assert.deepEqual(t.rpc.calls.filter((c) => c.fn === "poa_document_link").map((c) => c.args.p_document_id), [DOC2, DOC1]);

  // every candidate taken (or no session at all): nothing is linked and nothing is fetched
  const all = deps(docsRoute("api.surense.com"), (fn) => (fn === "poa_document_link" ? { linked: false, session_id: SESSION, reason: "already_linked" } : { upserted: 2 }), { put: async () => "stored" });
  const o2 = await runJob(all.d, eventJob("dataproxy.bet.approved"), Date.now() + 60_000);
  assert.equal(o2.stats?.poaLinked, false);
  assert.equal(all.rpc.calls.filter((c) => c.fn === "poa_document_link").length, 2, "both documents were offered, none took");
  assert.ok(!all.f.calls.some((c) => c.url.includes("/files/x")), "no bytes fetched for a link that did not happen");
});

Deno.test("document link: no session / switch off / RPC missing is not a failure and fetches nothing; plain document events do not link", async () => {
  const docs = [{ id: DOC1, createdDate: "2026-11-21T10:00:00Z" }];
  for (const err of [rpcError(423, "PT423", "feature_disabled:poa_docs_enabled"), rpcError(404, "PGRST202")]) {
    const t = deps(() => json({ entries: [] }), () => { throw err; }, { put: async () => "stored" });
    assert.equal((await linkPoaDocument(t.d, { customerId: CID, kind: "policies", docs })).linked, false);
    assert.equal(t.f.calls.length, 0);
  }
  const none = deps(() => json({}));
  assert.equal((await linkPoaDocument(none.d, { customerId: CID, kind: "policies", docs: [] })).linked, false);
  assert.equal(none.rpc.calls.length, 0, "nothing to link: no call");
  const unknown = deps(() => json({ entries: [] }), () => ({ linked: false, session_id: null }), { put: async () => "stored" });
  assert.equal((await linkPoaDocument(unknown.d, { customerId: CID, kind: "policies", docs })).linked, false, "unknown customer: linked false, no raise");
  assert.equal(unknown.f.calls.length, 0, "no bytes are fetched for a customer without a wizard session");
  const other = deps(docsRoute("api.surense.com"), () => ({ upserted: 2 }));
  const out = await runJob(other.d, { ...eventJob("document.uploaded") }, Date.now() + 60_000);
  assert.equal(out.result, "done");
  assert.ok(!other.rpc.calls.some((c) => c.fn === "poa_document_link"));
  // a real database error still fails the job (the pull is repeatable)
  const boom = deps(() => json({ entries: [] }), () => { throw new RpcError(500, "XX000", "x"); });
  await assert.rejects(linkPoaDocument(boom.d, { customerId: CID, kind: "policies", docs }));
});
