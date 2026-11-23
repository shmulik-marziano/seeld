// deno test supabase/functions/forms-intake/  (synthetic data only; no network: RPC, storage and fetch are mocks)
import assert from "node:assert/strict";
import { json, mockFetch, mockRpc, rpcError, silentLog, testEnv } from "../_shared/test_helpers.ts";
import {
  createFormsHandler, DOCUMENT_KINDS, type FormsIntakeDeps, MAX_STEP_BYTES, parseDocument, parseRoute, parseStart, parseStep, parseSubmit, SESSION_HEADER, toFormsError,
} from "./handler.ts";
import { type Storage, StorageError } from "../_shared/surense/storage.ts";
import { TOKEN_RE } from "../_shared/poa/session.ts";
import { PNG_URL, SYNTH_ID } from "../_shared/poa/fixtures.ts";

const BASE = "https://example.supabase.co/functions/v1/forms-intake";
const ORIGIN = "https://seeld.co.il";
const IP = "203.0.113.9";
const SID = "c5000000-0000-4000-8000-0000000000aa";
const DID = "d5000000-0000-4000-8000-0000000000aa";
const HASH = "ab".repeat(32);
const TOKEN = "t".repeat(43);
const NOW = Date.UTC(2026, 10, 23, 12, 0, 0);
const PDF_B64 = btoa("%PDF-1.4\n% synthetic client upload for the test\n%%EOF");

const IDENTITY = { first_name: "Dana", last_name: "Testov", national_id: SYNTH_ID, phone: "050-123-4567", email: "dana.testov@example.com", terms_privacy_approved: true, turnstile_token: "ts-token-secret-1" };
const STEP = { card: "personal", questionnaire: "personal", version: 1, step_key: "last_name", answers: { first_name: "Dana", last_name: "Testov" }, derived: {}, draft_version: 0, completion: 20 };
const SUBMIT = { card: "personal", questionnaire: "personal", version: 1, answers: { first_name: "Dana" }, derived: { completion: "full" }, signer: { name: "Dana Testov", kind: "typed", hash: HASH }, completion: 100 };

function session(over: Record<string, unknown> = {}) {
  return {
    session_id: SID, status: "open", expires_at: "2026-12-07T12:00:00Z",
    submissions: [{ card_key: "personal", questionnaire_key: "personal", version: 1, status: "draft", step_key: "last_name", draft_version: 2, completion_pct: 20, submitted_at: null, answers_stored: true, derived: {}, answers: { first_name: "Dana" } }],
    documents: [{ id: DID, kind: "id_copy", created_at: "2026-11-23T12:00:00Z", stored: true }],
    ...over,
  };
}

type Script = Record<string, unknown | ((args: Record<string, unknown>) => unknown)>;

function mockStorage(o: { fail?: number } = {}) {
  const puts: { path: string; bytes: number; type: string }[] = [];
  const storage: Storage = {
    async put(path, bytes, contentType) {
      if (o.fail !== undefined) throw new StorageError(o.fail);
      puts.push({ path, bytes: bytes.byteLength, type: contentType });
      return "stored";
    },
  };
  return { storage, puts };
}

