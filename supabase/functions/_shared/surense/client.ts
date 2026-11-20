// Host-locked Surense HTTP client. Every call goes to https://api.surense.com/api/v1 (no other host is reachable through
// this module: relative paths are validated, absolute URLs must be on ALLOWED_HOSTS). 15 s timeout per attempt, at most
// maxAttempts (default 3) attempts with backoff (500 ms, 2 s; a retry-after is honoured only up to MAX_INLINE_WAIT_MS,
// a longer one ends the call so the caller can schedule it) on 429/502/503/504, and on network or timeout failures for
// idempotent calls only. A write (non-idempotent) is retried only on 429, which Surense answers before doing anything;
// never on a timeout. A 401 drops the token and retries once with a fresh one.
// surense-worker uses maxAttempts 1: the queue (api.surense_job_complete) is the only retry layer for jobs, and the
// SurenseError it gets carries kind + retryAfterSec for the DB to schedule the next attempt.
// Audited calls (opts.audit) write a 'pending' audit row BEFORE the request (if that write fails the request is not
// sent) and a 'result' row after it; a write that times out or fails on the network / 502 / 504 is flagged
// `ambiguous` (it may have taken effect) and audited as 'ambiguous'.
// Redirects are never followed (redirect: "manual" + any 3xx refused): a Location on another host would get the body
// or the bearer token, which breaks the host lock.
// Logs: method, path template (ids replaced), status, duration, attempt. Never a body, a query value or a token.
// Writes (opts.audit) leave one audit row through the injected sink: op name, Surense id, HTTP status. No values.
import type { FetchFn } from "../db.ts";
import type { Logger } from "../logger.ts";
import type { TokenSource } from "./auth.ts";
import { SurenseError, fromResponse } from "./errors.ts";

export const SURENSE_HOST = "api.surense.com";
export const SURENSE_ORIGIN = `https://${SURENSE_HOST}`;
export const SURENSE_API = `${SURENSE_ORIGIN}/api/v1`;
// TODO(owner): pre-signed upload/download URLs (documents/upload/initiate, data-import/initiate, e9100/download files,
// documents/urls) are probably on another host (S3/CDN; UNKNOWN until the first real response). They stay refused until
// the owner approves the exact host(s) and they are added here.
export const ALLOWED_HOSTS: readonly string[] = [SURENSE_HOST];
export const RETRY_STATUSES: readonly number[] = [429, 502, 503, 504];
export const TIMEOUT_MS = 15_000;
export const MAX_ATTEMPTS = 3;
export const BACKOFF_MS: readonly number[] = [500, 2000];
/** longest in-client wait between attempts (far below the worker's 2-minute job lease and the sync wall clock) */
export const MAX_INLINE_WAIT_MS = 5_000;
/** statuses after which a write may already have been applied upstream (the gateway may have forwarded it) */
const AMBIGUOUS_WRITE_STATUSES: readonly number[] = [502, 504];

const PATH = /^\/[A-Za-z0-9_.\-/]*$/;
const UUID_SEG = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;
const NUM_SEG = /\/\d+(?=\/|$)/g;

export type Query = Record<string, string | number | boolean | null | undefined>;

/** Absolute URL under SURENSE_API for a relative API path; refuses anything that could leave the host. */
export function apiUrl(path: string, query?: Query): string {
  if (!PATH.test(path) || path.includes("..") || path.includes("//")) throw new SurenseError(0, "bad_path", "config");
  const u = new URL(SURENSE_API + path);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  if (u.origin !== SURENSE_ORIGIN || !u.pathname.startsWith("/api/v1/")) throw new SurenseError(0, "host_not_allowed", "config");
  return u.href;
}

/** An absolute URL handed back by Surense (upload/download links): https and an allowlisted host, or refused. */
export function assertAllowedUrl(raw: string, hosts: readonly string[] = ALLOWED_HOSTS): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new SurenseError(0, "bad_url", "config");
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port || !hosts.includes(u.hostname.toLowerCase())) {
    throw new SurenseError(0, "host_not_allowed", "config");
  }
  return u;
}

/** "/customers/<uuid>/portfolio" -> "/customers/{id}/portfolio" (log label; ids are not PII but keep lines uniform) */
export function pathLabel(path: string): string {
  return path.replace(UUID_SEG, "/{id}").replace(NUM_SEG, "/{n}").slice(0, 120);
}

