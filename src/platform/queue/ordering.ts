// Reference implementation of the per-customer, per-destination ordering decision.
// The authoritative version is SQL (public.queue_claim in supabase/proposed/06_event_queue.sql);
// this pure twin documents the rule and backs the table-driven tests and the in-memory test database.

export interface CustomerQueueState {
  /** Highest sequence number completed (or deliberately skipped by ops) for this customer and destination. */
  lastCompletedSeq: number;
  /** An earlier message sits in the dead-letter queue. Later messages wait until ops resolve it. */
  halted: boolean;
  /** Lease expiry (epoch ms) of a worker currently processing this customer, or null. */
  leaseUntilMs: number | null;
}

export type OrderingDecision =
  | "process" //     seq === last + 1: run it
  | "duplicate" //   seq <= last: already done, archive without calling the system
  | "halted" //      an earlier message is dead-lettered: wait for ops
  | "locked" //      another worker holds the customer lease
  | "not_ready"; //  an earlier message is missing, waiting for a retry or in flight: requeue, blocks only this customer

export function decideOrdering(state: CustomerQueueState | null, seq: number, nowMs: number): OrderingDecision {
  const last = state?.lastCompletedSeq ?? 0;
  if (seq <= last) return "duplicate";
  if (state?.halted) return "halted";
  if (state?.leaseUntilMs != null && state.leaseUntilMs > nowMs) return "locked";
  if (seq !== last + 1) return "not_ready";
  return "process";
}