function setup(o: { script?: Script; env?: Record<string, string>; storage?: FormsIntakeDeps["storage"]; turnstileOk?: boolean } = {}) {
  const lines: string[] = [];
  const defaults: Script = {
    form_config: { forms_enabled: true, health_enabled: false, turnstile_required: true },
    form_session_start: { ok: true, session_id: SID, expires_at: "2026-12-07T12:00:00Z" },
    form_session_get: session(),
    form_step_save: { ok: true, submission_id: DID, draft_version: 3, answers_stored: true },
    form_submit: { ok: true, submission_id: DID, submitted_at: "2026-11-23T12:00:05Z", answers_stored: true, duplicate: false },
    form_session_fail: { ok: true },
    form_document_add: (a: Record<string, unknown>) => ({ ok: true, document_id: DID, storage_path: `forms/5eed0000-0000-4000-8000-000000000001/${SID}/${a.p_kind}-${DID}.${a.p_ext}` }),
    form_document_stored: { ok: true },
  };
  const script = { ...defaults, ...(o.script ?? {}) };
  const rpc = mockRpc((fn, args) => {
    const v = script[fn];
    if (typeof v === "function") return (v as (a: Record<string, unknown>) => unknown)(args);
    if (v instanceof Error) throw v;
    return v ?? null;
  });
  const f = mockFetch((url) => (url.includes("siteverify") ? json(o.turnstileOk === false ? { success: false, "error-codes": ["invalid-input-response"] } : { success: true, hostname: "seeld.co.il" }) : json({}, 404)));
  const handler = createFormsHandler({ env: testEnv({ TURNSTILE_SECRET_KEY: "ts-secret", ...(o.env ?? {}) }), rpc, log: silentLog(lines), storage: o.storage ?? null, fetch: f.fetch, now: () => NOW });
  return { handler, rpc, lines, f };
}

const req = (path: string, init: { method?: string; body?: unknown; token?: string | null; origin?: string | null; ip?: string | null } = {}) => {
  const headers: Record<string, string> = {};
  if (init.origin !== null) headers.origin = init.origin ?? ORIGIN;
  if (init.ip !== null) headers["cf-connecting-ip"] = init.ip ?? IP;
  if (init.token !== null && init.token !== undefined) headers[SESSION_HEADER] = init.token;
  if (init.body !== undefined) headers["content-type"] = "application/json";
  return new Request(`${BASE}/${path}`, { method: init.method ?? (init.body !== undefined ? "POST" : "GET"), headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined });
};
const call = (rpc: ReturnType<typeof mockRpc>, fn: string) => rpc.calls.filter((c) => c.fn === fn);

Deno.test("routes: the five routes, the wrong verb, an unknown path", () => {
  assert.equal(parseRoute("POST", "/functions/v1/forms-intake/start"), "start");
  assert.equal(parseRoute("GET", "/forms-intake/state"), "state");
  assert.equal(parseRoute("POST", "/forms-intake/step"), "step");
  assert.equal(parseRoute("POST", "/forms-intake/submit"), "submit");
  assert.equal(parseRoute("POST", "/forms-intake/document"), "document");
  assert.equal(parseRoute("GET", "/forms-intake/start"), "method");
  assert.equal(parseRoute("POST", "/forms-intake/state"), "method");
  assert.equal(parseRoute("GET", "/forms-intake/nothing"), null);
  assert.equal(parseRoute("GET", "/forms-intake/step/x"), null);
});

Deno.test("parseStart: identity normalised; every refusal names a field", () => {
  const p = parseStart(IDENTITY);
  assert.deepEqual(p.identity, { firstName: "Dana", lastName: "Testov", nationalId: SYNTH_ID, phone: "+972501234567", email: "dana.testov@example.com" });
  assert.equal(p.turnstileToken, "ts-token-secret-1");
  const codeOf = (b: Record<string, unknown>) => {
    try { parseStart(b); return "ok"; } catch (e) { return (e as Error).message; }
  };
  assert.equal(codeOf({ ...IDENTITY, first_name: "" }), "invalid_first_name");
  assert.equal(codeOf({ ...IDENTITY, national_id: "123456789" }), "invalid_national_id");
  assert.equal(codeOf({ ...IDENTITY, phone: "03-1234567" }), "invalid_phone");
  assert.equal(codeOf({ ...IDENTITY, email: "nope" }), "invalid_email");
  assert.equal(codeOf({ ...IDENTITY, terms_privacy_approved: false }), "terms_required");
  assert.equal(codeOf({ ...IDENTITY, extra: 1 }), "unknown_key");
  assert.equal(parseStart({ ...IDENTITY, email: "" }).identity.email, null);
});

