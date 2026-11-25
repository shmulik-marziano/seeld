// surense.harb_import: one Har HaBituach file the client uploaded in the personal area (crm.documents kind harb_xlsx,
// source client) goes to Surense's data import, the same parsing as "טעינת קבצים -> קבצי הר הביטוח" in their UI:
//   GET /data-import/providers -> the provider picked by ops.config surense_harb_provider_match (its id, or a part of its
//   name; exactly one enabled provider must match) -> POST /data-import/initiate (one file, params.customerId when the
//   client is in our Surense mirror) -> PUT the file inside a ZIP to uploadUrl (host-locked: DATA_IMPORT_UPLOAD_HOSTS) ->
//   POST /data-import/{id}/start -> follow-up job polls GET /data-import/{id} until PROCESSED / FAILED.
// Gates: api.harb_import_get raises PT423 unless client_area_harb_upload_enabled AND surense_harb_import_enabled are on
// (surense_enabled already gates the queue). An empty upload-host list or an empty provider match ends the job skipped
// BEFORE any Surense call. Our code never calls revert (no deletions from our side). Each phase is written back
// (api.harb_import_set: status + Surense import id + code), so a retry resumes instead of importing twice.
// Logs and stored codes: ids, statuses, codes. Never the file, the national id or Surense's failureReason (it can echo values).
import { RpcError } from "../db.ts";
import { isUuid } from "./api.ts";
import { DATA_IMPORT_UPLOAD_HOSTS } from "./client.ts";
import { SurenseError, type SurenseFailureKind } from "./errors.ts";
import { sha256Hex } from "./storage.ts";
import type { SyncDeps } from "./sync.ts";
import type { DataImportProvider } from "./types.ts";
import { zipStored } from "../harb/zip.ts";
import { todayIsrael } from "../poa/formatters.ts";

export const HARB_JOB_KIND = "surense.harb_import";
/** seconds between polls of a running import (the queue schedules them: 2 min, then its own backoff 5m, 30m, 2h) */
export const POLL_RETRY_SEC = 120;
/** Surense answers initiate with 403 while another import of the same user runs (< 60 min) */
export const BUSY_RETRY_SEC = 900;

export interface HarbImportInfo {
  storage_path?: string | null;
  sha256?: string | null;
  surense_customer_id?: string | null;
  provider_match?: string | null;
  import_status?: string | null;
  import_id?: string | null;
}

export interface HarbOutcome {
  result: "done" | "skipped" | "failed";
  code?: string;
  kind?: SurenseFailureKind | "db" | "storage" | "input" | "internal";
  retryAfterSec?: number | null;
  next?: { kind: string; params: Record<string, unknown>; dedupe: string };
  stats?: Record<string, number | boolean | string>;
  /** the Surense customer whose portfolio changed (PROCESSED): jobs.ts queues the portfolio pull */
  portfolioFor?: string;
}

export type ProviderPlan = { ok: true; providerId: string; params: Record<string, unknown> } | { ok: false; code: string };

/** pure: the provider to import with. `match` = a provider id, or a case-insensitive part of its name. */
export function planProvider(list: DataImportProvider[] | null | undefined, match: string | null | undefined, customerId: string | null): ProviderPlan {
  const m = (match ?? "").trim().toLowerCase();
  if (!m) return { ok: false, code: "provider_not_configured" };
  const enabled = (Array.isArray(list) ? list : []).filter((p) => p && isUuid(p.id) && p.enabled !== false);
  const hits = isUuid(m)
    ? enabled.filter((p) => p.id.toLowerCase() === m)
    : enabled.filter((p) => typeof p.name === "string" && p.name.toLowerCase().includes(m));
  if (hits.length === 0) return { ok: false, code: "provider_not_found" };
  if (hits.length > 1) return { ok: false, code: "provider_ambiguous" };
  const p = hits[0];
  const props = p.properties ?? {};
  // parameters we cannot supply for a client's own file: an open question to Surense, never a guess
  if (props.validityMonthRequired === true) return { ok: false, code: "provider_needs_validity_month" };
  if (Array.isArray(p.subProviders) && p.subProviders.length > 0 && props.autoDetectSubProvider !== true) {
    return { ok: false, code: "provider_needs_sub_provider" };
  }
  if (props.managerRequired === true && !customerId) return { ok: false, code: "provider_needs_customer" };
  return { ok: true, providerId: p.id.toLowerCase(), params: customerId ? { customerId } : {} };
}

/** the name of the file inside the ZIP (no id, no name of the client) */
export const harbFileName = (nowMs: number) => `harb_${todayIsrael(nowMs)}.xlsx`;

const str = (p: Record<string, unknown> | null | undefined, k: string) => (p && typeof p[k] === "string" ? (p[k] as string) : undefined);

