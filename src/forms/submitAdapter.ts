// The Runner's SubmitAdapter for the client flow: every step goes to POST /step with the draft version the server last
// answered (saves are serialised so two quick screens never race the version), the final submit goes to POST /submit with
// the signer evidence. The health questionnaire sends no answers while the server does not store them (only the derived
// screening result travels). Never throws into the Runner: a failure is a SubmitResult of status "error".
import type { FieldEnvelope, SubmitAdapter, SubmitPayload, SubmitResult, SubmitSigner } from "@/questionnaires/adapters";
import type { FormsApi } from "./api";
import { errorCodeOf, FormsApiError } from "./api";
import type { CardKey } from "./catalog";

export interface FormsSubmitAdapterOpts {
  api: FormsApi;
  card: CardKey;
  questionnaire: string;
  /** the draft version the server last answered for this questionnaire (0 for a new draft) */
  draftVersion: number;
  /** health answers travel only when the server stores them */
  sensitive: boolean;
  healthStored: boolean;
  /** called when the server refuses a save because another device saved a newer draft */
  onStale?: () => void;
}

export const answersOf = (fields: Record<string, FieldEnvelope>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));

export function createFormsSubmitAdapter(o: FormsSubmitAdapterOpts): SubmitAdapter & { readonly draftVersion: number } {
  let version = o.draftVersion;
  let chain: Promise<unknown> = Promise.resolve();
  const sendAnswers = !o.sensitive || o.healthStored;
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const p = chain.then(fn, fn);
    chain = p.catch(() => undefined);
    return p;
  };
  const fail = (e: unknown): SubmitResult => {
    if (e instanceof FormsApiError && e.code === "stale_draft") o.onStale?.();
    return { status: "error", message: errorCodeOf(e) || "error" };
  };
  return {
    enabled: true,
    label: "נשמר אצלנו",
    get draftVersion() { return version; },
    saveStep: (p: SubmitPayload) => serial(async () => {
      try {
        const r = await o.api.step({
          card: o.card, questionnaire: o.questionnaire, version: p.questionnaire.version, step_key: p.stepKey,
          answers: sendAnswers ? answersOf(p.fields) : {}, derived: p.derived, draft_version: version, completion: p.completionPct,
        });
        version = r.draft_version;
        return { status: "saved", savedAt: new Date().toISOString(), version: r.draft_version };
      } catch (e) { return fail(e); }
    }),
    submit: (p: SubmitPayload, signer?: SubmitSigner) => serial(async () => {
      try {
        const r = await o.api.submit({
          card: o.card, questionnaire: o.questionnaire, version: p.questionnaire.version, answers: sendAnswers ? answersOf(p.fields) : {}, derived: p.derived,
          signer: signer ? { name: signer.name, kind: signer.kind, ...(signer.png ? { png: signer.png } : {}), hash: signer.hash } : { name: "", kind: "none", hash: "0".repeat(64) },
          completion: p.completionPct,
        });
        return { status: r.duplicate ? "duplicate" : "saved", savedAt: r.submitted_at };
      } catch (e) { return fail(e); }
    }),
  };
}
