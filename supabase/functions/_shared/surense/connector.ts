// Wiring: env + service RPC -> token source, host-locked client (with the audit sink), typed API, storage.
// One token source per isolate (module-level in index.ts) so warm invocations reuse the cached token.
import type { FetchFn, Rpc } from "../db.ts";
import type { Env } from "../env.ts";
import type { Logger } from "../logger.ts";
import { surenseApi } from "./api.ts";
import { createTokenSource, type TokenSource } from "./auth.ts";
import { type AuditSink, createSurenseClient } from "./client.ts";
import { credentials } from "./env.ts";
import { createStorage } from "./storage.ts";
import { createObjectReader } from "../poa/storage.ts";
import type { SyncDeps } from "./sync.ts";

/** pacing between Surense calls (rate limits are undocumented; README section 6א) */
export const MIN_INTERVAL_MS = 250;

export function tokenSourceFor(env: Env, fetch?: FetchFn): TokenSource | null {
  const c = credentials(env);
  return c ? createTokenSource({ clientId: c.clientId, clientSecret: c.clientSecret, fetch }) : null;
}

export function auditSink(rpc: Rpc): AuditSink {
  return async (op, ref, status, phase) => {
    await rpc.call("surense_audit", { p_op: op, p_ref: ref, p_status: status, p_phase: phase });
  };
}

export function buildSyncDeps(o: {
  env: Env;
  rpc: Rpc;
  log: Logger;
  tokens: TokenSource;
  fetch?: FetchFn;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  minIntervalMs?: number;
  /** HTTP attempts per Surense call: surense-worker passes 1 (the queue is its only retry layer); default 3 */
  maxAttempts?: number;
}): SyncDeps {
  const client = createSurenseClient({
    tokens: o.tokens,
    log: o.log,
    fetch: o.fetch,
    sleep: o.sleep,
    now: o.now,
    minIntervalMs: o.minIntervalMs ?? MIN_INTERVAL_MS,
    maxAttempts: o.maxAttempts,
    audit: auditSink(o.rpc),
  });
  const storage = o.env.supabaseUrl && o.env.secretKey
    ? createStorage({ url: o.env.supabaseUrl, apikey: o.env.secretKey, fetch: o.fetch })
    : null;
  const objects = o.env.supabaseUrl && o.env.secretKey
    ? createObjectReader({ url: o.env.supabaseUrl, apikey: o.env.secretKey, fetch: o.fetch })
    : null;
  return { api: surenseApi(client), client, rpc: o.rpc, log: o.log, storage, objects, now: o.now };
}
