// forms-intake: the backend of the client forms (/forms; contract: docs/product/CLIENT-FORMS.md; browser side src/forms/api.ts).
// Public (verify_jwt=false): the gates are the Origin allowlist, Turnstile on /start, the session token (header
// x-forms-session; only its SHA-256 reaches the database) and the ops.config switches enforced in SQL (forms_enabled,
// forms_health_enabled). Everything is OFF by default.
//   POST /start      identity + consent -> api.form_session_start -> {session_token, expires_at}
//   GET  /state      the session: submissions (a draft carries its saved answers), documents
//   POST /step       one step of one questionnaire (draft version check, idempotent by content)
//   POST /submit     the final submission of one questionnaire with the signer evidence
//   POST /document   one client upload (base64 JSON) -> private bucket client-docs, crm.documents row
// Errors: {"error": "<kind>", "code": "<short code>"} (kind as in the POA wizard: inactive | unavailable | generic | expired |
// locked | completed; the code is a short machine word such as stale_draft, never a value or an upstream text).
// Logs: route, status, codes, ids. Never a body, a header value, a token or an identity.
import { corsHeaders } from "../_shared/cors.ts";
import { type Rpc, RpcError } from "../_shared/db.ts";
import type { FetchFn } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import type { Logger } from "../_shared/logger.ts";
import { clientIp } from "../_shared/ip.ts";
import { requestIdFor } from "../_shared/request.ts";
import { shortHash } from "../_shared/secret.ts";
import { hostnamesFromOrigins, verifyTurnstile } from "../_shared/turnstile.ts";
import { PoaHttpError, toPoaError } from "../_shared/poa/errors.ts";
import { cleanEmail, cleanName, isValidIsraeliId, toE164IsraeliMobile } from "../_shared/poa/formatters.ts";
import { generateToken, hashToken, sha256Hex, TOKEN_RE } from "../_shared/poa/session.ts";
import type { Storage } from "../_shared/surense/storage.ts";
import { createFormsRpc, type FormsRpc, type FormSession } from "../_shared/forms/rpc.ts";

export const MAX_START_BYTES = 8 * 1024;
export const MAX_STEP_BYTES = 256 * 1024;
export const MAX_SUBMIT_BYTES = 640 * 1024;
/** a document as base64 JSON: 6 MB of bytes */
export const MAX_DOCUMENT_BYTES = 6 * 1024 * 1024;
export const MAX_DOCUMENT_JSON_BYTES = Math.ceil(MAX_DOCUMENT_BYTES * 4 / 3) + 4096;
export const REJECT_LIMIT = 30;
export const REJECT_WINDOW_SEC = 600;
export const SESSION_HEADER = "x-forms-session";

const START_KEYS = ["first_name", "last_name", "national_id", "phone", "email", "terms_privacy_approved", "turnstile_token"];
const STEP_KEYS = ["card", "questionnaire", "version", "step_key", "answers", "derived", "draft_version", "completion"];
const SUBMIT_KEYS = ["card", "questionnaire", "version", "answers", "derived", "signer", "completion"];
const SIGNER_KEYS = ["name", "kind", "png", "hash"];
const DOCUMENT_KEYS = ["kind", "ext", "content_type", "bytes_base64"];
export const DOCUMENT_KINDS = ["id_copy", "payslip", "statement", "other"] as const;
const EXT_TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic" };
const KEY_RE = /^[a-z][a-z0-9-]{1,40}$/;
const SECURITY_HEADERS = { "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" };

export interface FormsIntakeDeps {
  env: Env;
  /** service RPC client; null when the function is not configured */
  rpc: Rpc | null;
  log: Logger;
  /** the private bucket writer; null = documents refused with `unavailable` */
  storage: Storage | null;
  fetch?: FetchFn;
  now?: () => number;
}

/** per-isolate, best effort: an address that keeps failing origin / shape / Turnstile is cut off before any DB call */
export interface Counter { hit(key: string): number; count(key: string): number }
export function createCounter(now: () => number = Date.now, windowSec = REJECT_WINDOW_SEC): Counter {
  const m = new Map<string, { start: number; n: number }>();
  const cur = (k: string) => {
    const b = m.get(k);
    return !b || now() - b.start >= windowSec * 1000 ? null : b;
  };
  return {
    hit(k) {
      const b = cur(k);
      if (!b) {
        if (m.size > 5000) m.clear();
        m.set(k, { start: now(), n: 1 });
        return 1;
      }
      return ++b.n;
    },
    count: (k) => cur(k)?.n ?? 0,
  };
}

