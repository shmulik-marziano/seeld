// Writes a file into the private client-docs bucket of THIS project (Supabase Storage REST, secret key in the apikey
// header only, like db.ts). Object names are content hashes: surense/{customer}/{kind}/{event}/{sha256}{.ext}. The
// original file name (E9100 names can carry an ID number) is never part of the path; it goes encrypted into
// crm.surense_documents.details_enc. x-upsert is false: the same bytes under the same path are a duplicate, not a write.
import type { FetchFn } from "../db.ts";
import { InputError } from "./errors.ts";

export const BUCKET = "client-docs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** ".pdf" / ".zip" / "" from a file name (lowercase, 1..10 alphanumerics) */
export function extOf(name: string | undefined | null): string {
  const m = /\.([A-Za-z0-9]{1,10})$/.exec(name ?? "");
  return m ? `.${m[1].toLowerCase()}` : "";
}

export function objectPath(customerId: string, kind: "e9100", eventId: string, sha: string, ext: string): string {
  if (!UUID.test(customerId) || !UUID.test(eventId) || !/^[0-9a-f]{64}$/.test(sha) || !/^(\.[a-z0-9]{1,10})?$/.test(ext)) {
    throw new InputError("bad_object_path");
  }
  return `surense/${customerId}/${kind}/${eventId}/${sha}${ext}`;
}

export interface Storage {
  /** "stored" for a new object, "exists" when the path is already there (409) */
  put(path: string, bytes: Uint8Array, contentType: string): Promise<"stored" | "exists">;
}

export class StorageError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`storage ${status}`);
    this.name = "StorageError";
    this.status = status;
  }
}

export function createStorage(o: { url: string; apikey: string; fetch?: FetchFn; timeoutMs?: number }): Storage {
  const doFetch = o.fetch ?? fetch;
  return {
    async put(path, bytes, contentType) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 20_000);
      let res: Response;
      try {
        res = await doFetch(`${o.url}/storage/v1/object/${BUCKET}/${path}`, {
          method: "POST",
          headers: { apikey: o.apikey, "content-type": contentType || "application/octet-stream", "x-upsert": "false", "cache-control": "no-store" },
          body: bytes,
          signal: ctrl.signal,
        });
      } catch {
        throw new StorageError(0);
      } finally {
        clearTimeout(timer);
      }
      const text = await res.text();
      if (res.ok) return "stored";
      // Storage reports an existing object as 409, or as 400 with {"statusCode":"409","error":"Duplicate"}
      if (res.status === 409 || (res.status === 400 && /"(409|Duplicate)"/.test(text))) return "exists";
      throw new StorageError(res.status);
    },
  };
}
