// Pure validators for the questionnaire spine. Each returns { ok, value?, message?, warning? }:
//  - ok=false + message: block (warm Hebrew sentence).
//  - ok=true + warning: allowed, but worth a second look (plausibility), never a block.
//  - value: the normalised form that should be stored.
// No side effects, no network, no DOM. Tested table-driven in src/test/questionnaires-validators.test.ts.

export interface VResult<T = string> {
  ok: boolean;
  value?: T;
  message?: string;
  warning?: string;
}
const ok = <T = string>(value: T, warning?: string): VResult<T> => ({ ok: true, value, ...(warning ? { warning } : {}) });
const bad = <T = string>(message: string): VResult<T> => ({ ok: false, message });

export const MSG = {
  required: "השדה הזה חסר, אפשר להשלים אותו או לסמן 'לא יודע/ת'",
  generic: "המספר שהוזן לא נראה תקין, כדאי לבדוק שוב",
  text: "הטקסט שהוזן לא נראה תקין, כדאי לבדוק שוב",
  date: "התאריך לא נראה תקין, כדאי לבדוק שוב (יום/חודש/שנה)",
} as const;

// ---------------------------------------------------------------- helpers
/** Hebrew-Indic and Arabic-Indic digits to ASCII, strips bidi marks. */
export function toAsciiDigits(s: string): string {
  return s
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
}
export const digitsOnly = (s: string) => toAsciiDigits(s).replace(/\D/g, "");
const isBlank = (s: unknown) => s === null || s === undefined || String(s).trim() === "";