export function formsCors(origin: string | null, allowed: string[]): Record<string, string> {
  const h = corsHeaders(origin, allowed);
  h["Access-Control-Allow-Headers"] += `, ${SESSION_HEADER}`;
  return h;
}

export type Route = "start" | "state" | "step" | "submit" | "document";

/** "/functions/v1/forms-intake/step" -> "step"; "method" for a known path with the wrong verb; null when not a route */
export function parseRoute(method: string, pathname: string): Route | "method" | null {
  const segs = pathname.split("/").filter(Boolean);
  const i = segs.indexOf("forms-intake");
  const rest = i >= 0 ? segs.slice(i + 1) : segs;
  if (rest.length !== 1) return null;
  const r = rest[0];
  if (r === "state") return method === "GET" ? "state" : "method";
  if (r === "start" || r === "step" || r === "submit" || r === "document") return method === "POST" ? r : "method";
  return null;
}

const bad = (code: string, status = 400) => new PoaHttpError("generic", code, { status });
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

async function readJson(req: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (Number(req.headers.get("content-length") ?? "0") > maxBytes) throw bad("too_large", 413);
  const raw = new Uint8Array(await req.arrayBuffer());
  if (raw.byteLength > maxBytes) throw bad("too_large", 413);
  let j: unknown;
  try {
    j = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw bad("bad_json");
  }
  if (!isObj(j)) throw bad("bad_body");
  return j;
}

function onlyKeys(b: Record<string, unknown>, allowed: string[]) {
  for (const k of Object.keys(b)) if (!allowed.includes(k)) throw bad("unknown_key");
}

export interface ParsedStart {
  identity: { firstName: string; lastName: string; nationalId: string; phone: string; email: string | null };
  turnstileToken: string | null;
}

/** pure: /start body -> validated identity; throws PoaHttpError(generic, "invalid_<field>") */
export function parseStart(b: Record<string, unknown>): ParsedStart {
  onlyKeys(b, START_KEYS);
  const firstName = cleanName(b.first_name);
  if (!firstName) throw bad("invalid_first_name");
  const lastName = cleanName(b.last_name);
  if (!lastName) throw bad("invalid_last_name");
  const nid = typeof b.national_id === "string" ? b.national_id.trim() : "";
  if (!isValidIsraeliId(nid)) throw bad("invalid_national_id");
  const phone = typeof b.phone === "string" ? toE164IsraeliMobile(b.phone) : null;
  if (!phone) throw bad("invalid_phone");
  const email = cleanEmail(b.email);
  if (email === undefined) throw bad("invalid_email");
  if (b.terms_privacy_approved !== true) throw bad("terms_required");
  const t = b.turnstile_token;
  if (t !== undefined && t !== null && (typeof t !== "string" || t.length > 2048)) throw bad("invalid_turnstile_token");
  return { identity: { firstName, lastName, nationalId: nid, phone, email }, turnstileToken: typeof t === "string" && t ? t : null };
}

export interface ParsedStep { card: string; questionnaire: string; version: number; stepKey: string | null; answers: Record<string, unknown>; derived: Record<string, unknown>; draftVersion: number; completion: number }

function key(v: unknown, code: string): string {
  if (typeof v !== "string" || !KEY_RE.test(v)) throw bad(code);
  return v;
}
function posInt(v: unknown, code: string, min = 0, max = 1_000_000): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) throw bad(code);
  return v;
}
function answersOf(v: unknown): Record<string, unknown> {
  if (!isObj(v)) throw bad("invalid_answers");
  if (Object.keys(v).length > 2000) throw bad("invalid_answers");
  return v;
}
function derivedOf(v: unknown): Record<string, unknown> {
  if (v === undefined || v === null) return {};
  if (!isObj(v)) throw bad("invalid_derived");
  if (JSON.stringify(v).length > 4000) throw bad("invalid_derived");
  return v;
}

/** pure: /step body -> validated step */
export function parseStep(b: Record<string, unknown>): ParsedStep {
  onlyKeys(b, STEP_KEYS);
  const stepKey = b.step_key === undefined || b.step_key === null ? null : b.step_key;
  if (stepKey !== null && (typeof stepKey !== "string" || stepKey.length > 80 || !/^[A-Za-z0-9_.:-]+$/.test(stepKey))) throw bad("invalid_step_key");
  return {
    card: key(b.card, "invalid_card"),
    questionnaire: key(b.questionnaire, "invalid_questionnaire"),
    version: posInt(b.version, "invalid_version", 1),
    stepKey: stepKey as string | null,
    answers: answersOf(b.answers),
    derived: derivedOf(b.derived),
    draftVersion: posInt(b.draft_version, "invalid_draft_version"),
    completion: posInt(b.completion, "invalid_completion", 0, 100),
  };
}

