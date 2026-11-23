// notify-worker: drains ops.outbox (FOUNDATION §7). pg_cron -> ops.call_function('notify-worker') every minute.
// Contract: x-cron-secret, 202 at once, work in EdgeRuntime.waitUntil, api.outbox_claim(20) -> Resend with
// Idempotency-Key outbox-<id> -> api.outbox_complete, stop claiming after 72 s, api.job_finish(x-job-run).
// Overlapping runs are safe: outbox_claim uses FOR UPDATE SKIP LOCKED plus a 2-minute lock, so a row is taken once.
// Delivery failures are NOT job failures: the DB backs them off (1m, 5m, 30m, 2h) and dead-letters after 5 attempts.
// Logs carry outbox ids, topics and codes only: never an address, a name or a summary.
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { cronSecretViaRpc, requireCronSecret } from "../_shared/secret.ts";
import { type Defer, jobRunId } from "../_shared/background.ts";
import { type Email, escapeHtml, sendEmail } from "../_shared/resend.ts";

export const BUDGET_MS = 72_000;
export const CLAIM_LIMIT = 20;
/** do not claim a new batch with less than this left: a claimed row costs an attempt even if never sent */
export const MIN_CLAIM_HEADROOM_MS = 20_000;

export interface OutboxRow {
  id: number;
  topic: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export interface WorkerDeps {
  env: Env;
  rpc: Rpc | null;
  log: Logger;
  defer: Defer;
  fetch?: FetchFn;
  now?: () => number;
  budgetMs?: number;
}

export type Department = "insurance" | "finance" | "general";

export const KIND_LABEL: Record<string, string> = {
  insurance: "ביטוח",
  pension: "פנסיה וחיסכון",
  portfolio_review: "בדיקת תיק",
  report: "דוח",
  contact: "פנייה כללית",
};

const EMAIL_RE = /^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/;

/** insurance leads -> insurance desk; pension / portfolio / report -> finance; contact -> general,
 *  unless the (optional) details say the contact is about insurance, as the Tokyo function did. */
export function departmentFor(kind: unknown, details?: Record<string, unknown> | null): Department {
  if (kind === "insurance") return "insurance";
  if (kind === "pension" || kind === "portfolio_review" || kind === "report") return "finance";
  const extra = details && typeof details.payload === "object" && details.payload ? details.payload as Record<string, unknown> : {};
  const subject = typeof extra.subject === "string" ? extra.subject : "";
  if (/ביטוח|נסיעות|נסיעה/.test(subject) || typeof extra.insurance_type === "string") return "insurance";
  return "general";
}

/** Only a timestamp that is stored with the lead (deterministic across retries), never "now". */
function when(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }) : null;
}

function row(label: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value).slice(0, 4000))}</p>`;
}

/** Pure and DETERMINISTIC per row: a lead.created outbox row (+ optional details) -> the staff e-mail. Without details it
 *  holds no PII. Resend answers 409 invalid_idempotent_request when one Idempotency-Key (outbox-<id>) comes back with a
 *  different body, so nothing here may depend on the time of the attempt. */
export function leadEmail(env: Env, r: OutboxRow, details: Record<string, unknown> | null): Email {
  const kind = String(r.payload.kind ?? "");
  const label = KIND_LABEL[kind] ?? "פנייה";
  const leadId = String(r.payload.lead_id ?? "");
  const link = `${env.staffAppUrl}/app/leads/${encodeURIComponent(leadId)}`;
  const dept = departmentFor(kind, details);
  let pii = "";
  if (details) {
    const extra = details.payload && typeof details.payload === "object" ? details.payload as Record<string, unknown> : {};
    pii = `<div style="background:#f3f6f4;padding:16px;border-radius:8px;margin:16px 0">` +
      row("שם", details.full_name) + row("טלפון", details.phone) + row("אימייל", details.email) +
      row("הודעה", details.message) +
      Object.entries(extra).map(([k, v]) => row(k, v)).join("") + `</div>`;
  }
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:16px">` +
    `<h2 style="margin:0 0 12px">פנייה חדשה מהאתר: ${escapeHtml(label)}</h2>` +
    row("סוג", label) + row("התקבלה", when(details?.created_at ?? r.payload.created_at)) + pii +
    `<p><a href="${escapeHtml(link)}">פתיחת הפנייה במערכת</a></p>` +
    `<p style="color:#777;font-size:12px">מזהה: ${escapeHtml(leadId)}${r.payload.request_id ? ` · בקשה ${escapeHtml(String(r.payload.request_id))}` : ""}</p>` +
    `</div>`;
  const text = `פנייה חדשה מהאתר: ${label}\n${link}\nמזהה: ${leadId}`;
  return { from: env.notifyFrom, to: env.notifyTo[dept], subject: `פנייה חדשה (${label})`, html, text };
}

/** Pure and deterministic per row: an alert outbox row -> the alert e-mail. Recipients come from the CLAIMED payload
 *  (091600), never stored. No send-time timestamp (see leadEmail); the alert id identifies the event. */
