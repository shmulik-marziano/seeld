// CORS helper for new functions (api-v1 and later). Existing functions keep their own copies.
// Allow-list instead of "*": set ALLOWED_ORIGINS (comma separated) as an edge function secret.
// Server-to-server API clients do not send Origin and are unaffected by CORS.

export const DEFAULT_ALLOWED_ORIGINS = ["https://seeld.co.il", "https://www.seeld.co.il"];

export function parseAllowedOrigins(raw: string | undefined | null): string[] {
  const list = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ALLOWED_ORIGINS;
}

export function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-request-id, idempotency-key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Expose-Headers": "x-request-id, retry-after, ratelimit-remaining",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function preflight(req: Request, allowed: string[]): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin"), allowed) });
}