export async function harbImportJob(d: SyncDeps, params: Record<string, unknown> | null): Promise<HarbOutcome> {
  const now = d.now ?? Date.now;
  const docId = str(params, "document_id")?.toLowerCase();
  const pollId = str(params, "import_id")?.toLowerCase();
  if (!isUuid(docId) || (pollId !== undefined && !isUuid(pollId))) return { result: "skipped", code: "bad_input", kind: "input" };

  let info: HarbImportInfo;
  try {
    info = (await d.rpc.call<HarbImportInfo>("harb_import_get", { p_document: docId })) ?? {};
  } catch (e) {
    if (e instanceof RpcError && e.status === 423) return { result: "skipped", code: "harb_switch_off" };
    if (e instanceof RpcError && e.status === 404) return { result: "skipped", code: "document_not_found" };
    throw e;
  }
  const mark = (status: string, code: string | null, importId: string | null) =>
    d.rpc.call("harb_import_set", { p_document: docId, p_status: status, p_import_id: importId, p_code: code });
  const customer = isUuid(info.surense_customer_id) ? info.surense_customer_id.toLowerCase() : null;
  const known = isUuid(info.import_id) ? info.import_id.toLowerCase() : null;
  const pollNext = (id: string) => ({ kind: HARB_JOB_KIND, params: { document_id: docId, import_id: id }, dedupe: `harb:${docId}` });

  // ------------------------------------------------------------ resume / poll
  if (info.import_status === "processed" || info.import_status === "failed") return { result: "skipped", code: "already_final" };
  if ((pollId || info.import_status === "sent") && known) {
    const r = await d.api.dataImport.get(known);
    if (r?.status === "PROCESSED") {
      await mark("processed", null, known);
      return { result: "done", stats: { processed: true }, ...(customer ? { portfolioFor: customer } : {}) };
    }
    if (r?.status === "FAILED") {
      await mark("failed", "import_failed", known);
      return { result: "done", code: "import_failed", stats: { processed: false } };
    }
    // INITIATED here means our start did not take: start is idempotent, ask again, then keep polling
    if (r?.status === "INITIATED") await d.api.dataImport.start(known);
    return { result: "failed", code: "import_pending", kind: "unavailable", retryAfterSec: POLL_RETRY_SEC };
  }
  if (info.import_status === "uploaded" && known) {
    await d.api.dataImport.start(known);
    await mark("sent", null, known);
    return { result: "done", stats: { resumed: true }, next: pollNext(known) };
  }

  // ------------------------------------------------------------ a fresh push: every gate before the first Surense call
  const hosts = d.dataImportHosts ?? DATA_IMPORT_UPLOAD_HOSTS;
  if (!hosts.length) {
    await mark("skipped", "upload_host_not_approved", null);
    return { result: "skipped", code: "upload_host_not_approved" };
  }
  if (!(info.provider_match ?? "").trim()) {
    await mark("skipped", "provider_not_configured", null);
    return { result: "skipped", code: "provider_not_configured" };
  }
  if (!d.objects) return { result: "failed", code: "storage_not_configured", kind: "config" };
  if (typeof info.storage_path !== "string" || !info.storage_path) return { result: "skipped", code: "not_stored" };
  const xlsx = await d.objects.get(info.storage_path);
  if (!xlsx) {
    await mark("skipped", "file_missing", null);
    return { result: "skipped", code: "file_missing" };
  }
  if (!info.sha256 || (await sha256Hex(xlsx)) !== info.sha256) {
    await mark("skipped", "file_changed", null);
    return { result: "skipped", code: "file_changed" };
  }

  const plan = planProvider(await d.api.dataImport.providers(), info.provider_match, customer);
  if (!plan.ok) {
    await mark("skipped", plan.code, null);
    return { result: "skipped", code: plan.code };
  }
  const fileName = harbFileName(now());
  let init;
  try {
    init = await d.api.dataImport.initiate({ provider: plan.providerId, files: [{ fileName, fileSize: xlsx.byteLength }], params: plan.params });
  } catch (e) {
    // 403: another import of the same Surense user still runs (or a scope/agency refusal): later, dead + alert at attempt 5
    if (e instanceof SurenseError && e.status === 403) return { result: "failed", code: "surense_403_busy", kind: "rate_limited", retryAfterSec: BUSY_RETRY_SEC };
    throw e;
  }
  const rec = init?.record;
  const url = init?.uploadUrl;
  if (!rec || !isUuid(rec.id) || typeof url !== "string") {
    await mark("skipped", "bad_initiate_response", null);
    return { result: "skipped", code: "bad_initiate_response" };
  }
  const importId = rec.id.toLowerCase();
  if (rec.status === "FAILED") {
    await mark("failed", "import_failed", importId);
    return { result: "done", code: "import_failed", stats: { processed: false } };
  }
  await mark("initiated", null, importId);

  // the upload leaves an audit pair like every other write (pending before, result after); no audit row, no upload
  const zip = zipStored([{ name: fileName, bytes: xlsx }], new Date(now()));
  await d.rpc.call("surense_audit", { p_op: "data_import.upload", p_ref: importId, p_status: null, p_phase: "pending" });
  let status = 0;
  try {
    status = await d.api.dataImport.put(url, zip, hosts);
  } catch (e) {
    const se = e instanceof SurenseError ? e : null;
    await d.rpc.call("surense_audit", { p_op: "data_import.upload", p_ref: importId, p_status: se?.status ?? 0, p_phase: se?.kind === "unavailable" ? "ambiguous" : "result" })
      .catch(() => d.log.warn("surense audit write failed", { op: "data_import.upload" }));
    if (se?.code === "host_not_allowed" || se?.code === "bad_url") {
      await mark("skipped", "upload_host_not_allowed", importId);
      return { result: "skipped", code: "upload_host_not_allowed" };
    }
    throw e;
  }
  await d.rpc.call("surense_audit", { p_op: "data_import.upload", p_ref: importId, p_status: status, p_phase: "result" })
    .catch(() => d.log.warn("surense audit write failed", { op: "data_import.upload" }));
  await mark("uploaded", null, importId);
  await d.api.dataImport.start(importId);
  await mark("sent", null, importId);
  d.log.info("harb import sent", { document: docId, importId, customerKnown: !!customer });
  return { result: "done", stats: { sent: true, bytes: xlsx.byteLength }, next: pollNext(importId) };
}
