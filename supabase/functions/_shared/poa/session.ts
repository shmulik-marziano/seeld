// Session token: 32 random bytes, base64url, returned to the browser once. Only its SHA-256 (hex) ever reaches the
// database; the database never sees the token itself.
export const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
export const HASH_RE = /^[0-9a-f]{64}$/;

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export function generateToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

export const hashToken = (token: string) => sha256Hex(token);
