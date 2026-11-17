// Value sets of the Har Habituach export, taken from src/reports/reference/harbituach-dictionary.json
// (1,876 real files: 9 main branches, 51 secondary branches, 23 product types, 15 companies, 3 premium types, 3 plan classes).
// Classification uses these exact values; Hebrew keyword guessing is only the last fallback. Mappings are INFERRED (not an official list).
import type { InsuranceType } from "../types";
import { insuranceTypeFromText } from "./codes";

export const MAIN_BRANCH: Record<string, InsuranceType> = {
  [`ביטוח בריאות`]: "health", [`ביטוח רכב`]: "vehicle", [`ביטוח חיים`]: "life", [`ביטוח דירה`]: "home", [`ביטוח סיעודי`]: "nursing",
  [`כתב שירות`]: "serviceLetter", [`אבדן כושר עבודה`]: "disability", [`ביטוח עסק`]: "business",
};

/** Secondary branch overrides where the branch is more specific than the main branch (others fall back to the main branch). */
export const SECONDARY_BRANCH: Record<string, InsuranceType> = {
  [`ביטוח חיים למקרה מוות`]: "life", [`ביטוח חיים חיסכון טהור`]: "life", [`ביטוח חיים משולב בחיסכון`]: "life",
  [`מוות מתאונה`]: "personalAccidents", [`תאונות אישיות`]: "personalAccidents", [`מחלות קשות`]: "criticalIllness",
  [`אבדן כושר עבודה`]: "disability", [`אבדן כושר עבודה שחרור`]: "disability", [`אבדן כושר עבודה שחרור ופיצוי`]: "disability",
  [`סיעודי עד 3 חודשים`]: "nursing", [`סיעודי - המתנה של 37-60 חודשים`]: "nursing",
  [`רכב חובה`]: "vehicle", [`ביטוח צד ג`]: "vehicle", [`מקיף ללא גניבה`]: "vehicle",
  [`ביטוח מבנה`]: "home", [`ביטוח מבנה ותכולה`]: "home", [`ביטוח תכולה`]: "home", [`מקיף לבית עסק`]: "business",
};

/** Product-type values that name a coverage; "פוליסת ביטוח" and "אחר" say nothing and are skipped. */
export const PRODUCT_TYPE: Record<string, InsuranceType> = {
  [`תאונות אישיות`]: "personalAccidents", [`מחלות קשות`]: "criticalIllness", [`אבדן כושר עבודה`]: "disability",
  [`תרופות - בסיס`]: "health", [`השתלות`]: "health", [`ניתוחים בחו"ל`]: "health", [`ייעוץ ובדיקות`]: "health",
  [`ניתוחים עם פיצוי על פנייה לציבורי/שב"ן`]: "health", [`ניתוחים אחידה`]: "health",
};

export const PREMIUM_TYPES = [`חודשית`, `שנתית`, `חד פעמית`] as const;
export const PLAN_CLASS: Record<string, "personal" | "group" | "group-hmo"> = { [`אישי`]: "personal", [`קבוצתי`]: "group", [`קבוצתי קופת חולים`]: "group-hmo" };

export const KNOWN_MAIN = new Set(Object.keys(MAIN_BRANCH));
export const KNOWN_SECONDARY = new Set([
  ...Object.keys(SECONDARY_BRANCH),
  `ביטוח מקיף`, `חבילת כיסויים`, `השתלות`, `תרופות - בסיס`, `ייעוץ ובדיקות`, `ניתוחים בחו"ל`, `כתב שירות אבחון מהיר`, `תרופות - הרחבה`, `ניתוחים בחו"ל-אחידה`,
  `תרופות מחוץ לסל-אחידה`, `שיניים`, `השתלות-אחידה`, `נכויות`, `ניתוחים - אחר`, `תרופות - בסיס + הרחבה`, `טיפולים וטכנולוגיות מתקדמות ואביזרים רפואיים`,
  `אחר`, `ניתוחים אחידה - משלים שב"ן`, `ניתוחים אחידה`, `כתב שירות רפואה משלימה`, `ניתוחים עם השתתפות עצמית`, `כתב שירות ליווי בעת מחלה`,
  `נספח טיפולים מחליפי ניתוח`, `כתב שירות ניהול רפואי אישי`, `אמבולטורי אחר`, `ליווי וטיפולים אגב אירוע רפואי`, `כתב שירות רפואת ספורט`,
  `כתב שירות רופא און ליין`, `ניתוחים עם פיצוי על פנייה לציבורי/שב"ן`, `ניתוחים אחידה משלים שב"ן עם השתתפות עצמית`, `כתב שירות ליווי אשפוז`,
  `ייעוץ, אבחון רפואי ובדיקות`, `ניתוחים משלים שב"ן`,
]);

export interface HarClassification { type: InsuranceType; basis: "har-dictionary" | "plan-name" | "unknown"; unknownValues: string[] }

/** Classify one Har Habituach row from the exact value sets; unknown values are returned so the caller can count them. */
export function classifyHarRow(main: string, secondary: string, productType: string, domain: string): HarClassification {
  const unknown: string[] = [];
  if (main && !KNOWN_MAIN.has(main)) unknown.push(`ענף ראשי: ${main}`);
  if (secondary && !KNOWN_SECONDARY.has(secondary)) unknown.push(`ענף משני: ${secondary}`);
  const byProduct = PRODUCT_TYPE[productType];
  if (byProduct) return { type: byProduct, basis: "har-dictionary", unknownValues: unknown };
  if (/^כתב שירות/.test(productType) || /^כתב שירות/.test(secondary)) return { type: "serviceLetter", basis: "har-dictionary", unknownValues: unknown };
  const bySecondary = SECONDARY_BRANCH[secondary];
  if (bySecondary) return { type: bySecondary, basis: "har-dictionary", unknownValues: unknown };
  const byMain = MAIN_BRANCH[main];
  if (byMain) return { type: byMain, basis: "har-dictionary", unknownValues: unknown };
  const guess = insuranceTypeFromText(main, secondary, productType, domain);
  return { type: guess, basis: guess === "other" ? "unknown" : "plan-name", unknownValues: unknown };
}
