// Server-side rendering of the three documents (the "native" engine, spec 1ב): the approved wording of templates.ts laid out
// like the tool's own files (A4, right to left, Rubik), the personal values filled in, and, for a final document, the
// evidence block (name, date, time, address) and the drawn signature (policies only, as in the tool). A preview carries no
// evidence and a visible "not yet approved" mark. Pure: bytes in, bytes out; nothing is logged.
import { PdfDoc, type RawImage, type Rgb } from "../pdfkit/writer.ts";
import type { TtfInfo } from "../pdfkit/ttf.ts";
import type { PoaKind } from "./engine/types.ts";
import { DOC_TITLE, EVIDENCE, fill, HARBIT, MASLAKA, POLICIES, PREVIEW_MARK } from "./templates.ts";

export interface RenderIdentity {
  firstName: string;
  lastName: string;
  nationalId: string;
  street: string;
  city: string;
  zip: string;
}
export interface Licensee {
  name: string;
  license: string;
  phone: string;
  email: string;
}
export interface Evidence {
  /** approval instant */
  at: Date;
  ip: string;
  /** decoded signature image (policies) */
  signature?: RawImage;
}
export interface RenderInput {
  kind: PoaKind;
  identity: RenderIdentity;
  licensee: Licensee;
  /** absent = preview */
  evidence?: Evidence;
  /** creation time stamped into the file's metadata */
  now: Date;
}

export const PAGE_MARGIN = 48;
const BLACK: Rgb = [0, 0, 0];
const GREY: Rgb = [0.45, 0.45, 0.45];
const LINE: Rgb = [0.2, 0.2, 0.2];

const TZ = "Asia/Jerusalem";
/** dd/mm/yyyy and hh:mm:ss in Israel (what the tool prints) */
export function stampParts(at: Date): { date: string; time: string } {
  const p = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o }).format(at);
  return { date: p({ day: "2-digit", month: "2-digit", year: "numeric" }), time: p({ hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) };
}

export function fullName(i: RenderIdentity): string {
  return `${i.firstName} ${i.lastName}`.trim();
}

export function fieldValues(i: RenderIdentity, l: Licensee): Record<string, string> {
  return {
    name: fullName(i), nid: i.nationalId, address: `${i.street}, ${i.city} ${i.zip}`,
    lname: l.name, license: l.license, lphone: l.phone, lemail: l.email,
  };
}

/** top-down flow of right-aligned paragraphs with page breaks */
class Flow {
  y: number;
  readonly right: number;
  readonly left: number;
  readonly width: number;
  constructor(readonly doc: PdfDoc, readonly bottom = PAGE_MARGIN + 60) {
    this.right = doc.W - PAGE_MARGIN;
    this.left = PAGE_MARGIN;
    this.width = this.right - this.left;
    this.y = doc.H - PAGE_MARGIN - 10;
  }
  need(h: number) {
    if (this.y - h < this.bottom) {
      this.doc.addPage();
      this.y = this.doc.H - PAGE_MARGIN - 10;
    }
  }
  gap(h: number) {
    this.y -= h;
  }
  para(text: string, o: { size?: number; bold?: boolean; align?: "right" | "left" | "center"; color?: Rgb; lead?: number; tag?: "P" | "H1" | "H2"; underline?: boolean } = {}) {
    const size = o.size ?? 10.5;
    const lead = o.lead ?? size * 1.45;
    const lines = this.doc.wrap(text, this.width, size, o.bold);
    this.need(lead * lines.length);
    this.doc.beginBlock(o.tag ?? "P");
    for (const ln of lines) {
      this.y -= lead;
      const x = o.align === "left" ? this.left : o.align === "center" ? this.left + this.width / 2 : this.right;
      const w = this.doc.text(ln, { x, y: this.y, size, bold: o.bold, color: o.color, align: o.align ?? "right" });
      if (o.underline) {
        const x1 = o.align === "left" ? this.left : o.align === "center" ? x - w / 2 : this.right - w;
        this.doc.hline(x1, x1 + w, this.y - 2, o.color ?? BLACK, 0.6);
      }
    }
    this.doc.endBlock();
  }
}

/** two signature slots on one row: the right one (client / insured) and the left one (date). Returns the baseline y of the labels. */
function signatureRow(fl: Flow, o: { rightLabel: string; leftLabel: string; rightLines?: string[]; leftLines?: string[]; image?: RawImage; bold?: boolean }) {
  const doc = fl.doc;
  const slotW = 150;
  const rightX = fl.right - 20; // right slot's right edge
  const leftX = fl.left + 20 + slotW; // left slot's right edge
  const stackH = 14 * Math.max(o.rightLines?.length ?? 0, o.leftLines?.length ?? 0) + (o.image ? 58 : 0) + 42;
  fl.need(stackH);
  let y = fl.y;
  if (o.image) {
    const h = 48, w = Math.min(slotW, (o.image.width / o.image.height) * h);
    doc.image(o.image, rightX - w, y - h, w, h, "חתימה");
    y -= h + 4;
  }
  const n = Math.max(o.rightLines?.length ?? 0, o.leftLines?.length ?? 0);
  for (let i = 0; i < n; i++) {
    y -= 13;
    const r = o.rightLines?.[i];
    const l = o.leftLines?.[i];
    doc.beginBlock("P");
    if (r) doc.text(r, { x: rightX, y, size: 9.5, bold: o.bold });
    if (l) doc.text(l, { x: leftX, y, size: 9.5, bold: o.bold });
    doc.endBlock();
  }
  y -= 8;
  doc.hline(rightX - slotW, rightX, y, LINE, 0.7);
  doc.hline(leftX - slotW, leftX, y, LINE, 0.7);
  y -= 13;
  doc.beginBlock("P");
  doc.text(o.rightLabel, { x: rightX - slotW / 2, y, size: 10, align: "center" });
  doc.text(o.leftLabel, { x: leftX - slotW / 2, y, size: 10, align: "center" });
  doc.endBlock();
  fl.y = y - 6;
}

