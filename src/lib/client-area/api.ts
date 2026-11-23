// Client-area adapter: the interface the screens talk to, an in-memory mock (development, tests) and the HTTP adapter
// for the client-area Edge Function (routes login/start, login/verify, me, portfolio, documents, documents/:id, logout;
// snake_case JSON; the session token travels as `Authorization: Bearer`). The contract is docs/product/CLIENT-AREA.md.
import { SUPABASE_URL } from "@/integrations/supabase/config";
import { CATEGORY_KEYS, CLIENT_AREA_URL, type CategoryKey, type DocKind } from "./config";
import { createBrowserSessionStore, createMemorySessionStore, type SessionStore } from "./session";

export type ClientErrorKind = "inactive" | "unavailable" | "unauthenticated" | "wrong_code" | "max_tries" | "expired" | "generic";
export const CLIENT_ERROR_KINDS: readonly ClientErrorKind[] = ["inactive", "unavailable", "unauthenticated", "wrong_code", "max_tries", "expired", "generic"];

export class ClientApiError extends Error {
  readonly kind: ClientErrorKind;
  readonly triesLeft?: number;
  constructor(kind: ClientErrorKind, triesLeft?: number) {
    super(kind);
    this.name = "ClientApiError";
    this.kind = kind;
    this.triesLeft = triesLeft;
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
}
export interface PortfolioCategory { key: CategoryKey; label: string; products: PortfolioProduct[] }
export interface PortfolioRes { as_of: string | null; categories: PortfolioCategory[] }
export interface ClientDocument { id: string; title: string; kind: DocKind; created_at: string; size_bytes: number | null; downloadable: boolean }
export interface DocumentsRes { documents: ClientDocument[] }

export interface ClientApi {
  hasSession(): boolean;
  loginStart(r: LoginStartReq): Promise<LoginStartRes>;
  loginVerify(r: LoginVerifyReq): Promise<LoginVerifyRes>;
  me(): Promise<MeRes>;
  portfolio(): Promise<PortfolioRes>;
  documents(): Promise<DocumentsRes>;
  /** a short-lived download link (the browser opens it) */
  documentUrl(id: string): Promise<string>;
  logout(): Promise<void>;
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
}

const MOCK_FIRST = "ישראל";
const MOCK_LAST = "ישראלי";
const MOCK_PRODUCTS: PortfolioCategory[] = [
  { key: "pension", label: "פנסיה", products: [
    { id: "p1", type_code: 1, type_label: "קרן פנסיה חדשה מקיפה", company_label: "מנורה מבטחים", policy_number_masked: "••••4471", source: "מסלקה_פנסיונית", status: "פעיל", balance: 412350, premium: 2140, premium_frequency: "חודשית", track: "מסלול כללי" },
  ] },
  { key: "hishtalmut", label: "קרנות השתלמות", products: [
    { id: "h1", type_code: 8, type_label: "קרן השתלמות", company_label: "אלטשולר שחם", policy_number_masked: "••••9032", source: "מסלקה_פנסיונית", status: "פעיל", balance: 86200, track: "מניות" },
  ] },
  { key: "gemel", label: "קופות גמל", products: [
    { id: "g1", type_code: 4, type_label: "קופת גמל להשקעה", company_label: "מיטב", policy_number_masked: "••••1180", source: "מסלקה_פנסיונית", status: "פעיל", balance: 25400 },
  ] },
  { key: "insurance_life", label: "ביטוח חיים", products: [
    { id: "l1", type_code: 20, type_label: "ביטוח חיים (ריסק)", company_label: "הראל", policy_number_masked: "••••5520", source: "הר_הביטוח", status: "פעיל", premium: 96, premium_frequency: "חודשית", coverage: 1000000, start: "2019-03-01" },
  ] },
  { key: "insurance_health", label: "בריאות וסיעוד", products: [
    { id: "b1", type_code: 24, type_label: "ביטוח בריאות", company_label: "כלל ביטוח", policy_number_masked: "••••7718", source: "הר_הביטוח", status: "פעיל", premium: 210, premium_frequency: "חודשית", start: "2021-07-01" },
  ] },
];
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
        summary: { products: MOCK_PRODUCTS.reduce((n, c) => n + c.products.length, 0), categories: MOCK_PRODUCTS.map((c) => ({ key: c.key, label: c.label, count: c.products.length })) },
        session: { expires_at: expiresAt() },
      };
    },
    async portfolio() {
      await wait(); guard(); session();
      return { as_of: "2026-11-01", categories: MOCK_PRODUCTS };
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
  const code = body && typeof body === "object" && (body as { error?: { code?: unknown; tries_left?: unknown } }).error;
  const c = code && typeof code.code === "string" ? code.code : "";
  const left = code && typeof code.tries_left === "number" ? code.tries_left : undefined;
  if (status === 401) return new ClientApiError("unauthenticated");
  if (status === 503 && c === "inactive") return new ClientApiError("inactive");
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
    async logout() {
      try { await send("logout", { method: "POST", auth: true }); } catch { /* the server session may already be gone */ }
      store.clear();
    },
  };
}
