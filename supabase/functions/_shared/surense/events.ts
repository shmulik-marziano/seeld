// Surense (Svix) webhook event types. Verified 2026-11-23 on the first 40 real deliveries: the body is a FLAT object,
// the type lives in `eventType` in PascalCase (NispahAlefProxyApproved, HarbDataLoaded, SwiftnessE9100Completed,
// CustomerCreated, LeadCreated, ...), with customerId / tenantId / agencyId / date and the entity's fields at top level.
// There is no `type` and no `data` wrapper. The connector keeps its own dotted lowercase names (the topic catalogue in
// docs/platform/EDGE-FUNCTIONS.md and HQ webhooks.md); this module is the single place that maps one to the other.

/** the stored form: dotted lowercase, 1..80 chars (api.surense_event_ingest enforces the same) */
export const EVENT_TYPE = /^[a-z0-9_.]{1,80}$/;

/** PascalCase names whose dotted form is not the mechanical split */
const KNOWN: Record<string, string> = {
  NispahAlefProxyApproved: "dataproxy.aleph.approved",
  NispahBetProxyApproved: "dataproxy.bet.approved",
  NispahHeiProxyApproved: "dataproxy.hei.approved",
  HarbDataLoaded: "harb.uploaded",
  SwiftnessE9100Completed: "swiftness.e9100.completed",
  SwiftnessE9100Submitted: "swiftness.e9100.submitted",
};

/** raw type (PascalCase from Surense, or an already-dotted name) -> our dotted name, else "unknown" */
export function normalizeEventType(raw: unknown): string {
  if (typeof raw !== "string") return "unknown";
  const t = raw.trim();
  if (!t) return "unknown";
  if (KNOWN[t]) return KNOWN[t];
  if (EVENT_TYPE.test(t)) return t;
  // mechanical split: CustomerCreated -> customer.created, LeadCreated -> lead.created, DocumentUploaded -> document.uploaded
  if (/^[A-Z][A-Za-z0-9]{1,79}$/.test(t)) {
    const dotted = t.replace(/([a-z0-9])([A-Z])/g, "$1.$2").toLowerCase();
    return EVENT_TYPE.test(dotted) ? dotted : "unknown";
  }
  return "unknown";
}

/** the type of a verified webhook body: `eventType` (real Surense) or `type` (our older assumption / tests) */
export function eventTypeOf(body: unknown): string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "unknown";
  const b = body as Record<string, unknown>;
  return normalizeEventType(b.eventType ?? b.type);
}
