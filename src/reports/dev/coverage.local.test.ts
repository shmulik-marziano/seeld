// LOCAL-ONLY coverage check against real sample files. Skipped unless REPORTS_SAMPLES points at a folder.
//   REPORTS_SAMPLES=C:/tmp/samples npx vitest run src/reports/dev/coverage.local.test.ts
// The folder is WALKED recursively: every *.xml (uniform interface) and *.xlsx (Har Habituach) below it is parsed, one file at a time and
// per directory (runs). It prints ONLY aggregates: counts, histograms of coded values, match ratios, tag names. It never prints a path,
// file name, person name, id, policy number or amount. If a Maslaka summary .xls sits next to the XML files, product figures are reconciled
// against it (ratios only).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildUnifiedReport } from "../builders";
import { HarBituachXlsxParser, MaslakaXmlParser, assembleReportData } from "../parsers";
import { isMacJunk } from "../parsers/codes";
import type { ParseResult } from "../parsers/types";
import { ENTITLEMENTS } from "../types";

const DIR = process.env.REPORTS_SAMPLES;
const run = DIR && existsSync(DIR) ? describe : describe.skip;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const bump = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const merge = (into: Record<string, Record<string, number>>, from: Record<string, Record<string, number>>) => {
  for (const [t, vals] of Object.entries(from)) for (const [v, c] of Object.entries(vals)) bump((into[t] ??= {}), v, c);
};

// the pre-hardening rules, kept here only to print a before/after comparison
const OLD_NAME = /CONSLT(INK|INP|KGM|PNN)/i;
const OLD_SUG = new Set(["2", "4", "9", "7", "8"]);

