// Micropay (micropay.co.il) SMS API: one-time codes for the client area and the account balance probe.
// Chosen 2026-11-23 (Israeli provider, digital sign-up, OTP product, ~0.02 ILS per message). Documentation:
// https://site.micropay.co.il/api/ (otp.php, sms-balance.php). Every call is a JSON POST with the token in the body;
// the answer is the uniform {status, message, data} shape. The code itself is generated, stored and checked by
// Micropay (maxtries lock, one use per code, validity window), so nothing secret is kept on our side.
// Never log the token, a phone number or a code; callers get codes (CODE_SENT, WRONG_CODE, ...) and counts only.
import type { FetchFn } from "../db.ts";

export const MICROPAY_BASE = "https://www.micropay.co.il/extApi";
export const MICROPAY_SMS_URL = `${MICROPAY_BASE}/scheduleSms.php`;
export const MICROPAY_OTP_URL = `${MICROPAY_BASE}/sendOtp.php`;
const TIMEOUT_MS = 15_000;

export interface MicropayClientOptions {
  token: string;
  fetch?: FetchFn;
  timeoutMs?: number;
}

export type MicropayFailure = {
  ok: false;
  /** short code only: max_sent, wrong_code, max_tries, bad_token, bad_phone, http_<status>, timeout, network, error */
  code: string;
  status: number;
  retryable: boolean;
  /** verification: how many wrong attempts are left (WRONG_CODE only) */
  triesLeft?: number;
  /** the provider's own description of a parameter error, ASCII only, bounded: for the health probe and logs (no personal data: it
   *  names a parameter, never echoes a phone or a code) */
  detail?: string;
};
export type MicropayResult<T> = { ok: true; data: T } | MicropayFailure;

/** Israeli phone as Micropay wants it: local digits only (05xxxxxxxx, 0[2-9]xxxxxxx). +972 / 972 / spaces / dashes are
 *  normalised; anything else is null. */
export function normalizeIsraeliPhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  let s = v.replace(/[\s()-]/g, "");
  if (s.startsWith("+972")) s = "0" + s.slice(4);
  else if (s.startsWith("972") && s.length >= 11) s = "0" + s.slice(3);
  if (!/^0\d{8,9}$/.test(s)) return null;
  if (s.startsWith("05") && s.length !== 10) return null;
  if (!s.startsWith("05") && s.length !== 9) return null;
  return s;
}

interface Uniform {
  status?: unknown;
  message?: unknown;
  action?: unknown;
  data?: Record<string, unknown>;
}

/** maps the provider's description text to a short code (the text itself is never kept) */
function descriptionCode(d: unknown): string {
  const t = typeof d === "string" ? d.toLowerCase() : "";
  if (t.includes("token")) return "bad_token";
  if (t.includes("phone")) return "bad_phone";
  if (t.includes("credit") || t.includes("balance")) return "no_credit";
  return "error";
}

/** JSON mode (Content-Type application/json, token in the body, uniform answer). Verified against the live API on
 *  2026-11-23: the JSON transport is read correctly ("token parameter is not valid" came back for a mistyped token), so
 *  no other transport is tried. The token never goes in a URL. */
