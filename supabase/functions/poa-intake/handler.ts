// poa-intake: the backend of the POA wizard (docs/product/POA-WIZARD.md is the contract; src/lib/poa/api.ts the browser side).
// Public (verify_jwt=false): the gates are the Origin allowlist, Turnstile on /start, the session token (header
// x-poa-session; only its SHA-256 reaches the database) and the ops.config switches enforced in SQL (poa_enabled,
// poa_docs_enabled) plus the Surense switches (api.surense_gate) before any call to Surense. Everything is OFF by default.
//   POST /start        identity + consents -> api.poa_session_start -> engine.start (customer, personal link, tool session)
//   POST /maslaka|/harbit|/policies   approve one module in the tool, record the consent
//   GET  /state        status + modules + next
//   GET  /preview/:kind   the module's PDF from the tool (hash in x-poa-preview-sha256, stored in the session)
//   GET  /doc/:kind    the stored final PDF, once, within 30 minutes of completion (peek -> read the bytes -> claim; a storage
//                      miss never burns the single download; needs poa_docs_enabled only, no session lookup)
// Errors: {"error": "<kind>"} only (inactive | unavailable | generic | expired | locked | completed). Never a message,
// a value or an upstream text. /start answers the same shape and its duration is padded up to START_MIN_MS and then to a
// multiple of START_BUCKET_MS for every identity: the existing-customer check is the database's (a crm.poa_matches row)
// and the Surense duplicate path (one more upstream round trip) is absorbed by the engine, so a visitor cannot learn
// whether someone is a customer from the answer or from its timing.
// Logs: route, status, codes, ids. Never a body, a header value, a url, a token or an identity (spec section 6 row 6).
import { corsHeaders } from "../_shared/cors.ts";
import { type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import type { Logger } from "../_shared/logger.ts";
import { clientIp } from "../_shared/ip.ts";
import { requestIdFor } from "../_shared/request.ts";
import { shortHash } from "../_shared/secret.ts";
import { hostnamesFromOrigins, verifyTurnstile } from "../_shared/turnstile.ts";
import { POA_KINDS, type EngineRef, type FinalUrls, type ModuleFlags, type PoaEngine, type PoaKind } from "../_shared/poa/engine/types.ts";
import { PoaHttpError, PoaToolError, poaErrorResponse, toPoaError } from "../_shared/poa/errors.ts";
import {
  cleanEmail, cleanName, harbitDates, isValidIsraeliId, MAX_SIGNATURE_CHARS, pngBase64, todayIsrael, toE164IsraeliMobile,
} from "../_shared/poa/formatters.ts";
import { DEFAULT_START_BUCKET_MS, DEFAULT_START_MIN_MS } from "../_shared/poa/config.ts";
import { createPoaRpc, type PoaModules, type PoaRpc, type PoaSession } from "../_shared/poa/rpc.ts";
import { generateToken, hashToken, HASH_RE, sha256Hex, TOKEN_RE } from "../_shared/poa/session.ts";
import { downloadHeaders, type ObjectReader } from "../_shared/poa/storage.ts";
import { type FinalDocsDeps, storeFinalDocuments } from "../_shared/poa/finaldocs.ts";

export const MAX_START_BYTES = 8 * 1024;
export const MAX_CONSENT_BYTES = 2 * 1024;
/** a drawn signature as a PNG data URL */
export const MAX_POLICIES_BYTES = MAX_SIGNATURE_CHARS + 2 * 1024;
/** floor of the /start duration; an overrun is rounded up to a multiple of START_BUCKET_MS (both overridable: POA_START_MIN_MS / _BUCKET_MS) */
export const START_MIN_MS = DEFAULT_START_MIN_MS;
export const START_BUCKET_MS = DEFAULT_START_BUCKET_MS;
export const REJECT_LIMIT = 30;
export const REJECT_WINDOW_SEC = 600;
export const PREVIEW_LIMIT = 20;
export const PREVIEW_WINDOW_SEC = 600;

const START_KEYS = ["first_name", "last_name", "national_id", "phone", "email", "terms_privacy_approved", "marketing_approved", "turnstile_token"];
const CONSENT_KEYS: Record<PoaKind, string[]> = {
  maslaka: ["preview_sha256"],
  harbit: ["preview_sha256", "birth_date", "issue_date"],
  policies: ["preview_sha256", "signature_png"],
};
const METHOD: Record<PoaKind, "check" | "signature"> = { maslaka: "check", harbit: "check", policies: "signature" };
const SECURITY_HEADERS = { "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" };

export interface PoaIntakeDeps {
  env: Env;
  /** service RPC client; null when the function is not configured */
  rpc: Rpc | null;
  log: Logger;
  /** null while Surense is not configured: every route that needs the tool answers `unavailable` */
  engine: PoaEngine | null;
  /** final documents; null when storage is not configured */
  storage: ObjectReader | null;
  /** fetch + store the three final documents right after the policies step; null/absent = skipped (the webhook path stays) */
  finalDocs?: FinalDocsDeps | null;
  fetch?: FetchFn;
  now?: () => number;
  /** pause used to pad /start (tests inject a spy) */
  wait?: (ms: number) => Promise<void>;
  startMinMs?: number;
  startBucketMs?: number;
}

/** per-isolate, best effort: an address that keeps failing origin / shape / Turnstile is cut off before any DB call */
export interface Counter {
  hit(key: string): number;
  count(key: string): number;
}
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

export function poaCors(origin: string | null, allowed: string[]): Record<string, string> {
  const h = corsHeaders(origin, allowed);
  h["Access-Control-Allow-Headers"] += ", x-poa-session";
  h["Access-Control-Expose-Headers"] += ", x-poa-preview-sha256, content-disposition";
  return h;
}

type Route =
  | { name: "start" }
  | { name: "state" }
  | { name: "consent" | "preview" | "doc"; kind: PoaKind };

/** "/functions/v1/poa-intake/preview/maslaka" -> {name:"preview", kind:"maslaka"}; null when not a route */
export function parseRoute(method: string, pathname: string): Route | "method" | null {
  const segs = pathname.split("/").filter(Boolean);
  const i = segs.indexOf("poa-intake");
  const rest = i >= 0 ? segs.slice(i + 1) : segs;
  const isKind = (s: string | undefined): s is PoaKind => (POA_KINDS as readonly string[]).includes(s ?? "");
  if (rest.length === 1 && rest[0] === "start") return method === "POST" ? { name: "start" } : "method";
  if (rest.length === 1 && rest[0] === "state") return method === "GET" ? { name: "state" } : "method";
  if (rest.length === 1 && isKind(rest[0])) return method === "POST" ? { name: "consent", kind: rest[0] } : "method";
  if (rest.length === 2 && (rest[0] === "preview" || rest[0] === "doc") && isKind(rest[1])) {
    return method === "GET" ? { name: rest[0], kind: rest[1] } : "method";
  }
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
  identity: { firstName: string; lastName: string; nationalId: string; phone: string; email: string | null; marketingApproved: boolean };
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
  if (typeof b.marketing_approved !== "boolean") throw bad("invalid_marketing");
  const t = b.turnstile_token;
  if (t !== undefined && t !== null && (typeof t !== "string" || t.length > 2048)) throw bad("invalid_turnstile_token");
  return {
    identity: { firstName, lastName, nationalId: nid, phone, email, marketingApproved: b.marketing_approved },
    turnstileToken: typeof t === "string" && t ? t : null,
  };
}

function modulesView(m: PoaModules) {
  return {
    maslaka: { enabled: m.maslaka.enabled, required: m.maslaka.required, performed: m.maslaka.performed },
    harbit: { enabled: m.harbit.enabled, required: m.harbit.required, performed: m.harbit.performed },
    policies: { enabled: m.policies.enabled, required: m.policies.required, performed: m.policies.performed },
  };
}

export function createPoaHandler(d: PoaIntakeDeps): (req: Request) => Promise<Response> {
  const now = d.now ?? Date.now;
  const wait = d.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const startMinMs = d.startMinMs ?? START_MIN_MS;
  const startBucketMs = Math.max(1, d.startBucketMs ?? START_BUCKET_MS);
  const turnstileHosts = hostnamesFromOrigins(d.env.allowedOrigins);
  const rejects = createCounter(now);
  const previews = createCounter(now, PREVIEW_WINDOW_SEC);
  const poa: PoaRpc | null = d.rpc ? createPoaRpc(d.rpc) : null;

  return async (req) => {
    const rid = requestIdFor(req);
    const origin = req.headers.get("origin");
    const cors = poaCors(origin, d.env.allowedOrigins);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const log = d.log.child({ requestId: rid });
    const ip = clientIp(req.headers);
    const ipTag = ip ? await shortHash(ip) : "none";

    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": rid, ...SECURITY_HEADERS, ...cors } });

    // the only place an error becomes a response; logs the code, never a value
    const fail = (e: unknown, route: string): Response => {
      const err = toPoaError(e);
      if (!(e instanceof PoaHttpError) || err.status >= 500) log.warn("poa request failed", { route, kind: err.kind, code: err.code, status: err.status });
      else log.info("poa request refused", { route, kind: err.kind, code: err.code, status: err.status });
      return poaErrorResponse(err, rid, cors);
    };
    const rejectEarly = (route: string, err: PoaHttpError): Response => {
      const n = rejects.hit(ipTag);
      log.warn("poa rejected", { route, code: err.code, ip: ipTag, rejects: n });
      return poaErrorResponse(err, rid, cors);
    };

    // a well-formed token the database does not know counts like any other refusal: an address rotating random tokens is cut off
    const unknownToken = (e: unknown, route: string): Response | null =>
      e instanceof RpcError && e.status === 401 ? rejectEarly(route, toPoaError(e)) : null;

    const url = new URL(req.url);
    const route = parseRoute(req.method, url.pathname);
    if (route === null) return poaErrorResponse(bad("no_route", 404), rid, cors);
    if (route === "method") return poaErrorResponse(bad("method_not_allowed", 405), rid, cors);
    const rname = route.name;

    try {
      if (!origin || !d.env.allowedOrigins.includes(origin)) return rejectEarly(rname, bad("origin", 403));
      if (rejects.count(ipTag) >= REJECT_LIMIT) {
        return poaErrorResponse(new PoaHttpError("locked", "rate_limited_memory", { status: 429, headers: { "retry-after": "600" } }), rid, cors);
      }
      if (!poa || !d.rpc) {
        log.error("poa not configured", { missing: "SUPABASE_URL or secret key" });
        throw new PoaHttpError("unavailable", "not_configured");
      }
      const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

      // ------------------------------------------------------------------ /start
      if (route.name === "start") {
        let parsed: ParsedStart;
        try {
          parsed = parseStart(await readJson(req, MAX_START_BYTES));
        } catch (e) {
          if (e instanceof PoaHttpError) return rejectEarly("start", e);
          throw e;
        }
        // optional switch snapshot: without api.poa_config the SQL kill switches (PT423) and Turnstile-required apply
        const cfg = await poa.config();
        if (cfg && !cfg.poaEnabled) throw new PoaHttpError("inactive", "switch_off", { status: 503 });
        if (cfg && cfg.engine !== "surense") throw new PoaHttpError("unavailable", "engine_not_available");
        const engine = d.engine;
        if (!engine) throw new PoaHttpError("unavailable", "engine_not_configured");

        // a request that will be refused anyway must not spend the visitor's single-use Turnstile token
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
        // everything from here is padded: at least startMinMs, and an overrun is rounded up to the next bucket, so the
        // answer takes the same time for every identity (the duplicate-customer path costs one more upstream call)
        const t0 = now();
        const pad = async () => {
          const elapsed = now() - t0;
          const target = Math.max(startMinMs, Math.ceil(elapsed / startBucketMs) * startBucketMs);
          if (target - elapsed > 0) await wait(target - elapsed);
        };
        try {
          const token = generateToken();
          const tokenHash = await hashToken(token);
          const started = await poa.sessionStart({
            tokenHash,
            uaHash: ua ? await sha256Hex(ua) : null,
            firstName: parsed.identity.firstName,
            lastName: parsed.identity.lastName,
            email: parsed.identity.email,
            nationalId: parsed.identity.nationalId,
            phone: parsed.identity.phone,
            marketing: parsed.identity.marketingApproved,
            clientIp: ip,
          });
          if (!cfg) {
            // no switch snapshot: the session row says which engine the owner chose
            const fresh = await poa.sessionGet(tokenHash);
            if (fresh.engine !== "surense") {
              await poa.sessionFail(started.sessionId, "engine_not_available").catch(() => {});
              throw new PoaHttpError("unavailable", "engine_not_available");
            }
          }
          const flags = {} as ModuleFlags;
          for (const k of POA_KINDS) flags[k] = started.modules[k].enabled;
          try {
            await d.rpc.call("surense_gate", { p_write: true, p_action: "invite-proxies" });
          } catch (e) {
            if (e instanceof RpcError && e.status === 423) throw new PoaHttpError("unavailable", "surense_switch_off");
            throw e;
          }
          let ref: EngineRef;
          try {
            ref = await engine.start(parsed.identity, flags);
          } catch (e) {
            await poa.sessionFail(started.sessionId, toPoaError(e).code).catch(() => {});
            throw e;
          }
          // a customer known to the database OR to Surense blocks the automatic launch (staff confirm the match first)
          await poa.engineRefSet(started.sessionId, { ...ref, existing: ref.existing || started.existingCustomer });
          log.info("poa started", { session: started.sessionId });
          await pad();
          return json({ session_token: token, expires_at: started.expiresAt, modules: modulesView(started.modules), next: started.next });
        } catch (e) {
          await pad();
          throw e;
        }
      }

      // ------------------------------------------------------------------ session routes
      const token = req.headers.get("x-poa-session") ?? "";
      if (!TOKEN_RE.test(token)) return rejectEarly(rname, new PoaHttpError("inactive", "no_session"));
      const tokenHash = await hashToken(token);

      if (route.name === "doc") {
        // the download has its own switch (poa_docs_enabled) and no session lookup: closing new sessions (or the daily cap
        // tripping poa_enabled) must not take the download away from someone who just finished. peek -> read -> claim.
        const kind = route.kind;
        if (!d.storage) throw new PoaHttpError("unavailable", "storage_not_configured");
        let doc: { storagePath: string; sha256: string | null };
        try {
          doc = await poa.docGet(tokenHash, kind); // switch, module, completion window and "not yet downloaded" are the database's
        } catch (e) {
          const r = unknownToken(e, rname);
          if (r) return r;
          throw e;
        }
        const bytes = await d.storage.get(doc.storagePath);
        if (!bytes) throw new PoaHttpError("unavailable", "doc_missing", { status: 404 });
        if (doc.sha256 && (await sha256Hex(bytes)) !== doc.sha256) throw new PoaHttpError("generic", "doc_hash_mismatch", { status: 500 });
        await poa.docClaim(tokenHash, kind); // the single use is spent only now that the bytes are in hand and verified
        log.info("poa doc served", { kind });
        return new Response(bytes, { status: 200, headers: { ...cors, ...downloadHeaders(rid, `poa-${kind}.pdf`) } });
      }

      let session: PoaSession;
      try {
        session = await poa.sessionGet(tokenHash);
      } catch (e) {
        const r = unknownToken(e, rname);
        if (r) return r;
        throw e;
      }
      log.debug("poa session", { session: session.sessionId, route: rname });
      const open = () => {
        if (session.status === "expired") throw new PoaHttpError("expired", "session_expired");
        if (session.status === "locked") throw new PoaHttpError("locked", "session_locked");
        if (session.status === "completed") throw new PoaHttpError("completed", "session_completed");
      };

      if (route.name === "state") {
        return json({ status: session.status, expires_at: session.expiresAt, modules: modulesView(session.modules), next: session.next });
      }

      // a module already performed: answering the consent again is a replay of the recorded approval (the first answer may have
      // been lost on its way to the browser), also once the session is completed. Nothing reaches the tool, nothing is launched.
      const kind = route.kind;
      const replay = route.name === "consent" && session.modules[kind].performed && (session.status === "open" || session.status === "completed");

      // preview and consent talk to the tool: the session must be open and the module enabled
      if (!replay) open();
      if (!session.modules[kind].enabled) throw bad("module_disabled");
      if (replay) {
        let body: Record<string, unknown>;
        try {
          body = await readJson(req, kind === "policies" ? MAX_POLICIES_BYTES : MAX_CONSENT_BYTES);
          onlyKeys(body, CONSENT_KEYS[kind]);
        } catch (e) {
          if (e instanceof PoaHttpError) return rejectEarly(rname, e);
          throw e;
        }
        const rsha = body.preview_sha256;
        if (typeof rsha !== "string" || !HASH_RE.test(rsha)) throw bad("invalid_preview_sha256");
        if (session.previewSha256[kind] !== rsha) throw bad("preview_mismatch");
        if (!ip) throw bad("no_client_ip");
        const again = await poa.consentRecord({ sessionId: session.sessionId, kind, previewSha256: rsha, birthDate: null, issueDate: null, signature: null, clientIp: ip, userAgent: ua, replay: true });
        log.info("poa consent replay", { session: session.sessionId, kind });
        return json({ kind, method: METHOD[kind], approved_at: again.approvedAt, valid_until: again.validUntil, modules: modulesView(again.modules), next: again.next });
      }

      const engine = d.engine;
      if (!engine || session.engine !== "surense") throw new PoaHttpError("unavailable", "engine_not_available");
      const ref = session.engineRef;
      if (!ref) throw new PoaHttpError("unavailable", "no_engine_ref");

      if (route.name === "preview") {
        if (previews.hit(tokenHash.slice(0, 16)) > PREVIEW_LIMIT) {
          throw new PoaHttpError("locked", "preview_rate_limited", { status: 429, headers: { "retry-after": "60" } });
        }
        let bytes: Uint8Array;
        try {
          bytes = await engine.preview(ref, kind);
        } catch (e) {
          await poa.sessionFail(session.sessionId, toPoaError(e).code).catch(() => {});
          throw e;
        }
        const sha = await sha256Hex(bytes);
        await poa.previewSet(session.sessionId, kind, sha);
        return new Response(bytes, {
          status: 200,
          headers: { ...cors, ...SECURITY_HEADERS, "content-type": "application/pdf", "content-disposition": "inline", "x-poa-preview-sha256": sha, "x-request-id": rid },
        });
      }

      // consent
      let body: Record<string, unknown>;
      try {
        body = await readJson(req, kind === "policies" ? MAX_POLICIES_BYTES : MAX_CONSENT_BYTES);
        onlyKeys(body, CONSENT_KEYS[kind]);
      } catch (e) {
        if (e instanceof PoaHttpError) return rejectEarly(rname, e);
        throw e;
      }
      const sha = body.preview_sha256;
      if (typeof sha !== "string" || !HASH_RE.test(sha)) throw bad("invalid_preview_sha256");
      if (session.previewSha256[kind] !== sha) throw bad("preview_mismatch");
      let birth: string | null = null;
      let issue: string | null = null;
      let signature: string | null = null;
      if (kind === "harbit") {
        // the same rule as api.poa_consent_record (issue strictly after birth; today = Israel today): the database must never
        // refuse what the tool already accepted
        const hd = harbitDates(body.birth_date, body.issue_date, now());
        if ("error" in hd) throw bad(hd.error);
        birth = hd.birth;
        issue = hd.issue;
      }
      if (kind === "policies") {
        if (!pngBase64(body.signature_png)) throw bad("invalid_signature");
        signature = body.signature_png as string;
      }
      if (!ip) throw bad("no_client_ip");

      let finalUrls: FinalUrls = {};
      try {
        finalUrls = (await engine.consent(ref, kind, { birthDate: birth ?? undefined, issueDate: issue ?? undefined, signaturePng: signature ?? undefined })) ?? {};
      } catch (e) {
        if (e instanceof PoaToolError && e.kind === "completed") {
          // the module is open in OUR session but the tool already holds the approval (an earlier attempt reached it and our
          // record failed): fall through and record it now
          log.info("poa consent: the tool already holds the approval", { session: session.sessionId, kind });
        } else {
          await poa.sessionFail(session.sessionId, toPoaError(e).code).catch(() => {});
          throw e;
        }
      }
      let rec: Awaited<ReturnType<PoaRpc["consentRecord"]>>;
      try {
        rec = await poa.consentRecord({ sessionId: session.sessionId, kind, previewSha256: sha, birthDate: birth, issueDate: issue, signature, clientIp: ip, userAgent: ua });
      } catch (e) {
        // the tool has the approval, our record does not: leave a code on the session (staff and the retry see it)
        await poa.sessionFail(session.sessionId, `consent_record_${e instanceof RpcError ? e.code : "unknown"}`).catch(() => {});
        throw e;
      }
      log.info("poa consent", { session: session.sessionId, kind, next: rec.next });

      if (rec.next === "done") {
        await poa.sessionComplete(session.sessionId).catch((e) => log.warn("poa complete failed", { code: e instanceof RpcError ? e.code : "unknown" }));
        // launch ("הזנקה"): a customer that already existed waits for staff to confirm the match; a closed Surense
        // switch (423) simply means nothing is queued
        if (!ref.existing) {
          try {
            await poa.enqueueLaunch(ref.customerId, todayIsrael(now()));
            log.info("poa launch queued", { session: session.sessionId });
          } catch (e) {
            log.warn("poa launch not queued", { code: e instanceof RpcError ? e.code : "unknown", status: e instanceof RpcError ? e.status : 0 });
            // leave a trace staff can see (engine_last_error on the completed session, listed by staff.poa_session_list)
            await poa.sessionFail(session.sessionId, `launch_${e instanceof RpcError ? e.status : "unknown"}`).catch(() => {});
          }
        }
      }
      // the tool's policies answer carries pre-signed links to the three final documents: store them now. Nothing in this step
      // may fail the consent response (the webhook path stays the fallback); a failure leaves a docs_* code on the session.
      if (kind === "policies" && d.finalDocs && Object.keys(finalUrls).length > 0) {
        try {
          const stored = await storeFinalDocuments(d.finalDocs, poa, session.sessionId, finalUrls);
          const first = Object.values(stored.failed)[0];
          if (first) await poa.sessionFail(session.sessionId, first).catch(() => {});
          log.info("poa final docs", { session: session.sessionId, stored: stored.stored.length, failed: Object.keys(stored.failed).length });
        } catch (e) {
          log.warn("poa final docs failed", { code: e instanceof RpcError ? e.code : "unknown" });
          await poa.sessionFail(session.sessionId, "docs_error").catch(() => {});
        }
      }
      return json({
        kind,
        method: METHOD[kind],
        approved_at: rec.approvedAt,
        valid_until: rec.validUntil,
        modules: modulesView(rec.modules),
        next: rec.next,
      });
    } catch (e) {
      return fail(e, rname);
    }
  };
}
