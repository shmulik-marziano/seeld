// Retry with exponential backoff and jitter. Pure and deterministic when given rng/sleep.
import { ApiError } from "./errors";

export interface RetryPolicy {
  /** Retries after the first attempt. 0 disables. */
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** 0..1 fraction of the delay randomised. */
  jitter: number;
}

export const DEFAULT_RETRY: RetryPolicy = { maxRetries: 2, baseDelayMs: 300, maxDelayMs: 5_000, jitter: 0.2 };

/** Delay before retry number `attempt` (1 = first retry). Honours Retry-After when larger. */
export function backoffDelay(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY,
  rng: () => number = Math.random,
  retryAfterMs?: number,
): number {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const spread = exp * policy.jitter;
  const jittered = exp - spread + rng() * spread * 2;
  const base = Math.min(policy.maxDelayMs, Math.max(0, jittered));
  return Math.round(retryAfterMs !== undefined ? Math.max(base, Math.min(retryAfterMs, policy.maxDelayMs * 4)) : base);
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

/** Non-idempotent methods retry only when the caller supplied an idempotency key. */
export function isRetryAllowed(method: string, hasIdempotencyKey: boolean): boolean {
  return SAFE_METHODS.has(method.toUpperCase()) || hasIdempotencyKey;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: {
    policy?: RetryPolicy;
    allowed?: boolean;
    sleep?: (ms: number) => Promise<void>;
    rng?: () => number;
    onRetry?: (info: { attempt: number; delayMs: number; error: ApiError }) => void;
  } = {},
): Promise<T> {
  const policy = opts.policy ?? DEFAULT_RETRY;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const allowed = opts.allowed ?? true;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (!err || !allowed || !err.retryable || attempt >= policy.maxRetries) throw e;
      const delayMs = backoffDelay(attempt + 1, policy, opts.rng, err.retryAfterMs);
      opts.onRetry?.({ attempt: attempt + 1, delayMs, error: err });
      await sleep(delayMs);
    }
  }
}
