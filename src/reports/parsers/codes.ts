// Code tables of the uniform clearing-house interface (versions 008 and 009 share one schema).
// EVERY meaning below is INFERRED from plan names and structure across ~2,300 real files (docs/product/SOURCE-FILES-CATALOG.md);
// none comes from the Capital Market Authority's specification. A product whose type was decided by a code alone is
// flagged typeBasis "code" and the UI shows a "classification inferred" badge. Unknown codes degrade to "לא התקבל מידע".
import type { InsuranceType, ProductKind, ProductStatus } from "../types";

/** The three-letter family code is only a hint from the file name; the product type comes from SUG-MUTZAR inside the file. */
export type MaslakaFamily = string;

/** SUG-MUTZAR 1..10 (inferred). The value is a product kind; insurance rows also carry an insurance type. */
export const SUG_MUTZAR: Record<string, { kind: ProductKind; insuranceType?: InsuranceType; note: string }> = {
  "1": { kind: "managers", note: "ביטוח מנהלים (חיים עם חיסכון וקצבה)" },
  "2": { kind: "pension", note: "קרן פנסיה" },
  "3": { kind: "provident", note: "קופת גמל (תגמולים ופיצויים)" },
  "4": { kind: "training", note: "קרן השתלמות" },
  "5": { kind: "managers", note: "ביטוח מנהלים (נדיר)" },
  "6": { kind: "insurance", insuranceType: "life", note: "ביטוח חיים: ריסק, פיצוי ושחרור" },
  "7": { kind: "insurance", insuranceType: "mortgageLife", note: "ביטוח חיים למשכנתא או לפרעון הלוואה" },
  "8": { kind: "insurance", insuranceType: "life", note: "ריסק קולקטיבי / נכות מוחלטת ותמידית (נדיר)" },
  "9": { kind: "investment", note: "קופת גמל להשקעה" },
  "10": { kind: "childInvestment", note: "גמל להשקעה: חיסכון ארוך טווח לילד" },
};

/**
 * STATUS-POLISA-O-CHESHBON: 1 active, 2 inactive (inferred). 3,4,6,7,8,9,10 occur rarely (up to 10 times each) and their meaning
 * is not established: they are RECOGNISED (counted in the histogram, shown as "לא התקבל מידע"), never guessed.
 */
export const STATUS_POLISA: Record<string, ProductStatus> = { "1": "active", "2": "inactive" };
export const STATUS_RECOGNISED_NO_MEANING = new Set(["3", "4", "6", "7", "8", "9", "10"]);

export type Component = "employee" | "employer" | "severance" | "other";

/**
 * KOD-SUG-HAFRASHA (inferred). Pension funds: 1 employee, 2 employer, 3 severance. Provident / training / investment funds
 * report 4, 8, 9, 10, 12: 8 employee and 9 employer are inferred from the training-fund deposit pattern, 4, 10 and 12 stay "other".
 */
export const HAFRASHA_PENSION: Record<string, Component> = { "1": "employee", "2": "employer", "3": "severance" };
export const HAFRASHA_PROVIDENT: Record<string, Component> = { "8": "employee", "9": "employer", "4": "other", "10": "other", "12": "other" };

/** SUG-MAFKID (inferred): 1 employee, 2 employer, 3..6 other payers (not named). */
export const MAFKID: Record<string, Component> = { "1": "employee", "2": "employer", "3": "other", "4": "other", "5": "other", "6": "other" };

/** SUG-HOTZAA: 1 fee from accumulated balance, 2 fee from deposit, 0 none. Confirmed against the Maslaka summary .xls on one real client. */
export const HOTZAA: Record<string, "deposit" | "balance"> = { "1": "balance", "2": "deposit" };

/** Family hint from the file name: CONSLT<FAM> or _<FAM>_ (three capital letters), ignoring RLM marks and copy suffixes. Never decides the type. */
export function familyHintFromName(name: string): string | null {
  const clean = name.replace(/[‎‏‪-‮]/g, "");
  return /CONSLT([A-Z]{3})/.exec(clean)?.[1] ?? /_([A-Z]{3})_/.exec(clean)?.[1] ?? null;
}

/** macOS AppleDouble junk (`._name`): skipped with a friendly message. */
export function isMacJunk(name: string): boolean {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? name;
  return base.replace(/[‎‏‪-‮]/g, "").startsWith("._");
}

/** Hebrew keyword rules on plan names, first match wins (clearing-house insurance products). */
const INSURANCE_RULES: [RegExp, InsuranceType][] = [
  [/משכנתא|משכנתאות/, "mortgageLife"],
  [/סיעוד/, "nursing"],
  [/מחלות קשות|מחלה קשה/, "criticalIllness"],
  [/אובדן כושר|אבדן כושר|כושר עבודה/, "disability"],
  [/נכות מתאונה|נכות תאונתית/, "accidentDisability"],
  [/תאונות אישיות|תאונות/, "personalAccidents"],
  [/בריאות|ניתוחים|תרופות|השתלות|רפואי|רפואה/, "health"],
  [/חיים|מוות|ריסק|ריזיקו|סיכון|מגן/, "life"],
];

export function insuranceTypeFromText(...texts: (string | null | undefined)[]): InsuranceType {
  const t = texts.filter(Boolean).join(" ");
  for (const [re, type] of INSURANCE_RULES) if (re.test(t)) return type;
  return "other";
}

/** Plan-name keywords that identify a savings product kind (used to double check the SUG-MUTZAR code). */
export function savingsKindFromPlanName(plan: string): ProductKind | null {
  if (/השתלמות/.test(plan)) return "training";
  if (/לילד|לכל ילד/.test(plan) && /להשקעה|גמל|חסכון|חיסכון/.test(plan)) return "childInvestment";
  if (/להשקעה/.test(plan)) return "investment";
  if (/מנהלים/.test(plan)) return "managers";
  if (/פנסיה|פנסיונית/.test(plan)) return "pension";
  return null;
}

export interface KindDecision { kind: ProductKind; insuranceType: InsuranceType | null; basis: "plan-name" | "code" | "unknown"; code: string }

/** Decide the kind from the code; a clear plan-name keyword may refine savings kinds. Unknown code and no keyword = "unknown". */
export function decideKind(sugMutzar: string, plan: string): KindDecision {
  const byCode = SUG_MUTZAR[sugMutzar];
  const byName = savingsKindFromPlanName(plan);
  if (byCode) {
    if (byCode.kind === "insurance") {
      const t = insuranceTypeFromText(plan);
      return { kind: "insurance", insuranceType: t === "other" ? byCode.insuranceType ?? "other" : t, basis: t === "other" ? "code" : "plan-name", code: sugMutzar };
    }
    if (byName && byName !== byCode.kind) return { kind: byName, insuranceType: null, basis: "plan-name", code: sugMutzar };
    return { kind: byCode.kind, insuranceType: null, basis: byName === byCode.kind ? "plan-name" : "code", code: sugMutzar };
  }
  if (byName) return { kind: byName, insuranceType: null, basis: "plan-name", code: sugMutzar };
  return { kind: "unknown", insuranceType: null, basis: "unknown", code: sugMutzar };
}

/** Strip legal suffixes so donut labels stay short: 'הראל פנסיה וגמל בע"מ' -> 'הראל פנסיה וגמל'. */
export function shortManufacturer(name: string): string {
  return name.replace(/\s*בע["״'”]?מ\s*$/u, "").replace(/\s+/g, " ").trim();
}

/** Remove bidi marks and surrounding whitespace from a value. */
export const cleanText = (s: string): string => s.replace(/[‎‏‪-‮]/g, "").replace(/\s+/g, " ").trim();
