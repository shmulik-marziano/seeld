// poa-intake entrypoint (verify_jwt=false: browsers have no JWT; Origin + Turnstile + the session token + DB switches are
// the gate). Contract: docs/product/POA-WIZARD.md. Every switch is off by default; nothing here is enabled by deploying it.
import { createPoaHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { surenseApi } from "../_shared/surense/api.ts";
import { type AuditSink, createSurenseClient } from "../_shared/surense/client.ts";
import { auditSink, MIN_INTERVAL_MS, tokenSourceFor } from "../_shared/surense/connector.ts";
import { createDpClient } from "../_shared/poa/dp.ts";
import { loadPoaEnv, poaEnvPresence } from "../_shared/poa/config.ts";
import { createSurenseEngine } from "../_shared/poa/engine/surense.ts";
import type { PoaEngine } from "../_shared/poa/engine/types.ts";
import { createObjectReader } from "../_shared/poa/storage.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown; env: { get(name: string): string | undefined } };

const env = denoEnv();
const poaEnv = loadPoaEnv((n) => Deno.env.get(n));
const log = createLogger({ fn: "poa-intake" });
log.info("boot", { ...envPresence(env), ...poaEnvPresence(poaEnv) });
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 15_000 }) : null;
const tokens = tokenSourceFor(env);

let engine: PoaEngine | null = null;
if (rpc && tokens) {
  try {
    const audit: AuditSink = auditSink(rpc);
    const client = createSurenseClient({ tokens, log, minIntervalMs: MIN_INTERVAL_MS, audit });
    engine = createSurenseEngine({
      api: surenseApi(client),
      dp: createDpClient({ host: poaEnv.dpHost, basePath: poaEnv.dpBase, log, audit }),
      managerId: poaEnv.managerId,
      log,
    });
  } catch {
    log.error("poa engine not built", { reason: "bad_dp_settings" });
  }
}
const storage = env.supabaseUrl && env.secretKey ? createObjectReader({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createPoaHandler({ env, rpc, log, engine, storage, startMinMs: poaEnv.startMinMs, startBucketMs: poaEnv.startBucketMs }));
