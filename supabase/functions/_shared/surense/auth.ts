// OAuth 2.0 client_credentials for Surense. Verified live 2026-11-20 (README section 6): POST /oauth/token with an
// application/x-www-form-urlencoded body (grant_type, client_id, client_secret) -> 200 {access_token, token_type:
// "Bearer", expires_in: 3600, scope}. The token lives in memory only, per isolate: a bearer token stored in the DB
// would be a secret at rest. Concurrent callers share one refresh (single flight); the token is dropped 60 s before
// expiry and on any 401 (the client then fetches a fresh one once).
//
// Scope check: the token response carries `scope`, one space-delimited string (RFC 6749 section 3.3; verified live).
// After each token fetch it is compared with REQUIRED_SCOPES and a warning is logged (never thrown) for each missing
// scope and for any *:delete scope (the key must be created without delete rights). Scope names only; no token.
import type { FetchFn } from "../db.ts";
import { createLogger, type Logger } from "../logger.ts";
import { isRedirect } from "./client.ts";
import { SurenseError, fromResponse } from "./errors.ts";

export const TOKEN_URL = "https://api.surense.com/oauth/token";

/** Scopes the wrappers in api.ts need, by the exact names in the OpenAPI security blocks (openapi.json / apis.md,
 *  2026-11-20). Endpoints whose spec lists no scope (proxies invite, documents search/urls/upload, e9100 download,
 *  data-import initiate/start/get, licensees/{id}, customer portfolio) add nothing here. */
export const REQUIRED_SCOPES = [
  "customers:read", // customers search/get/brief, portfolio history
  "customers:create", // POST /customers, POST /customers/lead_customer
  "leads:create", // POST /leads
  "leads:read", // POST /leads/search
  "licensees:list", // GET /licensees
  "swiftness:accounts:list", // GET /swiftness/accounts/list
  "swiftness:phishing:request", // POST /swiftness/e9100/events (E9100 request)
  "data_import:import", // GET /data-import/providers
  "global:user", // GET /documents/types
] as const;

export interface ScopeReport {
  /** false when the response had no `scope` string (nothing could be checked) */
  present: boolean;
  granted: string[];
  missing: string[];
  /** granted scopes that allow deletions (customers:delete, customers:delete_my_items, leads:delete, ...) */
  deleteScopes: string[];
}

/** Pure: parse the space-delimited scope string and compare it with `required`. */
export function checkScopes(scope: unknown, required: readonly string[] = REQUIRED_SCOPES): ScopeReport {
  if (typeof scope !== "string") return { present: false, granted: [], missing: [], deleteScopes: [] };
  const granted = [...new Set(scope.split(/\s+/).filter(Boolean))];
  const have = new Set(granted);
  return {
    present: true,
    granted,
    missing: required.filter((s) => !have.has(s)),
    deleteScopes: granted.filter((s) => /:delete(?:_|:|$)/.test(s)),
  };
}

/** Logs the report (warnings only; a missing scope surfaces later as a 400/40000 on that call). */
export function logScopes(log: Logger, r: ScopeReport): void {
  if (!r.present) {
    log.warn("surense token without scope field", { check: "scopes" });
    return;
  }
  if (r.missing.length) log.warn("surense token missing required scopes", { missing: r.missing, granted_count: r.granted.length });
  if (r.deleteScopes.length) log.warn("surense token has delete scopes (key should be created without them)", { deleteScopes: r.deleteScopes });
}
export const TOKEN_MARGIN_SEC = 60;
/** used when the response has no usable expires_in (assumption; the live value is 3600) */
export const DEFAULT_TTL_SEC = 300;
export const TOKEN_TIMEOUT_MS = 15_000;

export interface TokenSource {
  get(): Promise<string>;
  invalidate(): void;
}

export interface TokenSourceOptions {
  clientId: string;
  clientSecret: string;
  fetch?: FetchFn;
  now?: () => number;
  timeoutMs?: number;
  /** where scope warnings go (default: a logger tagged surense-auth) */
  log?: Logger;
  /** called with each new token's scope report (tests, health views); never receives the token */
  onScopes?: (r: ScopeReport) => void;
}

export function createTokenSource(o: TokenSourceOptions): TokenSource {
  const doFetch = o.fetch ?? fetch;
  const now = o.now ?? Date.now;
  const log = o.log ?? createLogger({ module: "surense-auth" });
  let token: string | null = null;
  let expiresAt = 0;
  let inflight: Promise<string> | null = null;

  async function fetchToken(): Promise<string> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? TOKEN_TIMEOUT_MS);
    let res: Response;
    try {
      res = await doFetch(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: o.clientId, client_secret: o.clientSecret }),
        // never follow: the body holds client_secret and must reach api.surense.com only
        redirect: "manual",
        signal: ctrl.signal,
      });
    } catch {
      throw new SurenseError(0, ctrl.signal.aborted ? "timeout" : "network", "unavailable");
    } finally {
      clearTimeout(timer);
    }
    if (isRedirect(res)) {
      await res.body?.cancel();
      throw new SurenseError(res.status, "redirect_refused", "config");
    }
    const text = await res.text();
    if (!res.ok) {
      const e = fromResponse(res, text);
      if (e.retryable) throw e;
      // 400/401 from the token endpoint = bad or revoked client credentials; a 5xx is an outage, not an auth failure
      const kind = res.status === 400 || res.status === 401 ? "auth" : res.status >= 500 ? "unavailable" : e.kind;
      throw new SurenseError(res.status, e.code, kind);
    }
    let j: { access_token?: unknown; expires_in?: unknown; token_type?: unknown; scope?: unknown };
    try {
      j = JSON.parse(text);
    } catch {
      throw new SurenseError(res.status, "bad_json", "unavailable");
    }
    if (typeof j.access_token !== "string" || j.access_token.length < 8) throw new SurenseError(res.status, "no_token", "auth");
    if (typeof j.token_type === "string" && j.token_type.toLowerCase() !== "bearer") {
      throw new SurenseError(res.status, "token_type", "auth");
    }
    const ttl = typeof j.expires_in === "number" && Number.isFinite(j.expires_in) && j.expires_in > 0 ? j.expires_in : DEFAULT_TTL_SEC;
    // warn only: a scope problem must not stop calls that the granted scopes do cover
    try {
      const report = checkScopes(j.scope);
      logScopes(log, report);
      o.onScopes?.(report);
    } catch {
      // a logging or callback failure never breaks authentication
    }
    token = j.access_token;
    // never cache for less than 0 s: a ttl under the margin is used once and refreshed on the next call
    expiresAt = now() + Math.max(0, ttl - TOKEN_MARGIN_SEC) * 1000;
    return token;
  }

  return {
    async get() {
      if (token && now() < expiresAt) return token;
      if (!inflight) {
        inflight = fetchToken().finally(() => {
          inflight = null;
        });
      }
      return await inflight;
    },
    invalidate() {
      token = null;
      expiresAt = 0;
    },
  };
}
