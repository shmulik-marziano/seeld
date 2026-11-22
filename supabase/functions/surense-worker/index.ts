// surense-worker entrypoint (verify_jwt=false; x-cron-secret is the auth). See ./handler.ts.
import { createSurenseWorkerHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { runtimeDefer } from "../_shared/background.ts";
import { auditSink, tokenSourceFor } from "../_shared/surense/connector.ts";
import { createDpClient } from "../_shared/poa/dp.ts";
import { loadPoaEnv, poaEnvPresence } from "../_shared/poa/config.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown; env: { get(name: string): string | undefined } };

const env = denoEnv();
const poaEnv = loadPoaEnv((n) => Deno.env.get(n));
const log = createLogger({ fn: "surense-worker" });
log.info("boot", { ...envPresence(env), ...poaEnvPresence(poaEnv) });
// 20 s: a page upsert of 100 encrypted rows can exceed the default 8 s
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 20_000 }) : null;

// the POA ship job talks to the tool's public page like poa-intake does (same host lock, audit and cookie jar)
let poa: { dp: ReturnType<typeof createDpClient>; managerId: string | null } | null = null;
if (rpc) {
  try {
    poa = { dp: createDpClient({ host: poaEnv.dpHost, basePath: poaEnv.dpBase, log, audit: auditSink(rpc) }), managerId: poaEnv.managerId };
  } catch {
    log.error("poa ship engine not built", { reason: "bad_dp_settings" });
  }
}

Deno.serve(createSurenseWorkerHandler({ env, rpc, log, defer: runtimeDefer(), tokens: tokenSourceFor(env), poa }));
