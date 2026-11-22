// Writes the six sample documents (preview + final of each kind, synthetic values) for a visual check:
//   cd supabase/functions && deno run --allow-write=<dir> _shared/poa/render_sample.ts <dir>
// Never run with real values; the samples are not part of any deploy.
import { parseTtf } from "../pdfkit/ttf.ts";
import { rubikFonts } from "../pdfkit/fonts.ts";
import { decodePng, fromBase64 } from "../pdfkit/png.ts";
import { renderPoa } from "./render.ts";
import { PNG_B64, SYNTH_ID } from "./fixtures.ts";
import { POA_KINDS } from "./engine/types.ts";

declare const Deno: { args: string[]; writeFile(p: string, d: Uint8Array): Promise<void> };

const out = Deno.args[0] ?? ".";
const f = rubikFonts();
const fonts = { regular: parseTtf(f.regular), bold: parseTtf(f.bold) };
const identity = { firstName: "דנה", lastName: "בדיקה", nationalId: SYNTH_ID, street: "הרצל 12", city: "תל אביב", zip: "6473912" };
const licensee = { name: "ישראל ישראלי", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" };
const signature = await decodePng(fromBase64(PNG_B64));
for (const kind of POA_KINDS) {
  await Deno.writeFile(`${out}/${kind}-preview.pdf`, await renderPoa({ kind, identity, licensee, now: new Date() }, fonts));
  await Deno.writeFile(`${out}/${kind}-final.pdf`, await renderPoa({
    kind, identity, licensee, now: new Date(), evidence: { at: new Date(), ip: "203.0.113.9", signature: kind === "policies" ? signature : undefined },
  }, fonts));
}
console.log(`wrote 6 files to ${out}`);
