// Signed questionnaire PDF: REAL text (selectable, searchable), embedded Rubik (SIL OFL), RTL/bidi handled in pdfkit/, tagged structure,
// language he-IL, metadata, and the answers payload attached as JSON. Lazy-loaded only on the completion step.
import type { Questionnaire } from "./types";
import type { ViewSection } from "./format";
import { PdfDoc } from "./pdfkit/writer";
import type { RawImage, Rgb } from "./pdfkit/writer";
import { parseTtf } from "./pdfkit/ttf";

export interface SignatureData { kind: "drawn" | "typed"; png?: string; name: string }
export interface PdfInput {
  def: Questionnaire;
  sections: ViewSection[];
  signature: SignatureData;
  signerName: string;
  signerIdMasked: string;
  signedAt: Date;
  hash: string;
  declaration: string[];
  sensitive: boolean;
  /** machine-readable copy of the answers, attached to the PDF as answers.json */
  payload: unknown;
}
export interface PdfDeps {
  fonts: { regular: Uint8Array; bold: Uint8Array };
  logo?: RawImage | null;
  signature?: RawImage | null;
}

const NAVY: Rgb = [0.125, 0.224, 0.341];
const GOLD: Rgb = [0.678, 0.514, 0.243];
const CREAM: Rgb = [0.988, 0.973, 0.937];
const INK: Rgb = [0.106, 0.169, 0.251];
const MUTED: Rgb = [0.333, 0.404, 0.486];
const LINE: Rgb = [0.851, 0.871, 0.894];
const ROSE: Rgb = [0.953, 0.867, 0.847];

const M = 48;
const TEAM = "צוות שילד";

