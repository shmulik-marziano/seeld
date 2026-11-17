// System-of-record adapter contract. The platform never assumes WHICH core system exists: workers talk
// to a SystemAdapter. Salesforce and Surense never talk to each other; every change flows through the
// operational database (router), is translated through identity_links, and reaches each system through
// its own destination queue.
import type { FailureKind } from "../queue/backoff.ts";
import type { QueuePolicy } from "../queue/policy.ts";

export type SystemId = "salesforce" | "surense";

export interface AdapterCapabilities {
  createLead: boolean;
  upsertCustomer: boolean;
  updateCase: boolean;
  getCustomer: boolean;
  /** Upsert by our external key is supported (safe retries). */
  externalIdUpsert: boolean;
  /** Records can be locked by concurrent updates (expect record_locked failures). */
  recordLocking: boolean;
  /** False for placeholders: the worker refuses to drain a queue whose adapter is not ready. */
  ready: boolean;
}

/** Rate-limit and backoff profile. Every number here is a TODO(owner): never a real vendor limit. */
export interface RateLimitProfile {
  /** null = unknown. TODO(owner): fill from the vendor contract, do not guess. */
  requestsPerSecond: number | null;
  /** Pause between two calls inside a batch (ms). */
  minIntervalMs: number;
  /** Queue policy for this adapter's destination queue (vt, batch, drain rate, backoff). */
  queue: QueuePolicy;
}

export interface CallContext {
  /** identity_links.internal_customer_id. */
  customerKey: string;
  /** This system's own id for the customer (salesforce_id / surense_id) or null if not linked yet. */
  externalId: string | null;
  /** Event id: send it as the idempotency key to the system. */
  idempotencyKey: string;
}

export type AdapterResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: FailureKind; code: string; retryAfterSec?: number };

export interface FieldMap {
  [fieldKey: string]: unknown;
}

export interface CustomerSnapshot {
  externalId: string;
  fields: FieldMap;
}

export interface SystemAdapter {
  readonly id: SystemId;
  readonly capabilities: AdapterCapabilities;
  readonly profile: RateLimitProfile;
  createLead(ctx: CallContext, fields: FieldMap): Promise<AdapterResult<{ externalId: string }>>;
  upsertCustomer(ctx: CallContext, fields: FieldMap): Promise<AdapterResult<{ externalId: string }>>;
  updateCase(ctx: CallContext, caseRef: string, fields: FieldMap): Promise<AdapterResult<{ externalId: string }>>;
  getCustomer(ctx: CallContext): Promise<AdapterResult<CustomerSnapshot>>;
}
