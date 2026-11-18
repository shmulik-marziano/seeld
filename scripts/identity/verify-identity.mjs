#!/usr/bin/env node
// Identity verification for seeld-site (no HTML, supabase-js only). Contract: docs/platform/IDENTITY.md.
//
//   node scripts/identity/verify-identity.mjs              dry run (default): read-only probes, no user, no email
//   node scripts/identity/verify-identity.mjs --enroll     sign in, enrol or verify TOTP, check aal2 + staff.admin_assert_fresh
//
// Env (dry run):  SEELD_SUPABASE_URL (default https://qxhpolktdfgcbxtfxgov.supabase.co)
//                 SEELD_PUBLISHABLE_KEY (sb_publishable_... or the legacy anon key; required)
//                 SEELD_ANON_JWT (optional legacy anon JWT: lets the 400/401 function probes pass the gateway)
// Env (--enroll): STAFF_EMAIL, STAFF_PASSWORD (environment only, never arguments), STAFF_CAPTCHA_TOKEN (when Auth CAPTCHA is on),
//                 STAFF_TOTP_OUT = a file OUTSIDE the repository that receives the otpauth URI on first enrolment.
// The script never prints keys, tokens, passwords or the TOTP secret.
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

const URL_ = (process.env.SEELD_SUPABASE_URL || "https://qxhpolktdfgcbxtfxgov.supabase.co").replace(/\/$/, "");
const KEY = process.env.SEELD_PUBLISHABLE_KEY || "";
const ANON_JWT = process.env.SEELD_ANON_JWT || "";
const FN = `${URL_}/functions/v1/staff-invite`;
const REPO = resolve(new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

let failures = 0;
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}
function info(name, detail) {
  console.log(`INFO  ${name}  (${detail})`);
}

async function req(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
  let body = null;
  const text = await res.text();
  try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
  return { status: res.status, body, headers: res.headers };
}

async function dryRun() {
  if (!KEY) {
    console.error("SEELD_PUBLISHABLE_KEY is required");
    process.exit(2);
  }
  // 1. Auth settings: no external provider, signup closed, no phone
  const s = await req(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY } });
  check("auth settings reachable", s.status === 200, `HTTP ${s.status}`);
  if (s.status === 200 && s.body && typeof s.body === "object") {
    const ext = s.body.external || {};
    const on = Object.entries(ext).filter(([k, v]) => v === true && k !== "email").map(([k]) => k);
    check("no external (social) provider enabled", on.length === 0, on.length ? `enabled: ${on.join(",")}` : "only email");
    check("email provider enabled", ext.email === true);
    check("phone provider disabled", ext.phone !== true);
    check("signup disabled", s.body.disable_signup === true);
    check("email autoconfirm off", s.body.mailer_autoconfirm !== true);
  }

  // 2. staff-invite gateway + function gates (no email can be sent on these paths)
  const invite = JSON.stringify({ action: "invite", email: "probe@example.test", role: "agent" });
  const r1 = await req(FN, { method: "POST", headers: { "content-type": "application/json" }, body: invite });
  check("staff-invite without Authorization -> 401", r1.status === 401, `HTTP ${r1.status}`);
  const r2 = await req(FN, { method: "POST", headers: { authorization: "Bearer not.a.jwt", "content-type": "application/json" }, body: "{}" });
  check("staff-invite with a malformed JWT -> 401", r2.status === 401, `HTTP ${r2.status}`);
  if (ANON_JWT) {
    const h = { authorization: `Bearer ${ANON_JWT}`, apikey: ANON_JWT, "content-type": "application/json" };
    const r3 = await req(FN, { method: "POST", headers: h, body: '{"action":"nuke"}' });
    check("staff-invite bad body -> 400", r3.status === 400 && r3.body?.error?.message === "invalid_input:action", `HTTP ${r3.status}`);
    const r4 = await req(FN, { method: "POST", headers: h, body: invite });
    check("staff-invite anon session -> 401", r4.status === 401, `HTTP ${r4.status} ${r4.body?.error?.message ?? ""}`);
    const r5 = await req(FN, { method: "GET", headers: h });
    check("staff-invite GET -> 405", r5.status === 405, `HTTP ${r5.status}`);
  } else {
    info("function 400/401 probes skipped", "set SEELD_ANON_JWT to the legacy anon JWT to run them");
  }
  const o = await req(FN, { method: "OPTIONS", headers: { origin: "https://evil.example", "access-control-request-method": "POST" } });
  check("staff-invite CORS refuses a foreign origin", !o.headers.get("access-control-allow-origin"), `HTTP ${o.status}`);

  // 3. Data API: is the 'staff' schema exposed yet? (anon must never get through)
  const p = await req(`${URL_}/rest/v1/rpc/admin_assert_fresh`, {
    method: "POST",
    headers: { apikey: KEY, "content-type": "application/json", "content-profile": "staff" },
    body: "{}",
  });
  const code = p.body?.code;
  if (code === "PGRST106") info("Data API 'staff' schema", "NOT exposed yet (owner step: add 'staff' to Exposed schemas)");
  else check("anon cannot call staff.admin_assert_fresh", p.status === 401 || p.status === 403, `HTTP ${p.status} ${code ?? ""}`);
  // core/crm/audit are never exposed
  const c = await req(`${URL_}/rest/v1/invitations?select=id&limit=1`, { headers: { apikey: KEY, "accept-profile": "core" } });
  check("core schema not exposed (invitations unreachable)", c.status === 406 || c.body?.code === "PGRST106", `HTTP ${c.status}`);
}

