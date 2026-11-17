// SHA-256 of the answers payload, shown in the signed PDF footer so a printed copy can be matched to the data.
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}
export async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const d = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  throw new Error("SubtleCrypto unavailable");
}
export const hashPayload = (payload: unknown) => sha256Hex(canonicalJson(payload));
