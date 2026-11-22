// What the handler needs from an engine. "surense" (engine/surense.ts) runs the tool's public page live; "native"
// (engine/native.ts) renders and stores the documents on our side and the tool is fed afterwards by the ship job
// (owner decision 2026-11-22: the client's journey never waits for the tool).
export type PoaKind = "maslaka" | "harbit" | "policies";
export const POA_KINDS: readonly PoaKind[] = ["maslaka", "harbit", "policies"];
export type ModuleFlags = Record<PoaKind, boolean>;
export type EngineName = "surense" | "native";

/** The identity exactly as validated by the handler (phone already +972 form). Never logged. */
export interface PoaIdentity {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string | null;
  /** street + house number and the city, as validated by the handler (goes to the tool's customer record) */
  street: string;
  city: string;
  /** 7 digits */
  zip: string;
  marketingApproved: boolean;
}

/** the licence holder named in the documents (POA_LICENSEE_* settings) */
export interface PoaLicensee {
  name: string;
  license: string;
  phone: string;
  email: string;
}

/** What the session keeps (encrypted) so later calls can continue where /start stopped. */
export interface EngineRef {
  /** the Surense customer id; null for the native engine until the ship job created the customer */
  customerId: string | null;
  urlId: string;
  sid: string;
  /** the Surense customer existed before this session (the wizard never shows this; it blocks the automatic launch) */
  existing: boolean;
  /** the tool's page-session cookies ("a=1; b=2"), set by load/start and refreshed by every later call; kept encrypted, never logged */
  cookie?: string;
  /** native engine: the values the documents are rendered from (a snapshot taken at /start; the identity is otherwise never
   *  decrypted on the hot path). Kept encrypted inside the reference, never logged. */
  identity?: PoaIdentity;
  licensee?: PoaLicensee;
}

export interface ConsentData {
  /** ISO yyyy-mm-dd */
  birthDate?: string;
  issueDate?: string;
  /** PNG data URL */
  signaturePng?: string;
}

/** evidence of an approval, stamped into the final document by the native engine */
export interface ApprovalEvidence {
  /** approval instant (ms since epoch) */
  atMs: number;
  ip: string;
  /** PNG data URL (policies) */
  signaturePng?: string;
}

/** Pre-signed links to the three final documents, as the policies step returns them (keyed by our kind names). Secrets of
 *  a kind: never logged. */
export interface FinalUrls {
  swiftness?: string;
  hb?: string;
  policies?: string;
}

export interface PoaEngine {
  readonly name: EngineName;
  /** creates the customer, the personal link and the tool-side session (surense), or the reference the renderer needs (native) */
  start(identity: PoaIdentity, modules: ModuleFlags): Promise<EngineRef & { modules: ModuleFlags }>;
  /** approves one module in the tool; the policies step (the last) answers the links of the final documents */
  consent(ref: EngineRef, kind: PoaKind, data: ConsentData): Promise<FinalUrls | void>;
  /** the preview PDF of one module */
  preview(ref: EngineRef, kind: PoaKind): Promise<Uint8Array>;
  /** native only: the final PDF of one module with the evidence block (and the signature for policies) */
  final?(ref: EngineRef, kind: PoaKind, evidence: ApprovalEvidence): Promise<Uint8Array>;
}
