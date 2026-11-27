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
  assert.deepEqual(await r502.json(), { ok: false, configured: true, sender: false, code: "bad_token", detail: "token parameter, invalid or missing" });
});

Deno.test("sms-health: reports the provider's state to api.sms_report and closes the cron run (x-job-run)", async () => {
  const run = { ...secret, "x-job-run": "77" };
  const okRpc = mockRpc();
  const f = mockFetch(() => json({ status: 1, action: "credit", message: "OK", data: { credit: 150, remoteIP: "x" } }));
  await createSmsHealthHandler({ env: testEnv({ SMS_API_TOKEN: "micropay-token-for-tests-aaaaaaaaaa" }), rpc: okRpc, log: silentLog(), fetch: f.fetch })(new Request("http://x", { method: "POST", headers: run }));
  assert.deepEqual(okRpc.calls.find((c) => c.fn === "sms_report")!.args, { p_ok: true, p_code: null, p_credit: 150 });
  assert.deepEqual(okRpc.calls.find((c) => c.fn === "job_finish")!.args, { p_run: 77, p_ok: true, p_stats: { credit: 150 }, p_error: null });

  const badRpc = mockRpc();
  const bad = mockFetch(() => json({ status: 0, action: "credit", message: "ERROR", data: { description: "token parameter, invalid or missing" } }));
  await createSmsHealthHandler({ env: testEnv({ SMS_API_TOKEN: "micropay-token-for-tests-aaaaaaaaaa" }), rpc: badRpc, log: silentLog(), fetch: bad.fetch })(new Request("http://x", { headers: run }));
  assert.deepEqual(badRpc.calls.find((c) => c.fn === "sms_report")!.args, { p_ok: false, p_code: "bad_token", p_credit: null });
  assert.equal(badRpc.calls.find((c) => c.fn === "job_finish")!.args.p_ok, false);

  // a manual call without the run header reports but has no run to close; an unauthenticated call reports nothing
  const manual = mockRpc();
  await createSmsHealthHandler({ env: testEnv({ SMS_API_TOKEN: "micropay-token-for-tests-aaaaaaaaaa" }), rpc: manual, log: silentLog(), fetch: f.fetch })(new Request("http://x", { headers: secret }));
  assert.equal(manual.calls.filter((c) => c.fn === "job_finish").length, 0);
  const anon = mockRpc();
  await createSmsHealthHandler({ env: testEnv({ SMS_API_TOKEN: "micropay-token-for-tests-aaaaaaaaaa" }), rpc: anon, log: silentLog(), fetch: f.fetch })(new Request("http://x", { headers: { "x-job-run": "77" } }));
  assert.equal(anon.calls.filter((c) => c.fn === "sms_report" || c.fn === "job_finish").length, 0);
});
