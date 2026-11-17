// HarBituachXlsxParser: the .xlsx the client downloads from Har Habituach (sheet 'תיק ביטוחי').
// Real layout (1,876 files): row 1 empty, row 2 a merged title cell with the production date in column F, row 3 empty, row 4 headers
// (11 columns, 12 in some files with an unnamed extra column), then product rows grouped under 'תחום - ...' rows.
// Quirks handled: continuation rows (premium notes), summary rows with formulas as text, duplicate rows, a second person (';' cells),
// periods that are not dates ('מתחדש', 'לכל החיים'), policy numbers with dashes, three premium types, three plan classes.
// Client-side and in-memory. SheetJS ("xlsx", already a shared lazy chunk) is loaded on first use.
import { maskId, toIsoDate } from "../format";
import type { Person, Product } from "../types";
import { cleanText, isMacJunk, shortManufacturer } from "./codes";
import { PLAN_CLASS, classifyHarRow } from "./harDictionary";
import { emptyDiagnostics, noteUnmapped, opaqueKey, type HarBituachParser, type ParseResult } from "./types";

type Row = string[];

const COL = {
  id: "תעודת זהות", branch: "ענף ראשי", branch2: "ענף (משני)", product: "סוג מוצר", company: "חברה", period: "תקופת ביטוח",
  extra: "פרטים נוספים", premium: 'פרמיה בש"ח', premiumKind: "סוג פרמיה", policy: "מספר פוליסה", plan: "סיווג תכנית",
} as const;

const parseAmount = (s: string): number | null => {
  const v = Number(s.replace(/[,\s₪]/g, ""));
  return s !== "" && Number.isFinite(v) ? v : null;
};
const DATE_RE = /\d{1,2}[/.]\d{1,2}[/.]\d{4}/g;

