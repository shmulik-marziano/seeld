// Client-area adapter: the interface the screens talk to, an in-memory mock (development, tests) and the HTTP adapter
// for the client-area Edge Function (routes login/start, login/verify, me, portfolio, documents, documents/:id, harb, requests, logout;
// snake_case JSON; the session token travels as `Authorization: Bearer`). The contract is docs/product/CLIENT-AREA.md.
import { SUPABASE_URL } from "@/integrations/supabase/config";
import { CATEGORY_KEYS, CLIENT_AREA_URL, type CategoryKey, type DocKind } from "./config";
import { createBrowserSessionStore, createMemorySessionStore, type SessionStore } from "./session";

export type ClientErrorKind = "inactive" | "unavailable" | "unauthenticated" | "wrong_code" | "max_tries" | "expired" | "generic" | "harb_invalid";
export const CLIENT_ERROR_KINDS: readonly ClientErrorKind[] = ["inactive", "unavailable", "unauthenticated", "wrong_code", "max_tries", "expired", "generic", "harb_invalid"];

/** why a Har HaBituach file was refused (the server's `reason` code) */
export const HARB_REASONS = ["not_xlsx", "too_large", "too_many_sheets", "too_many_rows", "bad_layout", "empty", "id_mismatch", "bad_file"] as const;
export type HarbReason = (typeof HARB_REASONS)[number];

export class ClientApiError extends Error {
  readonly kind: ClientErrorKind;
  readonly triesLeft?: number;
  readonly reason?: HarbReason;
  constructor(kind: ClientErrorKind, triesLeft?: number, reason?: HarbReason) {
    super(kind);
    this.name = "ClientApiError";
    this.kind = kind;
    this.triesLeft = triesLeft;
    this.reason = reason;
  }
}
export const errorKindOf = (e: unknown): ClientErrorKind => (e instanceof ClientApiError ? e.kind : "generic");

export interface LoginStartReq { national_id: string; phone: string; turnstile_token?: string | null }
export interface LoginStartRes { challenge_id: string; phone_tail: string; expires_in_sec: number }
export interface LoginVerifyReq { challenge_id: string; code: string }
export interface ClientName { first_name: string; last_name: string }
export interface LoginVerifyRes { token: string; expires_at: string; client: ClientName }
export interface MeRes {
  client: ClientName & { agency_name: string };
  data_as_of: string | null;
  summary: { products: number; categories: { key: CategoryKey; label: string; count: number }[] };
  session: { expires_at: string };
}
export interface PortfolioProduct {
  id: string;
  type_code: number;
  type_label: string;
  company_label: string;
  policy_number_masked: string;
  source: string;
  status?: string | null;
  balance?: number | null;
  premium?: number | null;
  premium_frequency?: string | null;
  coverage?: number | null;
  start?: string | null;
  end?: string | null;
  track?: string | null;
  /** the status keeps the product (or its cover) alive */
  active?: boolean;
  ytd_return_pct?: number;
  fee_balance_pct?: number;
  fee_deposit_pct?: number;
  /** "YYYY-MM" */
  last_deposit?: string;
  covers?: string[];
  /** one line per live cover type: its premium and, when shared, its sum insured */
  cover_lines?: CoverLine[];
  protects?: ProtectionKey[];
}
export interface CoverLine { name: string; premium?: number; premium_frequency?: string; amount?: number }
export const PROTECTION_KEYS = ["health", "nursing", "life", "disability", "accidents", "critical", "home", "car"] as const;
export type ProtectionKey = (typeof PROTECTION_KEYS)[number];
export const REQUEST_TOPICS = ["insurance", "savings", "details", "other"] as const;
export type RequestTopic = (typeof REQUEST_TOPICS)[number];
export const REQUEST_CONTACTS = ["phone", "whatsapp", "email"] as const;
export type RequestContact = (typeof REQUEST_CONTACTS)[number];
export interface ClientRequest { id: string; topic: RequestTopic; message: string | null; contact: RequestContact | null; created_at: string; status: "received" | "done" }
export interface RequestsRes { enabled: boolean; requests: ClientRequest[] }
export interface RequestCreateReq { topic: RequestTopic; message?: string | null; contact: RequestContact }
export interface PortfolioCategory { key: CategoryKey; label: string; products: PortfolioProduct[] }
export interface PortfolioRes { as_of: string | null; categories: PortfolioCategory[] }
export interface ClientDocument { id: string; title: string; kind: DocKind; created_at: string; size_bytes: number | null; downloadable: boolean }
export interface DocumentsRes { documents: ClientDocument[] }
/** the Har HaBituach card: shown only while the server switch is on */
export interface HarbStatusRes { enabled: boolean; last_upload: { created_at: string | null; processed: boolean } | null }
export interface HarbUploadRes { document_id: string; duplicate: boolean; queued: boolean }
/** the largest file the browser sends (the server cap is the same) */
export const HARB_MAX_BYTES = 2 * 1024 * 1024;