function evidenceLine(ev: Evidence | undefined, name: string): string | null {
  if (!ev) return null;
  const { date, time } = stampParts(ev.at);
  return fill(EVIDENCE, { name, date, time, ip: ev.ip });
}

function dateLines(ev: Evidence | undefined): string[] {
  if (!ev) return [];
  const { date, time } = stampParts(ev.at);
  return [`${date} ${time}`];
}

function previewMark(doc: PdfDoc) {
  doc.text(PREVIEW_MARK, { x: PAGE_MARGIN, y: doc.H - PAGE_MARGIN + 14, size: 9, color: GREY, align: "left", artifact: true });
}

function checkbox(doc: PdfDoc, x: number, y: number, checked: boolean) {
  const s = 8;
  doc.box(x - s, y - 1, s, s, LINE, 0.7);
  if (checked) {
    doc.line(x - s + 1.5, y + 3, x - s / 2, y + 0.5, BLACK, 1);
    doc.line(x - s / 2, y + 0.5, x - 1.5, y + s - 1.5, BLACK, 1);
  }
}

function renderMaslaka(doc: PdfDoc, v: Record<string, string>, ev: Evidence | undefined) {
  const T = MASLAKA;
  const fl = new Flow(doc, PAGE_MARGIN + 92);
  fl.para(T.salutation, { size: 11 });
  fl.gap(4);
  fl.para(T.title, { size: 12, bold: true, align: "center", underline: true, tag: "H1" });
  fl.gap(8);
  fl.para(T.grantor, { bold: true, tag: "H2" });
  for (const l of T.grantorLines) fl.para(fill(l, v));
  fl.gap(6);
  fl.para(T.grantee, { bold: true, tag: "H2" });
  for (const l of T.granteeLines) fl.para(fill(l, v));
  fl.gap(6);
  // "אשר הינו:" + three boxes on one line
  fl.need(30);
  fl.y -= 15;
  doc.beginBlock("P");
  let x = fl.right;
  x -= doc.text(T.roleLabel, { x, y: fl.y, size: 10.5 }) + 10;
  for (const r of T.roles) {
    checkbox(doc, x, fl.y, r.checked);
    x -= 12;
    x -= doc.text(r.text, { x, y: fl.y, size: 10.5 }) + 14;
  }
  doc.endBlock();
  fl.para(T.roleNote, { underline: true });
  fl.gap(10);
  for (const p of T.body) {
    fl.para(p);
    fl.gap(4);
  }
  fl.para(T.attention, { bold: true });
  fl.gap(10);
  fl.para(T.validity, { bold: true, align: "center" });
  fl.gap(8);
  fl.para(T.witness, { bold: true });
  fl.gap(26);
  const name = v.name;
  const line = evidenceLine(ev, name);
  signatureRow(fl, { rightLabel: T.signClient, leftLabel: T.signDate, rightLines: line ? doc.wrap(line, 150, 9.5, true) : [], leftLines: dateLines(ev), bold: true });
  if (line) {
    fl.gap(6);
    fl.para(line, { size: 10, bold: true, align: "center" });
  }
  // footnotes pinned to the page bottom (the flow's bottom margin keeps the body above them)
  const fy = PAGE_MARGIN + 84;
  doc.hline(fl.left, fl.right, fy + 2, LINE, 0.5);
  let y = fy - 8;
  doc.beginBlock("P");
  for (const f of T.footnotes) {
    for (const ln of doc.wrap(f, fl.width, 6.5)) {
      doc.text(ln, { x: fl.right, y, size: 6.5 });
      y -= 8.5;
    }
  }
  doc.endBlock();

  // page 2: the exclusions annex (empty, as the tool prints it)
  doc.addPage();
  const A = T.annex;
  const f2 = new Flow(doc);
  f2.para(A.title, { size: 12, bold: true, align: "center", underline: true, tag: "H1" });
  f2.gap(10);
  f2.para(A.to);
  f2.para(A.toSub, { size: 9.5 });
  f2.gap(8);
  f2.para(A.subject, { bold: true, underline: true });
  f2.gap(6);
  f2.para(A.clientName);
  f2.para(A.clientId);
  f2.gap(6);
  f2.para(A.intro);
  f2.gap(6);
  // table: header + 5 empty rows
  const rowH = 20, cols = 2, tw = f2.width, cw = tw / cols;
  f2.need(rowH * 6 + 4);
  const top = f2.y;
  for (let r = 0; r <= 5; r++) doc.hline(f2.left, f2.right, top - r * rowH, LINE, 0.6);
  for (let c = 0; c <= cols; c++) doc.line(f2.left + c * cw, top, f2.left + c * cw, top - 5 * rowH, LINE, 0.6);
  doc.beginBlock("P");
  A.columns.forEach((h, i) => doc.text(h, { x: f2.right - i * cw - cw / 2, y: top - 14, size: 9.5, bold: true, align: "center" }));
  doc.endBlock();
  f2.y = top - 5 * rowH - 10;
  for (const n of A.notes) f2.para(n, { size: 9 });
  f2.gap(10);
  f2.para(A.witness, { bold: true });
  f2.gap(22);
  signatureRow(f2, { rightLabel: A.signClient, leftLabel: A.signDate });
  f2.gap(10);
  f2.para(A.footer, { size: 9.5 });
}

