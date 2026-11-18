// staff-invite: pure logic (no I/O). Everything here is unit-tested in logic.test.ts / handler.test.ts.
// Contract: docs/platform/IDENTITY.md and FOUNDATION.md §6, §7 (ADR-29, ADR-30).

export type Action = "invite" | "resend" | "disable" | "enable" | "accept";
export type StaffRole = "agent" | "manager" | "admin";
export type AppEnv = "production" | "preview" | "local";
export type Delivery = "resend" | "smtp" | "link";
export type LinkMode = "invite" | "recovery";

export type Command =
  | { action: "invite"; email: string; role: StaffRole }
  | { action: "resend"; email: string }
  | { action: "disable"; userId: string }
  | { action: "enable"; userId: string }
  | { action: "accept"; displayName: string };

export const MAX_BODY_BYTES = 4096;
// The database (staff.admin_assert_fresh, ops.config stepup_max_age_sec, 300..3600) is the authority on freshness.
// The in-function pre-check uses the largest allowed window so it can only reject what the database would reject too.
export const STEPUP_CEILING_SEC = 3600;
export const BAN_FOREVER = "876000h";
export const BAN_NONE = "none";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Same rule as api.invitation_create.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export class StaffError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "StaffError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);

export function normaliseEmail(raw: unknown): string {
  if (typeof raw !== "string") throw new StaffError(400, "bad_request", "invalid_input:email");
  const e = raw.trim().toLowerCase();
  if (e.length === 0 || e.length > 254 || !EMAIL_RE.test(e)) throw new StaffError(400, "bad_request", "invalid_input:email");
  return e;
}

const ALLOWED_KEYS: Record<Action, string[]> = {
  invite: ["action", "email", "role"],
  resend: ["action", "email"],
  disable: ["action", "user_id"],
  enable: ["action", "user_id"],
  accept: ["action", "display_name"],
};

/** Parse and validate the JSON body. Unknown keys are rejected so the contract cannot drift silently. */
export function parseCommand(bodyText: string): Command {
  if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
    throw new StaffError(413, "payload_too_large", "body_too_large");
  }
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new StaffError(400, "bad_request", "invalid_json");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new StaffError(400, "bad_request", "invalid_body");
  const b = body as Record<string, unknown>;
  const action = b.action;
  if (typeof action !== "string" || !(action in ALLOWED_KEYS)) throw new StaffError(400, "bad_request", "invalid_input:action");
  const extra = Object.keys(b).filter((k) => !ALLOWED_KEYS[action as Action].includes(k));
  if (extra.length) throw new StaffError(400, "bad_request", "unknown_keys", { keys: extra });
  switch (action as Action) {
    case "invite": {
      const role = b.role;
      if (role !== "agent" && role !== "manager" && role !== "admin") throw new StaffError(400, "bad_request", "invalid_input:role");
      return { action: "invite", email: normaliseEmail(b.email), role };
    }
    case "resend":
      return { action: "resend", email: normaliseEmail(b.email) };
    case "disable":
    case "enable": {
      if (!isUuid(b.user_id)) throw new StaffError(400, "bad_request", "invalid_input:user_id");
      return { action: action as "disable" | "enable", userId: (b.user_id as string).toLowerCase() };
    }
    case "accept": {
      const name = typeof b.display_name === "string" ? b.display_name.trim() : "";
      if (name.length < 2 || name.length > 80) throw new StaffError(400, "bad_request", "invalid_input:display_name");
      return { action: "accept", displayName: name };
    }
  }
}

export function bearerToken(header: string | null): string | null {
  const m = /^Bearer\s+([A-Za-z0-9._~+/=-]+)$/i.exec((header ?? "").trim());
  return m ? m[1] : null;
}

export interface Claims {
  sub?: unknown;
  role?: unknown;
  aal?: unknown;
  amr?: unknown;
  is_anonymous?: unknown;
  [k: string]: unknown;
}

/** Newest TOTP verification time (epoch seconds) in the amr claim, or null. */
export function lastTotpAt(amr: unknown): number | null {
  if (!Array.isArray(amr)) return null;
  let best: number | null = null;
  for (const a of amr) {
    if (!a || typeof a !== "object") continue;
    const m = (a as Record<string, unknown>).method;
    const t = Number((a as Record<string, unknown>).timestamp);
    if (m === "totp" && Number.isFinite(t) && (best === null || t > best)) best = t;
  }
  return best;
}

/**
 * Pre-check of the verified JWT claims. 'admin' actions need aal2 with a recent TOTP; 'accept' needs aal2
 * (TOTP enrolled before the person becomes staff). The database repeats the authoritative checks.
 */
export function checkClaims(claims: Claims | null, need: "admin" | "accept", nowSec: number): string {
  if (!claims) throw new StaffError(401, "unauthenticated", "invalid_token");
  if (claims.role !== "authenticated" || !isUuid(claims.sub) || claims.is_anonymous === true) {
    throw new StaffError(401, "unauthenticated", "not_a_user_session");
  }
  if (claims.aal !== "aal2") throw new StaffError(403, "forbidden", "forbidden:aal2_required");
  if (need === "admin") {
    const t = lastTotpAt(claims.amr);
    if (t === null || t < nowSec - STEPUP_CEILING_SEC || t > nowSec + 60) {
      throw new StaffError(403, "forbidden", "forbidden:admin_fresh_totp");
    }
  }
  return (claims.sub as string).toLowerCase();
}