export interface ClientApi {
  hasSession(): boolean;
  loginStart(r: LoginStartReq): Promise<LoginStartRes>;
  loginVerify(r: LoginVerifyReq): Promise<LoginVerifyRes>;
  me(): Promise<MeRes>;
  portfolio(): Promise<PortfolioRes>;
  documents(): Promise<DocumentsRes>;
  /** a short-lived download link (the browser opens it) */
  documentUrl(id: string): Promise<string>;
  harbStatus(): Promise<HarbStatusRes>;
  /** the bytes of the client's Har HaBituach export (.xlsx); the server checks it */
  harbUpload(bytes: Uint8Array): Promise<HarbUploadRes>;
  /** the client's requests to the agent; enabled=false while the server switch is off */
  requests(): Promise<RequestsRes>;
  requestCreate(r: RequestCreateReq): Promise<{ id: string; created_at: string }>;
  logout(): Promise<void>;
}

/** base64 of the file bytes for the JSON body (chunked: no argument-count limit) */
export function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// ---------------------------------------------------------------- mock
export interface MockOptions {
  delayMs?: number;
  /** every call fails with this kind */
  fail?: { code: ClientErrorKind };
  /** the code that signs in (default 123456) */
  code?: string;
  store?: SessionStore;
  now?: () => Date;
  /** the Har HaBituach card (default: shown) */
  harbEnabled?: boolean;
  /** every upload is refused with this reason */
  harbReason?: HarbReason;
  /** the requests sheet (default: on) */
  requestsEnabled?: boolean;
}

