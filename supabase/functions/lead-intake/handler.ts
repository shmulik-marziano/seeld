// lead-intake: the website's only write path for leads (FOUNDATION §7, ADR-21).
// Order (each step only after the previous passed):
//   1 Origin allowlist (403, details.field "origin")   2 body <= 32 KB, canonical payload, Idempotency-Key (400/413)
//   3 api.lead_replay (pure read)                      4 Turnstile siteverify (403, details.field "turnstile")
//   5 api.submit_lead(payload, key, client ip) with the secret key
//   6 api.intake_note_reject only for rejects AFTER Turnstile passed (400/409/423/429)
// Steps 1, 2 and 4 make zero DB calls; their rejects are counted in isolate memory and logged without PII.
// The browser only ever gets {ok:true} on success: no lead id and no duplicate flag (a visitor must not be able to
// confirm that someone else's lead exists).
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { clientIp } from "../_shared/ip.ts";
import { shortHash } from "../_shared/secret.ts";
import { hostnamesFromOrigins, verifyTurnstile } from "../_shared/turnstile.ts";
import type { Defer } from "../_shared/background.ts";
import type { FetchFn } from "../_shared/db.ts";

export const MAX_BODY_BYTES = 32 * 1024;
export const KINDS = ["insurance", "pension", "contact", "portfolio_review", "report"] as const;
const CANONICAL_KEYS = ["kind", "full_name", "phone", "email", "message", "payload", "utm", "consent", "consent_version", "source", "hp"];
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
const IDEM = /^[A-Za-z0-9_-]{8,128}$/;
const PHONE = /^0[2-9][0-9]{7,8}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ID_LIKE = /^\s*[0-9]{8,9}\s*$/;
// best-effort, per isolate: an address that keeps failing origin/shape/Turnstile is cut off before any DB call
export const REJECT_LIMIT = 30;
export const REJECT_WINDOW_SEC = 600;

export const MESSAGES: Record<string, string> = {
  generic_400: "חלק מהפרטים חסרים או אינם תקינים. נא לבדוק ולנסות שוב.",
  full_name: "נא למלא שם מלא.",
  phone: "מספר הטלפון אינו תקין.",
  email: "כתובת האימייל אינה תקינה.",
  contact: "נא להשאיר מספר טלפון או כתובת אימייל.",
  consent: "יש לאשר את מדיניות הפרטיות כדי לשלוח את הפנייה.",
  message: "ההודעה ארוכה מדי.",
  idempotency_key: "הבקשה אינה תקינה. נא לרענן את הדף ולנסות שוב.",
  origin: "הבקשה נחסמה.",
  turnstile: "אימות האבטחה נכשל. נא לרענן את הדף ולנסות שוב.",
  conflict: "הפנייה כבר נשלחה עם פרטים אחרים. נא לרענן את הדף ולשלוח שוב.",
  too_large: "הבקשה גדולה מדי.",
  rate_limited: "נשלחו יותר מדי פניות בזמן קצר. נא לנסות שוב בעוד כמה דקות, או להתקשר אלינו.",
  unavailable: "הטופס אינו זמין כרגע. אפשר לפנות אלינו בטלפון 052-309-7444.",
  internal: "אירעה שגיאה. נא לנסות שוב בעוד רגע.",
};

export interface LeadDeps {
  env: Env;
  /** service RPC client (SEELD_SECRET_KEY); null when the function is not configured. */
  rpc: Rpc | null;
  log: Logger;
  defer: Defer;
  rejects: RejectCounter;
  fetch?: FetchFn;
}

/** Per-isolate reject counter (fixed window). Best effort by design: isolates are short-lived and not shared. */
export interface RejectCounter {
  hit(key: string): number;
  count(key: string): number;
}

export function createRejectCounter(now: () => number = Date.now, windowSec = REJECT_WINDOW_SEC): RejectCounter {
  const m = new Map<string, { start: number; n: number }>();
  const cur = (key: string) => {
    const b = m.get(key);
    if (!b || now() - b.start >= windowSec * 1000) return null;
    return b;
  };
  return {
    hit(key) {
      const b = cur(key);
      if (!b) {
        if (m.size > 5000) m.clear(); // bound memory under a spray of addresses
        m.set(key, { start: now(), n: 1 });
        return 1;
      }
      return ++b.n;
    },
    count: (key) => cur(key)?.n ?? 0,
  };
}

export type Canonical = { payload: Record<string, unknown>; token: string | null };

