// sms-health: proves the Micropay token without sending anything (balance probe). x-cron-secret is the auth
// (verify_jwt=false), checked against the function secret or the Vault through api.cron_secret_ok, exactly like the
// workers; run it with `select ops.call_function('sms-health')` and read net._http_response, or by hand with the secret.
// Answers names, booleans and the message balance only. Never the token.
import type { Rpc } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { errorResponse, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { cronSecretViaRpc, requireCronSecret } from "../_shared/secret.ts";
import { smsBalance } from "../_shared/sms/micropay.ts";
import type { FetchFn } from "../_shared/db.ts";

export interface SmsHealthDeps {
  env: Env;
  rpc: Rpc | null;
  log: Logger;
  fetch?: FetchFn;
}

export function createSmsHealthHandler(d: SmsHealthDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const rid = requestIdFor(req);
    const log = d.log.child({ requestId: rid });
    try {
      if (req.method !== "GET" && req.method !== "POST") return jsonResponse({ error: { code: "method" } }, rid, { status: 405 });
      await requireCronSecret(req, d.env.cronSecret, d.rpc ? cronSecretViaRpc(d.rpc) : undefined);
      if (!d.env.smsApiToken) {
        log.warn("SMS_API_TOKEN not set");
        return jsonResponse({ ok: false, configured: false, sender: !!d.env.smsSenderId }, rid, { status: 503 });
      }
      const r = await smsBalance({ token: d.env.smsApiToken, fetch: d.fetch });
      if (!r.ok) {
        log.warn("sms balance probe failed", { code: r.code, status: r.status, detail: r.detail ?? null });
        return jsonResponse({ ok: false, configured: true, sender: !!d.env.smsSenderId, code: r.code, detail: r.detail ?? null }, rid, { status: 502 });
      }
      log.info("sms balance probe", { credit: r.data.credit });
      return jsonResponse({ ok: true, configured: true, sender: !!d.env.smsSenderId, credit: r.data.credit }, rid);
    } catch (e) {
      return errorResponse(e, rid);
    }
  };
}
