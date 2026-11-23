// Job handlers for ops.surense_jobs (the connector's own queue; see the migration header for why not ops.outbox).
// Registry by kind; 'surense.event' dispatches by webhook event type through planEvent (sync.ts).
// Result contract with api.surense_job_complete: done | skipped (nothing to do / never going to work) | failed (retry
// with backoff 1m, 5m, 30m, 2h, or the server's retry-after when longer, jittered; dead + critical alert at attempt 5).
// The queue is the only retry layer: the worker's client makes one HTTP attempt per call (maxAttempts 1).
import { RpcError } from "../db.ts";
import { InputError, SurenseError, type SurenseFailureKind } from "./errors.ts";
import { StorageError } from "./storage.ts";
import {
  type DocPullStats, type DownloadStats, e9100Download, e9100Submit, latestProductionMonth, linkPoaDocument, MAX_OFFSET, PAGE_SIZE, planEvent, portfolio,
  pullCustomer, pullCustomers, pullDocuments, type SyncDeps,
} from "./sync.ts";
import { isUuid } from "./api.ts";
import { pickSwiftnessAccount } from "../poa/engine/surense.ts";
import { type ModuleFlags, POA_KINDS, type PoaKind } from "../poa/engine/types.ts";
import { PoaToolError } from "../poa/errors.ts";
import { createPoaRpc } from "../poa/rpc.ts";
import { todayIsrael } from "../poa/formatters.ts";
import type { SurenseDocument } from "./types.ts";

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
  if (e instanceof PoaToolError) {
    // the tool's page refused (ship job): a permanent refusal of the page (invalid link, ended session, bad data) does not
    // improve with retries; everything else (unavailable, locked) is retried by the queue
    const permanent = e.kind === "generic" || e.kind === "inactive" || e.kind === "expired" || e.kind === "completed";
    return permanent ? { result: "skipped", code: safe(`dp_${e.code}`), kind: "permanent" } : { result: "failed", code: safe(`dp_${e.code}`), kind: "unavailable" };
  }
  if (e instanceof RpcError) return { result: "failed", code: safe(`db_${e.code}`), kind: "db" };
  if (e instanceof StorageError) return { result: "failed", code: `storage_${e.status}`, kind: "storage" };
  // only our own validation is a permanent skip; any other TypeError is a bug or an unexpected shape: retry + dead-letter
  if (e instanceof InputError) return { result: "skipped", code: "bad_input", kind: "input" };
  return { result: "failed", code: "internal", kind: "internal" };
}

const str = (p: Record<string, unknown> | null, k: string) => (p && typeof p[k] === "string" ? (p[k] as string) : undefined);

/** the follow-up that refreshes a customer's processed portfolio in our mirror (client area; 20261124090000) */
export const portfolioNext = (customerId: string) =>
  ({ kind: "surense.portfolio_pull", params: { customer_id: customerId.toLowerCase() }, dedupe: `portfolio:${customerId.toLowerCase()}` });

/** events after which the portfolio changes on Surense's side: pull it again the same day, not at the next sweep */
const PORTFOLIO_EVENTS = new Set(["harb.uploaded", "swiftness.e9100.completed", "customer.updated"]);

/** adds the portfolio follow-up to a done outcome that carries no other follow-up (one `next` per job; a paged pull that
 *  continues keeps its own continuation and the sweep covers the portfolio) */
function withPortfolio(out: JobOutcome, eventType: string | null, customerId: string): JobOutcome {
  if (out.result !== "done" || out.next || !eventType || !PORTFOLIO_EVENTS.has(eventType)) return out;
  return { ...out, next: portfolioNext(customerId) };
}

