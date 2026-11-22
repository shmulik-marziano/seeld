// Client for the tool's public page API (the calls its own /app/p/<urlId> page makes). Server to server only: that host
// blocks foreign browsers by CORS, and the wizard never talks to it (spec 1א).
// Rules (mirrors _shared/surense/client.ts): HTTPS only, host allowlist = api.surense.com + the dp host (a bare hostname,
// validated), no redirects followed (any 3xx refused), 15 s timeout per call, no Authorization header, no cookies.
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

export interface DpClient {
  /** POST JSON; resolves to the parsed JSON object (or {} for an empty / non-object body) */
  post(route: DpRoute, body: Record<string, unknown>, ref: string | null): Promise<Record<string, unknown>>;
  /** the preview PDF for one module */
  preview(sid: string, flag: PreviewFlag, ref: string | null): Promise<Uint8Array>;
  /** the exact hosts this client may reach */
  readonly allowedHosts: readonly string[];
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

  async function call(op: string, ref: string | null, init: RequestInit, url: string, write: boolean): Promise<Response> {
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
        res = await doFetch(url, { redirect: "manual", credentials: "omit", ...init, signal: ctrl.signal });
      } catch {
        ambiguous = write;
        throw new PoaToolError("unavailable", ctrl.signal.aborted ? "dp_timeout" : "dp_network", write);
      }
      status = res.status;
      o.log.info("poa dp call", { op, status, ms: Date.now() - started });
      if (isRedirect(res)) {
        await res.body?.cancel();
        throw new PoaToolError("unavailable", "dp_redirect_refused");
      }
      if (!res.ok) {
        await res.body?.cancel();
        if (write && AMBIGUOUS_STATUSES.includes(res.status)) ambiguous = true;
        throw new PoaToolError(kindFromToolStatus(res.status), `dp_http_${res.status}`, ambiguous);
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
    async post(route, body, ref) {
      const r = DP_ROUTES[route];
      const res = await call(r.op, ref, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
      }, urlFor(r.path), true);
      const text = await res.text();
      try {
        const j = text ? JSON.parse(text) : {};
        return j && typeof j === "object" && !Array.isArray(j) ? j as Record<string, unknown> : {};
      } catch {
        return {};
      }
    },
    async preview(sid, flag, ref) {
      const res = await call(PREVIEW_OP, ref, { method: "GET", headers: { accept: "application/pdf" } }, urlFor(PREVIEW_PATH, { [flag]: "true", sid }), false);
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