export interface ParsedSubmit { card: string; questionnaire: string; version: number; answers: Record<string, unknown>; derived: Record<string, unknown>; signer: { name: string; kind: "drawn" | "typed" | "none"; png?: string; hash: string }; completion: number }

/** pure: /submit body -> validated submission. Signer kind "none" = a questionnaire without a signature step (the risk profile). */
export function parseSubmit(b: Record<string, unknown>): ParsedSubmit {
  onlyKeys(b, SUBMIT_KEYS);
  if (!isObj(b.signer)) throw bad("invalid_signer");
  onlyKeys(b.signer, SIGNER_KEYS);
  const kind = b.signer.kind;
  if (kind !== "drawn" && kind !== "typed" && kind !== "none") throw bad("invalid_signer_kind");
  const name = kind === "none" ? (cleanName(b.signer.name) ?? "") : cleanName(b.signer.name);
  if (name === null || (kind !== "none" && name.length < 2)) throw bad("invalid_signer_name");
  const hash = b.signer.hash;
  if (typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash)) throw bad("invalid_signer_hash");
  let png: string | undefined;
  if (kind === "drawn") {
    const p = b.signer.png;
    if (typeof p !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p) || p.length > 300_000) throw bad("invalid_signature");
    png = p;
  } else if (b.signer.png !== undefined && b.signer.png !== null) throw bad("invalid_signature");
  return {
    card: key(b.card, "invalid_card"),
    questionnaire: key(b.questionnaire, "invalid_questionnaire"),
    version: posInt(b.version, "invalid_version", 1),
    answers: answersOf(b.answers),
    derived: derivedOf(b.derived),
    signer: { name, kind, hash, ...(png ? { png } : {}) },
    completion: posInt(b.completion, "invalid_completion", 0, 100),
  };
}

export interface ParsedDocument { kind: (typeof DOCUMENT_KINDS)[number]; ext: string; contentType: string; bytes: Uint8Array }

/** pure: /document body -> validated bytes (base64 decoded, type checked against the extension by the leading bytes) */
export function parseDocument(b: Record<string, unknown>): ParsedDocument {
  onlyKeys(b, DOCUMENT_KEYS);
  const kind = b.kind;
  if (typeof kind !== "string" || !(DOCUMENT_KINDS as readonly string[]).includes(kind)) throw bad("invalid_kind");
  const ext = typeof b.ext === "string" ? b.ext.toLowerCase() : "";
  if (!(ext in EXT_TYPES)) throw bad("invalid_ext");
  const ct = typeof b.content_type === "string" ? b.content_type.toLowerCase() : EXT_TYPES[ext];
  if (ct !== EXT_TYPES[ext]) throw bad("invalid_content_type");
  const b64 = b.bytes_base64;
  if (typeof b64 !== "string" || !b64 || !/^[A-Za-z0-9+/]+=*$/.test(b64)) throw bad("invalid_bytes");
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    throw bad("invalid_bytes");
  }
  if (bin.length < 16 || bin.length > MAX_DOCUMENT_BYTES) throw bad("invalid_bytes");
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const head = Array.from(bytes.subarray(0, 12), (x) => x.toString(16).padStart(2, "0")).join("");
  const ok = (ext === "pdf" && head.startsWith("255044462d")) // %PDF-
    || ((ext === "jpg" || ext === "jpeg") && head.startsWith("ffd8ff"))
    || (ext === "png" && head.startsWith("89504e470d0a1a0a"))
    || (ext === "heic" && head.slice(8, 16) === "66747970"); // ....ftyp
  if (!ok) throw bad("invalid_file_signature");
  return { kind: kind as ParsedDocument["kind"], ext, contentType: ct, bytes };
}

export function sessionView(s: FormSession) {
  return {
    status: s.status,
    expires_at: s.expiresAt,
    submissions: s.submissions.map((x) => ({
      card: x.cardKey, questionnaire: x.questionnaireKey, version: x.version, status: x.status, step_key: x.stepKey, draft_version: x.draftVersion,
      completion: x.completionPct, submitted_at: x.submittedAt, answers_stored: x.answersStored, derived: x.derived, answers: x.answers,
    })),
    documents: s.documents.map((d) => ({ id: d.id, kind: d.kind, created_at: d.createdAt, stored: d.stored })),
  };
}

