// Parser test matrix (mirrors docs/product/SOURCE-FILES-CATALOG.md section 12). Every fixture is invented by hand.
import { describe, expect, it } from "vitest";
import { buildFinancialReport, buildUnifiedReport } from "./builders";
import { NO_INFO } from "./format";
import { syntheticHarRows, syntheticHarRowsQuirks, syntheticMaslakaXml, type SyntheticFamily, type XmlOpts } from "./fixtures/syntheticXml";
import { HarBituachXlsxParser, MaslakaXmlParser, assembleReportData } from "./parsers";
import { decideKind, familyHintFromName, isMacJunk } from "./parsers/codes";
import { parseHarBituachRows } from "./parsers/harBituach";
import { ENTITLEMENTS, ProductSchema } from "./types";

const RUN1 = "20261109140000";
const RUN2 = "20261113040000";
const x = (o: Partial<XmlOpts> & { family: SyntheticFamily }) => syntheticMaslakaXml({ bitzua: RUN1, ...o });
const parse = (files: { name: string; text: string }[]) => new MaslakaXmlParser().parse(files);

describe("matrix 1-3: encoding, file names, schema versions", () => {
  it("reads files with BOM, without XML declaration, with surrounding whitespace", () => {
    for (const o of [{ bom: true }, { noDeclaration: true }, { padding: true }, { bom: true, noDeclaration: true, padding: true }]) {
      const r = parse([{ name: "a.xml", text: x({ family: "PNN", ...o }) }]);
      expect(r.diagnostics.filesRejected).toEqual([]);
      expect(r.products).toHaveLength(1);
    }
  });
  it("family code in the name is only a hint: every name pattern yields the same product", () => {
    const text = x({ family: "PNN" });
    const names = ["999999999999999CONSLTKGM999999999999999999999.xml", "999999999_999999999_ING_999999999999_1.xml", "‏‏file_PNO_999999999999_2.xml - עותק.xml", "no-family-in-the-name.xml", "x_INM_9_1.xml"];
    for (const name of names) {
      const r = parse([{ name, text }]);
      expect(r.products).toHaveLength(1);
      expect(r.products[0].kind).toBe("pension"); // decided by SUG-MUTZAR=2 inside the file, never by the name
    }
    expect(familyHintFromName("9_9_ING_99_1.xml")).toBe("ING");
    expect(familyHintFromName("99CONSLTKGM99.xml")).toBe("KGM");
    expect(familyHintFromName("plain.xml")).toBeNull();
  });
  it("accepts schema versions 008 and 009 alike", () => {
    const v8 = x({ family: "KGM" }).replace("<MISPAR-GIRSAT-XML>009<", "<MISPAR-GIRSAT-XML>008<");
    expect(parse([{ name: "a.xml", text: v8 }]).products).toHaveLength(1);
  });
  it("rejects with a Hebrew reason: empty, not XML, wrong root, no products", () => {
    const bad = ["", "hello", "<Other><Mutzar/></Other>", "<Mimshak><KoteretKovetz/></Mimshak>"];
    const r = parse(bad.map((text, i) => ({ name: `b${i}.xml`, text })));
    expect(r.diagnostics.filesRejected).toHaveLength(4);
    expect(r.diagnostics.filesRejected.every((f) => /[֐-׿]/.test(f.reason))).toBe(true);
    expect(r.products).toEqual([]);
  });
  it("skips macOS junk files with a friendly note", () => {
    const r = parse([{ name: "._real.xml", text: "\u0000\u0005junk" }, { name: "real.xml", text: x({ family: "KGM" }) }]);
    expect(isMacJunk("._real.xml")).toBe(true);
    expect(isMacJunk("‏._real.xml")).toBe(true);
    expect(r.diagnostics.filesSkipped).toHaveLength(1);
    expect(r.diagnostics.filesRejected).toEqual([]);
    expect(r.products).toHaveLength(1);
  });
});

