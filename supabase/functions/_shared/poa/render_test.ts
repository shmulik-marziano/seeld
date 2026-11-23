// deno test supabase/functions/_shared/poa/  (synthetic values only). For a look at the files: deno run --allow-write _shared/poa/render_sample.ts <dir>
import assert from "node:assert/strict";
import { parseTtf } from "../pdfkit/ttf.ts";
import { rubikFonts } from "../pdfkit/fonts.ts";
import { decodePng, fromBase64, PngError } from "../pdfkit/png.ts";
import { fieldValues, renderPoa, stampParts } from "./render.ts";
import { DOC_TITLE, EVIDENCE, fill, HARBIT, MASLAKA, POLICIES } from "./templates.ts";
import { PNG_B64, SYNTH_ID } from "./fixtures.ts";
import { POA_KINDS } from "./engine/types.ts";


const IDENTITY = { firstName: "דנה", lastName: "בדיקה", nationalId: SYNTH_ID, street: "הרצל 12", city: "תל אביב", zip: "6473912" };
const LICENSEE = { name: "ישראל ישראלי", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" };
const fonts = () => {
  const f = rubikFonts();
  return { regular: parseTtf(f.regular), bold: parseTtf(f.bold) };
};
const text = (b: Uint8Array) => new TextDecoder("latin1").decode(b);
const pages = (b: Uint8Array) => (text(b).match(/\/Type \/Page\b/g) ?? []).length;

Deno.test("templates: every placeholder is a known field and the filled text has none left", () => {
  const v = fieldValues(IDENTITY, LICENSEE);
  const all = JSON.stringify([MASLAKA, HARBIT, POLICIES, EVIDENCE]);
  const names = new Set([...all.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]));
  for (const n of names) assert.ok(n in v || ["date", "time", "ip"].includes(n), `placeholder {${n}} has a value`);
  assert.equal(fill("שם: {name}, {nid}", v), `שם: דנה בדיקה, ${SYNTH_ID}`);
  assert.equal(fill("{unknown}", v), "{unknown}");
  // the tool's wording: a few anchors that must never drift
  assert.ok(MASLAKA.validity.includes("3 חודשים"));
  assert.ok(HARBIT.clause2.includes("לחמישה ימי עבודה"));
  assert.ok(POLICIES.validity.includes("30 ימי עבודה"));
  assert.equal(MASLAKA.roles.filter((r) => r.checked).length, 1);
});

Deno.test("stamp: Israel calendar day and time, dd/mm/yyyy hh:mm:ss", () => {
  // 2026-11-21 22:06:00Z is 22/11/2026 00:06:00 in Israel (winter, UTC+2)
  assert.deepEqual(stampParts(new Date(Date.UTC(2026, 10, 21, 22, 6, 0))), { date: "22/11/2026", time: "00:06:00" });
});

Deno.test("png: the fixture decodes; junk is refused with a code", async () => {
  const img = await decodePng(fromBase64(PNG_B64));
  assert.equal(img.width, 1);
  assert.equal(img.height, 1);
  assert.equal(img.rgb.length, 3);
  await assert.rejects(() => decodePng(new Uint8Array([1, 2, 3])), (e: unknown) => e instanceof PngError && e.code === "png_signature");
});

Deno.test("render: preview and final of the three documents are PDFs with the expected pages; every final carries the one signature", async () => {
  const f = fonts();
  const signature = await decodePng(fromBase64(PNG_B64));
  for (const kind of POA_KINDS) {
    const preview = await renderPoa({ kind, identity: IDENTITY, licensee: LICENSEE, now: new Date(0) }, f);
    const final = await renderPoa({
      kind, identity: IDENTITY, licensee: LICENSEE, now: new Date(0),
      evidence: { at: new Date(Date.UTC(2026, 10, 21, 22, 6, 0)), ip: "203.0.113.9", signature },
    }, f);
    // a final without a signature (an approval recorded by an older page) still renders, without the image
    const unsigned = await renderPoa({ kind, identity: IDENTITY, licensee: LICENSEE, now: new Date(0), evidence: { at: new Date(Date.UTC(2026, 10, 21, 22, 6, 0)), ip: "203.0.113.9" } }, f);
    for (const b of [preview, final, unsigned]) {
      assert.equal(text(b.subarray(0, 5)), "%PDF-");
      assert.equal(pages(b), kind === "maslaka" ? 2 : 1, `${kind}: pages`);
      assert.ok(text(b).includes("/Direction /R2L"));
    }
    assert.ok(text(final).includes("/Subtype /Image"), `${kind}: the signature image is in the signed document`);
    assert.ok(!text(preview).includes("/Subtype /Image") && !text(unsigned).includes("/Subtype /Image"), `${kind}: no image without a signature`);
    assert.ok(preview.byteLength > 20_000 && final.byteLength > 20_000, "fonts embedded");
    assert.ok(text(final).includes(`/Title <FEFF${[...DOC_TITLE[kind]].map((c) => c.codePointAt(0)!.toString(16).padStart(4, "0")).join("").toUpperCase()}>`), `${kind}: title`);
  }
});
