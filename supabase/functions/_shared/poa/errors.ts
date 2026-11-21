// Error model of the POA wizard backend. The browser only ever learns one of six KINDS (spec screen 8), in the body
// {"error": "<kind>"}; the HTTP status is a hint. Nothing here ever carries a value, a url or a message from upstream:
// codes (SQLSTATE, HTTP status, Surense numeric code) only.
import { RpcError } from "../db.ts";
import { SurenseError } from "../surense/errors.ts";

export type PoaErrorKind = "inactive" | "unavailable" | "generic" | "expired" | "locked" | "completed";
export const POA_ERROR_KINDS: readonly PoaErrorKind[] = ["inactive", "unavailable", "generic", "expired", "locked", "completed"];

const STATUS: Record<PoaErrorKind, number> = {
  inactive: 401,
  unavailable: 503,
  generic: 400,
  expired: 410,
  locked: 403,
  completed: 409,
};

export function statusForKind(kind: PoaErrorKind): number {
  return STATUS[kind];
}

/** An error already shaped for the browser. */
export class PoaHttpError extends Error {
  readonly kind: PoaErrorKind;
  readonly status: number;
  /** short machine code for logs (never a value) */
  readonly code: string;
  readonly headers?: Record<string, string>;
  constructor(kind: PoaErrorKind, code: string, opts: { status?: number; headers?: Record<string, string> } = {}) {
    super(code);
    this.name = "PoaHttpError";
    this.kind = kind;
    this.status = opts.status ?? STATUS[kind];
    this.code = code;
    this.headers = opts.headers;
  }
}

/** A failure of the outside tool (public page API / official API) already classified into a kind. */
export class PoaToolError extends Error {
  readonly kind: PoaErrorKind;
  readonly code: string;
  /** a write whose outcome is unknown (timeout / network / 502 / 504 after the request left) */
  readonly ambiguous: boolean;
  constructor(kind: PoaErrorKind, code: string, ambiguous = false) {
    super(code);
    this.name = "PoaToolError";
    this.kind = kind;
    this.code = code;
    this.ambiguous = ambiguous;
  }
}

/** Public page API HTTP status -> kind. TODO(owner-full-run): the tool's error bodies are unobserved; status only.
 *  404 = link invalid or replaced, 410 = session ended, 409 = already completed, 423/429 = blocked or too many,
 *  5xx / network = service down, any other 4xx = generic. */
export function kindFromToolStatus(status: number): PoaErrorKind {
  if (status === 404) return "inactive";
  if (status === 410) return "expired";
  if (status === 409) return "completed";
  if (status === 423 || status === 429) return "locked";
  if (status === 0 || status >= 500) return "unavailable";
  return "generic";
}

/** Any thrown value -> PoaHttpError (the single place that decides what the browser sees). */
export function toPoaError(e: unknown): PoaHttpError {
  if (e instanceof PoaHttpError) return e;
  if (e instanceof PoaToolError) return new PoaHttpError(e.kind, e.code);
  if (e instanceof SurenseError) {
    // an unknown outcome of a write is never retried blindly and never shown as a validation problem
    if (e.ambiguous || e.kind !== "permanent") return new PoaHttpError("unavailable", `surense_${e.code}`);
    return new PoaHttpError("generic", `surense_${e.code}`, { status: 502 });
  }
  if (e instanceof RpcError) {
    const code = `db_${e.code}`;
    switch (e.status) {
      case 400:
        return new PoaHttpError("generic", code);
      case 401:
        return new PoaHttpError("inactive", code);
      case 403:
        return new PoaHttpError("locked", code);
      case 409:
        return new PoaHttpError("completed", code);
      case 410:
        return new PoaHttpError("expired", code);
      case 423:
        // a kill switch is off: the feature is closed (spec: switch off -> 503 inactive)
        return new PoaHttpError("inactive", code, { status: 503 });
      case 429:
        return new PoaHttpError("locked", code, { status: 429, headers: { "retry-after": "600" } });
      default:
        return new PoaHttpError("unavailable", code);
    }
  }
  return new PoaHttpError("generic", "internal", { status: 500 });
}

export function poaErrorResponse(err: PoaHttpError, requestId: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: err.kind }), {
    status: err.status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId, ...extra, ...(err.headers ?? {}) },
  });
}
