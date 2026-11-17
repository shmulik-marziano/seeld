// Platform config: one zod-validated view of the environment.
// Pure: takes an env record, returns a typed config or throws PlatformConfigError.
// Only VITE_* values are readable in the browser. Secrets never belong here.
import { z } from "zod";

export const ENVIRONMENTS = ["local", "preview", "production"] as const;
export type PlatformEnvironment = (typeof ENVIRONMENTS)[number];

const url = z.string().url();

const schema = z.object({
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, "publishable key looks too short"),
  /** Base URL of the future /api/v1. Relative paths are allowed. */
  VITE_API_BASE_URL: z.string().min(1).default("/api/v1"),
  VITE_APP_ENV: z.enum(ENVIRONMENTS).optional(),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().min(500).max(120_000).default(15_000),
  VITE_API_MAX_RETRIES: z.coerce.number().int().min(0).max(6).default(2),
  /** Comma separated flag overrides, e.g. "portal.enabled=true,auth.totp=false". */
  VITE_FLAGS: z.string().optional(),
});

export interface PlatformConfig {
  env: PlatformEnvironment;
  supabase: { url: string; publishableKey: string };
  api: { baseUrl: string; timeoutMs: number; maxRetries: number };
  flagOverrides: string | undefined;
}

export class PlatformConfigError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Invalid platform configuration: ${issues.join("; ")}`);
    this.name = "PlatformConfigError";
    this.issues = issues;
  }
}

export type EnvRecord = Record<string, string | boolean | undefined>;

function normalise(env: EnvRecord): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string") out[k] = v.trim() === "" ? undefined : v.trim();
  }
  return out;
}

/** Infer the environment when VITE_APP_ENV is not set. */
export function inferEnvironment(env: EnvRecord): PlatformEnvironment {
  if (env.MODE === "production") return "production";
  if (env.DEV === true) return "local";
  return "preview";
}

export function parseConfig(env: EnvRecord): PlatformConfig {
  const parsed = schema.safeParse(normalise(env));
  if (!parsed.success) {
    throw new PlatformConfigError(parsed.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`));
  }
  const v = parsed.data;
  return {
    env: v.VITE_APP_ENV ?? inferEnvironment(env),
    supabase: { url: v.VITE_SUPABASE_URL, publishableKey: v.VITE_SUPABASE_PUBLISHABLE_KEY },
    api: { baseUrl: v.VITE_API_BASE_URL, timeoutMs: v.VITE_API_TIMEOUT_MS, maxRetries: v.VITE_API_MAX_RETRIES },
    flagOverrides: v.VITE_FLAGS,
  };
}

let cached: PlatformConfig | null = null;

/** Lazy singleton over import.meta.env. Call from platform code only, never at module load of a public page. */
export function getConfig(env: EnvRecord = import.meta.env as unknown as EnvRecord): PlatformConfig {
  if (!cached) cached = parseConfig(env);
  return cached;
}

export function resetConfigForTests(): void {
  cached = null;
}
