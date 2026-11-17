import type { QueuePolicy } from "./policy.ts";

export type FailureKind = "rate_limited" | "record_locked" | "unavailable" | "permanent" | "poison";

export type FailureDecision = { action: "retry"; delaySec: number } | { action: "dead_letter"; reason: string };

/**
 * What to do after a failed attempt. failureCount includes the failure being decided (1 = first failure).
 * - poison / permanent: retrying cannot help, dead-letter at once (customer halted on this destination, ops alerted).
 * - otherwise retry with the graduated schedule until maxAttempts, then dead-letter (third failure by default).
 * - retryAfterSec from the system is honoured when larger than the schedule; record locks never retry sooner than lockedRetrySec.
 */
export function decideFailure(kind: FailureKind, failureCount: number, policy: QueuePolicy, retryAfterSec?: number): FailureDecision {
  if (kind === "poison" || kind === "permanent") return { action: "dead_letter", reason: kind };
  if (failureCount >= policy.maxAttempts) return { action: "dead_letter", reason: "max_attempts" };
  const idx = Math.min(failureCount, policy.backoffSec.length) - 1;
  let delay = policy.backoffSec[Math.max(0, idx)];
  if (kind === "record_locked") delay = Math.max(delay, policy.lockedRetrySec);
  if (retryAfterSec && retryAfterSec > delay) delay = Math.ceil(retryAfterSec);
  return { action: "retry", delaySec: delay };
}
