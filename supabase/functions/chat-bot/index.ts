// chat-bot entrypoint (verify_jwt=false: anonymous visitors). See ./handler.ts.
import { createChatHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { createMemoryRateLimiter } from "../_shared/rateLimit.ts";
import { runtimeDefer } from "../_shared/background.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "chat-bot" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createChatHandler({ env, rpc, log, defer: runtimeDefer(), limiter: createMemoryRateLimiter() }));
