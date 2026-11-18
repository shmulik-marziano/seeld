// fetch-cma-data entrypoint (verify_jwt=false; x-cron-secret is the auth). See ./handler.ts.
import { createCmaHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { runtimeDefer } from "../_shared/background.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "fetch-cma-data" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 30_000 }) : null;

Deno.serve(createCmaHandler({ env, rpc, log, defer: runtimeDefer() }));
