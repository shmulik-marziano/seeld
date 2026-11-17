import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { bidiRtl, toVisualString } from "@/questionnaires/pdfkit/bidi";
import { parseTtf } from "@/questionnaires/pdfkit/ttf";
import { renderPdfBytes } from "@/questionnaires/pdf";
import { bankCodeFromPick, validateFullName } from "@/questionnaires/validators";

const font = (n: string) => new Uint8Array(fs.readFileSync(path.resolve("public/fonts", n)));

describe("bidi (RTL base)", () => {
  it.each([
    ["שלום עולם", "םלוע םולש"],
    ["אבג 123", "123 גבא"], // number stays left-to-right, placed at the left of the Hebrew word in RTL reading
    ["abc", "abc"],
    ["שם: John Smith", "John Smith :םש"],
    ["(עד 65)", "(65 דע)"],
    ["052-3097444 טלפון", "ןופלט 052-3097444"],
    ["1,234.50 ₪", "₪ 1,234.50"],
    ["15/06/1985", "15/06/1985"],
  ])("%s", (input, visual) => expect(toVisualString(input)).toBe(visual));
  it("is a permutation of the logical indices", () => {
    const t = "דנה Anne Marie 12/05 (x)";
    const { visual } = bidiRtl(t);
    expect([...visual].sort((a, b) => a - b)).toEqual([...Array(visual.length).keys()]);
  });
});

describe("font + pdf writer", () => {
  const reg = parseTtf(font("Rubik-Regular.ttf"));
  it("covers Hebrew, Latin, digits and the shekel sign", () => {
    for (const ch of "אבגדהוזחטיכלמנסעפצקרשת abcXYZ 0123456789 ₪()-•") expect(reg.gidOf(ch.codePointAt(0)!)).toBeGreaterThan(0);
    expect(reg.advance(reg.gidOf("א".codePointAt(0)!))).toBeGreaterThan(100);
  });
  it("produces a tagged, language-marked PDF with the JSON attached", async () => {
    const def = { key: "personal", version: 1, title: "פרטים אישיים" } as never;
    const bytes = await renderPdfBytes(
      { def, sections: [{ id: "s", title: "פרק", rows: [{ key: "a", label: "שם פרטי", text: "דנה", raw: "דנה", sectionTitle: "פרק" }] }], signature: { kind: "typed", name: "דנה כהן" }, signerName: "דנה כהן", signerIdMasked: "••••••782",
        signedAt: new Date("2026-11-17T10:00:00Z"), hash: "ab".repeat(32), declaration: ["הצהרה."], sensitive: false, payload: { a: 1 } },
      { fonts: { regular: font("Rubik-Regular.ttf"), bold: font("Rubik-Bold.ttf") } },
    );
    const s = new TextDecoder("latin1").decode(bytes);
    expect(s.startsWith("%PDF-1.7")).toBe(true);
    for (const needle of ["/Lang (he-IL)", "/StructTreeRoot", "/MarkInfo", "/EmbeddedFile", "answers.json", "/CIDFontType2", "/ToUnicode", "%%EOF"]) expect(s).toContain(needle);
  });
});

describe("direct debit helpers", () => {
  it.each([["דנה", false], ["דנה כהן", true], ["Anne Marie", true], ["ד כ", false], ["", false], ["דנה כהן-לוי", true]])("full name %s", (v, ok) => expect(validateFullName(v).ok).toBe(ok));
  it.each([["בנק הפועלים (12)", "12"], ["בנק לאומי (10)", "10"], ["12", "12"], ["הפועלים", null], ["", null]])("bank pick %s", (v, code) => expect(bankCodeFromPick(v)).toBe(code));
});
