// Reference data for pickers: cities, streets, banks, branches (static files in public/ref, see docs/product/REFERENCE-DATA.md).
// Files are fetched lazily and cached per session. Matching helpers are pure and unit tested.

export interface City { code: number; name: string; region?: string }
/** [streetCode, officialName, ...aliases] */
export type StreetRow = [number, string, ...string[]];
export interface Bank { code: number; name: string }
/** [bankCode, branchCode, branchName, city, address, type] */
export type BranchRow = [number, number, string, string, string, string];

export const HEALTH_FUNDS = ["כללית", "מכבי", "מאוחדת", "לאומית"] as const;

// ---------------------------------------------------------------- matching
/** Lowercases, strips niqqud, quotes/geresh/hyphens, folds final letters, collapses spaces. */
export function normalizeHe(s: string): string {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[֑-ׇ]/g, "")
    .replace(/["'׳״’‘`´״׳\-_.,()]/g, " ")
    .replace(/[ךםןףץ]/g, (c) => ({ ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" })[c] as string)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
export interface Ranked<T> { item: T; score: number; matched: string; exact: boolean }
/** Lower score = better. 0 exact, 1 prefix, 2 word-prefix, 3 substring, 10+d typo of distance d (<=2, only for queries >= 3 letters). */
export function fuzzyRank<T>(items: readonly T[], query: string, names: (item: T) => string[], limit = 8): Ranked<T>[] {
  const q = normalizeHe(query);
  if (!q) return [];
  const out: Ranked<T>[] = [];
  for (const item of items) {
    let best: { score: number; matched: string } | null = null;
    for (const raw of names(item)) {
      const n = normalizeHe(raw);
      let score = Infinity;
      if (n === q) score = 0;
      else if (n.startsWith(q)) score = 1;
      else if (n.split(" ").some((w) => w.startsWith(q))) score = 2;
      else if (n.includes(q)) score = 3;
      else if (q.length >= 3) {
        const d = Math.min(levenshtein(n, q), ...n.split(" ").map((w) => levenshtein(w, q)), levenshtein(n.slice(0, q.length + 1), q));
        if (d <= (q.length >= 6 ? 2 : 1)) score = 10 + d;
      }
      if (score !== Infinity && (!best || score < best.score)) best = { score, matched: raw };
    }
    if (best) out.push({ item, score: best.score, matched: best.matched, exact: best.score === 0 });
  }
  return out.sort((a, b) => a.score - b.score || String(names(a.item)[0]).localeCompare(String(names(b.item)[0]), "he")).slice(0, limit);
}
export const isTypoMatch = (r: Ranked<unknown>) => r.score >= 10;

export function searchCities(cities: readonly City[], q: string, limit = 8) {
  return fuzzyRank(cities, q, (c) => [c.name], limit);
}
export function findCityByName(cities: readonly City[], name: string): City | null {
  const n = normalizeHe(name);
  return cities.find((c) => normalizeHe(c.name) === n) ?? null;
}
/** Aliases resolve to the official name (first element). */
export function searchStreets(streets: readonly StreetRow[], q: string, limit = 8) {
  return fuzzyRank(streets, q, (s) => [s[1], ...s.slice(2).map(String)], limit);
}
export function officialStreetName(row: StreetRow): string {
  return row[1];
}
export function searchBanks(banks: readonly Bank[], q: string, limit = 20) {
  const digits = q.replace(/\D/g, "");
  if (digits) return banks.filter((b) => String(b.code).startsWith(String(Number(digits)))).map((item) => ({ item, score: 0, matched: item.name, exact: String(item.code) === String(Number(digits)) }));
  if (!q.trim()) return banks.map((item) => ({ item, score: 0, matched: item.name, exact: false }));
  return fuzzyRank(banks, q, (b) => [b.name], limit);
}
export function branchesOfBank(branches: readonly BranchRow[], bankCode: number): BranchRow[] {
  return branches.filter((b) => b[0] === bankCode);
}
export function searchBranches(rows: readonly BranchRow[], q: string, limit = 30) {
  const digits = q.replace(/\D/g, "");
  if (digits && !/[א-ת]/.test(q)) return rows.filter((r) => String(r[1]).startsWith(String(Number(digits)))).slice(0, limit).map((item) => ({ item, score: 0, matched: item[2], exact: String(item[1]) === String(Number(digits)) }));
  if (!q.trim()) return rows.slice(0, limit).map((item) => ({ item, score: 0, matched: item[2], exact: false }));
  return fuzzyRank(rows, q, (r) => [r[2], r[3], r[4]], limit);
}
/** Short, tidy bank name for the UI ("בנק הפועלים בע\"מ" -> "בנק הפועלים"). */
export function shortBankName(name: string): string {
  return name.replace(/\s*בע["״]מ\s*$/, "").trim();
}

// ---------------------------------------------------------------- loaders (browser only, cached, no retries storm)
const cache = new Map<string, Promise<unknown>>();
function load<T>(url: string): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`ref ${url} ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}
export const loadCities = () => load<City[]>("/ref/cities.json");
export const loadStreets = (cityCode: number) => load<StreetRow[]>(`/ref/streets/${cityCode}.json`);
export const loadBanks = () => load<Bank[]>("/ref/banks.json");
export const loadBranches = () => load<BranchRow[]>("/ref/branches.json");
