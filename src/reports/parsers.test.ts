import { describe, expect, it } from "vitest";
import { syntheticHarRows, syntheticMaslakaXml } from "./fixtures/syntheticXml";
import { HarBituachXlsxParser, MaslakaXmlParser, MockHarBituachParser, MockMaslakaParser, assembleReportData } from "./parsers";
import { parseHarBituachRows } from "./parsers/harBituach";
import { buildUnifiedReport } from "./builders";
import { ENTITLEMENTS, ProductSchema, ReportDataSchema } from "./types";

const f = (name: string, text: string) => ({ name, text });
const RUN1 = "20261109140000";
const RUN2 = "20261113040000";

describe("MaslakaXmlParser (synthetic files with the real structure)", () => {
  const files = [
    f("100CONSLTPNN0092026110914.xml", syntheticMaslakaXml({ family: "PNN", bitzua: RUN1, balanceScale: 1 })),
    f("100CONSLTPNN0092026111304.xml", syntheticMaslakaXml({ family: "PNN", bitzua: RUN2, balanceScale: 2 })),
    f("100CONSLTKGM0092026110914.xml", syntheticMaslakaXml({ family: "KGM", bitzua: RUN1, manufacturerId: "500000002", manufacturerName: 'גמל דוגמה בע"מ', policy: "900002" })),
    f("100CONSLTKGM0092026111304.xml", syntheticMaslakaXml({ family: "KGM", bitzua: RUN2, manufacturerId: "500000003", manufacturerName: 'השתלמות דוגמה בע"מ', policy: "900003", plan: "גמל להשקעה לדוגמה" })),
    f("100CONSLTINK0092026110914.xml", syntheticMaslakaXml({ family: "INK", bitzua: RUN1, policy: "900103", plan: "ביטוח חיים לדוגמה" })),
    f("broken.xml", syntheticMaslakaXml({ family: "PNN", bitzua: RUN1, broken: true })),
  ];
  const res = new MaslakaXmlParser().parse(files);

  it("reads four families, rejects the broken file", () => {
    expect(res.diagnostics.filesRead).toBe(5);
    expect(res.diagnostics.filesRejected).toHaveLength(1);
    expect(res.products.map((p) => p.kind).sort()).toEqual(["insurance", "investment", "pension", "training"]);
  });
  it("newest extraction wins; the older-only product is flagged", () => {
    expect(res.diagnostics.superseded).toBe(1);
    const pen = res.products.find((p) => p.kind === "pension");
    expect(pen?.balance).toBe(120000); // scale 2 x 60000
    expect(pen?.fromOlderExtraction).toBe(false);
    expect(res.products.find((p) => p.kind === "training")?.fromOlderExtraction).toBe(true);
    expect(res.asOfDate).toBe("2026-10-31");
  });
  it("maps balance split, fees, return, tracks, deposits, salary, projections, loans, coverages", () => {
    const p = res.products.find((x) => x.kind === "pension")!;
    expect(p.balanceSplit).toMatchObject({ employee: 20000, employer: 40000, severance: 60000 });
    expect(p.feeFromDepositPct).toBe(1.4);
    expect(p.feeFromBalancePct).toBe(0.25);
    expect(p.returnPct).toBe(5.5);
    expect(p.tracks.map((t) => t.name).sort()).toEqual(["מסלול כללי", "מסלול מניות"]);
    expect(p.tracks.find((t) => t.name === "מסלול כללי")?.balance).toBe(100000);
    expect(p.deposits).toHaveLength(4);
    expect(p.deposits[0]).toMatchObject({ month: "2026-10", employee: 600, employer: 650, severance: 833, salary: 10000 });
    expect(p.salary).toBe(10000);
    expect(p.lastDepositDate).toBe("2026-10-09");
    expect(p.projectedCapitalWithDeposits).toBe(900000);
    expect(p.projectedPensionMonthlyNoDeposits).toBe(2000);
    expect(res.loans).toHaveLength(3);
    expect(res.loans[0]).toMatchObject({ amount: 20000, interestPct: 4, monthlyPayment: 400, balance: 15000, startDate: "2024-01-01" });
    expect(p.coverages.map((c) => c.kind).sort()).toEqual(["disability", "survivors"]);
  });
  it("insurance product: type from plan name, death amount, premium", () => {
    const i = res.products.find((x) => x.kind === "insurance")!;
    expect(i.insuranceType).toBe("life");
    expect(i.monthlyPremium).toBe(70);
    expect(i.coverages[0]).toMatchObject({ kind: "death", amount: 500000 });
  });
  it("never keeps the raw id number and every product validates against the zod model", () => {
    const json = JSON.stringify(res);
    expect(json).not.toContain("000000018");
    expect(res.persons[0].idMasked).toBe("***-**-018");
    for (const p of res.products) expect(() => ProductSchema.parse(p)).not.toThrow();
  });
  it("collects unmapped codes instead of guessing", () => {
    const x = syntheticMaslakaXml({ family: "KGM", bitzua: RUN1 }).replace("<STATUS-POLISA-O-CHESHBON>1<", "<STATUS-POLISA-O-CHESHBON>77<");
    const r = new MaslakaXmlParser().parse([f("CONSLTKGM.xml", x)]);
    expect(r.products[0].status).toBe("unknown");
    expect(r.diagnostics.unmappedCodes["STATUS-POLISA-O-CHESHBON"]).toEqual(["77"]);
  });
});