Deno.test("parseStep / parseSubmit: keys, versions, the signer", () => {
  assert.deepEqual(parseStep(STEP), { card: "personal", questionnaire: "personal", version: 1, stepKey: "last_name", answers: STEP.answers, derived: {}, draftVersion: 0, completion: 20 });
  assert.equal(parseStep({ ...STEP, step_key: null }).stepKey, null);
  assert.throws(() => parseStep({ ...STEP, questionnaire: "Bad Key" }), /invalid_questionnaire/);
  assert.throws(() => parseStep({ ...STEP, version: 0 }), /invalid_version/);
  assert.throws(() => parseStep({ ...STEP, draft_version: -1 }), /invalid_draft_version/);
  assert.throws(() => parseStep({ ...STEP, completion: 101 }), /invalid_completion/);
  assert.throws(() => parseStep({ ...STEP, answers: [] }), /invalid_answers/);
  assert.throws(() => parseStep({ ...STEP, step_key: "a b" }), /invalid_step_key/);
  const s = parseSubmit(SUBMIT);
  assert.deepEqual(s.signer, { name: "Dana Testov", kind: "typed", hash: HASH });
  assert.equal(parseSubmit({ ...SUBMIT, signer: { ...SUBMIT.signer, kind: "drawn", png: PNG_URL } }).signer.png, PNG_URL);
  assert.throws(() => parseSubmit({ ...SUBMIT, signer: { ...SUBMIT.signer, kind: "drawn" } }), /invalid_signature/);
  assert.throws(() => parseSubmit({ ...SUBMIT, signer: { ...SUBMIT.signer, hash: "zz" } }), /invalid_signer_hash/);
  assert.throws(() => parseSubmit({ ...SUBMIT, signer: { ...SUBMIT.signer, name: "D" } }), /invalid_signer_name/);
  assert.throws(() => parseSubmit({ ...SUBMIT, signer: { ...SUBMIT.signer, extra: 1 } }), /unknown_key/);
});

Deno.test("parseDocument: kind, extension, base64 and the file signature", () => {
  const d = parseDocument({ kind: "id_copy", ext: "pdf", content_type: "application/pdf", bytes_base64: PDF_B64 });
  assert.equal(d.contentType, "application/pdf");
  assert.ok(d.bytes.byteLength > 16);
  assert.deepEqual([...DOCUMENT_KINDS], ["id_copy", "payslip", "statement", "other"]);
  assert.throws(() => parseDocument({ kind: "selfie", ext: "pdf", bytes_base64: PDF_B64 }), /invalid_kind/);
  assert.throws(() => parseDocument({ kind: "id_copy", ext: "exe", bytes_base64: PDF_B64 }), /invalid_ext/);
  assert.throws(() => parseDocument({ kind: "id_copy", ext: "png", bytes_base64: PDF_B64 }), /invalid_file_signature/);
  assert.throws(() => parseDocument({ kind: "id_copy", ext: "pdf", content_type: "text/html", bytes_base64: PDF_B64 }), /invalid_content_type/);
  assert.throws(() => parseDocument({ kind: "id_copy", ext: "pdf", bytes_base64: "not base64!" }), /invalid_bytes/);
});

