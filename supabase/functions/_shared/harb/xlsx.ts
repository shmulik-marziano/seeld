// Har HaBituach export (.xlsx) check for the client path (docs/product/CLIENT-AREA.md, Har HaBituach). The file the
// client downloads from harb.cma.gov.il ("יצוא לאקסל") is one sheet: a title row, the column header row (A = "תעודת
// זהות", then branch, product type, company, period, details, premium, premium type, policy number, plan class), then
// one row per policy with the holder's national id as a NUMBER in column A; empty column-A rows may sit between them.
// The tags may carry a namespace prefix (`x:row`, `x:c`): the export writes them that way, Excel's re-save does not.
// Rules (the same as the verified manual path, skill har-habituach-loader step 5):
//   - a real xlsx: ZIP magic, size cap, [Content_Types].xml + xl/workbook.xml, 1..maxSheets sheets, row cap;
//   - in column A, before the first id row, up to maxPreambleRows text cells (title, header) are allowed;
//   - every other non-empty column-A value is a national id (5..9 digits, normalised to 9 with leading zeros);
//   - at least one id row (an export without policies is "empty": nothing to load), and exactly ONE distinct id.
// Whether that id is the signed-in client's is decided by the database (hmac compare, api.client_harb_add).
// Values never leave this module except the one normalised id for that compare; errors carry a code only.
import { DEFAULT_ZIP_LIMITS, listZip, readEntry, ZipError, type ZipLimits } from "./zip.ts";

export type HarbFileCode = "not_xlsx" | "too_large" | "too_many_sheets" | "too_many_rows" | "bad_layout" | "empty" | "id_mismatch" | "bad_file";

export class HarbFileError extends Error {
  readonly code: HarbFileCode;
  constructor(code: HarbFileCode) {
    super(code);
    this.name = "HarbFileError";
    this.code = code;
  }
}

export interface HarbLimits {
  /** the uploaded file (an export is ~15 KB) */
  maxBytes: number;
  maxSheets: number;
  /** rows over all sheets */
  maxRows: number;
  /** text cells in column A before the first id row, per sheet (title + header) */
  maxPreambleRows: number;
  maxSharedStrings: number;
  zip: ZipLimits;
}

export const HARB_LIMITS: HarbLimits = {
  maxBytes: 2 * 1024 * 1024,
  maxSheets: 10,
  maxRows: 5000,
  maxPreambleRows: 10,
  maxSharedStrings: 50_000,
  // an export is ~15 entries inflating to well under 1 MB: tighter than the ZIP defaults
  zip: { ...DEFAULT_ZIP_LIMITS, maxEntries: 100, maxEntryBytes: 4 * 1024 * 1024, maxTotalBytes: 12 * 1024 * 1024 },
};

export interface HarbFileSummary {
  /** the one national id of column A, 9 digits */
  nationalId: string;
  /** id rows (policies) */
  rows: number;
  sheets: number;
}

/** "012345678", "12345678", 12345678 (number cell), "1.2345678E7", "12-345678 " -> "012345678"; null when not an id */
export function normalizeHarbId(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, "");
  if (/^\d{5,9}$/.test(s)) return s.padStart(9, "0");
  if (/^\d{5,9}\.0+$/.test(s)) return s.split(".")[0].padStart(9, "0");
  if (/^\d(\.\d+)?[eE]\+?\d{1,2}$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n) && n >= 10_000 && n <= 999_999_999) return String(n).padStart(9, "0");
  }
  return null;
}

const ENTITY = /&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos);/g;
function xmlText(s: string): string {
  return s.replace(ENTITY, (_m, g: string) => {
    if (g === "amp") return "&";
    if (g === "lt") return "<";
    if (g === "gt") return ">";
    if (g === "quot") return '"';
    if (g === "apos") return "'";
    const cp = g.startsWith("#x") ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
  });
}

const T_RE = /<(?:[A-Za-z][\w.-]*:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[A-Za-z][\w.-]*:)?t>)/g;
const SI_RE = /<(?:[A-Za-z][\w.-]*:)?si\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[A-Za-z][\w.-]*:)?si>)/g;
const ROW_RE = /<(?:[A-Za-z][\w.-]*:)?row\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[A-Za-z][\w.-]*:)?row>)/g;
const CELL_RE = /<(?:[A-Za-z][\w.-]*:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[A-Za-z][\w.-]*:)?c>)/g;
const V_RE = /<(?:[A-Za-z][\w.-]*:)?v\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z][\w.-]*:)?v>/;
const IS_RE = /<(?:[A-Za-z][\w.-]*:)?is\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z][\w.-]*:)?is>/;
const SHEET_TAG_RE = /<(?:[A-Za-z][\w.-]*:)?sheet\b/g;

