// Parser entry points + assembly of the two sources into one ReportData.
// MockHarBituachParser / MockMaslakaParser are FIXTURE implementations that ignore their input and return synthetic data
// (used by the "צפייה בדוח לדוגמה" button). The real parsers are MaslakaXmlParser and HarBituachXlsxParser.
import { SYNTHETIC_FAMILY, SYNTHETIC_SINGLE } from "../fixtures/synthetic";
import type { Person, Product, ReportData } from "../types";
import { HarBituachXlsxParser } from "./harBituach";
import { MaslakaXmlParser } from "./maslaka";
import { emptyDiagnostics, type HarBituachParser, type MaslakaParser, type ParseResult } from "./types";

export { HarBituachXlsxParser, MaslakaXmlParser };
export type { HarBituachParser, MaslakaParser, ParseResult };

const digits = (s: string | null) => (s ?? "").replace(/\D/g, "").replace(/^0+/, "");

/** Merge Har Habituach and clearing-house results: same policy number = one product that carries both sources. */
export function assembleReportData(parts: { har?: ParseResult | null; maslaka?: ParseResult | null; familyLabel?: string | null }): ReportData {
  const { har, maslaka } = parts;
  const persons = new Map<string, Person>();
  for (const p of [...(har?.persons ?? []), ...(maslaka?.persons ?? [])]) {
    const prev = persons.get(p.key);
    // clearing-house names win over the anonymous Har Habituach row
    persons.set(p.key, !prev || (maslaka?.persons.includes(p) ?? false) ? { ...p, role: prev?.role ?? p.role } : prev);
  }
  const byPolicy = new Map<string, Product>();
  const products: Product[] = [];
  for (const p of maslaka?.products ?? []) {
    products.push(p);
    const d = digits(p.policyNumber);
    if (d) byPolicy.set(d, p);
  }
  for (const h of har?.products ?? []) {
    const m = byPolicy.get(digits(h.policyNumber));
    if (m) {
      if (!m.sources.includes("har")) m.sources = [...m.sources, "har"];
      if (m.monthlyPremium === null) { m.monthlyPremium = h.monthlyPremium; m.premiumKind = h.premiumKind; }
      m.endDate = m.endDate ?? h.endDate;
      m.term = m.term ?? h.term;
      m.planClass = m.planClass ?? h.planClass;
      m.joinDate = m.joinDate ?? h.joinDate;
      if (m.kind === "insurance" && (m.insuranceType === null || m.insuranceType === "other")) { m.insuranceType = h.insuranceType; m.typeBasis = h.typeBasis; }
    } else products.push(h);
  }
  const asOf = [har?.asOfDate, maslaka?.asOfDate].filter(Boolean).sort().pop() ?? "";
  const list = [...persons.values()];
  return {
    asOfDate: asOf,
    familyLabel: parts.familyLabel ?? (list.length > 1 ? "משפחה" : null),
    persons: list.length ? list : [{ key: "p_unknown", displayName: "לא התקבל שם", idMasked: "***-**-***", role: "self", birthYear: null }],
    products,
    loans: maslaka?.loans ?? [],
    sources: { har: !!har, maslaka: !!maslaka },
  };
}

// ---------------------------------------------------------------- mock (fixture) implementations
const mockResult = (d: ReportData): ParseResult => ({ persons: d.persons, products: d.products, loans: d.loans, asOfDate: d.asOfDate, diagnostics: { ...emptyDiagnostics(), filesRead: 1, warnings: ["נתוני דמה"] } });

export class MockHarBituachParser implements HarBituachParser {
  constructor(private family = true) {}
  async parse(): Promise<ParseResult> {
    const d = this.family ? SYNTHETIC_FAMILY : SYNTHETIC_SINGLE;
    return mockResult({ ...d, products: d.products.filter((p) => p.kind === "insurance") });
  }
}
export class MockMaslakaParser implements MaslakaParser {
  constructor(private family = true) {}
  parse(): ParseResult {
    const d = this.family ? SYNTHETIC_FAMILY : SYNTHETIC_SINGLE;
    return mockResult({ ...d, products: d.products });
  }
}

/** Demo data for the viewer: both sources, family or single client. */
export function demoReportData(family: boolean): ReportData {
  return family ? SYNTHETIC_FAMILY : SYNTHETIC_SINGLE;
}
