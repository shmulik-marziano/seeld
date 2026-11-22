// Minimal PNG decoder for the signature image the wizard draws (an 8-bit RGBA canvas export): chunks -> zlib (DecompressionStream)
// -> unfiltered scanlines -> RGB + alpha planes for the PDF writer. 8-bit, non-interlaced gray / gray+alpha / RGB / RGBA /
// palette only; anything else throws PngError (the caller refuses the signature). Size-capped before inflating.
import type { RawImage } from "./writer.ts";

export class PngError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "PngError";
  }
}

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export const MAX_PNG_PIXELS = 4_000_000;

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate");
  const w = ds.writable.getWriter();
  void w.write(data as BufferSource).catch(() => {});
  void w.close().catch(() => {});
  try {
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  } catch {
    throw new PngError("png_inflate");
  }
}

const paeth = (a: number, b: number, c: number) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export async function decodePng(bytes: Uint8Array): Promise<RawImage> {
  if (bytes.length < 33 || SIG.some((b, i) => bytes[i] !== b)) throw new PngError("png_signature");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 8;
  let width = 0, height = 0, depth = 0, color = 0, interlace = 0;
  const idat: Uint8Array[] = [];
  let plte: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  let seenIhdr = false;
  while (off + 8 <= bytes.length) {
    const len = dv.getUint32(off);
    const type = String.fromCharCode(bytes[off + 4], bytes[off + 5], bytes[off + 6], bytes[off + 7]);
    const start = off + 8, end = start + len;
    if (end + 4 > bytes.length) throw new PngError("png_truncated");
    if (type === "IHDR") {
      width = dv.getUint32(start);
      height = dv.getUint32(start + 4);
      depth = bytes[start + 8];
      color = bytes[start + 9];
      interlace = bytes[start + 12];
      seenIhdr = true;
    } else if (type === "PLTE") plte = bytes.subarray(start, end);
    else if (type === "tRNS") trns = bytes.subarray(start, end);
    else if (type === "IDAT") idat.push(bytes.subarray(start, end));
    else if (type === "IEND") break;
    off = end + 4; // + crc
  }
  if (!seenIhdr || !idat.length) throw new PngError("png_chunks");
  if (depth !== 8 || interlace !== 0 || ![0, 2, 3, 4, 6].includes(color)) throw new PngError("png_unsupported");
  if (width < 1 || height < 1 || width * height > MAX_PNG_PIXELS) throw new PngError("png_size");
  if (color === 3 && !plte) throw new PngError("png_palette");
  const channels = color === 0 || color === 3 ? 1 : color === 2 ? 3 : color === 4 ? 2 : 4;
  const stride = width * channels;
  const total = idat.reduce((n, c) => n + c.length, 0);
  const z = new Uint8Array(total);
  let p = 0;
  for (const c of idat) {
    z.set(c, p);
    p += c.length;
  }
  const raw = await inflate(z);
  if (raw.length < (stride + 1) * height) throw new PngError("png_data");

  // unfilter in place into `px`
  const px = new Uint8Array(stride * height);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = px.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0, b = prev[i], c = i >= channels ? prev[i - channels] : 0;
      let v = src[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) v += paeth(a, b, c);
      else if (ft !== 0) throw new PngError("png_filter");
      cur[i] = v & 0xff;
    }
    prev = cur;
  }

  const rgb = new Uint8Array(width * height * 3);
  let alpha: Uint8Array | undefined;
  if (color === 4 || color === 6 || (color === 3 && trns)) alpha = new Uint8Array(width * height);
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * channels;
    if (color === 0) rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = px[s];
    else if (color === 2) { rgb[i * 3] = px[s]; rgb[i * 3 + 1] = px[s + 1]; rgb[i * 3 + 2] = px[s + 2]; }
    else if (color === 3) {
      const k = px[s] * 3;
      rgb[i * 3] = plte![k] ?? 0; rgb[i * 3 + 1] = plte![k + 1] ?? 0; rgb[i * 3 + 2] = plte![k + 2] ?? 0;
      if (alpha) alpha[i] = px[s] < trns!.length ? trns![px[s]] : 255;
    } else if (color === 4) { rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = px[s]; alpha![i] = px[s + 1]; }
    else { rgb[i * 3] = px[s]; rgb[i * 3 + 1] = px[s + 1]; rgb[i * 3 + 2] = px[s + 2]; alpha![i] = px[s + 3]; }
  }
  return { width, height, rgb, ...(alpha ? { alpha } : {}) };
}

/** base64 -> bytes (the signature travels as a PNG data URL; the caller strips the prefix) */
export function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
