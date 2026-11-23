// The client's portfolio as the client area shows it: the mirrored Surense products (api.client_portfolio_get decrypts
// their details for one call) shaped into categories with Hebrew labels, masked policy numbers and a handful of figures.
// Pure: no I/O, no logging. Field names follow the Surense portfolio schema (C:\HQ\02_ידע\שורנס-API\openapi.json,
// POST /customers/{customerId}/portfolio): type 1..46, shemTohnit, accountPolicyNumber, status, accumulation*,
// totalPremia / totalMonthlyPremia / totalPremiaFrequency, covers[] {insuranceAmount, premia, insurancePeriodStart/End},
// subscriptionDate, policyEndDate, masluleiAshkaa[]. Nothing beyond these leaves this module.

export type CategoryKey = "pension" | "gemel" | "hishtalmut" | "insurance_life" | "insurance_health" | "insurance_general" | "savings" | "other";

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  pension: "פנסיה",
  gemel: "קופות גמל",
  hishtalmut: "קרנות השתלמות",
  insurance_life: "ביטוח חיים ואובדן כושר עבודה",
  insurance_health: "ביטוח בריאות וסיעוד",
  insurance_general: "ביטוח כללי",
  savings: "חיסכון והשקעות",
  other: "אחר",
};
export const CATEGORY_ORDER: CategoryKey[] = ["pension", "gemel", "hishtalmut", "insurance_life", "insurance_health", "insurance_general", "savings", "other"];

/** Surense product type (1..46) -> Hebrew label, letter for letter from the API description */
export const TYPE_LABEL: Record<number, string> = {
  1: "קרן פנסיה חדשה מקיפה", 2: "קרן פנסיה ותיקה", 3: "קופת גמל לתגמולים ופיצויים", 4: "קופת גמל להשקעה", 5: "חיסכון לכל ילד",
  6: "מנהלים חיסכון טהור", 7: "קרן השתלמות", 8: "ביטוח מנהלים", 9: "ביטוח רכב", 10: "ביטוח דירה", 11: "ביטוח סיעודי", 12: "ביטוח בריאות",
  13: "ביטוח חיים", 14: "ביטוח חיים משכנתא", 15: "אבדן כושר עבודה", 16: "כתב שירות", 17: "ביטוח חיים ואכ\"ע", 18: "ביטוח עסק",
  19: "קרן פנסיה חדשה כללית", 20: "ביטוח נסיעות לחו\"ל", 21: "ביטוח מחלות קשות", 22: "אבדן כושר עבודה קולקטיבי", 23: "ביטוח בריאות קולקטיבי",
  24: "ביטוח מבנה משכנתא", 25: "ביטוח דירה תכולה", 26: "ביטוח דירה מבנה ותכולה", 27: "מטריה ביטוחית", 28: "ביטוח רכב צד ג'", 29: "ביטוח רכב מקיף",
  30: "ביטוח רכב חובה וצד ג'", 31: "ביטוח רכב חובה ומקיף", 32: "ביטוח תאונות אישיות", 33: "ביטוח מוות מתאונה", 34: "ביטוח שיניים", 35: "ביטוח חיים נכות",
  36: "ביטוח חיים קולקטיבי", 37: "לא ידוע", 38: "ביטוח סיעודי קבוצתי", 39: "ביטוח חיים ואכ\"ע קבוצתי", 40: "איחוד קופות", 41: "פוליסת חיסכון פיננסי",
  42: "השקעות אלטרנטיביות", 43: "קופת גמל מרכזית לפיצויים", 44: "תיק מנוהל", 45: "ביטוח אחריות מקצועית", 46: "קופת גמל למטרות אחרות",
};

const CATEGORY_OF: Record<number, CategoryKey> = {
  1: "pension", 2: "pension", 19: "pension",
  3: "gemel", 4: "gemel", 5: "gemel", 40: "gemel", 43: "gemel", 46: "gemel",
  7: "hishtalmut",
  8: "insurance_life", 13: "insurance_life", 14: "insurance_life", 15: "insurance_life", 17: "insurance_life", 22: "insurance_life",
  33: "insurance_life", 35: "insurance_life", 36: "insurance_life", 39: "insurance_life",
  11: "insurance_health", 12: "insurance_health", 16: "insurance_health", 21: "insurance_health", 23: "insurance_health", 27: "insurance_health",
  32: "insurance_health", 34: "insurance_health", 38: "insurance_health",
  9: "insurance_general", 10: "insurance_general", 18: "insurance_general", 20: "insurance_general", 24: "insurance_general",
  25: "insurance_general", 26: "insurance_general", 28: "insurance_general", 29: "insurance_general", 30: "insurance_general",
  31: "insurance_general", 45: "insurance_general",
  6: "savings", 41: "savings", 42: "savings", 44: "savings",
};

export function categoryOf(type: number | null): CategoryKey {
  return (type !== null && CATEGORY_OF[type]) || "other";
}

/** Surense source enum -> short code for the UI */
const SOURCE_CODE: Record<string, string> = {
  "מסלקה_פנסיונית": "maslaka",
  "הר_הביטוח": "harbit",
  "פרודוקציה_פרט": "production",
  "הקמה_עצמית": "manual",
};

/** Company names by the insurer's registration number (companyIdNumber). Only the large insurers whose numbers are public
 *  and stable; anything else is labelled "חברה <id>" until the Surense company list is mirrored (TODO: /companies/search). */
