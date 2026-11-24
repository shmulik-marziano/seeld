// deno test supabase/functions/_shared/surense/harb_test.ts  (no network: Surense, the upload host and storage are mocks;
// no live call to Surense ever, not even a read)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../test_helpers.ts";
import { createTokenSource, REQUIRED_SCOPES, TOKEN_URL } from "./auth.ts";
import { DATA_IMPORT_UPLOAD_HOSTS, SURENSE_API } from "./client.ts";
import { buildSyncDeps } from "./connector.ts";
import { harbFileName, harbImportJob, planProvider, POLL_RETRY_SEC } from "./harb.ts";
import { type JobRow, runJob } from "./jobs.ts";
import { sha256Hex } from "./storage.ts";
import type { DataImportProvider } from "./types.ts";
import { listZip, readEntry } from "../harb/zip.ts";
import { buildHarbXlsx, SYNTH_HARB_ID } from "../harb/fixtures.ts";

const DOC = "d7000000-0000-4000-8000-000000000001";
const CUST = "c7100000-0000-4000-8000-000000000001";
const PROV = "a7000000-0000-4000-8000-000000000001";
const OTHER_PROV = "a7000000-0000-4000-8000-000000000002";
const IMP = "b7000000-0000-4000-8000-000000000001";
const UPLOAD_HOST = "uploads.example.test";
const UPLOAD_URL = `https://${UPLOAD_HOST}/bucket/${IMP}?X-Amz-Signature=synthetic`;
const NOW = Date.UTC(2026, 10, 25, 10, 0, 0);
const PATH = `harb/5eed0000-0000-4000-8000-000000000001/c7000000-0000-4000-8000-000000000001/harb_xlsx-${DOC}.xlsx`;

const PROVIDERS: DataImportProvider[] = [
  { id: OTHER_PROV, name: "Zz Producer Report", enabled: true },
  { id: PROV, name: "Zz הר הביטוח", enabled: true, properties: { managerRequired: false } },
];

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;

async function setup(o: { info?: Record<string, unknown> | Error; route?: Route; hosts?: readonly string[] | null; objects?: Uint8Array | null } = {}) {
  const xlsx = await buildHarbXlsx();
  const sha = await sha256Hex(xlsx);
  const info = o.info instanceof Error ? o.info : {
    storage_path: PATH, sha256: sha, surense_customer_id: CUST, provider_match: "הר הביטוח", import_status: "queued", import_id: null, ...(o.info ?? {}),
  };
  const sets: Array<[string, string | null, string | null]> = [];
  const audits: Array<[string, string | null, string]> = [];
  const rpc = mockRpc((fn, a) => {
    if (fn === "harb_import_get") {
      if (info instanceof Error) throw info;
      return info;
    }
    if (fn === "harb_import_set") {
      sets.push([a.p_status as string, a.p_code as string | null, a.p_import_id as string | null]);
      return { updated: true };
    }
    if (fn === "surense_audit") {
      audits.push([a.p_op as string, a.p_ref as string | null, a.p_phase as string]);
      return null;
    }
    return null;
  });
  const route: Route = o.route ?? ((url, init) => {
    if (url === `${SURENSE_API}/data-import/providers`) return json(PROVIDERS);
    if (url === `${SURENSE_API}/data-import/initiate`) return json({ record: { id: IMP, status: "INITIATED" }, uploadUrl: UPLOAD_URL });
    if (url.startsWith(`https://${UPLOAD_HOST}/`) && init?.method === "PUT") return new Response(null, { status: 200 });
    if (url === `${SURENSE_API}/data-import/${IMP}/start`) return json({ id: IMP, status: "UPLOADED" });
    if (url === `${SURENSE_API}/data-import/${IMP}`) return json({ id: IMP, status: "PROCESSING" });
    return json({ errors: [{ code: 40000, message: "Zz echo of a value" }] }, 400);
  });
  const f = mockFetch((url, _body, init) => url === TOKEN_URL
    ? json({ access_token: "tok_test_aaaaaaaaaaaa", token_type: "Bearer", expires_in: 3600, scope: REQUIRED_SCOPES.join(" ") })
    : route(url, init));
  const lines: string[] = [];
  const env = testEnv({ SURENSE_CLIENT_ID: "cid_test", SURENSE_CLIENT_SECRET: "test-secret" });
  const tokens = createTokenSource({ clientId: "cid_test", clientSecret: "test-secret", fetch: f.fetch });
  const d = buildSyncDeps({ env, rpc, log: silentLog(lines), tokens, fetch: f.fetch, sleep: () => Promise.resolve(), now: () => NOW, minIntervalMs: 0, maxAttempts: 1 });
  d.objects = o.objects === null ? null : { get: async (p) => (p === PATH ? (o.objects ?? xlsx) : null) };
  if (o.hosts !== null) d.dataImportHosts = o.hosts ?? [UPLOAD_HOST];
  const surense = () => f.calls.filter((c) => c.url !== TOKEN_URL);
  return { d, f, rpc, sets, audits, lines, xlsx, surense };
}

