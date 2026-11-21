// deno test supabase/functions/client-docs/  (synthetic data only; the staff RPC and the storage reader are mocks)
import assert from "node:assert/strict";
import { mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import { createClientDocsHandler } from "./handler.ts";
import { sha256Hex } from "../_shared/poa/session.ts";

const DOC = "d0000000-0000-4000-8000-000000000001";
const JWT = "aaaaaaaaaa.bbbbbbbbbbbb.cccccccccc";
const PATH = "surense/c0000000-0000-4000-8000-000000000001/poa/d0000000-0000-4000-8000-000000000001/x.pdf";
const BYTES = new TextEncoder().encode("%PDF-1.4\nsynthetic stored file");

async function setup(over: { rpc?: (fn: string, args: Record<string, unknown>) => unknown; get?: (p: string) => Promise<Uint8Array | null>; noStorage?: boolean } = {}) {
  const sha = await sha256Hex(BYTES);
  const lines: string[] = [];
  const staff = mockRpc(over.rpc ?? (() => ({ storage_path: PATH, sha256: sha })));
  const reads: string[] = [];
  const handler = createClientDocsHandler({
    env: testEnv(),
    log: silentLog(lines),
    storage: over.noStorage ? null : { get: async (p) => (reads.push(p), over.get ? over.get(p) : BYTES) },
    staffRpc: () => staff,
  });
  return { handler, staff, reads, lines, sha };
}

const req = (q = `document_id=${DOC}`, auth: string | null = `Bearer ${JWT}`, method = "GET") =>
  new Request(`https://example.supabase.co/functions/v1/client-docs?${q}`, { method, headers: auth ? { authorization: auth, origin: "https://seeld.co.il" } : {} });

Deno.test("client-docs: staff RPC as the caller, then the object streams with the download headers", async () => {
  const s = await setup();
  const res = await s.handler(req());
  assert.equal(res.status, 200);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), BYTES);
  assert.match(res.headers.get("content-disposition") ?? "", /^attachment;/);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.deepEqual(s.staff.calls, [{ fn: "client_doc_get", args: { p_document_id: DOC } }]);
  assert.deepEqual(s.reads, [PATH]);
  assert.equal(res.headers.get("access-control-allow-origin"), "https://seeld.co.il");
});

Deno.test("client-docs: no JWT, bad id, wrong method -> refused before any database or storage call", async () => {
  const s = await setup();
  assert.equal((await s.handler(req(`document_id=${DOC}`, null))).status, 401);
  assert.equal((await s.handler(req(`document_id=${DOC}`, "Bearer short"))).status, 401);
  assert.equal((await s.handler(req("document_id=not-a-uuid"))).status, 400);
  assert.equal((await s.handler(req(""))).status, 400);
  assert.equal((await s.handler(req(`document_id=${DOC}`, `Bearer ${JWT}`, "POST"))).status, 405);
  assert.equal(s.staff.calls.length, 0);
  assert.equal(s.reads.length, 0);
});

Deno.test("client-docs: the database decides who may download; a refusal never reaches storage", async () => {
  for (const [err, status] of [[rpcError(401, "PT401"), 401], [rpcError(403, "PT403"), 403], [rpcError(404, "PT404"), 404], [rpcError(0, "timeout"), 503]] as const) {
    const s = await setup({ rpc: () => { throw err; } });
    const res = await s.handler(req());
    assert.equal(res.status, status);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(s.reads.length, 0, "no storage read after a refusal");
  }
  const none = await setup({ rpc: () => ({ storage_path: null }) });
  assert.equal((await none.handler(req())).status, 404);
});

Deno.test("client-docs: missing object -> 404, hash mismatch -> 500, no storage -> 503; logs hold ids only", async () => {
  const gone = await setup({ get: async () => null });
  assert.equal((await gone.handler(req())).status, 404);
  const bad = await setup({ rpc: () => ({ storage_path: PATH, sha256: "00".repeat(32) }) });
  assert.equal((await bad.handler(req())).status, 500);
  const off = await setup({ noStorage: true });
  assert.equal((await off.handler(req())).status, 503);
  const ok = await setup();
  await ok.handler(req());
  const all = ok.lines.join("\n");
  assert.ok(!all.includes(PATH) && !all.includes(JWT), "no path and no token in the log");
});

Deno.test("client-docs: preflight answers with the CORS allowlist only", async () => {
  const s = await setup();
  const res = await s.handler(new Request("https://example.supabase.co/functions/v1/client-docs", { method: "OPTIONS", headers: { origin: "https://evil.example.com" } }));
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});
