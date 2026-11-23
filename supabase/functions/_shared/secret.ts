// Shared-secret checks for cron-invoked functions (x-cron-secret, set by ops.http_invoke from Vault 'edge_cron_secret').
// verify_jwt=false on these functions: the platform JWT check does not authenticate API keys, so this IS the auth.
import { HttpError } from "./errors.ts";

const enc = new TextEncoder();

/** Constant-time comparison over the SHA-256 of both inputs (equal length, no early exit, no length oracle). */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0 && a.length === b.length;
}

/** true when the request carries the right cron secret. A missing EDGE_CRON_SECRET never matches (fail closed). */
export async function hasCronSecret(req: Request, expected: string | null): Promise<boolean> {
  const got = req.headers.get("x-cron-secret");
  if (!expected || !got) return false;
  return await timingSafeEqual(got, expected);
}

/** A second opinion on the presented secret: the database compares it with Vault 'edge_cron_secret' (api.cron_secret_ok,
 *  service role). With it, the function secret EDGE_CRON_SECRET is optional and the Vault is the single source of truth
 *  (2026-11-23: the manual copy of the Vault value into the function secret was never completed and every tick got 401). */
export type CronSecretCheck = (presented: string) => Promise<boolean>;

export function cronSecretViaRpc(rpc: { call(fn: string, args: Record<string, unknown>): Promise<unknown> }): CronSecretCheck {
  return async (presented) => {
    try {
      return (await rpc.call("cron_secret_ok", { p_secret: presented })) === true;
    } catch {
      return false; // an older schema without the RPC, or a database hiccup: fail closed
    }
  };
}

/** Accepts the request when the header equals EDGE_CRON_SECRET, or else when the database says it equals the Vault secret.
 *  503 only when neither source exists; 401 for a missing or wrong header. */
export async function requireCronSecret(req: Request, expected: string | null, viaDb?: CronSecretCheck): Promise<void> {
  if (!expected && !viaDb) throw new HttpError("unavailable", "Not configured");
  if (expected && (await hasCronSecret(req, expected))) return;
  const got = req.headers.get("x-cron-secret");
  if (viaDb && got && got.length >= 16 && got.length <= 256 && (await viaDb(got))) return;
  throw new HttpError("unauthenticated", "Bad cron secret");
}

/** A keyed labeller: HMAC-SHA-256 under a random 32-byte key that never leaves memory, first 6 bytes in hex.
 *  A plain hash of an IP is NOT a safe log label: IPv4 is 2^32 values, so sha256(ip) is brute-forced back to the
 *  address in minutes. Under an unknown random key the label cannot be reversed, nor joined across isolates. */
export function createTagger(rawKey: Uint8Array = crypto.getRandomValues(new Uint8Array(32))): (value: string) => Promise<string> {
  const key = crypto.subtle.importKey("raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return async (value: string) => {
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", await key, enc.encode(value)));
    return Array.from(mac.slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
  };
}

// One key per isolate: stable for the isolate's in-memory limiters and reject counter, which are per isolate anyway.
const isolateTagger = createTagger();

/** Short, non-reversible label for in-memory buckets and logs (never a raw IP, nor a plain hash of one, in a log line). */
export function shortHash(value: string): Promise<string> {
  return isolateTagger(value);
}