Deno.test("start: origin gate, Turnstile, the switch, then a session token (only its hash reaches the database)", async () => {
  const s = setup();
  const r0 = await s.handler(req("start", { body: IDENTITY, origin: "https://evil.example" }));
  assert.equal(r0.status, 403);
  assert.deepEqual(await r0.json(), { error: "generic", code: "origin" });

  const r1 = await s.handler(req("start", { body: IDENTITY }));
  assert.equal(r1.status, 200);
  const b1 = await r1.json() as { session_token: string; expires_at: string; health_stored: boolean };
  assert.ok(TOKEN_RE.test(b1.session_token));
  assert.equal(b1.health_stored, false);
  const start = call(s.rpc, "form_session_start")[0];
  assert.equal(typeof start.args.p_token_hash, "string");
  assert.ok(!JSON.stringify(start.args).includes(b1.session_token), "the token itself never reaches the database");
  assert.deepEqual(start.args.p_identity, { first_name: "Dana", last_name: "Testov", email: "dana.testov@example.com" });
  assert.equal(start.args.p_phone, "+972501234567");
  assert.ok(s.f.calls.some((c) => c.url.includes("siteverify")), "Turnstile verified");
  assert.ok(!s.lines.join("\n").includes("Dana"), "no identity in the logs");

  const off = setup({ script: { form_config: { forms_enabled: false, health_enabled: false, turnstile_required: true } } });
  const r2 = await off.handler(req("start", { body: IDENTITY }));
  assert.equal(r2.status, 503);
  assert.deepEqual(await r2.json(), { error: "inactive", code: "switch_off" });
  assert.equal(call(off.rpc, "form_session_start").length, 0);

  const ts = setup({ turnstileOk: false });
  const r3 = await ts.handler(req("start", { body: IDENTITY }));
  assert.equal(r3.status, 400);
  assert.deepEqual(await r3.json(), { error: "generic", code: "turnstile_rejected" });

  const r4 = await s.handler(req("start", { body: { ...IDENTITY, national_id: "123456789" } }));
  assert.equal(r4.status, 400);
  assert.equal((await r4.json()).code, "invalid_national_id");
});

Deno.test("state: a missing or unknown token is refused; a known one answers the view", async () => {
  const s = setup();
  const r0 = await s.handler(req("state", { token: null }));
  assert.equal(r0.status, 401);
  assert.deepEqual(await r0.json(), { error: "inactive", code: "no_session" });
  const unknown = setup({ script: { form_session_get: rpcError(401, "PT401", "session_inactive") } });
  const r1 = await unknown.handler(req("state", { token: TOKEN }));
  assert.equal(r1.status, 401);
  assert.deepEqual(await r1.json(), { error: "inactive", code: "session_inactive" });
  const r2 = await s.handler(req("state", { token: TOKEN }));
  assert.equal(r2.status, 200);
  const b = await r2.json();
  assert.equal(b.status, "open");
  assert.deepEqual(b.submissions[0], { card: "personal", questionnaire: "personal", version: 1, status: "draft", step_key: "last_name", draft_version: 2, completion: 20, submitted_at: null, answers_stored: true, derived: {}, answers: { first_name: "Dana" } });
  assert.deepEqual(b.documents, [{ id: DID, kind: "id_copy", created_at: "2026-11-23T12:00:00Z", stored: true }]);
  const expired = setup({ script: { form_session_get: session({ status: "expired" }) } });
  const r3 = await expired.handler(req("step", { token: TOKEN, body: STEP }));
  assert.equal(r3.status, 410);
  assert.deepEqual(await r3.json(), { error: "expired", code: "session_expired" });
});

Deno.test("step: saved with the session id; a stale draft keeps the database's code", async () => {
  const s = setup();
  const r = await s.handler(req("step", { token: TOKEN, body: STEP }));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { saved: true, draft_version: 3, answers_stored: true });
  const a = call(s.rpc, "form_step_save")[0].args;
  assert.equal(a.p_session, SID);
  assert.equal(a.p_questionnaire, "personal");
  assert.equal(a.p_draft_version, 0);
  assert.deepEqual(a.p_answers, STEP.answers);

  const stale = setup({ script: { form_step_save: rpcError(409, "PT409", "stale_draft") } });
  const r1 = await stale.handler(req("step", { token: TOKEN, body: STEP }));
  assert.equal(r1.status, 409);
  assert.deepEqual(await r1.json(), { error: "completed", code: "stale_draft" });

  const big = { ...STEP, answers: { x: "y".repeat(MAX_STEP_BYTES) } };
  const r2 = await s.handler(req("step", { token: TOKEN, body: big }));
  assert.equal(r2.status, 413);
});

