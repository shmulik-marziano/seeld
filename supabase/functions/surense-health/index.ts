// surense-health: read-only probe of the Surense API credentials.
// Deployed to Supabase project seeld-site (qxhpolktdfgcbxtfxgov) on 2026-11-20 as version 1, verify_jwt=true.
// Repo copy (feat/surense-connector) of the deployed v1 source, kept also in the HQ knowledge base
// (functions/surense-health/index.ts); config.toml [functions.surense-health] verify_jwt = true. Superseded later
// by the surense-sync action "health"; until then it stays read-only and never returns a token.
//
// Reads SURENSE_CLIENT_ID / SURENSE_CLIENT_SECRET by name, requests an OAuth2
// client-credentials token, and calls read-only endpoints. Returns only
// statuses, counts, names and key lists. Never returns the token or any secret.

const TOKEN_URL = "https://api.surense.com/oauth/token";
const BASE = "https://api.surense.com/api/v1";
const TIMEOUT_MS = 15_000;

type Step = { step: string; ok: boolean; status?: number; note?: string; detail?: unknown };

function timeout(): { signal: AbortSignal; clear: () => void } {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  return { signal: c.signal, clear: () => clearTimeout(t) };
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _text: text.slice(0, 300) }; }
}

async function getToken(id: string, secret: string, steps: Step[]): Promise<string | null> {
  // Attempt 1: form-encoded body (RFC 6749 §4.4). Verified 2026-11-20: this is the mode Surense accepts.
  const form = new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret });
  let t = timeout();
  let res = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: form, signal: t.signal }).finally(t.clear);
  let body = await readJson(res) as Record<string, unknown>;
  let mode = "form";
  if (!res.ok || typeof body?.access_token !== "string") {
    // Attempt 2: HTTP Basic client auth with grant_type in the body.
    t = timeout();
    res = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json", authorization: "Basic " + btoa(`${id}:${secret}`) }, body: new URLSearchParams({ grant_type: "client_credentials" }), signal: t.signal }).finally(t.clear);
    body = await readJson(res) as Record<string, unknown>;
    mode = "basic";
  }
  if (!res.ok || typeof body?.access_token !== "string") {
    // Attempt 3: JSON body.
    t = timeout();
    res = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ grant_type: "client_credentials", client_id: id, client_secret: secret }), signal: t.signal }).finally(t.clear);
    body = await readJson(res) as Record<string, unknown>;
    mode = "json";
  }
  const ok = res.ok && typeof body?.access_token === "string";
  const safe: Record<string, unknown> = {};
  for (const k of Object.keys(body ?? {})) {
    if (k === "access_token" || k === "refresh_token" || k === "id_token") continue;
    const v = body[k];
    safe[k] = typeof v === "string" && v.length > 120 ? v.slice(0, 60) + "..." : v;
  }
  steps.push({ step: "oauth_token", ok, status: res.status, note: `mode=${mode}`, detail: { keys: Object.keys(body ?? {}), ...safe } });
  return ok ? (body.access_token as string) : null;
}

async function call(token: string, path: string, steps: Step[], summarize: (b: unknown) => unknown) {
  const t = timeout();
  try {
    const res = await fetch(BASE + path, { headers: { authorization: `Bearer ${token}`, accept: "application/json" }, signal: t.signal });
    const body = await readJson(res);
    steps.push({ step: path, ok: res.ok, status: res.status, detail: res.ok ? summarize(body) : body });
  } catch (e) {
    steps.push({ step: path, ok: false, note: String(e).slice(0, 200) });
  } finally { t.clear(); }
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return new Response("method", { status: 405 });
  const id = Deno.env.get("SURENSE_CLIENT_ID") ?? "";
  const secret = Deno.env.get("SURENSE_CLIENT_SECRET") ?? "";
  const steps: Step[] = [];
  steps.push({ step: "secrets", ok: Boolean(id && secret), detail: { client_id_present: Boolean(id), client_id_prefix: id.slice(0, 4), client_secret_present: Boolean(secret), client_secret_length: secret.length } });
  if (!id || !secret) return Response.json({ ok: false, steps }, { status: 503 });
  try {
    const token = await getToken(id, secret, steps);
    if (token) {
      await call(token, "/user/info", steps, (b) => {
        const o = (b ?? {}) as Record<string, unknown>;
        return { keys: Object.keys(o), tenantId: o.tenantId, agencyId: o.agencyId, scopes_count: Array.isArray(o.scopes) ? o.scopes.length : undefined };
      });
      await call(token, "/licensees", steps, (b) => Array.isArray(b) ? { count: b.length, names: b.map((x) => (x as Record<string, unknown>).name ?? null), accessible: b.map((x) => (x as Record<string, unknown>).accessible) } : { type: typeof b });
      await call(token, "/swiftness/accounts/list", steps, (b) => Array.isArray(b) ? { count: b.length, accounts: b.map((x) => ({ accountName: (x as Record<string, unknown>).accountName, status: (x as Record<string, unknown>).status, defaultAccount: (x as Record<string, unknown>).defaultAccount })) } : b);
      await call(token, "/documents/types", steps, (b) => Array.isArray(b) ? { count: b.length, titles: b.map((x) => (x as Record<string, unknown>).title) } : b);
    }
  } catch (e) {
    steps.push({ step: "error", ok: false, note: String(e).slice(0, 300) });
  }
  return Response.json({ ok: steps.every((s) => s.ok), steps });
});
