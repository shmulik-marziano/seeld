// Which systems run. Switch via env SYSTEMS_MODE (server side, edge function secret / env):
//   unconfigured       nothing is drained (default: we do not assume a core system)
//   surense_only       only the Surense queue exists
//   salesforce_only    only the Salesforce queue exists
//   both_parallel      Salesforce and Surense run in parallel, each with its OWN queue.
//                      They never call each other: every change goes through the operational DB.
import type { Destination } from "../queue/policy.ts";
import type { SystemAdapter } from "./types.ts";
import { createSalesforceAdapter, createSurenseAdapter } from "./placeholders.ts";

export const SYSTEMS_MODES = ["unconfigured", "surense_only", "salesforce_only", "both_parallel"] as const;
export type SystemsMode = (typeof SYSTEMS_MODES)[number];

export function parseSystemsMode(raw: string | undefined | null): SystemsMode {
  const v = (raw ?? "").trim().toLowerCase();
  return (SYSTEMS_MODES as readonly string[]).includes(v) ? (v as SystemsMode) : "unconfigured";
}

export function enabledDestinations(mode: SystemsMode): Destination[] {
  switch (mode) {
    case "surense_only":
      return ["surense"];
    case "salesforce_only":
      return ["salesforce"];
    case "both_parallel":
      return ["salesforce", "surense"];
    default:
      return [];
  }
}

/** Adapter registry. Replace the placeholder factories with real ones when the owner supplies them. */
export function adaptersFor(mode: SystemsMode): Partial<Record<Destination, SystemAdapter>> {
  const out: Partial<Record<Destination, SystemAdapter>> = {};
  for (const d of enabledDestinations(mode)) out[d] = d === "salesforce" ? createSalesforceAdapter() : createSurenseAdapter();
  return out;
}
