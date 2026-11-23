// Knowledge section: one pencil element per page (design pass 23.11.2026).
// Every guide, tax chapter and legacy article gets ONE unique drawing from the pencil kit: a spot
// (public/art/spot/<spot>.webp, drawn inside the reading column and floating on the hero stage) paired
// with a small kit icon (public/art/icons/<icon>.svg, the stamp next to the reading time). Within a
// category no two pages share a spot, so a reader who moves between neighbouring guides never meets
// the same drawing twice (src/test/knowledge-art.test.ts asserts it). The category also decides the
// paper of the reading band: tint and ruling motif (see src/components/sd/knowledge.css).
// Dependency-free on purpose (no "@/" imports): Node scripts may bundle the data folder.
import type { GuideCategoryKey } from "./types";

/** Spot names of public/art/spot (see src/components/sd/spots.ts). */
export type KnowledgeSpot =
  | "key-brass" | "olive-branch" | "shield-blue" | "heart-pink" | "coins-stacks" | "olive-sapling" | "olive-canopy"
  | "tea-hourglass" | "scroll-ribbon" | "stone-house" | "shield-navy" | "car-key" | "scales" | "briefcase" | "passport"
  | "compass" | "suitcase" | "magnifier" | "seal-check" | "pen" | "family-figures" | "pillows" | "plane-toy" | "sailboat"
  | "ribbon-pink" | "treasure-chest" | "olive-sapling-b";

/** Icon names of public/art/icons. */
export type KnowledgeIcon =
  | "bank" | "briefcase" | "car" | "chart" | "checklist" | "claim" | "client" | "coins" | "compass" | "dashboard"
  | "document" | "email" | "family" | "growth" | "handshake" | "heart" | "home" | "hourglass" | "key" | "lock"
  | "phone" | "plane" | "retirement" | "search" | "shield" | "support" | "umbrella" | "wallet";

/** Ruling motif of the reading paper: notebook rules, a dotted grid, graph squares, or a margin rule only. */
export type PaperMotif = "ruled" | "dots" | "grid" | "margin";

export interface KnowledgeArt {
  spot: KnowledgeSpot;
  icon: KnowledgeIcon;
}

/** Paper motif per category (the tint comes from the category's pastel). */
export const PAPER_BY_CATEGORY: Record<GuideCategoryKey, PaperMotif> = {
  "pension-employees": "ruled",
  "pension-self-employed": "dots",
  "training-funds": "grid",
  retirement: "margin",
  "family-wealth": "dots",
  "family-business-insurance": "ruled",
  "pension-tax": "grid",
};

