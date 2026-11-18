// Minimal PostgREST RPC client for the v2 functions (no supabase-js): POST /rest/v1/rpc/<fn> in an exposed schema.
// Service calls send SEELD_SECRET_KEY (sb_secret_*) in the apikey header only; the new keys are not JWTs and must not
// go in Authorization. Errors keep only the SQLSTATE / PostgREST code and the status: the message of a PT4xx raise is
// a short code ("invalid_input:phone") and is kept; details/hints are dropped because they can echo row values.

export type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class RpcError extends Error {
  readonly status: number;
  /** SQLSTATE (PT400, 42501, ...) or PostgREST code (PGRST202, ...) or "network" / "timeout". */
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "RpcError";
    this.status = status;
    this.code = code;
  }
  /** "invalid_input:phone" -> "phone" */
  get field(): string | null {
    const m = /^invalid_input:([a-z_]+)$/.exec(this.message);
    return m ? m[1] : null;
  }
}

export interface Rpc {
  call<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T>;
}

export interface RpcOptions {
  url: string;
  apikey: string;
  schema?: "api" | "staff";
  /** user JWT for staff.* calls (Authorization: Bearer); never an sb_secret key. */
  bearer?: string;
  timeoutMs?: number;
  fetch?: FetchFn;
  requestId?: string;
}

const FN = /^[a-z][a-z0-9_]{1,62}$/;

export function createRpc(o: RpcOptions): Rpc {
  const doFetch = o.fetch ?? fetch;
  const schema = o.schema ?? "api";
  return {
    async call<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
      if (!FN.test(fn)) throw new RpcError(0, "bad_function", "bad function name");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 8000);
      let res: Response;
      try {
        res = await doFetch(`${o.url}/rest/v1/rpc/${fn}`, {
          method: "POST",
          headers: {
            apikey: o.apikey,
            "content-type": "application/json",
            accept: "application/json",
            "content-profile": schema,
            "accept-profile": schema,
            ...(o.bearer ? { authorization: `Bearer ${o.bearer}` } : {}),
            ...(o.requestId ? { "x-request-id": o.requestId } : {}),
          },
          body: JSON.stringify(args),
          signal: ctrl.signal,
        });
      } catch (e) {
        throw new RpcError(0, ctrl.signal.aborted ? "timeout" : "network", `rpc ${fn} unreachable`);
      } finally {
        clearTimeout(timer);
      }
      const text = await res.text();
      if (!res.ok) {
        let code = `http_${res.status}`;
        let message = `rpc ${fn} failed`;
        try {
          const j = JSON.parse(text) as { code?: unknown; message?: unknown };
          if (typeof j.code === "string" && j.code) code = j.code;
          if (typeof j.message === "string" && /^[a-z_]+(:[a-z_]+)?$/.test(j.message)) message = j.message;
        } catch { /* non-JSON error body: keep the generic message */ }
        throw new RpcError(res.status, code, message);
      }
      if (!text) return null as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new RpcError(res.status, "bad_json", `rpc ${fn} returned non-JSON`);
      }
    },
  };
}

/** Status family helpers for PT-coded raises (PostgREST maps PTxyz to HTTP xyz). */
export function rpcStatus(e: unknown): number {
  return e instanceof RpcError ? e.status : 0;
}