const MOCK_FIRST = "ישראל";
const MOCK_LAST = "ישראלי";
/** fictional products (no real client): every figure is made up */
function mockProducts(now: Date): PortfolioCategory[] {
  const ends = new Date(now.getTime() + 24 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return [
    { key: "pension", label: "פנסיה", products: [
      { id: "p1", type_code: 1, type_label: "קרן פנסיה חדשה מקיפה", company_label: "מנורה מבטחים", policy_number_masked: "****4471", source: "maslaka", status: "פעיל", active: true, balance: 412350, track: "מסלול לבני 50 ומטה", ytd_return_pct: 7.9, fee_balance_pct: 0.22, fee_deposit_pct: 1.5, last_deposit: "2026-10" },
    ] },
    { key: "gemel", label: "קופות גמל", products: [
      { id: "g1", type_code: 4, type_label: "קופת גמל להשקעה", company_label: "מיטב", policy_number_masked: "****1180", source: "maslaka", status: "פעיל", active: true, balance: 25400, ytd_return_pct: 5.2, fee_balance_pct: 0.6, last_deposit: "2026-06" },
      { id: "g2", type_code: 3, type_label: "קופת גמל לתגמולים ופיצויים", company_label: "הראל", policy_number_masked: "****4506", source: "maslaka", status: "לא פעיל", active: false, balance: 0 },
    ] },
    { key: "hishtalmut", label: "קרנות השתלמות", products: [
      { id: "h1", type_code: 7, type_label: "קרן השתלמות", company_label: "אלטשולר שחם", policy_number_masked: "****9032", source: "maslaka", status: "פעיל", active: true, balance: 86200, track: "מניות", ytd_return_pct: 9.4, fee_balance_pct: 0.7, last_deposit: "2026-10" },
    ] },
    { key: "insurance_life", label: "ביטוח חיים", products: [
      { id: "l1", type_code: 13, type_label: "ביטוח חיים", company_label: "הראל", policy_number_masked: "****5520", source: "production", status: "פעיל", active: true, premium: 96, premium_frequency: "חודשית", covers: ["ביטוח חיים למקרה מוות"], protects: ["life"],
        cover_lines: [{ name: "ביטוח חיים למקרה מוות", premium: 96, premium_frequency: "חודשית", amount: 1000000 }] },
    ] },
    { key: "insurance_health", label: "בריאות וסיעוד", products: [
      { id: "b1", type_code: 12, type_label: "ביטוח בריאות", company_label: "כלל ביטוח", policy_number_masked: "****7718", source: "harbit", status: "פעיל", active: true, premium: 210, premium_frequency: "חודשית", covers: ["ניתוחים", "השתלות", "תרופות"], protects: ["health"],
        cover_lines: [{ name: "ניתוחים", premium: 118, premium_frequency: "חודשית" }, { name: "השתלות", premium: 34, premium_frequency: "חודשית" }, { name: "תרופות", premium: 58, premium_frequency: "חודשית" }] },
    ] },
    { key: "insurance_general", label: "ביטוח כללי", products: [
      { id: "d1", type_code: 10, type_label: "ביטוח דירה", company_label: "הפניקס", policy_number_masked: "****3391", source: "harbit", status: "פעיל", active: true, premium: 1479, premium_frequency: "שנתית", end: ends, covers: ["מבנה", "תכולה"], protects: ["home"],
        cover_lines: [{ name: "מבנה", premium: 890, premium_frequency: "שנתית", amount: 1800000 }, { name: "תכולה", premium: 589, premium_frequency: "שנתית", amount: 250000 }] },
    ] },
  ];
}
const MOCK_DOCS: ClientDocument[] = [
  { id: "d1", title: "ייפוי כוח מסלקה", kind: "maslaka", created_at: "2026-11-23T19:00:00Z", size_bytes: 48210, downloadable: true },
  { id: "d2", title: "ייפוי כוח הר הביטוח", kind: "harbit", created_at: "2026-11-23T19:00:10Z", size_bytes: 31870, downloadable: true },
  { id: "d3", title: "ייפוי כוח העתקי פוליסות", kind: "policies", created_at: "2026-11-23T19:00:20Z", size_bytes: 29940, downloadable: true },
  { id: "d4", title: "דוח מסלקה", kind: "surense", created_at: "2026-11-10T09:12:00Z", size_bytes: 120400, downloadable: false },
];

export function createMockClientApi(o: MockOptions = {}): ClientApi {
  const store = o.store ?? createMemorySessionStore();
  const now = o.now ?? (() => new Date());
  const wait = () => new Promise<void>((r) => setTimeout(r, o.delayMs ?? 0));
  const guard = () => { if (o.fail) throw new ClientApiError(o.fail.code); };
  const challenges = new Map<string, { tries: number; matched: boolean }>();
  const session = () => { const t = store.read(); if (!t) throw new ClientApiError("unauthenticated"); return t; };
  const expiresAt = () => new Date(now().getTime() + 30 * 24 * 3600 * 1000).toISOString();
  let harbLast: HarbStatusRes["last_upload"] = null;
  const products = mockProducts(now());
  const requests: ClientRequest[] = [
    { id: "r2", topic: "details", message: "כתובת חדשה", contact: "phone", created_at: "2026-11-12T09:00:00Z", status: "done" },
  ];
  return {
    hasSession: () => !!store.read(),
    async loginStart(r) {
      await wait(); guard();
      if (!/^\d{9}$/.test(r.national_id) || !/^05\d{8}$/.test(r.phone)) throw new ClientApiError("generic");
      const id = `c-${Math.random().toString(36).slice(2, 10)}`;
      challenges.set(id, { tries: 0, matched: true });
      return { challenge_id: id, phone_tail: r.phone.slice(-4), expires_in_sec: 600 };
    },
    async loginVerify(r) {
      await wait(); guard();
      const c = challenges.get(r.challenge_id);
      if (!c) throw new ClientApiError("expired");
      if (r.code !== (o.code ?? "123456")) {
        c.tries++;
        if (c.tries >= 5) { challenges.delete(r.challenge_id); throw new ClientApiError("max_tries"); }
        throw new ClientApiError("wrong_code", 5 - c.tries);
      }
      challenges.delete(r.challenge_id);
      const token = `mock-${Math.random().toString(36).slice(2)}`;
      const expires_at = expiresAt();
      store.write(token, expires_at);
      return { token, expires_at, client: { first_name: MOCK_FIRST, last_name: MOCK_LAST } };
    },
    async me() {
      await wait(); guard(); session();
      return {
        client: { first_name: MOCK_FIRST, last_name: MOCK_LAST, agency_name: "שילד ביטוח ופיננסים" },
        data_as_of: "2026-11-01",
        summary: { products: products.reduce((n, c) => n + c.products.length, 0), categories: products.map((c) => ({ key: c.key, label: c.label, count: c.products.length })) },
        session: { expires_at: expiresAt() },
      };
    },
    async portfolio() {
      await wait(); guard(); session();
      return { as_of: "2026-11-01", categories: products };
    },
    async documents() {
      await wait(); guard(); session();
      return { documents: MOCK_DOCS };
    },
    async documentUrl(id) {
      await wait(); guard(); session();
      const d = MOCK_DOCS.find((x) => x.id === id && x.downloadable);
      if (!d) throw new ClientApiError("generic");
      return URL.createObjectURL(new Blob([`%PDF-1.4 mock ${d.title}`], { type: "application/pdf" }));
    },
    async harbStatus() {
      await wait(); guard(); session();
      return { enabled: o.harbEnabled ?? true, last_upload: harbLast };
    },
    async harbUpload(bytes) {
      await wait(); guard(); session();
      if (o.harbEnabled === false) throw new ClientApiError("inactive");
      if (o.harbReason) throw new ClientApiError("harb_invalid", undefined, o.harbReason);
      // a real export is a ZIP ("PK"): the mock refuses anything else, as the server would
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new ClientApiError("harb_invalid", undefined, "not_xlsx");
      harbLast = { created_at: now().toISOString(), processed: false };
      return { document_id: "harb-1", duplicate: false, queued: true };
    },
    async requests() {
      await wait(); guard(); session();
      return { enabled: o.requestsEnabled ?? true, requests: [...requests] };
    },
    async requestCreate(r) {
      await wait(); guard(); session();
      if (o.requestsEnabled === false) throw new ClientApiError("inactive");
      const created_at = now().toISOString();
      const id = `r-${Math.random().toString(36).slice(2, 10)}`;
      requests.unshift({ id, topic: r.topic, message: r.message?.trim() || null, contact: r.contact, created_at, status: "received" });
      return { id, created_at };
    },
    async logout() {
      await wait();
      store.clear();
    },
  };
}

// ---------------------------------------------------------------- http
export interface HttpOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  store?: SessionStore;
}

