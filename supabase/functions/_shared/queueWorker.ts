// Stateless queue worker core. All state lives in Postgres (pgmq + customer_queue_state); nothing is kept here.
// One run = one SHORT batch (<= 20) of ONE destination queue. Edge functions get cut off and two instances may run
// at once: that is safe because every read sets a visibility timeout (60 s default), the per-customer lease stops two
// workers on the same customer, and a cut-off run simply lets the messages reappear after the timeout.
// Dependencies are injected so the logic is unit tested without Deno or a database.
import type { AdapterResult, CallContext, FieldMap, SystemAdapter } from "../../../src/platform/systems/types.ts";
import { parseEnvelope, type QueueEnvelope } from "../../../src/platform/queue/envelope.ts";
import { decideFailure, type FailureKind } from "../../../src/platform/queue/backoff.ts";
import { BUDGET_FRACTION, MAX_BATCH_SIZE, type Destination, type QueuePolicy } from "../../../src/platform/queue/policy.ts";
import type { Logger } from "./logger.ts";

export interface QueueMessage {
  msg_id: number;
  read_ct: number;
  message: unknown;
}

/** "poison": the previous workers died on this message max_attempts times (counted in SQL from expired leases, NOT from pgmq read_ct,
 *  which also counts harmless skip/requeue reads). The caller dead-letters it. */
export type ClaimDecision = "process" | "duplicate" | "halted" | "locked" | "not_ready" | "poison";

/** One method per SQL function in supabase/proposed/06..07 (service role RPC). */
export interface QueueDb {
  readBatch(dest: Destination): Promise<QueueMessage[]>;
  claim(dest: Destination, msgId: number, customerKey: string, seq: number, workerId: string): Promise<ClaimDecision>;
  loadFields(customerKey: string, fieldKeys: string[]): Promise<FieldMap>;
  getExternalId(customerKey: string, dest: Destination): Promise<string | null>;
  /** "conflict" = this external id is already linked to ANOTHER customer (identity_set_external_id). */
  setExternalId(customerKey: string, dest: Destination, externalId: string): Promise<"ok" | "conflict" | void>;
  complete(dest: Destination, msgId: number, customerKey: string, seq: number, workerId: string, eventId: string): Promise<void>;
  recordFailure(dest: Destination, customerKey: string, seq: number, msgId: number, eventId: string, code: string): Promise<number>;
  scheduleRetry(dest: Destination, msgId: number, customerKey: string, delaySec: number): Promise<void>;
  /** customerKey + workerId (optional) also free the customer lease so a returned message is not bounced by its own stale lease. */
  release(dest: Destination, msgId: number, delaySec: number, customerKey?: string, workerId?: string): Promise<void>;
  deadLetter(dest: Destination, msgId: number, customerKey: string | null, seq: number | null, message: unknown, reason: string, code: string): Promise<void>;
}

export interface WorkerDeps {
  destination: Destination;
  adapter: SystemAdapter;
  policy: QueuePolicy;
  db: QueueDb;
  log: Logger;
  workerId: string;
  now(): number;
  sleep(ms: number): Promise<void>;
}

export interface BatchSummary {
  destination: Destination;
  read: number;
  completed: number;
  skipped: number;
  retried: number;
  deadLettered: number;
  released: number;
}

async function callAdapter(adapter: SystemAdapter, env: QueueEnvelope, ctx: CallContext, fields: FieldMap): Promise<AdapterResult<{ externalId: string }>> {
  switch (env.type) {
    case "lead.created":
      if (!adapter.capabilities.createLead) return { ok: false, kind: "permanent", code: "unsupported_operation" };
      return adapter.createLead(ctx, fields);
    case "case.updated":
      if (!adapter.capabilities.updateCase || !env.caseId) return { ok: false, kind: "permanent", code: "unsupported_operation" };
      return adapter.updateCase(ctx, env.caseId, fields);
    default: // customer.upserted, task.created, questionnaire.* : TODO(owner) map task.created to a task call when the adapter defines it
      if (!adapter.capabilities.upsertCustomer) return { ok: false, kind: "permanent", code: "unsupported_operation" };
      return adapter.upsertCustomer(ctx, fields);
  }
}

