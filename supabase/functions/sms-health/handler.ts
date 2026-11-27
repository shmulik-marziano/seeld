// sms-health: proves the Micropay token without sending anything (balance probe). x-cron-secret is the auth
// (verify_jwt=false), checked against the function secret or the Vault through api.cron_secret_ok, exactly like the
// workers; run it with `select ops.call_function('sms-health')` and read net._http_response, or by hand with the secret.
// Answers names, booleans and the message balance only. Never the token.
import type { Rpc } from "../_shared/db.ts";
import type { Env } from "../_shared/env.ts";
import { errorResponse, jsonResponse } from "../_shared/errors.ts";
import type { Logger } from "../_shared/logger.ts";
import { jobRunId } from "../_shared/background.ts";
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
      // the run opened by ops.call_function (hourly cron or by hand) is closed here, and the provider's state is reported to
      // api.sms_report, which raises sms_unavailable / sms_low_credit (2026-11-27: a wrong token went unseen for 2.5 days)
      const run = jobRunId(req);
      const report = async (ok: boolean, code: string | null, credit: number | null) => {
        if (!d.rpc) return;
        await d.rpc.call("sms_report", { p_ok: ok, p_code: code, p_credit: credit }).catch(() => log.error("sms_report failed"));
        if (run) {
          await d.rpc.call("job_finish", { p_run: run, p_ok: ok, p_stats: credit === null ? {} : { credit }, p_error: code })
            .catch(() => log.error("job_finish failed", { run }));
        }
      };
      if (!d.env.smsApiToken) {
        log.warn("SMS_API_TOKEN not set");
        await report(false, "not_configured", null);
        return jsonResponse({ ok: false, configured: false, sender: !!d.env.smsSenderId }, rid, { status: 503 });
      }
      const r = await smsBalance({ token: d.env.smsApiToken, fetch: d.fetch });
      if (!r.ok) {
        log.warn("sms balance probe failed", { code: r.code, status: r.status, detail: r.detail ?? null });
        await report(false, r.code, null);
        return jsonResponse({ ok: false, configured: true, sender: !!d.env.smsSenderId, code: r.code, detail: r.detail ?? null }, rid, { status: 502 });
      }
      log.info("sms balance probe", { credit: r.data.credit });
      await report(true, null, Math.floor(r.data.credit));
      return jsonResponse({ ok: true, configured: true, sender: !!d.env.smsSenderId, credit: r.data.credit }, rid);
    } catch (e) {
      return errorResponse(e, rid);
    }
  };
}