const COMPANY_BY_REG: Record<number, string> = {
  520004078: "הראל",
  520004896: "מגדל",
  520024647: "כלל ביטוח",
  520023185: "הפניקס",
  520042540: "מנורה מבטחים",
  520042169: "איילון",
  520042177: "הכשרה",
};

export interface MirrorProduct {
  id: string;
  source: string | null;
  company_id: number | null;
  product_type: number | null;
  modified_at: string | null;
  details: Record<string, unknown>;
}

export interface ShapedProduct {
  id: string;
  type_code: number | null;
  type_label: string;
  company_label: string;
  policy_number_masked: string | null;
  source: string;
  status: string | null;
  plan?: string;
  balance?: number;
  premium?: number;
  premium_frequency?: string;
  coverage?: number;
  start?: string;
  end?: string;
  track?: string;
}

export interface ShapedCategory {
  key: CategoryKey;
  label: string;
  products: ShapedProduct[];
}

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) / 100 : undefined);
const text = (v: unknown, max = 80): string | undefined => (typeof v === "string" && v.trim() ? v.trim().replace(/[\r\n]/g, " ").slice(0, max) : undefined);
const DATE = /^(\d{4}-\d{2}-\d{2})/;
const date = (v: unknown): string | undefined => (typeof v === "string" && DATE.test(v) ? DATE.exec(v)![1] : undefined);

/** "123456789" -> "****6789"; shorter values are hidden entirely */
export function maskPolicyNumber(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  if (!s) return null;
  if (s.length <= 4) return "****";
  return "****" + s.slice(-4);
}

export function companyLabel(details: Record<string, unknown>, companyId: number | null): string {
  const name = text(details.companyName) ?? text(details.shemHevra);
  if (name) return name;
  const reg = typeof details.companyIdNumber === "number" ? details.companyIdNumber : null;
  if (reg !== null && COMPANY_BY_REG[reg]) return COMPANY_BY_REG[reg];
  return companyId !== null ? `חברה ${companyId}` : "חברה";
}

export function shapeProduct(p: MirrorProduct): ShapedProduct {
  const d = p.details ?? {};
  const type = typeof d.type === "number" ? d.type : p.product_type;
  const covers = Array.isArray(d.covers) ? (d.covers as Record<string, unknown>[]) : [];
  const cover0 = covers.find((c) => c && typeof c === "object") ?? {};
  const tracks = Array.isArray(d.masluleiAshkaa) ? (d.masluleiAshkaa as Record<string, unknown>[]) : [];
  const track = tracks.length ? text(tracks[0]?.shemMaslul) ?? text(tracks[0]?.name) ?? text(tracks[0]?.maslul) : undefined;
  const out: ShapedProduct = {
    id: p.id,
    type_code: type,
    type_label: (type !== null && TYPE_LABEL[type]) || "מוצר",
    company_label: companyLabel(d, p.company_id),
    policy_number_masked: maskPolicyNumber(d.accountPolicyNumber),
    source: (p.source && SOURCE_CODE[p.source]) || "other",
    status: text(d.status, 40) ?? null,
  };
  const plan = text(d.shemTohnit);
  if (plan) out.plan = plan;
  const balance = num(d.accumulation) ?? num(d.totalErkeiPidion) ?? num(d.honAccumulation) ?? num(d.customerChoiceAccumulation);
  if (balance !== undefined) out.balance = balance;
  const premium = num(d.totalMonthlyPremia) ?? num(d.totalPremia) ?? num(cover0.premia);
  if (premium !== undefined) out.premium = premium;
  const freq = text(d.totalPremiaFrequency, 20) ?? text(cover0.premiaFrequency, 20);
  if (freq) out.premium_frequency = freq;
  const coverage = num(d.shumBituahLeMikreMavet) ?? num(cover0.insuranceAmount);
  if (coverage !== undefined) out.coverage = coverage;
  const start = date(d.subscriptionDate) ?? date(d.initialSubscriptionDate) ?? date(cover0.insurancePeriodStart);
  if (start) out.start = start;
  const end = date(d.policyEndDate) ?? date(cover0.insurancePeriodEnd);
  if (end) out.end = end;
  if (track) out.track = track;
  return out;
}

export function shapePortfolio(products: MirrorProduct[]): ShapedCategory[] {
  const by = new Map<CategoryKey, ShapedProduct[]>();
  for (const p of products) {
    const shaped = shapeProduct(p);
    const key = categoryOf(shaped.type_code);
    if (!by.has(key)) by.set(key, []);
    by.get(key)!.push(shaped);
  }
  return CATEGORY_ORDER.filter((k) => by.has(k)).map((k) => ({ key: k, label: CATEGORY_LABEL[k], products: by.get(k)! }));
}

export function summarize(categories: ShapedCategory[]): { products: number; categories: { key: CategoryKey; label: string; count: number }[] } {
  return {
    products: categories.reduce((n, c) => n + c.products.length, 0),
    categories: categories.map((c) => ({ key: c.key, label: c.label, count: c.products.length })),
  };
}

/** Hebrew titles of the POA wizard documents (the same wording the wizard shows) */
export const POA_DOC_TITLE: Record<string, string> = {
  maslaka: "ייפוי כוח למסלקה הפנסיונית",
  harbit: "הרשאה להר הביטוח",
  policies: "ייפוי כוח להעתקי פוליסות",
};
