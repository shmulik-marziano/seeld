// surense-sync (verify_jwt=true): staff-only operations against Surense, POST {action, ...}.
// Auth: the caller's JWT -> staff.admin_assert_fresh() (admin with a fresh TOTP step-up; the same gate staff-invite
// uses), then the work runs with the service key. Flags: api.surense_gate(write, action) before any Surense call:
// surense_enabled for every action, plus surense_write_enabled for invite-proxies and e9100-submit (both write to
// Surense), plus surense_e9100_enabled for e9100-submit. Every RPC also re-checks surense_enabled in SQL.
// Writes (proxies invite, E9100 submit, and any customers.create through the client): the audit row is written
// BEFORE the request (no audit, no request), completed with the HTTP status after; a write is never retried on a
// timeout, and an unknown outcome (timeout / network / 502 / 504) answers 409 with reason "ambiguous_check_surense":
// check Surense before trying again. Long work (pull-customers beyond one slice, background documents/E9100 files)
// goes through api.surense_job_enqueue for surense-worker.
//   health          GET /user/info + /licensees + /swiftness/accounts/list + /documents/types: ids, flags and names only
//   pull-customers  one budgeted slice of the cursor-paged customer pass; the rest is queued (surense.pull_customers)
//   pull-documents  {customerId} or {since: YYYY-MM-DD}
//   invite-proxies  {customerId|leadId, nispahAlef?, swiftnessAccountId?, nispahHei?, nispahBet?, policies?, licenseeId?,
//                   cellNumber?, email?, partner...}: returns the approval url only; nothing is sent to the customer
//   e9100-submit    {customerId, registrationId, proxyApprovalDate}
//   e9100-download  {customerId, eventId}: files into client-docs (hash-named) + crm.surense_documents
//   portfolio       {customerId, mode: production|pre_advice, misparMislaka?, hbValidityDate?}: encrypted snapshot
// Logs: action, caller id, ids, counts, codes. Never request or response bodies.
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { createRpc, type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { isUuid } from "../_shared/surense/api.ts";
import type { TokenSource } from "../_shared/surense/auth.ts";
import { buildSyncDeps } from "../_shared/surense/connector.ts";
import { SurenseError } from "../_shared/surense/errors.ts";
import { e9100Download, e9100Submit, health, inviteProxies, portfolio, pullCustomers, pullDocuments } from "../_shared/surense/sync.ts";
import type { ProxiesInviteRequest, ProxyPolicy } from "../_shared/surense/types.ts";

export const MAX_BODY_BYTES = 65_536;
/** one inline slice; the remainder is queued for surense-worker */
export const INLINE_BUDGET_MS = 40_000;

export const ACTIONS = ["health", "pull-customers", "pull-documents", "invite-proxies", "e9100-submit", "e9100-download", "portfolio"] as const;
export type Action = (typeof ACTIONS)[number];
const WRITE_ACTIONS: readonly Action[] = ["invite-proxies", "e9100-submit"];

export interface SyncHandlerDeps {
  env: Env;
  /** service-key RPC client (api schema) */
  rpc: Rpc | null;
  /** staff-schema RPC client acting as the caller (their JWT) */
  staffRpc?: (jwt: string) => Rpc;
  log: Logger;
  tokens: TokenSource | null;
  fetch?: FetchFn;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (field: string) => new HttpError("validation_failed", "Invalid input", { details: { field } });
const optBool = (v: unknown, f: string) => {
  if (v !== undefined && typeof v !== "boolean") throw bad(f);
  return v as boolean | undefined;
};
const optUuid = (v: unknown, f: string) => {
  if (v !== undefined && !isUuid(v)) throw bad(f);
  return v as string | undefined;
};
const reqUuid = (v: unknown, f: string) => {
  if (!isUuid(v)) throw bad(f);
  return v;
};
const optText = (v: unknown, f: string, re: RegExp) => {
  if (v !== undefined && (typeof v !== "string" || !re.test(v))) throw bad(f);
  return v as string | undefined;
};
const PHONE = /^\+?[0-9 -]{7,20}$/;
const EMAIL = /^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,20}$/;

export function parseInvite(b: Record<string, unknown>): ProxiesInviteRequest {
  const customerId = optUuid(b.customerId, "customerId");
  const leadId = optUuid(b.leadId, "leadId");
  if (!!customerId === !!leadId) throw bad("customerId");
  const nispahAlef = optBool(b.nispahAlef, "nispahAlef");
  const nispahHei = optBool(b.nispahHei, "nispahHei");
  const nispahBet = optBool(b.nispahBet, "nispahBet");
  if (!nispahAlef && !nispahHei && !nispahBet) throw bad("nispah");
  const swiftnessAccountId = optUuid(b.swiftnessAccountId, "swiftnessAccountId");
  if (nispahAlef && !swiftnessAccountId) throw bad("swiftnessAccountId");
  let policies: ProxyPolicy[] | undefined;
  if (b.policies !== undefined) {
    if (!Array.isArray(b.policies) || b.policies.length > 50) throw bad("policies");
    policies = b.policies.map((p) => {
      const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
      if (!Number.isInteger(o.type) || (o.type as number) < 1 || (o.type as number) > 46) throw bad("policies.type");
      if (!Number.isInteger(o.company)) throw bad("policies.company");
      if (typeof o.policy !== "string" || !/^[A-Za-z0-9/ -]{1,40}$/.test(o.policy)) throw bad("policies.policy");
      if (o.sivugPolisa !== undefined && !["אישי", "קבוצתי", "קבוצתי_קופת_חולים"].includes(o.sivugPolisa as string)) throw bad("policies.sivugPolisa");
      return { type: o.type as number, company: o.company as number, policy: o.policy, ...(o.sivugPolisa ? { sivugPolisa: o.sivugPolisa as ProxyPolicy["sivugPolisa"] } : {}) };
    });
  }
  if (nispahBet && !policies?.length) throw bad("policies");
  const partner = optBool(b.partner, "partner");
  return {
    ...(customerId ? { customerId } : { leadId }),
    ...(optUuid(b.licenseeId, "licenseeId") ? { licenseeId: b.licenseeId as string } : {}),
    ...(nispahAlef ? { nispahAlef, swiftnessAccountId } : {}),
    ...(nispahHei ? { nispahHei } : {}),
    ...(nispahBet ? { nispahBet, policies } : {}),
    ...(optText(b.cellNumber, "cellNumber", PHONE) ? { cellNumber: b.cellNumber as string } : {}),
    ...(optText(b.email, "email", EMAIL) ? { email: b.email as string } : {}),
    ...(partner
      ? {
        partner,
        ...(optText(b.partnerCellNumber, "partnerCellNumber", PHONE) ? { partnerCellNumber: b.partnerCellNumber as string } : {}),
        ...(optText(b.partnerEmail, "partnerEmail", EMAIL) ? { partnerEmail: b.partnerEmail as string } : {}),
      }
      : {}),
  };
}

/** the reason code for a write whose outcome is unknown (see SurenseError.ambiguous) */
export const AMBIGUOUS_REASON = "ambiguous_check_surense";

/** Surense / DB failure -> HTTP error with codes only */
export function toHttpError(e: unknown): unknown {
  if (e instanceof SurenseError) {
    const details = { surense: { status: e.status, code: e.code } };
    // may have been applied in Surense: not an outage to retry blindly (duplicate invite / E9100 to an institution)
    if (e.ambiguous) {
      return new HttpError("conflict", "Outcome unknown: check Surense before retrying", { details: { reason: AMBIGUOUS_REASON, ...details } });
    }
    if (e.kind === "rate_limited") return new HttpError("rate_limited", "Surense rate limit", { details, headers: { "retry-after": String(e.retryAfterSec ?? 30) } });
    if (e.kind === "unavailable" || e.kind === "auth") return new HttpError("unavailable", "Surense unavailable", { details });
    if (e.kind === "config") return new HttpError("forbidden", "Refused by the connector", { details });
    return new HttpError("validation_failed", "Surense refused the request", { details });
  }
  if (e instanceof RpcError && e.status === 423) return new HttpError("feature_disabled", "Disabled", { details: { flag: e.message.split(":")[1] ?? null } });
  if (e instanceof RpcError && e.status === 400) return new HttpError("validation_failed", "Invalid input", { details: { field: e.field } });
  if (e instanceof TypeError && e.message === "bad_id") return bad("id");
  return e;
}

export function createSyncHandler(d: SyncHandlerDeps): (req: Request) => Promise<Response> {
  const now = d.now ?? Date.now;
  const staffRpc = d.staffRpc ??
    ((jwt: string) => createRpc({ url: d.env.supabaseUrl as string, apikey: d.env.publishableKey as string, bearer: jwt, schema: "staff", fetch: d.fetch }));

  return async (req) => {
    const rid = requestIdFor(req);
    const cors = corsHeaders(req.headers.get("origin"), d.env.allowedOrigins);
    const pre = preflight(req, d.env.allowedOrigins);
    if (pre) return pre;
    const headers = { ...cors, "cache-control": "no-store" };
    let log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
      const jwt = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/i.exec(req.headers.get("authorization") ?? "")?.[1];
      if (!jwt || jwt.split(".").length !== 3) throw new HttpError("unauthenticated", "Missing credentials");
      if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new HttpError("bad_request", "JSON only");
      if (Number(req.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) throw new HttpError("payload_too_large", "Too large");
      const raw = await req.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new HttpError("payload_too_large", "Too large");
      let body: Record<string, unknown>;
      try {
        const j = JSON.parse(raw);
        body = j && typeof j === "object" && !Array.isArray(j) ? j : {};
      } catch {
        throw new HttpError("bad_request", "Invalid JSON");
      }
      const action = body.action as Action;
      if (!ACTIONS.includes(action)) throw bad("action");
      if (!d.env.supabaseUrl || !d.env.publishableKey || !d.rpc) throw new HttpError("unavailable", "Not configured");

      // admin + fresh TOTP, checked by the DB as the caller
      let caller: string;
      try {
        const r = await staffRpc(jwt).call<{ user_id?: string }>("admin_assert_fresh");
        if (!r || typeof r.user_id !== "string") throw new HttpError("forbidden", "Forbidden");
        caller = r.user_id;
      } catch (e) {
        if (e instanceof HttpError) throw e;
        if (e instanceof RpcError && (e.status === 401 || e.code === "PGRST301" || e.code === "PGRST303")) throw new HttpError("unauthenticated", "Invalid token");
        if (e instanceof RpcError && e.status === 403) throw new HttpError("forbidden", "Admin with a fresh TOTP step-up required");
        throw e;
      }
      log = log.child({ caller, action });
      if (!d.tokens) throw new HttpError("unavailable", "Surense not configured");
      const rpc = d.rpc;
      await rpc.call("surense_gate", { p_write: WRITE_ACTIONS.includes(action), p_action: action });

      const sync = buildSyncDeps({ env: d.env, rpc, log, tokens: d.tokens, fetch: d.fetch, sleep: d.sleep, now: d.now, minIntervalMs: d.minIntervalMs });
      const deadline = now() + INLINE_BUDGET_MS;
      let result: Record<string, unknown>;
      switch (action) {
        case "health":
          result = await health(sync);
          break;
        case "pull-customers": {
          const s = await pullCustomers(sync, { deadline, maxPages: 20 });
          let queued: unknown = null;
          if (!s.done) queued = await rpc.call("surense_job_enqueue", { p_kind: "surense.pull_customers", p_params: {}, p_dedupe: "pull_customers" });
          result = { ...s, queued };
          break;
        }
        case "pull-documents": {
          const customerId = optUuid(body.customerId, "customerId");
          const since = optText(body.since, "since", DATE);
          if (!customerId && !since) throw bad("customerId");
          result = { ...(await pullDocuments(sync, { customerId, since, deadline })) };
          break;
        }
        case "invite-proxies":
          result = await inviteProxies(sync, parseInvite(body));
          break;
        case "e9100-submit": {
          const proxyApprovalDate = optText(body.proxyApprovalDate, "proxyApprovalDate", DATE);
          if (!proxyApprovalDate) throw bad("proxyApprovalDate");
          result = await e9100Submit(sync, {
            customerId: reqUuid(body.customerId, "customerId"),
            registrationId: reqUuid(body.registrationId, "registrationId"),
            proxyApprovalDate,
          });
          break;
        }
        case "e9100-download":
          result = { ...(await e9100Download(sync, { customerId: reqUuid(body.customerId, "customerId"), eventId: reqUuid(body.eventId, "eventId") })) };
          break;
        case "portfolio": {
          const mode = body.mode === "production" || body.mode === "pre_advice" ? body.mode : null;
          if (!mode) throw bad("mode");
          result = await portfolio(sync, {
            customerId: reqUuid(body.customerId, "customerId"),
            mode,
            misparMislaka: optText(body.misparMislaka, "misparMislaka", /^[A-Za-z0-9_-]{1,64}$/),
            hbValidityDate: optText(body.hbValidityDate, "hbValidityDate", DATE),
          });
          break;
        }
      }
      log.info("surense action done", { ok: true });
      return jsonResponse({ ok: true, action, result }, rid, { headers });
    } catch (e) {
      const he = toHttpError(e);
      if (he instanceof HttpError) {
        log.info("surense action refused", { status: he.status, code: he.code });
      } else {
        log.error("surense-sync error", { error: e instanceof RpcError ? e.code : e instanceof Error ? e.name : "unknown" });
      }
      return errorResponse(he, rid, headers);
    }
  };
}
