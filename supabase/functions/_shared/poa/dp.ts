// Client for the tool's public page API (the calls its own /app/p/<urlId> page makes). Server to server only: that host
// blocks foreign browsers by CORS, and the wizard never talks to it (spec 1א).
// Rules (mirrors _shared/surense/client.ts): HTTPS only, host allowlist = api.surense.com + the dp host (a bare hostname,
// validated), no redirects followed (any 3xx refused), 15 s timeout per call, no Authorization header.
// Cookies: the tool keeps the page session in COOKIES (verified 2026-11-22 in the page bundle: axios `withCredentials: true`
// with the XSRF-TOKEN cookie echoed as X-XSRF-TOKEN; without them `start` answers 400 "אין session או session פג תוקף").
// The browser's automatic cookie jar is replaced by an explicit one per wizard session (`DpJar`): Set-Cookie headers of
// every answer are merged into it, it is sent back as `Cookie` (+ `X-XSRF-TOKEN`) on every later call, and the engine
// keeps it inside the encrypted engine reference between poa-intake requests. Never logged.
// Every call leaves audit rows through the injected sink (op + Surense customer id or null + status; phases pending ->
// result | ambiguous), written BEFORE the request leaves (no audit, no call). Logs: op, status, duration; never a body,
// a url or an id.
// Routes, base path and the preview shape verified 2026-11-22 (owner's full run); they are single constants below.
// Responses are {nextStep, sid}; the policies answer also carries the pre-signed final-document links. Bodies are read
// defensively (only `sid`, the three links and the PDF bytes are used).
import type { FetchFn } from "../db.ts";
import type { Logger } from "../logger.ts";
import { assertAllowedUrl, type AuditSink, isRedirect, SURENSE_HOST, TIMEOUT_MS } from "../surense/client.ts";
import { PoaToolError, kindFromToolStatus } from "./errors.ts";

export const DP_ROUTES = {
  load: { path: "proxies/load", op: "poa.dp.load" },
  start: { path: "proxies/start", op: "poa.dp.start" },
  swiftness: { path: "proxies/swiftness", op: "poa.dp.swiftness" },
  hb: { path: "proxies/hb", op: "poa.dp.hb" },
  policies: { path: "proxies/policies", op: "poa.dp.policies" },
} as const;
export type DpRoute = keyof typeof DP_ROUTES;

/** verified 2026-11-22: GET proxies_preview?sw=true|hb=true|p=true&sid=<sid> answers the (unsigned) preview PDF. */
export const PREVIEW_PATH = "proxies_preview";
export const PREVIEW_OP = "poa.dp.preview";
export type PreviewFlag = "sw" | "hb" | "p";

export const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
const HOST = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
const BASE = /^(\/[A-Za-z0-9_.-]+){0,4}$/;
/** statuses after which a write may already have been applied */
const AMBIGUOUS_STATUSES = [502, 504];

export interface DpClientOptions {
  host: string;
  basePath: string;
  log: Logger;
  fetch?: FetchFn;
  audit?: AuditSink;
  timeoutMs?: number;
}

/** The tool's page-session cookies for one wizard session, as one `Cookie` header value ("a=1; b=2"); mutated by every call. */
export interface DpJar {
  cookie: string;
}
/** the jar never grows past what the encrypted engine reference may hold (api.poa_engine_ref_set: 2000 bytes in all) */
export const MAX_JAR_CHARS = 1200;
/** the origin of the tool's own page: the page API checks it for cookie-bearing calls as a browser would send it */
export const DP_PAGE_ORIGIN = "https://surense.com";

export interface DpClient {
  /** POST JSON; resolves to the parsed JSON object (or {} for an empty / non-object body). `jar` sends and collects cookies. */
  post(route: DpRoute, body: Record<string, unknown>, ref: string | null, jar?: DpJar): Promise<Record<string, unknown>>;
  /** the preview PDF for one module */
  preview(sid: string, flag: PreviewFlag, ref: string | null, jar?: DpJar): Promise<Uint8Array>;
  /** the exact hosts this client may reach */
  readonly allowedHosts: readonly string[];
}

/** "a=1; b=2" -> Map; keeps the first value of a repeated name */
export function parseJar(cookie: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const part of (cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const name = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (name && !m.has(name)) m.set(name, value);
  }
  return m;
}

/** merges every Set-Cookie of an answer into the jar (a Max-Age<=0 or past Expires removes the cookie); attributes are dropped */
export function mergeSetCookies(jar: DpJar, res: Response, now: number = Date.now()): void {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  const lines = typeof h.getSetCookie === "function" ? h.getSetCookie() : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie") as string] : []);
  if (!lines.length) return;
  const m = parseJar(jar.cookie);
  for (const line of lines) {
    const [pair, ...attrs] = line.split(";");
    const i = pair.indexOf("=");
    if (i <= 0) continue;
    const name = pair.slice(0, i).trim();
    const value = pair.slice(i + 1).trim();
    if (!name) continue;
    let expired = false;
    for (const a of attrs) {
      const [k, v = ""] = a.split("=").map((s) => s.trim());
      if (/^max-age$/i.test(k) && Number(v) <= 0) expired = true;
      if (/^expires$/i.test(k)) { const t = Date.parse(v); if (!Number.isNaN(t) && t <= now) expired = true; }
    }
    if (expired || value === "") m.delete(name);
    else m.set(name, value);
  }
  const joined = [...m].map(([k, v]) => `${k}=${v}`).join("; ");
  jar.cookie = joined.length > MAX_JAR_CHARS ? jar.cookie : joined;
}

