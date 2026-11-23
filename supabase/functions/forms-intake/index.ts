// forms-intake entrypoint (verify_jwt=false: browsers have no JWT; Origin + Turnstile + the session token + DB switches are
// the gate). Contract: docs/product/CLIENT-FORMS.md. Every switch is off by default; nothing here is enabled by deploying it.
import { createFormsHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { createStorage } from "../_shared/surense/storage.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "forms-intake" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 15_000 }) : null;
const storage = env.supabaseUrl && env.secretKey ? createStorage({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createFormsHandler({ env, rpc, log, storage }));
