// v2 lead intake: the ONLY way a public form reaches seeld-site.
//
//   browser form -> POST {SUPABASE_URL}/functions/v1/lead-intake  (Origin allowlist, canonical payload,
//   api.lead_replay, Turnstile, api.submit_lead with cf-connecting-ip)  -> {ok:true}
//
// Contract: docs/platform/FOUNDATION.md §7, DESIGN-PANEL.md §6.2, migration 20261119090500 (api.submit_lead v2).
// - Body = the canonical payload + `turnstile_token`. The Edge Function strips the token before hashing, so a
//   retry with the SAME Idempotency-Key and a NEW token replays the stored answer instead of creating a lead.
// - Top-level keys are closed (kind, full_name, phone, email, message, payload, utm, consent, consent_version,
//   source, hp). Kind-specific fields go in `payload`, restricted to ops.intake_payload_keys (mirrored below and
//   checked against the migration by src/test/lead-intake.test.ts).
// - Never: national id, bank details, health data, salary (ADR-42). Values that look like an Israeli id
//   (8-9 digits) are dropped here as well as rejected by the database.
// - The browser only ever learns {ok:true}: no lead id, no duplicate flag.
import { CONTACTS } from "@/lib/contacts";
import { FORMS_ENABLED, SUPABASE_URL } from "@/integrations/supabase/config";

export type LeadKind = "insurance" | "pension" | "contact" | "portfolio_review" | "report";

/** Mirror of ops.intake_payload_keys (20261119090500_submit_lead_v2.sql). A test keeps the two equal. */
export const INTAKE_PAYLOAD_KEYS: Record<LeadKind, readonly string[]> = {
  insurance: [
    "insurance_type", "vehicle_type", "vehicle_year", "property_type", "property_size_sqm", "business_type",
    "business_employees", "destination", "travel_start_date", "travel_end_date", "travelers_count",
    "preferred_contact_time", "page",
  ],
  pension: [
    "focus_area", "age_range", "situation", "concern", "employment_status", "retirement_age", "risk_tolerance",
    "primary_goals", "children_count", "preferred_contact_time", "page",
  ],
  contact: ["subject", "page"],
  portfolio_review: ["subject", "page"],
  report: ["subject", "page"],
};

