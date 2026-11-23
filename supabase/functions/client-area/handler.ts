// client-area: the backend of the personal client area (docs/product/CLIENT-AREA.md is the contract).
// Public (verify_jwt=false): the gates are the Origin allowlist, Turnstile on /login/start (when the switch says so),
// the one-time code to the mobile we hold (Micropay), the session token (Authorization: Bearer; only its SHA-256 reaches
// the database) and the ops.config switch client_area_enabled enforced in SQL. Everything is OFF by default.
//   POST /login/start        {national_id, phone, turnstile_token?} -> {challenge_id, phone_tail, expires_in_sec}, the same
//                            answer and the same padded duration whether or not the details matched a customer
//   POST /login/verify       {challenge_id, code} -> {token, expires_at, client}
//   GET  /me                 the client, the data date, a summary of the portfolio
//   GET  /portfolio          categories with shaped products (labels, masked policy numbers)
//   GET  /documents          the client's documents (POA files; Surense metadata)
//   GET  /documents/:id      {url}: a signed download link (5 minutes) for one POA file of this client
//   POST /logout
// Errors: {"error": {"code": "<code>", ...}} with codes inactive | unauthenticated | wrong_code (+tries_left) | max_tries |
// expired | generic | rate_limited | unavailable. Never a message, a value or an upstream text.
// Logs: route, status, codes, ids. Never a body, a phone, a national id, a code, a token or a url.
import { corsHeaders } from "../_shared/cors.ts";
import { type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import type { Logger } from "../_shared/logger.ts";
import { clientIp } from "../_shared/ip.ts";
import { requestIdFor } from "../_shared/request.ts";
import { shortHash } from "../_shared/secret.ts";
import { hostnamesFromOrigins, verifyTurnstile } from "../_shared/turnstile.ts";
import { isValidIsraeliId } from "../_shared/poa/formatters.ts";
import { generateToken, hashToken, sha256Hex, TOKEN_RE } from "../_shared/poa/session.ts";
import type { ObjectSigner } from "../_shared/poa/storage.ts";
import { normalizeIsraeliPhone, otpSend, otpVerify } from "../_shared/sms/micropay.ts";
import { type MirrorProduct, POA_DOC_TITLE, shapePortfolio, summarize } from "../_shared/client/portfolio.ts";

export const MAX_BODY_BYTES = 4 * 1024;
export const REJECT_LIMIT = 30;
export const REJECT_WINDOW_SEC = 600;
/** floor of the /login/start and /login/verify durations (ms): a hit and a miss take the same time */
export const LOGIN_MIN_MS = 1500;
export const LOGIN_BUCKET_MS = 500;
export const OTP = { codeLength: 6, validMinutes: 10, maxSends: 2, maxTries: 5, clearCodes: "send" as const, lang: "he" as const, webOtpDomain: "seeld.co.il" };
export const SIGNED_URL_SEC = 300;

const START_KEYS = ["national_id", "phone", "turnstile_token"];
const VERIFY_KEYS = ["challenge_id", "code"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECURITY_HEADERS = { "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" };

export type ClientErrorCode = "inactive" | "unauthenticated" | "wrong_code" | "max_tries" | "expired" | "generic" | "rate_limited" | "unavailable" | "not_found";
const STATUS: Record<ClientErrorCode, number> = {
  inactive: 503, unauthenticated: 401, wrong_code: 400, max_tries: 400, expired: 400, generic: 400, rate_limited: 429, unavailable: 503, not_found: 404,
};

/** An error already shaped for the browser: a code (and a few safe extras), never a message. */
export class ClientHttpError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number;
  /** short machine detail for logs (never a value) */
  readonly detail: string;
  readonly extra?: Record<string, number | string>;
  readonly headers?: Record<string, string>;
  constructor(code: ClientErrorCode, detail: string, opts: { status?: number; extra?: Record<string, number | string>; headers?: Record<string, string> } = {}) {
    super(detail);
    this.name = "ClientHttpError";
    this.code = code;
    this.status = opts.status ?? STATUS[code];
    this.detail = detail;
    this.extra = opts.extra;
    this.headers = opts.headers;
  }
}

/** Any thrown value -> ClientHttpError (the single place that decides what the browser sees). */
export function toClientError(e: unknown): ClientHttpError {
  if (e instanceof ClientHttpError) return e;
  if (e instanceof RpcError) {
    const detail = `db_${e.code}`;
    switch (e.status) {
      case 400: return new ClientHttpError("generic", detail);
      case 401: return new ClientHttpError("unauthenticated", detail);
      case 404: return new ClientHttpError("not_found", detail);
      case 410: return new ClientHttpError("expired", detail);
      case 423: return new ClientHttpError("inactive", detail);
      case 429: return new ClientHttpError("rate_limited", detail, { headers: { "retry-after": "600" } });
      default: return new ClientHttpError("unavailable", detail);
    }
  }
  return new ClientHttpError("generic", "internal", { status: 500 });
}

export function clientErrorResponse(err: ClientHttpError, requestId: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: { code: err.code, ...(err.extra ?? {}) } }), {
    status: err.status,
    headers: { "content-type": "application/json", "x-request-id": requestId, ...SECURITY_HEADERS, ...extra, ...(err.headers ?? {}) },
  });
}

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

