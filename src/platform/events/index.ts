// Events / audit interface. Sinks are pluggable: console (dev), Supabase audit_log (future,
// server-side only), or a no-op. Payloads must not contain PII: pass ids and codes, not values.

export type AuditAction =
  | "auth.sign_in"
  | "auth.sign_out"
  | "auth.mfa_enrolled"
  | "auth.mfa_failed"
  | "document.uploaded"
  | "document.ingestion_status"
  | "document.viewed"
  | "api_client.created"
  | "api_client.revoked"
  | "settings.changed";

export interface AuditEvent {
  action: AuditAction;
  /** auth.users id of the actor, or null for system. */
  actorId: string | null;
  /** Resource kind and id, e.g. { type: "document_ingestion", id: "..." }. */
  resource?: { type: string; id: string };
  requestId?: string;
  /** Small, non-PII metadata (codes, counts, booleans). */
  meta?: Record<string, string | number | boolean | null>;
  at?: string;
}

export interface AuditSink {
  record(event: AuditEvent): void | Promise<void>;
}

const PII_KEY = /(id_?number|national|teudat|phone|mobile|email|name|address|password|token|secret)/i;

/** Drops keys that look like PII before an event reaches any sink. Defence in depth, not a licence. */
export function scrubMeta(meta: AuditEvent["meta"]): AuditEvent["meta"] {
  if (!meta) return meta;
  return Object.fromEntries(Object.entries(meta).filter(([k]) => !PII_KEY.test(k)));
}

export class AuditLogger {
  constructor(private readonly sinks: AuditSink[], private readonly now: () => Date = () => new Date()) {}
  async record(event: AuditEvent): Promise<void> {
    const safe: AuditEvent = { ...event, meta: scrubMeta(event.meta), at: event.at ?? this.now().toISOString() };
    await Promise.allSettled(this.sinks.map((s) => s.record(safe)));
  }
}

export const noopSink: AuditSink = { record() {} };
export const consoleSink: AuditSink = {
  record(e) {
    console.info("[audit]", JSON.stringify(e));
  },
};
