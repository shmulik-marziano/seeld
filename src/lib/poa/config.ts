// POA wizard switch and constants (docs/product/POA-WIZARD-SPEC.md §5 "מתגים" and §3).
// Imported by App.tsx, which is the main entry: keep this file free of any other import than the backend switch.
import { IS_V2 } from "@/integrations/supabase/config";

/**
 * Base URL of the poa-intake Edge Function, when it is not the default of the build's own backend
 * (`<SUPABASE_URL>/functions/v1/poa-intake`). Trailing slashes are dropped. Empty = not set.
 */
export const POA_INTAKE_URL: string = (import.meta.env.VITE_POA_INTAKE_URL ?? "").trim().replace(/\/+$/, "");

/**
 * Browser switch (spec §5): POA_ENABLED = VITE_POA_FLOW === "on" && (IS_V2 || VITE_POA_INTAKE_URL is set). Unset = off.
 * The second operand is the fast path: a legacy build has no backend of its own for the wizard, but it may run the
 * wizard against explicitly configured poa-intake functions.
 */
export const POA_ENABLED: boolean = import.meta.env.VITE_POA_FLOW === "on" && (IS_V2 || POA_INTAKE_URL !== "");

export const POA_ROUTE = "/report/start/order";

/**
 * Entry contexts (spec §2 ס0 "נקודות כניסה"): the wizard is the one conversion step every marketing page leads to
 * (`?from=<key>`); only the first line of ס0 changes with it. Unknown or missing = "default". Never stored, never sent.
 */
export const POA_ENTRIES = ["default", "insurance", "finance", "portfolio", "join", "forms"] as const;
export type PoaEntry = (typeof POA_ENTRIES)[number];
export function poaEntryOf(search: string): PoaEntry {
  const v = new URLSearchParams(search).get("from") ?? "";
  return (POA_ENTRIES as readonly string[]).includes(v) ? (v as PoaEntry) : "default";
}

/** The three documents, in display order (spec §1, §2). Functional names only, never the annex letters. */
export const POA_KINDS = ["maslaka", "harbit", "policies"] as const;
export type PoaKind = (typeof POA_KINDS)[number];

export const POA_LIMITS = {
  /** total session lifetime from the start call (spec §3) */
  sessionMinutes: 60,
  /** the time warning shows this long before expires_at (spec ס8) */
  warnBeforeMinutes: 2,
  /** the client copy can be downloaded for this long after the approval (spec ס7, §5) */
  downloadMinutes: 30,
  /** signature: at least this many strokes, at most this many points in all (spec §3) */
  signatureMinStrokes: 2,
  signatureMaxPoints: 2000,
  /** national ID only, minimum age (spec §7 item 12) */
  minAge: 18,
  /** birth date plausibility (the house validator's limit) */
  maxAge: 120,
} as const;
