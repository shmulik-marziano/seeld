// Surense error model. The platform answers {statusCode, errors:[{code, message}]}; we keep the HTTP status and the
// numeric Surense code only. The server message is DROPPED: it can echo request values (e.g. 40204 lists the
// conflicting customers). Known codes: 40000 not found / not accessible / missing scope (a missing record is usually
// 400, not 404), 40001 invalid input, 40204 customer conflict by phone/e-mail, 40205 duplicate ID number.
import type { ApiErrorBody } from "./types.ts";

export type SurenseFailureKind = "rate_limited" | "unavailable" | "auth" | "permanent" | "config";

export class SurenseError extends Error {
  readonly status: number;
  /** numeric Surense code as text ("40001"), or "timeout" | "network" | "host_not_allowed" | "bad_json" | "http_<n>" */
  readonly code: string;
  readonly kind: SurenseFailureKind;
  /** seconds, from retry-after on a 429/502/503/504 (capped at RETRY_AFTER_MAX_SEC) */
  readonly retryAfterSec: number | null;
  /** a write whose outcome is unknown (timeout / network failure / 502 / 504 after the request left): it may have
   *  taken effect in Surense. Never retried automatically; the caller must check Surense first. */
  readonly ambiguous: boolean;
  constructor(status: number, code: string, kind: SurenseFailureKind, retryAfterSec: number | null = null, ambiguous = false) {
    super(`surense ${status || "-"} ${code}`); // never the server text
    this.name = "SurenseError";
    this.status = status;
    this.code = code;
    this.kind = kind;
    this.retryAfterSec = retryAfterSec;
    this.ambiguous = ambiguous;
  }
  /** the same error, flagged as an ambiguous write outcome */
  asAmbiguous(): SurenseError {
    return new SurenseError(this.status, this.code, this.kind, this.retryAfterSec, true);
  }
  get retryable(): boolean {
    return this.kind === "rate_limited" || this.kind === "unavailable";
  }
}

/** Validation failure of our own input or a Surense record (bad id, missing filter). The only error a job skips
 *  without retry; any other TypeError is a bug or an unexpected shape and fails (backoff, dead-letter, alert).
 *  Extends TypeError so existing `instanceof TypeError` checks keep working. */
export class InputError extends TypeError {
  constructor(code: string) {
    super(code);
    this.name = "InputError";
  }
}

/** first numeric code of an ApiError body, else http_<status> */
export function surenseCode(status: number, bodyText: string): string {
  try {
    const j = JSON.parse(bodyText) as ApiErrorBody;
    const c = j?.errors?.[0]?.code ?? j?.error?.code;
    if (typeof c === "number" && Number.isInteger(c) && c >= 0 && c < 1e7) return String(c);
  } catch { /* non-JSON body */ }
  return `http_${status}`;
}

export function kindFor(status: number): SurenseFailureKind {
  if (status === 429) return "rate_limited";
  if (status === 401) return "auth";
  if (status === 502 || status === 503 || status === 504) return "unavailable";
  return "permanent";
}

/** upper bound for a server-sent retry-after we pass on (the queue schedules it; the client never sleeps that long) */
export const RETRY_AFTER_MAX_SEC = 3600;

/** retry-after in seconds (integer form only; an HTTP date is ignored), capped at RETRY_AFTER_MAX_SEC */
export function retryAfter(h: Headers): number | null {
  const v = (h.get("retry-after") ?? "").trim();
  if (!/^\d{1,5}$/.test(v)) return null;
  return Math.min(Number(v), RETRY_AFTER_MAX_SEC);
}

const RETRY_AFTER_STATUSES = [429, 502, 503, 504];

export function fromResponse(res: Response, bodyText: string): SurenseError {
  return new SurenseError(res.status, surenseCode(res.status, bodyText), kindFor(res.status),
    RETRY_AFTER_STATUSES.includes(res.status) ? retryAfter(res.headers) : null);
}
