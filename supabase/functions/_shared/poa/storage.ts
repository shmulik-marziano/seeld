// Read side of the private client-docs bucket (the write side is _shared/surense/storage.ts). The service key goes in the
// apikey header only. Bytes are returned to the caller to stream; no signed URL is ever created.
import type { FetchFn } from "../db.ts";
import { BUCKET, StorageError } from "../surense/storage.ts";

const PATH = /^[A-Za-z0-9][A-Za-z0-9/_.-]{0,298}$/;
export const MAX_DOC_BYTES = 25 * 1024 * 1024;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The path the database mandates for a stored POA document (api.poa_document_stored checks it exactly):
 *  poa/{agency}/{session}/{kind}-{document}.pdf. Ids only; never a person's name. */
export function poaStoragePath(agencyId: string, sessionId: string, kind: "maslaka" | "harbit" | "policies", documentId: string): string {
  if (!UUID.test(agencyId) || !UUID.test(sessionId) || !UUID.test(documentId)) throw new StorageError(400);
  return `poa/${agencyId}/${sessionId}/${kind}-${documentId}.pdf`;
}

export interface ObjectReader {
  /** the object bytes; null when it does not exist */
  get(path: string): Promise<Uint8Array | null>;
}

export function createObjectReader(o: { url: string; apikey: string; fetch?: FetchFn; timeoutMs?: number }): ObjectReader {
  const doFetch = o.fetch ?? fetch;
  return {
    async get(path) {
      if (!PATH.test(path) || path.includes("..") || path.includes("//")) throw new StorageError(400);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 20_000);
      try {
        let res: Response;
        try {
          res = await doFetch(`${o.url}/storage/v1/object/${BUCKET}/${path}`, {
            method: "GET",
            headers: { apikey: o.apikey, "cache-control": "no-store" },
            signal: ctrl.signal,
          });
        } catch {
          throw new StorageError(0);
        }
        if (res.status === 404 || res.status === 400) {
          await res.body?.cancel();
          return null;
        }
        if (!res.ok) {
          await res.body?.cancel();
          throw new StorageError(res.status);
        }
        const declared = Number(res.headers.get("content-length") ?? "0");
        if (declared > MAX_DOC_BYTES) {
          await res.body?.cancel();
          throw new StorageError(413);
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.byteLength > MAX_DOC_BYTES) throw new StorageError(413);
        return bytes;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** Headers for a PDF the browser saves: attachment, never cached, no referrer, no sniffing. */
export function downloadHeaders(requestId: string, fileName: string, sha256?: string | null): Record<string, string> {
  return {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="${fileName.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
    ...(sha256 ? { "x-poa-document-sha256": sha256 } : {}),
  };
}
