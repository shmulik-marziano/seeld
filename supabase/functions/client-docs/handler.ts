// client-docs (verify_jwt=true): staff download of one stored client document (a PDF in the private bucket client-docs).
// GET ?document_id=<uuid> with Authorization: Bearer <staff JWT>.
// Auth: the caller's JWT -> staff.client_doc_get(p_document_id) AS THE CALLER. That RPC asserts staff (aal2) and a fresh MFA
// step, writes the access log row (audit.access_log, ids only) and returns {storage_path, sha256}. Only then is the object
// read with the service key and streamed: Content-Disposition attachment, Cache-Control no-store, Referrer-Policy
// no-referrer, nosniff. No signed URL is ever created. Logs: caller, ids, codes; never a path, a name or a byte.
import { corsHeaders } from "../_shared/cors.ts";
import { createRpc, type FetchFn, type Rpc, RpcError } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { errorResponse, HttpError } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { isUuid } from "../_shared/surense/api.ts";
import { sha256Hex } from "../_shared/poa/session.ts";
import { downloadHeaders, type ObjectReader } from "../_shared/poa/storage.ts";

export interface ClientDocsDeps {
  env: Env;
  storage: ObjectReader | null;
  log: Logger;
  /** staff-schema RPC client acting as the caller (their JWT); tests inject a mock */
  staffRpc?: (jwt: string) => Rpc;
  fetch?: FetchFn;
}

/** DB / storage failure -> HTTP error, codes only */
export function toHttpError(e: unknown): unknown {
  if (e instanceof RpcError) {
    if (e.status === 401 || e.code === "PGRST301" || e.code === "PGRST303") return new HttpError("unauthenticated", "Invalid token");
    if (e.status === 403 || e.code === "42501") return new HttpError("forbidden", "Staff with a fresh MFA step required");
    if (e.status === 404 || e.code === "PT404") return new HttpError("not_found", "Not found");
    if (e.status === 400) return new HttpError("bad_request", "Invalid input");
    if (e.status === 423) return new HttpError("feature_disabled", "Disabled");
    if (e.status === 429) return new HttpError("rate_limited", "Too many requests", { headers: { "retry-after": "60" } });
    return new HttpError("unavailable", "Unavailable");
  }
  return e;
}

export function createClientDocsHandler(d: ClientDocsDeps): (req: Request) => Promise<Response> {
  const staffRpc = d.staffRpc ??
    ((jwt: string) => createRpc({ url: d.env.supabaseUrl as string, apikey: d.env.publishableKey as string, bearer: jwt, schema: "staff", fetch: d.fetch }));

  return async (req) => {
    const rid = requestIdFor(req);
    const cors = corsHeaders(req.headers.get("origin"), d.env.allowedOrigins);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "GET") throw new HttpError("method_not_allowed", "GET only");
      const jwt = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/i.exec(req.headers.get("authorization") ?? "")?.[1];
      if (!jwt || jwt.split(".").length !== 3) throw new HttpError("unauthenticated", "Missing credentials");
      const id = new URL(req.url).searchParams.get("document_id");
      if (!isUuid(id)) throw new HttpError("bad_request", "Invalid input", { details: { field: "document_id" } });
      if (!d.env.supabaseUrl || !d.env.publishableKey || !d.storage) throw new HttpError("unavailable", "Not configured");

      const r = await staffRpc(jwt).call<{ storage_path?: unknown; sha256?: unknown } | null>("client_doc_get", { p_document_id: id.toLowerCase() });
      const path = typeof r?.storage_path === "string" ? r.storage_path : null;
      if (!path) throw new HttpError("not_found", "Not found");
      const sha = typeof r?.sha256 === "string" && /^[0-9a-f]{64}$/.test(r.sha256) ? r.sha256 : null;

      const bytes = await d.storage.get(path);
      if (!bytes) throw new HttpError("not_found", "Not found");
      if (sha && (await sha256Hex(bytes)) !== sha) {
        log.error("client-docs hash mismatch", { document: id.toLowerCase() });
        throw new HttpError("internal", "Integrity check failed");
      }
      log.info("client doc served", { document: id.toLowerCase() });
      return new Response(bytes, { status: 200, headers: { ...cors, ...downloadHeaders(rid, "client-doc.pdf") } });
    } catch (e) {
      const he = toHttpError(e);
      if (he instanceof HttpError) log.info("client doc refused", { status: he.status, code: he.code });
      else log.error("client-docs error", { error: e instanceof RpcError ? e.code : e instanceof Error ? e.name : "unknown" });
      return errorResponse(he, rid, { ...cors, "cache-control": "no-store" });
    }
  };
}
