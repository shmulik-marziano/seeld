// Field ownership: every field has exactly ONE system of record. Pure twin of public.field_ownership_decision.
// Trust ranking (precedence.ts) only arbitrates fields flagged multiSource, where several sources legitimately contribute.
import type { OriginSystem } from "../queue/envelope.ts";

export type OwnerSystem = "salesforce" | "surense" | "operational_db";
export type StorePolicy = "source_of_truth" | "mirror_readonly" | "never_store";
export type NonOwnerMode = "reject" | "propose";

export interface FieldOwnership {
  fieldKey: string;
  owner: OwnerSystem;
  /** Systems that receive a read-only copy. */
  replicateTo: Array<"salesforce" | "surense">;
  /** Several sources legitimately contribute; the trust ranking resolves conflicts. */
  multiSource: boolean;
  /** Input channels (portal / manual) that may submit this field to the owner. */
  inputChannels: Array<"portal" | "manual">;
  /** never_store: the operational DB must not hold it (final commissions, long-term regulatory history). */
  storePolicy: StorePolicy;
  nonOwnerMode: NonOwnerMode;
}

export type OwnershipDecision = "allow" | "reject_not_owner" | "propose_not_owner" | "reject_never_store" | "reject_unknown_field";

export function decideOwnership(field: FieldOwnership | undefined, origin: OriginSystem): OwnershipDecision {
  if (!field) return "reject_unknown_field";
  if (field.storePolicy === "never_store") return "reject_never_store";
  if (field.multiSource) return "allow";
  const denied = field.nonOwnerMode === "propose" ? "propose_not_owner" : "reject_not_owner";
  if (origin === "salesforce" || origin === "surense" || origin === "operational_db") return origin === field.owner ? "allow" : denied;
  // portal / manual are input channels, not systems of record
  return field.inputChannels.includes(origin) ? "allow" : denied;
}
