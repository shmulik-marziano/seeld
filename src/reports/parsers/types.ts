// Parser contracts. Real implementations (MaslakaXmlParser, HarBituachXlsxParser) and mock ones return the same shape.
import type { Loan, Person, Product } from "../types";

export interface ParseDiagnostics {
  filesRead: number;
  filesRejected: { name: string; reason: string }[];
  /** files skipped on purpose (macOS "._" junk, PDFs, non-data files) */
  filesSkipped: { name: string; reason: string }[];
  /** product versions replaced by a newer extraction */
  superseded: number;
  /** extraction comparison: replaced versions whose content changed, and products that exist only in an older run */
  previousRun: { replaced: number; changed: number; onlyInOlder: number };
  /** code values met in the file that no code table lists (tag name -> distinct values). Codes only, never free text. */
  unmappedCodes: Record<string, string[]>;
  /** code values that are recognised but whose meaning is not established (shown as "לא התקבל מידע") */
  noMeaningCodes: Record<string, Record<string, number>>;
  /** histogram of every coded value read (tag name -> value -> count). Codes only. */
  codeCounts: Record<string, Record<string, number>>;
  /** files that carry more than one client */
  twoPersonFiles: number;
  /** groups read into the model that no report block shows yet (name -> products having it) */
  groupsNotShown: Record<string, number>;
  /** Har Habituach row bookkeeping */
  rows: { products: number; continuation: number; duplicates: number; formulas: number; separators: number };
  warnings: string[];
}

export interface ParseResult {
  persons: Person[];
  products: Product[];
  loans: Loan[];
  /** ISO date of the newest extraction found */
  asOfDate: string | null;
  diagnostics: ParseDiagnostics;
}

export interface MaslakaFileInput { name: string; text: string }

export interface MaslakaParser {
  /** accepts the uniform-interface XML files of one request (several extraction runs and families are fine) */
  parse(files: MaslakaFileInput[]): ParseResult | Promise<ParseResult>;
}

export interface HarBituachParser {
  /** accepts the bytes of the .xlsx file downloaded from Har Habituach */
  parse(bytes: ArrayBuffer | Uint8Array, name?: string): Promise<ParseResult>;
}

export const emptyDiagnostics = (): ParseDiagnostics => ({
  filesRead: 0, filesRejected: [], filesSkipped: [], superseded: 0, previousRun: { replaced: 0, changed: 0, onlyInOlder: 0 },
  unmappedCodes: {}, noMeaningCodes: {}, codeCounts: {}, twoPersonFiles: 0, groupsNotShown: {},
  rows: { products: 0, continuation: 0, duplicates: 0, formulas: 0, separators: 0 }, warnings: [],
});

export function noteUnmapped(d: ParseDiagnostics, tag: string, value: string): void {
  if (!value) return;
  const list = (d.unmappedCodes[tag] ??= []);
  if (!list.includes(value)) list.push(value);
}

export function countCode(d: ParseDiagnostics, tag: string, value: string): void {
  if (!value) return;
  const m = (d.codeCounts[tag] ??= {});
  m[value] = (m[value] ?? 0) + 1;
}

export function noteNoMeaning(d: ParseDiagnostics, tag: string, value: string): void {
  const m = (d.noMeaningCodes[tag] ??= {});
  m[value] = (m[value] ?? 0) + 1;
}

/** Non-cryptographic opaque key, in-memory only. */
export function opaqueKey(raw: string): string {
  let h = 7;
  for (const c of raw) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `p_${h.toString(36)}`;
}