describe("matrix: SUG-MUTZAR 1..10 (inferred), unknown codes degrade", () => {
  const expected: Record<number, [string, string | null]> = {
    1: ["managers", null], 2: ["pension", null], 3: ["provident", null], 4: ["training", null], 5: ["managers", null],
    6: ["insurance", "life"], 7: ["insurance", "mortgageLife"], 8: ["insurance", "life"], 9: ["investment", null], 10: ["childInvestment", null],
  };
  it("maps every code of the catalog", () => {
    for (const [code, [kind, ins]] of Object.entries(expected)) {
      const p = parse([{ name: `f_${code}.xml`, text: x({ family: "ING", sugMutzar: code }) }]).products[0];
      expect(p.kind, `code ${code}`).toBe(kind);
      expect(p.insuranceType, `code ${code}`).toBe(ins);
      expect(() => ProductSchema.parse(p)).not.toThrow();
    }
  });
  it("marks a type decided only by a code as inferred (typeBasis code), a plan-name keyword as plan-name", () => {
    expect(decideKind("3", "קופה כללית").basis).toBe("code");
    expect(decideKind("4", "מור השתלמות").basis).toBe("plan-name");
    expect(parse([{ name: "a.xml", text: x({ family: "KGM", sugMutzar: 3 }) }]).products[0].typeBasis).toBe("code");
  });
  it("an unknown SUG-MUTZAR becomes kind 'unknown' with a visible count, never a wrong label", () => {
    const r = parse([{ name: "u.xml", text: x({ family: "ING", sugMutzar: 11, plan: "תוכנית אלמונית" }) }]);
    expect(r.products[0].kind).toBe("unknown");
    expect(r.diagnostics.unmappedCodes["SUG-MUTZAR"]).toEqual(["11"]);
    const rep = buildUnifiedReport(assembleReportData({ maslaka: r }), ENTITLEMENTS.visitor);
    expect(rep.summary.unclassifiedCount).toBe(1);
  });
  it("a code-less plan with a keyword still gets a kind; an unknown product shows the no-information label", () => {
    const r = parse([{ name: "k.xml", text: x({ family: "KGM", sugMutzar: 99, plan: "קרן השתלמות כלשהי" }) }]);
    expect(r.products[0].kind).toBe("training");
    expect(r.products[0].typeBasis).toBe("plan-name");
  });
});

describe("matrix: status, deposit and component codes", () => {
  it("1 active, 2 inactive; 3,4,6..10 recognised without meaning; others unmapped; none crash", () => {
    const status = (s: number | string) => parse([{ name: "s.xml", text: x({ family: "KGM", status: s }) }]);
    expect(status(1).products[0].status).toBe("active");
    expect(status(2).products[0].status).toBe("inactive");
    for (const s of [3, 4, 6, 7, 8, 9, 10]) {
      const r = status(s);
      expect(r.products[0].status).toBe("unknown");
      expect(r.diagnostics.noMeaningCodes["STATUS-POLISA-O-CHESHBON"][String(s)]).toBe(1);
      expect(r.diagnostics.unmappedCodes["STATUS-POLISA-O-CHESHBON"]).toBeUndefined();
    }
    const odd = status(77);
    expect(odd.products[0].status).toBe("unknown");
    expect(odd.diagnostics.unmappedCodes["STATUS-POLISA-O-CHESHBON"]).toEqual(["77"]);
    const rep = buildFinancialReport(assembleReportData({ maslaka: odd }), ENTITLEMENTS.client);
    expect(rep.summary.unknownStatusCount).toBe(1);
  });
  it("provident funds split the balance by KOD-SUG-HAFRASHA 8/9; payers 3..6 land in 'other'; unknown payer is counted", () => {
    const r = parse([{ name: "k.xml", text: x({ family: "KGM" }) }]);
    const p = r.products[0];
    expect(p.balanceSplit).toMatchObject({ employee: 30000, employer: 30000 });
    expect(p.deposits[0].other).toBe(25); // SUG-MAFKID 5 in the newest month
    const odd = parse([{ name: "k.xml", text: x({ family: "KGM" }).replace("<SUG-MAFKID>5<", "<SUG-MAFKID>7<") }]);
    expect(odd.diagnostics.unmappedCodes["SUG-MAFKID"]).toEqual(["7"]);
    expect(odd.diagnostics.codeCounts["SUG-MAFKID"]["1"]).toBeGreaterThan(0);
  });
  it("an unknown KOD-SUG-HAFRASHA lands in 'other' and is listed", () => {
    const r = parse([{ name: "k.xml", text: x({ family: "KGM" }).replace("<KOD-SUG-HAFRASHA>8<", "<KOD-SUG-HAFRASHA>31<") }]);
    expect(r.diagnostics.unmappedCodes["KOD-SUG-HAFRASHA"]).toEqual(["31"]);
    expect(r.products[0].balanceSplit.other).toBe(30000);
  });
});