const job = (params: Record<string, unknown>, attempts = 1): JobRow => ({ id: 7, kind: "surense.harb_import", params, event_id: null, event_type: null, payload: null, attempts });

Deno.test("harb: planProvider picks exactly one enabled provider by id or by a part of its name; open questions are codes", () => {
  assert.deepEqual(planProvider(PROVIDERS, "", CUST), { ok: false, code: "provider_not_configured" });
  assert.deepEqual(planProvider(PROVIDERS, "nothing like it", CUST), { ok: false, code: "provider_not_found" });
  assert.deepEqual(planProvider(PROVIDERS, "zz", CUST), { ok: false, code: "provider_ambiguous" });
  assert.deepEqual(planProvider(PROVIDERS, "הר הביטוח", CUST), { ok: true, providerId: PROV, params: { customerId: CUST } });
  assert.deepEqual(planProvider(PROVIDERS, PROV.toUpperCase(), null), { ok: true, providerId: PROV, params: {} });
  assert.deepEqual(planProvider([{ ...PROVIDERS[1], enabled: false }], "הר", CUST), { ok: false, code: "provider_not_found" });
  assert.deepEqual(planProvider([{ ...PROVIDERS[1], properties: { validityMonthRequired: true } }], "הר", CUST), { ok: false, code: "provider_needs_validity_month" });
  assert.deepEqual(planProvider([{ ...PROVIDERS[1], subProviders: [{ id: OTHER_PROV }] }], "הר", CUST), { ok: false, code: "provider_needs_sub_provider" });
  assert.equal(planProvider([{ ...PROVIDERS[1], subProviders: [{ id: OTHER_PROV }], properties: { autoDetectSubProvider: true } }], "הר", CUST).ok, true);
  assert.deepEqual(planProvider([{ ...PROVIDERS[1], properties: { managerRequired: true } }], "הר", null), { ok: false, code: "provider_needs_customer" });
  assert.equal(harbFileName(NOW), "harb_2026-11-25.xlsx");
});

Deno.test("harb: the gates end the job before any Surense call (switches off, no approved upload host, no provider match)", async () => {
  assert.deepEqual(DATA_IMPORT_UPLOAD_HOSTS, [], "no data-import upload host is approved in code yet");
  const off = await setup({ info: rpcError(423, "PT423", "feature_disabled:surense_harb_import_enabled") });
  assert.deepEqual(await harbImportJob(off.d, { document_id: DOC }), { result: "skipped", code: "harb_switch_off" });
  assert.equal(off.f.calls.length, 0, "no token, no Surense call");

  const noHost = await setup({ hosts: null });
  assert.deepEqual(await harbImportJob(noHost.d, { document_id: DOC }), { result: "skipped", code: "upload_host_not_approved" });
  assert.equal(noHost.f.calls.length, 0);
  assert.deepEqual(noHost.sets, [["skipped", "upload_host_not_approved", null]]);

  const noMatch = await setup({ info: { provider_match: "  " } });
  assert.deepEqual(await harbImportJob(noMatch.d, { document_id: DOC }), { result: "skipped", code: "provider_not_configured" });
  assert.equal(noMatch.f.calls.length, 0);

  const bad = await setup();
  assert.equal((await harbImportJob(bad.d, { document_id: "not-a-uuid" })).code, "bad_input");
  assert.equal((await harbImportJob(bad.d, { document_id: DOC, import_id: "x" })).code, "bad_input");
  const gone = await setup({ info: rpcError(404, "PT404", "not_found") });
  assert.equal((await harbImportJob(gone.d, { document_id: DOC })).code, "document_not_found");
});

Deno.test("harb: a full push = providers -> initiate -> PUT zip (host-locked, no bearer) -> start; phases and audit rows written", async () => {
  const s = await setup();
  const out = await harbImportJob(s.d, { document_id: DOC });
  assert.equal(out.result, "done");
  assert.deepEqual(out.next, { kind: "surense.harb_import", params: { document_id: DOC, import_id: IMP }, dedupe: `harb:${DOC}` });
  assert.deepEqual(s.surense().map((c) => `${c.init?.method ?? "GET"} ${c.url.replace(SURENSE_API, "").replace(/\?.*$/, "")}`), [
    "GET /data-import/providers", "POST /data-import/initiate", `PUT https://${UPLOAD_HOST}/bucket/${IMP}`, `POST /data-import/${IMP}/start`,
  ]);
  const init = JSON.parse(s.surense()[1].body);
  assert.deepEqual(init, { provider: PROV, files: [{ fileName: "harb_2026-11-25.xlsx", fileSize: s.xlsx.byteLength }], params: { customerId: CUST } });
  const put = s.surense()[2];
  const headers = put.init?.headers as Record<string, string>;
  assert.equal(headers["content-type"], "application/zip");
  assert.equal(headers.authorization, undefined, "the bearer token never goes to the upload host");
  const zip = put.init?.body as Uint8Array;
  const entries = listZip(zip);
  assert.deepEqual(entries.map((e) => e.name), ["harb_2026-11-25.xlsx"]);
  assert.deepEqual(await readEntry(zip, entries[0]), s.xlsx, "the client's file, byte for byte, inside the zip");
  assert.deepEqual(s.sets.map((x) => x[0]), ["initiated", "uploaded", "sent"]);
  assert.ok(s.sets.every((x) => x[2] === IMP));
  assert.deepEqual(s.audits, [
    ["data_import.initiate", null, "pending"], ["data_import.initiate", null, "result"],
    ["data_import.upload", IMP, "pending"], ["data_import.upload", IMP, "result"],
    ["data_import.start", IMP, "pending"], ["data_import.start", IMP, "result"],
  ]);
  assert.ok(!s.f.calls.some((c) => c.url.includes("revert")), "never a revert");
  const logs = s.lines.join("\n");
  assert.ok(!logs.includes(SYNTH_HARB_ID) && !logs.includes("Signature=synthetic"), "no id and no signed url in the logs");
});

