// Minimal TrueType reader: what a PDF writer needs to embed a font (cmap, advance widths, metrics).
export interface TtfInfo {
  bytes: Uint8Array;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  bbox: [number, number, number, number];
  numGlyphs: number;
  gidOf(codePoint: number): number;
  /** advance width in font units */
  advance(gid: number): number;
}

export function parseTtf(bytes: Uint8Array): TtfInfo {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number) => String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
  const numTables = dv.getUint16(4);
  const tables: Record<string, { off: number; len: number }> = {};
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    tables[tag(o)] = { off: dv.getUint32(o + 8), len: dv.getUint32(o + 12) };
  }
  const need = (t: string) => { if (!tables[t]) throw new Error(`font table ${t} missing`); return tables[t].off; };
  const head = need("head");
  const unitsPerEm = dv.getUint16(head + 18);
  const bbox: [number, number, number, number] = [dv.getInt16(head + 36), dv.getInt16(head + 38), dv.getInt16(head + 40), dv.getInt16(head + 42)];
  const hhea = need("hhea");
  const ascent = dv.getInt16(hhea + 4);
  const descent = dv.getInt16(hhea + 6);
  const numH = dv.getUint16(hhea + 34);
  const numGlyphs = dv.getUint16(need("maxp") + 4);
  const hmtx = need("hmtx");
  const advance = (gid: number) => dv.getUint16(hmtx + 4 * Math.min(gid, numH - 1));

  // cmap: prefer format 12 (3,10), then format 4 (3,1)
  const cmap = need("cmap");
  const n = dv.getUint16(cmap + 2);
  let sub12 = -1, sub4 = -1;
  for (let i = 0; i < n; i++) {
    const plat = dv.getUint16(cmap + 4 + i * 8), enc = dv.getUint16(cmap + 6 + i * 8), off = cmap + dv.getUint32(cmap + 8 + i * 8);
    const fmt = dv.getUint16(off);
    if (fmt === 12 && plat === 3 && enc === 10) sub12 = off;
    if (fmt === 4 && ((plat === 3 && enc === 1) || plat === 0)) sub4 = sub4 < 0 ? off : sub4;
  }
  const map = new Map<number, number>();
  if (sub12 >= 0) {
    const groups = dv.getUint32(sub12 + 12);
    for (let g = 0; g < groups; g++) {
      const o = sub12 + 16 + g * 12;
      const s = dv.getUint32(o), e = dv.getUint32(o + 4), gid0 = dv.getUint32(o + 8);
      for (let c = s; c <= e; c++) map.set(c, gid0 + c - s);
    }
  } else if (sub4 >= 0) {
    const segX2 = dv.getUint16(sub4 + 6), seg = segX2 / 2;
    const endO = sub4 + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2;
    for (let i = 0; i < seg; i++) {
      const end = dv.getUint16(endO + i * 2), start = dv.getUint16(startO + i * 2), delta = dv.getInt16(deltaO + i * 2), ro = dv.getUint16(rangeO + i * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid: number;
        if (ro === 0) gid = (c + delta) & 0xffff;
        else {
          const gi = dv.getUint16(rangeO + i * 2 + ro + (c - start) * 2);
          gid = gi === 0 ? 0 : (gi + delta) & 0xffff;
        }
        if (gid) map.set(c, gid);
      }
    }
  } else throw new Error("no usable cmap");
  return { bytes, unitsPerEm, ascent, descent, bbox, numGlyphs, gidOf: (c) => map.get(c) ?? 0, advance };
}