/** how many customers one sweep slice may queue before handing over to a follow-up sweep */
export const SWEEP_BATCH = 200;
export const PORTFOLIO_MAX_AGE_DAYS = 30;

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
        return withPortfolio({ result: "done", stats: await pullCustomer(d, plan.customerId) }, job.event_type, plan.customerId);
      case "mark_customer_deleted":
        await d.rpc.call("surense_customer_mark_deleted", { p_id: plan.customerId });
        return { result: "done" };
      case "mark_document_deleted":
        await d.rpc.call("surense_document_mark_deleted", { p_surense_id: plan.documentId });
        return { result: "done" };
      case "pull_documents": {
        if (!plan.poaKind) {
          return withPortfolio(docsOutcome(await pullDocuments(d, { customerId: plan.customerId, deadline }), plan.customerId, undefined), job.event_type, plan.customerId);
        }
        // a POA wizard approval (dataproxy.aleph|hei|bet): after the pull, link the document to the session
        const seen: SurenseDocument[] = [];
        const pulled = await pullDocuments(d, { customerId: plan.customerId, deadline, onRows: (rows) => seen.push(...rows) });
        const link = await linkPoaDocument(d, { customerId: plan.customerId, kind: plan.poaKind, docs: seen });
        const out = docsOutcome(pulled, plan.customerId, undefined);
        return { ...out, stats: { ...(out.stats ?? {}), poaLinked: link.linked, poaComplete: link.complete, poaHashed: link.hashed } };
      }
      case "e9100_download":
        return withPortfolio(e9100Outcome(await e9100Download(d, { customerId: plan.customerId, eventId: plan.eventId, deadline })), job.event_type, plan.customerId);
    }
  },
  // one customer's processed portfolio (production) into the mirror; a permanent Surense refusal (no such customer, no
  // access) ends skipped through failureOutcome, everything else retries with the queue's backoff
  "surense.portfolio_pull": async (d, job) => {
    const customerId = str(job.params, "customer_id");
    if (!isUuid(customerId)) return { result: "skipped", code: "bad_input" };
    // a production portfolio needs its month (40001 without it, verified live 2026-11-23): the latest one from the history;
    // a customer with no production snapshot yet is skipped (the next sweep asks again)
    const month = await latestProductionMonth(d, customerId.toLowerCase());
    if (!month) return { result: "skipped", code: "no_production_data" };
    const s = await portfolio(d, { customerId: customerId.toLowerCase(), mode: "production", month });
    return { result: "done", stats: { snapshotId: s.snapshotId ?? -1, products: s.products, bad: s.bad, month } };
  },
  // the daily sweep: every customer whose production snapshot is missing or older than PORTFOLIO_MAX_AGE_DAYS gets one
  // pull job (dedupe per customer). A slice cut by the deadline or by SWEEP_BATCH hands over to a follow-up sweep.
  "surense.portfolio_sweep": async (d, _job, deadline) => {
    const now = d.now ?? Date.now;
    const due = (await d.rpc.call<{ surense_id: string }[]>("surense_portfolio_due", { p_max_age_days: PORTFOLIO_MAX_AGE_DAYS, p_limit: SWEEP_BATCH })) ?? [];
    let enqueued = 0;
    let duplicates = 0;
    let cut = false;
    for (const row of due) {
      if (now() >= deadline) {
        cut = true;
        break;
      }
      if (!isUuid(row?.surense_id)) continue;
      const n = portfolioNext(row.surense_id);
      const r = await d.rpc.call<{ duplicate?: boolean }>("surense_job_enqueue", { p_kind: n.kind, p_params: n.params, p_dedupe: n.dedupe });
      if (r?.duplicate) duplicates++;
      else enqueued++;
    }
    // a full batch means more may be due, but only when this slice actually queued something new: a list made of
    // customers already in the queue (duplicates) must not chain sweeps forever (seen live 2026-11-23: 500+ pulls in minutes)
    const more = cut || (due.length >= SWEEP_BATCH && enqueued > 0);
    return {
      result: "done",
      stats: { due: due.length, enqueued, duplicates, cut },
      ...(more ? { next: { kind: "surense.portfolio_sweep", params: {}, dedupe: "portfolio_sweep" } } : {}),
    };
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
  // POA "launch": queued by poa-intake once every enabled module is approved. Runs only with BOTH switches on
  // (surense_write_enabled + surense_e9100_enabled, api.surense_gate); otherwise it completes skipped, nothing is sent.
  "surense.e9100_submit": async (d, job) => {
    const customerId = str(job.params, "customer_id");
    const date = str(job.params, "proxy_approval_date");
    if (!isUuid(customerId) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { result: "skipped", code: "bad_input" };
    try {
      await d.rpc.call("surense_gate", { p_write: true, p_action: "e9100-submit" });
    } catch (e) {
      if (e instanceof RpcError && e.status === 423) return { result: "skipped", code: "e9100_switch_off" };
      throw e;
    }
    const registrationId = pickSwiftnessAccount(await d.api.swiftness.accountsList());
    if (!registrationId) return { result: "failed", code: "no_swiftness_account", kind: "config" };
    const r = await e9100Submit(d, { customerId, registrationId, proxyApprovalDate: date });
    // a rejected request is final (a retry would ask the clearing house twice): done, with the flag in the stats
    return { result: "done", stats: { rejected: r.rejected, progress: r.progress ?? -1 } };
  },
  // POA "ship" (owner decision 2026-11-22): a session completed on our side (native engine) is replayed into the tool:
  // customer -> invite -> load/start -> swiftness/hb/policies with the stored dates and signature. Nothing of this touches
  // the client. Runs only with surense_write_enabled (api.surense_gate 'invite-proxies'); a closed switch leaves the session
  // pending with a code (staff see it; "ship again" re-queues). A failure records ship_status = failed + code and the queue
  // retries with backoff; the E9100 launch is queued after a successful ship (not for a customer that already existed).
  "surense.poa_ship": async (d, job) => {
    const sessionId = str(job.params, "session_id");
    if (!isUuid(sessionId)) return { result: "skipped", code: "bad_input" };
    const poa = createPoaRpc(d.rpc);
    const engine = d.poaEngine;
    if (!engine) return { result: "failed", code: "engine_not_configured", kind: "config" };
    try {
      await d.rpc.call("surense_gate", { p_write: true, p_action: "invite-proxies" });
    } catch (e) {
      if (e instanceof RpcError && e.status === 423) {
        await poa.shipSet(sessionId, "failed", "write_switch_off", null).catch(() => {});
        return { result: "skipped", code: "write_switch_off" };
      }
      throw e;
    }
    const data = await poa.shipGet(sessionId);
    if (data.shipStatus === "shipped") return { result: "skipped", code: "already_shipped" };
    const flags = {} as ModuleFlags;
    let n = 0;
    for (const k of POA_KINDS) {
      flags[k] = data.modules[k].enabled && data.modules[k].performed && !!data.consents[k];
      if (flags[k]) n++;
    }
    if (!n) return { result: "skipped", code: "nothing_to_ship" };
    try {
      const ref = await engine.start(data.identity, flags);
      for (const k of POA_KINDS) {
        if (!flags[k]) continue;
        const c = data.consents[k]!;
        await engine.consent(ref, k, { birthDate: c.birthDate ?? undefined, issueDate: c.issueDate ?? undefined, signaturePng: c.signature ?? undefined });
      }
      await poa.shipSet(sessionId, "shipped", null, ref.customerId);
      d.log.info("poa shipped", { session: sessionId, modules: n, existing: ref.existing });
      const launch = !ref.existing && ref.customerId
        ? { next: { kind: "surense.e9100_submit", params: { customer_id: ref.customerId, proxy_approval_date: todayIsrael(d.now ? d.now() : Date.now()) }, dedupe: `e9100:${ref.customerId}` } }
        : {};
      return { result: "done", stats: { modules: n, existing: ref.existing }, ...launch };
    } catch (e) {
      const out = failureOutcome(e);
      await poa.shipSet(sessionId, "failed", out.code ?? "error", null).catch(() => {});
      throw e;
    }
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
