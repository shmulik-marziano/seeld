// Client address for rate limits and Turnstile remoteip. Mirrors private.is_public_ip / private.client_ip (090500):
// cf-connecting-ip when it is a valid public address, else the LAST public hop of x-forwarded-for (the hop appended by
// the platform proxy; anything to its left is client-controlled). The value goes to the DB (hashed there) and to
// Turnstile; it is never logged.

const V4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function v4Octets(s: string): number[] | null {
  const m = V4.exec(s);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  return o.every((n) => n >= 0 && n <= 255) ? o : null;
}

function v4Public(o: number[]): boolean {
  const [a, b] = o;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a >= 224) return false; // multicast / reserved
  return true;
}

export function isPublicIp(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim().replace(/^\[|\]$/g, "");
  if (!s || s.length > 64) return false;
  const o = v4Octets(s);
  if (o) return v4Public(o);
  if (!/^[0-9a-f:.]+$/i.test(s) || (s.match(/:/g) ?? []).length < 2) return false;
  const low = s.toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(low);
  if (mapped) {
    const mo = v4Octets(mapped[1]);
    return mo ? v4Public(mo) : false;
  }
  if (low === "::1" || low === "::") return false;
  if (/^f[cd]/.test(low)) return false; // fc00::/7
  if (/^fe[89ab]/.test(low)) return false; // fe80::/10
  return true;
}

export function clientIp(headers: Headers): string | null {
  const cf = (headers.get("cf-connecting-ip") ?? "").trim();
  if (isPublicIp(cf)) return cf;
  const hops = (headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  for (let i = hops.length - 1; i >= 0; i--) if (isPublicIp(hops[i])) return hops[i];
  return null;
}

/** Which header produced the address: names only, for the secret-gated health view. */
export function ipSource(headers: Headers): { source: "cf-connecting-ip" | "x-forwarded-for" | "none"; xffHops: number } {
  const xffHops = (headers.get("x-forwarded-for") ?? "").split(",").filter((h) => h.trim()).length;
  if (isPublicIp(headers.get("cf-connecting-ip"))) return { source: "cf-connecting-ip", xffHops };
  return { source: clientIp(headers) ? "x-forwarded-for" : "none", xffHops };
}
