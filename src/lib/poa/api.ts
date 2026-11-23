// POA adapter: the interface the wizard talks to, an in-memory mock, and the HTTP adapter for the poa-intake
// Edge Function (routes start / maslaka / harbit / policies / state / preview/:kind / doc/:kind, snake_case JSON).
//
// The mock keeps everything in memory (no browser storage, no network): "מהזיכרון במכשיר" in the spec
// means component state. Its only fetch is the same-origin font files for the draft PDF, and tests inject those.
// The HTTP adapter holds the session token in a closure variable only and sends it in the x-poa-session header.
import { SUPABASE_URL } from "@/integrations/supabase/config";
import { POA_INTAKE_URL, POA_KINDS, POA_LIMITS, type PoaKind } from "./config";

export type PoaNext = PoaKind | "done";
export type ErrorKind = "inactive" | "unavailable" | "generic" | "expired" | "locked" | "completed";
export const ERROR_KINDS: readonly ErrorKind[] = ["inactive", "unavailable", "generic", "expired", "locked", "completed"];

export interface PoaModuleState { enabled: boolean; required: boolean; performed: boolean }
export type PoaModules = Record<PoaKind, PoaModuleState>;

export interface StartReq {
  first_name: string;
  last_name: string;
  national_id: string;
  phone: string;
  email: string | null;
  /** street and house number, as on the ID card's slip (owner decision 2026-11-22: required) */
  street: string;
  city: string;
  /** 7 digits (filled in by the zip lookup when the address is known; always confirmed by the visitor) */
  zip: string;
  terms_privacy_approved: true;
  marketing_approved: boolean;
  /** Cloudflare Turnstile token (single use); absent or null when the widget is not configured. */
  turnstile_token?: string | null;
}
export interface StartRes { session_token: string; expires_at: string; modules: PoaModules; next: PoaNext }
export interface PreviewRes { pdf: Blob; preview_sha256: string }
export interface ConsentReq {
  preview_sha256: string;
  /** harbit: ISO yyyy-mm-dd */
  birth_date?: string;
  issue_date?: string;
  /** the drawn signature as a PNG data URL: required for policies, sent with every approval since 2026-11-23 (stamped on each final document) */
  signature_png?: string;
}
export interface ConsentRes {
  kind: PoaKind;
  method: "check" | "signature";
  approved_at: string;
  valid_until: string | null;
  modules: PoaModules;
  next: PoaNext;
}
export interface StateRes { status: "open" | "completed" | "expired" | "locked"; expires_at: string; modules: PoaModules; next: PoaNext }

/** Response keys per call, for the contract test (provisional until PR 1). */
export const POA_RESPONSE_KEYS = {
  start: ["session_token", "expires_at", "modules", "next"],
  consent: ["kind", "method", "approved_at", "valid_until", "modules", "next"],
  state: ["status", "expires_at", "modules", "next"],
  preview: ["pdf", "preview_sha256"],
  module: ["enabled", "required", "performed"],
} as const;

export class PoaApiError extends Error {
  constructor(public code: ErrorKind) { super(code); this.name = "PoaApiError"; }
}

/** Any thrown value to an error screen (spec ס8). Network failures read as "unavailable". */
export function errorKindOf(e: unknown): ErrorKind {
  if (e instanceof PoaApiError) return e.code;
  if (e instanceof TypeError) return "unavailable";
  return "generic";
}

export interface PoaApi {
  /** zip (מיקוד) for a street + house number and a city; null when unknown (the visitor types it). Never throws. */
  zip(q: { street: string; city: string }): Promise<string | null>;
  start(r: StartReq): Promise<StartRes>;
  preview(kind: PoaKind): Promise<PreviewRes>;
  consent(kind: PoaKind, r: ConsentReq): Promise<ConsentRes>;
  state(): Promise<StateRes>;
  doc(kind: PoaKind): Promise<Blob>;
}

/** First module still to do, in display order. */
export function nextOf(modules: PoaModules): PoaNext {
  return POA_KINDS.find((k) => modules[k].enabled && !modules[k].performed) ?? "done";
}

/** Blob bytes; FileReader fallback for environments whose Blob has no arrayBuffer() (jsdom). */
export function blobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(blob);
  });
}

async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blobBytes(blob);
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface MockOpts {
  now?: () => Date;
  /** fail mode, for the error screens: every call (or only `on`) throws PoaApiError(code) */
  fail?: { code: ErrorKind; on?: keyof PoaApi };
  /** modules the mock starts with (default: all three enabled, none performed) */
  modules?: Partial<Record<PoaKind, Partial<PoaModuleState>>>;
  /** font bytes for the draft PDF (tests; the browser fetches /fonts/Rubik-*.ttf) */
  fonts?: { regular: Uint8Array; bold: Uint8Array };
  /** artificial latency in ms, so the loading state is visible in the browser */
  delayMs?: number;
}

