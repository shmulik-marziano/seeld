// deno test supabase/functions/sms-health
import assert from "node:assert/strict";
import { createSmsHealthHandler } from "./handler.ts";
import { json, mockFetch, mockRpc, silentLog, testEnv } from "../_shared/test_helpers.ts";

const secret = { "x-cron-secret": "cron-secret-for-tests" };

Deno.test("sms-health: cron secret required; 503 without the token; balance with it; provider failure = 502 with a code", async () => {
  const noToken = createSmsHealthHandler({ env: testEnv(), rpc: mockRpc(), log: silentLog() });
  assert.equal((await noToken(new Request("http://x", { method: "GET" }))).status, 401);
  const r503 = await noToken(new Request("http://x", { method: "GET", headers: secret }));
  assert.equal(r503.status, 503);
  assert.deepEqual(await r503.json(), { ok: false, configured: false, sender: false });

  const f = mockFetch((_u, body) => {
    assert.ok(!body.includes("cron-secret"), "the cron secret never reaches the provider");
    return json({ status: 1, action: "credit", message: "OK", data: { credit: 4998, remoteIP: "x" } });
  });
  const lines: string[] = [];
  const ok = createSmsHealthHandler({ env: testEnv({ SMS_API_TOKEN: "micropay-token-for-tests-aaaaaaaaaa", SMS_SENDER_ID: "SEELD" }), rpc: mockRpc(), log: silentLog(lines), fetch: f.fetch });
  const res = await ok(new Request("http://x", { method: "POST", headers: secret }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, configured: true, sender: true, credit: 4998 });
  assert.ok(!lines.join("\n").includes("micropay-token-for-tests"), "the token is never logged");

  const bad = mockFetch(() => json({ status: 0, action: "credit", message: "ERROR", data: { description: "token parameter, invalid or missing" } }));
  const r502 = await createSmsHealthHandler({ env: testEnv({ SMS_API_TOKEN: "micropay-token-for-tests-aaaaaaaaaa" }), rpc: mockRpc(), log: silentLog(), fetch: bad.fetch })(new Request("http://x", { headers: secret }));
  assert.equal(r502.status, 502);
  assert.deepEqual(await r502.json(), { ok: false, configured: true, sender: false, code: "bad_token" });
});