function claimsOf(jwt) {
  const part = jwt.split(".")[1];
  return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
}

async function enroll() {
  const email = process.env.STAFF_EMAIL, password = process.env.STAFF_PASSWORD, out = process.env.STAFF_TOTP_OUT;
  if (!KEY || !email || !password) {
    console.error("--enroll needs SEELD_PUBLISHABLE_KEY, STAFF_EMAIL and STAFF_PASSWORD in the environment");
    process.exit(2);
  }
  const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const captchaToken = process.env.STAFF_CAPTCHA_TOKEN || undefined;
  const { error: e1 } = await sb.auth.signInWithPassword({ email, password, options: { captchaToken } });
  if (e1) { console.error(`sign-in failed: ${e1.code ?? e1.name}`); process.exit(1); }
  console.log("signed in (aal1)");

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const { data: f, error: e2 } = await sb.auth.mfa.listFactors();
    if (e2) throw new Error(`listFactors: ${e2.code ?? e2.name}`);
    let factor = (f?.totp ?? []).find((x) => x.status === "verified");
    if (!factor) {
      if (!out) throw new Error("first enrolment: set STAFF_TOTP_OUT to a file outside the repository");
      const target = resolve(out);
      const rel = relative(REPO, target);
      if (!rel.startsWith("..") && !isAbsolute(rel)) throw new Error("STAFF_TOTP_OUT must be outside the repository");
      const { data: en, error: e3 } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "seeld-staff" });
      if (e3) throw new Error(`enroll: ${e3.code ?? e3.name}`);
      writeFileSync(target, `${en.totp.uri}\n`, { mode: 0o600 });
      console.log(`TOTP factor created. The otpauth URI was written to ${target}: add it to an authenticator app, then delete the file.`);
      factor = { id: en.id };
    }
    const code = (await rl.question("6-digit code from the authenticator: ")).trim();
    const { error: e4 } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (e4) throw new Error(`verify: ${e4.code ?? e4.name}`);
    const { data: sess } = await sb.auth.getSession();
    const c = claimsOf(sess.session.access_token);
    check("session is aal2 after TOTP", c.aal === "aal2", `aal=${c.aal}`);
    check("amr carries a fresh totp entry", Array.isArray(c.amr) && c.amr.some((a) => a.method === "totp"), (c.amr || []).map((a) => a.method).join(","));
    const staff = createClient(URL_, KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      db: { schema: "staff" },
      global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } },
    });
    const { data: me, error: e5 } = await staff.rpc("admin_assert_fresh");
    if (e5?.code === "PGRST106") info("staff.admin_assert_fresh", "Data API does not expose 'staff' yet");
    else check("staff.admin_assert_fresh passes (fresh admin)", !e5 && me?.user_id === c.sub, e5 ? `${e5.code} ${e5.message}` : "ok");
  } finally {
    rl.close();
    await sb.auth.signOut({ scope: "local" }).catch(() => {});
  }
}

const mode = process.argv.includes("--enroll") ? "enroll" : "dry-run";
console.log(`identity verification: ${mode} against ${URL_}`);
try {
  if (mode === "enroll") await enroll();
  else await dryRun();
} catch (e) {
  console.error(`error: ${e instanceof Error ? e.message : String(e)}`);
  failures++;
}
console.log(`\n${results.filter((r) => r.ok).length} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
