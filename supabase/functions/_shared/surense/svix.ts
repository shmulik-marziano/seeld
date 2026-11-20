// Svix webhook verification (Surense delivers its webhooks through Svix). Pure, WebCrypto only.
// Scheme: secret "whsec_<base64>"; signed content "{svix-id}.{svix-timestamp}.{raw body}"; HMAC-SHA256 -> base64;
// svix-signature holds one or more space-separated "v1,<base64>" entries; any match passes (key rotation).
// Timestamps more than 5 minutes from now are refused (replay window). The raw body must be the exact bytes received
// (await req.text()), never a re-serialised object.
import { timingSafeEqual } from "../secret.ts";

const enc = new TextEncoder();
export const SVIX_TOLERANCE_SEC = 300;

export type SvixResult =
  | { ok: true; id: string; ts: number }
  | { ok: false; reason: "secret" | "headers" | "timestamp" | "signature" };

const ID = /^[A-Za-z0-9_-]{1,100}$/;

function b64ToBytes(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function bytesToB64(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}

export async function svixSignature(secret: string, id: string, ts: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", b64ToBytes(secret.slice("whsec_".length)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToB64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${rawBody}`))));
}

export async function verifyWebhook(
  headers: Headers,
  rawBody: string,
  secret: string | null,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<SvixResult> {
  if (!secret || !secret.startsWith("whsec_") || secret.length < 20) return { ok: false, reason: "secret" };
  const id = headers.get("svix-id") ?? "";
  const tsRaw = headers.get("svix-timestamp") ?? "";
  const sig = headers.get("svix-signature") ?? "";
  if (!ID.test(id) || !/^\d{1,12}$/.test(tsRaw) || !sig || sig.length > 4096) return { ok: false, reason: "headers" };
  const ts = Number(tsRaw);
  if (Math.abs(nowSec - ts) > SVIX_TOLERANCE_SEC) return { ok: false, reason: "timestamp" };
  let expected: string;
  try {
    expected = await svixSignature(secret, id, tsRaw, rawBody);
  } catch {
    return { ok: false, reason: "secret" }; // not valid base64
  }
  let match = false;
  for (const part of sig.split(" ")) {
    const [version, value] = part.split(",", 2);
    // compare every candidate (no early exit on the first match)
    if (version === "v1" && value && (await timingSafeEqual(value, expected))) match = true;
  }
  return match ? { ok: true, id, ts } : { ok: false, reason: "signature" };
}
