// Mock adapter only: a one-page draft PDF marked "טיוטה, טרם אושר", with the document's display title and NO legal
// text, no names, no licence, no ID. Loaded through a dynamic import from api.ts, so it stays out of every entry.
// Reuses the in-house writer (pure TypeScript, browser-safe). No attach() (spec §4).
import { PdfDoc } from "@/questionnaires/pdfkit/writer";
import { parseTtf } from "@/questionnaires/pdfkit/ttf";
import type { PoaKind } from "./config";
import { POA_COPY } from "./copy";

const bytes = async (u: string) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(String(r.status));
  return new Uint8Array(await r.arrayBuffer());
};

export async function draftPdf(kind: PoaKind, fonts?: { regular: Uint8Array; bold: Uint8Array }): Promise<Blob> {
  const f = fonts ?? { regular: await bytes("/fonts/Rubik-Regular.ttf"), bold: await bytes("/fonts/Rubik-Bold.ttf") };
  const title = POA_COPY.docTitle[kind];
  const doc = new PdfDoc(
    { regular: parseTtf(f.regular), bold: parseTtf(f.bold) },
    { title, author: POA_COPY.draftAuthor, subject: `${kind} draft`, keywords: kind, lang: "he-IL", created: new Date(), creator: "poa mock" },
  );
  doc.addPage();
  const R = doc.W - 48;
  doc.beginBlock("H1"); doc.text(POA_COPY.draftMark, { x: R, y: doc.H - 80, size: 22, bold: true }); doc.endBlock();
  doc.beginBlock("P"); doc.text(title, { x: R, y: doc.H - 120, size: 14 }); doc.endBlock();
  const out = await doc.finish();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}
