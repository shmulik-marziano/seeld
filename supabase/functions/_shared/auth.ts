// Auth guard. Verification is injected so this stays pure and testable; api-v1 supplies the
// Supabase-backed verifiers. Two principal kinds:
//   user    : Supabase JWT in Authorization: Bearer <jwt>
//   client  : API client key in x-api-key (see docs/platform/API-CLIENT-AUTH.md)
import { HttpError } from "./errors.ts";

export type Principal =
  | { kind: "user"; userId: string; aal: "aal1" | "aal2" | null }
  | { kind: "client"; clientId: string; scopes: string[]; rateLimitPerMin: number };

export interface Verifiers {
  verifyJwt(token: string): Promise<{ userId: string; aal: "aal1" | "aal2" | null } | null>;
  verifyApiKey(key: string): Promise<{ clientId: string; scopes: string[]; rateLimitPerMin: number } | null>;
}

export async function authenticate(req: Request, v: Verifiers): Promise<Principal> {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const c = await v.verifyApiKey(apiKey);
    if (!c) throw new HttpError("unauthenticated", "Invalid API key");
    return { kind: "client", ...c };
  }
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!m) throw new HttpError("unauthenticated", "Missing credentials");
  const u = await v.verifyJwt(m[1]);
  if (!u) throw new HttpError("unauthenticated", "Invalid token");
  return { kind: "user", ...u };
}

export function requireScope(p: Principal, scope: string): void {
  if (p.kind === "client" && !p.scopes.includes(scope) && !p.scopes.includes("*")) {
    throw new HttpError("forbidden", `Missing scope: ${scope}`);
  }
}

export function requireAal2(p: Principal): void {
  if (p.kind === "user" && p.aal !== "aal2") throw new HttpError("forbidden", "Multi-factor authentication required");
}
