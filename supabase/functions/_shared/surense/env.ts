// Surense settings, read through the one env reader (../env.ts reads SURENSE_CLIENT_ID, SURENSE_CLIENT_SECRET and
// SURENSE_WEBHOOK_SECRET and the optional SURENSE_WEBHOOK_SECRET_NEXT by name). Nothing here logs or returns a value
// except webhookSecrets(), whose result goes only to the Svix verifier: presence booleans and slot NAMES elsewhere.
import type { Env } from "../env.ts";

export interface SurenseCredentials {
  clientId: string;
  clientSecret: string;
}

/** The env NAME of a webhook secret slot: the only thing about a secret that may be logged. */
export type WebhookSecretSlot = "SURENSE_WEBHOOK_SECRET" | "SURENSE_WEBHOOK_SECRET_NEXT";

/** OAuth client configured (both halves present). */
export function isConfigured(env: Env): boolean {
  return !!env.surenseClientId && !!env.surenseClientSecret;
}

const svixShaped = (s: string | null | undefined): s is string => !!s && s.startsWith("whsec_");

/** Webhook secret configured and in the Svix shape (the current one, or the rotation slot _NEXT). */
export function isWebhookConfigured(env: Env): boolean {
  return svixShaped(env.surenseWebhookSecret) || svixShaped(env.surenseWebhookSecretNext);
}

/** Secrets to verify a delivery against, current slot first. Rotation: set _NEXT to the new Svix secret, rotate in
 *  Svix, then (after the old one expires) move it to SURENSE_WEBHOOK_SECRET; either slot verifies meanwhile. A set
 *  but malformed value is still returned, so the verifier reports it as `secret` (our misconfiguration). */
export function webhookSecrets(env: Env): Array<{ slot: WebhookSecretSlot; secret: string }> {
  const out: Array<{ slot: WebhookSecretSlot; secret: string }> = [];
  if (env.surenseWebhookSecret) out.push({ slot: "SURENSE_WEBHOOK_SECRET", secret: env.surenseWebhookSecret });
  if (env.surenseWebhookSecretNext && env.surenseWebhookSecretNext !== env.surenseWebhookSecret) {
    out.push({ slot: "SURENSE_WEBHOOK_SECRET_NEXT", secret: env.surenseWebhookSecretNext });
  }
  return out;
}

export function credentials(env: Env): SurenseCredentials | null {
  return isConfigured(env) ? { clientId: env.surenseClientId as string, clientSecret: env.surenseClientSecret as string } : null;
}

/** Names and booleans only (health views, boot logs). */
export function surensePresence(env: Env): Record<string, boolean> {
  return {
    SURENSE_CLIENT_ID: !!env.surenseClientId,
    SURENSE_CLIENT_SECRET: !!env.surenseClientSecret,
    SURENSE_WEBHOOK_SECRET: isWebhookConfigured(env),
  };
}
