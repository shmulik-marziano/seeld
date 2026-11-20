// Job handlers for ops.surense_jobs (the connector's own queue; see the migration header for why not ops.outbox).
// Registry by kind; 'surense.event' dispatches by webhook event type through planEvent (sync.ts).
// Result contract with api.surense_job_complete: done | skipped (nothing to do / never going to work) | failed (retry
// with backoff 1m, 5m, 30m, 2h, or the server's retry-after when longer, jittered; dead + critical alert at attempt 5).
// The queue is the only retry layer: the worker's client makes one HTTP attempt per call (maxAttempts 1).
import { RpcError } from "../db.ts";
import { InputError, SurenseError, type SurenseFailureKind } from "./errors.ts";
import { StorageError } from "./storage.ts";
import {
  type DocPullStats, type DownloadStats, e9100Download, MAX_OFFSET, PAGE_SIZE, planEvent, pullCustomer, pullCustomers, pullDocuments,
  type SyncDeps,
} from "./sync.ts";
import { isUuid } from "./api.ts";

export interface JobRow {
  id: number;
  kind: string;
  params: Record<string, unknown> | null;
  event_id: number | null;
  event_type: string | null;
  /** decrypted webhook body for 'surense.event': never log it */
  payload: string | null;
  attempts: number;
}

export type JobErrorKind = SurenseFailureKind | "db" | "storage" | "input" | "internal";

export interface JobOutcome {
  result: "done" | "skipped" | "failed";
  code?: string;
  /** failure class, passed to api.surense_job_complete(p_error_kind) */
  kind?: JobErrorKind;
  /** server retry-after in seconds (SurenseError), passed as p_retry_after: the DB schedules the next attempt */
  retryAfterSec?: number | null;
  /** a follow-up job to enqueue after this one is completed (chunked pulls) */
  next?: { kind: string; params: Record<string, unknown>; dedupe: string };
  stats?: Record<string, number | boolean | string>;
}

export type JobHandler = (d: SyncDeps, job: JobRow, deadline: number) => Promise<JobOutcome>;

const safe = (s: string) => s.replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 120);

/** error -> outcome. Codes only (Surense numeric code, SQLSTATE, HTTP status); never a message. */
export function failureOutcome(e: unknown): JobOutcome {
  if (e instanceof SurenseError) {
    if (e.retryable || e.kind === "auth") {
      return { result: "failed", code: safe(`surense_${e.code}`), kind: e.kind, retryAfterSec: e.retryAfterSec };
    }
    // permanent 4xx (e.g. 40000 not found / no access) and config refusals do not improve with retries
    return { result: "skipped", code: safe(`surense_${e.status}_${e.code}`), kind: e.kind };
  }
  if (e instanceof RpcError) return { result: "failed", code: safe(`db_${e.code}`), kind: "db" };
  if (e instanceof StorageError) return { result: "failed", code: `storage_${e.status}`, kind: "storage" };
  // only our own validation is a permanent skip; any other TypeError is a bug or an unexpected shape: retry + dead-letter
  if (e instanceof InputError) return { result: "skipped", code: "bad_input", kind: "input" };
  return { result: "failed", code: "internal", kind: "internal" };
}

const str = (p: Record<string, unknown> | null, k: string) => (p && typeof p[k] === "string" ? (p[k] as string) : undefined);

export const HANDLERS: Record<string, JobHandler> = {
  "surense.event": async (d, job, deadline) => {
    let payload: unknown;
    try {
      payload = JSON.parse(job.payload ?? "");
    } catch {
      return { result: "skipped", code: "bad_payload" };
    }
    const plan = planEvent(job.event_type ?? "unknown", payload);
    switch (plan.action) {
      case "skip":
        return { result: "skipped", code: plan.reason };
      case "pull_customer":
        return { result: "done", stats: await pullCustomer(d, plan.customerId) };
      case "mark_customer_deleted":
        await d.rpc.call("surense_customer_mark_deleted", { p_id: plan.customerId });
        return { result: "done" };
      case "mark_document_deleted":
        await d.rpc.call("surense_document_mark_deleted", { p_surense_id: plan.documentId });
        return { result: "done" };
      case "pull_documents":
        return docsOutcome(await pullDocuments(d, { customerId: plan.customerId, deadline }), plan.customerId, undefined);
      case "e9100_download":
        return e9100Outcome(await e9100Download(d, { customerId: plan.customerId, eventId: plan.eventId, deadline }));
    }
  },
  "surense.pull_customers": async (d, _job, deadline) => {
    const s = await pullCustomers(d, { deadline });
    return {
      result: "done",
      stats: { ...s },
      ...(s.done ? {} : { next: { kind: "surense.pull_customers", params: {}, dedupe: "pull_customers" } }),
    };
  },
  "surense.pull_documents": async (d, job, deadline) => {
    const customerId = str(job.params, "customer_id");
    const since = str(job.params, "since");
    if (customerId && !isUuid(customerId)) return { result: "skipped", code: "bad_input" };
    if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) return { result: "skipped", code: "bad_input" };
    if (!customerId && !since) return { result: "skipped", code: "bad_input" };
    const startRow = job.params?.start_row ?? 0;
    if (typeof startRow !== "number" || !Number.isSafeInteger(startRow) || startRow < 0 || startRow > MAX_OFFSET || startRow % PAGE_SIZE) {
      return { result: "skipped", code: "bad_input" };
    }
    return docsOutcome(await pullDocuments(d, { customerId, since, startRow, deadline }), customerId?.toLowerCase(), since);
  },
  "surense.e9100_download": async (d, job, deadline) => {
    const customerId = str(job.params, "customer_id");
    const eventId = str(job.params, "event_id");
    if (!isUuid(customerId) || !isUuid(eventId)) return { result: "skipped", code: "bad_input" };
    return e9100Outcome(await e9100Download(d, { customerId, eventId, deadline }));
  },
};

/** a pass cut by the deadline continues in a follow-up job from where it stopped (params are ids/dates/numbers only) */
function docsOutcome(s: DocPullStats, customerId: string | undefined, since: string | undefined): JobOutcome {
  const { nextStart, ...stats } = s;
  if (nextStart === null) return { result: "done", stats };
  const params: Record<string, unknown> = { start_row: nextStart };
  if (customerId) params.customer_id = customerId;
  if (since) params.since = since;
  const dedupe = customerId ? `docs:${customerId}` : `docs:since:${since}`;
  return { result: "done", stats: { ...stats, nextStart }, next: { kind: "surense.pull_documents", params, dedupe } };
}

function e9100Outcome(s: DownloadStats): JobOutcome {
  const stats = { ...s };
  // deadline hit before every file was handled: retry (stored files dedupe on path, so nothing is written twice)
  if (s.partial) return { result: "failed", code: "deadline", stats };
  // every link on a non-allowlisted host: nothing we may fetch until the owner approves the host
  if (s.refusedHost > 0 && s.stored + s.existing === 0) return { result: "skipped", code: "download_host_not_allowed", stats };
  return { result: "done", stats };
}

export async function runJob(d: SyncDeps, job: JobRow, deadline: number): Promise<JobOutcome> {
  const h = HANDLERS[job.kind];
  if (!h) return { result: "skipped", code: "no_handler" };
  try {
    return await h(d, job, deadline);
  } catch (e) {
    return failureOutcome(e);
  }
}
