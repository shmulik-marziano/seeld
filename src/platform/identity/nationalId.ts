// Israeli national ID handling for identity_links. The value is NEVER logged and never stored in plaintext.
// Flow: normalise (exactly nine digits, left padded) -> validate check digit -> send to the database over
// a bound parameter -> identity_hash_national_id() computes HMAC-SHA256 with a secret held in Vault
// (never in this repo, never in the browser) and encrypts the value with pgcrypto.

export type NationalIdResult = { ok: true; id: string } | { ok: false; error: "empty" | "not_digits" | "too_long" | "bad_check_digit" };

/** Strip separators/spaces, left-pad to nine digits. Does NOT validate the check digit. */
export function normalizeNationalId(raw: string): { ok: true; id: string } | { ok: false; error: "empty" | "not_digits" | "too_long" } {
  const s = String(raw ?? "").replace(/[\s\-./]/g, "");
  if (s === "") return { ok: false, error: "empty" };
  if (!/^\d+$/.test(s)) return { ok: false, error: "not_digits" };
  if (s.length > 9) return { ok: false, error: "too_long" };
  return { ok: true, id: s.padStart(9, "0") };
}

/** Luhn-like Israeli ID check: digits weighted 1,2,1,2,... ; two-digit products are digit-summed; total % 10 === 0. */
export function hasValidCheckDigit(id9: string): boolean {
  if (!/^\d{9}$/.test(id9)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id9[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export function normalizeAndValidateNationalId(raw: string): NationalIdResult {
  const n = normalizeNationalId(raw);
  if (!n.ok) return n;
  return hasValidCheckDigit(n.id) ? n : { ok: false, error: "bad_check_digit" };
}
