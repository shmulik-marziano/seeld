// Standard error format. Must match src/platform/api/errors.ts and docs/platform/openapi.yaml.
//   { "error": { "code": "...", "message": "...", "requestId": "...", "details": ... } }

export type ErrorCode =
  | "bad_request"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "method_not_allowed"
  | "conflict"
  | "validation_failed"
  | "rate_limited"
  | "internal"
  | "unavailable";

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  method_not_allowed: 405,
  conflict: 409,
  validation_failed: 422,
  rate_limited: 429,
  internal: 500,
  unavailable: 503,
};

export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly headers?: Record<string, string>;
  constructor(code: ErrorCode, message: string, opts: { details?: unknown; headers?: Record<string, string> } = {}) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = STATUS[code];
    this.details = opts.details;
    this.headers = opts.headers;
  }
}

export function errorResponse(err: unknown, requestId: string, extra: Record<string, string> = {}): Response {
  const e = err instanceof HttpError ? err : new HttpError("internal", "Internal error"); // never leak internals
  return new Response(
    JSON.stringify({ error: { code: e.code, message: e.message, requestId, ...(e.details !== undefined ? { details: e.details } : {}) } }),
    { status: e.status, headers: { "content-type": "application/json", "x-request-id": requestId, ...extra, ...(e.headers ?? {}) } },
  );
}

export function jsonResponse(body: unknown, requestId: string, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", "x-request-id": requestId, ...(init.headers ?? {}) },
  });
}
