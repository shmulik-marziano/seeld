// deno test supabase/functions/surense-sync  (synthetic data only; Surense, the DB and the staff check are mocks)
import assert from "node:assert/strict";
import { createSyncHandler, parseInvite } from "./handler.ts";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import type { RpcScript } from "../_shared/test_helpers.ts";
import { createTokenSource, TOKEN_URL } from "../_shared/surense/auth.ts";
import type { Rpc } from "../_shared/db.ts";

const ADMIN = "00000000-0000-4000-8000-0000000000a1";
const CID = "c0000000-0000-4000-8000-000000000001";
const ACC = "a0000000-0000-4000-8000-000000000003";
// built at runtime (no token-shaped literal in the repo); the staff check is mocked, so the signature is never verified
const b64url = (s: string) => btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const JWT = [b64url('{"alg":"none"}'), b64url('{"sub":"synthetic"}'), "signature-test"].join(".");

function setup(o: { service?: RpcScript; staff?: RpcScript; route?: (url: string, body: string) => Response; tokens?: boolean } = {}) {
  const rpc = mockRpc(o.service ?? (() => ({ ok: true })));
  const staff = mockRpc(o.staff ?? ((fn) => (fn === "admin_assert_fresh" ? { user_id: ADMIN, agency_id: "x" } : null)));
  const jwts: string[] = [];
  const f = mockFetch((url, body) => (url === TOKEN_URL ? json({ access_token: "tok_test_aaaaaaaaaaaa", expires_in: 3600 }) : (o.route ?? (() => json({})))(url, body)));
  const tokens = o.tokens === false ? null : createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch });
  const lines: string[] = [];
  const h = createSyncHandler({
    env: testEnv(), rpc, log: silentLog(lines), tokens, fetch: f.fetch, sleep: () => Promise.resolve(), minIntervalMs: 0,
    staffRpc: (jwt): Rpc => (jwts.push(jwt), staff),
  });
  return { h, rpc, staff, f, jwts, lines };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://x/functions/v1/surense-sync", {
    method: "POST",
    headers: { authorization: `Bearer ${JWT}`, "content-type": "application/json", origin: "https://seeld.co.il", ...headers },
    body: JSON.stringify(body),
  });

Deno.test("auth: GET 405, no bearer 401, not a fresh admin 403, before any Surense or service call", async () => {
  const { h, rpc, f } = setup({ staff: () => { throw rpcError(403, "PT403", "forbidden:admin_fresh_totp"); } });
  assert.equal((await h(new Request("https://x", { method: "GET" }))).status, 405);
  assert.equal((await h(post({ action: "health" }, { authorization: "" }))).status, 401);
  assert.equal((await h(post({ action: "health" }))).status, 403);
  assert.equal(rpc.calls.length, 0);
  assert.equal(f.calls.length, 0);
});

Deno.test("CORS: preflight from an allowed origin; never *", async () => {
  const { h } = setup();
  const r = await h(new Request("https://x", { method: "OPTIONS", headers: { origin: "https://seeld.co.il" } }));
  assert.equal(r.status, 204);
  assert.equal(r.headers.get("access-control-allow-origin"), "https://seeld.co.il");
  const other = await h(new Request("https://x", { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});

Deno.test("flags: the read gate runs first; switch off -> 423; writes ask for the write gate", async () => {
  const off = setup({ service: (fn) => { if (fn === "surense_gate") throw rpcError(423, "PT423", "feature_disabled:surense_enabled"); return null; } });
  const r = await off.h(post({ action: "health" }));
  assert.equal(r.status, 423);
  assert.equal((await r.json()).error.details.flag, "surense_enabled");
  assert.equal(off.f.calls.length, 0, "no Surense call while the switch is off");

  const w = setup({ route: () => json({ url: "https://surense.example/app/p/x", message: "Zz text for the customer" }) });
  const ok = await w.h(post({ action: "invite-proxies", customerId: CID, nispahAlef: true, swiftnessAccountId: ACC }));
  assert.equal(ok.status, 200);
  assert.deepEqual(w.rpc.calls[0], { fn: "surense_gate", args: { p_write: true, p_action: "invite-proxies" } });
  const b = await ok.json();
  assert.deepEqual(b.result, { url: "https://surense.example/app/p/x", partnerUrl: null }, "the suggested message is dropped");
  assert.ok(w.rpc.calls.some((c) => c.fn === "surense_audit" && c.args.p_op === "proxies.invite" && c.args.p_ref === CID));
});

Deno.test("e9100-submit asks the gate with its action name (separate surense_e9100_enabled switch in SQL)", async () => {
  const off = setup({ service: (fn, a) => {
    if (fn === "surense_gate" && a.p_action === "e9100-submit") throw rpcError(423, "PT423", "feature_disabled:surense_e9100_enabled");
    return null;
  } });
  const r = await off.h(post({ action: "e9100-submit", customerId: CID, registrationId: ACC, proxyApprovalDate: "2026-11-20" }));
  assert.equal(r.status, 423);
  assert.equal((await r.json()).error.details.flag, "surense_e9100_enabled");
  assert.deepEqual(off.rpc.calls[0], { fn: "surense_gate", args: { p_write: true, p_action: "e9100-submit" } });
  assert.equal(off.f.calls.length, 0, "no Surense call (not even a token) while the E9100 switch is off");
});

Deno.test("writes: audit row before the request, status after; a lost connection is ambiguous (409), sent once", async () => {
  const order: string[] = [];
  const { h, rpc, f } = setup({
    service: (fn) => (order.push(fn), null),
    route: () => {
      order.push("surense");
      throw new TypeError("connection reset");
    },
  });
  const r = await h(post({ action: "invite-proxies", customerId: CID, nispahHei: true }));
  assert.equal(r.status, 409);
  const b = await r.json();
  assert.equal(b.error.details.reason, "ambiguous_check_surense");
  assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 1, "a write is never retried on a network failure");
  const audits = rpc.calls.filter((c) => c.fn === "surense_audit").map((c) => [c.args.p_op, c.args.p_status, c.args.p_phase]);
  assert.deepEqual(audits, [["proxies.invite", null, "pending"], ["proxies.invite", 0, "ambiguous"]]);
  assert.ok(order.indexOf("surense_audit") < order.indexOf("surense"), "pending audit row first");
});

Deno.test("writes: a 504 on E9100 submit is ambiguous; a 503 is a plain outage; neither retried", async () => {
  for (const [status, code, reason] of [[504, 409, "ambiguous_check_surense"], [503, 503, undefined]] as const) {
    const { h, f, rpc } = setup({ route: () => json({ statusCode: status }, status) });
    const r = await h(post({ action: "e9100-submit", customerId: CID, registrationId: ACC, proxyApprovalDate: "2026-11-20" }));
    assert.equal(r.status, code, String(status));
    assert.equal((await r.json()).error.details.reason, reason);
    assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 1, `one call on ${status}`);
    const last = rpc.calls.filter((c) => c.fn === "surense_audit").at(-1)!;
    assert.deepEqual([last.args.p_op, last.args.p_status, last.args.p_phase], ["swiftness.e9100.submit", status, status === 504 ? "ambiguous" : "result"]);
  }
});

Deno.test("writes: no pending audit row, no request", async () => {
  const { h, f } = setup({ service: (fn) => {
    if (fn === "surense_audit") throw rpcError(503, "PGRST000", "db down");
    return null;
  } });
  const r = await h(post({ action: "invite-proxies", customerId: CID, nispahHei: true }));
  assert.equal(r.status, 503);
  assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 0);
});