export type AuditPhase = "pending" | "result" | "ambiguous";
/** status: null for 'pending', the HTTP status (0 = no response) otherwise */
export type AuditSink = (op: string, ref: string | null, status: number | null, phase: AuditPhase) => Promise<void>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  body?: unknown;
  query?: Query;
  /** default: GET = true, everything else false. Searches and reads sent as POST set it explicitly. */
  idempotent?: boolean;
  /** write audit: op name (e.g. "customers.create"); the audit row carries op + ref + status only */
  audit?: string;
  auditRef?: string | null;
}

export interface SurenseClient {
  /** JSON call; resolves to the parsed body (null for an empty body). */
  request<T>(path: string, opts?: RequestOptions): Promise<T>;
  /** Raw call (same lock/retry/timeout/auth); resolves to an OK Response with its body unread. */
  surenseFetch(path: string, init?: RequestOptions & { headers?: Record<string, string>; rawBody?: BodyInit }): Promise<Response>;
  /** PUT bytes to a pre-signed upload URL (host-locked, no Authorization header, no retry). */
  putUpload(url: string, bytes: Uint8Array, contentType: string): Promise<number>;
  /** GET a file link handed back by Surense (host-locked; bearer only on api.surense.com; size-capped). */
  downloadFile(url: string, maxBytes?: number): Promise<{ bytes: Uint8Array; mime: string | null }>;
}

export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

export interface ClientOptions {
  tokens: TokenSource;
  log: Logger;
  fetch?: FetchFn;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
  maxAttempts?: number;
  /** pacing between calls from this client (rate limits are undocumented) */
  minIntervalMs?: number;
  audit?: AuditSink;
  allowedHosts?: readonly string[];
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** a 3xx (or the opaque form some runtimes return for redirect: "manual") */
export function isRedirect(res: Response): boolean {
  return res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400);
}