/** Where the free-text `topic` of a form lands inside payload, per kind. */
const TOPIC_KEY: Record<LeadKind, string> = {
  insurance: "insurance_type",
  pension: "focus_area",
  contact: "subject",
  portfolio_review: "subject",
  report: "subject",
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"] as const;
export const CONSENT_VERSION = "v1";
const ID_LIKE = /^\s*\d{8,9}\s*$/;

export type LeadDetailValue = string | number | boolean | null | undefined;

export interface LeadInput {
  kind: LeadKind;
  name: string;
  phone?: string;
  email?: string;
  /** Subject / insurance type / pension focus, mapped per kind (see TOPIC_KEY). */
  topic?: string;
  message?: string;
  /** Must be true: the visitor agreed to be contacted. */
  consent: boolean;
  /** The page the form was sent from (pathname), stored as `source` and `payload.page`. */
  sourcePage: string;
  /** Kind-specific fields; keys outside INTAKE_PAYLOAD_KEYS[kind] are dropped. */
  details?: Record<string, LeadDetailValue>;
  /** Honeypot value (a hidden field real visitors never fill). */
  hp?: string;
}

export interface CanonicalLeadPayload {
  kind: LeadKind;
  full_name: string;
  phone?: string;
  email?: string;
  message?: string;
  payload: Record<string, string | number | boolean>;
  utm?: Record<string, string>;
  /** Always true on a request that is actually sent (postLead refuses otherwise). */
  consent: boolean;
  consent_version: string;
  source: string;
  hp?: string;
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

/** UTM / ref parameters of the current URL, in the shape submit_lead accepts. */
export function readUtm(search: string = typeof window !== "undefined" ? window.location.search : ""): Record<string, string> {
  const out: Record<string, string> = {};
  let params: URLSearchParams;
  try { params = new URLSearchParams(search); } catch { return out; }
  for (const k of UTM_KEYS) {
    const v = params.get(k)?.trim();
    if (v) out[k] = clip(v, 100);
  }
  return out;
}

/** Builds the canonical body (minus turnstile_token). Pure: same input, same JSON, same idempotency hash. */
export function buildLeadPayload(input: LeadInput, utm: Record<string, string> = readUtm()): CanonicalLeadPayload {
  const allowed = new Set(INTAKE_PAYLOAD_KEYS[input.kind]);
  const extra: Record<string, string | number | boolean> = {};
  const put = (k: string, v: LeadDetailValue) => {
    if (!allowed.has(k) || v === null || v === undefined) return;
    if (typeof v === "string") {
      const t = v.trim();
      if (!t || ID_LIKE.test(t)) return;
      extra[k] = clip(t, 200);
    } else if (typeof v === "number") {
      if (Number.isFinite(v)) extra[k] = v;
    } else {
      extra[k] = v;
    }
  };
  for (const [k, v] of Object.entries(input.details ?? {})) put(k, v);
  if (input.topic) put(TOPIC_KEY[input.kind], input.topic);
  put("page", input.sourcePage);

  const body: CanonicalLeadPayload = {
    kind: input.kind,
    full_name: clip(input.name.trim(), 120),
    payload: extra,
    consent: input.consent === true,
    consent_version: CONSENT_VERSION,
    source: clip(input.sourcePage || "/", 300),
  };
  const phone = input.phone?.trim();
  if (phone) body.phone = phone;
  const email = input.email?.trim().toLowerCase();
  if (email) body.email = email;
  const message = input.message?.trim();
  if (message) body.message = clip(message, 4000);
  if (Object.keys(utm).length > 0) body.utm = utm;
  const hp = input.hp?.trim();
  if (hp) body.hp = clip(hp, 200);
  return body;
}

export type LeadErrorCode =
  | "invalid_input" | "turnstile" | "origin" | "forbidden" | "conflict" | "too_large" | "disabled"
  | "rate_limited" | "unavailable" | "network" | "preview" | "consent";

/** ok=true: the lead was accepted (or replayed). ok=false: `message` is the Hebrew text to show. */
export interface LeadResult {
  ok: boolean;
  /** HTTP status; 0 when nothing was sent (network, preview, consent). */
  status: number;
  code?: LeadErrorCode;
  field?: string;
  message: string;
}

const CALL = `או חייגו ${CONTACTS.general.phone}`;

const FIELD_MESSAGES: Record<string, string> = {
  full_name: "נא למלא שם מלא (2 תווים לפחות).",
  phone: "מספר הטלפון אינו תקין. נא לבדוק ולנסות שוב.",
  email: "כתובת האימייל אינה תקינה.",
  contact: "נא להשאיר טלפון או אימייל כדי שנוכל לחזור אליכם.",
  consent: "כדי לשלוח צריך לאשר שנחזור אליכם.",
  message: "ההודעה ארוכה מדי. נא לקצר ולנסות שוב.",
};

/** Hebrew, visitor-facing text for a lead-intake answer. Never echoes server detail. */
export function leadErrorMessage(status: number, error?: string): { code: LeadErrorCode; field?: string; message: string } {
  const e = (error ?? "").toLowerCase();
  if (status === 400) {
    const field = e.startsWith("invalid_input:") ? e.slice("invalid_input:".length) : undefined;
    return {
      code: "invalid_input",
      field,
      message: (field && FIELD_MESSAGES[field]) ?? `חלק מהפרטים לא נקלטו. נא לבדוק את הטופס ולנסות שוב, ${CALL}.`,
    };
  }
  if (status === 403) {
    // lead-intake answers BOTH an Origin reject and a Turnstile reject with 403 {error:{code:"forbidden"}}
    // (supabase/functions/lead-intake/handler.ts), so only an explicit tag picks the narrow text; anything
    // else gets the combined text, which always carries the phone number.
    if (e.includes("origin")) return { code: "origin", message: `השליחה מהדף הזה לא אושרה. ${CALL}.` };
    if (e.includes("turnstile")) return { code: "turnstile", message: `לא הצלחנו לוודא שהשליחה אנושית. רעננו את הדף ונסו שוב, ${CALL}.` };
    return { code: "forbidden", message: `לא הצלחנו לאמת את השליחה. רעננו את הדף ונסו שוב, ${CALL}.` };
  }
  if (status === 409) return { code: "conflict", message: "הפרטים השתנו מאז הניסיון הקודם. נא ללחוץ שוב על שליחה." };
  if (status === 413) return { code: "too_large", message: "ההודעה ארוכה מדי. נא לקצר ולנסות שוב." };
  if (status === 423) return { code: "disabled", message: `הטופס סגור זמנית. ${CALL}, ונשמח לעזור.` };
  if (status === 429) return { code: "rate_limited", message: `נשלחו יותר מדי פניות בזמן קצר. נסו שוב בעוד כמה דקות, ${CALL}.` };
  return { code: "unavailable", message: `השירות לא זמין כרגע. נסו שוב בעוד רגע, ${CALL}.` };
}

export const LEAD_INTAKE_URL = `${SUPABASE_URL}/functions/v1/lead-intake`;

/** A fresh Idempotency-Key (8-128 chars, checked by api.lead_replay / submit_lead). */
export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface SubmitOptions {
  idempotencyKey: string;
  turnstileToken?: string | null;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

/** One POST to lead-intake. Resolves to a LeadResult; never throws. */
export async function postLead(body: CanonicalLeadPayload, opts: SubmitOptions): Promise<LeadResult> {
  if (!FORMS_ENABLED) {
    return { ok: false, status: 0, code: "preview", message: "תצוגה מקדימה: הטופס לא נשלח." };
  }
  if (body.consent !== true) {
    return { ok: false, status: 0, code: "consent", message: FIELD_MESSAGES.consent };
  }
  const doFetch = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(LEAD_INTAKE_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": opts.idempotencyKey },
      body: JSON.stringify(opts.turnstileToken ? { ...body, turnstile_token: opts.turnstileToken } : body),
      signal: opts.signal,
    });
  } catch {
    return { ok: false, status: 0, code: "network", message: `אין חיבור כרגע. בדקו את החיבור ונסו שוב, ${CALL}.` };
  }
  let json: { ok?: unknown; error?: unknown } | null = null;
  try { json = (await res.json()) as typeof json; } catch { /* empty or non-JSON body */ }
  if (res.ok && json?.ok === true) return { ok: true, status: res.status, message: "" };
  const mapped = leadErrorMessage(res.ok ? 503 : res.status, errorTag(json?.error));
  return { ok: false, status: res.status, ...mapped };
}

/**
 * The error tag of a lead-intake answer, in either shape:
 *   {"error":"invalid_input:phone"}                                           (DESIGN-PANEL §6.2)
 *   {"error":{"code":"bad_request","message":"…","details":{"field":"phone"}}} (supabase/functions/_shared/errors.ts)
 * The server's own message is never shown: the visitor text comes from leadErrorMessage only.
 */
function errorTag(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const e = error as { code?: unknown; details?: { field?: unknown } };
    const field = typeof e.details?.field === "string" ? e.details.field : undefined;
    if (field) return `invalid_input:${field}`;
    if (typeof e.code === "string") return e.code;
  }
  return undefined;
}

/** Convenience for one-off callers: build + post with a fresh key. Forms use useLeadIntake (key reuse on retry). */
export function submitLead(input: LeadInput, opts: Partial<SubmitOptions> = {}): Promise<LeadResult> {
  return postLead(buildLeadPayload(input), { ...opts, idempotencyKey: opts.idempotencyKey ?? newIdempotencyKey() });
}
