// Block registry: every block of the full report, which modes carry it, what fields it contains,
// and the rule that decides whether it is shown or locked. The structure is identical for every tier;
// only the unlocked set differs (visitor < client < agent).
import type { BlockState, Entitlements, LockReason, ReportData, ReportMode } from "./types";

export interface BlockDef {
  id: string;
  title: string;
  modes: ReportMode[];
  /** fields the block would contain (shown in the locked card) */
  fields: string[];
  /** plain explanation of why the block can be empty (shown in the locked card) */
  why: Record<LockReason, string>;
  /** entitlement that must be on before the block may be shown at all */
  gate?: "viewDeposits";
  /** reason used when the data simply is not in the files */
  absent: LockReason;
  available: (d: ReportData) => boolean;
  /** counted in the "X of Y parts shown" indicator */
  counted?: boolean;
}

const savings = (d: ReportData) => d.products.filter((p) => p.kind !== "insurance");
const insurance = (d: ReportData) => d.products.filter((p) => p.kind === "insurance");
const hasSavings = (d: ReportData) => savings(d).length > 0;
const hasInsurance = (d: ReportData) => insurance(d).length > 0;

export const WHY: Record<LockReason, string> = {
  needs_policy_copy: "הנתון הזה מופיע בהעתק הפוליסה שבידי המבטח, ולא בקבצים הציבוריים. אחרי שנקבל העתקי פוליסה אפשר להשלים אותו.",
  needs_information_order: "הנתון הזה נמצא אצל הגוף המנהל (המבטח או בית ההשקעות) ולא בקובץ הר הביטוח או במסלקה. אפשר להשלים אותו בהזמנת מידע.",
  needs_client_authorisation: "הנתון הזה מוצג רק ללקוחות שחתמו על אישור צפייה במידע. האישור מאפשר צפייה בלבד, ואינו מינוי סוכן.",
  not_in_source_files: "הנתון הזה אינו מופיע בקבצים הציבוריים, ובינתיים אין לנו מקור אחר אליו.",
};

const all: ReportMode[] = ["insurance", "financial", "unified"];
const fin: ReportMode[] = ["financial", "unified"];
const ins: ReportMode[] = ["insurance", "unified"];

