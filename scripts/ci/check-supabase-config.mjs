#!/usr/bin/env node
// Asserts the reviewed values of supabase/config.toml (FOUNDATION v2.2, IMPLEMENTATION-PLAN item 19, review R3-B1).
// Usage: node scripts/ci/check-supabase-config.mjs [path/to/config.toml] [path/to/functions-allowlist.txt]
// Exit 1 with one line per violation. No network, no dependencies.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseToml } from "./lib/mini-toml.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const configPath = process.argv[2] ?? join(root, "supabase", "config.toml");
const allowlistPath = process.argv[3] ?? join(here, "functions-allowlist.txt");

const problems = [];
const fail = (msg) => problems.push(msg);

let cfg;
try {
  cfg = parseToml(readFileSync(configPath, "utf8"));
} catch (e) {
  console.error(`FAIL  cannot parse ${configPath}: ${e.message}`);
  process.exit(1);
}

const get = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), cfg);
const expectEq = (path, want) => {
  const got = get(path);
  const same = Array.isArray(want) ? JSON.stringify(got) === JSON.stringify(want) : got === want;
  if (!same) fail(`${path} = ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
};
const expectEnvRef = (path, name) => {
  const got = get(path);
  if (got !== `env(${name})`) fail(`${path} must be the reference env(${name}), never a literal value`);
};

// Project and API surface
expectEq("project_id", "seeld-site");
expectEq("api.schemas", ["api", "staff"]);
expectEq("api.extra_search_path", ["extensions"]);
expectEq("api.max_rows", 200);

// Auth core
expectEq("auth.site_url", "https://seeld.co.il");
expectEq("auth.additional_redirect_urls", ["https://seeld.co.il/**", "https://www.seeld.co.il/**"]);
expectEq("auth.enable_signup", false);
expectEq("auth.enable_anonymous_sign_ins", false);
expectEq("auth.enable_manual_linking", false);
expectEq("auth.jwt_expiry", 900);
expectEq("auth.refresh_token_reuse_interval", 10);
expectEq("auth.minimum_password_length", 12);
expectEq("auth.password_requirements", "lower_upper_letters_digits_symbols");
expectEq("auth.sessions.timebox", "12h");
expectEq("auth.sessions.inactivity_timeout", "1h");

// Email / SMTP / SMS
// [auth.email].enable_signup is the Email PROVIDER switch in the CLI (GOTRUE_EXTERNAL_EMAIL_ENABLED); it must
// stay true or nobody can log in. Signups are blocked by auth.enable_signup = false above (verified 2026-11-18:
// a signup with a valid CAPTCHA token returns 422 signup_disabled).
expectEq("auth.email.enable_signup", true);
expectEq("auth.email.otp_length", 8);
expectEq("auth.email.otp_expiry", 600);
expectEq("auth.email.max_frequency", "1m0s");
expectEq("auth.email.secure_password_change", true);
expectEq("auth.email.smtp.enabled", true);
expectEq("auth.email.smtp.host", "smtp.resend.com");
expectEnvRef("auth.email.smtp.pass", "RESEND_SMTP_PASSWORD");
expectEq("auth.sms.enable_signup", false);

// CAPTCHA
expectEq("auth.captcha.enabled", true);
expectEq("auth.captcha.provider", "turnstile");
expectEnvRef("auth.captcha.secret", "TURNSTILE_SECRET_KEY");

// MFA
expectEq("auth.mfa.max_enrolled_factors", 2);
expectEq("auth.mfa.totp.enroll_enabled", true);
expectEq("auth.mfa.totp.verify_enabled", true);
if (get("auth.mfa.phone.enroll_enabled") === true || get("auth.mfa.phone.verify_enabled") === true) {
  fail("auth.mfa.phone must stay off");
}

// Rate limits
expectEq("auth.rate_limit.email_sent", 10);
expectEq("auth.rate_limit.sign_in_sign_ups", 20);
expectEq("auth.rate_limit.sms_sent", 0);
expectEq("auth.rate_limit.anonymous_users", 0);
expectEq("auth.rate_limit.token_refresh", 150);
expectEq("auth.rate_limit.token_verifications", 20);

// Signup hook
expectEq("auth.hook.before_user_created.enabled", true);
expectEq("auth.hook.before_user_created.uri", "pg-functions://postgres/private/hook_before_user_created");

// No social login, ever. Any [auth.external.*] with enabled = true fails; so does any SMS provider block enabled.
for (const [name, block] of Object.entries(get("auth.external") ?? {})) {
  if (block && block.enabled === true) fail(`auth.external.${name}.enabled = true (social/external login is forbidden)`);
}
for (const p of ["twilio", "twilio_verify", "messagebird", "textlocal", "vonage"]) {
  if (get(`auth.sms.${p}.enabled`) === true) fail(`auth.sms.${p}.enabled = true (SMS is off)`);
}

// Edge functions
const allow = readFileSync(allowlistPath, "utf8")
  .split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
const expectedJwt = {
  "lead-intake": false, "notify-worker": false, "chat-bot": false, "fetch-cma-data": false, health: false,
  "staff-invite": true, "api-v1": true, "queue-worker": true,
};
const fns = get("functions") ?? {};
for (const forbidden of ["sync-tracks", "invite-agent"]) {
  if (forbidden in fns) fail(`[functions.${forbidden}] must not exist (Tokyo-era function)`);
}
for (const [name, block] of Object.entries(fns)) {
  if (!allow.includes(name)) fail(`[functions.${name}] is not in scripts/ci/functions-allowlist.txt`);
  if (typeof block.verify_jwt !== "boolean") fail(`[functions.${name}] must set verify_jwt explicitly`);
  else if (name in expectedJwt && block.verify_jwt !== expectedJwt[name]) {
    fail(`[functions.${name}] verify_jwt = ${block.verify_jwt}, expected ${expectedJwt[name]}`);
  }
}
for (const name of allow) {
  if (name !== "_shared" && !(name in fns)) fail(`allowlisted function ${name} has no [functions.${name}] block`);
}

// No secret-looking literal anywhere in the file (keys, JWTs, passwords).
const rawText = readFileSync(configPath, "utf8");
if (/sb_secret_|sb_publishable_|eyJhbGciOi|re_[A-Za-z0-9]{16,}|0x4AAAA/.test(rawText)) {
  fail("config.toml contains a literal key/token; use env(...) references only");
}

if (problems.length) {
  for (const p of problems) console.error(`FAIL  ${p}`);
  console.error(`${problems.length} problem(s) in ${configPath}`);
  process.exit(1);
}
console.log(`PASS  ${configPath}: reviewed values present (${Object.keys(fns).length} functions, no external providers)`);