function bad(field: string): HttpError {
  return new HttpError("bad_request", MESSAGES[field] ?? MESSAGES.generic_400, { details: { field } });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Pure: request JSON -> canonical submit_lead payload + Turnstile token. Throws HttpError(400) with a field name. */
export function canonicalLead(body: unknown): Canonical {
  if (!isPlainObject(body)) throw bad("payload");
  // two accepted shapes: flat {...fields, turnstile_token} or {lead: {...fields}, turnstile_token}
  const tokenRaw = body.turnstile_token;
  if (tokenRaw !== undefined && (typeof tokenRaw !== "string" || tokenRaw.length > 2048)) throw bad("turnstile_token");
  let src: Record<string, unknown>;
  if ("lead" in body) {
    if (!isPlainObject(body.lead)) throw bad("payload");
    for (const k of Object.keys(body)) if (k !== "lead" && k !== "turnstile_token") throw bad("payload_key");
    src = body.lead;
  } else {
    src = body;
  }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    if (k === "turnstile_token" && src === body) continue;
    if (!CANONICAL_KEYS.includes(k)) throw bad("payload_key");
    if (v !== undefined) payload[k] = v;
  }

  const str = (k: string, max: number) => {
    const v = payload[k];
    if (v === undefined || v === null) return "";
    if (typeof v !== "string" || v.length > max) throw bad(k);
    return v.trim();
  };
  const kind = str("kind", 40);
  if (!(KINDS as readonly string[]).includes(kind)) throw bad("kind");
  const name = str("full_name", 200);
  if (name.length < 2 || name.length > 120) throw bad("full_name");
  if (payload.consent !== true) throw bad("consent");
  const phone = str("phone", 30).replace(/[^0-9+]/g, "").replace(/^(\+972|972)/, "0");
  if (phone && !PHONE.test(phone)) throw bad("phone");
  const email = str("email", 254).toLowerCase();
  if (email && !EMAIL.test(email)) throw bad("email");
  if (!phone && !email) throw bad("contact");
  if (str("message", 4000).length > 4000) throw bad("message");
  str("consent_version", 40);
  str("source", 300);
  str("hp", 200);
  if (payload.payload !== undefined) {
    const p = payload.payload;
    if (!isPlainObject(p) || JSON.stringify(p).length > 4000) throw bad("payload");
    for (const [k, v] of Object.entries(p)) {
      if (!/^[a-z][a-z0-9_]{1,39}$/.test(k)) throw bad("payload_key");
      if (v !== null && !["string", "number", "boolean"].includes(typeof v)) throw bad("payload_value");
      if (typeof v === "string" && (v.length > 200 || ID_LIKE.test(v))) throw bad("payload_value");
    }
  }
  if (payload.utm !== undefined) {
    const u = payload.utm;
    if (!isPlainObject(u)) throw bad("utm");
    for (const [k, v] of Object.entries(u)) {
      if (!UTM_KEYS.includes(k) || typeof v !== "string" || v.length > 100) throw bad("utm");
    }
  }
  return { payload, token: typeof tokenRaw === "string" ? tokenRaw : null };
}

function statusToReason(status: number): "invalid_input" | "idempotency_conflict" | "feature_disabled" | "rate_limited" | null {
  if (status === 400) return "invalid_input";
  if (status === 409) return "idempotency_conflict";
  if (status === 423) return "feature_disabled";
  if (status === 429) return "rate_limited";
  return null;
}

/** Maps a submit_lead / lead_replay failure to the browser error (Hebrew), never echoing DB text beyond the field. */
export function mapRpcError(e: unknown): HttpError {
  if (e instanceof RpcError) {
    if (e.status === 400) return bad(e.field ?? "generic_400");
    if (e.status === 409) return new HttpError("conflict", MESSAGES.conflict);
    if (e.status === 429) return new HttpError("rate_limited", MESSAGES.rate_limited, { headers: { "retry-after": "600" } });
    // intake_enabled off: 423 so the site shows its "form closed" text (src/lib/leadIntake.ts maps status 423)
    if (e.status === 423) return new HttpError("feature_disabled", MESSAGES.unavailable);
  }
  return new HttpError("unavailable", MESSAGES.unavailable);
}

