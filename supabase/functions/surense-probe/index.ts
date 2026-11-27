// surense-probe: read-only diagnostic of one customer's portfolio endpoints (history + production portfolio) with the
// provider's own error text, for the owner's debugging by hand: `select ops.call_function('surense-probe',
// '{"customer_id":"<uuid>","month":"2026-10"}')` then net._http_response. x-cron-secret is the auth (verify_jwt=false).
// Returns statuses, shapes (keys, counts), the Surense error message bounded and with digit runs masked. No personal
// values: product rows are reduced to counts and key lists. Never the token.
import { jobRunId } from "../_shared/background.ts";
import { createRpc } from "../_shared/db.ts";
import { denoEnv, envPresence } from "../_shared/env.ts";
import { errorResponse, jsonResponse } from "../_shared/errors.ts";
import { createLogger } from "../_shared/logger.ts";
import { requestIdFor } from "../_shared/request.ts";
import { cronSecretViaRpc, requireCronSecret } from "../_shared/secret.ts";
import { isUuid } from "../_shared/surense/api.ts";
import { tokenSourceFor } from "../_shared/surense/connector.ts";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): unknown };

const BASE = "https://api.surense.com/api/v1";
const env = denoEnv();
const log = createLogger({ fn: "surense-probe" });
log.info("boot", envPresence(env));
const rpc = env.supabaseUrl && env.secretKey ? createRpc({ url: env.supabaseUrl, apikey: env.secretKey }) : null;
const tokens = tokenSourceFor(env);

const mask = (s: string) => s.replace(/[^\x20-\x7e֐-׿]/g, "").replace(/\d{5,}/g, "#").slice(0, 300);
const shape = (v: unknown): unknown => {
  if (Array.isArray(v)) return { array: v.length, first: v.length ? shape(v[0]) : null };
  if (v && typeof v === "object") return { keys: Object.keys(v as object).slice(0, 60) };
  return typeof v;
};

async function call(token: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, json, text };
}

Deno.serve(async (req) => {
  const rid = requestIdFor(req);
  let authed = false;
  let ok = false;
  try {
    await requireCronSecret(req, env.cronSecret, rpc ? cronSecretViaRpc(rpc) : undefined);
    authed = true;
    if (!tokens) return jsonResponse({ ok: false, code: "surense_not_configured" }, rid, { status: 503 });
    const body = (await req.json().catch(() => ({}))) as { customer_id?: unknown; month?: unknown };
    const id = typeof body.customer_id === "string" && isUuid(body.customer_id) ? body.customer_id.toLowerCase() : null;
    if (!id) return jsonResponse({ ok: false, code: "bad_customer_id" }, rid, { status: 400 });
    const token = await tokens.get();
    const out: Record<string, unknown> = {};
    const h = await call(token, `/customers/${id}/portfolio/history`);
    out.history = {
      status: h.status,
      entries: Array.isArray(h.json)
        ? (h.json as Record<string, unknown>[]).slice(0, 12).map((e) => ({
          production: e.production, source: e.source, validityDate: e.validityDate, validityMonth: e.validityMonth,
          e9100Progress: e.e9100Progress, hasMisparMislaka: typeof e.misparMislaka === "string", keys: Object.keys(e),
        }))
        : shape(h.json),
      error: h.ok ? null : mask(h.text),
    };
    // the latest history entry of each kind drives the request variants: the enum spelling of `mode` is what we are after
    const entries = Array.isArray(h.json) ? (h.json as Record<string, unknown>[]) : [];
    const byDate = (a: Record<string, unknown>, b: Record<string, unknown>) => String(a.validityDate ?? "").localeCompare(String(b.validityDate ?? ""));
    const prod = entries.filter((e) => e.production === true).sort(byDate).pop();
    const pre = entries.filter((e) => e.production !== true && typeof e.misparMislaka === "string").sort(byDate).pop();
    const month = typeof body.month === "string" && /^[0-9-]{4,10}$/.test(body.month) ? body.month : (prod?.validityMonth as string | undefined) ?? "2026-10";
    const variants: Record<string, unknown>[] = [];
    // the enum is coded (a Hebrew name is "null" to the server; 1 answered 200 on 2026-11-23): which code is which mode?
    if (pre) {
      for (const mode of [1, 2]) variants.push({ mode, misparMislaka: pre.misparMislaka, hbValidityDate: pre.validityDate });
      for (const mode of [1, 2]) variants.push({ mode, misparMislaka: pre.misparMislaka });
    }
    for (const mode of [1, 2]) variants.push({ mode, month });
    out.attempts = [];
    for (const v of variants) {
      const r = await call(token, `/customers/${id}/portfolio`, v);
      const j = r.json as Record<string, unknown> | null;
      (out.attempts as unknown[]).push({
        sent: { ...v, misparMislaka: v.misparMislaka ? "#" : undefined }, status: r.status,
        result: r.ok && j ? { keys: Object.keys(j).slice(0, 40), products: Array.isArray(j.products) ? j.products.length : null, productiaMonth: j.productiaMonth ?? null, productKeys: Array.isArray(j.products) && j.products[0] ? Object.keys(j.products[0] as object).slice(0, 80) : null } : null,
        error: r.ok ? null : mask(r.text),
      });
    }
    ok = true;
    return jsonResponse({ ok: true, ...out }, rid);
  } catch (e) {
    log.warn("probe failed", { code: e instanceof Error ? e.name : "unknown" });
    return errorResponse(e, rid);
  } finally {
    // the run opened by ops.call_function is closed (2026-11-27: open runs re-raised job_not_finished for a day)
    const run = authed ? jobRunId(req) : null;
    if (run && rpc) await rpc.call("job_finish", { p_run: run, p_ok: ok, p_stats: {}, p_error: ok ? null : "probe_failed" }).catch(() => {});
  }
});
