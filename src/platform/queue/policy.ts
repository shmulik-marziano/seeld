// Queue policy constants and per-destination policy. Pure TypeScript, no imports from pages/components.
// Imported by the queue-worker edge function (supabase/functions/_shared/queueWorker.ts).
// Relative imports carry the .ts extension so Deno can load these files as they are.

/** Hard ceiling for one worker batch (mandatory rule: short batches, edge functions get cut off). */
export const MAX_BATCH_SIZE = 20;
/** Visibility timeout in seconds applied to every pgmq.read (mandatory rule). */
export const DEFAULT_VISIBILITY_TIMEOUT_SEC = 60;
/** The third failure moves a message to the dead-letter queue. */
export const DEFAULT_MAX_ATTEMPTS = 3;
/** Graduated backoff after failure 1, failure 2, ... The last entry repeats. Seconds. TODO(owner): tune per adapter. */
export const DEFAULT_BACKOFF_SEC: readonly number[] = [30, 300, 1800];
/** Share of the visibility timeout the worker may spend before it stops taking new messages. */
export const BUDGET_FRACTION = 0.6;

export const DESTINATIONS = ["salesforce", "surense"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export interface QueuePolicy {
  /** pgmq.read vt (seconds). Also the per-customer lease length. */
  visibilityTimeoutSec: number;
  /** Messages per read. 1..MAX_BATCH_SIZE. */
  batchSize: number;
  /** How often cron should wake the worker for this destination. TODO(owner): tune. */
  drainIntervalSec: number;
  /** Failures before dead-letter. */
  maxAttempts: number;
  /** Graduated retry delays in seconds (index = failureCount - 1, last repeats). */
  backoffSec: readonly number[];
  /** Requeue delay for a message whose predecessor is unfinished or whose customer is leased. */
  skipRequeueSec: number;
  /** Requeue delay for messages of a halted customer (an earlier message is in the DLQ). */
  haltedRequeueSec: number;
  /** Minimum retry delay when the record is locked in the core system. */
  lockedRetrySec: number;
}

export function validateQueuePolicy(p: QueuePolicy, minIntervalMs = 0): string[] {
  const errs: string[] = [];
  if (!Number.isInteger(p.batchSize) || p.batchSize < 1 || p.batchSize > MAX_BATCH_SIZE) errs.push(`batchSize must be 1..${MAX_BATCH_SIZE}`);
  if (!Number.isInteger(p.visibilityTimeoutSec) || p.visibilityTimeoutSec < 10) errs.push("visibilityTimeoutSec must be an integer >= 10");
  if (!Number.isInteger(p.maxAttempts) || p.maxAttempts < 1 || p.maxAttempts > 10) errs.push("maxAttempts must be 1..10");
  if (p.backoffSec.length === 0 || p.backoffSec.some((s) => !(s >= 1))) errs.push("backoffSec needs positive entries");
  if (!(p.drainIntervalSec >= 1)) errs.push("drainIntervalSec must be >= 1");
  // The whole batch, paced by the adapter's minimum interval, must fit inside the budget.
  if (p.batchSize * (minIntervalMs / 1000) > p.visibilityTimeoutSec * BUDGET_FRACTION) errs.push("batchSize * minIntervalMs does not fit the visibility timeout budget");
  return errs;
}
