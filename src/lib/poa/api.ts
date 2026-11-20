// POA adapter: the interface the wizard talks to, an in-memory mock, and a typed stub for the real adapter.
//
// CONTRACT IS PROVISIONAL UNTIL PR 1: docs/product/POA-WIZARD.md (the ratified request/response contract, spec §6
// row 1) does not exist yet. The keys below are proposed from spec §3/§5 (snake_case, routes start / maslaka /
// harbit / policies / state / preview/:kind / doc/:kind) and must be reconciled when PR 1 lands.
//
// The mock keeps everything in memory (no browser storage, no network): "מהזיכרון במכשיר" in the spec
// means component state. Its only fetch is the same-origin font files for the draft PDF, and tests inject those.
import { POA_KINDS, POA_LIMITS, type PoaKind } from "./config";

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
  terms_privacy_approved: true;
  marketing_approved: boolean;
}
export interface StartRes { session_token: string; expires_at: string; modules: PoaModules; next: PoaNext }
export interface PreviewRes { pdf: Blob; preview_sha256: string }
export interface ConsentReq {
  preview_sha256: string;
  /** harbit: ISO yyyy-mm-dd */
  birth_date?: string;
  issue_date?: string;
  /** policies: PNG data URL of the drawn signature */
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
    async start(r) {
      await wait();
      guard("start");
      if (!r.terms_privacy_approved || !r.first_name || !r.last_name || !/^\d{9}$/.test(r.national_id) || !/^05\d{8}$/.test(r.phone)) {
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
      if (kind === "policies" && !/^data:image\/png;base64,/.test(r.signature_png ?? "")) throw new PoaApiError("generic");
      m.performed = true;
      const at = now().getTime();
      s.approvedAt[kind] = at;
      return {
        kind,
        method: kind === "policies" ? "signature" : "check",
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

/** The real adapter (poa-intake Edge Function) is not part of PR 2: every call throws until it is configured. */
export function createHttpPoaApi(): PoaApi {
  const no = (): never => { throw new Error("poa adapter not configured"); };
  return { start: async () => no(), preview: async () => no(), consent: async () => no(), state: async () => no(), doc: async () => no() };
}

/** Download file name (spec §4): poa-{kind}-{YYYYMMDD}.pdf */
export function poaFileName(kind: PoaKind, d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `poa-${kind}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.pdf`;
}
