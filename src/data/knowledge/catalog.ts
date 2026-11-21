// Knowledge section: the catalog of guide pages (slugs, categories, source guide number).
// Dependency-free on purpose (see types.ts). Bodies live in ./guides/<slug>.ts and are
// lazy-loaded; registry titles/descriptions live in src/data/seo/routes.ts.
import type { GuideCategoryKey } from "./types";

export interface CatalogEntry {
  slug: string;
  category: GuideCategoryKey;
  /** Guide number in the source collection (01-30), or the chapter number of the tax series. */
  source: string;
  readMinutes: number;
}

export const GUIDES_BASE = "/learn/guides";
export const TAX_BASE = "/learn/pension-tax";

export const GUIDE_CATALOG: CatalogEntry[] = [
  // פנסיה לשכירים
  { slug: "pension-fund-what-you-buy", category: "pension-employees", source: "01", readMinutes: 4 },
  { slug: "employee-pension-contributions", category: "pension-employees", source: "02", readMinutes: 4 },
  { slug: "pension-start-new-job", category: "pension-employees", source: "03", readMinutes: 4 },
  { slug: "section-14-severance-deposits", category: "pension-employees", source: "04", readMinutes: 4 },
  { slug: "pension-deducted-missing-in-fund", category: "pension-employees", source: "05", readMinutes: 3 },
  { slug: "why-projected-pension-looks-low", category: "pension-employees", source: "06", readMinutes: 3 },
  // פנסיה לעצמאים
  { slug: "self-employed-mandatory-pension", category: "pension-self-employed", source: "07", readMinutes: 4 },
  { slug: "employee-and-self-employed-pension-top-up", category: "pension-self-employed", source: "08", readMinutes: 4 },
  { slug: "pension-tax-saving-deduction-vs-credit", category: "pension-self-employed", source: "09", readMinutes: 4 },
  { slug: "seasonal-business-pension", category: "pension-self-employed", source: "10", readMinutes: 3 },
  // קרנות השתלמות
  { slug: "training-fund-value-in-job-offer", category: "training-funds", source: "11", readMinutes: 3 },
  { slug: "self-employed-training-fund-two-ceilings", category: "training-funds", source: "12", readMinutes: 4 },
  { slug: "training-fund-partial-withdrawal", category: "training-funds", source: "13", readMinutes: 3 },
  { slug: "training-fund-tax-salary-and-business", category: "training-funds", source: "14", readMinutes: 4 },
  // תכנון פרישה
  { slug: "first-month-after-retirement-income", category: "retirement", source: "15", readMinutes: 4 },
  { slug: "form-161-before-severance-decision", category: "retirement", source: "16", readMinutes: 4 },
  { slug: "pension-tax-exemption-after-fixing-rights", category: "retirement", source: "17", readMinutes: 4 },
  { slug: "survivors-pension-vs-guaranteed-payments", category: "retirement", source: "18", readMinutes: 4 },
  { slug: "old-age-pension-while-working", category: "retirement", source: "19", readMinutes: 3 },
  { slug: "withdrawing-severance-between-jobs", category: "retirement", source: "20", readMinutes: 4 },
  // ניהול הון משפחתי
  { slug: "family-wealth-how-much-available", category: "family-wealth", source: "21", readMinutes: 4 },
  { slug: "cash-reserve-when-income-varies", category: "family-wealth", source: "22", readMinutes: 3 },
  { slug: "investment-provident-fund-ceiling-two-accounts", category: "family-wealth", source: "23", readMinutes: 4 },
  { slug: "deposit-or-money-market-fund-for-home", category: "family-wealth", source: "24", readMinutes: 4 },
  { slug: "savings-concentrated-same-stocks", category: "family-wealth", source: "25", readMinutes: 3 },
  { slug: "sequence-of-returns-retirement-withdrawals", category: "family-wealth", source: "26", readMinutes: 4 },
  // ביטוח למשפחה ולעסק
  { slug: "disability-pension-fund-or-private-insurance", category: "family-business-insurance", source: "27", readMinutes: 4 },
  { slug: "life-insurance-after-mortgage-paid", category: "family-business-insurance", source: "28", readMinutes: 3 },
  { slug: "two-health-policies-one-receipt", category: "family-business-insurance", source: "29", readMinutes: 3 },
  { slug: "critical-illness-diagnosis-payout", category: "family-business-insurance", source: "30", readMinutes: 3 },
];

/** Tax series chapters under TAX_BASE. "numbers" is the single figures table. */
export const TAX_CATALOG: CatalogEntry[] = [
  { slug: "three-tax-stations", category: "pension-tax", source: "ch1-2", readMinutes: 4 },
  { slug: "provident-funds", category: "pension-tax", source: "ch3", readMinutes: 4 },
  { slug: "training-funds", category: "pension-tax", source: "ch4", readMinutes: 4 },
  { slug: "managers-insurance", category: "pension-tax", source: "ch5", readMinutes: 4 },
  { slug: "pension-funds", category: "pension-tax", source: "ch6", readMinutes: 4 },
  { slug: "realization-fixing-rights-190", category: "pension-tax", source: "ch7", readMinutes: 5 },
  { slug: "numbers", category: "pension-tax", source: "ch8", readMinutes: 2 },
];

export const guidePath = (slug: string): string => `${GUIDES_BASE}/${slug}`;
export const taxPath = (slug: string): string => `${TAX_BASE}/${slug}`;
