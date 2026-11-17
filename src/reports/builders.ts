// Pure builders: normalised data + entitlements -> Report. No I/O, no randomness, no dates read from the clock.
import { resolveBlocks } from "./blocks";
import { percentsSumTo100 } from "./format";
import {
  ENTITLEMENTS,
  type CoverageKind,
  type Entitlements,
  type InsuranceType,
  type PersonCoverageCard,
  type Product,
  type ProductKind,
  type Report,
  type ReportData,
  type ReportMode,
  type Slice,
} from "./types";

export const KIND_LABEL: Record<ProductKind, string> = {
  pension: "קרן פנסיה",
  provident: "קופת גמל",
  training: "קרן השתלמות",
  investment: "גמל להשקעה",
  childInvestment: "גמל להשקעה לילד",
  managers: "ביטוח מנהלים",
  insurance: "ביטוח",
  unknown: "לא התקבל מידע",
};

export const INSURANCE_LABEL: Record<InsuranceType, string> = {
  life: "ביטוח חיים",
  mortgageLife: "ביטוח חיים למשכנתא",
  health: "ביטוח בריאות",
  nursing: "ביטוח סיעודי",
  personalAccidents: "תאונות אישיות",
  criticalIllness: "מחלות קשות",
  disability: "אובדן כושר עבודה",
  accidentDisability: "נכות מתאונה",
  vehicle: "ביטוח רכב",
  home: "ביטוח דירה",
  business: "ביטוח עסק",
  serviceLetter: "כתב שירות",
  other: "ביטוח אחר",
};

export const COVERAGE_ORDER: CoverageKind[] = [
  "disability", "survivors", "death", "nursing", "health", "mortgageLife", "personalAccidents", "criticalIllness", "accidentDisability",
];

/** which coverage tiles an insurance type lights up when no per-coverage rows exist (Har Habituach lists products, not covers) */
const TYPE_TO_COVERAGE: Partial<Record<InsuranceType, CoverageKind>> = {
  life: "death", mortgageLife: "mortgageLife", health: "health", nursing: "nursing",
  personalAccidents: "personalAccidents", criticalIllness: "criticalIllness", disability: "disability", accidentDisability: "accidentDisability",
};

const isSavings = (p: Product) => p.kind !== "insurance";
const isInsurance = (p: Product) => p.kind === "insurance";

/** Sum that stays null when nothing contributed (never turns "unknown" into 0). */
export function sumOrNull(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
}

export function toSlices(entries: { label: string; value: number }[]): Slice[] {
  const pos = entries.filter((e) => e.value > 0).sort((a, b) => b.value - a.value);
  const pcts = percentsSumTo100(pos.map((e) => e.value));
  return pos.map((e, i) => ({ label: e.label, value: e.value, pct: pcts[i] }));
}

function groupSum(products: Product[], key: (p: Product) => string): Slice[] {
  const m = new Map<string, number>();
  for (const p of products) if (p.balance !== null && p.balance > 0) m.set(key(p), (m.get(key(p)) ?? 0) + p.balance);
  return toSlices([...m].map(([label, value]) => ({ label, value })));
}

/** Balance-weighted return: only products that reported a return and a balance contribute. null when none. */
export function weightedReturn(products: Product[]): number | null {
  const withBoth = products.filter((p) => p.returnPct !== null && p.balance !== null && p.balance > 0);
  const base = withBoth.reduce((a, p) => a + (p.balance as number), 0);
  if (!withBoth.length || base <= 0) return null;
  return withBoth.reduce((a, p) => a + (p.returnPct as number) * (p.balance as number), 0) / base;
}

function personCards(data: ReportData): PersonCoverageCard[] {
  const ins = data.products.filter(isInsurance);
  return data.persons.map((person) => {
    const mine = ins.filter((p) => p.ownerKey === person.key);
    const covers = mine.flatMap((p) => p.coverages).filter((c) => c.insuredKey === person.key);
    const tiles = COVERAGE_ORDER.map((kind) => {
      const rows = covers.filter((c) => c.kind === kind);
      const amount = sumOrNull(rows.map((r) => r.amount));
      const monthlyBenefit = sumOrNull(rows.map((r) => r.monthlyBenefit));
      const byType = mine.some((p) => p.insuranceType && TYPE_TO_COVERAGE[p.insuranceType] === kind);
      const state: "exists" | "amount" | "none-received" = amount !== null || monthlyBenefit !== null ? "amount" : rows.length > 0 || byType ? "exists" : "none-received";
      return { kind, state, amount, monthlyBenefit };
    });
    return { person, premiumMonthly: sumOrNull(mine.map((p) => p.monthlyPremium)), tiles, products: mine };
  });
}

