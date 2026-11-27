// The general picture of the client area, computed from the portfolio the server already shapes (GET /portfolio). Pure: the
// same input gives the same picture. Only figures the data states are shown: sums of reported balances and premiums, the
// protections a live product proves, and at most three plain notices. No forecast, no profit, no advice.
import type { CategoryKey } from "./config";
import { PROTECTION_KEYS, type PortfolioCategory, type PortfolioProduct, type ProtectionKey } from "./api";

export const SAVINGS_KEYS: CategoryKey[] = ["pension", "hishtalmut", "gemel", "savings"];
export const INSURANCE_KEYS: CategoryKey[] = ["insurance_health", "insurance_life", "insurance_general"];
/** tiles that are always shown; home and car only when the client has one */
export const CORE_PROTECTIONS: ProtectionKey[] = ["health", "nursing", "life", "disability", "accidents", "critical"];
/** a policy that ends within this many days is a notice */
export const ENDING_DAYS = 60;

export type Frequency = "month" | "year" | "other";
export function frequencyOf(p: Pick<PortfolioProduct, "premium_frequency">): Frequency {
  const f = (p.premium_frequency ?? "").replace(/_/g, " ");
  if (f === "חודשית") return "month";
  if (f === "שנתית") return "year";
  return "other";
}

export interface SplitPart { key: CategoryKey; amount: number; pct: number }
/** a protection tile; `from` = the live products that prove it, dedicated policies first */
export interface Protection { key: ProtectionKey; exists: boolean; from: PortfolioProduct[] }
export type Notice =
  | { kind: "ending"; product: PortfolioProduct; days: number }
  | { kind: "inactive_empty"; count: number };
export interface Overview {
  hasData: boolean;
  savingsTotal: number;
  split: SplitPart[];
  savingsCount: number;
  savingsActive: number;
  monthlyPremium: number;
  yearlyPremium: number;
  policiesActive: number;
  policiesInactive: number;
  protections: Protection[];
  /** live savings products that carry insurance (a pension fund's disability and survivors cover, a managers' policy) */
  embedded: PortfolioProduct[];
  notices: Notice[];
}

const byKey = (cats: PortfolioCategory[], keys: CategoryKey[]) => cats.filter((c) => keys.includes(c.key)).flatMap((c) => c.products);
const isActive = (p: PortfolioProduct) => p.active !== false;
const dayMs = 24 * 3600 * 1000;

/** whole days from `today` (local midnight) to an ISO date; NaN when not a date */
export function daysUntil(iso: string, today: Date): number {
  const end = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - start.getTime()) / dayMs);
}

export function buildOverview(categories: PortfolioCategory[], today: Date): Overview {
  const savings = byKey(categories, SAVINGS_KEYS);
  const insurance = byKey(categories, INSURANCE_KEYS);
  const amount = (p: PortfolioProduct) => (typeof p.balance === "number" && p.balance > 0 ? p.balance : 0);
  const savingsTotal = savings.reduce((n, p) => n + amount(p), 0);
  const split = SAVINGS_KEYS.map((key) => ({ key, amount: byKey(categories, [key]).reduce((n, p) => n + amount(p), 0) }))
    .filter((x) => x.amount > 0)
    .map((x) => ({ ...x, pct: savingsTotal ? Math.round((x.amount / savingsTotal) * 100) : 0 }));
  const liveInsurance = insurance.filter(isActive);
  const premium = (f: Frequency) => liveInsurance.filter((p) => frequencyOf(p) === f && typeof p.premium === "number" && p.premium > 0)
    .reduce((n, p) => n + (p.premium as number), 0);
  const live = [...insurance, ...categories.filter((c) => !INSURANCE_KEYS.includes(c.key)).flatMap((c) => c.products)].filter(isActive);
  const from = new Map<ProtectionKey, PortfolioProduct[]>();
  for (const p of live) for (const k of p.protects ?? []) from.set(k, [...(from.get(k) ?? []), p]);
  // owner 2026-11-27: an active pension fund is never shown as short of the cover it usually carries
  const unclear = new Set<ProtectionKey>(live.flatMap((p) => p.protects_unclear ?? []));
  const protections = PROTECTION_KEYS
    .filter((k) => from.has(k) || (CORE_PROTECTIONS.includes(k) && !unclear.has(k)))
    .map((key) => ({ key, exists: from.has(key), from: from.get(key) ?? [] }));
  const embedded = savings.filter((p) => isActive(p) && (!!p.pension_cover || (p.cover_lines?.length ?? 0) > 0 || (p.protects_unclear?.length ?? 0) > 0));

  const notices: Notice[] = [];
  for (const p of byKey(categories, ["insurance_general"]).filter(isActive)) {
    if (!p.end) continue;
    const days = daysUntil(p.end, today);
    if (days >= 0 && days <= ENDING_DAYS) notices.push({ kind: "ending", product: p, days });
  }
  notices.sort((a, b) => (a.kind === "ending" && b.kind === "ending" ? a.days - b.days : 0));
  const inactiveEmpty = savings.filter((p) => !isActive(p) && amount(p) === 0).length;
  if (inactiveEmpty > 0) notices.push({ kind: "inactive_empty", count: inactiveEmpty });

  return {
    hasData: categories.some((c) => c.products.length > 0),
    savingsTotal,
    split,
    savingsCount: savings.length,
    savingsActive: savings.filter(isActive).length,
    monthlyPremium: premium("month"),
    yearlyPremium: premium("year"),
    policiesActive: liveInsurance.length,
    policiesInactive: insurance.length - liveInsurance.length,
    protections,
    embedded,
    notices: notices.slice(0, 3),
  };
}