/** Pure row logic, separated from the xlsx reader so it is testable without a workbook. */
export function parseHarBituachRows(rows: Row[]): ParseResult {
  const diag = emptyDiagnostics();
  diag.filesRead = 1;
  const persons = new Map<string, Person>();
  const products: Product[] = [];

  let produced: string | null = null;
  let headerIdx = -1;
  for (let i = 0; i < rows.length && headerIdx < 0; i++) {
    const r = rows[i].map(cleanText);
    if (r.includes(COL.product) && r.includes(COL.company)) headerIdx = i;
    else produced = r.map((c) => toIsoDate(c)).find(Boolean) ?? produced;
  }
  if (headerIdx < 0) {
    diag.filesRejected.push({ name: "(קובץ הר הביטוח)", reason: "לא נמצאה שורת כותרות (סוג מוצר, חברה). כנראה זה לא קובץ אקסל של הר הביטוח." });
    diag.filesRead = 0;
    return { persons: [], products: [], loans: [], asOfDate: produced, diagnostics: diag };
  }
  const header = rows[headerIdx].map(cleanText);
  const at = (r: Row, name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? cleanText(String(r[i] ?? "")) : "";
  };

  let domain = "";
  let currentId = "";
  let n = 0;
  const seen = new Set<string>();
  for (const raw of rows.slice(headerIdx + 1)) {
    const cells = raw.map((c) => cleanText(String(c ?? "")));
    const filled = cells.filter(Boolean);
    if (filled.length === 0) continue;
    // summary rows typed by hand: a formula kept as text
    if (cells.some((c) => c.startsWith("="))) { diag.rows.formulas += 1; continue; }
    const dm = filled.length <= 2 ? /^תחום\s*[-–]\s*(.+)$/.exec(filled[0]) : null;
    if (dm) { domain = dm[1].trim(); continue; }
    const productName = at(raw, COL.product);
    const company = at(raw, COL.company);
    let idRaw = at(raw, COL.id);
    // a cell holding only ';' separates two persons; "id;id" keeps the first
    if (/^[;,\s]+$/.test(idRaw) && !productName && !company) { diag.rows.separators += 1; continue; }
    if (idRaw.includes(";")) idRaw = idRaw.split(";").map((x) => x.trim()).find(Boolean) ?? "";
    // continuation row: no id and only details / premium filled (a premium note of the previous product)
    if (!idRaw && !productName && !company && !at(raw, COL.policy)) { diag.rows.continuation += 1; continue; }
    if (!productName && !company) continue;
    const dupKey = cells.join("\u0001");
    if (seen.has(dupKey)) { diag.rows.duplicates += 1; continue; }
    seen.add(dupKey);
    n += 1;

    if (idRaw) currentId = idRaw;
    const key = opaqueKey(currentId || "har-anonymous");
    if (!persons.has(key)) {
      persons.set(key, { key, displayName: persons.size === 0 ? "מבוטח" : "מבוטח נוסף", idMasked: maskId(currentId), role: persons.size === 0 ? "self" : "other", birthYear: null });
    }

    const cls = classifyHarRow(at(raw, COL.branch), at(raw, COL.branch2), productName, domain);
    for (const u of cls.unknownValues) noteUnmapped(diag, "har", u);

    const periodText = at(raw, COL.period);
    const dates = (periodText.match(DATE_RE) ?? []).map((d) => toIsoDate(d)).filter((d): d is string => !!d);
    const term = /מתחדש/.test(periodText) ? "renewing" : /לכל החיים/.test(periodText) ? "lifelong" : null;
    const premium = parseAmount(at(raw, COL.premium));
    const pk = at(raw, COL.premiumKind);
    const annual = /שנת/.test(pk);
    const oneTime = /חד\s*פעמ/.test(pk);
    const policyClean = at(raw, COL.policy).replace(/[-\s]+$/g, "");
    const end = dates.length > 1 ? dates[dates.length - 1] : null;
    const asOf = produced;
    const classText = at(raw, COL.plan);
    products.push({
      id: `HAR-${n}-${opaqueKey(`${policyClean}|${productName}|${company}|${currentId}`).slice(2)}`,
      ownerKey: key,
      kind: "insurance",
      insuranceType: cls.type,
      manufacturer: shortManufacturer(company) || "לא התקבל שם חברה",
      planName: productName && productName !== "פוליסת ביטוח" ? productName : at(raw, COL.branch2) || productName || "לא התקבל שם מוצר",
      policyNumber: policyClean || null,
      status: end && asOf && end < asOf ? "inactive" : "active",
      joinDate: dates[0] ?? null,
      endDate: end,
      asOfDate: asOf,
      sources: ["har"],
      balance: null,
      balanceSplit: { employee: null, employer: null, severance: null, other: null },
      projectedPensionMonthlyNoDeposits: null, projectedPensionMonthlyWithDeposits: null, projectedCapitalNoDeposits: null, projectedCapitalWithDeposits: null,
      feeFromDepositPct: null, feeFromBalancePct: null, returnPct: null, tracks: [],
      employer: null, salary: null, salaryDate: null, lastDepositDate: null, currentMonthlyDeposit: null, deposits: [],
      monthlyPremium: premium === null || oneTime ? null : annual ? premium / 12 : premium,
      premiumKind: premium === null ? "unknown" : oneTime ? "one-time" : annual ? "annual-converted" : /חודש/.test(pk) ? "monthly" : "unknown",
      typeBasis: cls.basis,
      term,
      planClass: PLAN_CLASS[classText] ?? null,
      extras: { feeBenefits: [], collection: null, hasClaim: null, severance: null, hasProxy: null },
      coverages: [],
      fromOlderExtraction: false,
    });
  }
  diag.rows.products = products.length;
  if (products.length === 0) diag.warnings.push("הקובץ נקרא, אבל לא נמצאו בו מוצרי ביטוח.");
  return { persons: [...persons.values()], products, loans: [], asOfDate: produced, diagnostics: diag };
}

export class HarBituachXlsxParser implements HarBituachParser {
  async parse(bytes: ArrayBuffer | Uint8Array, name?: string): Promise<ParseResult> {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const fail = (reason: string): ParseResult => {
      const d = emptyDiagnostics();
      d.filesRejected.push({ name: "(קובץ הר הביטוח)", reason });
      return { persons: [], products: [], loans: [], asOfDate: null, diagnostics: d };
    };
    if (name && isMacJunk(name)) {
      const d = emptyDiagnostics();
      d.filesSkipped.push({ name: "(קובץ מערכת)", reason: "קובץ מערכת של macOS (שמתחיל ב-._), דילגנו עליו. אפשר להעלות את הקובץ המקורי." });
      return { persons: [], products: [], loans: [], asOfDate: null, diagnostics: d };
    }
    // xlsx is a zip: it must start with "PK". AppleDouble files start with 00 05 16 07.
    if (u8.length < 4 || u8[0] !== 0x50 || u8[1] !== 0x4b) return fail("הקובץ אינו קובץ אקסל תקין (xlsx). אם זה קובץ שמתחיל ב-._, זה קובץ מערכת של macOS.");
    try {
      const mod = await import("xlsx");
      const XLSX = (mod as unknown as { default?: typeof mod }).default ?? mod;
      const wb = XLSX.read(u8, { type: "array", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, raw: false, defval: "" });
      return parseHarBituachRows(rows);
    } catch {
      return fail("לא הצלחנו לפתוח את קובץ האקסל.");
    }
  }
}
