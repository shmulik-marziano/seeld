// Typed wrappers around the api.form_* RPCs (service key). Argument names and result keys are the ones of migration
// 20261125090000_client_forms.sql (docs/product/CLIENT-FORMS.md). A malformed answer is an RpcError (502, bad_shape), which
// forms-intake shows as `unavailable`. The token never leaves the function: the database gets its SHA-256 as a bytea literal.
import { type Rpc, RpcError } from "../db.ts";
import { HASH_RE } from "../poa/session.ts";
import { byteaHex } from "../poa/rpc.ts";

export type FormStatus = "open" | "expired" | "locked";
export type SubmissionStatus = "draft" | "submitted" | "reviewed";

export interface FormConfig { formsEnabled: boolean; healthEnabled: boolean; turnstileRequired: boolean }
export interface FormSubmissionState {
  cardKey: string;
  questionnaireKey: string;
  version: number;
  status: SubmissionStatus;
  stepKey: string | null;
  draftVersion: number;
  completionPct: number;
  submittedAt: string | null;
  answersStored: boolean;
  derived: Record<string, unknown>;
  /** only for a draft whose answers are stored */
  answers: Record<string, unknown> | null;
}
export interface FormDocumentState { id: string; kind: string; createdAt: string; stored: boolean }
export interface FormSession {
  sessionId: string;
  status: FormStatus;
  expiresAt: string;
  submissions: FormSubmissionState[];
  documents: FormDocumentState[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const shape = () => new RpcError(502, "bad_shape", "rpc answered an unexpected shape");
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw shape();
  return v as Record<string, unknown>;
};
const str = (v: unknown): string => {
  if (typeof v !== "string" || !v) throw shape();
  return v;
};
const uuid = (v: unknown): string => {
  if (typeof v !== "string" || !UUID.test(v)) throw shape();
  return v.toLowerCase();
};
const int = (v: unknown, dflt = 0): number => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : dflt);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

function parseSubmission(v: unknown): FormSubmissionState {
  const o = obj(v);
  const status = str(o.status);
  if (status !== "draft" && status !== "submitted" && status !== "reviewed") throw shape();
  const answers = o.answers && typeof o.answers === "object" && !Array.isArray(o.answers) ? (o.answers as Record<string, unknown>) : null;
  return {
    cardKey: str(o.card_key),
    questionnaireKey: str(o.questionnaire_key),
    version: int(o.version, 1),
    status,
    stepKey: strOrNull(o.step_key),
    draftVersion: int(o.draft_version),
    completionPct: int(o.completion_pct),
    submittedAt: strOrNull(o.submitted_at),
    answersStored: o.answers_stored === true,
    derived: o.derived && typeof o.derived === "object" && !Array.isArray(o.derived) ? (o.derived as Record<string, unknown>) : {},
    answers,
  };
}

export function createFormsRpc(rpc: Rpc) {
  const hash = (h: string) => {
    if (!HASH_RE.test(h)) throw new RpcError(0, "bad_hash", "bad token hash");
    return byteaHex(h);
  };
  return {
    /** null only when the database lacks api.form_config (older schema) */
    async config(): Promise<FormConfig | null> {
      let r: unknown;
      try {
        r = await rpc.call("form_config", {});
      } catch (e) {
        if (e instanceof RpcError && e.status === 404) return null;
        throw e;
      }
      const o = obj(r);
      return { formsEnabled: o.forms_enabled === true, healthEnabled: o.health_enabled === true, turnstileRequired: o.turnstile_required !== false };
    },
    async sessionStart(a: { tokenHash: string; uaHash: string | null; firstName: string; lastName: string; email: string | null; nationalId: string; phone: string; clientIp: string }): Promise<{ sessionId: string; expiresAt: string }> {
      const r = obj(await rpc.call("form_session_start", {
        p_token_hash: hash(a.tokenHash),
        p_identity: { first_name: a.firstName, last_name: a.lastName, email: a.email },
        p_national_id: a.nationalId,
        p_phone: a.phone,
        p_ua_hash: a.uaHash ? hash(a.uaHash) : null,
        p_ip: a.clientIp,
      }));
      if (r.ok !== true) throw new RpcError(429, "PT429", typeof r.error === "string" ? r.error : "rate_limited");
      return { sessionId: uuid(r.session_id), expiresAt: str(r.expires_at) };
    },
    async sessionGet(tokenHash: string): Promise<FormSession> {
      const r = obj(await rpc.call("form_session_get", { p_token_hash: hash(tokenHash) }));
      const status = str(r.status);
      if (status !== "open" && status !== "expired" && status !== "locked") throw shape();
      const subs = Array.isArray(r.submissions) ? r.submissions.map(parseSubmission) : [];
      const docs = Array.isArray(r.documents)
        ? r.documents.map((d) => {
          const o = obj(d);
          return { id: uuid(o.id), kind: str(o.kind), createdAt: str(o.created_at), stored: o.stored === true };
        })
        : [];
      return { sessionId: uuid(r.session_id), status, expiresAt: str(r.expires_at), submissions: subs, documents: docs };
    },
    async stepSave(a: { sessionId: string; card: string; questionnaire: string; version: number; stepKey: string | null; answers: Record<string, unknown>; derived: Record<string, unknown>; draftVersion: number; completion: number }): Promise<{ submissionId: string; draftVersion: number; answersStored: boolean }> {
      const r = obj(await rpc.call("form_step_save", {
        p_session: a.sessionId, p_card: a.card, p_questionnaire: a.questionnaire, p_version: a.version, p_step_key: a.stepKey,
        p_answers: a.answers, p_derived: a.derived, p_draft_version: a.draftVersion, p_completion: a.completion,
      }));
      return { submissionId: uuid(r.submission_id), draftVersion: int(r.draft_version), answersStored: r.answers_stored === true };
    },
    async submit(a: { sessionId: string; card: string; questionnaire: string; version: number; answers: Record<string, unknown>; derived: Record<string, unknown>; signer: Record<string, unknown>; clientIp: string; userAgent: string | null; completion: number }): Promise<{ submissionId: string; submittedAt: string; answersStored: boolean; duplicate: boolean }> {
      const r = obj(await rpc.call("form_submit", {
        p_session: a.sessionId, p_card: a.card, p_questionnaire: a.questionnaire, p_version: a.version, p_answers: a.answers, p_derived: a.derived,
        p_signer: a.signer, p_ip: a.clientIp, p_user_agent: a.userAgent, p_completion: a.completion,
      }));
      return { submissionId: uuid(r.submission_id), submittedAt: str(r.submitted_at), answersStored: r.answers_stored === true, duplicate: r.duplicate === true };
    },
    async sessionFail(sessionId: string, code: string): Promise<void> {
      await rpc.call("form_session_fail", { p_session: sessionId, p_code: code.toLowerCase().replace(/[^a-z0-9_.:-]/g, "_").slice(0, 80) || "error" });
    },
    async documentAdd(a: { sessionId: string; kind: string; sha256: string; ext: string; bytes: number }): Promise<{ documentId: string; storagePath: string }> {
      const r = obj(await rpc.call("form_document_add", { p_session: a.sessionId, p_kind: a.kind, p_sha256: a.sha256, p_ext: a.ext, p_bytes: a.bytes }));
      return { documentId: uuid(r.document_id), storagePath: str(r.storage_path) };
    },
    async documentStored(documentId: string, path: string): Promise<void> {
      await rpc.call("form_document_stored", { p_document: documentId, p_path: path });
    },
  };
}
export type FormsRpc = ReturnType<typeof createFormsRpc>;