export const BLOCKS: BlockDef[] = [
  { id: "cover", title: "שער הדוח", modes: all, fields: [], why: WHY, absent: "not_in_source_files", available: () => true },
  { id: "letter", title: "מכתב פתיחה", modes: all, fields: [], why: WHY, absent: "not_in_source_files", available: () => true },
  { id: "found", title: "מה מצאנו", modes: all, counted: true, fields: ["מספר מוצרי חיסכון", "מספר פוליסות ביטוח", "מקור הנתונים ותאריכו"], why: WHY, absent: "not_in_source_files", available: (d) => d.products.length > 0 },
  // ---- financial
  { id: "summary-dashboard", title: "תמונת מצב: סך החיסכון והפרמיה החודשית", modes: fin, counted: true,
    fields: ["סך החיסכון הצבור", "תשואה מתחילת השנה", "סך הפרמיה החודשית (חיים ובריאות)"], why: WHY, absent: "not_in_source_files", available: (d) => d.products.length > 0 },
  { id: "donut-type", title: "פילוח לפי סוג מוצר", modes: fin, counted: true, fields: ["קרן פנסיה", "קופת גמל", "קרן השתלמות", "גמל להשקעה"], why: WHY, absent: "not_in_source_files", available: (d) => hasSavings(d) },
  { id: "donut-manufacturer", title: "פילוח לפי יצרן", modes: fin, counted: true, fields: ["שם היצרן", "יתרה", "אחוז מכלל החיסכון"], why: WHY, absent: "not_in_source_files", available: (d) => hasSavings(d) },
  { id: "donut-liquidity", title: "נזילות: נכסים סחירים ולא סחירים", modes: fin, counted: true, fields: ["נכסים סחירים", "נכסים לא סחירים"], why: WHY, absent: "needs_information_order",
    available: () => false },
  { id: "donut-exposure", title: "חשיפה: מניות, חו\"ל ומט\"ח", modes: fin, counted: true, fields: ["חשיפה למניות", "חשיפה לחו\"ל", "חשיפה למט\"ח"], why: WHY, absent: "needs_information_order",
    available: () => false },
  { id: "investment-mix", title: "תמהיל ההשקעה", modes: fin, counted: true, fields: ["מניות ואגרות חוב סחירות", "אג\"ח מיועדות", "הלוואות", "נכסים אחרים"], why: WHY, absent: "needs_information_order",
    available: () => false },
  { id: "capital-by-type", title: "סך ההון מהחיסכון לפי סוג", modes: fin, counted: true, fields: ["תגמולי עובד", "תגמולי מעסיק", "פיצויים", "אחר", "סך הכל"], why: WHY, absent: "not_in_source_files",
    available: (d) => savings(d).some((p) => p.balance !== null) },
  { id: "deposits-monthly", title: "הפקדות חודשיות לפי סוג", modes: fin, counted: true, gate: "viewDeposits", fields: ["הפקדת עובד", "הפקדת מעסיק", "פיצויים", "סך הפקדה חודשית"],
    why: WHY, absent: "not_in_source_files", available: (d) => savings(d).some((p) => p.deposits.length > 0) },
  { id: "projected-no-deposits", title: "קצבה צפויה בפרישה, ללא הפקדות עתידיות", modes: fin, counted: true, fields: ["הון צפוי לגיל פרישה", "קצבה חודשית צפויה"], why: WHY, absent: "not_in_source_files",
    available: (d) => savings(d).some((p) => p.projectedCapitalNoDeposits !== null || p.projectedPensionMonthlyNoDeposits !== null) },
  { id: "projected-with-deposits", title: "קצבה צפויה בפרישה, כולל הפקדות עתידיות", modes: fin, counted: true, gate: "viewDeposits", fields: ["הון צפוי עם הפקדות", "קצבה חודשית צפויה עם הפקדות"],
    why: WHY, absent: "not_in_source_files", available: (d) => savings(d).some((p) => p.projectedCapitalWithDeposits !== null || p.projectedPensionMonthlyWithDeposits !== null) },
  { id: "loans", title: "הלוואות", modes: fin, counted: true, fields: ["תאריך קבלה", "סכום", "מוצר", "ריבית", "החזר חודשי", "יתרת סגירה", "תאריך סיום"], why: WHY, absent: "not_in_source_files",
    available: (d) => d.sources.maslaka },
  { id: "products-table", title: "טבלת המוצרים", modes: fin, counted: true, fields: ["יתרה", "דמי ניהול מהפקדה", "דמי ניהול מהצבירה", "סטטוס", "קצבה צפויה"], why: WHY, absent: "not_in_source_files", available: (d) => hasSavings(d) },
  { id: "employment-salary", title: "מעסיק, שכר והפקדה אחרונה", modes: fin, counted: true, gate: "viewDeposits", fields: ["שם המעסיק", "שכר מדווח", "מועד ההפקדה האחרונה", "הפקדה שוטפת"],
    why: WHY, absent: "not_in_source_files", available: (d) => savings(d).some((p) => p.employer !== null || p.salary !== null) },
  { id: "product-tracks", title: "מסלולי השקעה בכל מוצר", modes: fin, counted: true, fields: ["שם המסלול", "יתרה במסלול", "אחוז הפקדה", "עלות שנתית"], why: WHY, absent: "not_in_source_files",
    available: (d) => savings(d).some((p) => p.tracks.length > 0) },
  { id: "product-returns", title: "תשואות המסלולים: חודש, מתחילת שנה, 12 חודשים, 3 ו-5 שנים", modes: fin, counted: true,
    fields: ["תשואה בחודש האחרון", "מתחילת השנה", "12 חודשים", "ממוצע 3 שנים", "ממוצע 5 שנים"], why: WHY, absent: "needs_information_order",
    available: (d) => savings(d).some((p) => p.tracks.some((t) => t.return3yAvgPct !== null || t.return5yAvgPct !== null || t.return12mPct !== null)) },
  { id: "product-breakdown", title: "פירוט היתרה: תגמולים ופיצויים", modes: fin, counted: true, fields: ["תגמולי עובד", "תגמולי מעסיק", "פיצויים"], why: WHY, absent: "not_in_source_files",
    available: (d) => savings(d).some((p) => p.balanceSplit.employee !== null || p.balanceSplit.employer !== null || p.balanceSplit.severance !== null) },
  { id: "product-deposits", title: "12 ההפקדות האחרונות בכל מוצר", modes: fin, counted: true, gate: "viewDeposits", fields: ["חודש", "הפקדת עובד", "הפקדת מעסיק", "פיצויים", "שכר"],
    why: WHY, absent: "not_in_source_files", available: (d) => savings(d).some((p) => p.deposits.length > 0) },
  // ---- insurance
  { id: "premium-summary", title: "סך הפרמיה החודשית", modes: ["insurance"], counted: true, fields: ["פרמיה חודשית כוללת", "חיים", "בריאות"], why: WHY, absent: "not_in_source_files",
    available: (d) => insurance(d).some((p) => p.monthlyPremium !== null) },
  { id: "coverage-cards", title: "כרטיס כיסויים לכל אדם", modes: ins, counted: true, fields: ["תשעת סוגי הכיסוי", "קיים או לא התקבל מידע", "מוצרי האדם"], why: WHY, absent: "not_in_source_files", available: (d) => hasInsurance(d) },
  { id: "coverage-amounts", title: "סכומי הכיסוי (נכות, שאירים, מוות)", modes: ins, counted: true, fields: ["סכום פיצוי חד פעמי", "קצבה חודשית", "מבוטח ומוטב"], why: WHY, absent: "needs_policy_copy",
    available: (d) => insurance(d).some((p) => p.coverages.some((c) => c.amount !== null || c.monthlyBenefit !== null)) },
  { id: "policy-details", title: "פירוט הפוליסות: כיסויים לפי מבוטח, סכומים ופרמיות", modes: ins, counted: true, fields: ["מספר פוליסה", "פרמיה", "סטטוס", "תאריך הצטרפות", "כיסויים ופרמיות לכל מבוטח"], why: WHY, absent: "needs_policy_copy",
    available: (d) => insurance(d).some((p) => p.joinDate !== null && p.coverages.length > 0) },
];