export interface DbError {
  code?: string;
  message?: string;
}

const PT_CODES: Record<string, string> = {
  "400": "bad_request",
  "401": "unauthenticated",
  "403": "forbidden",
  "404": "not_found",
  "409": "conflict",
  "423": "locked",
  "429": "rate_limited",
};
// Messages raised by our SQL are short tokens (invitation_open, forbidden:admin_fresh_totp, ...). Anything else is hidden.
const SAFE_MESSAGE = /^[a-z_]+(:[a-z_]+)?$/;

/** Map a PostgREST error (PTxxx from our RPCs, PGRST*, SQLSTATE) to a response error. Never leaks internals. */
export function mapDbError(e: DbError): StaffError {
  const code = e.code ?? "";
  const msg = SAFE_MESSAGE.test(e.message ?? "") ? (e.message as string) : "database_error";
  const pt = /^PT(\d{3})$/.exec(code);
  if (pt && PT_CODES[pt[1]]) return new StaffError(Number(pt[1]), PT_CODES[pt[1]], msg);
  if (code === "42501") return new StaffError(403, "forbidden", "forbidden");
  // PGRST106: schema not exposed; PGRST202: function not found in the schema cache
  if (code === "PGRST106" || code === "PGRST202") return new StaffError(503, "unavailable", "staff_api_unavailable");
  return new StaffError(500, "internal", "internal");
}

export interface Env {
  supabaseUrl: string;
  publishableKey: string;
  secretKey: string | null;
  resendApiKey: string | null;
  mailFrom: string | null;
  appEnv: AppEnv;
  redirectTo: string;
  allowedOrigins: string | null;
}

export const DEFAULT_REDIRECT = "https://seeld.co.il/app/auth/accept";

/** Read configuration. A missing or unknown SEELD_ENV means production (fail closed: links are never returned). */
export function readEnv(get: (k: string) => string | undefined): Env {
  const s = (k: string) => {
    const v = get(k);
    return v && v.trim() ? v.trim() : null;
  };
  const rawEnv = s("SEELD_ENV");
  const appEnv: AppEnv = rawEnv === "local" || rawEnv === "preview" ? rawEnv : "production";
  const redirect = s("STAFF_INVITE_REDIRECT_URL") ?? DEFAULT_REDIRECT;
  return {
    supabaseUrl: s("SUPABASE_URL") ?? "",
    publishableKey: s("SEELD_PUBLISHABLE_KEY") ?? s("SUPABASE_ANON_KEY") ?? "",
    secretKey: s("SEELD_SECRET_KEY"),
    resendApiKey: s("RESEND_API_KEY"),
    mailFrom: s("STAFF_INVITE_FROM") ?? s("NOTIFY_FROM"),
    appEnv,
    redirectTo: appEnv === "production" && !redirect.startsWith("https://") ? DEFAULT_REDIRECT : redirect,
    allowedOrigins: s("ALLOWED_ORIGINS"),
  };
}

/**
 * How a link reaches the invitee:
 *   resend : RESEND_API_KEY and a sender exist -> generateLink + our own email (link never returned)
 *   smtp   : production without Resend -> GoTrue sends (inviteUserByEmail / recovery mail) through the Auth SMTP
 *   link   : non-production without Resend -> generateLink and the link is returned to the admin caller only
 */
export function chooseDelivery(env: Pick<Env, "resendApiKey" | "mailFrom" | "appEnv">): Delivery {
  if (env.resendApiKey && env.mailFrom) return "resend";
  return env.appEnv === "production" ? "smtp" : "link";
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function buildEmail(mode: LinkMode, link: string): { subject: string; html: string; text: string } {
  const subject = mode === "invite" ? "הזמנה למערכת הצוות של SEELD" : "קישור כניסה חדש למערכת הצוות של SEELD";
  const lead = mode === "invite" ? "הוזמנת להצטרף למערכת הצוות של SEELD." : "נשלח אליך קישור חדש להשלמת ההצטרפות למערכת הצוות של SEELD.";
  const steps = "בקישור תגדירו סיסמה ואחריה אימות דו-שלבי באפליקציית מאמת (TOTP).";
  const expiry = "הקישור תקף 10 דקות ולשימוש אחד. אם פג תוקפו, בקשו מהמנהל לשלוח שוב.";
  const ignore = "אם לא ציפית להודעה הזו, אפשר להתעלם ממנה.";
  const href = escapeHtml(link);
  const html = `<!doctype html><html lang="he" dir="rtl"><body style="font-family:Arial,sans-serif;direction:rtl;text-align:right">` +
    `<p>${lead}</p><p>${steps}</p>` +
    `<p><a href="${href}" style="display:inline-block;padding:10px 18px;background:#1f5135;color:#fff;text-decoration:none;border-radius:6px">כניסה והגדרה</a></p>` +
    `<p>${expiry}</p><p style="color:#666">${ignore}</p></body></html>`;
  const text = `${lead}\n${steps}\n\n${link}\n\n${expiry}\n${ignore}\n`;
  return { subject, html, text };
}