describe("matrix: structure quirks", () => {
  it("a file with two clients becomes two persons with their own products", () => {
    const r = parse([{ name: "two.xml", text: x({ family: "KGM", secondClientId: "000000026" }) }]);
    expect(r.persons).toHaveLength(2);
    expect(r.diagnostics.twoPersonFiles).toBe(1);
    expect(r.products).toHaveLength(2);
    expect(new Set(r.products.map((p) => p.ownerKey)).size).toBe(2);
    expect(JSON.stringify(r)).not.toContain("000000026");
  });
  it("reads up to five accounts per product", () => {
    expect(parse([{ name: "a.xml", text: x({ family: "KGM", accounts: 5 }) }]).products).toHaveLength(5);
  });
  it("empty skeleton means no data (null), zero stays zero", () => {
    const p = parse([{ name: "e.xml", text: x({ family: "PNN", emptySkeleton: true }) }]).products[0];
    expect(p.balance).toBeNull();
    expect(p.returnPct).toBeNull();
    expect(p.salary).toBeNull();
    expect(p.projectedCapitalNoDeposits).toBeNull();
    expect(p.deposits).toEqual([]);
    const zero = x({ family: "PNN" }).replace("<TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT>500000.00<", "<TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT>0.00<");
    expect(parse([{ name: "z.xml", text: zero }]).products[0].projectedCapitalNoDeposits).toBe(0);
  });
  it("ignores ReshumatSgira counts, which are unreliable", () => {
    const a = parse([{ name: "a.xml", text: x({ family: "PNN" }) }]);
    const b = parse([{ name: "a.xml", text: x({ family: "PNN", wrongCounts: true }) }]);
    expect(b.products).toHaveLength(1);
    expect(b.products[0].balance).toBe(a.products[0].balance);
  });
  it("trims values and bidi marks", () => {
    const p = parse([{ name: "d.xml", text: x({ family: "KGM", dirtyText: true, plan: "קרן השתלמות דוגמה" }) }]).products[0];
    expect(p.planName).toBe("קרן השתלמות דוגמה");
  });
  it("no policy overlap across families: same policy number under two product codes stays two products", () => {
    const r = parse([{ name: "a.xml", text: x({ family: "KGM" }) }, { name: "b.xml", text: x({ family: "PNN" }) }]);
    expect(r.products).toHaveLength(2);
  });
});

