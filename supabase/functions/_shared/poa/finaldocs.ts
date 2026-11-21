// The three final documents of a wizard run (maslaka / harbit / policies), stored right after the policies step: the tool's
// public page answers pre-signed S3 links (verified 2026-11-22), so the bytes are fetched here, hashed, put into the private
// client-docs bucket and recorded through the database. The webhook path (dataproxy.*.approved -> documents/search ->
// surense/sync.ts linkPoaDocument) stays the fallback for whatever this step could not store.
// Rules: HTTPS and exactly the approved download host (DOCS_HOST), no redirects, no cookies, NO Authorization header (the
// links are pre-signed; this module has no token), 15 s timeout, at most 2 MB, content-type application/pdf or
// application/octet-stream and a "%PDF-" start. Failures never throw: they come back as `docs_*` codes (no value, no url) for
// the caller to record with api.poa_session_fail and to log.
import type { FetchFn } from "../db.ts";
import { RpcError } from "../db.ts";
import type { Logger } from "../logger.ts";
import { assertAllowedUrl, DOCS_HOST, isRedirect, TIMEOUT_MS } from "../surense/client.ts";
import { sha256Hex, type Storage, StorageError } from "../surense/storage.ts";
import { POA_KINDS, type FinalUrls, type PoaKind } from "./engine/types.ts";
import type { PoaRpc } from "./rpc.ts";
import { poaStoragePath } from "./storage.ts";

export const MAX_FINAL_DOC_BYTES = 2 * 1024 * 1024;
export const FINAL_DOC_TIMEOUT_MS = TIMEOUT_MS;
const URL_KEY: Record<PoaKind, keyof FinalUrls> = { maslaka: "swiftness", harbit: "hb", policies: "policies" };

/** a code that is safe to log and to store on the session (no value, no url) */
export class FinalDocError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = "FinalDocError";
    this.code = code;
  }
}

export interface FinalDocFetcher {
  /** the PDF bytes behind one pre-signed link; throws FinalDocError(docs_*) */
  fetchPdf(url: string): Promise<Uint8Array>;
}

export function createFinalDocFetcher(o: { fetch?: FetchFn; timeoutMs?: number; maxBytes?: number; log: Logger; host?: string }): FinalDocFetcher {
  const doFetch = o.fetch ?? fetch;
  const timeoutMs = o.timeoutMs ?? FINAL_DOC_TIMEOUT_MS;
  const maxBytes = o.maxBytes ?? MAX_FINAL_DOC_BYTES;
  const host = o.host ?? DOCS_HOST;
  return {
    async fetchPdf(url) {
      let u: URL;
      try {
        u = assertAllowedUrl(url, [host]);
      } catch {
        throw new FinalDocError("docs_host");
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const started = Date.now();
      try {
        let res: Response;
        try {
          // pre-signed link: no headers at all (in particular no Authorization), no cookies, no redirects
          res = await doFetch(u.href, { method: "GET", redirect: "manual", credentials: "omit", headers: {}, signal: ctrl.signal });
        } catch {
          throw new FinalDocError(ctrl.signal.aborted ? "docs_timeout" : "docs_network");
        }
        o.log.info("poa final doc fetched", { host: u.hostname, status: res.status, ms: Date.now() - started });
        if (isRedirect(res)) {
          await res.body?.cancel();
          throw new FinalDocError("docs_redirect");
        }
        if (!res.ok) {
          await res.body?.cancel();
          throw new FinalDocError(`docs_http_${res.status}`);
        }
        const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
        if (type !== "application/pdf" && type !== "application/octet-stream") {
          await res.body?.cancel();
          throw new FinalDocError("docs_type");
        }
        if (Number(res.headers.get("content-length") ?? "0") > maxBytes) {
          await res.body?.cancel();
          throw new FinalDocError("docs_too_large");
        }
        const bytes = await readCapped(res, maxBytes, ctrl.signal);
        if (bytes.byteLength < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") throw new FinalDocError("docs_not_pdf");
        return bytes;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** reads the body, stopping (and cancelling) as soon as it exceeds the cap, whatever the headers claimed */
async function readCapped(res: Response, maxBytes: number, signal: AbortSignal): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new FinalDocError("docs_too_large");
      }
      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof FinalDocError) throw e;
    throw new FinalDocError(signal.aborted ? "docs_timeout" : "docs_network");
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

export interface FinalDocsDeps {
  fetcher: FinalDocFetcher;
  /** the private client-docs bucket (write side) */
  storage: Storage;
  log: Logger;
}

export interface FinalDocsResult {
  stored: PoaKind[];
  /** kind -> docs_* code */
  failed: Partial<Record<PoaKind, string>>;
  /** the database has docs switched off (423): nothing was attempted further, nothing is a failure */
  switchOff: boolean;
}

/** Stores every kind that came with a link. Sequential per kind (3 small files); one kind failing never stops the others.
 *  Per kind: fetch -> sha256 -> api.poa_document_from_url (row + document id + agency) -> put poa/{agency}/{session}/{kind}-{doc}.pdf
 *  -> api.poa_document_stored. A row that already holds a stored file is left alone. Never throws. */
export async function storeFinalDocuments(d: FinalDocsDeps, poa: PoaRpc, sessionId: string, urls: FinalUrls): Promise<FinalDocsResult> {
  const out: FinalDocsResult = { stored: [], failed: {}, switchOff: false };
  for (const kind of POA_KINDS) {
    const url = urls[URL_KEY[kind]];
    if (!url || out.switchOff) continue;
    try {
      const bytes = await d.fetcher.fetchPdf(url);
      const sha = await sha256Hex(bytes);
      const row = await poa.documentFromUrl(sessionId, kind, sha);
      if (row.stored) {
        d.log.info("poa final doc already stored", { kind });
        continue;
      }
      const path = poaStoragePath(row.agencyId, sessionId, kind, row.documentId);
      await d.storage.put(path, bytes, "application/pdf");
      await poa.documentStored(row.documentId, path, sha);
      out.stored.push(kind);
      d.log.info("poa final doc stored", { kind, bytes: bytes.byteLength });
    } catch (e) {
      if (e instanceof RpcError && e.status === 423) {
        out.switchOff = true;
        d.log.info("poa final docs: switch off", { kind });
        continue;
      }
      const code = e instanceof FinalDocError ? e.code
        : e instanceof RpcError ? `docs_db_${e.status || "x"}`
        : e instanceof StorageError ? `docs_storage_${e.status}`
        : "docs_error";
      out.failed[kind] = code;
      d.log.warn("poa final doc not stored", { kind, code });
    }
  }
  return out;
}