export interface ClientAreaDeps {
  env: Env;
  /** service RPC client; null when the function is not configured */
  rpc: Rpc | null;
  log: Logger;
  /** signed links for the client's own POA files; null = /documents/:id answers unavailable */
  signer: ObjectSigner | null;
  fetch?: FetchFn;
  now?: () => number;
  /** pause used to pad the login routes (tests inject a spy) */
  wait?: (ms: number) => Promise<void>;
  loginMinMs?: number;
  loginBucketMs?: number;
}

type Route =
  | { name: "login_start" | "login_verify" | "me" | "portfolio" | "documents" | "logout" }
  | { name: "document"; id: string };

/** "/functions/v1/client-area/documents/<uuid>" -> {name:"document", id}; null when not a route */
export function parseRoute(method: string, pathname: string): Route | "method" | null {
  const segs = pathname.split("/").filter(Boolean);
  const i = segs.indexOf("client-area");
  const rest = i >= 0 ? segs.slice(i + 1) : segs;
  const want = (m: string, r: Route): Route | "method" => (method === m ? r : "method");
  if (rest.length === 2 && rest[0] === "login" && rest[1] === "start") return want("POST", { name: "login_start" });
  if (rest.length === 2 && rest[0] === "login" && rest[1] === "verify") return want("POST", { name: "login_verify" });
  if (rest.length === 1 && rest[0] === "me") return want("GET", { name: "me" });
  if (rest.length === 1 && rest[0] === "portfolio") return want("GET", { name: "portfolio" });
  if (rest.length === 1 && rest[0] === "documents") return want("GET", { name: "documents" });
  if (rest.length === 2 && rest[0] === "documents" && UUID.test(rest[1])) return want("GET", { name: "document", id: rest[1].toLowerCase() });
  if (rest.length === 1 && rest[0] === "logout") return want("POST", { name: "logout" });
  return null;
}

const bad = (detail: string, status = 400) => new ClientHttpError("generic", detail, { status });
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

export interface ParsedStart { nationalId: string; phone: string; turnstileToken: string | null }

/** pure: /login/start body -> validated values (national id with its check digit, local mobile digits) */
export function parseStart(b: Record<string, unknown>): ParsedStart {
  onlyKeys(b, START_KEYS);
  const nid = typeof b.national_id === "string" ? b.national_id.replace(/[\s-]/g, "") : "";
  if (!isValidIsraeliId(nid)) throw bad("invalid_national_id");
  const phone = normalizeIsraeliPhone(b.phone);
  if (!phone || !/^05\d{8}$/.test(phone)) throw bad("invalid_phone");
  const t = b.turnstile_token;
  if (t !== undefined && t !== null && (typeof t !== "string" || t.length > 2048)) throw bad("invalid_turnstile_token");
  return { nationalId: nid, phone, turnstileToken: typeof t === "string" && t ? t : null };
}

export interface ParsedVerify { challengeId: string; code: string }

export function parseVerify(b: Record<string, unknown>): ParsedVerify {
  onlyKeys(b, VERIFY_KEYS);
  const id = typeof b.challenge_id === "string" ? b.challenge_id.trim().toLowerCase() : "";
  if (!UUID.test(id)) throw bad("invalid_challenge_id");
  const code = typeof b.code === "string" ? b.code.replace(/\s/g, "") : "";
  if (!/^\d{4,8}$/.test(code)) throw bad("invalid_code");
  return { challengeId: id, code };
}

