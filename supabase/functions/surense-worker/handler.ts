// surense-worker: drains ops.surense_jobs. Cron contract (FOUNDATION §7): x-cron-secret, 202 at once, work inside
// EdgeRuntime.waitUntil, api.surense_job_claim(5) -> HANDLERS[kind] -> api.surense_job_complete(id, attempts), stop claiming 20 s
// before the 72 s budget, report through api.job_finish(x-job-run). Not scheduled in this PR: run it by hand with the
// cron secret, or add a pg_cron tick after the owner approves (ops.call_function('surense-worker')).
// Overlapping runs are safe (FOR UPDATE SKIP LOCKED + 2-minute lock). Job failures are not run failures; the DB backs
// them off and dead-letters at attempt 5 with a critical alert. One retry layer: the client makes ONE HTTP attempt per
// call (WORKER_MAX_ATTEMPTS, so no in-client sleep inside the 2-minute lease); a retryable failure goes back to the
// queue with its kind and the server's retry-after (api.surense_job_complete p_error_kind / p_retry_after). Switch surense_enabled off -> claim raises PT423 ->
// the run stops cleanly. Logs: job ids, kinds, result codes and counts only; never a payload.
import { type Defer, jobRunId } from "../_shared/background.ts";
import { type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { requireCronSecret } from "../_shared/secret.ts";
import type { TokenSource } from "../_shared/surense/auth.ts";
import { buildSyncDeps } from "../_shared/surense/connector.ts";
import { type JobRow, runJob } from "../_shared/surense/jobs.ts";
import type { DpClient } from "../_shared/poa/dp.ts";
import { createSurenseEngine } from "../_shared/poa/engine/surense.ts";

export const BUDGET_MS = 72_000;
export const MIN_CLAIM_HEADROOM_MS = 20_000;
export const CLAIM_LIMIT = 5;
/** HTTP attempts per Surense call inside a job: the queue is the only retry layer */
export const WORKER_MAX_ATTEMPTS = 1;

export interface SurenseWorkerDeps {
  env: Env;
  rpc: Rpc | null;
  log: Logger;
  defer: Defer;
  tokens: TokenSource | null;
  /** the tool's public-page client + the manager id for the POA ship job; absent = that job fails with engine_not_configured */
  poa?: { dp: DpClient; managerId: string | null } | null;
  fetch?: FetchFn;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  budgetMs?: number;
  minIntervalMs?: number;
}

export interface WorkerStats {
  claimed: number;
  done: number;
  skipped: number;
  failed: number;
  batches: number;
  disabled: boolean;
}

export async function drainJobs(d: SurenseWorkerDeps, rpc: Rpc, tokens: TokenSource, log: Logger): Promise<WorkerStats> {
  const now = d.now ?? Date.now;
  const start = now();
  const budget = d.budgetMs ?? BUDGET_MS;
  const sync = buildSyncDeps({
    env: d.env, rpc, log, tokens, fetch: d.fetch, sleep: d.sleep, now: d.now, minIntervalMs: d.minIntervalMs, maxAttempts: WORKER_MAX_ATTEMPTS,
  });
  // the ship job replays a completed session into the tool with the same engine poa-intake uses for the live chain
  if (d.poa) sync.poaEngine = createSurenseEngine({ api: sync.api, dp: d.poa.dp, managerId: d.poa.managerId, log, now: d.now });
  const stats: WorkerStats = { claimed: 0, done: 0, skipped: 0, failed: 0, batches: 0, disabled: false };

  while (now() - start < budget - MIN_CLAIM_HEADROOM_MS) {
    let rows: JobRow[];
    try {
      rows = (await rpc.call<JobRow[]>("surense_job_claim", { p_limit: CLAIM_LIMIT })) ?? [];
    } catch (e) {
      if (e instanceof RpcError && e.status === 423) {
        stats.disabled = true;
        log.info("surense switch off; nothing claimed");
        break;
      }
      throw e;
    }
    if (!rows.length) break;
    stats.batches++;
    stats.claimed += rows.length;
    for (const job of rows) {
      // each job gets the remaining budget, minus headroom to complete it
      const deadline = start + budget - MIN_CLAIM_HEADROOM_MS / 2;
      const out = await runJob(sync, job, deadline);
      // p_attempts = the claim's value: if the lock expired and another run took the job, this complete is a no-op
      await rpc.call("surense_job_complete", {
        p_id: job.id, p_attempts: job.attempts, p_result: out.result, p_error: out.code ?? null, p_error_kind: out.kind ?? null,
        p_retry_after: out.result === "failed" ? out.retryAfterSec ?? null : null,
      });
      stats[out.result]++;
      log.info("surense job", {
        jobId: job.id, kind: job.kind, eventType: job.event_type, result: out.result, code: out.code ?? null, errorKind: out.kind ?? null,
        retryAfterSec: out.retryAfterSec ?? null, attempt: job.attempts, ...(out.stats ?? {}),
      });
      if (out.next && out.result === "done") {
        await rpc.call("surense_job_enqueue", { p_kind: out.next.kind, p_params: out.next.params, p_dedupe: out.next.dedupe });
      }
    }
  }
  return stats;
}

export function createSurenseWorkerHandler(d: SurenseWorkerDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const rid = requestIdFor(req);
    const log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
      await requireCronSecret(req, d.env.cronSecret);
      if (!d.rpc) throw new HttpError("unavailable", "Not configured");
      const rpc = d.rpc;
      const run = jobRunId(req);
      d.defer((async () => {
        const t0 = Date.now();
        try {
          if (!d.tokens) {
            // claiming would spend attempts with no way to call Surense: leave the queue untouched and fail the run
            log.error("SURENSE_CLIENT_ID/SURENSE_CLIENT_SECRET not set; queue left untouched");
            if (run) await rpc.call("job_finish", { p_run: run, p_ok: false, p_stats: {}, p_error: "surense_not_configured" });
            return;
          }
          const stats = await drainJobs(d, rpc, d.tokens, log);
          log.info("surense run done", { run, ...stats, ms: Date.now() - t0 });
          if (run) await rpc.call("job_finish", { p_run: run, p_ok: true, p_stats: { ...stats, ms: Date.now() - t0 }, p_error: null });
        } catch (e) {
          const code = e instanceof RpcError ? e.code : e instanceof Error ? e.name : "unknown";
          log.error("surense run failed", { run, code });
          if (run) {
            await rpc.call("job_finish", { p_run: run, p_ok: false, p_stats: {}, p_error: code }).catch(() => {
              log.error("job_finish failed", { run });
            });
          }
        }
      })());
      return jsonResponse({ accepted: true, run }, rid, { status: 202 });
    } catch (e) {
      if (!(e instanceof HttpError)) log.error("surense-worker error", { error: e instanceof Error ? e.name : "unknown" });
      return errorResponse(e, rid);
    }
  };
}
