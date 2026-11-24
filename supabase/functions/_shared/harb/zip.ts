// Minimal ZIP reader and writer for the Har HaBituach path (no dependency: an .xlsx is a ZIP of XML parts, and Surense's
// data-import wants the file inside a ZIP). Reader: central directory only, methods 0 (store) and 8 (deflate, through the
// runtime's DecompressionStream("deflate-raw")), no ZIP64, no encryption, no multi-disk; every entry is inflated with a
// hard output cap (zip bombs end at the cap, never in memory) and checked against its declared size and CRC-32.
// Writer: stored entries (the upload: the payload is an already compressed xlsx) or a deflated payload the caller hands
// over (the test fixtures), with CRC-32 and a proper central directory.
// Errors are ZipError with a short code; nothing here logs or echoes a byte of the content.

export type ZipErrorCode = "not_zip" | "zip_unsupported" | "zip_too_large" | "zip_corrupt";

export class ZipError extends Error {
  readonly code: ZipErrorCode;
  constructor(code: ZipErrorCode) {
    super(code);
    this.name = "ZipError";
    this.code = code;
  }
}

export interface ZipLimits {
  /** most entries in the central directory */
  maxEntries: number;
  /** most bytes one entry may inflate to */
  maxEntryBytes: number;
  /** most bytes all inflated entries together may reach */
  maxTotalBytes: number;
}

export const DEFAULT_ZIP_LIMITS: ZipLimits = { maxEntries: 200, maxEntryBytes: 8 * 1024 * 1024, maxTotalBytes: 24 * 1024 * 1024 };

export interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  size: number;
  crc: number;
  /** offset of the local header */
  offset: number;
}

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;

let CRC_TABLE: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** true when the buffer starts like a ZIP (local file header "PK\x03\x04") */
export function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length >= 30 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/** the central directory of a ZIP; throws ZipError */
export function listZip(bytes: Uint8Array, limits: ZipLimits = DEFAULT_ZIP_LIMITS): ZipEntry[] {
  if (!looksLikeZip(bytes)) throw new ZipError("not_zip");
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (v.getUint32(i, true) === SIG_END) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new ZipError("not_zip");
  const disk = v.getUint16(end + 4, true);
  const cdDisk = v.getUint16(end + 6, true);
  const countDisk = v.getUint16(end + 8, true);
  const count = v.getUint16(end + 10, true);
  const cdSize = v.getUint32(end + 12, true);
  const cdOffset = v.getUint32(end + 16, true);
  if (disk !== 0 || cdDisk !== 0 || countDisk !== count) throw new ZipError("zip_unsupported");
  if (count === 0xffff || cdOffset === 0xffffffff || cdSize === 0xffffffff) throw new ZipError("zip_unsupported"); // ZIP64
  if (count === 0) throw new ZipError("not_zip");
  if (count > limits.maxEntries) throw new ZipError("zip_too_large");
  if (cdOffset + cdSize > end) throw new ZipError("zip_corrupt");
  const out: ZipEntry[] = [];
  const dec = new TextDecoder("utf-8", { fatal: false });
  let p = cdOffset;
  for (let k = 0; k < count; k++) {
    if (p + 46 > end || v.getUint32(p, true) !== SIG_CENTRAL) throw new ZipError("zip_corrupt");
    const flags = v.getUint16(p + 8, true);
    const method = v.getUint16(p + 10, true);
    const crc = v.getUint32(p + 16, true);
    const compressedSize = v.getUint32(p + 20, true);
    const size = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const offset = v.getUint32(p + 42, true);
    if (p + 46 + nameLen > end) throw new ZipError("zip_corrupt");
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (flags & 0x0001) throw new ZipError("zip_unsupported"); // encrypted
    if (method !== 0 && method !== 8) throw new ZipError("zip_unsupported");
    if (compressedSize === 0xffffffff || size === 0xffffffff || offset === 0xffffffff) throw new ZipError("zip_unsupported");
    if (size > limits.maxEntryBytes) throw new ZipError("zip_too_large");
    if (offset + 30 + compressedSize > bytes.length) throw new ZipError("zip_corrupt");
    out.push({ name, method, compressedSize, size, crc, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const total = out.reduce((n, e) => n + e.size, 0);
  if (total > limits.maxTotalBytes) throw new ZipError("zip_too_large");
  return out;
}

async function inflateRaw(data: Uint8Array, cap: number): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(data).catch(() => {});
  writer.close().catch(() => {});
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > cap) {
        await reader.cancel().catch(() => {});
        throw new ZipError("zip_too_large");
      }
      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof ZipError) throw e;
    throw new ZipError("zip_corrupt");
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out;
}

/** the bytes of one entry (inflated, size and CRC checked); throws ZipError */
export async function readEntry(bytes: Uint8Array, e: ZipEntry, limits: ZipLimits = DEFAULT_ZIP_LIMITS): Promise<Uint8Array> {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.getUint32(e.offset, true) !== SIG_LOCAL) throw new ZipError("zip_corrupt");
  const nameLen = v.getUint16(e.offset + 26, true);
  const extraLen = v.getUint16(e.offset + 28, true);
  const start = e.offset + 30 + nameLen + extraLen;
  if (start + e.compressedSize > bytes.length) throw new ZipError("zip_corrupt");
  const raw = bytes.subarray(start, start + e.compressedSize);
  const cap = Math.min(limits.maxEntryBytes, e.size);
  const data = e.method === 0 ? raw : await inflateRaw(raw, cap);
  if (data.byteLength !== e.size) throw new ZipError(data.byteLength > e.size ? "zip_too_large" : "zip_corrupt");
  if (crc32(data) !== e.crc) throw new ZipError("zip_corrupt");
  return data;
}

export interface ZipWriteEntry {
  /** ASCII file name we choose (never user input) */
  name: string;
  /** the entry's bytes */
  bytes: Uint8Array;
  /** the same bytes already deflated (raw): written as method 8; absent = stored (method 0) */
  deflated?: Uint8Array;
}

/** a ZIP of stored entries (method 0): what the harb import uploads (the xlsx inside is compressed already) */
export function zipStored(files: Array<{ name: string; bytes: Uint8Array }>, date = new Date(Date.UTC(2026, 0, 1))): Uint8Array {
  return zipWrite(files.map((f) => ({ name: f.name, bytes: f.bytes })), date);
}

/** a ZIP with a proper central directory; entries stored, or deflated when the caller hands the deflated payload */
export function zipWrite(files: ZipWriteEntry[], date = new Date(Date.UTC(2026, 0, 1))): Uint8Array {
  const enc = new TextEncoder();
  // DOS time/date (local fields; the value only labels the entry)
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const dosDate = ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    if (!/^[A-Za-z0-9._\-[\]/]{1,100}$/.test(f.name) || f.name.includes("..")) throw new ZipError("zip_unsupported");
    const name = enc.encode(f.name);
    const crc = crc32(f.bytes);
    const payload = f.deflated ?? f.bytes;
    const method = f.deflated ? 8 : 0;
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, SIG_LOCAL, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, method, true);
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, payload.byteLength, true);
    lv.setUint32(22, f.bytes.byteLength, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, SIG_CENTRAL, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, method, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, payload.byteLength, true);
    cv.setUint32(24, f.bytes.byteLength, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    locals.push(local, payload);
    centrals.push(central);
    offset += local.byteLength + payload.byteLength;
  }
  const cdSize = centrals.reduce((n, c) => n + c.byteLength, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, SIG_END, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + cdSize + 22);
  let o = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, o);
    o += part.byteLength;
  }
  return out;
}