const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const bytea = (hex: string) => `\\x${hex}`;

export function createClientAreaHandler(d: ClientAreaDeps): (req: Request) => Promise<Response> {
  const now = d.now ?? Date.now;
  const wait = d.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const minMs = d.loginMinMs ?? LOGIN_MIN_MS;
  const bucketMs = Math.max(1, d.loginBucketMs ?? LOGIN_BUCKET_MS);
  const turnstileHosts = hostnamesFromOrigins(d.env.allowedOrigins);
  const rejects = createCounter(now);

  return async (req) => {
    const rid = requestIdFor(req);
    const origin = req.headers.get("origin");
    const cors = corsHeaders(origin, d.env.allowedOrigins);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const log = d.log.child({ requestId: rid });
    const ip = clientIp(req.headers);
    const ipTag = ip ? await shortHash(ip) : "none";

    const json = (body: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": rid, ...SECURITY_HEADERS, ...cors } });

    const fail = (e: unknown, route: string): Response => {
      const err = toClientError(e);
      if (!(e instanceof ClientHttpError) || err.status >= 500) log.warn("client-area request failed", { route, code: err.code, detail: err.detail, status: err.status });
      else log.info("client-area request refused", { route, code: err.code, detail: err.detail, status: err.status });
      return clientErrorResponse(err, rid, cors);
    };
    const rejectEarly = (route: string, err: ClientHttpError): Response => {
      const n = rejects.hit(ipTag);
      log.warn("client-area rejected", { route, detail: err.detail, ip: ipTag, rejects: n });
      return clientErrorResponse(err, rid, cors);
    };

    const url = new URL(req.url);
    const route = parseRoute(req.method, url.pathname);
    if (route === null) return clientErrorResponse(bad("no_route", 404), rid, cors);
    if (route === "method") return clientErrorResponse(bad("method_not_allowed", 405), rid, cors);
    const rname = route.name;

    try {
      if (!origin || !d.env.allowedOrigins.includes(origin)) return rejectEarly(rname, bad("origin", 403));
      if (rejects.count(ipTag) >= REJECT_LIMIT) {
        return clientErrorResponse(new ClientHttpError("rate_limited", "rate_limited_memory", { headers: { "retry-after": "600" } }), rid, cors);
      }
      if (!d.rpc) {
        log.error("client-area not configured", { missing: "SUPABASE_URL or secret key" });
        throw new ClientHttpError("unavailable", "not_configured");
      }
      const rpc = d.rpc;
      const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

      // everything inside a login route is padded: at least minMs, and an overrun is rounded up to the next bucket, so a
      // hit (one SMS call) and a miss (nothing sent) answer in the same time
      const padded = async <T>(fn: () => Promise<T>): Promise<T> => {
        const t0 = now();
        const pad = async () => {
          const elapsed = now() - t0;
          const target = Math.max(minMs, Math.ceil(elapsed / bucketMs) * bucketMs);
          if (target - elapsed > 0) await wait(target - elapsed);
        };
        try {
          const r = await fn();
          await pad();
          return r;
        } catch (e) {
          await pad();
          throw e;
        }
      };

      // ------------------------------------------------------------------ /login/start
      if (route.name === "login_start") {
        let parsed: ParsedStart;
        try {
          parsed = parseStart(await readJson(req, MAX_BODY_BYTES));
        } catch (e) {
          if (e instanceof ClientHttpError) return rejectEarly(rname, e);
          throw e;
        }
        if (!ip) {
          log.warn("no client ip header");
          return rejectEarly(rname, bad("no_client_ip"));
        }
        const cfg = (await rpc.call<{ enabled?: unknown; turnstile_required?: unknown } | null>("client_area_config")) ?? null;
        if (cfg && cfg.enabled !== true) throw new ClientHttpError("inactive", "switch_off");
        if (!cfg || cfg.turnstile_required !== false) {
          const ts = await verifyTurnstile(parsed.turnstileToken, ip, { secret: d.env.turnstileSecret, production: d.env.stage === "production", hostnames: turnstileHosts, fetch: d.fetch });
          if (!ts.ok) {
            if (ts.reason === "not_configured" || ts.reason === "unavailable") {
              log.error("turnstile unavailable", { reason: ts.reason });
              throw new ClientHttpError("unavailable", `turnstile_${ts.reason}`);
            }
            return rejectEarly(rname, bad(`turnstile_${ts.reason}`));
          }
        }
        if (!d.env.smsApiToken) throw new ClientHttpError("unavailable", "sms_not_configured");
        const smsToken = d.env.smsApiToken;
        return await padded(async () => {
          const r = await rpc.call<Record<string, unknown>>("client_login_start", {
            p_national_id: parsed.nationalId, p_phone: parsed.phone, p_ip: ip, p_ua_hash: ua ? bytea(await sha256Hex(ua)) : null,
          });
          const challengeId = str(r?.challenge_id);
          const tail = str(r?.phone_tail) ?? parsed.phone.slice(-2);
          if (!challengeId) throw new ClientHttpError("unavailable", "db_bad_shape");
          const phone = r?.matched === true ? str(r?.phone) : null;
          if (phone) {
            const sent = await otpSend({ token: smsToken, fetch: d.fetch }, { phone, type: "sms", ...OTP, sender: d.env.smsSenderId });
            if (!sent.ok) {
              // the quota of the validity window is the client's own earlier requests: the answer stays the same (anti-enumeration)
              if (sent.code === "max_sent") log.info("otp quota reached", { challenge: challengeId });
              else {
                log.error("otp send failed", { challenge: challengeId, code: sent.code, status: sent.status });
                throw new ClientHttpError("unavailable", `sms_${sent.code}`);
              }
            } else log.info("otp sent", { challenge: challengeId, channel: sent.data.channel });
          } else log.info("login start without a match", { challenge: challengeId });
          return json({ challenge_id: challengeId, phone_tail: tail, expires_in_sec: typeof r?.expires_in_sec === "number" ? r.expires_in_sec : 600 });
        });
      }

      // ------------------------------------------------------------------ /login/verify
      if (route.name === "login_verify") {
        let parsed: ParsedVerify;
        try {
          parsed = parseVerify(await readJson(req, MAX_BODY_BYTES));
        } catch (e) {
          if (e instanceof ClientHttpError) return rejectEarly(rname, e);
          throw e;
        }
        if (!ip) return rejectEarly(rname, bad("no_client_ip"));
        if (!d.env.smsApiToken) throw new ClientHttpError("unavailable", "sms_not_configured");
        const smsToken = d.env.smsApiToken;
        return await padded(async () => {
          const use = await rpc.call<Record<string, unknown>>("client_login_challenge_use", { p_challenge: parsed.challengeId });
          if (use?.status === "failed") throw new ClientHttpError("max_tries", "challenge_locked");
          const phone = use?.matched === true ? str(use?.phone) : null;
          if (!phone) {
            // no customer behind this challenge: a wrong code, as far as the visitor can tell
            const left = typeof use?.attempts === "number" ? Math.max(0, 10 - use.attempts) : undefined;
            throw new ClientHttpError("wrong_code", "no_match", { extra: left === undefined ? undefined : { tries_left: left } });
          }
          const v = await otpVerify({ token: smsToken, fetch: d.fetch }, { phone, code: parsed.code });
          if (!v.ok) {
            if (v.code === "wrong_code") throw new ClientHttpError("wrong_code", "provider_wrong_code", { extra: v.triesLeft === undefined ? undefined : { tries_left: v.triesLeft } });
            if (v.code === "max_tries") throw new ClientHttpError("max_tries", "provider_max_tries");
            log.error("otp verify failed", { challenge: parsed.challengeId, code: v.code, status: v.status });
            throw new ClientHttpError("unavailable", `sms_${v.code}`);
          }
          const token = generateToken();
          const tokenHash = await hashToken(token);
          const s = await rpc.call<Record<string, unknown>>("client_login_verify", {
            p_challenge: parsed.challengeId, p_token_hash: bytea(tokenHash), p_ip: ip, p_user_agent: ua || null,
          });
          const expiresAt = str(s?.expires_at);
          const client = isObj(s?.client) ? s.client : {};
          if (!expiresAt) throw new ClientHttpError("unavailable", "db_bad_shape");
          log.info("client signed in", { session: str(s?.session_id) });
          return json({ token, expires_at: expiresAt, client: { first_name: str(client.first_name) ?? "", last_name: str(client.last_name) ?? "" } });
        });
      }

      // ------------------------------------------------------------------ session routes
      const m = /^Bearer\s+([A-Za-z0-9_-]{32,128})$/i.exec(req.headers.get("authorization") ?? "");
      if (!m || !TOKEN_RE.test(m[1])) return rejectEarly(rname, new ClientHttpError("unauthenticated", "no_token"));
      const tokenHash = bytea(await hashToken(m[1]));
      const unknownToken = (e: unknown): Response | null => (e instanceof RpcError && e.status === 401 ? rejectEarly(rname, toClientError(e)) : null);

      if (route.name === "logout") {
        try {
          await rpc.call("client_logout", { p_token_hash: tokenHash });
        } catch (e) {
          const r = unknownToken(e);
          if (r) return r;
          throw e;
        }
        return json(null, 204);
      }

      let session: Record<string, unknown>;
      try {
        session = (await rpc.call<Record<string, unknown>>("client_session_get", { p_token_hash: tokenHash })) ?? {};
      } catch (e) {
        const r = unknownToken(e);
        if (r) return r;
        throw e;
      }
      const client = isObj(session.client) ? session.client : {};
      const clientView = { first_name: str(client.first_name) ?? "", last_name: str(client.last_name) ?? "", agency_name: str(client.agency_name) ?? "" };
      const expiresAt = str(session.expires_at);
      log.debug("client session", { session: str(session.session_id), route: rname });

      const portfolio = async () => {
        const p = (await rpc.call<Record<string, unknown>>("client_portfolio_get", { p_token_hash: tokenHash })) ?? {};
        const rows = Array.isArray(p.products) ? (p.products as unknown[]) : [];
        const products: MirrorProduct[] = rows.filter(isObj).map((x) => ({
          id: str(x.id) ?? "",
          source: str(x.source),
          company_id: typeof x.company_id === "number" ? x.company_id : null,
          product_type: typeof x.product_type === "number" ? x.product_type : null,
          modified_at: str(x.modified_at),
          details: isObj(x.details) ? x.details : {},
        })).filter((x) => UUID.test(x.id));
        return { asOf: str(p.as_of), categories: shapePortfolio(products) };
      };

      if (route.name === "me") {
        const pf = await portfolio();
        return json({ client: clientView, data_as_of: pf.asOf, summary: summarize(pf.categories), session: { expires_at: expiresAt } });
      }
      if (route.name === "portfolio") {
        const pf = await portfolio();
        return json({ as_of: pf.asOf, categories: pf.categories });
      }
      if (route.name === "documents") {
        const dl = (await rpc.call<Record<string, unknown>>("client_documents_list", { p_token_hash: tokenHash })) ?? {};
        const poa = (Array.isArray(dl.poa) ? (dl.poa as unknown[]) : []).filter(isObj).map((x) => ({
          id: str(x.id) ?? "", title: POA_DOC_TITLE[str(x.kind) ?? ""] ?? "ייפוי כוח", kind: str(x.kind) ?? "poa",
          created_at: str(x.created_at), size_bytes: null, downloadable: x.downloadable === true,
        }));
        const sur = (Array.isArray(dl.surense) ? (dl.surense as unknown[]) : []).filter(isObj).map((x) => ({
          id: str(x.id) ?? "", title: str(x.name) ?? "מסמך", kind: "surense",
          created_at: str(x.created_at), size_bytes: typeof x.size_bytes === "number" ? x.size_bytes : null, downloadable: false,
        }));
        return json({ documents: [...poa, ...sur].filter((x) => UUID.test(x.id)) });
      }
      if (route.name === "document") {
        if (!d.signer) throw new ClientHttpError("unavailable", "storage_not_configured");
        const doc = (await rpc.call<Record<string, unknown>>("client_document_get", { p_token_hash: tokenHash, p_document: route.id })) ?? {};
        const path = str(doc.storage_path);
        if (!path) throw new ClientHttpError("not_found", "no_path");
        const signed = await d.signer.sign(path, SIGNED_URL_SEC);
        if (!signed) throw new ClientHttpError("not_found", "object_missing");
        log.info("client document link issued", { document: route.id, kind: str(doc.kind) });
        return json({ url: signed, expires_in_sec: SIGNED_URL_SEC });
      }
      throw bad("no_route", 404);
    } catch (e) {
      return fail(e, rname);
    }
  };
}
