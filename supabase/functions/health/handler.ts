// health: coarse public probe for site-watch (FOUNDATION §7, §13). GET returns exactly {ok, degraded, cma_age_bucket}
// from api.health() (anon-granted). Two richer views, never public:
//   x-cron-secret header      -> adds "edge": function config presence (names/booleans), region, IP header source
//   Authorization: Bearer JWT -> adds "staff": staff.ops_health() as that staff user (needs 'staff' exposed);
//                                a refused token only drops the staff view (the probe still answers 200/503 as usual)
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import type { RateLimiter } from "../_shared/rateLimit.ts";
import { requestIdFor } from "../_shared/request.ts";
import { createRpc, type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import { type Env, envPresence } from "../_shared/env.ts";
import { clientIp, ipSource } from "../_shared/ip.ts";
import { hasCronSecret, shortHash } from "../_shared/secret.ts";

export interface HealthDeps {
  env: Env;
  /** client for api.health (publishable key preferred; it is anon-granted) */
  rpc: Rpc | null;
  log: Logger;
  limiter: RateLimiter;
  fetch?: FetchFn;
}

export type PublicHealth = { ok: boolean; degraded: boolean; cma_age_bucket: string };

const BUCKETS = ["none", "fresh", "aging", "stale"];

export function coarse(v: unknown): PublicHealth {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    ok: o.ok === true,
    degraded: o.degraded !== false,
    cma_age_bucket: typeof o.cma_age_bucket === "string" && BUCKETS.includes(o.cma_age_bucket) ? o.cma_age_bucket : "unknown",
  };
}

export function createHealthHandler(d: HealthDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const rid = requestIdFor(req);
    const cors = corsHeaders(req.headers.get("origin"), d.env.allowedOrigins);
    const pre = preflight(req, d.env.allowedOrigins);
    if (pre) return pre;
    const log = d.log.child({ requestId: rid });
    const headers = { ...cors, "cache-control": "no-store" };
    try {
      if (req.method !== "GET") throw new HttpError("method_not_allowed", "GET only");
      const ip = clientIp(req.headers);
      const mem = await d.limiter.consume(`health:${ip ? await shortHash(ip) : "none"}`, 60, 60);
      if (!mem.allowed) throw new HttpError("rate_limited", "Too many requests", { headers: { "retry-after": String(mem.retryAfterSec) } });

      let body: PublicHealth & Record<string, unknown>;
      let status = 200;
      if (!d.rpc) {
        log.error("health not configured");
        body = { ok: false, degraded: true, cma_age_bucket: "unknown" };
        status = 503;
      } else {
        try {
          body = coarse(await d.rpc.call("health"));
        } catch (e) {
          log.error("api.health failed", { code: e instanceof RpcError ? e.code : "unknown", status: e instanceof RpcError ? e.status : 0 });
          body = { ok: false, degraded: true, cma_age_bucket: "unknown" };
          status = 503;
        }
      }

      if (await hasCronSecret(req, d.env.cronSecret)) {
        body = { ...body, edge: { ...envPresence(d.env), region: d.env.region, version: d.env.version, ip: ipSource(req.headers) } };
      }
      const bearer = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/i.exec(req.headers.get("authorization") ?? "")?.[1];
      if (bearer && bearer.split(".").length === 3 && d.env.supabaseUrl && d.env.publishableKey) {
        try {
          const staff = createRpc({ url: d.env.supabaseUrl, apikey: d.env.publishableKey, bearer, schema: "staff", fetch: d.fetch });
          body = { ...body, staff: await staff.call("ops_health") };
        } catch (e) {
          // never let a stray Authorization header (e.g. a legacy anon JWT from a monitor) turn the public probe
          // into an error: drop the staff view and answer the public body as usual
          log.warn("staff ops_health refused; public body only", {
            code: e instanceof RpcError ? e.code : "unknown",
            status: e instanceof RpcError ? e.status : 0,
          });
        }
      }
      return jsonResponse(body, rid, { status, headers });
    } catch (e) {
      return errorResponse(e, rid, headers);
    }
  };
}
