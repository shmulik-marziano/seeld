// Field-level precedence. Pure twin of public.field_precedence_decision (07_source_precedence.sql).
// A lower-trust source never overwrites a higher-trust value. It may fill an EMPTY field.
import type { SourceRank } from "./ranks.ts";

export interface FieldState {
  value: unknown;
  rank: SourceRank;
  observedAt: number; // epoch ms
}

export interface FieldUpdate {
  value: unknown;
  rank: SourceRank;
  observedAt: number;
}

export type PrecedenceDecision =
  | "apply_new" //               no value yet
  | "apply_fill_empty" //        current value empty, any source may fill
  | "apply_override" //          strictly more trusted source
  | "apply_newer_same_rank" //   same trust, newer observation
  | "keep_higher_rank" //        incoming is less trusted: rejected
  | "keep_newer_existing" //     same trust, but the stored observation is newer
  | "ignore_empty_incoming"; //  empty values never erase

export function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

export function isApplied(d: PrecedenceDecision): boolean {
  return d.startsWith("apply_");
}

export function resolveFieldUpdate(current: FieldState | null, incoming: FieldUpdate): PrecedenceDecision {
  if (isEmptyValue(incoming.value)) return "ignore_empty_incoming";
  if (current === null) return "apply_new";
  if (isEmptyValue(current.value)) return "apply_fill_empty";
  if (incoming.rank < current.rank) return "apply_override";
  if (incoming.rank > current.rank) return "keep_higher_rank";
  return incoming.observedAt >= current.observedAt ? "apply_newer_same_rank" : "keep_newer_existing";
}