export function createMockPoaApi(opts: MockOpts = {}): PoaApi {
  const now = opts.now ?? (() => new Date());
  let session: { token: string; expiresAt: number; modules: PoaModules; approvedAt: Partial<Record<PoaKind, number>> } | null = null;
  const lastPreview: Partial<Record<PoaKind, string>> = {};

  const wait = () => (opts.delayMs ? new Promise((r) => setTimeout(r, opts.delayMs)) : Promise.resolve());
  const guard = (call: keyof PoaApi) => {
    if (opts.fail && (!opts.fail.on || opts.fail.on === call)) throw new PoaApiError(opts.fail.code);
  };
  const live = () => {
    if (!session) throw new PoaApiError("inactive");
    if (now().getTime() >= session.expiresAt) throw new PoaApiError("expired");
    return session;
  };
  const copyModules = (m: PoaModules): PoaModules =>
    Object.fromEntries(POA_KINDS.map((k) => [k, { ...m[k] }])) as PoaModules;
  const pdfFor = async (kind: PoaKind) => {
    const { draftPdf } = await import("./draftPdf");
    return draftPdf(kind, opts.fonts);
  };

  return {
    async zip(q) {
      await wait();
      // the mock "knows" every address with a house number: a synthetic zip made of its digits (never a real lookup)
      const digits = q.street.replace(/\D/g, "");
      return digits && q.city.trim() ? (digits + "0".repeat(7)).slice(0, 7) : null;
    },
    async start(r) {
      await wait();
      guard("start");
      if (!r.terms_privacy_approved || !r.first_name || !r.last_name || !/^\d{9}$/.test(r.national_id) || !/^05\d{8}$/.test(r.phone) || !r.street?.trim() || !r.city?.trim() || !/^\d{7}$/.test(r.zip ?? "")) {
        throw new PoaApiError("generic");
      }
      const modules = Object.fromEntries(POA_KINDS.map((k) => [k, { enabled: true, required: true, performed: false, ...opts.modules?.[k] }])) as PoaModules;
      session = { token: randomToken(), expiresAt: now().getTime() + POA_LIMITS.sessionMinutes * 60_000, modules, approvedAt: {} };
      return { session_token: session.token, expires_at: new Date(session.expiresAt).toISOString(), modules: copyModules(modules), next: nextOf(modules) };
    },
    async preview(kind) {
      await wait();
      guard("preview");
      const s = live();
      if (!s.modules[kind].enabled) throw new PoaApiError("generic");
      const pdf = await pdfFor(kind);
      const preview_sha256 = await sha256Hex(pdf);
      lastPreview[kind] = preview_sha256;
      return { pdf, preview_sha256 };
    },
    async consent(kind, r) {
      await wait();
      guard("consent");
      const s = live();
      const m = s.modules[kind];
      if (!m.enabled || m.performed) throw new PoaApiError("generic");
      // the server refuses an approval of anything but the last file it showed (spec §3)
      if (!lastPreview[kind] || r.preview_sha256 !== lastPreview[kind]) throw new PoaApiError("generic");
      if (kind === "harbit" && (!/^\d{4}-\d{2}-\d{2}$/.test(r.birth_date ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(r.issue_date ?? ""))) throw new PoaApiError("generic");
      // the signature is required for policies; any module may carry it (since 2026-11-23 the page sends the one signature with every approval)
      const signed = /^data:image\/png;base64,/.test(r.signature_png ?? "");
      if (r.signature_png !== undefined && !signed) throw new PoaApiError("generic");
      if (kind === "policies" && !signed) throw new PoaApiError("generic");
      m.performed = true;
      const at = now().getTime();
      s.approvedAt[kind] = at;
      return {
        kind,
        method: signed ? "signature" : "check",
        approved_at: new Date(at).toISOString(),
        valid_until: null, // from the approved template only (spec §4)
        modules: copyModules(s.modules),
        next: nextOf(s.modules),
      };
    },
    async state() {
      await wait();
      guard("state");
      if (!session) throw new PoaApiError("inactive");
      const expired = now().getTime() >= session.expiresAt;
      const next = nextOf(session.modules);
      return {
        status: expired ? "expired" : next === "done" ? "completed" : "open",
        expires_at: new Date(session.expiresAt).toISOString(),
        modules: copyModules(session.modules),
        next,
      };
    },
    async doc(kind) {
      await wait();
      guard("doc");
      if (!session) throw new PoaApiError("inactive");
      const at = session.approvedAt[kind];
      if (!at) throw new PoaApiError("generic");
      if (now().getTime() >= at + POA_LIMITS.downloadMinutes * 60_000) throw new PoaApiError("expired");
      return pdfFor(kind);
    },
  };
}

export interface HttpOpts {
  /** default: VITE_POA_INTAKE_URL, else `<SUPABASE_URL>/functions/v1/poa-intake` */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** per call, in ms */
  timeoutMs?: number;
}

const SESSION_HEADER = "x-poa-session";
/** The server names the hash of the PDF it just streamed in this header (first name wins, the second is accepted). */
const PREVIEW_HASH_HEADERS = ["x-preview-sha256", "x-poa-preview-sha256"] as const;

/**
 * An HTTP failure to an error screen (spec ס8). The server puts the screen in error.details.reason when it knows it;
 * otherwise the status decides.
 */
export function errorKindOfResponse(status: number, body: unknown): ErrorKind {
  const raw = (body as { error?: unknown } | null)?.error;
  // poa-intake answers {"error":"<kind>"}; the shared platform error shape carries it in error.details.reason
  if (typeof raw === "string" && (ERROR_KINDS as readonly string[]).includes(raw)) return raw as ErrorKind;
  const err = (raw && typeof raw === "object" ? raw : undefined) as { details?: { reason?: unknown; field?: unknown } } | undefined;
  const reason = err?.details?.reason;
  if (typeof reason === "string" && (ERROR_KINDS as readonly string[]).includes(reason)) return reason as ErrorKind;
  if (status === 423 || status === 503 || status === 502 || status === 504) return "unavailable";
  if (status === 401 || status === 404) return "inactive";
  if (status === 410) return "expired";
  if (status === 429) return "locked";
  if (status === 409) return "completed";
  if (status === 403) return err?.details?.field ? "generic" : "locked"; // a refused origin or Turnstile check is not a lock
  if (status >= 500) return "unavailable";
  return "generic";
}

/** The real adapter: talks to the poa-intake Edge Function. No cookies, no browser storage, no logging. */
export function createHttpPoaApi(opts: HttpOpts = {}): PoaApi {
  const base = (opts.baseUrl ?? (POA_INTAKE_URL || `${SUPABASE_URL}/functions/v1/poa-intake`)).replace(/\/+$/, "");
  const timeoutMs = opts.timeoutMs ?? 30_000;
  let token: string | null = null;

  const send = async (path: string, init: { method: "GET" | "POST"; body?: unknown; session?: boolean }): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (init.session) {
      if (!token) throw new PoaApiError("inactive");
      headers[SESSION_HEADER] = token;
    }
    if (init.body !== undefined) headers["content-type"] = "application/json";
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
    let res: Response;
    try {
      const f = opts.fetchImpl ?? fetch;
      res = await f(`${base}/${path}`, {
        method: init.method,
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal: ctl?.signal,
      });
    } catch {
      throw new PoaApiError("unavailable"); // network failure, timeout or a blocked request
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch { /* no usable body: the status decides */ }
      throw new PoaApiError(errorKindOfResponse(res.status, body));
    }
    return res;
  };

  const json = async <T>(res: Response): Promise<T> => {
    try { return (await res.json()) as T; } catch { throw new PoaApiError("generic"); }
  };

  return {
    async zip(q) {
      try {
        const p = new URLSearchParams({ street: q.street, city: q.city });
        const res = await json<{ zip?: unknown }>(await send(`zip?${p.toString()}`, { method: "GET" }));
        return typeof res?.zip === "string" && /^\d{7}$/.test(res.zip) ? res.zip : null;
      } catch {
        return null; // best effort: the visitor types the zip
      }
    },
    async start(r) {
      const res = await json<StartRes>(await send("start", { method: "POST", body: r }));
      if (typeof res?.session_token !== "string" || !res.session_token || typeof res.modules !== "object") throw new PoaApiError("generic");
      token = res.session_token;
      return res;
    },
    async preview(kind) {
      const res = await send(`preview/${kind}`, { method: "GET", session: true });
      const hash = PREVIEW_HASH_HEADERS.map((h) => res.headers.get(h)).find((v) => !!v) ?? "";
      if (!/^[0-9a-f]{64}$/.test(hash)) throw new PoaApiError("generic");
      return { pdf: await res.blob(), preview_sha256: hash };
    },
    async consent(kind, r) {
      return json<ConsentRes>(await send(kind, { method: "POST", body: r, session: true }));
    },
    async state() {
      return json<StateRes>(await send("state", { method: "GET", session: true }));
    },
    async doc(kind) {
      return (await send(`doc/${kind}`, { method: "GET", session: true })).blob();
    },
  };
}

/** Download file name (spec §4): poa-{kind}-{YYYYMMDD}.pdf */
export function poaFileName(kind: PoaKind, d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `poa-${kind}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.pdf`;
}
