// Formatters: he-IL, ₪ with thousands separators, masked ids. Pure.
const NBSP = " ";
const nf0 = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("he-IL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const NO_INFO = "לא התקבל מידע";

/** 1234567.4 -> "1,234,567 ₪". null/NaN -> "לא התקבל מידע". */
export function formatCurrency(v: number | null | undefined, fallback = NO_INFO): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return fallback;
  return `${nf0.format(Math.round(v))}${NBSP}₪`;
}

export function formatNumber(v: number | null | undefined, fallback = NO_INFO): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return fallback;
  return nf0.format(Math.round(v));
}

/** Percent value that is already in percent units (4.5 -> "4.5%"). */
export function formatPercent(v: number | null | undefined, digits: 1 | 2 = 1, fallback = NO_INFO): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return fallback;
  return `${(digits === 1 ? nf1 : nf2).format(v)}%`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO yyyy-mm-dd (or yyyymmdd) -> dd/mm/yyyy. Unparseable -> fallback. */
export function formatDate(iso: string | null | undefined, fallback = NO_INFO): string {
  const d = toIsoDate(iso);
  if (!d) return fallback;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function formatMonth(ym: string | null | undefined, fallback = NO_INFO): string {
  if (!ym || !/^\d{4}-\d{2}/.test(ym)) return fallback;
  return `${ym.slice(5, 7)}/${ym.slice(0, 4)}`;
}

/** Accepts yyyy-mm-dd, yyyymmdd, yyyymmddhhmmss, dd/mm/yyyy. Returns yyyy-mm-dd or null. */
export function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) m = /^(\d{4})(\d{2})(\d{2})(?:\d{0,6})$/.exec(s);
  if (m) return valid(+m[1], +m[2], +m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : null;
  const dm = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(s);
  if (dm) return valid(+dm[3], +dm[2], +dm[1]) ? `${dm[3]}-${pad(+dm[2])}-${pad(+dm[1])}` : null;
  return null;
}
function valid(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  return true;
}

/** Keeps the last three digits only. Never returns the full number. */
export function maskId(id: string | null | undefined): string {
  const digits = String(id ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "***-**-***";
  return `***-**-${digits.slice(-3)}`;
}

/** Policy number: keep the last 4 characters visible. */
export function maskPolicy(p: string | null | undefined): string {
  const s = String(p ?? "").trim();
  if (!s) return NO_INFO;
  if (s.length <= 4) return s;
  return `${"•".repeat(Math.min(6, s.length - 4))}${s.slice(-4)}`;
}

/**
 * Largest-remainder rounding: integer percents that sum to exactly 100 (when total > 0).
 * Used by the donuts so the labels never add up to 99 or 101.
 */
export function percentsSumTo100(values: number[]): number[] {
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (Math.max(0, v) / total) * 100);
  const floor = raw.map(Math.floor);
  let rest = 100 - floor.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f);
  for (const { i } of order) {
    if (rest <= 0) break;
    floor[i] += 1;
    rest -= 1;
  }
  return floor;
}
