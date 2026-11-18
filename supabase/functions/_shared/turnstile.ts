// Cloudflare Turnstile siteverify. Tokens are single use (300 s): lead-intake replays an Idempotency-Key BEFORE this
// call so a retry never burns a second token. Without TURNSTILE_SECRET_KEY: skipped with a warning outside production,
// refused (fail closed) in production.
import type { FetchFn } from "./db.ts";

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: "missing_token" | "rejected" | "hostname" | "unavailable" | "not_configured"; codes?: string[] };

export interface TurnstileOptions {
  secret: string | null;
  production: boolean;
  /** allowed hostnames (from ALLOWED_ORIGINS); enforced in production only (test keys answer example.com). */
  hostnames: string[];
  fetch?: FetchFn;
  timeoutMs?: number;
}

// No `idempotency_key` goes to siteverify: Cloudflare expects a UUID there and caches its answer per key, so a visitor
// who retries under the same lead Idempotency-Key with a fresh token could get the cached failure back. lead-intake
// runs api.lead_replay BEFORE this call, so a retry never needs Cloudflare-side idempotency.
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp: string | null,
  o: TurnstileOptions,
): Promise<TurnstileResult> {
  if (!o.secret) return o.production ? { ok: false, reason: "not_configured" } : { ok: true, skipped: true };
  if (!token || typeof token !== "string" || token.length > 2048) return { ok: false, reason: "missing_token" };
  const form = new URLSearchParams({ secret: o.secret, response: token });
  if (remoteIp) form.set("remoteip", remoteIp);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 5000);
  try {
    const res = await (o.fetch ?? fetch)(SITEVERIFY_URL, { method: "POST", body: form, signal: ctrl.signal });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const j = (await res.json()) as { success?: boolean; hostname?: string; "error-codes"?: string[] };
    if (!j.success) return { ok: false, reason: "rejected", codes: (j["error-codes"] ?? []).slice(0, 5) };
    // production with an allowlist: a missing hostname fails the check (it is not a pass)
    if (o.production && o.hostnames.length && (typeof j.hostname !== "string" || !o.hostnames.includes(j.hostname))) {
      return { ok: false, reason: "hostname" };
    }
    return { ok: true, skipped: false };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

export function hostnamesFromOrigins(origins: string[]): string[] {
  const out: string[] = [];
  for (const o of origins) {
    try {
      out.push(new URL(o).hostname);
    } catch { /* ignore malformed entries */ }
  }
  return out;
}
