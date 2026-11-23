// Client forms adapter: the interface the hub and the flow page talk to, the HTTP adapter for the forms-intake Edge
// Function (routes start / state / step / submit / document, snake_case JSON, header x-forms-session) and an in-memory
// mock for development and tests. The session token lives in a closure and in sessionStorage (same tab, never
// localStorage); personal details never touch browser storage.
import { SUPABASE_URL } from "@/integrations/supabase/config";
import { FORMS_INTAKE_URL, FORMS_LIMITS } from "./config";
import type { DocumentKind } from "./catalog";

export type ErrorKind = "inactive" | "unavailable" | "generic" | "expired" | "locked" | "completed";
export const ERROR_KINDS: readonly ErrorKind[] = ["inactive", "unavailable", "generic", "expired", "locked", "completed"];

export class FormsApiError extends Error {
  constructor(public kind: ErrorKind, public code = "") { super(code || kind); this.name = "FormsApiError"; }
}

export interface StartReq {
  first_name: string;
  last_name: string;
  national_id: string;
  phone: string;
  email: string | null;
  terms_privacy_approved: true;
  turnstile_token?: string | null;
}
export interface StartRes { session_token: string; expires_at: string; health_stored: boolean }
export type SubmissionStatus = "draft" | "submitted" | "reviewed";
export interface SubmissionView {
  card: string;
  questionnaire: string;
  version: number;
  status: SubmissionStatus;
  step_key: string | null;
  draft_version: number;
  completion: number;
  submitted_at: string | null;
  answers_stored: boolean;
  derived: Record<string, unknown>;
  /** a draft whose answers are stored comes back with them (resume) */
  answers: Record<string, unknown> | null;
}
export interface DocumentView { id: string; kind: string; created_at: string; stored: boolean }
export interface StateRes { status: "open" | "expired" | "locked"; expires_at: string; submissions: SubmissionView[]; documents: DocumentView[] }
export interface StepReq {
  card: string; questionnaire: string; version: number; step_key: string | null;
  answers: Record<string, unknown>; derived: Record<string, unknown>; draft_version: number; completion: number;
}
export interface StepRes { saved: true; draft_version: number; answers_stored: boolean }
export interface SignerReq { name: string; kind: "drawn" | "typed" | "none"; png?: string; hash: string }
export interface SubmitReq {
  card: string; questionnaire: string; version: number; answers: Record<string, unknown>; derived: Record<string, unknown>;
  signer: SignerReq; completion: number;
}
export interface SubmitRes { submitted: true; submitted_at: string; answers_stored: boolean; duplicate: boolean }
export interface DocumentReq { kind: DocumentKind; ext: "pdf" | "jpg" | "jpeg" | "png" | "heic"; content_type: string; bytes_base64: string }
export interface DocumentRes { document_id: string; kind: string; stored: true }

export interface FormsApi {
  /** a session token is held (this tab) */
  hasSession(): boolean;
  /** the session's health flag from /start, when known */
  healthStored(): boolean | null;
  start(r: StartReq): Promise<StartRes>;
  state(): Promise<StateRes>;
  step(r: StepReq): Promise<StepRes>;
  submit(r: SubmitReq): Promise<SubmitRes>;
  document(r: DocumentReq): Promise<DocumentRes>;
  /** forget the session in this tab (the server keeps it) */
  clear(): void;
}

/** Any thrown value to an error screen. Network failures read as "unavailable". */
export function errorKindOf(e: unknown): ErrorKind {
  if (e instanceof FormsApiError) return e.kind;
  if (e instanceof TypeError) return "unavailable";
  return "generic";
}
export const errorCodeOf = (e: unknown): string => (e instanceof FormsApiError ? e.code : "");

export function errorKindOfResponse(status: number, body: unknown): ErrorKind {
  const raw = (body as { error?: unknown } | null)?.error;
  if (typeof raw === "string" && (ERROR_KINDS as readonly string[]).includes(raw)) return raw as ErrorKind;
  if (status === 423 || status === 503 || status === 502 || status === 504) return "unavailable";
  if (status === 401 || status === 404) return "inactive";
  if (status === 410) return "expired";
  if (status === 429) return "locked";
  if (status === 409) return "completed";
  if (status === 403) return "locked";
  if (status >= 500) return "unavailable";
  return "generic";
}

