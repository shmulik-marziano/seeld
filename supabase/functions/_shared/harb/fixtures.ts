// Synthetic Har HaBituach exports for the Deno tests (never imported by an index.ts). Built in code, shaped like the real
// export (title row without an A cell, the header row, an empty A cell, policy rows with the id as a NUMBER in column A,
// shared strings, optional `x:` tag prefix, deflated entries). Ids are fake valid-checksum ids; no real file is committed.
import { zipWrite, type ZipWriteEntry } from "./zip.ts";

/** fake ids with a valid check digit whose NUMBER form keeps 5 digits (the export writes the id as a number) */
export const SYNTH_HARB_ID = "000012344";
export const OTHER_HARB_ID = "000012351";

const HEADER = ["תעודת זהות", "ענף ראשי", "ענף (משני)", "סוג מוצר", "חברה", "תקופת ביטוח", "פרטים נוספים", "פרמיה בש\"ח", "סוג פרמיה", "מספר פוליסה", "סיווג תכנית"];
const COLS = "ABCDEFGHIJK";

export interface FixtureOptions {
  /** column-A values of the policy rows (default: three rows of SYNTH_HARB_ID as numbers) */
  ids?: Array<string | number>;
  /** tag prefix as the export writes it ("x") or none (Excel re-save) */
  prefix?: "x" | "";
  /** deflate the entries (default true, like the real file) */
  deflate?: boolean;
  /** extra worksheets (each a copy of the first) */
  extraSheets?: number;
  /** raw rows appended after the policy rows: [columnA, ...] as inline strings */
  trailing?: string[];
  /** drop a required part */
  omit?: "[Content_Types].xml" | "xl/workbook.xml";
  /** extra text rows before the header (title rows) */
  titleRows?: number;
}

async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw");
  const w = cs.writable.getWriter();
  w.write(bytes).catch(() => {});
  w.close().catch(() => {});
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function buildHarbXlsx(o: FixtureOptions = {}): Promise<Uint8Array> {
  const p = o.prefix === undefined ? "x" : o.prefix;
  const t = (n: string) => (p ? `${p}:${n}` : n);
  const ns = p ? `xmlns:${p}="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` : `xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"`;
  const shared: string[] = ["התיק הביטוחי", ...HEADER, "בריאות", "Zz-Company"];
  const si = (s: string) => shared.indexOf(s);
  const rows: string[] = [];
  let r = 1;
  // title row: no A cell (the title sits in another column)
  rows.push(`<${t("row")} r="${r}"><${t("c")} r="B${r}" t="s"><${t("v")}>${si("התיק הביטוחי")}</${t("v")}></${t("c")}></${t("row")}>`);
  r++;
  for (let i = 0; i < (o.titleRows ?? 0); i++, r++) {
    rows.push(`<${t("row")} r="${r}"><${t("c")} r="A${r}" t="inlineStr"><${t("is")}><${t("t")}>Zz title ${i}</${t("t")}></${t("is")}></${t("c")}></${t("row")}>`);
  }
  rows.push(`<${t("row")} r="${r}">${HEADER.map((h, i) => `<${t("c")} r="${COLS[i]}${r}" t="s"><${t("v")}>${si(h)}</${t("v")}></${t("c")}>`).join("")}</${t("row")}>`);
  r++;
  rows.push(`<${t("row")} r="${r}"><${t("c")} r="A${r}" s="1"/></${t("row")}>`);
  r++;
  for (const id of o.ids ?? [Number(SYNTH_HARB_ID), Number(SYNTH_HARB_ID), Number(SYNTH_HARB_ID)]) {
    const a = typeof id === "number"
      ? `<${t("c")} r="A${r}"><${t("v")}>${id}</${t("v")}></${t("c")}>`
      : `<${t("c")} r="A${r}" t="str"><${t("v")}>${esc(id)}</${t("v")}></${t("c")}>`;
    rows.push(`<${t("row")} r="${r}">${a}<${t("c")} r="B${r}" t="s"><${t("v")}>${si("בריאות")}</${t("v")}></${t("c")}><${t("c")} r="E${r}" t="s"><${t("v")}>${si("Zz-Company")}</${t("v")}></${t("c")}><${t("c")} r="H${r}"><${t("v")}>120.5</${t("v")}></${t("c")}></${t("row")}>`);
    r++;
  }
  for (const v of o.trailing ?? []) {
    rows.push(`<${t("row")} r="${r}"><${t("c")} r="A${r}" t="inlineStr"><${t("is")}><${t("t")}>${esc(v)}</${t("t")}></${t("is")}></${t("c")}></${t("row")}>`);
    r++;
  }
  const sheet = `<?xml version="1.0" encoding="utf-8"?><${t("worksheet")} ${ns}><${t("dimension")} ref="A1:K${r - 1}"/><${t("sheetData")}>${rows.join("")}</${t("sheetData")}></${t("worksheet")}>`;
  const sheets = 1 + (o.extraSheets ?? 0);
  const book = `<?xml version="1.0" encoding="utf-8"?><${t("workbook")} ${ns}><${t("sheets")}>${
    Array.from({ length: sheets }, (_, i) => `<${t("sheet")} name="Sheet${i + 1}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")
  }</${t("sheets")}></${t("workbook")}>`;
  const sst = `<?xml version="1.0" encoding="utf-8"?><${t("sst")} ${ns} count="${shared.length}" uniqueCount="${shared.length}">${
    shared.map((s) => `<${t("si")}><${t("t")}>${esc(s)}</${t("t")}></${t("si")}>`).join("")
  }</${t("sst")}>`;
  const types = `<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>`;
  const enc = new TextEncoder();
  const parts: Array<[string, string]> = [
    ["[Content_Types].xml", types],
    ["xl/workbook.xml", book],
    ...Array.from({ length: sheets }, (_, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheet] as [string, string]),
    ["xl/sharedStrings.xml", sst],
  ];
  const entries: ZipWriteEntry[] = [];
  for (const [name, xml] of parts) {
    if (name === o.omit) continue;
    const bytes = enc.encode(xml);
    entries.push(o.deflate === false ? { name, bytes } : { name, bytes, deflated: await deflateRaw(bytes) });
  }
  return zipWrite(entries);
}

/** a ZIP whose one entry claims a small size but inflates far past it (zip-bomb shape) */
export async function buildBomb(): Promise<Uint8Array> {
  const big = new Uint8Array(4 * 1024 * 1024); // zeros deflate to a few KB
  const deflated = await deflateRaw(big);
  const z = zipWrite([{ name: "[Content_Types].xml", bytes: new TextEncoder().encode("spreadsheetml") }, { name: "xl/workbook.xml", bytes: big, deflated }]);
  // lie about the uncompressed size in both headers (local at 22, central at 24): claims 1 KB
  const v = new DataView(z.buffer);
  const firstLen = 30 + "[Content_Types].xml".length + "spreadsheetml".length;
  v.setUint32(firstLen + 22, 1024, true);
  for (let i = z.length - 22; i >= 0; i--) {
    if (v.getUint32(i, true) === 0x02014b50 && new TextDecoder().decode(z.subarray(i + 46, i + 46 + 15)) === "xl/workbook.xml") {
      v.setUint32(i + 24, 1024, true);
      break;
    }
  }
  return z;
}
