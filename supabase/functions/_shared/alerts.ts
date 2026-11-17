// Operational alert delivery. Recipients are DATA (table alert_recipients, supplied by the owner): never hard coded.
// Channel senders are injected. TODO(owner): choose the delivery providers (email / SMS / WhatsApp / webhook).
import type { Logger } from "./logger.ts";

export interface AlertRecipient {
  name: string;
  channel: "email" | "sms" | "whatsapp" | "webhook";
  address: string;
}
export interface PendingAlert {
  id: number;
  severity: "warning" | "critical";
  kind: string;
  summary: string;
}
export interface AlertSender {
  send(recipient: AlertRecipient, alert: PendingAlert): Promise<void>;
}
export interface AlertDb {
  claimPending(limit: number): Promise<PendingAlert[]>;
  recipients(severity: PendingAlert["severity"]): Promise<AlertRecipient[]>;
  mark(id: number, status: "sent" | "failed" | "no_recipients"): Promise<void>;
}

/** Default sender: logs the alert id only (no address, no content beyond the summary). Replace with real channel senders. */
export function logOnlySender(log: Logger): AlertSender {
  return { async send(r, a) { log.warn("alert (log only sender)", { alertId: a.id, severity: a.severity, channel: r.channel }); } };
}

export async function dispatchAlerts(db: AlertDb, sender: AlertSender, log: Logger, limit = 10): Promise<{ sent: number; failed: number; noRecipients: number }> {
  const out = { sent: 0, failed: 0, noRecipients: 0 };
  for (const alert of await db.claimPending(limit)) {
    const to = await db.recipients(alert.severity);
    if (to.length === 0) {
      await db.mark(alert.id, "no_recipients"); // the owner has not supplied recipients yet
      out.noRecipients++;
      continue;
    }
    const results = await Promise.allSettled(to.map((r) => sender.send(r, alert)));
    const ok = results.some((r) => r.status === "fulfilled");
    await db.mark(alert.id, ok ? "sent" : "failed");
    if (ok) out.sent++;
    else {
      out.failed++;
      log.error("alert delivery failed", { alertId: alert.id });
    }
  }
  return out;
}
