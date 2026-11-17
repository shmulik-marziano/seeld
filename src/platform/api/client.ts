// Typed fetch client for the future /api/v1. Not used by any page yet.
// Features: base URL, auth header injection, per-request timeout, retries with backoff,
// normalised errors, request ids (x-request-id) and optional zod response validation.
import type { ZodType } from "zod";
import { ApiError, normalizeHttpError, normalizeThrown } from "./errors";
import { DEFAULT_RETRY, isRetryAllowed, withRetry, type RetryPolicy } from "./retry";

export type AuthTokenProvider = () => Promise<string | null | undefined> | string | null | undefined;

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns a bearer token (user JWT) or null for anonymous calls. */
  getToken?: AuthTokenProvider;
  /** Optional static API key for server-to-server use (header x-api-key). Never ship in a browser bundle. */
  apiKey?: string;
  timeoutMs?: number;
  retry?: Partial<RetryPolicy>;
  fetchImpl?: typeof fetch;
  makeRequestId?: () => string;
  onRetry?: (info: { attempt: number; delayMs: number; error: ApiError; path: string }) => void;
  sleep?: (ms: number) => Promise<void>;
}

export interface RequestOptions<T = unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Enables retries for POST/PATCH. */
  idempotencyKey?: string;
  schema?: ZodType<T>;
  anonymous?: boolean;
}

export function defaultRequestId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function buildUrl(baseUrl: string, path: string, query?: RequestOptions["query"]): string {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null) qs.set(k, String(v));
  const s = qs.toString();
  return `${base}${p}${s ? `?${s}` : ""}`;
}

export class ApiClient {
  private readonly opts: ApiClientOptions;
  private readonly policy: RetryPolicy;

  constructor(opts: ApiClientOptions) {
    this.opts = opts;
    this.policy = { ...DEFAULT_RETRY, ...opts.retry };
  }

  async request<T = unknown>(path: string, o: RequestOptions<T> = {}): Promise<T> {
    const method = o.method ?? "GET";
    const requestId = (this.opts.makeRequestId ?? defaultRequestId)();
    const url = buildUrl(this.opts.baseUrl, path, o.query);
    const doFetch = this.opts.fetchImpl ?? fetch;
    const timeoutMs = o.timeoutMs ?? this.opts.timeoutMs ?? 15_000;

    return withRetry(
      async () => {
        const headers: Record<string, string> = { accept: "application/json", "x-request-id": requestId, ...o.headers };
        if (!o.anonymous) {
          const token = await this.opts.getToken?.();
          if (token) headers.authorization = `Bearer ${token}`;
        }
        if (this.opts.apiKey) headers["x-api-key"] = this.opts.apiKey;
        if (o.idempotencyKey) headers["idempotency-key"] = o.idempotencyKey;
        let body: string | undefined;
        if (o.body !== undefined) {
          body = JSON.stringify(o.body);
          headers["content-type"] = "application/json";
        }

        const ctrl = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          ctrl.abort();
        }, timeoutMs);
        const onAbort = () => ctrl.abort();
        o.signal?.addEventListener("abort", onAbort);
        try {
          const res = await doFetch(url, { method, headers, body, signal: ctrl.signal });
          const text = await res.text();
          let parsed: unknown = undefined;
          if (text) {
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = text;
            }
          }
          if (!res.ok) throw normalizeHttpError(res.status, parsed, res.headers);
          if (o.schema) {
            const v = o.schema.safeParse(parsed);
            if (!v.success) {
              throw new ApiError({
                code: "internal",
                message: "Response did not match the expected schema",
                status: res.status,
                requestId,
                details: v.error.issues.slice(0, 5),
              });
            }
            return v.data;
          }
          return parsed as T;
        } catch (e) {
          throw normalizeThrown(e, { timedOut, requestId });
        } finally {
          clearTimeout(timer);
          o.signal?.removeEventListener("abort", onAbort);
        }
      },
      {
        policy: this.policy,
        allowed: isRetryAllowed(method, Boolean(o.idempotencyKey)),
        sleep: this.opts.sleep,
        onRetry: (i) => this.opts.onRetry?.({ ...i, path }),
      },
    );
  }

  get<T = unknown>(path: string, o: Omit<RequestOptions<T>, "method" | "body"> = {}) {
    return this.request<T>(path, { ...o, method: "GET" });
  }
  post<T = unknown>(path: string, body?: unknown, o: Omit<RequestOptions<T>, "method" | "body"> = {}) {
    return this.request<T>(path, { ...o, method: "POST", body });
  }
}
