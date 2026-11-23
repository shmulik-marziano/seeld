// surense-webhook: Surense -> Svix -> here. Server to server (no Origin, no CORS). Order matters:
//   POST only -> secret + DB configured (else 503, fail closed) -> memory limit per sender tag -> body <= 256 KB ->
//   Svix signature against SURENSE_WEBHOOK_SECRET or SURENSE_WEBHOOK_SECRET_NEXT (rotation; the matching slot NAME is
//   logged) (before ANY DB call: unsigned traffic writes nothing) -> JSON whose `eventType` (real Surense, PascalCase) or
//   `type` is mapped to our dotted name by _shared/surense/events.ts (anything else is stored as "unknown") ->
//   api.surense_event_ingest (switch surense_webhook_enabled, DB rate limit, idempotent by svix-id, payload encrypted,
//   one surense.event job queued) -> 200 {ok:true}. A duplicate is also 200: Svix retries any non-2xx for about a day.
// Logs: svix-id, event type, inbox id, codes. Never the body.
import { type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import { clientIp } from "../_shared/ip.ts";
import type { Logger } from "../_shared/logger.ts";
import { type RateLimiter, rateLimitHeaders } from "../_shared/rateLimit.ts";
import { requestIdFor } from "../_shared/request.ts";
import { shortHash } from "../_shared/secret.ts";
import { type WebhookSecretSlot, webhookSecrets } from "../_shared/surense/env.ts";
import { eventTypeOf } from "../_shared/surense/events.ts";
import { type SvixResult, verifyWebhook } from "../_shared/surense/svix.ts";

export const MAX_BODY_BYTES = 262_144;
export const MEMORY_LIMIT_PER_MIN = 300;
/** Sent with the 503 while surense_webhook_enabled is off: a hint to Svix (best effort), its own schedule still runs. */
export const DISABLED_RETRY_AFTER_SEC = 300;

export interface WebhookDeps {
  env: Env;
  rpc: Rpc | null;
  log: Logger;
  limiter: RateLimiter;
  nowSec?: () => number;
}

/** Pure part of the ingest contract: the event type we store for a verified body (see _shared/surense/events.ts). */
export function eventType(body: unknown): string {
  return eventTypeOf(body);
}

/** Reads the body as bytes and stops (413) as soon as it passes `max`: a chunked body without content-length is
 *  never buffered beyond the cap. */
export async function readBodyCapped(req: Request, max: number): Promise<Uint8Array> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > max) throw new HttpError("payload_too_large", "Too large");
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      throw new HttpError("payload_too_large", "Too large");
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

export type SlotResult =
  | { ok: true; id: string; ts: number; slot: WebhookSecretSlot; badSlots: WebhookSecretSlot[] }
  | { ok: false; reason: "secret" | "headers" | "timestamp" | "signature"; badSlots: WebhookSecretSlot[] };

/** Svix verification against every configured secret slot (rotation): the first slot that verifies wins. Header and
 *  timestamp problems do not depend on the secret, so they end the loop. Only slot NAMES leave this function. */
export async function verifyAnySlot(
  headers: Headers,
  raw: string,
  slots: Array<{ slot: WebhookSecretSlot; secret: string }>,
  nowSec?: number,
): Promise<SlotResult> {
  const badSlots: WebhookSecretSlot[] = [];
  let reason: "secret" | "headers" | "timestamp" | "signature" = "secret";
  for (const s of slots) {
    const v: SvixResult = await verifyWebhook(headers, raw, s.secret, nowSec);
    if (v.ok) return { ok: true, id: v.id, ts: v.ts, slot: s.slot, badSlots };
    if (v.reason === "secret") {
      badSlots.push(s.slot);
      continue;
    }
    reason = v.reason;
    if (v.reason === "headers" || v.reason === "timestamp") break;
  }
  return { ok: false, reason, badSlots };
}

export function createWebhookHandler(d: WebhookDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const rid = requestIdFor(req);
    const log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "POST") throw new HttpError("method_not_allowed", "POST only");
      const slots = webhookSecrets(d.env);
      if (!slots.length || !d.rpc) throw new HttpError("unavailable", "disabled");
      const tag = await shortHash(clientIp(req.headers) ?? "none");
      const lim = await d.limiter.consume(`ip:${tag}`, MEMORY_LIMIT_PER_MIN, 60);
      if (!lim.allowed) throw new HttpError("rate_limited", "Too many requests", { headers: rateLimitHeaders(lim) });

      // the signature covers the UTF-8 text as Svix sent it; decode once, the same way req.text() would
      const raw = new TextDecoder().decode(await readBodyCapped(req, MAX_BODY_BYTES));

      const v = await verifyAnySlot(req.headers, raw, slots, d.nowSec?.());
      if (!v.ok) {
        log.warn("surense webhook rejected", { reason: v.reason, tag, badSlots: v.badSlots });
        if (v.reason === "secret") throw new HttpError("unavailable", "disabled"); // misconfigured secret: our fault
        throw new HttpError("unauthenticated", "Bad signature");
      }
      // a malformed slot next to a working one: still accepted, but say which NAME is broken
      if (v.badSlots.length) log.warn("surense webhook secret slot malformed", { badSlots: v.badSlots });
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new HttpError("bad_request", "Invalid JSON");
      }
      const type = eventType(body);
      let r: { id: number; duplicate: boolean; job_id?: number };
      try {
        r = await d.rpc.call("surense_event_ingest", {
          p_svix_id: v.id,
          p_type: type,
          p_ts: new Date(v.ts * 1000).toISOString(),
          p_payload: raw,
        });
      } catch (e) {
        // switch off: 503 (never 410 or "disable delivery") so Svix keeps the message and retries later
        if (e instanceof RpcError && e.status === 423) {
          throw new HttpError("unavailable", "disabled", { headers: { "retry-after": String(DISABLED_RETRY_AFTER_SEC) } });
        }
        if (e instanceof RpcError && e.status === 429) throw new HttpError("rate_limited", "Too many requests", { headers: { "retry-after": "60" } });
        if (e instanceof RpcError && e.status === 400) throw new HttpError("bad_request", "Invalid event");
        throw e;
      }
      log.info("surense event stored", { svixId: v.id, type, eventId: r?.id, duplicate: r?.duplicate === true, jobId: r?.job_id ?? null, slot: v.slot });
      return jsonResponse({ ok: true }, rid);
    } catch (e) {
      if (!(e instanceof HttpError)) {
        log.error("surense-webhook error", { error: e instanceof RpcError ? e.code : e instanceof Error ? e.name : "unknown" });
      }
      return errorResponse(e, rid);
    }
  };
}