export function createSurenseClient(o: ClientOptions): SurenseClient {
  const doFetch = o.fetch ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const now = o.now ?? Date.now;
  const timeoutMs = o.timeoutMs ?? TIMEOUT_MS;
  const maxAttempts = Math.max(1, o.maxAttempts ?? MAX_ATTEMPTS);
  let lastCall = 0;

  const pace = async () => {
    const gap = (o.minIntervalMs ?? 0) - (now() - lastCall);
    if (gap > 0) await sleep(gap);
    lastCall = now();
  };

  async function once(url: string, init: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await doFetch(url, { redirect: "manual", ...init, signal: ctrl.signal });
    } catch {
      throw new SurenseError(0, ctrl.signal.aborted ? "timeout" : "network", "unavailable");
    } finally {
      clearTimeout(timer);
    }
    if (isRedirect(res)) {
      await res.body?.cancel();
      throw new SurenseError(res.status, "redirect_refused", "config");
    }
    return res;
  }

  async function surenseFetch(
    path: string,
    opts: RequestOptions & { headers?: Record<string, string>; rawBody?: BodyInit } = {},
  ): Promise<Response> {
    const method = opts.method ?? "GET";
    const idempotent = opts.idempotent ?? method === "GET";
    const url = apiUrl(path, opts.query);
    const label = pathLabel(path);
    const body = opts.rawBody ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body));
    let refreshed = false;
    let lastErr: SurenseError | null = null;
    let status = 0;
    let ambiguous = false;

    // the audit row exists before anything leaves: no audit, no write
    if (opts.audit && o.audit) {
      try {
        await o.audit(opts.audit, opts.auditRef ?? null, null, "pending");
      } catch {
        o.log.warn("surense audit write failed; request not sent", { op: opts.audit });
        throw new SurenseError(0, "audit_failed", "unavailable");
      }
    }

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1 && lastErr) {
          const wait = lastErr.retryAfterSec !== null ? lastErr.retryAfterSec * 1000 : BACKOFF_MS[Math.min(attempt - 2, BACKOFF_MS.length - 1)];
          // a long retry-after is the caller's to schedule (queue backoff / 429 to the staff caller), never slept here
          if (wait > MAX_INLINE_WAIT_MS) throw lastErr;
          await sleep(wait);
        }
        await pace();
        let token: string;
        try {
          token = await o.tokens.get();
        } catch (e) {
          lastErr = e instanceof SurenseError ? e : new SurenseError(0, "token", "auth");
          if (lastErr.retryable && attempt < maxAttempts) continue;
          throw lastErr;
        }
        const started = now();
        let res: Response;
        try {
          res = await once(url, {
            method,
            headers: {
              authorization: `Bearer ${token}`,
              accept: "application/json",
              ...(body !== undefined && !opts.rawBody ? { "content-type": "application/json" } : {}),
              ...(opts.headers ?? {}),
            },
            body,
          });
        } catch (e) {
          lastErr = e as SurenseError;
          o.log.warn("surense call failed", { method, path: label, code: lastErr.code, attempt, ms: now() - started });
          // network/timeout retry for reads; a refused redirect (config) never retries
          if (idempotent && lastErr.retryable && attempt < maxAttempts) continue;
          // a write that timed out or lost its connection may have been applied: never retried, flagged for the caller
          if (!idempotent && lastErr.kind === "unavailable") {
            ambiguous = true;
            lastErr = lastErr.asAmbiguous();
          }
          throw lastErr;
        }
        status = res.status;
        o.log.info("surense call", { method, path: label, status, attempt, ms: now() - started });
        if (res.ok) return res;
        const text = await res.text();
        if (res.status === 401 && !refreshed) {
          refreshed = true;
          o.tokens.invalidate();
          lastErr = null;
          attempt--; // the token retry does not use up an attempt
          continue;
        }
        lastErr = fromResponse(res, text);
        if (res.status === 401) o.tokens.invalidate();
        if (RETRY_STATUSES.includes(res.status) && (idempotent || res.status === 429) && attempt < maxAttempts) continue;
        if (!idempotent && AMBIGUOUS_WRITE_STATUSES.includes(res.status)) {
          ambiguous = true;
          lastErr = lastErr.asAmbiguous();
        }
        throw lastErr;
      }
      throw lastErr ?? new SurenseError(0, "exhausted", "unavailable");
    } finally {
      // closing row (status 0 = no response: never sent, e.g. token failure, or timed out)
      if (opts.audit && o.audit) {
        await o.audit(opts.audit, opts.auditRef ?? null, status, ambiguous ? "ambiguous" : "result").catch(() => {
          o.log.warn("surense audit write failed", { op: opts.audit });
        });
      }
    }
  }

  return {
    surenseFetch,
    async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
      const res = await surenseFetch(path, opts);
      const text = await res.text();
      if (!text) return null as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new SurenseError(res.status, "bad_json", "permanent");
      }
    },
    async putUpload(url: string, bytes: Uint8Array, contentType: string): Promise<number> {
      const u = assertAllowedUrl(url, o.allowedHosts ?? ALLOWED_HOSTS);
      const started = now();
      const res = await once(u.href, { method: "PUT", headers: { "content-type": contentType }, body: bytes });
      await res.body?.cancel();
      o.log.info("surense upload", { host: u.hostname, status: res.status, ms: now() - started, bytes: bytes.byteLength });
      if (!res.ok) throw new SurenseError(res.status, `http_${res.status}`, res.status >= 500 ? "unavailable" : "permanent");
      return res.status;
    },
    async downloadFile(url: string, maxBytes = MAX_DOWNLOAD_BYTES) {
      const u = assertAllowedUrl(url, o.allowedHosts ?? ALLOWED_HOSTS);
      const headers: Record<string, string> = {};
      if (u.hostname === SURENSE_HOST) headers.authorization = `Bearer ${await o.tokens.get()}`;
      const started = now();
      const res = await once(u.href, { method: "GET", headers });
      o.log.info("surense download", { host: u.hostname, status: res.status, ms: now() - started });
      if (!res.ok) {
        await res.body?.cancel();
        throw new SurenseError(res.status, `http_${res.status}`, res.status === 429 || res.status >= 502 ? "unavailable" : "permanent");
      }
      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared > maxBytes) {
        await res.body?.cancel();
        throw new SurenseError(res.status, "file_too_large", "permanent");
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > maxBytes) throw new SurenseError(res.status, "file_too_large", "permanent");
      const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      return { bytes, mime: /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(mime) ? mime : null };
    },
  };
}
