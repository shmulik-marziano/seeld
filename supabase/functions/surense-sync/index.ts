// surense-sync entrypoint (verify_jwt=true; admin + fresh TOTP checked again in the DB). See ./handler.ts.
import { createSyncHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createRpc } from "../_shared/db.ts";
import { tokenSourceFor } from "../_shared/surense/connector.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "surense-sync" });
log.info("boot", envPresence(env));
// 20 s: a page upsert of 100 encrypted rows is slower than the default 8 s on a cold database
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey, timeoutMs: 20_000 }) : null;

Deno.serve(createSyncHandler({ env, rpc, log, tokens: tokenSourceFor(env) }));
