// health entrypoint (verify_jwt=false: public probe). See ./handler.ts.
import { createHealthHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { createMemoryRateLimiter } from "../_shared/rateLimit.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "health" });
log.info("boot", envPresence(env));
// api.health is granted to anon: the publishable key is enough; the secret key is only a fallback
const key = env.publishableKey ?? env.secretKey;
const rpc = env.supabaseUrl && key ? createRpc({ url: env.supabaseUrl, apikey: key, timeoutMs: 5000 }) : null;

Deno.serve(createHealthHandler({ env, rpc, log, limiter: createMemoryRateLimiter() }));