// ---------------------------------------------------------------- Israeli ID
/** Luhn-like check digit used by the Israeli ID number. Input must be exactly 9 digits. */
export function israeliIdCheckDigitOk(nine: string): boolean {
  if (!/^\d{9}$/.test(nine)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(nine[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}
/** 9 digits (left-padded), check digit, rejects empty and 000000000. Structural check only: it does not prove the ID exists. */
export function validateIsraeliId(input: string): VResult {
  const raw = digitsOnly(String(input ?? ""));
  if (!raw) return bad(MSG.required);
  if (raw.length > 9) return bad("בתעודת זהות יש עד 9 ספרות, כדאי לבדוק שוב");
  const padded = raw.padStart(9, "0");
  if (/^0+$/.test(padded)) return bad(MSG.generic);
  if (!israeliIdCheckDigitOk(padded)) return bad("המספר שהוזן לא נראה תקין, כדאי לבדוק שוב ספרה אחר ספרה");
  return ok(padded);
}

// ---------------------------------------------------------------- phone
/** Israeli mobile (05x) and landline (02/03/04/08/09, 07x). Accepts 0.., +972.., 972.., 00972.., separators. Normalises to 0XXXXXXXXX. */
export function validateIsraeliPhone(input: string): VResult {
  let d = digitsOnly(String(input ?? ""));
  if (!d) return bad(MSG.required);
  if (d.startsWith("00972")) d = "0" + d.slice(5);
  else if (d.startsWith("972")) d = "0" + d.slice(3);
  else if (!d.startsWith("0")) d = "0" + d; // 523097444 typed without the leading zero
  const mobile = /^05[0-9]\d{7}$/.test(d);
  const landline = /^0(?:[23489]\d{7}|7\d{8})$/.test(d);
  if (!(mobile || landline)) return bad("מספר הטלפון לא נראה תקין, כדאי לבדוק שוב (למשל 052-1234567)");
  return ok(d);
}
export function formatPhone(d: string): string {
  const n = digitsOnly(d);
  if (/^05\d{8}$/.test(n)) return `${n.slice(0, 3)}-${n.slice(3)}`;
  if (/^0[23489]\d{7}$/.test(n)) return `${n.slice(0, 2)}-${n.slice(2)}`;
  if (/^07\d{8}$/.test(n)) return `${n.slice(0, 3)}-${n.slice(3)}`;
  return d;
}
export function isMobile(d: string): boolean {
  return /^05\d{8}$/.test(digitsOnly(d));
}

// ---------------------------------------------------------------- email
export function validateEmail(input: string): VResult {
  const v = String(input ?? "").trim();
  if (!v) return bad(MSG.required);
  if (v.length > 254 || !/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-zא-ת]{2,}$/.test(v) || /\.\./.test(v) || v.startsWith(".")) {
    return bad("כתובת הדואר האלקטרוני לא נראית תקינה, כדאי לבדוק שוב");
  }
  return ok(v.toLowerCase());
}

// ---------------------------------------------------------------- passport / names
export function validatePassport(input: string): VResult {
  const v = String(input ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (!v) return bad(MSG.required);
  if (!/^[A-Z0-9]{6,12}$/.test(v)) return bad("מספר הדרכון לא נראה תקין, כדאי לבדוק שוב (6 עד 12 אותיות או ספרות)");
  return ok(v);
}
/** Hebrew/Latin letters, spaces, apostrophe (' ׳ ’), geresh/gershayim (״), hyphen. */
export function validatePersonName(input: string, opts: { min?: number; max?: number } = {}): VResult {
  const v = String(input ?? "").replace(/\s+/g, " ").trim();
  const min = opts.min ?? 2;
  const max = opts.max ?? 50;
  if (!v) return bad(MSG.required);
  if (v.length < min) return bad("השם קצר מדי, כדאי לבדוק שוב");
  if (v.length > max) return bad(`השם ארוך מדי (עד ${max} תווים)`);
  if (!/^[א-תA-Za-zÀ-ɏ]+(?:[ '׳’״"-][א-תA-Za-zÀ-ɏ]+)*[.']?$/.test(v)) {
    return bad("בשם אפשר להשתמש באותיות, רווח, גרש ומקף בלבד");
  }
  return ok(v);
}

/** First and last name at least: two or more words, each a valid name part. */
export function validateFullName(input: string): VResult {
  const base = validatePersonName(input, { min: 3, max: 80 });
  if (!base.ok) return base;
  const words = base.value!.split(" ").filter((w) => w.replace(/[^א-תA-Za-z]/g, "").length >= 2);
  if (words.length < 2) return bad("כדאי לכתוב שם פרטי ושם משפחה, כמו שמופיע בבנק");
  return base;
}

// ---------------------------------------------------------------- bank
/** "בנק הפועלים (12)" -> "12". Also accepts a bare code. */
export function bankCodeFromPick(v: string): string | null {
  const m = /\((\d{1,3})\)\s*$/.exec(v ?? "") ?? /^\s*(\d{1,3})\s*$/.exec(v ?? "");
  return m ? String(Number(m[1])) : null;
}
export function validateBankCode(input: string, known?: ReadonlySet<string>): VResult {
  const d = digitsOnly(String(input ?? ""));
  if (!d) return bad(MSG.required);
  if (d.length > 3) return bad("קוד הבנק הוא עד 3 ספרות");
  const code = String(Number(d));
  if (code === "0") return bad(MSG.generic);
  if (known && known.size && !known.has(code)) return ok(code, "הבנק הזה לא מופיע ברשימה שלנו, כדאי לבדוק שוב");
  return ok(code);
}
export function validateBranch(input: string, opts: { bank?: string; knownBranches?: ReadonlySet<string> } = {}): VResult {
  const d = digitsOnly(String(input ?? ""));
  if (!d) return bad(MSG.required);
  if (d.length > 3) return bad("מספר סניף הוא עד 3 ספרות");
  if (/^0+$/.test(d)) return bad(MSG.generic);
  const code = String(Number(d));
  if (opts.knownBranches && opts.knownBranches.size && !opts.knownBranches.has(code)) {
    return ok(code, "הסניף הזה לא מופיע ברשימה. סניפים נסגרים ומתמזגים, אז אפשר להמשיך אם המספר נכון");
  }
  return ok(code);
}
/** Digits only, 4-9, paste friendly (strips separators). There is no public check digit for ordinary accounts. */
export function validateAccountNumber(input: string): VResult {
  const d = digitsOnly(String(input ?? ""));
  if (!d) return bad(MSG.required);
  if (d.length < 4) return bad("מספר החשבון קצר מדי, בדרך כלל יש בו 4 עד 9 ספרות");
  if (d.length > 9) return bad("מספר החשבון ארוך מדי, בדרך כלל יש בו 4 עד 9 ספרות");
  return ok(d);
}

/** ISO 13616 mod-97 over a string of letters and digits. */
export function mod97(s: string): number {
  let rem = 0;
  const rearranged = s.slice(4) + s.slice(0, 4);
  for (const ch of rearranged) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const c of v) rem = (rem * 10 + Number(c)) % 97;
  }
  return rem;
}
/** Israeli IBAN: IL + 2 check digits + bank(3) + branch(3) + account(13) = 23 chars. */
export function validateIsraeliIban(input: string, opts: { bank?: string; branch?: string } = {}): VResult {
  const v = String(input ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (!v) return bad(MSG.required);
  if (!/^IL\d{21}$/.test(v)) return bad("מספר IBAN ישראלי מתחיל ב-IL ויש בו 23 תווים, כדאי לבדוק שוב");
  if (mod97(v) !== 1) return bad("ספרות הביקורת של ה-IBAN לא מתאימות, כדאי לבדוק שוב");
  const bank = String(Number(v.slice(4, 7)));
  const branch = String(Number(v.slice(7, 10)));
  if (opts.bank && String(Number(digitsOnly(opts.bank) || "0")) !== bank) return bad("קוד הבנק בתוך ה-IBAN שונה מהבנק שבחרת");
  if (opts.branch && String(Number(digitsOnly(opts.branch) || "0")) !== branch) return bad("מספר הסניף בתוך ה-IBAN שונה מהסניף שהזנת");
  return ok(v);
}
/** Builds a valid Israeli IBAN (used by tests and for the optional 'fill IBAN from details' helper). */
export function buildIsraeliIban(bank: string, branch: string, account: string): string {
  const bban = bank.padStart(3, "0") + branch.padStart(3, "0") + account.padStart(13, "0");
  const check = 98 - mod97("IL00" + bban);
  return `IL${String(check).padStart(2, "0")}${bban}`;
}

// ---------------------------------------------------------------- zip
/** 7 digits only. No automatic lookup (no open official database): see the Israel Post locator link in the UI. */
export function validateZip(input: string): VResult {
  const d = digitsOnly(String(input ?? ""));
  if (!d) return bad(MSG.required);
  if (d.length !== 7) return bad("מיקוד הוא 7 ספרות, אפשר לבדוק אותו באתר דואר ישראל");
  return ok(d);
}
export const ZIP_LOOKUP_URL = "https://doar.israelpost.co.il/locatezip";

// ---------------------------------------------------------------- amounts and numbers
export interface NumberOpts {
  min?: number | null;
  max?: number | null;
  integer?: boolean;
  /** soft ceiling: values above give a warning, not an error */
  warnAbove?: number | null;
}
/** Parses "1,234.5", "1 234", "₪1,234", "50%"; returns NaN when it is not a plain number. */
export function parseNumberInput(input: unknown): number {
  if (typeof input === "number") return input;
  let s = toAsciiDigits(String(input ?? "")).trim();
  if (!s) return NaN;
  s = s.replace(/[₪%\s]/g, "").replace(/ש"ח|שח|ש״ח/g, "");
  // Hebrew-locale decimal comma is not supported: "1,234" is always a thousands separator.
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/,/.test(s)) return NaN;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}
export function validateNumber(input: unknown, o: NumberOpts = {}): VResult<number> {
  if (isBlank(input)) return bad(MSG.required);
  const n = parseNumberInput(input);
  if (!Number.isFinite(n)) return bad(MSG.generic);
  if (o.integer && !Number.isInteger(n)) return bad("כאן צריך מספר שלם, בלי נקודה עשרונית");
  if (o.min != null && n < o.min) return bad(`הערך נמוך מדי (מינימום ${fmtNum(o.min)})`);
  if (o.max != null && n > o.max) return bad(`הערך גבוה מדי (מקסימום ${fmtNum(o.max)})`);
  return ok(n, o.warnAbove != null && n > o.warnAbove ? "הסכום נראה גבוה, כדאי לוודא שלא נוספה ספרה" : undefined);
}
export const fmtNum = (n: number) => new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 }).format(n);
export const fmtMoney = (n: number) => `${fmtNum(n)} ₪`;

// ---------------------------------------------------------------- dates
export interface YMD { y: number; m: number; d: number }
/** Accepts ISO (2020-05-17) and Israeli forms (17/05/2020, 17.5.2020, 17-05-20 is rejected: 4-digit year only). */
export function parseDate(input: string): YMD | null {
  const s = toAsciiDigits(String(input ?? "")).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  let y: number, mo: number, d: number;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else {
    m = /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/.exec(s);
    if (!m) return null;
    d = +m[1]; mo = +m[2]; y = +m[3];
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}
export const toIso = ({ y, m, d }: YMD) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const fromIso = (iso: string): YMD | null => parseDate(iso);
export const formatDateHe = (iso: string) => { const p = parseDate(iso); return p ? `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}` : iso; };
function todayYMD(now: Date): YMD { return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }; }
const cmp = (a: YMD, b: YMD) => a.y - b.y || a.m - b.m || a.d - b.d;

export interface DateOpts {
  allowFuture?: boolean;
  futureOnly?: boolean;
  now?: Date;
  /** inclusive age bounds in full years, for birth dates */
  minAge?: number;
  maxAge?: number;
  /** the date must be on/after this ISO date */
  notBefore?: string;
}
export function validateDate(input: string, o: DateOpts = {}): VResult {
  if (isBlank(input)) return bad(MSG.required);
  const p = parseDate(input);
  if (!p) return bad(MSG.date);
  const now = o.now ?? new Date();
  const t = todayYMD(now);
  if (p.y < 1900) return bad(MSG.date);
  if (o.futureOnly && cmp(p, t) < 0) return bad("התאריך הזה כבר עבר, כדאי לבחור תאריך עתידי");
  if (!o.allowFuture && !o.futureOnly && cmp(p, t) > 0) return bad("התאריך הזה עוד לא הגיע, כדאי לבדוק שוב");
  if (p.y > 2200) return bad(MSG.date);
  if (o.notBefore) {
    const nb = parseDate(o.notBefore);
    if (nb && cmp(p, nb) < 0) return bad("התאריך הזה מוקדם מהתאריך שקדם לו, כדאי לבדוק שוב");
  }
  if (o.minAge != null || o.maxAge != null) {
    const age = ageFromBirth(toIso(p), now);
    if (age === null) return bad(MSG.date);
    if (o.maxAge != null && age > o.maxAge) return bad("התאריך הזה רחוק מדי אחורה, כדאי לבדוק שוב");
    if (o.minAge != null && age < o.minAge) return bad(`נדרש גיל ${o.minAge} ומעלה`);
  }
  return ok(toIso(p));
}
/** Full years. Null when the date is invalid or in the future. No "insurance age". */
export function ageFromBirth(iso: string, now: Date = new Date()): number | null {
  const b = parseDate(iso);
  if (!b) return null;
  const t = todayYMD(now);
  if (cmp(b, t) > 0) return null;
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) age--;
  return age;
}
export const isAdult = (iso: string, now?: Date) => { const a = ageFromBirth(iso, now); return a !== null && a >= 18; };
/** Birth date plausibility: 0..120 years, not in the future. */
export function validateBirthDate(input: string, now?: Date): VResult {
  return validateDate(input, { minAge: 0, maxAge: 120, now });
}