export function createLeadHandler(d: LeadDeps): (req: Request) => Promise<Response> {
  const turnstileHosts = hostnamesFromOrigins(d.env.allowedOrigins);
  return async (req) => {
    const rid = requestIdFor(req);
    const origin = req.headers.get("origin");
    const cors = corsHeaders(origin, d.env.allowedOrigins);
    const pre = preflight(req, d.env.allowedOrigins);
    if (pre) return pre;
    const log = d.log.child({ requestId: rid });
    const ip = clientIp(req.headers);
    const ipTag = ip ? await shortHash(ip) : "none";

    // memory-only reject counter: never a DB call for origin / shape / Turnstile failures
    const rejectEarly = async (reason: string, err: HttpError): Promise<Response> => {
      const n = d.rejects.hit(ipTag);
      log.warn("intake rejected", { reason, ip: ipTag, rejects: n });
      return errorResponse(err, rid, cors);
    };

    try {
      if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
      if (!origin || !d.env.allowedOrigins.includes(origin)) {
        // details.field tells the two 403s apart for the client (leadIntake.ts errorTag -> "invalid_input:origin")
        return await rejectEarly("origin", new HttpError("forbidden", MESSAGES.origin, { details: { field: "origin" } }));
      }
      if (d.rejects.count(ipTag) >= REJECT_LIMIT) {
        log.warn("intake blocked in memory", { ip: ipTag });
        return errorResponse(new HttpError("rate_limited", MESSAGES.rate_limited, { headers: { "retry-after": "600" } }), rid, cors);
      }

      const len = Number(req.headers.get("content-length") ?? "0");
      if (len > MAX_BODY_BYTES) return await rejectEarly("too_large", new HttpError("payload_too_large", MESSAGES.too_large));
      const raw = new Uint8Array(await req.arrayBuffer());
      if (raw.byteLength > MAX_BODY_BYTES) return await rejectEarly("too_large", new HttpError("payload_too_large", MESSAGES.too_large));
      let body: unknown;
      try {
        body = JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return await rejectEarly("shape", bad("payload"));
      }
      const idem = req.headers.get("idempotency-key") ?? "";
      if (!IDEM.test(idem)) return await rejectEarly("shape", bad("idempotency_key"));
      let lead: Canonical;
      try {
        lead = canonicalLead(body);
      } catch (e) {
        const field = e instanceof HttpError ? (e.details as { field?: string })?.field ?? "payload" : "payload";
        return await rejectEarly(`shape:${field}`, e instanceof HttpError ? e : bad("payload"));
      }
      if (typeof lead.payload.hp === "string" && lead.payload.hp.trim() !== "") {
        log.info("intake honeypot", { ip: ipTag }); // bots get the same answer as people, and nothing is stored
        return jsonResponse({ ok: true }, rid, { headers: cors });
      }
      if (!d.rpc) {
        log.error("intake not configured", { missing: "SUPABASE_URL or secret key" });
        throw new HttpError("unavailable", MESSAGES.unavailable);
      }

      // 3. replay: same key + same body = the stored answer, BEFORE spending the single-use Turnstile token
      try {
        const prev = await d.rpc.call<unknown>("lead_replay", { p_idem_key: idem, p_payload: lead.payload });
        if (prev) {
          log.info("intake replay");
          return jsonResponse({ ok: true }, rid, { headers: cors });
        }
      } catch (e) {
        log.warn("lead_replay failed", { code: e instanceof RpcError ? e.code : "unknown", status: e instanceof RpcError ? e.status : 0 });
        throw mapRpcError(e);
      }

      // 4. Turnstile
      const ts = await verifyTurnstile(lead.token, ip, {
        secret: d.env.turnstileSecret,
        production: d.env.stage === "production",
        hostnames: turnstileHosts,
        fetch: d.fetch,
      });
      if (!ts.ok) {
        if (ts.reason === "not_configured" || ts.reason === "unavailable") {
          log.error("turnstile unavailable", { reason: ts.reason });
          throw new HttpError("unavailable", MESSAGES.unavailable);
        }
        return await rejectEarly(`turnstile:${ts.reason}`, new HttpError("forbidden", MESSAGES.turnstile, { details: { field: "turnstile" } }));
      }
      if (ts.skipped) log.warn("turnstile skipped: TURNSTILE_SECRET_KEY not set (non-production)", { stage: d.env.stage });

      if (!ip) {
        log.warn("no client ip header");
        throw bad("generic_400");
      }

      // 5. the write
      try {
        await d.rpc.call("submit_lead", { p_payload: lead.payload, p_idem_key: idem, p_client_ip: ip });
      } catch (e) {
        const status = e instanceof RpcError ? e.status : 0;
        const reason = statusToReason(status);
        log.warn("submit_lead rejected", { code: e instanceof RpcError ? e.code : "unknown", status, field: e instanceof RpcError ? e.field : null });
        if (reason) {
          const rpc = d.rpc;
          d.defer(rpc.call("intake_note_reject", { p_reason: reason, p_client_ip: ip }).catch((x) => {
            log.warn("intake_note_reject failed", { code: x instanceof RpcError ? x.code : "unknown" });
          }));
        }
        throw mapRpcError(e);
      }
      log.info("lead accepted", { kind: lead.payload.kind });
      return jsonResponse({ ok: true }, rid, { headers: cors });
    } catch (e) {
      if (!(e instanceof HttpError)) log.error("intake error", { error: e instanceof Error ? e.name : "unknown" });
      const err = e instanceof HttpError ? e : new HttpError("internal", MESSAGES.internal);
      return errorResponse(err, rid, cors);
    }
  };
}