export async function runBatch(deps: WorkerDeps): Promise<BatchSummary> {
  const { destination: dest, adapter, policy, db, log } = deps;
  const summary: BatchSummary = { destination: dest, read: 0, completed: 0, skipped: 0, retried: 0, deadLettered: 0, released: 0 };
  if (!adapter.capabilities.ready) {
    log.warn("adapter not ready, queue not drained", { destination: dest });
    return summary;
  }
  const started = deps.now();
  const budgetMs = policy.visibilityTimeoutSec * 1000 * BUDGET_FRACTION;
  let lastCallAt = 0;

  const batch = (await db.readBatch(dest)).slice(0, Math.min(policy.batchSize, MAX_BATCH_SIZE));
  summary.read = batch.length;

  for (let i = 0; i < batch.length; i++) {
    const m = batch[i];
    if (deps.now() - started > budgetMs) {
      // Out of time budget: hand the rest back quickly instead of letting them sit for the whole timeout.
      for (const rest of batch.slice(i)) {
        await db.release(dest, rest.msg_id, 1);
        summary.released++;
      }
      break;
    }

    const parsed = parseEnvelope(m.message);
    if (!parsed.ok || parsed.value.destination !== dest) {
      // Poison message: can never succeed. Straight to the dead-letter queue.
      await db.deadLetter(dest, m.msg_id, null, null, m.message, "poison", parsed.ok ? "wrong_destination" : (parsed as { error: string }).error);
      summary.deadLettered++;
      log.error("poison message dead-lettered", { destination: dest, msgId: m.msg_id });
      continue;
    }
    const env = parsed.value;

    const decision = await db.claim(dest, m.msg_id, env.customerKey, env.seq, deps.workerId);
    if (decision === "poison") {
      // Workers kept dying on this message (timeout / OOM mid send). It never reported a failure, so SQL counted the expired leases.
      await db.deadLetter(dest, m.msg_id, env.customerKey, env.seq, m.message, "poison", "worker_crash");
      summary.deadLettered++;
      log.error("crashing message dead-lettered", { destination: dest, seq: env.seq, msgId: m.msg_id });
      continue;
    }
    if (decision !== "process") {
      summary.skipped++;
      continue;
    }

    // Pace calls to the adapter profile (the core system enforces hard traffic caps).
    const wait = lastCallAt + adapter.profile.minIntervalMs - deps.now();
    if (wait > 0) await deps.sleep(wait);

    let result: AdapterResult<{ externalId: string }>;
    try {
      const [fields, externalId] = await Promise.all([db.loadFields(env.customerKey, env.fieldKeys), db.getExternalId(env.customerKey, dest)]);
      lastCallAt = deps.now();
      result = await callAdapter(adapter, env, { customerKey: env.customerKey, externalId, idempotencyKey: env.eventId }, fields);
    } catch {
      result = { ok: false, kind: "unavailable", code: "adapter_threw" };
    }

    if (result.ok) {
      const okData = (result as Extract<AdapterResult<{ externalId: string }>, { ok: true }>).data;
      if (okData.externalId) {
        const linked = await db.setExternalId(env.customerKey, dest, okData.externalId);
        if (linked === "conflict") {
          // The core system record already belongs to another customer here: completing would hide a broken link. Stop this customer.
          await db.deadLetter(dest, m.msg_id, env.customerKey, env.seq, m.message, "permanent", "external_id_conflict");
          summary.deadLettered++;
          log.error("external id conflict, dead-lettered", { destination: dest, seq: env.seq });
          continue;
        }
      }
      await db.complete(dest, m.msg_id, env.customerKey, env.seq, deps.workerId, env.eventId);
      summary.completed++;
      continue;
    }

    const fail = result as Extract<AdapterResult<{ externalId: string }>, { ok: false }>;
    const failures = await db.recordFailure(dest, env.customerKey, env.seq, m.msg_id, env.eventId, fail.code);
    const next = decideFailure(fail.kind as FailureKind, failures, policy, fail.retryAfterSec);
    if (next.action === "retry") {
      await db.scheduleRetry(dest, m.msg_id, env.customerKey, next.delaySec);
      summary.retried++;
    } else {
      await db.deadLetter(dest, m.msg_id, env.customerKey, env.seq, m.message, next.reason, fail.code);
      summary.deadLettered++;
      log.error("message dead-lettered", { destination: dest, seq: env.seq, reason: next.reason, code: fail.code });
    }
  }
  return summary;
}