/** Pure layout + serialisation (no DOM): used by the browser wrapper and by node checks. */
export async function renderPdfBytes(inp: PdfInput, deps: PdfDeps): Promise<Uint8Array> {
  const doc = new PdfDoc(
    { regular: parseTtf(deps.fonts.regular), bold: parseTtf(deps.fonts.bold) },
    { title: `${inp.def.title} (חתום)`, author: TEAM, subject: `שאלון ${inp.def.key}, גרסה ${inp.def.version}`, keywords: `${inp.def.key}, שאלון, שילד`, lang: "he-IL", created: inp.signedAt, creator: "שילד ביטוח ופיננסים" },
  );
  const R = doc.W - M;
  const stamp = inp.signedAt.toLocaleString("he-IL", { dateStyle: "long", timeStyle: "short" });
  let y = 0;

  const header = (first: boolean) => {
    doc.addPage();
    doc.rect(0, doc.H - 70, doc.W, 70, NAVY);
    doc.rect(0, doc.H - 73, doc.W, 3, GOLD);
    if (deps.logo) { doc.rect(M - 6, doc.H - 56, 80, 38, CREAM); doc.image(deps.logo, M, doc.H - 54, 68, 34, null); }
    if (first) {
      doc.beginBlock("H1");
      doc.text(inp.def.title, { x: R, y: doc.H - 36, size: 20, bold: true, color: CREAM });
      doc.endBlock();
      doc.text("שילד ביטוח ופיננסים · עותק השאלון", { x: R, y: doc.H - 55, size: 9.5, color: [0.84, 0.89, 0.94], artifact: true });
    } else {
      doc.text(inp.def.title, { x: R, y: doc.H - 42, size: 12, bold: true, color: CREAM, artifact: true });
    }
    y = doc.H - 100;
  };
  const need = (h: number) => { if (y - h < 80) header(false); };

  header(true);
  doc.beginBlock("P");
  doc.text(`${inp.def.key} · גרסה ${inp.def.version} · נחתם ${stamp}`, { x: R, y, size: 9.5, color: MUTED });
  doc.endBlock();
  y -= 22;
  if (inp.sensitive) {
    doc.rect(M, y - 8, doc.W - 2 * M, 24, ROSE);
    doc.beginBlock("P");
    doc.text("הקובץ הזה כולל מידע בריאותי. כדאי לשמור אותו במקום מאובטח.", { x: R - 8, y, size: 10, bold: true, color: INK });
    doc.endBlock();
    y -= 34;
  }

  for (const s of inp.sections) {
    need(70);
    doc.beginBlock("H2");
    doc.text(s.title, { x: R, y, size: 13.5, bold: true, color: NAVY });
    doc.endBlock();
    doc.rect(R - 46, y - 6, 46, 1.6, GOLD);
    y -= 26;
    for (const r of s.rows) {
      const labelLines = doc.wrap(r.label, doc.W - 2 * M, 8.5);
      const valueLines = doc.wrap(r.text, doc.W - 2 * M - 10, 10.5, true);
      need(labelLines.length * 11.5 + valueLines.length * 14 + 14);
      doc.beginBlock("P");
      for (const l of labelLines) { doc.text(l, { x: R, y, size: 8.5, color: MUTED }); y -= 11.5; }
      for (const l of valueLines) { doc.text(l, { x: R - 8, y, size: 10.5, bold: true, color: INK }); y -= 14; }
      doc.endBlock();
      doc.hline(M, R, y + 4, LINE);
      y -= 9;
    }
    y -= 8;
  }

  // declaration + signature
  need(230);
  doc.beginBlock("H2");
  doc.text("הצהרה וחתימה", { x: R, y, size: 13.5, bold: true, color: NAVY });
  doc.endBlock();
  doc.rect(R - 46, y - 6, 46, 1.6, GOLD);
  y -= 26;
  for (const para of inp.declaration) {
    const ls = doc.wrap(para, doc.W - 2 * M, 10);
    need(ls.length * 14 + 10);
    doc.beginBlock("P");
    for (const l of ls) { doc.text(l, { x: R, y, size: 10, color: INK }); y -= 14; }
    doc.endBlock();
    y -= 6;
  }
  need(120);
  y -= 8;
  const boxTop = y;
  doc.hline(M, M + 230, boxTop, LINE, 0.8);
  doc.hline(M, M + 230, boxTop - 78, LINE, 0.8);
  if (deps.signature) {
    const sc = Math.min(220 / deps.signature.width, 68 / deps.signature.height);
    doc.image(deps.signature, M + 5, boxTop - 74, deps.signature.width * sc, deps.signature.height * sc, "חתימת הלקוח");
  } else {
    doc.beginBlock("P");
    doc.text(inp.signature.name, { x: M + 115, y: boxTop - 46, size: 20, bold: true, color: NAVY, align: "center" });
    doc.endBlock();
  }
  doc.beginBlock("P");
  doc.text(`שם: ${inp.signerName}`, { x: R, y: boxTop - 16, size: 10.5, bold: true, color: INK });
  doc.text(`תעודת זהות: ${inp.signerIdMasked}`, { x: R, y: boxTop - 34, size: 10.5, bold: true, color: INK });
  doc.text(`תאריך ושעה: ${stamp}`, { x: R, y: boxTop - 52, size: 10.5, bold: true, color: INK });
  doc.text(inp.signature.kind === "drawn" ? "חתימה ידנית על המסך" : "חתימה בהקלדת שם מלא", { x: R, y: boxTop - 68, size: 8.5, color: MUTED });
  doc.endBlock();
  y = boxTop - 96;

  // footer on every page (artifact): key+version, page n of N, SHA-256
  const total = doc.pageCount;
  for (let i = 0; i < total; i++) {
    doc.selectPage(i);
    doc.hline(M, R, 62, LINE);
    doc.text(`${inp.def.key} · גרסה ${inp.def.version} · עמוד ${i + 1} מתוך ${total}`, { x: R, y: 46, size: 8.5, color: MUTED, artifact: true });
    doc.text(`SHA-256 ${inp.hash}`, { x: M, y: 30, size: 6.5, color: MUTED, align: "left", artifact: true, rtl: false });
  }
  doc.attach("answers.json", "application/json", new TextEncoder().encode(JSON.stringify(inp.payload, null, 2)), "תשובות השאלון בפורמט JSON");
  return doc.finish();
}

// ---------------------------------------------------------------- browser wrapper
async function getBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
function loadRaw(src: string): Promise<RawImage | null> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext("2d")!;
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const n = c.width * c.height;
        const rgb = new Uint8Array(n * 3), alpha = new Uint8Array(n);
        for (let i = 0; i < n; i++) { rgb[i * 3] = d[i * 4]; rgb[i * 3 + 1] = d[i * 4 + 1]; rgb[i * 3 + 2] = d[i * 4 + 2]; alpha[i] = d[i * 4 + 3]; }
        res({ width: c.width, height: c.height, rgb, alpha });
      } catch { res(null); }
    };
    img.onerror = () => res(null);
    img.src = src;
  });
}

export async function buildSignedPdf(inp: PdfInput): Promise<Blob> {
  const [regular, bold, logo, signature] = await Promise.all([
    getBytes("/fonts/Rubik-Regular.ttf"), getBytes("/fonts/Rubik-Bold.ttf"), loadRaw("/brand/logo.png"), inp.signature.png ? loadRaw(inp.signature.png) : Promise.resolve(null),
  ]);
  const bytes = await renderPdfBytes(inp, { fonts: { regular, bold }, logo, signature });
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
