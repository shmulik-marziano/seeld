// Small bidi pass for right-to-left paragraphs (base direction RTL). Enough for Hebrew text with Latin words, numbers, dates, phone numbers and
// parentheses: Hebrew runs read right to left, Latin/number runs stay left to right, neutrals follow the surrounding direction.
// Output is a visual left-to-right order of LOGICAL character indices, so a PDF writer can place each glyph while still emitting the text
// in logical order (which is what text extraction tools read).

type Cls = "R" | "L" | "D" | "J" | "N";
const isHebrew = (c: number) => (c >= 0x0590 && c <= 0x05ff) || (c >= 0xfb1d && c <= 0xfb4f);
const isLatin = (c: number) => (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || (c >= 0xc0 && c <= 0x24f);
const isDigit = (c: number) => c >= 0x30 && c <= 0x39;
// separators that stay inside a number or a Latin word when sandwiched between LTR characters
const JOINERS = new Set([0x2e, 0x2c, 0x3a, 0x2f, 0x2d, 0x2b, 0x25, 0x40, 0x27, 0x5f, 0x26, 0x23]);
export const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "«": "»", "»": "«" };

function classify(text: string[]): Cls[] {
  const cls: Cls[] = text.map((ch) => {
    const c = ch.codePointAt(0)!;
    if (isHebrew(c)) return "R";
    if (isDigit(c) || c === 0x2022) return "D"; // the mask bullet travels with digits
    if (isLatin(c)) return "L";
    if (JOINERS.has(c)) return "J";
    return "N";
  });
  // a joiner is LTR only between two LTR characters (letters/digits)
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] !== "J") continue;
    let a = i - 1, b = i + 1;
    while (a >= 0 && cls[a] === "J") a--;
    while (b < cls.length && cls[b] === "J") b++;
    const left = a >= 0 && (cls[a] === "L" || cls[a] === "D");
    const right = b < cls.length && (cls[b] === "L" || cls[b] === "D");
    cls[i] = left && right && i - a <= 1 && b - i <= 1 ? "L" : "N";
  }
  // spaces between two Latin LETTERS ("Anne Marie") stay with the Latin run
  for (let i = 1; i < cls.length - 1; i++) {
    if (text[i] === " " && cls[i] === "N") {
      let a = i - 1, b = i + 1;
      while (a >= 0 && text[a] === " ") a--;
      while (b < cls.length && text[b] === " ") b++;
      if (a >= 0 && b < cls.length && cls[a] === "L" && cls[b] === "L" && /[A-Za-zÀ-ɏ]/.test(text[a]) && /[A-Za-zÀ-ɏ]/.test(text[b])) {
        for (let k = a + 1; k < b; k++) cls[k] = "L";
      }
    }
  }
  return cls;
}

export interface BidiResult {
  /** logical index of the glyph at each visual slot, left to right */
  visual: number[];
  /** per logical index: true when the glyph sits in an RTL run (mirrored characters swap there) */
  rtl: boolean[];
}

export function bidiRtl(input: string): BidiResult {
  const chars = [...input];
  const cls = classify(chars);
  // runs: L/D => ltr, everything else (R and neutral) => rtl
  const runs: { start: number; end: number; ltr: boolean }[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ltr = cls[i] === "L" || cls[i] === "D";
    const last = runs[runs.length - 1];
    if (last && last.ltr === ltr) last.end = i + 1;
    else runs.push({ start: i, end: i + 1, ltr });
  }
  const visual: number[] = [];
  const rtl = new Array<boolean>(chars.length).fill(true);
  for (const r of [...runs].reverse()) {
    if (r.ltr) for (let i = r.start; i < r.end; i++) { visual.push(i); rtl[i] = false; }
    else for (let i = r.end - 1; i >= r.start; i--) visual.push(i);
  }
  return { visual, rtl };
}

/** Logical order -> the string a reader should see (visual left to right), mostly useful in tests. */
export function toVisualString(input: string): string {
  const chars = [...input];
  const { visual, rtl } = bidiRtl(input);
  return visual.map((i) => (rtl[i] && MIRROR[chars[i]] ? MIRROR[chars[i]] : chars[i])).join("");
}