Deno.test("harb: an upload link off the approved hosts is never fetched; a changed or missing file is not sent", async () => {
  const s = await setup({ hosts: ["other.example.test"] });
  assert.deepEqual(await harbImportJob(s.d, { document_id: DOC }), { result: "skipped", code: "upload_host_not_allowed" });
  assert.ok(!s.f.calls.some((c) => c.url.includes(UPLOAD_HOST)), "no PUT to the unapproved host");
  assert.deepEqual(s.sets.at(-1), ["skipped", "upload_host_not_allowed", IMP]);

  const changed = await setup({ objects: new Uint8Array([1, 2, 3]) });
  assert.deepEqual(await harbImportJob(changed.d, { document_id: DOC }), { result: "skipped", code: "file_changed" });
  assert.equal(changed.surense().length, 0);
  const noStorage = await setup({ objects: null });
  assert.equal((await harbImportJob(noStorage.d, { document_id: DOC })).code, "storage_not_configured");
});

Deno.test("harb: 403 on initiate is a later retry; a permanent 400 ends skipped and is written on the document (through runJob)", async () => {
  const busy = await setup({ route: (url) => url.endsWith("/providers") ? json(PROVIDERS) : json({ errors: [{ code: 40300 }] }, 403) });
  const b = await harbImportJob(busy.d, { document_id: DOC });
  assert.deepEqual([b.result, b.code, b.kind, b.retryAfterSec], ["failed", "surense_403_busy", "rate_limited", 900]);

  const refused = await setup({ route: (url) => url.endsWith("/providers") ? json(PROVIDERS) : json({ errors: [{ code: 40001, message: "Zz value" }] }, 400) });
  const r = await runJob(refused.d, job({ document_id: DOC }), NOW + 60_000);
  assert.deepEqual([r.result, r.code], ["skipped", "surense_400_40001"]);
  assert.deepEqual(refused.sets.at(-1), ["skipped", "surense_400_40001", null]);
});

Deno.test("harb: the poll follow-up waits while processing, ends on PROCESSED (portfolio pull queued) or FAILED; a resume only starts", async () => {
  const running = await setup({ info: { import_status: "sent", import_id: IMP } });
  const p = await runJob(running.d, job({ document_id: DOC, import_id: IMP }), NOW + 60_000);
  assert.deepEqual([p.result, p.code, p.retryAfterSec], ["failed", "import_pending", POLL_RETRY_SEC]);
  assert.deepEqual(running.surense().map((c) => c.url), [`${SURENSE_API}/data-import/${IMP}`], "a poll is one GET");

  const done = await setup({ info: { import_status: "sent", import_id: IMP }, route: () => json({ id: IMP, status: "PROCESSED" }) });
  const d1 = await runJob(done.d, job({ document_id: DOC, import_id: IMP }), NOW + 60_000);
  assert.equal(d1.result, "done");
  assert.deepEqual(d1.next, { kind: "surense.portfolio_pull", params: { customer_id: CUST }, dedupe: `portfolio:${CUST}` });
  assert.deepEqual(done.sets, [["processed", null, IMP]]);

  const failed = await setup({ info: { import_status: "sent", import_id: IMP }, route: () => json({ id: IMP, status: "FAILED", failureReason: "Zz echo" }) });
  const f1 = await runJob(failed.d, job({ document_id: DOC, import_id: IMP }), NOW + 60_000);
  assert.deepEqual([f1.result, f1.code, f1.next], ["done", "import_failed", undefined]);
  assert.deepEqual(failed.sets, [["failed", "import_failed", IMP]]);
  assert.ok(!failed.lines.join("\n").includes("Zz echo"), "Surense's failure reason is never logged");

  const resume = await setup({ info: { import_status: "uploaded", import_id: IMP } });
  const r1 = await harbImportJob(resume.d, { document_id: DOC });
  assert.equal(r1.result, "done");
  assert.deepEqual(resume.surense().map((c) => c.url), [`${SURENSE_API}/data-import/${IMP}/start`], "no second initiate, no second upload");
  assert.deepEqual(resume.sets, [["sent", null, IMP]]);

  const final = await setup({ info: { import_status: "processed", import_id: IMP } });
  assert.deepEqual(await harbImportJob(final.d, { document_id: DOC }), { result: "skipped", code: "already_final" });
  assert.equal(final.f.calls.length, 0);
});