// ---------------------------------------------------------------- the session token (closure + sessionStorage)
const STORE_KEY = "seeld-forms:session";
interface Stored { token: string; expiresAt: string; healthStored: boolean }
function loadStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Stored>;
    if (typeof s.token !== "string" || typeof s.expiresAt !== "string") return null;
    if (new Date(s.expiresAt).getTime() <= Date.now()) return null;
    return { token: s.token, expiresAt: s.expiresAt, healthStored: s.healthStored === true };
  } catch { return null; }
}
function saveStored(s: Stored | null) {
  try {
    if (s) sessionStorage.setItem(STORE_KEY, JSON.stringify(s)); else sessionStorage.removeItem(STORE_KEY);
  } catch { /* storage blocked: the closure still holds the token for this page */ }
}

export interface HttpOpts {
  /** default: VITE_FORMS_INTAKE_URL, else `<SUPABASE_URL>/functions/v1/forms-intake` */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** tests: start without a stored session */
  persist?: boolean;
}

const SESSION_HEADER = "x-forms-session";

/** The real adapter: talks to the forms-intake Edge Function. No cookies, no logging. */
export function createHttpFormsApi(opts: HttpOpts = {}): FormsApi {
  const base = (opts.baseUrl ?? (FORMS_INTAKE_URL || `${SUPABASE_URL}/functions/v1/forms-intake`)).replace(/\/+$/, "");
  const persist = opts.persist !== false;
  let stored: Stored | null = persist ? loadStored() : null;

  const send = async (path: string, init: { method: "GET" | "POST"; body?: unknown; session?: boolean; timeoutMs?: number }): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (init.session) {
      if (!stored) throw new FormsApiError("inactive", "no_session");
      headers[SESSION_HEADER] = stored.token;
    }
    if (init.body !== undefined) headers["content-type"] = "application/json";
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), init.timeoutMs ?? opts.timeoutMs ?? FORMS_LIMITS.timeoutMs) : null;
    let res: Response;
    try {
      res = await (opts.fetchImpl ?? fetch)(`${base}/${path}`, {
        method: init.method, headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: ctl?.signal,
      });
    } catch {
      throw new FormsApiError("unavailable", "network");
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch { /* the status decides */ }
      const kind = errorKindOfResponse(res.status, body);
      const code = typeof (body as { code?: unknown } | null)?.code === "string" ? (body as { code: string }).code : "";
      if (kind === "expired" || kind === "inactive") { stored = null; saveStored(null); }
      throw new FormsApiError(kind, code);
    }
    return res;
  };
  const json = async <T>(res: Response): Promise<T> => {
    try { return (await res.json()) as T; } catch { throw new FormsApiError("generic", "bad_json"); }
  };

  return {
    hasSession: () => !!stored,
    healthStored: () => (stored ? stored.healthStored : null),
    async start(r) {
      const res = await json<StartRes>(await send("start", { method: "POST", body: r }));
      if (typeof res?.session_token !== "string" || !res.session_token || typeof res.expires_at !== "string") throw new FormsApiError("generic", "bad_shape");
      stored = { token: res.session_token, expiresAt: res.expires_at, healthStored: res.health_stored === true };
      if (persist) saveStored(stored);
      return res;
    },
    async state() {
      const res = await json<StateRes>(await send("state", { method: "GET", session: true }));
      if (!Array.isArray(res?.submissions) || !Array.isArray(res?.documents)) throw new FormsApiError("generic", "bad_shape");
      return res;
    },
    async step(r) {
      return json<StepRes>(await send("step", { method: "POST", body: r, session: true }));
    },
    async submit(r) {
      return json<SubmitRes>(await send("submit", { method: "POST", body: r, session: true }));
    },
    async document(r) {
      return json<DocumentRes>(await send("document", { method: "POST", body: r, session: true, timeoutMs: FORMS_LIMITS.uploadTimeoutMs }));
    },
    clear() { stored = null; if (persist) saveStored(null); },
  };
}

export interface MockOpts {
  now?: () => Date;
  /** fail mode: every call (or only `on`) throws FormsApiError(kind) */
  fail?: { kind: ErrorKind; on?: keyof FormsApi; code?: string };
  delayMs?: number;
  healthStored?: boolean;
}