/** the text runs of an <si> / <is> body (phonetic runs <rPh> left out) */
function runs(body: string): string {
  const clean = body.replace(/<(?:[A-Za-z][\w.-]*:)?rPh\b[\s\S]*?<\/(?:[A-Za-z][\w.-]*:)?rPh>/g, "");
  let out = "";
  for (const m of clean.matchAll(T_RE)) out += xmlText(m[1] ?? "");
  return out;
}

function attr(attrs: string, name: string): string | null {
  const m = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs);
  return m ? m[1] : null;
}

const dec = new TextDecoder("utf-8", { fatal: false });

/** pure parse of the xlsx parts into column-A values per sheet (exported for the tests) */
export function columnA(sheetXml: string, shared: string[]): string[] {
  const out: string[] = [];
  for (const row of sheetXml.matchAll(ROW_RE)) {
    const body = row[1] ?? "";
    let value = "";
    let pos = 0;
    for (const c of body.matchAll(CELL_RE)) {
      const attrs = c[1] ?? "";
      const ref = attr(attrs, "r");
      const isA = ref ? /^A\d+$/.test(ref) : pos === 0;
      pos++;
      if (!isA) continue;
      const inner = c[2] ?? "";
      const t = attr(attrs, "t") ?? "n";
      if (t === "inlineStr") value = runs(IS_RE.exec(inner)?.[1] ?? "");
      else {
        const v = xmlText(V_RE.exec(inner)?.[1] ?? "");
        value = t === "s" ? (/^\d{1,7}$/.test(v) ? shared[Number(v)] ?? "" : "") : v;
      }
      break;
    }
    out.push(value.trim());
  }
  return out;
}

/** Checks one Har HaBituach export. Throws HarbFileError (code only); returns the one id of column A and counts. */
export async function inspectHarbXlsx(bytes: Uint8Array, limits: HarbLimits = HARB_LIMITS): Promise<HarbFileSummary> {
  if (bytes.byteLength > limits.maxBytes) throw new HarbFileError("too_large");
  if (bytes.byteLength < 100) throw new HarbFileError("not_xlsx");
  try {
    const entries = listZip(bytes, limits.zip);
    const byName = new Map(entries.map((e) => [e.name, e]));
    const types = byName.get("[Content_Types].xml");
    const book = byName.get("xl/workbook.xml");
    if (!types || !book) throw new HarbFileError("not_xlsx");
    const typesXml = dec.decode(await readEntry(bytes, types, limits.zip));
    if (!typesXml.includes("spreadsheetml")) throw new HarbFileError("not_xlsx");
    const bookXml = dec.decode(await readEntry(bytes, book, limits.zip));
    const declared = (bookXml.match(SHEET_TAG_RE) ?? []).length;
    const sheetEntries = entries
      .filter((e) => /^xl\/worksheets\/[A-Za-z0-9_-]{1,40}\.xml$/.test(e.name))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    if (declared === 0 || sheetEntries.length === 0) throw new HarbFileError("not_xlsx");
    if (declared > limits.maxSheets || sheetEntries.length > limits.maxSheets) throw new HarbFileError("too_many_sheets");

    const sharedEntry = byName.get("xl/sharedStrings.xml");
    const shared: string[] = [];
    if (sharedEntry) {
      const xml = dec.decode(await readEntry(bytes, sharedEntry, limits.zip));
      for (const m of xml.matchAll(SI_RE)) {
        if (shared.length >= limits.maxSharedStrings) throw new HarbFileError("too_large");
        shared.push(runs(m[1] ?? ""));
      }
    }

    const ids = new Set<string>();
    let rows = 0;
    let total = 0;
    for (const e of sheetEntries) {
      const values = columnA(dec.decode(await readEntry(bytes, e, limits.zip)), shared);
      total += values.length;
      if (total > limits.maxRows) throw new HarbFileError("too_many_rows");
      let seenId = false;
      let preamble = 0;
      for (const v of values) {
        if (!v) continue;
        const id = normalizeHarbId(v);
        if (id) {
          ids.add(id);
          rows++;
          seenId = true;
        } else if (seenId || ++preamble > limits.maxPreambleRows) {
          throw new HarbFileError("bad_layout");
        }
      }
    }
    if (rows === 0) throw new HarbFileError("empty");
    if (ids.size !== 1) throw new HarbFileError("id_mismatch");
    return { nationalId: [...ids][0], rows, sheets: sheetEntries.length };
  } catch (e) {
    if (e instanceof HarbFileError) throw e;
    if (e instanceof ZipError) {
      throw new HarbFileError(e.code === "zip_too_large" ? "too_large" : e.code === "zip_corrupt" ? "bad_file" : "not_xlsx");
    }
    throw new HarbFileError("bad_file");
  }
}
