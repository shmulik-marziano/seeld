// queue-worker entrypoint. SCAFFOLD: NOT deployed. Deploy only after owner approval (see docs/platform/EVENT-ARCHITECTURE.md).
// Triggered by pg_cron + pg_net (supabase/proposed/09_alerting_and_cron.sql): POST { "destination": "salesforce" | "surense" }.
// verify_jwt = false for this function when deployed; the request is authenticated with the shared secret header instead.
// Configuration, all from env / edge function secrets (never in the repo):
//   SUPABASE_URL                              injected by Supabase
//   SEELD_SECRET_KEY                          secret API key (sb_secret_*), set as an edge function secret
//   WORKER_SHARED_SECRET                      must equal Vault secret 'queue_worker_secret'
//   SYSTEMS_MODE                              unconfigured | surense_only | salesforce_only | both_parallel
// Before deploy: the imports below reach into src/platform (pure TS). Bundle them with an import map or copy them into
// supabase/functions/_shared (open item in the doc).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import { requestIdFor } from "../_shared/request.ts";
import { runBatch, type QueueDb } from "../_shared/queueWorker.ts";
import { dispatchAlerts, logOnlySender, type AlertDb } from "../_shared/alerts.ts";
import { adaptersFor, enabledDestinations, parseSystemsMode } from "../../../src/platform/systems/config.ts";
import type { Destination } from "../../../src/platform/queue/policy.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): unknown };

const log = createLogger({ fn: "queue-worker" });

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDb(sb: any): QueueDb & AlertDb {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = async (fn: string, args: Record<string, unknown>): Promise<any> => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new Error(`rpc ${fn} failed: ${error.code ?? "error"}`); // message only, never payloads
    return data;
  };
  return {
    readBatch: (d) => rpc("queue_read_batch", { p_destination: d }),
    claim: (d, id, c, seq, w) => rpc("queue_claim", { p_destination: d, p_msg_id: id, p_customer_key: c, p_seq: seq, p_worker: w }),
    loadFields: (c, keys) => rpc("queue_load_fields", { p_customer: c, p_field_keys: keys }),
    getExternalId: async (c, d) => {
      const rows = await rpc("identity_get_external_ids", { p_customer: c });
      const r = Array.isArray(rows) ? rows[0] : rows;
      return (d === "salesforce" ? r?.salesforce_id : r?.surense_id) ?? null;
    },
    setExternalId: async (c, d, id) => (await rpc("identity_set_external_id", { p_customer: c, p_system: d, p_external_id: id })) as "ok" | "conflict",
    complete: async (d, id, c, seq, w, e) => void (await rpc("queue_complete", { p_destination: d, p_msg_id: id, p_customer_key: c, p_seq: seq, p_worker: w, p_event_id: e })),
    recordFailure: (d, c, seq, id, e, code) => rpc("queue_record_failure", { p_destination: d, p_customer_key: c, p_seq: seq, p_msg_id: id, p_event_id: e, p_code: code }),
    scheduleRetry: async (d, id, c, delay) => void (await rpc("queue_schedule_retry", { p_destination: d, p_msg_id: id, p_customer_key: c, p_delay_sec: delay })),
    release: async (d, id, delay, c, w) => void (await rpc("queue_release", { p_destination: d, p_msg_id: id, p_delay_sec: delay, p_customer_key: c ?? null, p_worker: w ?? null })),
    deadLetter: async (d, id, c, seq, msg, reason, code) =>
      void (await rpc("queue_dead_letter", { p_destination: d, p_msg_id: id, p_customer_key: c, p_seq: seq, p_message: msg, p_reason: reason, p_code: code })),
    claimPending: (limit) => rpc("alerts_claim_pending", { p_limit: limit }),
    recipients: (sev) => rpc("get_alert_recipients", { p_severity: sev }),
    mark: async (id, status) => void (await rpc("alerts_mark", { p_id: id, p_status: status })),
  };
}

Deno.serve(async (req) => {
  const requestId = requestIdFor(req);
  try {
    if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
    const secret = Deno.env.get("WORKER_SHARED_SECRET") ?? "";
    if (!secret || !safeEqual(req.headers.get("x-worker-secret") ?? "", secret)) throw new HttpError("unauthenticated", "Bad worker secret");

    const body = (await req.json().catch(() => ({}))) as { destination?: string };
    const dest = body.destination as Destination;
    if (dest !== "salesforce" && dest !== "surense") throw new HttpError("bad_request", "destination must be salesforce or surense");

    const mode = parseSystemsMode(Deno.env.get("SYSTEMS_MODE"));
    if (!enabledDestinations(mode).includes(dest)) return jsonResponse({ destination: dest, skipped: "destination_disabled" }, requestId);
    const adapter = adaptersFor(mode)[dest]!;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SEELD_SECRET_KEY")!, { auth: { persistSession: false } });
    const db = makeDb(sb);
    const l = log.child({ requestId, destination: dest });
    const summary = await runBatch({
      destination: dest, adapter, policy: adapter.profile.queue, db, log: l,
      workerId: `w-${requestId}`, now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    const alerts = await dispatchAlerts(db, logOnlySender(l), l);
    l.info("batch done", { ...summary });
    return jsonResponse({ summary, alerts }, requestId);
  } catch (e) {
    log.error("worker error", { requestId, message: e instanceof Error ? e.message : "unknown" });
    return errorResponse(e, requestId);
  }
});