/** Guide slug (collection and tax series) to its drawing. Hand-picked for meaning; unique spot within a category. */
export const ART_BY_SLUG: Record<string, KnowledgeArt> = {
  // פנסיה לשכירים
  "pension-fund-what-you-buy": { spot: "shield-navy", icon: "shield" },
  "employee-pension-contributions": { spot: "coins-stacks", icon: "coins" },
  "pension-start-new-job": { spot: "briefcase", icon: "briefcase" },
  "section-14-severance-deposits": { spot: "scroll-ribbon", icon: "document" },
  "pension-deducted-missing-in-fund": { spot: "magnifier", icon: "search" },
  "why-projected-pension-looks-low": { spot: "tea-hourglass", icon: "hourglass" },
  // פנסיה לעצמאים
  "self-employed-mandatory-pension": { spot: "pen", icon: "checklist" },
  "employee-and-self-employed-pension-top-up": { spot: "scales", icon: "chart" },
  "pension-tax-saving-deduction-vs-credit": { spot: "coins-stacks", icon: "wallet" },
  "seasonal-business-pension": { spot: "compass", icon: "growth" },
  // קרנות השתלמות
  "training-fund-value-in-job-offer": { spot: "briefcase", icon: "handshake" },
  "self-employed-training-fund-two-ceilings": { spot: "scales", icon: "bank" },
  "training-fund-partial-withdrawal": { spot: "treasure-chest", icon: "wallet" },
  "training-fund-tax-salary-and-business": { spot: "pen", icon: "document" },
  // תכנון פרישה
  "first-month-after-retirement-income": { spot: "tea-hourglass", icon: "retirement" },
  "form-161-before-severance-decision": { spot: "scroll-ribbon", icon: "document" },
  "pension-tax-exemption-after-fixing-rights": { spot: "scales", icon: "checklist" },
  "survivors-pension-vs-guaranteed-payments": { spot: "family-figures", icon: "family" },
  "old-age-pension-while-working": { spot: "olive-canopy", icon: "hourglass" },
  "withdrawing-severance-between-jobs": { spot: "compass", icon: "briefcase" },
  // ניהול הון משפחתי
  "family-wealth-how-much-available": { spot: "treasure-chest", icon: "wallet" },
  "cash-reserve-when-income-varies": { spot: "pillows", icon: "umbrella" },
  "investment-provident-fund-ceiling-two-accounts": { spot: "coins-stacks", icon: "coins" },
  "deposit-or-money-market-fund-for-home": { spot: "stone-house", icon: "home" },
  "savings-concentrated-same-stocks": { spot: "scales", icon: "chart" },
  "sequence-of-returns-retirement-withdrawals": { spot: "olive-sapling", icon: "growth" },
  // ביטוח למשפחה ולעסק
  "disability-pension-fund-or-private-insurance": { spot: "shield-blue", icon: "umbrella" },
  "life-insurance-after-mortgage-paid": { spot: "key-brass", icon: "key" },
  "two-health-policies-one-receipt": { spot: "heart-pink", icon: "heart" },
  "critical-illness-diagnosis-payout": { spot: "coins-stacks", icon: "claim" },
  // מיסוי החיסכון הפנסיוני
  "three-tax-stations": { spot: "compass", icon: "compass" },
  "provident-funds": { spot: "coins-stacks", icon: "coins" },
  "training-funds": { spot: "pen", icon: "bank" },
  "managers-insurance": { spot: "shield-navy", icon: "shield" },
  "pension-funds": { spot: "olive-sapling", icon: "retirement" },
  "realization-fixing-rights-190": { spot: "key-brass", icon: "checklist" },
  numbers: { spot: "scales", icon: "chart" },
};

const FALLBACK: KnowledgeArt = { spot: "pen", icon: "document" };

/** Drawing of a knowledge page by slug (a slug outside the map gets the neutral pen). */
export const artForSlug = (slug: string): KnowledgeArt => ART_BY_SLUG[slug] ?? FALLBACK;

/* ---- legacy /article pages: deterministic by id, unique within the article's category ---- */

/** Pool for the legacy articles, in a fixed order; a category walks it from a hashed offset. */
const ARTICLE_POOL: KnowledgeArt[] = [
  { spot: "coins-stacks", icon: "coins" }, { spot: "heart-pink", icon: "heart" }, { spot: "shield-navy", icon: "shield" },
  { spot: "car-key", icon: "car" }, { spot: "stone-house", icon: "home" }, { spot: "treasure-chest", icon: "wallet" },
  { spot: "family-figures", icon: "family" }, { spot: "olive-sapling", icon: "growth" }, { spot: "compass", icon: "compass" },
  { spot: "magnifier", icon: "search" }, { spot: "scales", icon: "chart" }, { spot: "key-brass", icon: "key" },
  { spot: "tea-hourglass", icon: "hourglass" }, { spot: "pillows", icon: "umbrella" }, { spot: "passport", icon: "document" },
  { spot: "scroll-ribbon", icon: "document" }, { spot: "briefcase", icon: "briefcase" }, { spot: "sailboat", icon: "growth" },
];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Topical first choice for a legacy article by its category text, then the pool from a category-hashed offset. */
const ARTICLE_PREF: readonly (readonly [RegExp, number])[] = [
  [/בריאות|רפוא/, 1], [/חיים|משפחה/, 6], [/רכב/, 3], [/דירה|בית|משכנתא/, 4], [/תקציב|הוצאות/, 5],
  [/השקע|גמל|השתלמות/, 7], [/חיסכון/, 0], [/ביטוח/, 2],
];

/**
 * Drawing of a legacy article: `ids` are every article id of the same category (any order). The first article of
 * the category gets the topical spot; the others continue along the pool, so no two of them share a drawing.
 */
export function artForArticle(id: string, category: string, ids: readonly string[]): KnowledgeArt {
  const sorted = [...ids].sort();
  const n = Math.max(0, sorted.indexOf(id));
  const pref = ARTICLE_PREF.find(([re]) => re.test(category))?.[1] ?? hash(category) % ARTICLE_POOL.length;
  return ARTICLE_POOL[(pref + n) % ARTICLE_POOL.length];
}