run("real samples: aggregate coverage (no paths, names or values printed)", () => {
  it("walks the folder and reports coverage", async () => {
    const all = walk(DIR!);
    const out: string[] = [];
    const xml = all.filter((p) => /\.xml$/i.test(p));
    const xlsx = all.filter((p) => /\.xlsx$/i.test(p));
    const xls = all.filter((p) => /\.xls$/i.test(p));
    out.push(`files found: xml ${xml.length}, xlsx ${xlsx.length}, xls ${xls.length}, other ${all.length - xml.length - xlsx.length - xls.length}`);

    // ---------------- Maslaka, per file
    const real = xml.filter((p) => !isMacJunk(p));
    out.push(`xml junk skipped (._): ${xml.length - real.length}`);
    let ok = 0, failed = 0, twoPerson = 0, oldRecognisedName = 0, oldKindsOk = 0, newKindsOk = 0, productsTotal = 0;
    const kinds: Record<string, number> = {};
    const unmapped: Record<string, Record<string, number>> = {};
    const counts: Record<string, Record<string, number>> = {};
    const noMeaning: Record<string, Record<string, number>> = {};
    const failReasons: Record<string, number> = {};
    const notShown: Record<string, number> = {};
    const names: Record<string, number> = {};
    const parser = new MaslakaXmlParser();
    for (const p of real) {
      const text = readFileSync(p, "utf8");
      const name = p.split(/[\\/]/).pop() ?? "";
      const old = OLD_NAME.test(name);
      if (old) oldRecognisedName += 1;
      const r = new MaslakaXmlParser().parse([{ name, text }]);
      parser.parse([{ name, text }]);
      if (r.diagnostics.filesRead === 1 && r.products.length > 0) ok += 1;
      else { failed += 1; bump(failReasons, r.diagnostics.filesRejected[0]?.reason ?? "no products"); }
      if (r.diagnostics.twoPersonFiles) twoPerson += 1;
      for (const pr of r.products) {
        bump(kinds, pr.kind);
        productsTotal += 1;
        if (pr.kind !== "unknown") newKindsOk += 1;
      }
      const sugs = Object.keys(r.diagnostics.codeCounts["SUG-MUTZAR"] ?? {});
      if (old && sugs.length > 0 && sugs.every((s) => OLD_SUG.has(s))) oldKindsOk += 1;
      merge(counts, r.diagnostics.codeCounts);
      merge(noMeaning, r.diagnostics.noMeaningCodes);
      for (const [t, vals] of Object.entries(r.diagnostics.unmappedCodes)) for (const v of vals) bump((unmapped[t] ??= {}), v);
      for (const [g, n] of Object.entries(r.diagnostics.groupsNotShown)) bump(notShown, g, n);
      const fam = /(?:CONSLT|_)([A-Z]{3})(?:_|\d)/.exec(name)?.[1] ?? "none";
      bump(names, fam);
    }
    out.push(`maslaka files parsed OK: ${ok}/${real.length} (failed ${failed}) ${JSON.stringify(failReasons)}`);
    out.push(`  BEFORE hardening (rules of the first version): files whose name the old regex recognised ${oldRecognisedName}/${real.length}; files fully classified by the old code table ${oldKindsOk}/${real.length}`);
    out.push(`  AFTER: products classified (kind known) ${newKindsOk}/${productsTotal}`);
    out.push(`  name family hints (not used for decisions): ${JSON.stringify(names)}`);
    out.push(`  products per kind: ${JSON.stringify(kinds)}; files with two persons: ${twoPerson}`);
    out.push(`  coded values read: ${JSON.stringify(Object.fromEntries(["SUG-MUTZAR", "STATUS-POLISA-O-CHESHBON", "KOD-SUG-HAFRASHA", "SUG-MAFKID", "SUG-HOTZAA"].map((t) => [t, counts[t] ?? {}])))}`);
    out.push(`  unknown codes (histogram, files): ${JSON.stringify(unmapped)}`);
    out.push(`  recognised codes without a known meaning: ${JSON.stringify(noMeaning)}`);
    out.push(`  groups read but not shown yet (products): ${JSON.stringify(notShown)}`);

    // ---------------- Maslaka, per directory (several runs together)
    const byDir = new Map<string, string[]>();
    for (const p of real) (byDir.get(dirname(p)) ?? byDir.set(dirname(p), []).get(dirname(p))!).push(p);
    let dirs = 0, superseded = 0, replaced = 0, changed = 0, onlyOlder = 0, dirProducts = 0;
    const results: ParseResult[] = [];
    for (const files of byDir.values()) {
      const r = new MaslakaXmlParser().parse(files.map((p) => ({ name: p.split(/[\\/]/).pop() ?? "", text: readFileSync(p, "utf8") })));
      dirs += 1; superseded += r.diagnostics.superseded; replaced += r.diagnostics.previousRun.replaced; changed += r.diagnostics.previousRun.changed;
      onlyOlder += r.diagnostics.previousRun.onlyInOlder; dirProducts += r.products.length;
      results.push(r);
    }
    out.push(`directories: ${dirs}; products after choosing the latest run: ${dirProducts}; replaced older versions ${superseded}; products with a changed earlier run ${changed}/${replaced}; only in an older run ${onlyOlder}`);

    // ---------------- reconcile with the summary .xls next to the XML (ratios only)
    const first = results[0];
    if (xls.length && first) {
      const XLSX = await import("xlsx");
      const xlsName = xls.sort().pop()!;
      const wb = XLSX.read(new Uint8Array(readFileSync(xlsName)), { type: "array" });
      const sheet = wb.Sheets["פרטי המוצרים שלי"];
      if (sheet) {
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
        const head = (rows[0] as string[]).map(String);
        const col = (n: string) => head.findIndex((h) => h.includes(n));
        const [iPol, iBal, iYtd, iFeeD, iFeeB] = [col("מספר פוליסה"), col("סך הכל חיסכון"), col("תשואה מתחילת השנה"), col("דמי ניהול מהפקדות"), col("דמי ניהול שנתי")];
        const close = (a: number | null, b: unknown, scale = 1) => a !== null && typeof b === "number" && Math.abs(a - b * scale) <= Math.max(0.02, Math.abs(b * scale) * 0.0006);
        let n = 0, matched = 0, bal = 0, ytd = 0, feeD = 0, feeB = 0;
        for (const r of rows.slice(1) as unknown[][]) {
          const pn = String(r[iPol] ?? "").replace(/\D/g, "").replace(/^0+/, "");
          if (!pn) continue;
          n += 1;
          const pr = results.flatMap((x) => x.products).find((x) => (x.policyNumber ?? "").replace(/\D/g, "").replace(/^0+/, "") === pn);
          if (!pr) continue;
          matched += 1;
          if (pr.kind === "insurance" || close(pr.balance, r[iBal])) bal += 1;
          if (close(pr.returnPct, r[iYtd], 100) || close(pr.returnPct, r[iYtd])) ytd += 1;
          if (close(pr.feeFromDepositPct, r[iFeeD], 100) || close(pr.feeFromDepositPct, r[iFeeD])) feeD += 1;
          if (close(pr.feeFromBalancePct, r[iFeeB], 100) || close(pr.feeFromBalancePct, r[iFeeB])) feeB += 1;
        }
        out.push(`xls reconciliation (${n} product rows): matched to xml product ${matched}; balance ok ${bal}; ytd return ok ${ytd}; fee-from-deposit ok ${feeD}; fee-from-balance ok ${feeB}`);
      }
    }

    // ---------------- Har Habituach
    let harOk = 0, harFail = 0, harJunk = 0, harEmpty = 0, harProducts = 0, harTwo = 0;
    const harTypes: Record<string, number> = {};
    const harRows = { continuation: 0, duplicates: 0, formulas: 0, separators: 0 };
    const harUnknown: Record<string, number> = {};
    const harBasis: Record<string, number> = {};
    let harResult: ParseResult | null = null;
    for (const p of xlsx) {
      const name = p.split(/[\\/]/).pop() ?? "";
      const r = await new HarBituachXlsxParser().parse(new Uint8Array(readFileSync(p)), name);
      if (r.diagnostics.filesSkipped.length) { harJunk += 1; continue; }
      if (r.diagnostics.filesRejected.length) { harFail += 1; continue; }
      harOk += 1;
      if (r.products.length === 0) harEmpty += 1;
      harProducts += r.products.length;
      if (r.persons.length > 1) harTwo += 1;
      for (const pr of r.products) { bump(harTypes, pr.insuranceType ?? "none"); bump(harBasis, pr.typeBasis); }
      for (const k of Object.keys(harRows) as (keyof typeof harRows)[]) harRows[k] += r.diagnostics.rows[k];
      for (const v of r.diagnostics.unmappedCodes["har"] ?? []) bump(harUnknown, v.split(":")[0]);
      harResult = harResult ?? (r.products.length ? r : null);
    }
    if (xlsx.length) {
      out.push(`har habituach files: ${xlsx.length}; parsed OK ${harOk} (empty ${harEmpty}); macOS junk skipped ${harJunk}; failed ${harFail}; files with two persons ${harTwo}`);
      out.push(`  products ${harProducts}; types ${JSON.stringify(harTypes)}; classification basis ${JSON.stringify(harBasis)}`);
      out.push(`  rows: ${JSON.stringify(harRows)}; values outside the dictionary (by field): ${JSON.stringify(harUnknown)}`);
    }

    const merged = assembleReportData({ har: harResult, maslaka: results[0] ?? null });
    const rep = buildUnifiedReport(merged, ENTITLEMENTS.visitor);
    out.push(`unified report from the first folder (visitor): parts shown ${rep.coverage.shown}/${rep.coverage.total}`);

    // leaf tags present vs read by the mapping (names only)
    const present = new Set<string>();
    for (const p of real.slice(0, 400)) {
      const doc = new DOMParser().parseFromString(readFileSync(p, "utf8").replace(/^\uFEFF/, "").trim(), "text/xml");
      for (const el of Array.from(doc.getElementsByTagName("*"))) if (!el.children.length && (el.textContent ?? "").trim() !== "") present.add(el.tagName);
    }
    const read = [...present].filter((t) => parser.consumedTags.has(t)).length;
    out.push(`non-empty leaf tags seen (first 400 files): ${present.size}; read by the mapping: ${read}`);
    console.log(["", "=== REAL SAMPLE COVERAGE (aggregates only) ===", ...out].join("\n"));
    expect(ok + failed).toBe(real.length);
  });
});
