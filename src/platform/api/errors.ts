// Normalised API error. Every failure in the platform API client becomes an ApiError.
// Wire format (server side, see supabase/functions/_shared/errors.ts):
//   { "error": { "code": "rate_limited", "message": "...", "requestId": "...", "details": {...} } }

export type ApiErrorCode =
  | "bad_request"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_failed"
  | "rate_limited"
  | "internal"
  | "unavailable"
  | "timeout"
  | "network"
  | "aborted"
  | "unknown";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: unknown;
  readonly retryAfterMs?: number;

  constructor(init: {
    code: ApiErrorCode;
    message: string;
    status?: number;
    requestId?: string;
    details?: unknown;
    retryAfterMs?: number;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.status = init.status ?? 0;
    this.requestId = init.requestId;
    this.details = init.details;
    this.retryAfterMs = init.retryAfterMs;
  }

  /** Safe to retry automatically (idempotent semantics are the caller's responsibility). */
  get retryable(): boolean {
    return ["rate_limited", "unavailable", "timeout", "network", "internal"].includes(this.code);
  }
}

export function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation_failed";
  if (status === 429) return "rate_limited";
  if (status === 502 || status === 503 || status === 504) return "unavailable";
  if (status >= 500) return "internal";
  return "unknown";
}

/** Parse Retry-After (seconds or HTTP date) into milliseconds. */
export function parseRetryAfter(value: string | null | undefined, now: number = Date.now()): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const when = Date.parse(value);
  return Number.isNaN(when) ? undefined : Math.max(0, when - now);
}

/** Build an ApiError from an HTTP status and an already-parsed (or raw text) body. */
export function normalizeHttpError(
  status: number,
  body: unknown,
  headers?: { get(name: string): string | null },
): ApiError {
  const env = body && typeof body === "object" ? (body as { error?: unknown }).error : undefined;
  const requestId = headers?.get("x-request-id") ?? undefined;
  const retryAfterMs = parseRetryAfter(headers?.get("retry-after"));
  if (env && typeof env === "object") {
    const e = env as { code?: unknown; message?: unknown; requestId?: unknown; details?: unknown };
    const known = typeof e.code === "string" ? (e.code as ApiErrorCode) : codeFromStatus(status);
    return new ApiError({
      code: known,
      message: typeof e.message === "string" ? e.message : `HTTP ${status}`,
      status,
      requestId: typeof e.requestId === "string" ? e.requestId : requestId,
      details: e.details,
      retryAfterMs,
    });
  }
  return new ApiError({
    code: codeFromStatus(status),
    message: typeof body === "string" && body ? body.slice(0, 200) : `HTTP ${status}`,
    status,
    requestId,
    retryAfterMs,
  });
}

/** Normalise anything thrown by fetch (AbortError, TypeError, ...) into an ApiError. */
export function normalizeThrown(err: unknown, opts: { timedOut?: boolean; requestId?: string } = {}): ApiError {
  if (err instanceof ApiError) return err;
  if (opts.timedOut) return new ApiError({ code: "timeout", message: "Request timed out", requestId: opts.requestId });
  const name = (err as { name?: string } | null)?.name;
  if (name === "AbortError") return new ApiError({ code: "aborted", message: "Request aborted", requestId: opts.requestId });
  const message = err instanceof Error ? err.message : "Network error";
  return new ApiError({ code: "network", message, requestId: opts.requestId });
}
