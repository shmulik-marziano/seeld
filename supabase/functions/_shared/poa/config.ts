// POA-specific settings, read through an injected getter (the one Deno.env reader stays in ../env.ts; index.ts files
// pass `Deno.env.get`). Names only in logs.
import { isUuid } from "../surense/api.ts";

export const DEFAULT_DP_HOST = "dp.surense.com";
// verified 2026-11-22 (owner's full run): the public page API lives under /api/v1/ifs/public. One constant,
// overridable by SURENSE_DP_BASE.
export const DEFAULT_DP_BASE = "/api/v1/ifs/public";

/** /start answers no sooner than this (ms), then in steps of START_BUCKET_MS: the real chain is 6-7 upstream calls, so a fixed
 *  small floor would be a no-op and a duplicate-customer path (one more round trip) would be visible in the timing. */
export const DEFAULT_START_MIN_MS = 6000;
export const DEFAULT_START_BUCKET_MS = 3000;

export interface PoaEnv {
  dpHost: string;
  dpBase: string;
  /** POA_START_MIN_MS: floor of the /start duration (0..20000); tune after the owner's full run */
  startMinMs: number;
  /** POA_START_BUCKET_MS: a /start that overruns the floor is rounded UP to a multiple of this (500..20000) */
  startBucketMs: number;
  /** Surense user that owns customers created by the wizard (POST /customers needs managerId); null = not configured */
  managerId: string | null;
}

function intIn(v: string, lo: number, hi: number, dflt: number): number {
  if (!/^[0-9]{1,6}$/.test(v)) return dflt;
  const n = Number(v);
  return n >= lo && n <= hi ? n : dflt;
}

export function loadPoaEnv(get: (name: string) => string | undefined): PoaEnv {
  const clean = (v: string | undefined) => (v ?? "").trim();
  const mgr = clean(get("SURENSE_MANAGER_ID"));
  return {
    dpHost: clean(get("SURENSE_DP_HOST")).toLowerCase() || DEFAULT_DP_HOST,
    dpBase: clean(get("SURENSE_DP_BASE")) || DEFAULT_DP_BASE,
    startMinMs: intIn(clean(get("POA_START_MIN_MS")), 0, 20_000, DEFAULT_START_MIN_MS),
    startBucketMs: intIn(clean(get("POA_START_BUCKET_MS")), 500, 20_000, DEFAULT_START_BUCKET_MS),
    managerId: isUuid(mgr) ? mgr.toLowerCase() : null,
  };
}

/** names and booleans only */
export function poaEnvPresence(e: PoaEnv): Record<string, unknown> {
  return { SURENSE_DP_HOST: e.dpHost === DEFAULT_DP_HOST ? "default" : "custom", SURENSE_DP_BASE: e.dpBase === DEFAULT_DP_BASE ? "default" : "custom", SURENSE_MANAGER_ID: !!e.managerId,
    POA_START_MIN_MS: e.startMinMs === DEFAULT_START_MIN_MS ? "default" : "custom", POA_START_BUCKET_MS: e.startBucketMs === DEFAULT_START_BUCKET_MS ? "default" : "custom" };
}
