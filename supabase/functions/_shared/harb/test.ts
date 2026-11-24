// deno test supabase/functions/_shared/harb/  (synthetic files built in code; no real export is committed)
import assert from "node:assert/strict";
import { crc32, listZip, readEntry, zipStored, ZipError } from "./zip.ts";
import { columnA, HARB_LIMITS, HarbFileError, inspectHarbXlsx, normalizeHarbId } from "./xlsx.ts";
import { buildBomb, buildHarbXlsx, OTHER_HARB_ID, SYNTH_HARB_ID } from "./fixtures.ts";

const code = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
    return "ok";
  } catch (e) {
    return e instanceof HarbFileError || e instanceof ZipError ? e.code : `other:${(e as Error).name}`;
  }
};

Deno.test("zip: crc32 known value; a stored zip round-trips through the reader", async () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const bytes = new TextEncoder().encode("Zz synthetic payload");
  const z = zipStored([{ name: "harb_2026-11-25.xlsx", bytes }]);
  const entries = listZip(z);
  assert.deepEqual(entries.map((e) => [e.name, e.method, e.size]), [["harb_2026-11-25.xlsx", 0, bytes.byteLength]]);
  assert.deepEqual(await readEntry(z, entries[0]), bytes);
  assert.throws(() => zipStored([{ name: "../evil", bytes }]), ZipError);
});

Deno.test("zip: not a zip, a corrupted entry and an inflate past the declared size are refused with codes", async () => {
  assert.throws(() => listZip(new TextEncoder().encode("%PDF-1.7 not a zip at all, just some bytes here")), (e: unknown) => e instanceof ZipError && e.code === "not_zip");
  const z = zipStored([{ name: "a.txt", bytes: new TextEncoder().encode("Zz payload Zz payload") }]);
  const bad = z.slice();
  bad[30 + "a.txt".length + 2] ^= 0xff; // flip a payload byte: CRC mismatch
  assert.equal(await code(readEntry(bad, listZip(bad)[0])), "zip_corrupt");
  assert.equal(await code(inspectHarbXlsx(await buildBomb())), "too_large");
});

Deno.test("ids: column-A values normalise to 9 digits; anything else is not an id", () => {
  assert.equal(normalizeHarbId("18"), null);
  assert.equal(normalizeHarbId("00000018"), "000000018");
  assert.equal(normalizeHarbId("12344"), SYNTH_HARB_ID);
  assert.equal(normalizeHarbId("18 "), null);
  assert.equal(normalizeHarbId("12345678"), "012345678");
  assert.equal(normalizeHarbId("12345678.0"), "012345678");
  assert.equal(normalizeHarbId("1.2345678E7"), "012345678");
  assert.equal(normalizeHarbId("12-345678"), "012345678");
  assert.equal(normalizeHarbId("תעודת זהות"), null);
  assert.equal(normalizeHarbId("1234567890"), null);
  assert.equal(normalizeHarbId("12.5"), null);
});

Deno.test("xlsx: the export shape passes (prefixed and plain tags, deflated and stored entries) and yields the one id", async () => {
  for (const o of [{}, { prefix: "" as const }, { deflate: false }, { ids: ["000012344", 12344, "00012344", "12344.0"] }]) {
    const r = await inspectHarbXlsx(await buildHarbXlsx(o));
    assert.equal(r.nationalId, SYNTH_HARB_ID);
    assert.equal(r.sheets, 1);
  }
  assert.equal((await inspectHarbXlsx(await buildHarbXlsx({ ids: [12344, 12344, 12344, 12344, 12344] }))).rows, 5);
  // two title rows before the header are fine
  assert.equal((await inspectHarbXlsx(await buildHarbXlsx({ titleRows: 2 }))).rows, 3);
});

Deno.test("xlsx: refusals by code (empty, two ids, text after the policies, too many title rows, caps, missing parts)", async () => {
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ ids: [] }))), "empty");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ ids: [12344, Number(OTHER_HARB_ID)] }))), "id_mismatch");
  // a 2-digit number is no id: after the policies it is a layout refusal, never a silent pass
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ ids: [12344, 18] }))), "bad_layout");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ trailing: ["Zz note"] }))), "bad_layout");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ titleRows: 10 }))), "bad_layout");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ extraSheets: HARB_LIMITS.maxSheets }))), "too_many_sheets");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ omit: "xl/workbook.xml" }))), "not_xlsx");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ omit: "[Content_Types].xml" }))), "not_xlsx");
  const big = await buildHarbXlsx();
  assert.equal(await code(inspectHarbXlsx(big, { ...HARB_LIMITS, maxBytes: big.byteLength - 1 })), "too_large");
  assert.equal(await code(inspectHarbXlsx(await buildHarbXlsx({ ids: [12344, 12344, 12344] }), { ...HARB_LIMITS, maxRows: 4 })), "too_many_rows");
  assert.equal(await code(inspectHarbXlsx(new TextEncoder().encode("PK".padEnd(200, "z")))), "not_xlsx");
  assert.equal(await code(inspectHarbXlsx(new Uint8Array(10))), "not_xlsx");
});

Deno.test("xlsx: columnA reads shared, inline, numeric and positional cells; ignores other columns", () => {
  const xml = `<x:sheetData><x:row r="1"><x:c r="B1" t="s"><x:v>0</x:v></x:c></x:row>` +
    `<x:row r="2"><x:c r="A2" t="s"><x:v>1</x:v></x:c><x:c r="B2"><x:v>999999999</x:v></x:c></x:row>` +
    `<x:row r="3"><x:c r="A3" t="inlineStr"><x:is><x:t>a&amp;b</x:t></x:is></x:c></x:row>` +
    `<x:row r="4"><x:c><x:v>18</x:v></x:c><x:c><x:v>26</x:v></x:c></x:row><x:row r="5"/></x:sheetData>`;
  assert.deepEqual(columnA(xml, ["title", "header"]), ["", "header", "a&b", "18", ""]);
});
