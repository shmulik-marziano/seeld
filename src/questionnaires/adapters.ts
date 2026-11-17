// Contracts + mock implementations for persistence, submit, share-link requests and the client session.
// NOTHING here touches the network. The default implementations keep drafts in memory + sessionStorage only,
// and the default SubmitAdapter is a disabled "coming soon" no-op. Real adapters (RPC save_questionnaire_step,
// queue, requests table) plug in later through the same interfaces (see docs/product/QUESTIONNAIRE-LINK-FLOW.md).
import { QUESTIONNAIRE_SOURCE, QUESTIONNAIRE_SOURCE_RANK } from "./types";
import type { Answers, Questionnaire, RunnerMode } from "./types";
import { computeFlow, isAnswered, screeningPayload } from "./logic";

// ---------------------------------------------------------------- draft store
export interface DraftSnapshot {
  answers: Answers;
  currentKey: string | null;
  consented: boolean;
  updatedAt: string;
  version: number;
}
export interface QuestionnaireStore {
  load(key: string): DraftSnapshot | null;
  save(key: string, snap: DraftSnapshot): void;
  clear(key: string): void;
  clearAll(): void;
  /** True when the draft survives only in this browser tab (always, at this stage). */
  readonly kind: "memory+session";
}
const PREFIX = "seeld-q:";
export class MemorySessionStore implements QuestionnaireStore {
  readonly kind = "memory+session" as const;
  private mem = new Map<string, DraftSnapshot>();
  constructor(private persist = true) {}
  private ss(): Storage | null {
    if (!this.persist) return null;
    try { return typeof sessionStorage !== "undefined" ? sessionStorage : null; } catch { return null; }
  }
  load(key: string): DraftSnapshot | null {
    const m = this.mem.get(key);
    if (m) return m;
    try {
      const raw = this.ss()?.getItem(PREFIX + key);
      if (!raw) return null;
      const snap = JSON.parse(raw) as DraftSnapshot;
      this.mem.set(key, snap);
      return snap;
    } catch { return null; }
  }
  save(key: string, snap: DraftSnapshot) {
    this.mem.set(key, snap);
    try { this.ss()?.setItem(PREFIX + key, JSON.stringify(snap)); } catch { /* quota or blocked: memory still works */ }
  }
  clear(key: string) {
    this.mem.delete(key);
    try { this.ss()?.removeItem(PREFIX + key); } catch { /* ignore */ }
  }
  clearAll() {
    this.mem.clear();
    try {
      const s = this.ss();
      if (!s) return;
      for (let i = s.length - 1; i >= 0; i--) { const k = s.key(i); if (k && k.startsWith(PREFIX)) s.removeItem(k); }
    } catch { /* ignore */ }
  }
}
/** Health data never touches sessionStorage unless the user is mid-way, and is wiped on leaving. */
export const defaultStore: QuestionnaireStore = new MemorySessionStore(true);