/** In memory, no network: the whole flow can be tried in one tab (VITE_FORMS_ADAPTER=mock) and in tests. */
export function createMockFormsApi(opts: MockOpts = {}): FormsApi {
  const now = opts.now ?? (() => new Date());
  let session: { token: string; expiresAt: number; subs: Map<string, SubmissionView>; docs: DocumentView[] } | null = null;
  const wait = () => (opts.delayMs ? new Promise((r) => setTimeout(r, opts.delayMs)) : Promise.resolve());
  const guard = (call: keyof FormsApi) => {
    if (opts.fail && (!opts.fail.on || opts.fail.on === call)) throw new FormsApiError(opts.fail.kind, opts.fail.code);
  };
  const live = () => {
    if (!session) throw new FormsApiError("inactive", "no_session");
    if (now().getTime() >= session.expiresAt) throw new FormsApiError("expired", "session_expired");
    return session;
  };
  const token = () => { const a = new Uint8Array(24); crypto.getRandomValues(a); return [...a].map((b) => b.toString(16).padStart(2, "0")).join(""); };
  return {
    hasSession: () => !!session,
    healthStored: () => (session ? opts.healthStored === true : null),
    async start(r) {
      await wait(); guard("start");
      if (!r.terms_privacy_approved || !r.first_name || !r.last_name || !/^\d{9}$/.test(r.national_id) || !/^05\d{8}$/.test(r.phone.replace(/\D/g, ""))) {
        throw new FormsApiError("generic", "invalid_input");
      }
      session = { token: token(), expiresAt: now().getTime() + 14 * 86_400_000, subs: new Map(), docs: [] };
      return { session_token: session.token, expires_at: new Date(session.expiresAt).toISOString(), health_stored: opts.healthStored === true };
    },
    async state() {
      await wait(); guard("state");
      const s = live();
      return { status: "open", expires_at: new Date(s.expiresAt).toISOString(), submissions: [...s.subs.values()].map((x) => ({ ...x })), documents: s.docs.map((d) => ({ ...d })) };
    },
    async step(r) {
      await wait(); guard("step");
      const s = live();
      const prev = s.subs.get(r.questionnaire);
      if (prev && prev.status !== "draft") throw new FormsApiError("completed", "already_submitted");
      if ((prev?.draft_version ?? 0) !== r.draft_version) throw new FormsApiError("completed", "stale_draft");
      const stored = r.questionnaire !== "health" || opts.healthStored === true;
      const v = (prev?.draft_version ?? 0) + 1;
      s.subs.set(r.questionnaire, { card: r.card, questionnaire: r.questionnaire, version: r.version, status: "draft", step_key: r.step_key, draft_version: v, completion: r.completion, submitted_at: null, answers_stored: stored, derived: r.derived, answers: stored ? r.answers : null });
      return { saved: true, draft_version: v, answers_stored: stored };
    },
    async submit(r) {
      await wait(); guard("submit");
      const s = live();
      const prev = s.subs.get(r.questionnaire);
      if (prev && prev.status !== "draft") return { submitted: true, submitted_at: prev.submitted_at ?? now().toISOString(), answers_stored: prev.answers_stored, duplicate: true };
      const stored = r.questionnaire !== "health" || opts.healthStored === true;
      const at = now().toISOString();
      s.subs.set(r.questionnaire, { card: r.card, questionnaire: r.questionnaire, version: r.version, status: "submitted", step_key: null, draft_version: prev?.draft_version ?? 0, completion: r.completion, submitted_at: at, answers_stored: stored, derived: r.derived, answers: null });
      return { submitted: true, submitted_at: at, answers_stored: stored, duplicate: false };
    },
    async document(r) {
      await wait(); guard("document");
      const s = live();
      if (!r.bytes_base64) throw new FormsApiError("generic", "invalid_bytes");
      const d = { id: token().slice(0, 8) + "-0000-4000-8000-000000000000", kind: r.kind, created_at: now().toISOString(), stored: true };
      s.docs.push(d);
      return { document_id: d.id, kind: r.kind, stored: true };
    },
    clear() { session = null; },
  };
}
