// The ONE place where values are shaped for the outside world (the official Surense API and the public page API).
// Pure functions, no I/O. Formats verified in the owner's full run of 2026-11-22 are locked (dates, signature); the one
// still unverified guess (the cell number) carries a TODO(owner-full-run). Each has a contract test with synthetic
// values, so changing a format is a one-line edit here plus one expectation in formatters_test.ts.

// ---- national id -------------------------------------------------------------------------------------------------
/** Israeli id check digit (Luhn-like): 9 digits, weights 1,2,1,2..., digit sums, total divisible by 10. */
export function isValidIsraeliId(id: string): boolean {
  if (!/^[0-9]{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * (i % 2 === 0 ? 1 : 2);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

/** TODO(owner-full-run): confirm the tool wants the bare 9 digits (no padding or separators). */
export function nationalIdForTool(id: string): string {
  return id;
}

// ---- phone -------------------------------------------------------------------------------------------------------
/** "0501234567" / "050-123 4567" / "+972501234567" / "972501234567" -> "+972501234567"; null for anything else
 *  (landlines, other countries, wrong length). Israeli mobile only (+9725x). */
export function toE164IsraeliMobile(input: string): string | null {
  const t = input.trim();
  if (!/^[0-9+\s().-]{9,20}$/.test(t)) return null;
  let d = t.replace(/[^0-9+]/g, "");
  if (d.startsWith("+972")) d = "0" + d.slice(4);
  else if (d.startsWith("972")) d = "0" + d.slice(3);
  if (!/^05[0-9][0-9]{7}$/.test(d)) return null;
  return `+972${d.slice(1)}`;
}

/** "+972501234567" -> "0501234567" (the local form the browser sends and crm.customers stores) */
export function toLocalMobile(e164: string): string | null {
  const m = /^\+972(5[0-9][0-9]{7})$/.exec(e164);
  return m ? `0${m[1]}` : null;
}

/** TODO(owner-full-run): the cell number format of proxies/start is NOT verified (the page showed "052-309-xxxx" with a
 *  country flag); E.164 "+972..." stays the current guess, also for proxies/invite and POST /customers. */
export function cellForTool(e164: string): string {
  return e164;
}

// ---- email / names -----------------------------------------------------------------------------------------------
export function cleanEmail(raw: unknown): string | null | undefined {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return undefined; // undefined = invalid
  const t = raw.trim().toLowerCase();
  if (t.length > 254 || !/^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,20}$/.test(t)) return undefined;
  return t;
}

const NAME = /^[\p{L}][\p{L}\p{M}'" .-]{0,59}$/u;
/** trimmed name or null (invalid): letters, marks, spaces and . ' " - only, 1 to 60 characters */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/\s+/g, " ");
  return NAME.test(t) ? t : null;
}

const ADDRESS = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}'" .,/\-]{1,79}$/u;
/** trimmed address line (street + house number, or the city) or null: letters, digits, marks, spaces and . , ' " / - ; 2 to 80 chars */
export function cleanAddress(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/\s+/g, " ");
  return ADDRESS.test(t) ? t : null;
}

/** "הרצל 12" -> {street: "הרצל", streetNumber: "12"}; a line with no trailing house number keeps the whole text as the street */
export function splitStreet(line: string): { street: string; streetNumber?: string } {
  const m = /^(.*\S)\s+(\d{1,5}[\p{L}]?(?:\/\d{1,4})?)$/u.exec(line);
  return m ? { street: m[1], streetNumber: m[2] } : { street: line };
}

// ---- dates -------------------------------------------------------------------------------------------------------
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** a real calendar date in ISO form, or null */
export function parseIsoDate(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const m = ISO.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return s;
}

/** today as YYYY-MM-DD in Israel (the approval date the clearing house expects is a local date) */
export function todayIsrael(nowMs: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(nowMs));
}

/** ISO date, 1900-01-01 .. today (Israel), else null */
export function pastIsoDate(s: unknown, nowMs: number): string | null {
  const iso = parseIsoDate(s);
  if (!iso || iso < "1900-01-01" || iso > todayIsrael(nowMs)) return null;
  return iso;
}

/** The harbit dates, validated exactly like api.poa_consent_record (one definition of "today": the Israeli calendar day):
 *  birth in 1900-01-01 .. yesterday, issue strictly after birth and not after today. Returns the code of the first bad field. */
export function harbitDates(birthRaw: unknown, issueRaw: unknown, nowMs: number): { birth: string; issue: string } | { error: "invalid_birth_date" | "invalid_issue_date" } {
  const today = todayIsrael(nowMs);
  const birth = pastIsoDate(birthRaw, nowMs);
  if (!birth || birth >= today) return { error: "invalid_birth_date" };
  const issue = pastIsoDate(issueRaw, nowMs);
  if (!issue || issue <= birth) return { error: "invalid_issue_date" };
  return { birth, issue };
}

/** verified 2026-11-22: proxies/hb takes birthDate and nationalIdCardIssuingDate as ISO YYYY-MM-DD. */
export function dateForTool(iso: string): string {
  return iso;
}

// ---- signature ---------------------------------------------------------------------------------------------------
export const MAX_SIGNATURE_CHARS = 300_000;
const PNG_PREFIX = "data:image/png;base64,";
const PNG_MAGIC_B64 = "iVBORw0KGgo"; // base64 of the 8-byte PNG signature, first 11 chars

/** PNG data URL (browser form) -> bare base64, or null when it is not a PNG data URL */
export function pngBase64(dataUrl: unknown): string | null {
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_SIGNATURE_CHARS || !dataUrl.startsWith(PNG_PREFIX)) return null;
  const b64 = dataUrl.slice(PNG_PREFIX.length);
  if (b64.length < 60 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || !b64.startsWith(PNG_MAGIC_B64)) return null;
  return b64;
}

/** verified 2026-11-22: proxies/policies `signature` is the full PNG data URL ("data:image/png;base64,..."). */
export function signatureForTool(dataUrl: string): string {
  const b64 = pngBase64(dataUrl);
  if (!b64) throw new TypeError("bad_signature");
  return `${PNG_PREFIX}${b64}`;
}
