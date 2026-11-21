// client-docs entrypoint (verify_jwt=true; staff + fresh MFA are checked again in the DB by staff.client_doc_get).
import { createClientDocsHandler } from "./handler.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { createLogger } from "../_shared/logger.ts";
import { createObjectReader } from "../_shared/poa/storage.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const env = denoEnv();
const log = createLogger({ fn: "client-docs" });
log.info("boot", envPresence(env));
const storage = env.supabaseUrl && env.secretKey ? createObjectReader({ url: env.supabaseUrl, apikey: env.secretKey }) : null;

Deno.serve(createClientDocsHandler({ env, storage, log }));