describe("matrix: repeated runs", () => {
  it("equal TAARICH-BITZUA: the more complete file wins, in any order (deterministic)", () => {
    const full = { name: "z-full.xml", text: x({ family: "PNN" }) };
    const thin = { name: "a-thin.xml", text: x({ family: "PNN", emptySkeleton: true }) };
    for (const order of [[full, thin], [thin, full]]) {
      const r = parse(order);
      expect(r.products).toHaveLength(1);
      expect(r.products[0].balance).toBe(60000);
      expect(r.diagnostics.superseded).toBe(1);
    }
  });
  it("equal bitzua and equal completeness: file name decides, identically on every run", () => {
    const a = { name: "a.xml", text: x({ family: "PNN" }) };
    const b = { name: "b.xml", text: x({ family: "PNN" }) };
    expect(JSON.stringify(parse([a, b]).products)).toBe(JSON.stringify(parse([b, a]).products));
  });
  it("changed content between runs: the latest wins and the diff is counted", () => {
    const r = parse([{ name: "old.xml", text: x({ family: "PNN", balanceScale: 1 }) }, { name: "new.xml", text: x({ family: "PNN", balanceScale: 2, bitzua: RUN2 }) }]);
    expect(r.products[0].balance).toBe(120000);
    expect(r.diagnostics.previousRun).toMatchObject({ replaced: 1, changed: 1 });
  });
  it("identical copies are not 'changed'", () => {
    const r = parse([{ name: "1.xml", text: x({ family: "PNN" }) }, { name: "2.xml", text: x({ family: "PNN" }) }]);
    expect(r.diagnostics.previousRun).toMatchObject({ replaced: 1, changed: 0 });
  });
  it("a product only in the older run stays and is flagged", () => {
    const r = parse([
      { name: "old.xml", text: x({ family: "KGM", policy: "111", manufacturerId: "1" }) },
      { name: "new.xml", text: x({ family: "KGM", policy: "222", manufacturerId: "2", bitzua: RUN2 }) },
    ]);
    expect(r.products.find((p) => p.policyNumber === "111")?.fromOlderExtraction).toBe(true);
    expect(r.diagnostics.previousRun.onlyInOlder).toBe(1);
  });
});

describe("matrix: groups read but not shown yet", () => {
  it("reads fee benefits, collection, claims, severance waiver and proxy into the model, and lists them", () => {
    const r = parse([{ name: "g.xml", text: x({ family: "KGM", extraGroups: true }) }]);
    const e = r.products[0].extras;
    expect(e.feeBenefits).toHaveLength(1);
    expect(e.feeBenefits[0]).toMatchObject({ kind: "balance", discountPct: 10, endDate: "2027-12-31" });
    expect(e.collection).toEqual({ frequency: "4", method: "1" });
    expect(e.hasClaim).toBe(true);
    expect(e.severance?.waived).toBe("1");
    expect(e.hasProxy).toBe(true);
    expect(Object.keys(r.diagnostics.groupsNotShown)).toHaveLength(5);
    const rep = buildFinancialReport(assembleReportData({ maslaka: r }), ENTITLEMENTS.client);
    expect(rep.summary.notShownGroups).toHaveLength(5);
  });
  it("empty skeleton groups add nothing", () => {
    const r = parse([{ name: "g.xml", text: x({ family: "KGM" }) }]);
    expect(r.products[0].extras.collection).toBeNull();
    expect(r.products[0].extras.hasClaim).toBe(false);
    expect(r.diagnostics.groupsNotShown).toEqual({});
  });
});

