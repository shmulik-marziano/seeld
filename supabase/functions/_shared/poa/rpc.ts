// Typed wrappers around the api.poa_* RPCs (service key). The argument names and result keys are the ones of migration
// 20261121150000_poa_flow.sql (docs/product/POA-WIZARD.md "Data (DB)"). Results are parsed defensively: a malformed answer
// is an RpcError (status 502, code bad_shape), which poa-intake shows as `unavailable`.
// The token never leaves the function: the database gets its SHA-256 as a bytea literal (\x<hex>). Session-scoped RPCs
// take the session uuid that api.poa_session_get returned. api.poa_session_get no longer returns the identity (nothing reads it).
import { type Rpc, RpcError } from "../db.ts";
import { type EngineRef, type ModuleFlags, POA_KINDS, type PoaKind } from "./engine/types.ts";
import { HASH_RE } from "./session.ts";

export interface PoaModuleState { enabled: boolean; required: boolean; performed: boolean }
export type PoaModules = Record<PoaKind, PoaModuleState>;
export type PoaNext = PoaKind | "done";
export type PoaStatus = "open" | "completed" | "expired" | "locked";

/** Switch snapshot (api.poa_config, service role only). config() answers null when the database has no such RPC (an older
 *  schema): the function then relies on the kill switches inside every poa_* RPC (PT423) and on Turnstile being required. */
export interface PoaConfig {
  poaEnabled: boolean;
  engine: "surense" | "native";
  turnstileRequired: boolean;
  modules: ModuleFlags;
}

export interface PoaSession {
  sessionId: string;
  status: PoaStatus;
  expiresAt: string;
  modules: PoaModules;
  next: PoaNext;
  engine: "surense" | "native";
  customerId: string | null;
  /** only while the session is open */
  engineRef: EngineRef | null;
  previewSha256: Partial<Record<PoaKind, string>>;
  completedAt: string | null;
}

export interface PoaStart {
  sessionId: string;
  expiresAt: string;
  modules: PoaModules;
  next: PoaNext;
  /** a crm.customers row with this national id exists (server side only: never part of any response) */
  existingCustomer: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const shape = () => new RpcError(502, "bad_shape", "rpc answered an unexpected shape");
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw shape();
  return v as Record<string, unknown>;
};
const bool = (v: unknown, dflt: boolean) => (typeof v === "boolean" ? v : dflt);
const str = (v: unknown): string => {
  if (typeof v !== "string" || !v) throw shape();
  return v;
};
const uuid = (v: unknown): string => {
  if (typeof v !== "string" || !UUID.test(v)) throw shape();
  return v.toLowerCase();
};
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function parseModules(v: unknown): PoaModules {
  const o = obj(v);
  const out = {} as PoaModules;
  for (const k of POA_KINDS) {
    const m = obj(o[k]);
    if (typeof m.enabled !== "boolean" || typeof m.required !== "boolean" || typeof m.performed !== "boolean") throw shape();
    out[k] = { enabled: m.enabled, required: m.required, performed: m.performed };
  }
  return out;
}

/** first enabled module not yet performed, in display order; "done" when none is left */
export function nextOf(m: PoaModules): PoaNext {
  return POA_KINDS.find((k) => m[k].enabled && !m[k].performed) ?? "done";
}

function parseNext(v: unknown, modules: PoaModules): PoaNext {
  // derived from the modules when the database did not say, so the browser's `next` is always consistent with them
  return typeof v === "string" && (v === "done" || (POA_KINDS as readonly string[]).includes(v)) ? v as PoaNext : nextOf(modules);
}

/** bytea literal for PostgREST: backslash, x, hex */
export const byteaHex = (hex: string): string => `\\x${hex}`;

/** the short code a session failure may carry (database check: ^[a-z0-9_.:-]{1,80}$) */
export function failCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9_.:-]/g, "_").slice(0, 80) || "error";
}

