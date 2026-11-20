// surense-worker entrypoint (verify_jwt=false; x-cron-secret is the auth). See ./handler.ts.
import { createSurenseWorkerHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { runtimeDefer } from "../_shared/background.ts";
import { tokenSourceFor } from "../_shared/surense/connector.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "surense-worker" });
log.info("boot", envPresence(env));
// 20 s: a page upsert of 100 encrypted rows can exceed the default 8 s
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 20_000 }) : null;

Deno.serve(createSurenseWorkerHandler({ env, rpc, log, defer: runtimeDefer(), tokens: tokenSourceFor(env) }));
