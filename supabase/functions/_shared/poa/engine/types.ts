// What the handler needs from an engine. "surense" is the primary engine (engine/surense.ts); "native" (own rendering)
// is not implemented in this change: poa-intake answers `unavailable` while poa_engine = native.
export type PoaKind = "maslaka" | "harbit" | "policies";
export const POA_KINDS: readonly PoaKind[] = ["maslaka", "harbit", "policies"];
export type ModuleFlags = Record<PoaKind, boolean>;

/** The identity exactly as validated by the handler (phone already +972 form). Never logged. */
export interface PoaIdentity {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string | null;
  marketingApproved: boolean;
}

/** What the session keeps (encrypted) so later calls can continue where /start stopped. */
export interface EngineRef {
  customerId: string;
  urlId: string;
  sid: string;
  /** the Surense customer existed before this session (the wizard never shows this; it blocks the automatic launch) */
  existing: boolean;
}

export interface ConsentData {
  /** ISO yyyy-mm-dd */
  birthDate?: string;
  issueDate?: string;
  /** PNG data URL */
  signaturePng?: string;
}

export interface PoaEngine {
  readonly name: "surense";
  /** creates the customer, the personal link and the tool-side session; returns the reference to keep */
  start(identity: PoaIdentity, modules: ModuleFlags): Promise<EngineRef & { modules: ModuleFlags }>;
  /** approves one module in the tool */
  consent(ref: EngineRef, kind: PoaKind, data: ConsentData): Promise<void>;
  /** the preview PDF of one module */
  preview(ref: EngineRef, kind: PoaKind): Promise<Uint8Array>;
}