/** the body of every refusal: the kind (the browser's screen) and a short code (never a value) */
export function errorBody(err: PoaHttpError, requestId: string, extra: Record<string, string> = {}): Response {
  const code = /^[a-z0-9_:.-]{1,80}$/.test(err.code) ? err.code : "error";
  return new Response(JSON.stringify({ error: err.kind, code }), {
    status: err.status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId, ...extra, ...(err.headers ?? {}) },
  });
}

/** an RpcError -> the browser error, keeping the database's short code (stale_draft, already_submitted, ...) */
export function toFormsError(e: unknown): PoaHttpError {
  if (e instanceof RpcError && /^[a-z_]+(:[a-z_]+)?$/.test(e.message) && e.message !== "x") {
    const base = toPoaError(e);
    return new PoaHttpError(base.kind, e.message, { status: base.status, headers: base.headers });
  }
  return toPoaError(e);
}

export function createFormsHandler(d: FormsIntakeDeps): (req: Request) => Promise<Response> {
  const now = d.now ?? Date.now;
  const turnstileHosts = hostnamesFromOrigins(d.env.allowedOrigins);
  const rejects = createCounter(now);
  const forms: FormsRpc | null = d.rpc ? createFormsRpc(d.rpc) : null;

  return async (req) => {
    const rid = requestIdFor(req);
    const origin = req.headers.get("origin");
    const cors = formsCors(origin, d.env.allowedOrigins);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const log = d.log.child({ requestId: rid });
    const ip = clientIp(req.headers);
    const ipTag = ip ? await shortHash(ip) : "none";

    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": rid, ...SECURITY_HEADERS, ...cors } });

    const fail = (e: unknown, route: string): Response => {
      const err = toFormsError(e);
      if (!(e instanceof PoaHttpError) || err.status >= 500) log.warn("forms request failed", { route, kind: err.kind, code: err.code, status: err.status });
      else log.info("forms request refused", { route, kind: err.kind, code: err.code, status: err.status });
      return errorBody(err, rid, cors);
    };
    const rejectEarly = (route: string, err: PoaHttpError): Response => {
      const n = rejects.hit(ipTag);
      log.warn("forms rejected", { route, code: err.code, ip: ipTag, rejects: n });
      return errorBody(err, rid, cors);
    };
    const unknownToken = (e: unknown, route: string): Response | null =>
      e instanceof RpcError && e.status === 401 ? rejectEarly(route, toFormsError(e)) : null;

    const url = new URL(req.url);
    const route = parseRoute(req.method, url.pathname);
    if (route === null) return errorBody(bad("no_route", 404), rid, cors);
    if (route === "method") return errorBody(bad("method_not_allowed", 405), rid, cors);

    try {
      if (!origin || !d.env.allowedOrigins.includes(origin)) return rejectEarly(route, bad("origin", 403));
      if (rejects.count(ipTag) >= REJECT_LIMIT) {
        return errorBody(new PoaHttpError("locked", "rate_limited_memory", { status: 429, headers: { "retry-after": "600" } }), rid, cors);
      }
      if (!forms || !d.rpc) {
        log.error("forms not configured", { missing: "SUPABASE_URL or secret key" });
        throw new PoaHttpError("unavailable", "not_configured");
      }
      const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

      // ------------------------------------------------------------------ /start
      if (route === "start") {
        let parsed: ParsedStart;
        try {
          parsed = parseStart(await readJson(req, MAX_START_BYTES));
        } catch (e) {
          if (e instanceof PoaHttpError) return rejectEarly("start", e);
          throw e;
        }
        const cfg = await forms.config();
        if (cfg && !cfg.formsEnabled) throw new PoaHttpError("inactive", "switch_off", { status: 503 });
        if (!ip) {
          log.warn("no client ip header");
          return rejectEarly("start", bad("no_client_ip"));
        }
        if (cfg ? cfg.turnstileRequired : true) {
          const ts = await verifyTurnstile(parsed.turnstileToken, ip, {
            secret: d.env.turnstileSecret,
            production: d.env.stage === "production",
            hostnames: turnstileHosts,
            fetch: d.fetch,
          });
          if (!ts.ok) {
            if (ts.reason === "not_configured" || ts.reason === "unavailable") {
              log.error("turnstile unavailable", { reason: ts.reason });
              throw new PoaHttpError("unavailable", `turnstile_${ts.reason}`);
            }
            return rejectEarly("start", bad(`turnstile_${ts.reason}`));
          }
        }
        const token = generateToken();
        const tokenHash = await hashToken(token);
        const started = await forms.sessionStart({
          tokenHash,
          uaHash: ua ? await sha256Hex(ua) : null,
          firstName: parsed.identity.firstName,
          lastName: parsed.identity.lastName,
          email: parsed.identity.email,
          nationalId: parsed.identity.nationalId,
          phone: parsed.identity.phone,
          clientIp: ip,
        });
        log.info("forms started", { session: started.sessionId });
        return json({ session_token: token, expires_at: started.expiresAt, health_stored: cfg ? cfg.healthEnabled : false });
      }

      // ------------------------------------------------------------------ session routes
      const token = req.headers.get(SESSION_HEADER) ?? "";
      if (!TOKEN_RE.test(token)) return rejectEarly(route, new PoaHttpError("inactive", "no_session"));
      const tokenHash = await hashToken(token);
      let session: FormSession;
      try {
        session = await forms.sessionGet(tokenHash);
      } catch (e) {
        const r = unknownToken(e, route);
        if (r) return r;
        throw e;
      }
      log.debug("forms session", { session: session.sessionId, route });
      if (route === "state") return json(sessionView(session));
      if (session.status === "expired") throw new PoaHttpError("expired", "session_expired");
      if (session.status === "locked") throw new PoaHttpError("locked", "session_locked");

      if (route === "step") {
        let p: ParsedStep;
        try {
          p = parseStep(await readJson(req, MAX_STEP_BYTES));
        } catch (e) {
          if (e instanceof PoaHttpError) return rejectEarly("step", e);
          throw e;
        }
        const r = await forms.stepSave({ sessionId: session.sessionId, ...p });
        return json({ saved: true, draft_version: r.draftVersion, answers_stored: r.answersStored });
      }

      if (route === "submit") {
        let p: ParsedSubmit;
        try {
          p = parseSubmit(await readJson(req, MAX_SUBMIT_BYTES));
        } catch (e) {
          if (e instanceof PoaHttpError) return rejectEarly("submit", e);
          throw e;
        }
        if (!ip) throw bad("no_client_ip");
        const r = await forms.submit({
          sessionId: session.sessionId, card: p.card, questionnaire: p.questionnaire, version: p.version, answers: p.answers, derived: p.derived,
          signer: p.signer, clientIp: ip, userAgent: ua || null, completion: p.completion,
        });
        log.info("forms submitted", { session: session.sessionId, questionnaire: p.questionnaire, duplicate: r.duplicate, answersStored: r.answersStored });
        return json({ submitted: true, submitted_at: r.submittedAt, answers_stored: r.answersStored, duplicate: r.duplicate });
      }

      // document: row first (the database names the path), then the bytes, then the mark. A storage failure leaves the row
      // without a path (staff see "not stored"); the client may try again.
      let doc: ParsedDocument;
      try {
        doc = parseDocument(await readJson(req, MAX_DOCUMENT_JSON_BYTES));
      } catch (e) {
        if (e instanceof PoaHttpError) return rejectEarly("document", e);
        throw e;
      }
      if (!d.storage) throw new PoaHttpError("unavailable", "storage_not_configured");
      const sha = await sha256Hex(doc.bytes);
      const added = await forms.documentAdd({ sessionId: session.sessionId, kind: doc.kind, sha256: sha, ext: doc.ext, bytes: doc.bytes.byteLength });
      try {
        await d.storage.put(added.storagePath, doc.bytes, doc.contentType);
      } catch (e) {
        log.warn("forms document not stored", { session: session.sessionId, document: added.documentId, code: e instanceof Error ? e.name : "unknown" });
        await forms.sessionFail(session.sessionId, "doc_storage").catch(() => {});
        throw new PoaHttpError("unavailable", "doc_storage");
      }
      await forms.documentStored(added.documentId, added.storagePath);
      log.info("forms document stored", { session: session.sessionId, document: added.documentId, kind: doc.kind, bytes: doc.bytes.byteLength });
      return json({ document_id: added.documentId, kind: doc.kind, stored: true });
    } catch (e) {
      return fail(e, route);
    }
  };
}