export const COVERAGE_TITLES: Record<string, string> = {
  disability: "אובדן כושר עבודה", survivors: "קצבת שאירים", death: "סכום למקרה מוות", nursing: "ביטוח סיעודי", health: "ביטוח בריאות",
  mortgageLife: "ביטוח חיים משכנתא", personalAccidents: "תאונות אישיות", criticalIllness: "מחלות קשות", accidentDisability: "נכות מתאונה",
};

export function blockDef(id: string): BlockDef | undefined {
  return BLOCKS.find((b) => b.id === id);
}

function stateFor(b: BlockDef, d: ReportData, tier: Entitlements): { status: "shown" | "locked"; reason: LockReason | null } {
  if (b.gate && !tier[b.gate]) return { status: "locked", reason: "needs_client_authorisation" };
  if (!b.available(d)) return { status: "locked", reason: b.absent };
  return { status: "shown", reason: null };
}

/** Same structure for every tier; only the unlocked set differs. */
export function resolveBlocks(mode: ReportMode, d: ReportData, e: Entitlements, clientView: Entitlements = { tier: "visitor", viewDeposits: false }): { blocks: BlockState[]; coverage: { shown: number; total: number } } {
  const defs = BLOCKS.filter((b) => b.modes.includes(mode));
  const blocks: BlockState[] = defs.map((b) => {
    const own = stateFor(b, d, e);
    const forClient = e.tier === "agent" ? stateFor(b, d, clientView) : own;
    return { id: b.id, status: own.status, reason: own.reason, lockedForClient: e.tier === "agent" && forClient.status === "locked" };
  });
  const counted = defs.filter((b) => b.counted);
  const shown = counted.filter((b) => blocks.find((s) => s.id === b.id)?.status === "shown").length;
  return { blocks, coverage: { shown, total: counted.length } };
}