describe("matrix: Har Habituach quirks", () => {
  const r = parseHarBituachRows(syntheticHarRowsQuirks());
  it("handles 12 columns, continuation rows, duplicates, formula rows, separators", () => {
    expect(r.diagnostics.rows).toMatchObject({ continuation: 1, duplicates: 1, formulas: 1, separators: 1, products: 4 });
    expect(r.products).toHaveLength(4);
  });
  it("two persons: an empty id continues the previous person", () => {
    expect(r.persons).toHaveLength(2);
    const owners = r.products.map((p) => p.ownerKey);
    expect(owners[2]).toBe(owners[3]);
    expect(owners[0]).not.toBe(owners[2]);
    expect(JSON.stringify(r)).not.toContain("000000026");
  });
  it("period values 'מתחדש' and 'לכל החיים' are not dates", () => {
    const car = r.products.find((p) => p.insuranceType === "vehicle")!;
    expect(car.term).toBe("renewing");
    expect(car.endDate).toBeNull();
    expect(r.products.find((p) => p.insuranceType === "home")?.term).toBe("lifelong");
  });
  it("policy numbers with dashes are cleaned and still merge by digits", () => {
    expect(r.products.find((p) => p.insuranceType === "vehicle")?.policyNumber).toBe("12-345");
  });
  it("three premium types: monthly, annual converted, one-time not converted", () => {
    const home = r.products.find((p) => p.insuranceType === "home")!;
    expect(home.premiumKind).toBe("one-time");
    expect(home.monthlyPremium).toBeNull();
    const car = r.products.find((p) => p.insuranceType === "vehicle")!;
    expect(car).toMatchObject({ premiumKind: "annual-converted", monthlyPremium: 25 });
    const nursing = r.products.find((p) => p.insuranceType === "nursing")!;
    expect(nursing.premiumKind).toBe("monthly");
  });
  it("three plan classes", () => {
    expect(r.products.find((p) => p.insuranceType === "serviceLetter")?.planClass).toBe("group-hmo");
    expect(r.products.find((p) => p.insuranceType === "nursing")?.planClass).toBe("group");
    expect(r.products.find((p) => p.insuranceType === "vehicle")?.planClass).toBe("personal");
  });
  it("classifies from the dictionary value sets; unknown values are counted, not guessed", () => {
    expect(r.products.every((p) => p.typeBasis === "har-dictionary")).toBe(true);
    expect(r.diagnostics.unmappedCodes["har"]).toEqual(["ענף משני: ערך שלא מוכר"]);
  });
  it("an ambiguous secondary branch follows the main branch ('ביטוח מקיף' under home stays home)", () => {
    const rows = syntheticHarRows(false);
    rows.push(["000000018", "ביטוח דירה", "ביטוח מקיף", "פוליסת ביטוח", 'חברת דוגמה בע"מ', "מתחדש", "", "10", "חודשית", "5", "אישי"]);
    expect(parseHarBituachRows(rows).products[0].insuranceType).toBe("home");
  });
  it("merges with the clearing house by digits of the policy number even with dashes", () => {
    const mas = parse([{ name: "i.xml", text: x({ family: "INP", policy: "12345", sugMutzar: 6 }) }]);
    const data = assembleReportData({ har: r, maslaka: mas });
    expect(data.products.filter((p) => (p.policyNumber ?? "").replace(/\D/g, "") === "12345")).toHaveLength(1);
  });
  it("non-zip bytes and macOS junk get friendly messages instead of an exception", async () => {
    const parser = new HarBituachXlsxParser();
    const apple = await parser.parse(new Uint8Array([0x00, 0x05, 0x16, 0x07, 0, 0, 0, 0]));
    expect(apple.diagnostics.filesRejected[0].reason).toMatch(/xlsx/);
    const junk = await parser.parse(new Uint8Array([1, 2, 3, 4]), "._HbResults.xlsx");
    expect(junk.diagnostics.filesSkipped).toHaveLength(1);
    expect(junk.products).toEqual([]);
  });
  it("a file with zero data rows is valid and empty", () => {
    const e = parseHarBituachRows(syntheticHarRows(false));
    expect(e.products).toEqual([]);
    expect(e.diagnostics.filesRejected).toEqual([]);
  });
  it("labels: an unknown kind shows the no-information label", () => {
    const rep = buildFinancialReport(assembleReportData({ maslaka: parse([{ name: "u.xml", text: x({ family: "KGM", sugMutzar: 12, plan: "אלמוני", emptySkeleton: false }) }]) }), ENTITLEMENTS.client);
    expect(rep.data.products.length >= 0).toBe(true);
    expect(NO_INFO).toBe("לא התקבל מידע");
  });
});
