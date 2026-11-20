// Environment access for the v2 edge functions. One place reads Deno.env; everything else receives a typed Env.
// No zod on purpose: a dozen string checks do not justify a network dependency in every function bundle.
// Never log values from here; envPresence() reports NAMES and booleans only.
import { parseAllowedOrigins } from "./cors.ts";

export type Stage = "production" | "staging" | "development";

export interface Env {
  stage: Stage;
  supabaseUrl: string | null;
  /** sb_secret_* used in the apikey header for service RPCs (maps to service_role). */
  secretKey: string | null;
  secretKeySource: "SEELD_SECRET_KEY" | "SUPABASE_SECRET_KEYS" | null;
  /** sb_publishable_* (or legacy anon) for anon-granted RPCs such as api.health. */
  publishableKey: string | null;
  allowedOrigins: string[];
  cronSecret: string | null;
  turnstileSecret: string | null;
  resendApiKey: string | null;
  notifyFrom: string;
  notifyTo: { insurance: string[]; finance: string[]; general: string[] };
  notifyIncludePii: boolean;
  staffAppUrl: string;
  googleAiKey: string | null;
  geminiModels: string[];
  region: string | null;
  version: string | null;
  /** Surense OAuth client (client_credentials) and the Svix endpoint secret (whsec_...). Names only in logs. */
  surenseClientId: string | null;
  surenseClientSecret: string | null;
  surenseWebhookSecret: string | null;
  /** Optional second Svix secret (SURENSE_WEBHOOK_SECRET_NEXT) for rotation without downtime: either one verifies. */
  surenseWebhookSecretNext?: string | null;
}

export type EnvSource = (name: string) => string | undefined;

export const DEFAULT_NOTIFY_FROM = "SEELD <no-reply@seeld.co.il>";
// Same defaults as the Tokyo send-lead-notification function (LEAD_TO_*), so routing does not change at cutover.
export const DEFAULT_NOTIFY_TO = {
  insurance: ["Moshe@seeld.info"],
  finance: ["Shmulik@seeld.info"],
  general: ["Shmulik@seeld.info"],
};
export const DEFAULT_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];

const EMAIL = /^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/;

function clean(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

export function parseStage(v: string | undefined): Stage {
  const t = (v ?? "").trim().toLowerCase();
  if (t === "staging" || t === "preview") return "staging";
  if (t === "development" || t === "dev" || t === "local") return "development";
  return "production"; // unset or unknown = production: every gate fails closed
}

export function parseEmailList(v: string | undefined | null): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter((s) => EMAIL.test(s));
}

/** SUPABASE_SECRET_KEYS / SUPABASE_PUBLISHABLE_KEYS are injected by the platform as JSON ({"default":"sb_..."}). */
export function pickKey(raw: string | undefined, prefer = "default"): string | null {
  const t = clean(raw);
  if (!t) return null;
  if (!t.startsWith("{") && !t.startsWith("[")) return t;
  try {
    const parsed = JSON.parse(t) as unknown;
    if (Array.isArray(parsed)) return typeof parsed[0] === "string" ? parsed[0] : null;
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const v = o[prefer] ?? Object.values(o).find((x) => typeof x === "string");
      return typeof v === "string" && v ? v : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadEnv(get: EnvSource): Env {
  const seeld = clean(get("SEELD_SECRET_KEY"));
  const platformSecret = seeld ? null : pickKey(get("SUPABASE_SECRET_KEYS"));
  const list = (name: string, fallback: string[]) => {
    const own = parseEmailList(get(name));
    if (own.length) return own;
    const shared = parseEmailList(get("LEAD_NOTIFY_TO"));
    return shared.length ? shared : fallback;
  };
  const models = (get("GEMINI_MODELS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    stage: parseStage(get("ENV")),
    supabaseUrl: clean(get("SUPABASE_URL"))?.replace(/\/+$/, "") ?? null,
    secretKey: seeld ?? platformSecret,
    secretKeySource: seeld ? "SEELD_SECRET_KEY" : platformSecret ? "SUPABASE_SECRET_KEYS" : null,
    publishableKey: pickKey(get("SUPABASE_PUBLISHABLE_KEYS")) ?? clean(get("SUPABASE_ANON_KEY")),
    allowedOrigins: parseAllowedOrigins(get("ALLOWED_ORIGINS")),
    cronSecret: clean(get("EDGE_CRON_SECRET")),
    turnstileSecret: clean(get("TURNSTILE_SECRET_KEY")),
    resendApiKey: clean(get("RESEND_API_KEY")),
    notifyFrom: clean(get("NOTIFY_FROM")) ?? DEFAULT_NOTIFY_FROM,
    notifyTo: {
      insurance: list("NOTIFY_TO_INSURANCE", DEFAULT_NOTIFY_TO.insurance),
      finance: list("NOTIFY_TO_FINANCE", DEFAULT_NOTIFY_TO.finance),
      general: list("NOTIFY_TO_GENERAL", DEFAULT_NOTIFY_TO.general),
    },
    notifyIncludePii: ["true", "1", "on", "yes"].includes((get("NOTIFY_INCLUDE_PII") ?? "").trim().toLowerCase()),
    staffAppUrl: (clean(get("STAFF_APP_URL")) ?? "https://seeld.co.il").replace(/\/+$/, ""),
    googleAiKey: clean(get("GOOGLE_AI_API_KEY")),
    geminiModels: models.length ? models : DEFAULT_GEMINI_MODELS,
    region: clean(get("SB_REGION")),
    version: clean(get("GIT_COMMIT")) ?? clean(get("DENO_DEPLOYMENT_ID")),
    surenseClientId: clean(get("SURENSE_CLIENT_ID")),
    surenseClientSecret: clean(get("SURENSE_CLIENT_SECRET")),
    surenseWebhookSecret: clean(get("SURENSE_WEBHOOK_SECRET")),
    surenseWebhookSecretNext: clean(get("SURENSE_WEBHOOK_SECRET_NEXT")),
  };
}

/** Names and booleans only: safe for logs and for the secret-gated health view. */
export function envPresence(env: Env): Record<string, unknown> {
  return {
    stage: env.stage,
    SUPABASE_URL: !!env.supabaseUrl,
    secret_key: env.secretKeySource ?? false,
    publishable_key: !!env.publishableKey,
    ALLOWED_ORIGINS_count: env.allowedOrigins.length,
    EDGE_CRON_SECRET: !!env.cronSecret,
    TURNSTILE_SECRET_KEY: !!env.turnstileSecret,
    RESEND_API_KEY: !!env.resendApiKey,
    GOOGLE_AI_API_KEY: !!env.googleAiKey,
    NOTIFY_INCLUDE_PII: env.notifyIncludePii,
    SURENSE_CLIENT_ID: !!env.surenseClientId,
    SURENSE_CLIENT_SECRET: !!env.surenseClientSecret,
    SURENSE_WEBHOOK_SECRET: !!env.surenseWebhookSecret,
    SURENSE_WEBHOOK_SECRET_NEXT: !!env.surenseWebhookSecretNext,
  };
}

declare const Deno: { env: { get(name: string): string | undefined } };

/** Runtime entry: read the real environment (index.ts files only; handlers take Env as a parameter). */
export function denoEnv(): Env {
  return loadEnv((n) => Deno.env.get(n));
}
