// client-area entrypoint (verify_jwt=false: browsers have no JWT; Origin + Turnstile + the one-time code + the session token +
// the DB switch are the gate). Contract: docs/product/CLIENT-AREA.md. Every switch is off by default.
import { createClientAreaHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { createObjectSigner } from "../_shared/poa/storage.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "client-area" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 15_000 }) : null;
const signer = env.supabaseUrl && env.secretKey ? createObjectSigner({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createClientAreaHandler({ env, rpc, log, signer }));
