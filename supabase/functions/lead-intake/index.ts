// lead-intake entrypoint (verify_jwt=false: browsers have no JWT; Origin + Turnstile + DB limits are the gate).
// Contract and order: ./handler.ts and docs/platform/EDGE-FUNCTIONS.md.
import { createLeadHandler, createRejectCounter } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { runtimeDefer } from "../_shared/background.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "lead-intake" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createLeadHandler({ env, rpc, log, defer: runtimeDefer(), rejects: createRejectCounter() }));