export function alertEmail(env: Env, r: OutboxRow): Email | null {
  const to = Array.isArray(r.payload.recipients)
    ? (r.payload.recipients as unknown[]).filter((x): x is string => typeof x === "string" && EMAIL_RE.test(x))
    : [];
  if (!to.length) return null;
  const sev = String(r.payload.severity ?? "warning");
  const kind = String(r.payload.kind ?? "alert");
  const summary = String(r.payload.summary ?? "");
  return {
    from: env.notifyFrom,
    to,
    subject: `[SEELD ${sev}] ${kind}`,
    html: `<div style="font-family:Arial,sans-serif;padding:16px"><h3>${escapeHtml(kind)} (${escapeHtml(sev)})</h3>` +
      `<p>${escapeHtml(summary)}</p><p style="color:#777;font-size:12px">alert ${escapeHtml(String(r.payload.alert_id ?? ""))}</p></div>`,
    text: `${kind} (${sev}): ${summary}`,
  };
}

export interface RunStats {
  claimed: number;
  sent: number;
  failed: number;
  batches: number;
}

export async function drainOutbox(d: WorkerDeps, rpc: Rpc, log: Logger): Promise<RunStats> {
  const now = d.now ?? Date.now;
  const start = now();
  const budget = d.budgetMs ?? BUDGET_MS;
  const stats: RunStats = { claimed: 0, sent: 0, failed: 0, batches: 0 };
  let detailsAvailable = d.env.notifyIncludePii;

  const complete = async (id: number, ok: boolean, code?: string) => {
    await rpc.call("outbox_complete", { p_id: id, p_ok: ok, p_error: ok ? null : code ?? "error" });
    if (ok) stats.sent++;
    else stats.failed++;
  };

  while (now() - start < budget - MIN_CLAIM_HEADROOM_MS) {
    const rows = (await rpc.call<OutboxRow[]>("outbox_claim", { p_limit: CLAIM_LIMIT })) ?? [];
    if (!rows.length) break;
    stats.batches++;
    stats.claimed += rows.length;
    for (const r of rows) {
      let email: Email | null = null;
      if (r.topic === "alert") {
        email = alertEmail(d.env, r);
        if (!email) {
          log.warn("alert has no recipients", { outboxId: r.id });
          await complete(r.id, false, "no_recipients");
          continue;
        }
      } else if (r.topic === "lead.created") {
        let details: Record<string, unknown> | null = null;
        if (detailsAvailable) {
          try {
            details = await rpc.call<Record<string, unknown> | null>("lead_notify_details", { p_lead_id: r.payload.lead_id });
          } catch (e) {
            if (e instanceof RpcError && (e.code === "PGRST202" || e.status === 404)) {
              detailsAvailable = false; // RPC not deployed: send the PII-free e-mail
              log.warn("lead_notify_details missing; sending without details");
            } else {
              log.warn("lead details failed", { outboxId: r.id, code: e instanceof RpcError ? e.code : "unknown" });
              await complete(r.id, false, "details_failed");
              continue;
            }
          }
        }
        email = leadEmail(d.env, r, details);
      } else {
        log.warn("unknown outbox topic", { outboxId: r.id, topic: r.topic.slice(0, 40) });
        await complete(r.id, false, "unknown_topic");
        continue;
      }
      const res = await sendEmail(d.env.resendApiKey as string, email, `outbox-${r.id}`, { fetch: d.fetch });
      if (res.ok) {
        await complete(r.id, true);
      } else if (res.status === 409 && res.code === "invalid_idempotent_request") {
        // Resend already holds outbox-<id> with another body: an earlier attempt reached Resend (e.g. we timed out
        // after it accepted, then the alert recipients changed). Retrying can only repeat the 409 until the row is
        // dead-lettered, so count it as sent and leave a trace. (concurrent_idempotent_requests stays a retry.)
        log.warn("resend idempotency mismatch; treated as sent", { outboxId: r.id, topic: r.topic, attempt: r.attempts });
        await complete(r.id, true);
      } else {
        log.warn("send failed", { outboxId: r.id, topic: r.topic, status: res.status, code: res.code, attempt: r.attempts });
        await complete(r.id, false, `resend_${res.code}`);
      }
    }
  }
  return stats;
}

export function createWorkerHandler(d: WorkerDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const rid = requestIdFor(req);
    const log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
      await requireCronSecret(req, d.env.cronSecret, d.rpc ? cronSecretViaRpc(d.rpc) : undefined);
      if (!d.rpc) throw new HttpError("unavailable", "Not configured");
      const rpc = d.rpc;
      const run = jobRunId(req);
      d.defer((async () => {
        const t0 = Date.now();
        try {
          if (!d.env.resendApiKey) {
            // claiming would spend attempts with no way to send: leave the outbox untouched and fail the run
            log.error("RESEND_API_KEY not set; outbox left untouched");
            if (run) await rpc.call("job_finish", { p_run: run, p_ok: false, p_stats: {}, p_error: "resend_not_configured" });
            return;
          }
          const stats = await drainOutbox(d, rpc, log);
          log.info("notify run done", { run, ...stats, ms: Date.now() - t0 });
          if (run) await rpc.call("job_finish", { p_run: run, p_ok: true, p_stats: { ...stats, ms: Date.now() - t0 }, p_error: null });
        } catch (e) {
          const code = e instanceof RpcError ? `${e.code}` : e instanceof Error ? e.name : "unknown";
          log.error("notify run failed", { run, code });
          if (run) {
            await rpc.call("job_finish", { p_run: run, p_ok: false, p_stats: {}, p_error: code }).catch(() => {
              log.error("job_finish failed", { run });
            });
          }
        }
      })());
      return jsonResponse({ accepted: true, run }, rid, { status: 202 });
    } catch (e) {
      if (!(e instanceof HttpError)) log.error("notify-worker error", { error: e instanceof Error ? e.name : "unknown" });
      return errorResponse(e, rid);
    }
  };
}