export function createPoaRpc(rpc: Rpc) {
  const hash = (h: string) => {
    if (!HASH_RE.test(h)) throw new RpcError(0, "bad_hash", "bad token hash");
    return byteaHex(h);
  };
  return {
    /** null only when the database lacks api.poa_config (older schema) */
    async config(): Promise<PoaConfig | null> {
      let r: unknown;
      try {
        r = await rpc.call("poa_config", {});
      } catch (e) {
        if (e instanceof RpcError && e.status === 404) return null;
        throw e;
      }
      const o = obj(r);
      const m = o.modules && typeof o.modules === "object" ? o.modules as Record<string, unknown> : {};
      return {
        poaEnabled: bool(o.poa_enabled, false),
        engine: o.engine === "native" ? "native" : "surense",
        turnstileRequired: bool(o.turnstile_required, true),
        modules: { maslaka: bool(m.maslaka, false), harbit: bool(m.harbit, false), policies: bool(m.policies, false) },
      };
    },

    async sessionStart(a: {
      tokenHash: string; uaHash: string | null; firstName: string; lastName: string; email: string | null; street?: string; city?: string; zip?: string;
      nationalId: string; phone: string; marketing: boolean; clientIp: string;
    }): Promise<PoaStart> {
      const r = obj(await rpc.call("poa_session_start", {
        p_token_hash: hash(a.tokenHash),
        p_identity: {
          first_name: a.firstName, last_name: a.lastName, email: a.email,
          ...(a.street ? { street: a.street } : {}), ...(a.city ? { city: a.city } : {}), ...(a.zip ? { zip: a.zip } : {}),
        },
        p_national_id: a.nationalId,
        p_phone: a.phone,
        p_ua_hash: a.uaHash ? hash(a.uaHash) : null,
        p_ip: a.clientIp,
        p_marketing: a.marketing,
      }));
      // the daily cap answers {ok:false} instead of raising (a raise would roll its own switch-off back)
      if (r.ok === false) throw new RpcError(429, "PT429", "rate_limited");
      const modules = parseModules(r.modules);
      return {
        sessionId: uuid(r.session_id),
        expiresAt: str(r.expires_at),
        modules,
        next: parseNext(r.next, modules),
        existingCustomer: r.existing_customer === true,
      };
    },

    async sessionGet(tokenHash: string): Promise<PoaSession> {
      const r = obj(await rpc.call("poa_session_get", { p_token_hash: hash(tokenHash) }));
      const modules = parseModules(r.modules);
      const status = r.status;
      if (status !== "open" && status !== "completed" && status !== "expired" && status !== "locked") throw shape();
      const ref = r.engine_ref && typeof r.engine_ref === "object" ? r.engine_ref as Record<string, unknown> : null;
      const customerId = strOrNull(r.surense_customer_id);
      const prev = r.preview_sha && typeof r.preview_sha === "object" ? r.preview_sha as Record<string, unknown> : {};
      const previewSha256: Partial<Record<PoaKind, string>> = {};
      for (const k of POA_KINDS) if (typeof prev[k] === "string" && HASH_RE.test(prev[k] as string)) previewSha256[k] = prev[k] as string;
      const refCustomer = ref ? strOrNull(ref.customer_id) ?? customerId : null;
      return {
        sessionId: uuid(r.session_id),
        status,
        expiresAt: str(r.expires_at),
        modules,
        next: parseNext(r.next, modules),
        engine: r.engine === "native" ? "native" : "surense",
        customerId,
        engineRef: ref && refCustomer && typeof ref.sid === "string" && typeof ref.url_id === "string"
          ? { customerId: refCustomer, sid: ref.sid, urlId: ref.url_id, existing: ref.existing === true }
          : null,
        previewSha256,
        completedAt: strOrNull(r.completed_at),
      };
    },

    /** flat snake_case object, stored encrypted whole; customer_id also fills the indexed column */
    async engineRefSet(sessionId: string, ref: EngineRef): Promise<void> {
      await rpc.call("poa_engine_ref_set", {
        p_session: sessionId,
        p_ref: { customer_id: ref.customerId, sid: ref.sid, url_id: ref.urlId, existing: ref.existing },
      });
    },

    async previewSet(sessionId: string, kind: PoaKind, sha256: string): Promise<void> {
      await rpc.call("poa_preview_set", { p_session: sessionId, p_kind: kind, p_sha256: sha256 });
    },

    async consentRecord(a: {
      sessionId: string; kind: PoaKind; previewSha256: string; birthDate: string | null; issueDate: string | null;
      signature: string | null; clientIp: string; userAgent: string;
      /** answer a repeated approval of a performed module: method 'check', nothing else is sent (the database inserts nothing) */
      replay?: boolean;
    }) {
      const r = obj(await rpc.call("poa_consent_record", {
        p_session: a.sessionId,
        p_kind: a.kind,
        p_method: a.kind === "policies" && !a.replay ? "signature" : "check",
        p_preview_sha256: a.previewSha256,
        p_signature: a.signature,
        p_ip: a.clientIp,
        p_user_agent: a.userAgent.slice(0, 200),
        p_extra: a.kind === "harbit" ? { birth_date: a.birthDate, issue_date: a.issueDate } : null,
      }));
      const modules = parseModules(r.modules);
      return {
        approvedAt: str(r.approved_at),
        validUntil: strOrNull(r.valid_until),
        modules,
        next: parseNext(r.next, modules),
      };
    },

    /** best effort: stores a short failure code on the session (no values) */
    async sessionFail(sessionId: string, code: string): Promise<void> {
      await rpc.call("poa_session_fail", { p_session: sessionId, p_code: failCode(code) });
    },

    async sessionComplete(sessionId: string): Promise<{ complete: boolean }> {
      const r = obj(await rpc.call("poa_session_complete", { p_session: sessionId }));
      return { complete: r.complete === true };
    },

    /** a final document that arrived as a link (the policies step): creates / refreshes its crm.documents row (no Surense
     *  document id is known) and answers what the storage path needs. `stored`: the row already holds a stored file. */
    async documentFromUrl(sessionId: string, kind: PoaKind, sha256: string): Promise<{ documentId: string; agencyId: string; stored: boolean }> {
      const r = obj(await rpc.call("poa_document_from_url", { p_session: sessionId, p_kind: kind, p_sha256: sha256 }));
      return { documentId: uuid(r.document_id), agencyId: uuid(r.agency_id), stored: r.stored === true };
    },

    /** the bytes are in the bucket: record the path (poa/{agency}/{session}/{kind}-{document}.pdf, checked by the database) and the hash */
    async documentStored(documentId: string, path: string, sha256: string): Promise<void> {
      await rpc.call("poa_document_stored", { p_document: documentId, p_path: path, p_sha256: sha256 });
    },

    /** PEEK at the single download of a final document (switch, module, 30 minutes from completion, not yet downloaded). Claims nothing. */
    async docGet(tokenHash: string, kind: PoaKind): Promise<{ storagePath: string; sha256: string | null }> {
      const r = obj(await rpc.call("poa_doc_get", { p_token_hash: hash(tokenHash), p_kind: kind }));
      const sha = typeof r.sha256 === "string" && HASH_RE.test(r.sha256) ? r.sha256 : null;
      return { storagePath: str(r.storage_path), sha256: sha };
    },

    /** CLAIM the single download: called only after the bytes were read and verified (a storage miss never burns it) */
    async docClaim(tokenHash: string, kind: PoaKind): Promise<void> {
      await rpc.call("poa_doc_claim", { p_token_hash: hash(tokenHash), p_kind: kind });
    },

    /** E9100 "launch": ids and a date only (job params are snake_case, flat, short strings) */
    async enqueueLaunch(customerId: string, proxyApprovalDate: string): Promise<void> {
      await rpc.call("surense_job_enqueue", {
        p_kind: "surense.e9100_submit",
        p_params: { customer_id: customerId, proxy_approval_date: proxyApprovalDate },
        p_dedupe: `e9100:${customerId}`,
      });
    },
  };
}

export type PoaRpc = ReturnType<typeof createPoaRpc>;
