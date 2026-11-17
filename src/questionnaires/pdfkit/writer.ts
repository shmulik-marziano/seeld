// Hand-written PDF writer for real, selectable Hebrew text: embedded TrueType (Identity-H CID font + ToUnicode), glyphs positioned one by one
// from a bidi pass but EMITTED IN LOGICAL ORDER (so extraction returns logical Hebrew), tagged structure (Document / H1 / H2 / P / Figure),
// artifacts for decoration, document language, metadata, and an embedded JSON attachment. No dependencies.
import { bidiRtl, MIRROR } from "./bidi";
import type { TtfInfo } from "./ttf";

export interface RawImage { width: number; height: number; rgb: Uint8Array; alpha?: Uint8Array }
export interface DocMeta { title: string; author: string; subject: string; keywords: string; lang: string; created: Date; creator: string }
export type Rgb = [number, number, number];
export type Tag = "P" | "H1" | "H2" | "H3" | "Artifact";

const enc = new TextEncoder();
const hex4 = (n: number) => n.toString(16).padStart(4, "0");
const f = (n: number) => (Math.round(n * 100) / 100).toString();
const utf16Hex = (s: string) => "FEFF" + [...s].map((c) => { const cp = c.codePointAt(0)!; return cp > 0xffff ? hex4(0xd800 + ((cp - 0x10000) >> 10)) + hex4(0xdc00 + ((cp - 0x10000) & 0x3ff)) : hex4(cp); }).join("").toUpperCase();
const pdfDate = (d: Date) => `D:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;

export async function deflate(data: Uint8Array): Promise<{ bytes: Uint8Array; filter: boolean }> {
  try {
    if (typeof CompressionStream === "undefined") return { bytes: data, filter: false };
    const cs = new CompressionStream("deflate");
    const w = cs.writable.getWriter();
    void w.write(data as BufferSource); void w.close();
    const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer());
    return { bytes: buf, filter: true };
  } catch { return { bytes: data, filter: false }; }
}

interface FontVariant { key: string; font: TtfInfo; weight: "R" | "B"; mirrored: boolean; used: Map<number, number> /* gid -> unicode */ }
interface PageState { id: number; ops: string[]; fonts: Set<string>; images: { name: string; ref: number }[]; mcids: number; elemRefsByMcid: number[]; }
interface Elem { type: string; alt?: string; kids: { page: number; mcid: number }[] }

export class PdfDoc {
  readonly W = 595.28;
  readonly H = 841.89;
  private pages: PageState[] = [];
  private variants = new Map<string, FontVariant>();
  private elems: Elem[] = [];
  private block: Elem | null = null;
  private images: { id: number; img: RawImage }[] = [];
  private attachments: { name: string; mime: string; bytes: Uint8Array; desc: string }[] = [];
  private nextId = 1;
  private idOf(): number { return this.nextId++; }
  constructor(private fonts: { regular: TtfInfo; bold: TtfInfo }, private meta: DocMeta) {}

  get pageCount() { return this.pages.length; }
  private cur = 0;
  get page(): PageState { return this.pages[this.cur]; }
  selectPage(i: number) { this.cur = i; }
  addPage(): PageState {
    const p: PageState = { id: this.idOf(), ops: [], fonts: new Set(), images: [], mcids: 0, elemRefsByMcid: [] };
    this.pages.push(p);
    this.cur = this.pages.length - 1;
    return p;
  }
  attach(name: string, mime: string, bytes: Uint8Array, desc: string) { this.attachments.push({ name, mime, bytes, desc }); }

  // ---- font helpers
  private variant(bold: boolean, mirrored: boolean): FontVariant {
    const key = `${bold ? "B" : "R"}${mirrored ? "m" : ""}`;
    let v = this.variants.get(key);
    if (!v) { v = { key, font: bold ? this.fonts.bold : this.fonts.regular, weight: bold ? "B" : "R", mirrored, used: new Map() }; this.variants.set(key, v); }
    return v;
  }
  measure(text: string, size: number, bold = false): number {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    let w = 0;
    for (const ch of text) w += font.advance(font.gidOf(ch.codePointAt(0)!)) * size / font.unitsPerEm;
    return w;
  }
  /** Greedy word wrap on logical text. */
  wrap(text: string, maxW: number, size: number, bold = false): string[] {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/ +/)) {
        const t = line ? `${line} ${word}` : word;
        if (line && this.measure(t, size, bold) > maxW) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  }

  // ---- structure
  beginBlock(type: Tag, alt?: string) { this.block = { type, alt, kids: [] }; this.elems.push(this.block); }
  endBlock() { this.block = null; }
  private mark(tag: Tag, ops: string[]) {
    const pg = this.page;
    if (tag === "Artifact" || !this.block) { pg.ops.push("/Artifact BMC", ...ops, "EMC"); return; }
    const mcid = pg.mcids++;
    this.block.kids.push({ page: this.cur, mcid });
    pg.elemRefsByMcid[mcid] = this.elems.indexOf(this.block);
    pg.ops.push(`/${this.block.type} <</MCID ${mcid}>> BDC`, ...ops, "EMC");
  }

  // ---- drawing
  rect(x: number, y: number, w: number, h: number, c: Rgb) {
    this.mark("Artifact", [`${f(c[0])} ${f(c[1])} ${f(c[2])} rg`, `${f(x)} ${f(y)} ${f(w)} ${f(h)} re f`]);
  }
  hline(x1: number, x2: number, y: number, c: Rgb, wd = 0.5) {
    this.mark("Artifact", [`${f(c[0])} ${f(c[1])} ${f(c[2])} RG ${f(wd)} w ${f(x1)} ${f(y)} m ${f(x2)} ${f(y)} l S`]);
  }
  /** One line of text. align: "right" places the right edge at x, "left" the left edge. Returns the drawn width. */
  text(str: string, o: { x: number; y: number; size: number; bold?: boolean; color?: Rgb; align?: "right" | "left" | "center"; artifact?: boolean; rtl?: boolean }): number {
    const chars = [...str];
    if (!chars.length) return 0;
    const rtlBase = o.rtl !== false;
    const { visual, rtl } = rtlBase ? bidiRtl(str) : { visual: chars.map((_, i) => i), rtl: chars.map(() => false) };
    const bold = !!o.bold;
    const reg = this.variant(bold, false);
    const upm = reg.font.unitsPerEm;
    const gids = chars.map((ch) => reg.font.gidOf(ch.codePointAt(0)!));
    const adv = gids.map((g) => reg.font.advance(g) * o.size / upm);
    const total = adv.reduce((a, b) => a + b, 0);
    const left = o.align === "left" ? o.x : o.align === "center" ? o.x - total / 2 : o.x - total;
    const xs = new Array<number>(chars.length);
    let cur = left;
    for (const i of visual) { xs[i] = cur; cur += adv[i]; }
    const c = o.color ?? [0, 0, 0];
    const ops: string[] = ["BT", `${f(c[0])} ${f(c[1])} ${f(c[2])} rg`];
    let curKey = "";
    chars.forEach((ch, i) => {
      let useMirror = false;
      let gid = gids[i];
      if (rtl[i] && MIRROR[ch]) { const mg = reg.font.gidOf(MIRROR[ch].codePointAt(0)!); if (mg) { gid = mg; useMirror = true; } }
      if (!gid) return;
      const v = useMirror ? this.variant(bold, true) : reg;
      v.used.set(gid, ch.codePointAt(0)!);
      this.page.fonts.add(v.key);
      if (v.key !== curKey) { ops.push(`/F${v.key} ${f(o.size)} Tf`); curKey = v.key; }
      ops.push(`1 0 0 1 ${f(xs[i])} ${f(o.y)} Tm <${hex4(gid)}> Tj`);
    });
    ops.push("ET");
    // ActualText: readers that honour it (Acrobat, pdf.js, screen readers) get the logical line even though glyphs are placed visually
    if (!o.artifact) { ops.unshift(`/Span << /ActualText <${utf16Hex(str)}> >> BDC`); ops.push("EMC"); }
    this.mark(o.artifact ? "Artifact" : "P", ops);
    return total;
  }
  image(img: RawImage, x: number, y: number, w: number, h: number, alt: string | null) {
    const id = this.idOf();
    this.images.push({ id, img });
    const name = `Im${this.page.images.length}`;
    this.page.images.push({ name, ref: id });
    const draw = [`q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(y)} cm /${name} Do Q`];
    if (alt) { this.beginBlock("P"); this.block!.type = "Figure"; this.block!.alt = alt; this.mark("P", draw); this.endBlock(); } else this.mark("Artifact", draw);
  }

  // ---- assembly
  async finish(): Promise<Uint8Array> {
    const parts: Uint8Array[] = [];
    const offsets = new Map<number, number>();
    let len = 0;
    const push = (d: Uint8Array | string) => { const u = typeof d === "string" ? enc.encode(d) : d; parts.push(u); len += u.length; };
    const obj = (id: number, body: (Uint8Array | string)[]) => { offsets.set(id, len); push(`${id} 0 obj\n`); body.forEach(push); push("\nendobj\n"); };
    const stream = async (id: number, dict: string, data: Uint8Array, compress = true) => {
      const z = compress ? await deflate(data) : { bytes: data, filter: false };
      obj(id, [`<< ${dict}${z.filter ? " /Filter /FlateDecode" : ""} /Length ${z.bytes.length} >>\nstream\n`, z.bytes, "\nendstream"]);
    };
    push("%PDF-1.7\n%\xe2\xe3\xcf\xd3\n");

    const catalogId = this.idOf(), pagesId = this.idOf(), infoId = this.idOf(), structRootId = this.idOf(), parentTreeId = this.idOf(), docElemId = this.idOf();
    const elemIds = this.elems.map(() => this.idOf());

    // fonts
    const fontRefs = new Map<string, number>();
    const fileIds: Record<string, { file: number; desc: number }> = {};
    for (const v of this.variants.values()) {
      if (!fileIds[v.weight]) {
        const file = this.idOf(), desc = this.idOf();
        fileIds[v.weight] = { file, desc };
        const fo = v.font;
        const sc = 1000 / fo.unitsPerEm;
        await stream(file, `/Length1 ${fo.bytes.length}`, fo.bytes);
        obj(desc, [`<< /Type /FontDescriptor /FontName /AAAAAA+Rubik-${v.weight === "B" ? "Bold" : "Regular"} /Flags 4 /FontBBox [${fo.bbox.map((n) => Math.round(n * sc)).join(" ")}] /ItalicAngle 0 /Ascent ${Math.round(fo.ascent * sc)} /Descent ${Math.round(fo.descent * sc)} /CapHeight ${Math.round(700)} /StemV 80 /FontFile2 ${file} 0 R >>`]);
      }
      const cid = this.idOf(), type0 = this.idOf(), tu = this.idOf();
      const sc = 1000 / v.font.unitsPerEm;
      const w = [...v.used.keys()].sort((a, b) => a - b).map((g) => `${g} [${Math.round(v.font.advance(g) * sc)}]`).join(" ");
      obj(cid, [`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /AAAAAA+Rubik-${v.weight === "B" ? "Bold" : "Regular"} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fileIds[v.weight].desc} 0 R /CIDToGIDMap /Identity /DW 600 /W [${w}] >>`]);
      const bf = [...v.used.entries()].sort((a, b) => a[0] - b[0]).map(([g, u]) => `<${hex4(g)}> <${utf16Hex(String.fromCodePoint(u)).slice(4)}>`);
      const cmap = `/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CMapName /Adobe-Identity-UCS def /CMapType 2 def 1 begincodespacerange <0000> <FFFF> endcodespacerange ${bf.length} beginbfchar ${bf.join(" ")} endbfchar endcmap CMapName currentdict /CMap defineresource pop end end`;
      await stream(tu, "", enc.encode(cmap));
      obj(type0, [`<< /Type /Font /Subtype /Type0 /BaseFont /AAAAAA+Rubik-${v.weight === "B" ? "Bold" : "Regular"} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`]);
      fontRefs.set(v.key, type0);
    }

    // images
    for (const { id, img } of this.images) {
      let smask = "";
      if (img.alpha) {
        const sid = this.idOf();
        await stream(sid, `/Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceGray /BitsPerComponent 8`, img.alpha);
        smask = ` /SMask ${sid} 0 R`;
      }
      await stream(id, `/Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8${smask}`, img.rgb);
    }

    // pages
    const pageIds = this.pages.map((p) => p.id);
    for (let pi = 0; pi < this.pages.length; pi++) {
      const p = this.pages[pi];
      const cid = this.idOf();
      await stream(cid, "", enc.encode(p.ops.join("\n")));
      const fonts = [...p.fonts].map((k) => `/F${k} ${fontRefs.get(k)} 0 R`).join(" ");
      const xo = p.images.map((im) => `/${im.name} ${im.ref} 0 R`).join(" ");
      obj(p.id, [`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${f(this.W)} ${f(this.H)}] /Resources << /Font << ${fonts} >> /XObject << ${xo} >> >> /Contents ${cid} 0 R /StructParents ${pi} /Tabs /S >>`]);
    }
    obj(pagesId, [`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((i) => `${i} 0 R`).join(" ")}] >>`]);

    // structure tree
    this.elems.forEach((e, i) => {
      const kids = e.kids.map((k) => `<< /Type /MCR /Pg ${pageIds[k.page]} 0 R /MCID ${k.mcid} >>`).join(" ");
      obj(elemIds[i], [`<< /Type /StructElem /S /${e.type} /P ${docElemId} 0 R /Pg ${pageIds[e.kids[0]?.page ?? 0]} 0 R${e.alt ? ` /Alt <${utf16Hex(e.alt)}>` : ""} /K [${kids}] >>`]);
    });
    obj(docElemId, [`<< /Type /StructElem /S /Document /P ${structRootId} 0 R /K [${elemIds.map((i) => `${i} 0 R`).join(" ")}] >>`]);
    const nums = this.pages.map((p, pi) => `${pi} [${p.elemRefsByMcid.map((ei) => `${elemIds[ei]} 0 R`).join(" ")}]`).join(" ");
    obj(parentTreeId, [`<< /Nums [${nums}] >>`]);
    obj(structRootId, [`<< /Type /StructTreeRoot /K [${docElemId} 0 R] /ParentTree ${parentTreeId} 0 R /ParentTreeNextKey ${this.pages.length} /RoleMap << /Figure /Figure >> >>`]);

    // attachments
    const fileSpecs: number[] = [];
    for (const a of this.attachments) {
      const ef = this.idOf(), fs = this.idOf();
      await stream(ef, `/Type /EmbeddedFile /Subtype /${a.mime.replace("/", "#2F")} /Params << /Size ${a.bytes.length} >>`, a.bytes);
      obj(fs, [`<< /Type /Filespec /F (${a.name}) /UF (${a.name}) /Desc <${utf16Hex(a.desc)}> /AFRelationship /Data /EF << /F ${ef} 0 R /UF ${ef} 0 R >> >>`]);
      fileSpecs.push(fs);
    }
    const names = fileSpecs.length ? ` /Names << /EmbeddedFiles << /Names [${fileSpecs.map((id, i) => `(${this.attachments[i].name}) ${id} 0 R`).join(" ")}] >> >> /AF [${fileSpecs.map((i) => `${i} 0 R`).join(" ")}]` : "";
    obj(catalogId, [`<< /Type /Catalog /Pages ${pagesId} 0 R /Lang (${this.meta.lang}) /MarkInfo << /Marked true >> /StructTreeRoot ${structRootId} 0 R /ViewerPreferences << /DisplayDocTitle true /Direction /R2L >>${names} >>`]);
    obj(infoId, [`<< /Title <${utf16Hex(this.meta.title)}> /Author <${utf16Hex(this.meta.author)}> /Subject <${utf16Hex(this.meta.subject)}> /Keywords <${utf16Hex(this.meta.keywords)}> /Creator <${utf16Hex(this.meta.creator)}> /Producer (SEELD questionnaires) /CreationDate (${pdfDate(this.meta.created)}) >>`]);

    const maxId = this.nextId - 1;
    const xref = len;
    push(`xref\n0 ${maxId + 1}\n0000000000 65535 f \n`);
    for (let i = 1; i <= maxId; i++) push(`${String(offsets.get(i) ?? 0).padStart(10, "0")} 00000 ${offsets.has(i) ? "n" : "f"} \n`);
    push(`trailer\n<< /Size ${maxId + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const out = new Uint8Array(len);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
}
