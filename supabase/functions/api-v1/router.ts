// api-v1 router. Pure: handle(req, deps) -> Response. index.ts wires Deno.serve around it.
// To add an endpoint: add a Route to ROUTES, document it in docs/platform/openapi.yaml, add a test.
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { HttpError, errorResponse, jsonResponse } from "../_shared/errors.ts";
import { authenticate, requireScope, type Principal, type Verifiers } from "../_shared/auth.ts";
import { rateLimitHeaders, type RateLimiter } from "../_shared/rateLimit.ts";
import { requestIdFor } from "../_shared/request.ts";
import type { Logger } from "../_shared/logger.ts";

export const API_NAME = "seeld-api";
export const API_VERSION = "1.0.0-scaffold";

export interface Deps {
  logger: Logger;
  allowedOrigins: string[];
  commit: string | null;
  now?: () => Date;
  /** Required only once an authenticated route exists. */
  verifiers?: Verifiers;
  limiter?: RateLimiter;
}

export interface RouteCtx {
  req: Request;
  requestId: string;
  principal: Principal | null;
  deps: Deps;
}

export interface Route {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path below the API root, e.g. "/health". */
  path: string;
  /** none = public. user/client/any require credentials. */
  auth: "none" | "user" | "client" | "any";
  scope?: string;
  handler: (ctx: RouteCtx) => Promise<Response> | Response;
}

export const ROUTES: Route[] = [
  {
    method: "GET",
    path: "/health",
    auth: "none",
    handler: ({ requestId, deps }) =>
      jsonResponse({ status: "ok", time: (deps.now?.() ?? new Date()).toISOString() }, requestId, {
        headers: { "cache-control": "no-store" },
      }),
  },
  {
    method: "GET",
    path: "/version",
    auth: "none",
    handler: ({ requestId, deps }) =>
      jsonResponse({ name: API_NAME, apiVersion: API_VERSION, commit: deps.commit }, requestId, {
        headers: { "cache-control": "no-store" },
      }),
  },
];

/** Strip the function mount ("/functions/v1/api-v1", "/api-v1" or "/api/v1") from a pathname. */
export function apiPath(pathname: string): string {
  const m = /^(?:\/functions\/v1)?(?:\/api-v1|\/api\/v1)(\/.*)?$/.exec(pathname);
  const p = m ? (m[1] ?? "/") : pathname;
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const requestId = requestIdFor(req);
  const cors = corsHeaders(req.headers.get("origin"), deps.allowedOrigins);
  const log = deps.logger.child({ requestId });
  const pre = preflight(req, deps.allowedOrigins);
  if (pre) return pre;

  const started = Date.now();
  const path = apiPath(new URL(req.url).pathname);
  let status = 500;
  try {
    const matches = ROUTES.filter((r) => r.path === path);
    if (!matches.length) throw new HttpError("not_found", "Route not found");
    const route = matches.find((r) => r.method === req.method);
    if (!route) {
      throw new HttpError("method_not_allowed", "Method not allowed", { headers: { allow: matches.map((r) => r.method).join(", ") } });
    }

    let principal: Principal | null = null;
    let rl: Record<string, string> = {};
    if (route.auth !== "none") {
      if (!deps.verifiers) throw new HttpError("unavailable", "Authentication is not configured");
      principal = await authenticate(req, deps.verifiers);
      if (route.auth === "user" && principal.kind !== "user") throw new HttpError("forbidden", "User credentials required");
      if (route.auth === "client" && principal.kind !== "client") throw new HttpError("forbidden", "API client credentials required");
      if (route.scope) requireScope(principal, route.scope);
      if (deps.limiter && principal.kind === "client") {
        const d = await deps.limiter.consume(`client:${principal.clientId}`, principal.rateLimitPerMin, 60);
        rl = rateLimitHeaders(d);
        if (!d.allowed) throw new HttpError("rate_limited", "Rate limit exceeded", { headers: rl });
      }
    }

    const res = await route.handler({ req, requestId, principal, deps });
    status = res.status;
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries({ ...cors, ...rl })) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
  } catch (e) {
    const known = e instanceof HttpError;
    status = known ? e.status : 500;
    if (!known) log.error("unhandled", { error: e instanceof Error ? e.message : "unknown" });
    return errorResponse(e, requestId, cors);
  } finally {
    log.info("request", { method: req.method, path, status, ms: Date.now() - started });
  }
}