/** request headers a browser would add for this jar: Cookie, and X-XSRF-TOKEN from the XSRF-TOKEN cookie (axios behaviour) */
export function jarHeaders(jar: DpJar | undefined): Record<string, string> {
  if (!jar || !jar.cookie) return {};
  const out: Record<string, string> = { cookie: jar.cookie };
  const xsrf = parseJar(jar.cookie).get("XSRF-TOKEN");
  if (xsrf) {
    try { out["x-xsrf-token"] = decodeURIComponent(xsrf); } catch { out["x-xsrf-token"] = xsrf; }
  }
  return out;
}

/**
 * Short, value-free reason of a refused dp call: `error.code`, else `error.displayMessage`, else `message`, with e-mails,
 * digit runs and anything but letters/digits/underscores dropped, at most 60 chars. Empty when the body has none.
 */
export async function dpReason(res: Response): Promise<string> {
  let text = "";
  try {
    text = (await res.text()).slice(0, 4096);
  } catch {
    return "";
  }
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    return "";
  }
  const o = j && typeof j === "object" ? j as Record<string, unknown> : {};
  const err = o.error && typeof o.error === "object" ? o.error as Record<string, unknown> : {};
  const raw = [err.code, err.displayMessage, err.message, o.message].find((v) => typeof v === "string" && v.trim());
  if (typeof raw !== "string") return "";
  return raw.replace(/\S+@\S+/g, "").replace(/\d{4,}/g, "").replace(/[^\p{L}\p{N}_]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60);
}

/** a bare hostname with at least one dot: no scheme, port, path, credentials or IP-literal tricks */
export function isBareHost(h: string): boolean {
  return HOST.test(h) && !/^[0-9.]+$/.test(h);
}

export function createDpClient(o: DpClientOptions): DpClient {
  const host = o.host.trim().toLowerCase();
  if (!isBareHost(host)) throw new PoaToolError("unavailable", "bad_dp_host");
  if (!BASE.test(o.basePath) || o.basePath.split("/").some((x) => x === "." || x === "..")) throw new PoaToolError("unavailable", "bad_dp_base");
  const allowed: readonly string[] = [SURENSE_HOST, host];
  const doFetch = o.fetch ?? fetch;
  const timeoutMs = o.timeoutMs ?? TIMEOUT_MS;

  function urlFor(path: string, query?: Record<string, string>): string {
    const u = new URL(`https://${host}${o.basePath}/${path}`);
    for (const [k, v] of Object.entries(query ?? {})) u.searchParams.set(k, v);
    assertAllowedUrl(u.href, allowed); // throws SurenseError(config) for any host outside the list
    return u.href;
  }

  async function call(op: string, ref: string | null, init: RequestInit, url: string, write: boolean, jar?: DpJar): Promise<Response> {
    if (o.audit) {
      try {
        await o.audit(op, ref, null, "pending");
      } catch {
        o.log.warn("poa dp audit write failed; request not sent", { op });
        throw new PoaToolError("unavailable", "audit_failed");
      }
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const started = Date.now();
    let status = 0;
    let ambiguous = false;
    try {
      let res: Response;
      try {
        // the jar replaces the browser's cookie store: credentials stay "omit" so nothing is sent or kept implicitly
        const headers = { ...(init.headers as Record<string, string>), origin: DP_PAGE_ORIGIN, ...jarHeaders(jar) };
        res = await doFetch(url, { redirect: "manual", credentials: "omit", ...init, headers, signal: ctrl.signal });
      } catch {
        ambiguous = write;
        throw new PoaToolError("unavailable", ctrl.signal.aborted ? "dp_timeout" : "dp_network", write);
      }
      status = res.status;
      if (jar) mergeSetCookies(jar, res);
      o.log.info("poa dp call", { op, status, ms: Date.now() - started, cookies: jar ? parseJar(jar.cookie).size : 0 });
      if (isRedirect(res)) {
        await res.body?.cancel();
        throw new PoaToolError("unavailable", "dp_redirect_refused");
      }
      if (!res.ok) {
        // the tool answers {error: {code, displayMessage}} (its own page shows displayMessage); the reason joins the
        // code so a refusal is diagnosable from the log, after stripping anything that could be a value
        const reason = await dpReason(res);
        if (write && AMBIGUOUS_STATUSES.includes(res.status)) ambiguous = true;
        throw new PoaToolError(kindFromToolStatus(res.status), `dp_http_${res.status}${reason ? `_${reason}` : ""}`, ambiguous);
      }
      return res;
    } finally {
      clearTimeout(timer);
      if (o.audit) {
        await o.audit(op, ref, status, ambiguous ? "ambiguous" : "result").catch(() => {
          o.log.warn("poa dp audit write failed", { op });
        });
      }
    }
  }

  return {
    allowedHosts: allowed,
    async post(route, body, ref, jar) {
      const r = DP_ROUTES[route];
      const res = await call(r.op, ref, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
      }, urlFor(r.path), true, jar);
      const text = await res.text();
      try {
        const j = text ? JSON.parse(text) : {};
        return j && typeof j === "object" && !Array.isArray(j) ? j as Record<string, unknown> : {};
      } catch {
        return {};
      }
    },
    async preview(sid, flag, ref, jar) {
      const res = await call(PREVIEW_OP, ref, { method: "GET", headers: { accept: "application/pdf" } }, urlFor(PREVIEW_PATH, { [flag]: "true", sid }), false, jar);
      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared > MAX_PREVIEW_BYTES) {
        await res.body?.cancel();
        throw new PoaToolError("generic", "dp_pdf_too_large");
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_PREVIEW_BYTES) throw new PoaToolError("generic", "dp_pdf_too_large");
      if (bytes.byteLength < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") throw new PoaToolError("generic", "dp_not_pdf");
      return bytes;
    },
  };
}
