// api-v1 entrypoint. SCAFFOLD: not deployed. Exposes GET /health and GET /version only.
// Deploy only after owner approval (see docs/platform/ARCHITECTURE.md, section on API).
// verify_jwt must be set to false for this function in supabase/config.toml when deployed, because the
// router authenticates per route (public health/version, API keys, user JWTs).
import { handle } from "./router.ts";
import { createLogger } from "../_shared/logger.ts";
import { parseAllowedOrigins } from "../_shared/cors.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): unknown };

const logger = createLogger({ fn: "api-v1" });
const allowedOrigins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));
const commit = Deno.env.get("GIT_COMMIT") ?? null;

Deno.serve((req) => handle(req, { logger, allowedOrigins, commit }));
