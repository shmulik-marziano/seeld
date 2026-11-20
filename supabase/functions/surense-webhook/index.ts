// surense-webhook entrypoint (verify_jwt=false; the Svix signature is the auth). See ./handler.ts.
import { createWebhookHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { createMemoryRateLimiter } from "../_shared/rateLimit.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "surense-webhook" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createWebhookHandler({ env, rpc, log, limiter: createMemoryRateLimiter() }));
