// Loop prevention. Rules:
//  1. An event is never enqueued back to its origin system.
//  2. Every event has a stable id; an id seen before is dropped (duplicate delivery).
//  3. An inbound event whose content hash equals an event we already SENT to that same system for the
//     same customer is an echo (the system reports back what we just told it): dropped.
// Field ownership (sources/ownership.ts) is the second line: a mirror write from a non-owner is rejected.
import type { OriginSystem } from "./envelope.ts";
import type { Destination } from "./policy.ts";

export interface RegistryEntry {
  eventId: string;
  customerKey: string;
  originSystem: OriginSystem;
  contentHash: string;
  sentTo: Destination[];
}

export interface InboundEvent {
  eventId: string;
  customerKey: string;
  originSystem: OriginSystem;
  contentHash: string;
}

export type InboundDecision = { action: "accept" } | { action: "drop"; reason: "duplicate_event" | "echo" };

export function decideInbound(ev: InboundEvent, registry: readonly RegistryEntry[]): InboundDecision {
  if (registry.some((r) => r.eventId === ev.eventId)) return { action: "drop", reason: "duplicate_event" };
  const echo = registry.some(
    (r) =>
      r.customerKey === ev.customerKey &&
      r.contentHash === ev.contentHash &&
      (ev.originSystem === "salesforce" || ev.originSystem === "surense") &&
      r.sentTo.includes(ev.originSystem),
  );
  return echo ? { action: "drop", reason: "echo" } : { action: "accept" };
}

/** Destinations an event is routed to: owner plus replicas, minus the origin, minus disabled systems. */
export function routeTargets(
  origin: OriginSystem,
  owner: "salesforce" | "surense" | "operational_db",
  replicateTo: readonly Destination[],
  enabled: readonly Destination[],
): Destination[] {
  const set = new Set<Destination>();
  if (owner === "salesforce" || owner === "surense") set.add(owner);
  for (const d of replicateTo) set.add(d);
  return [...set].filter((d) => d !== origin && enabled.includes(d));
}

/** Canonical JSON (sorted keys) so equal content always hashes equal. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .filter((k) => o[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** sha256 hex of the canonical form. Uses WebCrypto (Node 20+, Deno, browsers). */
export async function contentHash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
