// Rate limiter CONTRACT plus an in-memory implementation (per isolate, best effort, for dev and as
// a first line of defence). The durable implementation will use public.rate_limit_counters
// (supabase/proposed/04_rate_limit_counters.sql) through the consume_rate_limit() function.

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSec: number;
}

export interface RateLimiter {
  /** Count one hit for `key` (e.g. "client:<id>" or "ip:<hash>") in a fixed window. */
  consume(key: string, limit: number, windowSec: number): Promise<RateLimitDecision>;
}

export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const buckets = new Map<string, { start: number; count: number }>();
  return {
    async consume(key, limit, windowSec) {
      const t = now();
      const windowMs = windowSec * 1000;
      const b = buckets.get(key);
      if (!b || t - b.start >= windowMs) {
        buckets.set(key, { start: t, count: 1 });
        return { allowed: true, limit, remaining: limit - 1, retryAfterSec: windowSec };
      }
      b.count++;
      const retryAfterSec = Math.max(1, Math.ceil((b.start + windowMs - t) / 1000));
      return { allowed: b.count <= limit, limit, remaining: Math.max(0, limit - b.count), retryAfterSec };
    },
  };
}

export function rateLimitHeaders(d: RateLimitDecision): Record<string, string> {
  return {
    "ratelimit-limit": String(d.limit),
    "ratelimit-remaining": String(d.remaining),
    ...(d.allowed ? {} : { "retry-after": String(d.retryAfterSec) }),
  };
}