Deno.test("submit: the signer and the client ip go to the database; a duplicate is reported, never re-recorded", async () => {
  const s = setup();
  const r = await s.handler(req("submit", { token: TOKEN, body: SUBMIT }));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { submitted: true, submitted_at: "2026-11-23T12:00:05Z", answers_stored: true, duplicate: false });
  const a = call(s.rpc, "form_submit")[0].args;
  assert.equal(a.p_ip, IP);
  assert.deepEqual(a.p_signer, { name: "Dana Testov", kind: "typed", hash: HASH });
  assert.equal(a.p_completion, 100);
  const dup = setup({ script: { form_submit: { ok: true, submission_id: DID, submitted_at: "2026-11-23T11:00:00Z", answers_stored: true, duplicate: true } } });
  assert.equal(((await (await dup.handler(req("submit", { token: TOKEN, body: SUBMIT }))).json()) as { duplicate: boolean }).duplicate, true);
  const r2 = await s.handler(req("submit", { token: TOKEN, body: { ...SUBMIT, signer: { name: "Dana Testov", kind: "drawn", hash: HASH } } }));
  assert.equal(r2.status, 400);
  assert.equal((await r2.json()).code, "invalid_signature");
});

Deno.test("document: row, bytes under the path the database named, mark; a storage failure leaves a code and never a path", async () => {
  const st = mockStorage();
  const s = setup({ storage: st.storage });
  const r = await s.handler(req("document", { token: TOKEN, body: { kind: "payslip", ext: "pdf", bytes_base64: PDF_B64 } }));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { document_id: DID, kind: "payslip", stored: true });
  const add = call(s.rpc, "form_document_add")[0].args;
  assert.equal(add.p_kind, "payslip");
  assert.equal(add.p_ext, "pdf");
  assert.match(add.p_sha256 as string, /^[0-9a-f]{64}$/);
  assert.equal(st.puts.length, 1);
  assert.equal(st.puts[0].path, `forms/5eed0000-0000-4000-8000-000000000001/${SID}/payslip-${DID}.pdf`);
  assert.equal(st.puts[0].type, "application/pdf");
  assert.equal(call(s.rpc, "form_document_stored")[0].args.p_path, st.puts[0].path);

  const broken = setup({ storage: mockStorage({ fail: 500 }).storage });
  const r1 = await broken.handler(req("document", { token: TOKEN, body: { kind: "id_copy", ext: "pdf", bytes_base64: PDF_B64 } }));
  assert.equal(r1.status, 503);
  assert.deepEqual(await r1.json(), { error: "unavailable", code: "doc_storage" });
  assert.equal(call(broken.rpc, "form_document_stored").length, 0);
  assert.equal(call(broken.rpc, "form_session_fail")[0].args.p_code, "doc_storage");

  const none = setup();
  const r2 = await none.handler(req("document", { token: TOKEN, body: { kind: "id_copy", ext: "pdf", bytes_base64: PDF_B64 } }));
  assert.equal(r2.status, 503);
  assert.equal((await r2.json()).code, "storage_not_configured");
});

Deno.test("errors: database codes are kept when they are short words; anything else is the generic mapping", () => {
  assert.equal(toFormsError(rpcError(409, "PT409", "already_submitted")).code, "already_submitted");
  assert.equal(toFormsError(rpcError(423, "PT423", "feature_disabled:forms_enabled")).code, "feature_disabled:forms_enabled");
  assert.equal(toFormsError(rpcError(423, "PT423", "feature_disabled:forms_enabled")).status, 503);
  assert.equal(toFormsError(rpcError(500, "XX000", "rpc x failed")).code, "db_XX000");
  assert.equal(toFormsError(new Error("boom")).code, "internal");
});