function renderHarbit(doc: PdfDoc, v: Record<string, string>, ev: Evidence | undefined) {
  const T = HARBIT;
  const fl = new Flow(doc, PAGE_MARGIN + 40);
  fl.para(T.title, { size: 12, bold: true, align: "center", underline: true, tag: "H1" });
  fl.gap(30);
  fl.para(T.to, { size: 11 });
  fl.gap(4);
  fl.para(T.greeting, { size: 11 });
  fl.gap(14);
  fl.para(fill(T.clause1, v), { size: 11 });
  fl.gap(6);
  fl.para(T.clause2, { size: 11 });
  fl.gap(22);
  const line = evidenceLine(ev, v.name);
  signatureRow(fl, { rightLabel: T.signInsured, leftLabel: T.signDate, rightLines: line ? doc.wrap(line, 150, 9.5, true) : [], leftLines: dateLines(ev), bold: true });
  fl.gap(40);
  fl.para(fill(T.licenseeIntro, v), { size: 11 });
  fl.gap(6);
  for (const c of T.licenseeClauses) {
    fl.para(c, { size: 11 });
    fl.gap(4);
  }
  fl.gap(18);
  signatureRow(fl, {
    rightLabel: T.signLicensee, leftLabel: T.signDate,
    rightLines: ev ? doc.wrap(fill(T.licenseeLocked, v), 150, 9.5, true) : [], leftLines: dateLines(ev), bold: true,
  });
  // footnote at the bottom
  doc.hline(fl.left, fl.right, PAGE_MARGIN + 18, LINE, 0.5);
  doc.beginBlock("P");
  doc.text(T.footnote, { x: fl.right, y: PAGE_MARGIN + 6, size: 7 });
  doc.endBlock();
}

function renderPolicies(doc: PdfDoc, v: Record<string, string>, ev: Evidence | undefined) {
  const T = POLICIES;
  const fl = new Flow(doc, PAGE_MARGIN + 40);
  fl.para(T.title, { size: 12, bold: true, align: "center", underline: true, tag: "H1" });
  fl.gap(40);
  fl.para(T.forInsurer, { size: 11 });
  fl.gap(14);
  fl.para(T.me, { size: 11 });
  fl.para(fill(T.nameLine, v), { size: 11, bold: true });
  fl.para(fill(T.idLine, v), { size: 11, bold: true });
  fl.para(fill(T.grant, v), { size: 11 });
  fl.gap(8);
  fl.para(T.allPolicies, { size: 11, bold: true });
  fl.gap(30);
  fl.para(T.scope, { size: 11 });
  fl.gap(8);
  fl.para(T.validity, { size: 11 });
  fl.gap(40);
  signatureRow(fl, { rightLabel: T.signCandidate, leftLabel: T.signDate, leftLines: ev ? [stampParts(ev.at).date] : [], image: ev?.signature, bold: true });
  const line = evidenceLine(ev, v.name);
  if (line) {
    doc.beginBlock("P");
    doc.text(line, { x: fl.left + fl.width / 2, y: PAGE_MARGIN + 10, size: 10, bold: true, align: "center" });
    doc.endBlock();
  }
}

export async function renderPoa(input: RenderInput, fonts: { regular: TtfInfo; bold: TtfInfo }): Promise<Uint8Array> {
  const title = DOC_TITLE[input.kind];
  const doc = new PdfDoc(fonts, {
    title, author: input.licensee.name, subject: title, keywords: input.kind, lang: "he-IL", created: input.now, creator: "SEELD POA",
  });
  doc.addPage();
  if (!input.evidence) previewMark(doc);
  const v = fieldValues(input.identity, input.licensee);
  if (input.kind === "maslaka") renderMaslaka(doc, v, input.evidence);
  else if (input.kind === "harbit") renderHarbit(doc, v, input.evidence);
  else renderPolicies(doc, v, input.evidence);
  return await doc.finish();
}