// ---------------------------------------------------------------- body measures
export const RANGES = { heightCm: [40, 250], weightKg: [2, 400], bmiPlausible: [10, 70] } as const;
export function validateHeight(input: unknown): VResult<number> {
  const r = validateNumber(input, { min: RANGES.heightCm[0], max: RANGES.heightCm[1] });
  if (!r.ok) return { ...r, message: r.message?.includes("נמוך") || r.message?.includes("גבוה") ? "הגובה לא נראה סביר, כדאי לבדוק שוב (בסנטימטרים, למשל 172)" : r.message };
  return r;
}
export function validateWeight(input: unknown): VResult<number> {
  const r = validateNumber(input, { min: RANGES.weightKg[0], max: RANGES.weightKg[1] });
  if (!r.ok) return { ...r, message: r.message?.includes("נמוך") || r.message?.includes("גבוה") ? "המשקל לא נראה סביר, כדאי לבדוק שוב (בקילוגרמים, למשל 68)" : r.message };
  return r;
}
export type BmiBand = "under" | "normal" | "over" | "obese";
export interface BmiResult { value: number; band: BmiBand | null; warning?: string }
/** Weight / height^2 rounded to one decimal. Band only for adults (WHO bands). Out-of-range values warn, never block. The UI shows the number only. */
export function computeBmi(heightCm: number, weightKg: number, ageYears?: number | null): BmiResult | null {
  if (!(heightCm > 0) || !(weightKg > 0)) return null;
  const h = heightCm / 100;
  const value = Math.round((weightKg / (h * h)) * 10) / 10;
  const adult = ageYears == null ? true : ageYears >= 18;
  let band: BmiBand | null = null;
  if (adult) band = value < 18.5 ? "under" : value < 25 ? "normal" : value < 30 ? "over" : "obese";
  const warning = value < RANGES.bmiPlausible[0] || value > RANGES.bmiPlausible[1] ? "הנתונים נראים רחוקים מהרגיל, כדאי לבדוק שוב את הגובה והמשקל" : undefined;
  return { value, band, ...(warning ? { warning } : {}) };
}