describe("HarBituachXlsxParser", () => {
  it("parses domain-grouped rows: type, premium conversion, period, status, masked id", () => {
    const r = parseHarBituachRows(syntheticHarRows());
    expect(r.asOfDate).toBe("2026-11-11");
    expect(r.products).toHaveLength(3);
    const health = r.products.find((p) => p.policyNumber === "900101")!;
    expect(health).toMatchObject({ insuranceType: "health", monthlyPremium: 120, premiumKind: "monthly", status: "active", endDate: "2030-12-31" });
    const acc = r.products.find((p) => p.policyNumber === "900102")!;
    expect(acc).toMatchObject({ insuranceType: "personalAccidents", monthlyPremium: 40, premiumKind: "annual-converted" });
    expect(r.products.find((p) => p.policyNumber === "900103")?.status).toBe("inactive");
    expect(r.persons[0].idMasked).toBe("***-**-018");
    expect(JSON.stringify(r)).not.toContain("000000018");
  });
  it("a file without product rows gives a warning, not a crash", () => {
    const r = parseHarBituachRows(syntheticHarRows(false));
    expect(r.products).toHaveLength(0);
    expect(r.diagnostics.warnings.length).toBe(1);
  });
  it("rejects a sheet without the header row", () => {
    const r = parseHarBituachRows([["foo", "bar"]]);
    expect(r.diagnostics.filesRejected).toHaveLength(1);
  });
  it("reads a real .xlsx byte stream (synthetic workbook)", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(syntheticHarRows()), "תיק ביטוחי");
    const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const r = await new HarBituachXlsxParser().parse(bytes);
    expect(r.products).toHaveLength(3);
  });
});

describe("assembleReportData + mocks", () => {
  it("merges a Har product and a clearing-house product with the same policy number", async () => {
    const har = parseHarBituachRows(syntheticHarRows());
    const mas = new MaslakaXmlParser().parse([f("CONSLTINK.xml", syntheticMaslakaXml({ family: "INK", bitzua: RUN1, policy: "900103" }))]);
    const data = assembleReportData({ har, maslaka: mas });
    expect(() => ReportDataSchema.parse(data)).not.toThrow();
    const merged = data.products.filter((p) => p.policyNumber === "900103");
    expect(merged).toHaveLength(1);
    expect(merged[0].sources.sort()).toEqual(["har", "maslaka"]);
    expect(data.persons).toHaveLength(1);
    expect(data.sources).toEqual({ har: true, maslaka: true });
  });
  it("builds a unified report from real-parser output end to end", () => {
    const mas = new MaslakaXmlParser().parse([f("CONSLTPNN.xml", syntheticMaslakaXml({ family: "PNN", bitzua: RUN1 }))]);
    const r = buildUnifiedReport(assembleReportData({ maslaka: mas }), ENTITLEMENTS.client);
    expect(r.summary.totalSavings).toBe(60000);
    expect(r.blocks.find((b) => b.id === "product-deposits")?.status).toBe("shown");
  });
  it("mock parsers return synthetic data regardless of input", async () => {
    const h = await new MockHarBituachParser().parse();
    expect(h.products.every((p) => p.kind === "insurance")).toBe(true);
    expect(new MockMaslakaParser().parse().products.length).toBeGreaterThan(5);
  });
});
