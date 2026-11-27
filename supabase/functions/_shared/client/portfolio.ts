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
  /** the status code keeps the product (or its cover) alive: פעיל, ריסק זמני, שמירת כיסוי */
  active?: boolean;
  /** percent, as the fund reported it (fraction x 100); left out when implausible */
  ytd_return_pct?: number;
  fee_balance_pct?: number;
  fee_deposit_pct?: number;
  /** "YYYY-MM" of the latest deposit */
  last_deposit?: string;
  /** names of the live covers (coverTypeDescription), for the policy card */
  covers?: string[];
  /** one line per live cover type: its premium (summed over the insured, one frequency) and its sum insured when the
   *  insured share one amount. No insured name ever: the lines are by cover type only. */
  cover_lines?: CoverLine[];
  /** which protection tiles this live product proves (see PROTECTION_KEYS) */
  protects?: ProtectionKey[];
}

export interface CoverLine { name: string; premium?: number; premium_frequency?: string; amount?: number }
/** the generic cover rows carry the policy's own price: shown under a plain name, not dropped */
const COVER_NAME: Record<string, string> = { "פוליסה": "בסיס הפוליסה", "אחר": "כיסויים נוספים" };
const MAX_COVER_LINES = 8;

/** live covers grouped by type, in their first-seen order */
export function coverLines(liveCovers: Record<string, unknown>[]): CoverLine[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const c of liveCovers) {
    const raw = text(c.coverTypeDescription, 40);
    if (!raw) continue;
    const name = COVER_NAME[raw] ?? raw;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(c);
  }
  const out: CoverLine[] = [];
  for (const [name, list] of groups) {
    const line: CoverLine = { name };
    const priced = list.filter((c) => typeof c.premia === "number" && Number.isFinite(c.premia) && (c.premia as number) > 0);
    if (priced.length) {
      const freq = enumText(priced[0].premiaFrequency, 20);
      const same = priced.filter((c) => enumText(c.premiaFrequency, 20) === freq);
      line.premium = Math.round(same.reduce((n, c) => n + (c.premia as number), 0) * 100) / 100;
      if (freq) line.premium_frequency = freq;
    }
    const amounts = [...new Set(list.map((c) => c.insuranceAmount).filter((a): a is number => typeof a === "number" && Number.isFinite(a) && a > 0))];
    if (amounts.length === 1) line.amount = Math.round(amounts[0]);
    out.push(line);
  }
  return out.slice(0, MAX_COVER_LINES);
}

/** the protection tiles of the home screen; a tile is "exists" only when a live product proves it */
export const PROTECTION_KEYS = ["health", "nursing", "life", "disability", "accidents", "critical", "home", "car"] as const;
export type ProtectionKey = (typeof PROTECTION_KEYS)[number];
const PROTECT_BY_TYPE: Record<number, ProtectionKey> = {
  12: "health", 23: "health", 11: "nursing", 38: "nursing", 13: "life", 36: "life", 15: "disability", 22: "disability",
  32: "accidents", 33: "accidents", 21: "critical", 10: "home", 24: "home", 25: "home", 26: "home",
  9: "car", 28: "car", 29: "car", 30: "car", 31: "car",
};
const PROTECT_BOTH: Record<number, ProtectionKey[]> = { 17: ["life", "disability"], 39: ["life", "disability"] };
/** Surense coverType codes -> tile (live list 2026-11-27: 19 life, 11/10/15/55/12 health, 8 nursing, 17/21/34 accidents,
 *  18 critical illness, 35/23 disability) */
const PROTECT_BY_COVER: Record<number, ProtectionKey> = {
  19: "life", 11: "health", 10: "health", 15: "health", 55: "health", 12: "health", 8: "nursing",
  17: "accidents", 21: "accidents", 34: "accidents", 18: "critical", 35: "disability", 23: "disability",
};
/** a mortgage life policy covers the bank, not the family: it never lights the life tile */
const MORTGAGE_LIFE = 14;
const ACTIVE_CODES = new Set([1, 4, 7, 8]);
const ACTIVE_NAMES = new Set(["פעיל", "ריסק זמני", "ריסק זמני אוטומטי", "שמירת כיסוי ביטוחי"]);
const GENERIC_COVERS = new Set(["פוליסה", "אחר"]);

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

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
/** a Surense enum that arrives as a string or as {code, description, shortDescription} */
function enumText(v: unknown, max = 40): string | undefined {
  return text(v, max)?.replace(/_/g, " ") ?? text(obj(v).shortDescription, max) ?? text(obj(v).description, max);
}
const pct = (v: unknown, bound: number): number | undefined => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : undefined;
  return n !== undefined && Math.abs(n) <= bound ? Math.round(n * 10000) / 100 : undefined;
};
const MONTH = /^(\d{4})-(\d{2})/;

