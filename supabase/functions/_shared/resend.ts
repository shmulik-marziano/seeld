// Resend e-mail API. Every send carries Idempotency-Key (outbox-<id>), so a row that is re-claimed after a crash
// between "sent" and api.outbox_complete is not delivered twice (Resend keeps the key 24 h).
import type { FetchFn } from "./db.ts";

export const RESEND_URL = "https://api.resend.com/emails";

export interface Email {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; status: number; retryable: boolean; code: string };

export async function sendEmail(
  apiKey: string,
  email: Email,
  idempotencyKey: string,
  opts: { fetch?: FetchFn; timeoutMs?: number } = {},
): Promise<SendResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
  try {
    const res = await (opts.fetch ?? fetch)(RESEND_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(email),
      signal: ctrl.signal,
    });
    if (res.ok) {
      const j = (await res.json().catch(() => ({}))) as { id?: unknown };
      return { ok: true, id: typeof j.id === "string" ? j.id : null };
    }
    let code = `http_${res.status}`;
    try {
      const j = (await res.json()) as { name?: unknown };
      if (typeof j.name === "string" && /^[a-z_]{1,60}$/.test(j.name)) code = j.name; // e.g. validation_error
    } catch { /* body not JSON */ }
    return { ok: false, status: res.status, retryable: res.status === 429 || res.status >= 500, code };
  } catch {
    return { ok: false, status: 0, retryable: true, code: ctrl.signal.aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