Deno.test("health: ids, flags and names only", async () => {
  const { h, jwts } = setup({
    route: (url) => {
      if (url.endsWith("/user/info")) return json({ userId: ADMIN, agencyId: CID, email: "zz@example.test", cellNumber: "+972500000000", agencyAdmin: true });
      if (url.endsWith("/licensees")) return json([{ id: CID, name: "Licensee Test", accessible: true, idNumber: "012345678" }]);
      if (url.endsWith("/swiftness/accounts/list")) return json([{ id: ACC, accountName: "Account Test", status: { code: 2, description: "פעיל" }, defaultAccount: false }]);
      if (url.endsWith("/documents/types")) return json([{ id: CID, title: "נספח א' (מסלקה)", active: true }]);
      return json({}, 404);
    },
  });
  const r = await h(post({ action: "health" }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  const text = await r.text();
  assert.ok(!text.includes("zz@example.test") && !text.includes("+972500000000") && !text.includes("012345678"));
  const b = JSON.parse(text);
  assert.equal(b.result.user.userId, ADMIN);
  assert.equal(b.result.swiftnessAccounts[0].status, "פעיל");
  assert.deepEqual(jwts, [JWT], "the caller's JWT goes only to the staff check");
});

Deno.test("validation: unknown action, bad ids and invite shapes are 422 before Surense", async () => {
  const { h, f } = setup();
  for (const body of [
    { action: "delete-everything" },
    { action: "portfolio", customerId: "nope", mode: "production" },
    { action: "portfolio", customerId: CID, mode: "x" },
    { action: "e9100-submit", customerId: CID, registrationId: ACC, proxyApprovalDate: "20/11/2026" },
    { action: "invite-proxies", customerId: CID },
    { action: "invite-proxies", customerId: CID, nispahAlef: true },
    { action: "pull-documents" },
  ]) {
    assert.equal((await h(post(body))).status, 422, JSON.stringify(body));
  }
  assert.equal(f.calls.filter((c) => c.url !== TOKEN_URL).length, 0);
  assert.throws(() => parseInvite({ customerId: CID, leadId: CID, nispahHei: true }));
  assert.deepEqual(parseInvite({ leadId: CID, nispahHei: true, junk: "x" }), { leadId: CID, nispahHei: true });
});

Deno.test("Surense refusals map to codes only (no server text)", async () => {
  const { h } = setup({ route: () => json({ statusCode: 400, errors: [{ code: 40000, message: "Zz not accessible 012345678" }] }, 400) });
  const r = await h(post({ action: "portfolio", customerId: CID, mode: "production" }));
  assert.equal(r.status, 422);
  const text = await r.text();
  assert.ok(!text.includes("Zz") && !text.includes("012345678"));
  assert.deepEqual(JSON.parse(text).error.details, { surense: { status: 400, code: "40000" } });
});

Deno.test("no Surense credentials -> 503 after the staff check", async () => {
  const { h } = setup({ tokens: false });
  assert.equal((await h(post({ action: "health" }))).status, 503);
});