function errorKindOfResponse(status: number, body: unknown): ClientApiError {
  const code = body && typeof body === "object" && (body as { error?: { code?: unknown; tries_left?: unknown; reason?: unknown } }).error;
  const c = code && typeof code.code === "string" ? code.code : "";
  const left = code && typeof code.tries_left === "number" ? code.tries_left : undefined;
  if (status === 401) return new ClientApiError("unauthenticated");
  if (status === 503 && c === "inactive") return new ClientApiError("inactive");
  if (c === "harb_invalid") {
    const r = code && typeof code.reason === "string" && (HARB_REASONS as readonly string[]).includes(code.reason) ? (code.reason as HarbReason) : "bad_file";
    return new ClientApiError("harb_invalid", undefined, r);
  }
  if (c === "wrong_code") return new ClientApiError("wrong_code", left);
  if (c === "max_tries") return new ClientApiError("max_tries");
  if (c === "expired") return new ClientApiError("expired");
  if (status === 429 || status >= 500 || status === 503) return new ClientApiError("unavailable");
  return new ClientApiError("generic");
}

export function createHttpClientApi(opts: HttpOptions = {}): ClientApi {
  const base = opts.baseUrl ?? (CLIENT_AREA_URL || `${SUPABASE_URL}/functions/v1/client-area`);
  const store = opts.store ?? createBrowserSessionStore();
  const send = async (path: string, init: { method: "GET" | "POST"; body?: unknown; auth?: boolean }): Promise<Response> => {
    const headers: Record<string, string> = { accept: "application/json" };
    if (init.body !== undefined) headers["content-type"] = "application/json";
    if (init.auth) {
      const t = store.read();
      if (!t) throw new ClientApiError("unauthenticated");
      headers.authorization = `Bearer ${t}`;
    }
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), opts.timeoutMs ?? 20_000) : null;
    let res: Response;
    try {
      res = await (opts.fetchImpl ?? fetch)(`${base}/${path}`, {
        method: init.method, headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: ctl?.signal,
      });
    } catch {
      throw new ClientApiError("unavailable");
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch { /* the status decides */ }
      const err = errorKindOfResponse(res.status, body);
      if (err.kind === "unauthenticated") store.clear();
      throw err;
    }
    return res;
  };
  const json = async <T>(res: Response): Promise<T> => {
    try { return (await res.json()) as T; } catch { throw new ClientApiError("generic"); }
  };
  return {
    hasSession: () => !!store.read(),
    async loginStart(r) {
      const res = await json<LoginStartRes>(await send("login/start", { method: "POST", body: r }));
      if (typeof res?.challenge_id !== "string" || typeof res?.phone_tail !== "string") throw new ClientApiError("generic");
      return res;
    },
    async loginVerify(r) {
      const res = await json<LoginVerifyRes>(await send("login/verify", { method: "POST", body: r }));
      if (typeof res?.token !== "string" || !res.token || typeof res?.expires_at !== "string") throw new ClientApiError("generic");
      store.write(res.token, res.expires_at);
      return res;
    },
    async me() {
      const res = await json<MeRes>(await send("me", { method: "GET", auth: true }));
      if (!res?.client || typeof res.client.first_name !== "string") throw new ClientApiError("generic");
      return res;
    },
    async portfolio() {
      const res = await json<PortfolioRes>(await send("portfolio", { method: "GET", auth: true }));
      if (!Array.isArray(res?.categories)) throw new ClientApiError("generic");
      return { as_of: res.as_of ?? null, categories: res.categories.filter((c) => (CATEGORY_KEYS as readonly string[]).includes(c.key)) };
    },
    async documents() {
      const res = await json<DocumentsRes>(await send("documents", { method: "GET", auth: true }));
      if (!Array.isArray(res?.documents)) throw new ClientApiError("generic");
      return res;
    },
    async documentUrl(id) {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new ClientApiError("generic");
      const res = await json<{ url?: unknown }>(await send(`documents/${id}`, { method: "GET", auth: true }));
      if (typeof res?.url !== "string" || !/^https:\/\//.test(res.url)) throw new ClientApiError("generic");
      return res.url;
    },
    async harbStatus() {
      const res = await json<HarbStatusRes>(await send("harb", { method: "GET", auth: true }));
      if (typeof res?.enabled !== "boolean") throw new ClientApiError("generic");
      return { enabled: res.enabled, last_upload: res.last_upload && typeof res.last_upload === "object" ? res.last_upload : null };
    },
    async harbUpload(bytes) {
      if (bytes.byteLength > HARB_MAX_BYTES) throw new ClientApiError("harb_invalid", undefined, "too_large");
      const res = await json<HarbUploadRes>(await send("harb", { method: "POST", auth: true, body: { bytes_base64: bytesToBase64(bytes) } }));
      if (typeof res?.document_id !== "string") throw new ClientApiError("generic");
      return res;
    },
    async requests() {
      const res = await json<RequestsRes>(await send("requests", { method: "GET", auth: true }));
      if (typeof res?.enabled !== "boolean" || !Array.isArray(res.requests)) throw new ClientApiError("generic");
      return {
        enabled: res.enabled,
        requests: res.requests.filter((x) => x && typeof x.id === "string" && (REQUEST_TOPICS as readonly string[]).includes(x.topic)),
      };
    },
    async requestCreate(r) {
      const res = await json<{ id?: unknown; created_at?: unknown }>(await send("requests", { method: "POST", auth: true, body: { topic: r.topic, contact: r.contact, message: r.message ?? null } }));
      if (typeof res?.id !== "string") throw new ClientApiError("generic");
      return { id: res.id, created_at: typeof res.created_at === "string" ? res.created_at : new Date().toISOString() };
    },
    async logout() {
      try { await send("logout", { method: "POST", auth: true }); } catch { /* the server session may already be gone */ }
      store.clear();
    },
  };
}