/** Groups that the parsers read into Product.extras but no block displays yet. */
export function notShownGroups(products: Product[]): string[] {
  const out: string[] = [];
  if (products.some((p) => p.extras.feeBenefits.length > 0)) out.push("הטבות בדמי ניהול");
  if (products.some((p) => p.extras.collection)) out.push("אופן הגבייה");
  if (products.some((p) => p.extras.hasClaim)) out.push("תביעות");
  if (products.some((p) => p.extras.severance)) out.push("שיעבוד וקיזוז פיצויים");
  if (products.some((p) => p.extras.hasProxy)) out.push("ייפוי כוח לביצוע פעולות");
  return out;
}

function build(mode: ReportMode, data: ReportData, entitlements: Entitlements, clientView?: Entitlements): Report {
  const d: ReportData = {
    ...data,
    products: data.products.filter((p) => (mode === "insurance" ? isInsurance(p) : mode === "financial" ? isSavings(p) : true)),
  };
  // Deposit history is dropped from the model itself when the tier may not see it: a locked block never carries numbers.
  const safe: ReportData = entitlements.viewDeposits
    ? d
    : { ...d, products: d.products.map((p) => ({ ...p, deposits: [], employer: null, salary: null, salaryDate: null, lastDepositDate: null, currentMonthlyDeposit: null, projectedCapitalWithDeposits: null, projectedPensionMonthlyWithDeposits: null })) };

  const sav = safe.products.filter(isSavings);
  const ins = safe.products.filter(isInsurance);
  const { blocks, coverage } = resolveBlocks(mode, safe, entitlements, clientView);

  const premLife = sumOrNull(ins.filter((p) => p.insuranceType === "life" || p.insuranceType === "mortgageLife").map((p) => p.monthlyPremium));
  const premHealth = sumOrNull(ins.filter((p) => p.insuranceType === "health" || p.insuranceType === "nursing" || p.insuranceType === "criticalIllness").map((p) => p.monthlyPremium));

  const split = (k: "employee" | "employer" | "severance" | "other") => sumOrNull(sav.map((p) => p.balanceSplit[k]));
  const capEmployee = split("employee");
  const capEmployer = split("employer");
  const capSev = split("severance");
  const capOther = split("other");

  const lastRows = sav.map((p) => p.deposits.slice().sort((a, b) => b.month.localeCompare(a.month))[0]).filter(Boolean);

  return {
    mode,
    data: safe,
    entitlements,
    blocks,
    coverage,
    summary: {
      totalSavings: sumOrNull(sav.map((p) => p.balance)),
      returnPct: weightedReturn(sav),
      premiumTotal: sumOrNull(ins.map((p) => p.monthlyPremium)),
      premiumLife: premLife,
      premiumHealth: premHealth,
      savingsCount: sav.length,
      insuranceCount: ins.length,
      olderExtractionCount: safe.products.filter((p) => p.fromOlderExtraction).length,
      unclassifiedCount: safe.products.filter((p) => p.kind === "unknown").length,
      unknownStatusCount: safe.products.filter((p) => p.status === "unknown").length,
      notShownGroups: notShownGroups(safe.products),
    },
    donuts: { byType: groupSum(sav, (p) => KIND_LABEL[p.kind]), byManufacturer: groupSum(sav, (p) => p.manufacturer) },
    capitalByType: { employee: capEmployee, employer: capEmployer, severance: capSev, other: capOther, total: sumOrNull(sav.map((p) => p.balance)) },
    depositsMonthlyByType: {
      employee: sumOrNull(lastRows.map((r) => r.employee)),
      employer: sumOrNull(lastRows.map((r) => r.employer)),
      severance: sumOrNull(lastRows.map((r) => r.severance)),
      total: sumOrNull(lastRows.flatMap((r) => [r.employee, r.employer, r.severance])),
    },
    projection: {
      noDeposits: { capital: sumOrNull(sav.map((p) => p.projectedCapitalNoDeposits)), pension: sumOrNull(sav.map((p) => p.projectedPensionMonthlyNoDeposits)) },
      withDeposits: { capital: sumOrNull(sav.map((p) => p.projectedCapitalWithDeposits)), pension: sumOrNull(sav.map((p) => p.projectedPensionMonthlyWithDeposits)) },
    },
    personCards: mode === "financial" ? [] : personCards(safe),
  };
}

export const buildInsuranceReport = (data: ReportData, e: Entitlements = ENTITLEMENTS.visitor, clientView?: Entitlements) => build("insurance", data, e, clientView);
export const buildFinancialReport = (data: ReportData, e: Entitlements = ENTITLEMENTS.visitor, clientView?: Entitlements) => build("financial", data, e, clientView);
export const buildUnifiedReport = (data: ReportData, e: Entitlements = ENTITLEMENTS.visitor, clientView?: Entitlements) => build("unified", data, e, clientView);

export function buildReport(mode: ReportMode, data: ReportData, e: Entitlements = ENTITLEMENTS.visitor, clientView?: Entitlements): Report {
  return build(mode, data, e, clientView);
}