async function post(o: MicropayClientOptions, url: string, body: Record<string, unknown>): Promise<MicropayResult<Uniform>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await (o.fetch ?? fetch)(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ token: o.token, ...body }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, code: `http_${res.status}`, status: res.status, retryable: res.status === 429 || res.status >= 500 };
    let j: Uniform;
    try {
      j = (await res.json()) as Uniform;
    } catch {
      return { ok: false, code: "bad_response", status: res.status, retryable: true };
    }
    if (!j || typeof j !== "object") return { ok: false, code: "bad_response", status: res.status, retryable: true };
    if (j.status === 0 || j.message === "ERROR") {
      const d = j.data?.description;
      const detail = typeof d === "string" ? d.replace(/[^\x20-\x7e]/g, "").replace(/\d{7,}/g, "#").slice(0, 120) : undefined;
      return { ok: false, code: descriptionCode(d), status: res.status, retryable: false, ...(detail ? { detail } : {}) };
    }
    return { ok: true, data: j };
  } catch {
    return { ok: false, code: ctrl.signal.aborted ? "timeout" : "network", status: 0, retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

/** account balance (messages left); act=credit on the sending endpoint. The cheapest way to prove the token works. */
export async function smsBalance(o: MicropayClientOptions): Promise<MicropayResult<{ credit: number }>> {
  const r = await post(o, MICROPAY_SMS_URL, { act: "credit" });
  if (!r.ok) return r;
  const credit = r.data.data?.credit;
  if (typeof credit !== "number" || !Number.isFinite(credit)) return { ok: false, code: "bad_response", status: 200, retryable: true };
  return { ok: true, data: { credit } };
}

export interface OtpSendOptions {
  /** already normalised (normalizeIsraeliPhone) */
  phone: string;
  /** sms (default) | vms (voice) | auto (sms, voice when the number cannot take sms; needs the voice service on the account) */
  type?: "sms" | "vms" | "auto";
  codeLength?: number;
  validMinutes?: number;
  maxSends?: number;
  maxTries?: number;
  /** send: a new code cancels the earlier ones; verify: a valid code cancels the rest */
  clearCodes?: "send" | "verify";
  /** approved sender id (number or name); absent = the account default */
  sender?: string | null;
  /** text before the code (default "קוד האימות שלך הוא:") */
  text?: string;
  lang?: "he" | "en" | "ar" | "ru";
  /** domain for the WebOTP line (@domain #code) so the phone fills the code in by itself */
  webOtpDomain?: string;
}

/** step 1: Micropay generates and sends the code. CODE_SENT -> {channel}; MAX_SENT (quota for the validity window) is a
 *  non-retryable failure the page should show as "wait a few minutes". */
export async function otpSend(o: MicropayClientOptions, s: OtpSendOptions): Promise<MicropayResult<{ channel: string }>> {
  const body: Record<string, unknown> = { phone: s.phone, type: s.type ?? "sms" };
  if (s.codeLength) body.codelen = String(s.codeLength);
  if (s.validMinutes) body.minvalid = String(s.validMinutes);
  if (s.maxSends) body.maxsms = String(s.maxSends);
  if (s.maxTries) body.maxtries = String(s.maxTries);
  if (s.clearCodes) body.clearcodes = s.clearCodes;
  if (s.sender) body.smsfrom = s.sender;
  if (s.text) body.smstext = s.text;
  if (s.lang) body.lang = s.lang;
  if (s.webOtpDomain) body.webotp = s.webOtpDomain;
  const r = await post(o, MICROPAY_OTP_URL, body);
  if (!r.ok) return r;
  const m = r.data.message;
  if (m === "CODE_SENT") {
    const ch = r.data.data?.channel;
    return { ok: true, data: { channel: typeof ch === "string" ? ch : "sms" } };
  }
  if (m === "MAX_SENT") return { ok: false, code: "max_sent", status: 200, retryable: false };
  return { ok: false, code: "error", status: 200, retryable: false };
}

/** step 2: Micropay checks the code. CODE_VALID -> ok; WRONG_CODE (+ triesLeft) / MAX_TRIES (locked: send a new code)
 *  are failures with their own codes. */
export async function otpVerify(o: MicropayClientOptions, v: { phone: string; code: string }): Promise<MicropayResult<Record<never, never>>> {
  if (!/^\d{3,8}$/.test(v.code)) return { ok: false, code: "wrong_code", status: 0, retryable: false };
  const r = await post(o, MICROPAY_OTP_URL, { phone: v.phone, code: v.code });
  if (!r.ok) return r;
  const m = r.data.message;
  if (m === "CODE_VALID") return { ok: true, data: {} };
  if (m === "WRONG_CODE") {
    const left = r.data.data?.triesLeft;
    return { ok: false, code: "wrong_code", status: 200, retryable: false, ...(typeof left === "number" ? { triesLeft: left } : {}) };
  }
  if (m === "MAX_TRIES") return { ok: false, code: "max_tries", status: 200, retryable: false };
  return { ok: false, code: "error", status: 200, retryable: false };
}