// ---------------------------------------------------------------- submit payload
export interface FieldEnvelope {
  value: unknown;
  source: typeof QUESTIONNAIRE_SOURCE;
  rank: typeof QUESTIONNAIRE_SOURCE_RANK;
  answeredAt: string;
}
export interface SubmitPayload {
  idempotencyKey: string;
  questionnaire: { key: string; version: number };
  mode: RunnerMode;
  /** share-link request token when the client fills from a link */
  requestToken: string | null;
  stepKey: string | null;
  stepCompleted: boolean;
  submit: boolean;
  completionPct: number;
  fields: Record<string, FieldEnvelope>;
  /** server-computed-looking derived values, e.g. health_screening */
  derived: Record<string, unknown>;
  sentAt: string;
}
export interface SubmitResult {
  status: "disabled" | "saved" | "duplicate" | "error";
  message?: string;
  savedAt?: string;
  version?: number;
}
export interface SubmitAdapter {
  readonly enabled: boolean;
  readonly label: string;
  /** Per-screen autosave. Idempotent by payload.idempotencyKey; versioned by the server. */
  saveStep(payload: SubmitPayload): Promise<SubmitResult>;
  /** Final submit. */
  submit(payload: SubmitPayload): Promise<SubmitResult>;
}
/** Default: disabled "coming soon" no-op. No network. */
export const disabledSubmitAdapter: SubmitAdapter = {
  enabled: false,
  label: "בקרוב",
  async saveStep() { return { status: "disabled", message: "השליחה לצוות תיפתח בקרוב" }; },
  async submit() { return { status: "disabled", message: "השליחה לצוות תיפתח בקרוב" }; },
};
/** Mock for dev/tests: remembers idempotency keys in memory and bumps a version. */
export class MockSubmitAdapter implements SubmitAdapter {
  readonly enabled = true;
  readonly label = "מדומה (בזיכרון)";
  readonly seen = new Map<string, SubmitResult>();
  readonly calls: SubmitPayload[] = [];
  private version = 0;
  private respond(p: SubmitPayload): SubmitResult {
    this.calls.push(p);
    const prev = this.seen.get(p.idempotencyKey);
    if (prev) return { ...prev, status: "duplicate" };
    const r: SubmitResult = { status: "saved", savedAt: new Date().toISOString(), version: ++this.version };
    this.seen.set(p.idempotencyKey, r);
    return r;
  }
  async saveStep(p: SubmitPayload) { return this.respond(p); }
  async submit(p: SubmitPayload) { return this.respond(p); }
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
export function newSessionId(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
}
/** Deterministic: the same step with the same answers always yields the same key, so a retry never duplicates. */
export function idempotencyKeyFor(sessionId: string, qKey: string, stepKey: string | null, fields: Record<string, FieldEnvelope>, submit: boolean): string {
  const body = JSON.stringify(Object.entries(fields).map(([k, v]) => [k, v.value]).sort());
  return `${qKey}:${sessionId}:${submit ? "submit" : stepKey ?? "start"}:${hash(body)}`;
}

/** Builds the payload for a step save or the final submit. Only VISIBLE answered fields are included (hidden answers stay local). */
export function buildSubmitPayload(args: {
  def: Questionnaire; answers: Answers; mode: RunnerMode; sessionId: string; requestToken?: string | null;
  stepKey: string | null; submit: boolean; now?: Date;
}): SubmitPayload {
  const { def, answers, mode, sessionId, stepKey, submit } = args;
  const nowIso = (args.now ?? new Date()).toISOString();
  const flow = computeFlow(def, answers);
  const fields: Record<string, FieldEnvelope> = {};
  let answered = 0;
  for (const st of flow.steps) {
    const v = answers[st.key];
    if (!isAnswered(v)) continue;
    answered++;
    fields[st.key] = { value: v, source: QUESTIONNAIRE_SOURCE, rank: QUESTIONNAIRE_SOURCE_RANK, answeredAt: nowIso };
  }
  const derived: Record<string, unknown> = {};
  const sp = screeningPayload(def, answers, nowIso);
  if (sp && sp.status !== "incomplete") derived.health_screening = sp;
  return {
    idempotencyKey: idempotencyKeyFor(sessionId, def.key, stepKey, fields, submit),
    questionnaire: { key: def.key, version: def.version },
    mode,
    requestToken: args.requestToken ?? null,
    stepKey,
    stepCompleted: !!stepKey,
    submit,
    completionPct: flow.steps.length ? Math.round((answered / flow.steps.length) * 100) : 0,
    fields,
    derived,
    sentAt: nowIso,
  };
}

// ---------------------------------------------------------------- share-link requests (aligned with insform.requests)
export type RequestStatus = "created" | "sent" | "opened" | "submitted" | "revoked" | "expired";
export interface QuestionnaireRequest {
  id: string;
  questionnaireKey: string;
  /** an internal customer reference chosen by the agent. Never a name typed into the URL. */
  customerRef: string;
  token: string;
  status: RequestStatus;
  isTest: boolean;
  expiresAt: string;
  sentAt: string | null;
  openedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}
export interface CreateRequestInput { questionnaireKey: string; customerRef: string; expiresInDays: 1 | 3 | 7 | 14 | 30 }
export interface CreatedRequest { request: QuestionnaireRequest; /** shown once; the server keeps only a hash (code_hash) */ code: string; url: string }
export interface RequestsAdapter {
  readonly kind: "mock" | "server";
  create(input: CreateRequestInput): Promise<CreatedRequest>;
  list(): Promise<QuestionnaireRequest[]>;
  revoke(id: string): Promise<QuestionnaireRequest>;
  /** New one-time code and refreshed expiry; the old code stops working. */
  resend(id: string): Promise<CreatedRequest>;
}
export const requestUrl = (token: string, origin = "") => `${origin}/q/${token}`;
function uuid(): string { return newSessionId(); }
function otp(): string { return String(Math.floor(100000 + Math.random() * 900000)); }

export class MockRequestsAdapter implements RequestsAdapter {
  readonly kind = "mock" as const;
  readonly rows = new Map<string, QuestionnaireRequest & { code: string; attempts: number }>();
  private origin() { return typeof location !== "undefined" ? location.origin : ""; }
  async create(i: CreateRequestInput): Promise<CreatedRequest> {
    const now = new Date();
    const r = {
      id: uuid(), questionnaireKey: i.questionnaireKey, customerRef: i.customerRef.trim(), token: uuid(), status: "created" as RequestStatus, isTest: true,
      expiresAt: new Date(now.getTime() + i.expiresInDays * 86400000).toISOString(), sentAt: null, openedAt: null, submittedAt: null, createdAt: now.toISOString(),
      code: otp(), attempts: 0,
    };
    this.rows.set(r.id, r);
    return { request: this.pub(r), code: r.code, url: requestUrl(r.token, this.origin()) };
  }
  private pub(r: QuestionnaireRequest & { code?: string; attempts?: number }): QuestionnaireRequest {
    const { code: _c, attempts: _a, ...rest } = r as QuestionnaireRequest & { code?: string; attempts?: number };
    return { ...rest, status: rest.status !== "revoked" && rest.status !== "submitted" && new Date(rest.expiresAt) < new Date() ? "expired" : rest.status };
  }
  async list() { return [...this.rows.values()].map((r) => this.pub(r)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async revoke(id: string) {
    const r = this.rows.get(id);
    if (!r) throw new Error("not-found");
    r.status = "revoked";
    return this.pub(r);
  }
  async resend(id: string): Promise<CreatedRequest> {
    const r = this.rows.get(id);
    if (!r) throw new Error("not-found");
    r.code = otp(); r.attempts = 0; r.status = "sent"; r.sentAt = new Date().toISOString();
    r.expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    return { request: this.pub(r), code: r.code, url: requestUrl(r.token, this.origin()) };
  }
  /** test/dev only: used by MockClientSessionAdapter */
  _byToken(token: string) { return [...this.rows.values()].find((r) => r.token === token) ?? null; }
}

// ---------------------------------------------------------------- client session
export type OpenError = "invalid" | "expired" | "revoked" | "locked" | "submitted" | "unavailable";
export interface OpenedSession {
  ok: true;
  questionnaireKey: string;
  /** resume point and the answers saved so far (server draft) */
  resume: { stepKey: string | null; answers: Answers; version: number } | null;
  expiresAt: string;
}
export interface OpenFailed { ok: false; error: OpenError; message: string; attemptsLeft?: number }
export interface ClientSessionAdapter {
  readonly kind: "mock" | "server" | "off";
  open(token: string, code: string): Promise<OpenedSession | OpenFailed>;
  /** per-screen autosave for the client link; the server checks token + version. */
  saveStep(token: string, payload: SubmitPayload): Promise<SubmitResult>;
}
export const MAX_CODE_ATTEMPTS = 5;
export const OPEN_ERROR_TEXT: Record<OpenError, string> = {
  invalid: "הקישור או הקוד לא תואמים. כדאי לבדוק שוב, או לבקש מהצוות קישור חדש",
  expired: "תוקף הקישור הסתיים. אפשר לבקש מהצוות קישור חדש",
  revoked: "הקישור הזה בוטל. אפשר לבקש מהצוות קישור חדש",
  locked: "היו יותר מדי ניסיונות. כדי לנסות שוב צריך לבקש מהצוות קוד חדש",
  submitted: "השאלון הזה כבר נשלח, תודה",
  unavailable: "הכניסה באמצעות קישור תיפתח בקרוב",
};
/** The shipped default: the client link flow is not live yet. */
export const offClientSession: ClientSessionAdapter = {
  kind: "off",
  async open() { return { ok: false, error: "unavailable", message: OPEN_ERROR_TEXT.unavailable }; },
  async saveStep() { return { status: "disabled", message: OPEN_ERROR_TEXT.unavailable }; },
};
export class MockClientSessionAdapter implements ClientSessionAdapter {
  readonly kind = "mock" as const;
  readonly drafts = new Map<string, { stepKey: string | null; answers: Answers; version: number }>();
  constructor(private requests: MockRequestsAdapter) {}
  async open(token: string, code: string): Promise<OpenedSession | OpenFailed> {
    const r = this.requests._byToken(token);
    const fail = (error: OpenError, attemptsLeft?: number): OpenFailed => ({ ok: false, error, message: OPEN_ERROR_TEXT[error], attemptsLeft });
    if (!r) return fail("invalid");
    if (r.status === "revoked") return fail("revoked");
    if (r.status === "submitted") return fail("submitted");
    if (new Date(r.expiresAt) < new Date()) return fail("expired");
    if (r.attempts >= MAX_CODE_ATTEMPTS) return fail("locked");
    if (r.code !== code.trim()) { r.attempts++; return fail(r.attempts >= MAX_CODE_ATTEMPTS ? "locked" : "invalid", MAX_CODE_ATTEMPTS - r.attempts); }
    r.attempts = 0; r.status = "opened"; r.openedAt = r.openedAt ?? new Date().toISOString();
    const d = this.drafts.get(token) ?? null;
    return { ok: true, questionnaireKey: r.questionnaireKey, resume: d, expiresAt: r.expiresAt };
  }
  async saveStep(token: string, p: SubmitPayload): Promise<SubmitResult> {
    const r = this.requests._byToken(token);
    if (!r) return { status: "error", message: OPEN_ERROR_TEXT.invalid };
    const prev = this.drafts.get(token);
    const answers: Answers = { ...(prev?.answers ?? {}) };
    for (const [k, v] of Object.entries(p.fields)) answers[k] = v.value as Answers[string];
    const version = (prev?.version ?? 0) + 1;
    this.drafts.set(token, { stepKey: p.stepKey, answers, version });
    if (p.submit) { r.status = "submitted"; r.submittedAt = new Date().toISOString(); }
    return { status: "saved", savedAt: new Date().toISOString(), version };
  }
}

// ---------------------------------------------------------------- meeting leads (payload matches supabase save_lead)
export interface MeetingLeadInput { firstName: string; phone: string; topics: string[]; note: string; consent: boolean }
export interface SaveLeadPayload {
  p_idempotency_key: string;
  p_fields: Record<string, string>;
  p_line_of_business: "insurance" | "finance";
  p_national_id: null;
  p_agency_id: null;
  p_request_id: null;
  /** not an RPC argument: carried next to it so the server can set the lead origin */
  origin: "meeting";
}
export const MEETING_TOPICS = [
  { id: "insurance-life", label: "ביטוח חיים", lob: "insurance" as const },
  { id: "insurance-health", label: "ביטוח בריאות", lob: "insurance" as const },
  { id: "insurance-vehicle", label: "רכב ודירה", lob: "insurance" as const },
  { id: "travel", label: "נסיעות", lob: "insurance" as const },
  { id: "pension", label: "פנסיה וחיסכון", lob: "finance" as const },
  { id: "mortgage", label: "משכנתא", lob: "finance" as const },
  { id: "other", label: "אחר", lob: "finance" as const },
];
export function buildLeadPayload(i: MeetingLeadInput, sessionId: string): SaveLeadPayload {
  const lob = MEETING_TOPICS.find((t) => i.topics.includes(t.id))?.lob ?? "insurance";
  const fields: Record<string, string> = { first_name: i.firstName.trim(), contact_phone: i.phone, lead_topics: i.topics.join(","), lead_note: i.note.trim() };
  for (const k of Object.keys(fields)) if (!fields[k]) delete fields[k];
  return { p_idempotency_key: `lead:meeting:${sessionId}:${hash(JSON.stringify(fields))}`, p_fields: fields, p_line_of_business: lob, p_national_id: null, p_agency_id: null, p_request_id: null, origin: "meeting" };
}

// ---------------------------------------------------------------- feature flag for the public client shell
/** The /q/:token shell shows only "coming soon" unless this is true (dev builds with ?qmock=1, or VITE_QUESTIONNAIRE_MOCK=1). */
export function clientMockEnabled(): boolean {
  try {
    if (import.meta.env.PROD) return false;
    return import.meta.env.VITE_QUESTIONNAIRE_MOCK === "1" || new URLSearchParams(window.location.search).get("qmock") === "1";
  } catch { return false; }
}