export function isActiveStatus(v: unknown): boolean {
  const c = obj(v).code;
  if (typeof c === "number") return ACTIVE_CODES.has(c);
  const t = enumText(v);
  return t !== undefined && ACTIVE_NAMES.has(t);
}

export function shapeProduct(p: MirrorProduct): ShapedProduct {
  const d = p.details ?? {};
  const type = typeof d.type === "number" ? d.type : typeof obj(d.type).code === "number" ? (obj(d.type).code as number) : p.product_type;
  const covers = Array.isArray(d.covers) ? (d.covers as Record<string, unknown>[]) : [];
  const cover0 = covers.find((c) => c && typeof c === "object") ?? {};
  const liveCovers = covers.filter((c) => c && typeof c === "object" && c.expired !== true);
  const tracks = Array.isArray(d.masluleiAshkaa) ? (d.masluleiAshkaa as Record<string, unknown>[]) : [];
  const track = tracks.length ? text(tracks[0]?.shemMaslul) ?? text(tracks[0]?.name) ?? text(tracks[0]?.maslul) : undefined;
  const out: ShapedProduct = {
    id: p.id,
    type_code: type,
    type_label: (type !== null && TYPE_LABEL[type]) || "מוצר",
    company_label: companyLabel(d, p.company_id),
    policy_number_masked: maskPolicyNumber(d.accountPolicyNumber),
    source: (p.source && SOURCE_CODE[p.source]) || "other",
    status: enumText(d.status) ?? null,
    active: isActiveStatus(d.status),
  };
  const plan = text(d.shemTohnit);
  if (plan) out.plan = plan;
  // live 2026-11-23: production-mode rows carry totalHonAccumulation / allowanceAccumulation, pre-advice rows accumulation*
  const balance = num(d.accumulation) ?? num(d.accumulationILS) ?? num(d.totalHonAccumulation) ?? num(d.allowanceAccumulation)
    ?? num(d.totalErkeiPidion) ?? num(d.honAccumulation) ?? num(d.customerChoiceAccumulation);
  if (balance !== undefined) out.balance = balance;
  const premium = num(d.totalMonthlyPremia) ?? num(d.totalPremia) ?? num(cover0.premia);
  if (premium !== undefined) out.premium = premium;
  const freq = enumText(d.totalPremiaFrequency, 20) ?? enumText(cover0.premiaFrequency, 20);
  if (freq) out.premium_frequency = freq;
  // fractions in the source (0.005 = 0.5%); a value outside the bound is a data error and is left out
  const ytd = pct(d.netReturnPercentStartYear, 0.5);
  if (ytd !== undefined) out.ytd_return_pct = ytd;
  const feeBal = pct(d.accumulationFee, 0.05);
  if (feeBal !== undefined) out.fee_balance_pct = feeBal;
  const feeDep = pct(d.depositFee, 0.1);
  if (feeDep !== undefined) out.fee_deposit_pct = feeDep;
  const deposits = Array.isArray(obj(d.lastDeposit).hafkadot) ? (obj(d.lastDeposit).hafkadot as unknown[]) : [];
  const months = deposits.map((h) => obj(h).month).filter((m): m is string => typeof m === "string" && MONTH.test(m))
    .map((m) => MONTH.exec(m)!.slice(1, 3).join("-")).sort();
  if (months.length) out.last_deposit = months[months.length - 1];
  const names = [...new Set(liveCovers.map((c) => text(c.coverTypeDescription, 40)).filter((x): x is string => !!x && !GENERIC_COVERS.has(x)))];
  if (names.length) out.covers = names.slice(0, 8);
  const lines = coverLines(liveCovers);
  if (lines.length) out.cover_lines = lines;
  if (out.active) {
    const prot = new Set<ProtectionKey>();
    if (type !== null && PROTECT_BY_TYPE[type]) prot.add(PROTECT_BY_TYPE[type]);
    if (type !== null && PROTECT_BOTH[type]) PROTECT_BOTH[type].forEach((k) => prot.add(k));
    if (type !== MORTGAGE_LIFE) {
      for (const c of liveCovers) {
        const k = PROTECT_BY_COVER[Number(c.coverType)];
        if (k) prot.add(k);
      }
    }
    if (prot.size) out.protects = PROTECTION_KEYS.filter((k) => prot.has(k));
  }
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