// ---------------------------------------------------------------- text
export function validateText(input: string, o: { max?: number | null; required?: boolean; min?: number } = {}): VResult {
  const v = String(input ?? "").replace(/\s+$/g, "").replace(/^\s+/g, "");
  if (!v) return o.required === false ? ok("") : bad(MSG.required);
  if (o.min && v.length < o.min) return bad("הטקסט קצר מדי, כדאי להרחיב מעט");
  if (o.max && v.length > o.max) return bad(`הטקסט ארוך מדי (עד ${o.max} תווים, כרגע ${v.length})`);
  return ok(v);
}

// ---------------------------------------------------------------- cross-field checks
/** Spouse must not be the client themself. Both inputs are normalised before comparing. */
export function checkSpouseNotClient(clientId: string, spouseId: string): VResult<boolean> {
  const a = digitsOnly(clientId).padStart(9, "0");
  const b = digitsOnly(spouseId).padStart(9, "0");
  if (digitsOnly(clientId) && digitsOnly(spouseId) && a === b) return bad("מספר הזהות זהה לזה של הלקוח, כדאי לבדוק שוב");
  return ok(true);
}
/** A child must be born after the parent. */
export function checkChildAfterParent(parentBirthIso: string, childBirthIso: string): VResult<boolean> {
  const p = parseDate(parentBirthIso);
  const c = parseDate(childBirthIso);
  if (!p || !c) return ok(true);
  if (cmp(c, p) <= 0) return bad("תאריך הלידה של הילד/ה צריך להיות אחרי תאריך הלידה של ההורה");
  return ok(true);
}

// ---------------------------------------------------------------- dispatcher
export interface ValidateCtx {
  now?: Date;
  bank?: string;
  branch?: string;
  knownBanks?: ReadonlySet<string>;
  knownBranches?: ReadonlySet<string>;
}
export function validateByFormat(format: string | null | undefined, input: string, ctx: ValidateCtx = {}): VResult {
  switch (format) {
    case "israeli-id": return validateIsraeliId(input);
    case "phone": return validateIsraeliPhone(input);
    case "email": return validateEmail(input);
    case "passport": return validatePassport(input);
    case "person-name": return validatePersonName(input);
    case "digits": return digitsOnly(input) ? ok(digitsOnly(input)) : bad(MSG.generic);
    case "full-name": return validateFullName(input);
    case "bank-account": return validateAccountNumber(input);
    case "branch-code": return validateBranch(input, {});
    default: return ok(String(input ?? "").trim());
  }
}
