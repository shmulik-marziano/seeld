// Message envelope for both destination queues. NO PII: ids, codes, field KEYS (never values).
// Values are loaded by the worker from the operational database at processing time.
import type { Destination } from "./policy.ts";

export const ORIGIN_SYSTEMS = ["operational_db", "salesforce", "surense", "portal", "manual"] as const;
export type OriginSystem = (typeof ORIGIN_SYSTEMS)[number];

export const EVENT_TYPES = [
  "lead.created",
  "customer.upserted",
  "case.updated",
  "task.created",
  "questionnaire.step_completed",
  "questionnaire.submitted",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface QueueEnvelope {
  v: 1;
  /** Stable event id (uuid), also the idempotency anchor for the downstream call. */
  eventId: string;
  originSystem: OriginSystem;
  /** HMAC-SHA256 hex (keyed, Vault secret event_hash_key) of the content; see loop.ts. Used for echo detection. */
  contentHash: string;
  destination: Destination;
  /** identity_links.internal_customer_id as text. Never a national id. */
  customerKey: string;
  /** Per customer AND per destination strictly increasing sequence, assigned inside the enqueue transaction. */
  seq: number;
  type: EventType;
  /** Keys of the fields that changed (no values). */
  fieldKeys: string[];
  caseId?: string;
  requestId?: string;
  enqueuedAt: string;
}

const HEX64 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseEnvelope(raw: unknown): { ok: true; value: QueueEnvelope } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "not_an_object" };
  const r = raw as Record<string, unknown>;
  if (r.v !== 1) return { ok: false, error: "bad_version" };
  if (typeof r.eventId !== "string" || !UUID.test(r.eventId)) return { ok: false, error: "bad_event_id" };
  if (!ORIGIN_SYSTEMS.includes(r.originSystem as OriginSystem)) return { ok: false, error: "bad_origin" };
  if (typeof r.contentHash !== "string" || !HEX64.test(r.contentHash)) return { ok: false, error: "bad_content_hash" };
  if (r.destination !== "salesforce" && r.destination !== "surense") return { ok: false, error: "bad_destination" };
  if (typeof r.customerKey !== "string" || r.customerKey.length < 8 || r.customerKey.length > 64) return { ok: false, error: "bad_customer_key" };
  if (!Number.isInteger(r.seq) || (r.seq as number) < 1) return { ok: false, error: "bad_seq" };
  if (!EVENT_TYPES.includes(r.type as EventType)) return { ok: false, error: "bad_type" };
  if (!Array.isArray(r.fieldKeys) || r.fieldKeys.some((k) => typeof k !== "string")) return { ok: false, error: "bad_field_keys" };
  if (r.originSystem === r.destination) return { ok: false, error: "origin_equals_destination" };
  if (typeof r.enqueuedAt !== "string") return { ok: false, error: "bad_enqueued_at" };
  return { ok: true, value: r as unknown as QueueEnvelope };
}
