#!/usr/bin/env node
// Live check of a Supabase project's public Auth/API surface (local stack in CI, or a hosted project in
// preview-smoke). Read-only: GET /auth/v1/settings, an optional ranged GET on one api view, and an optional
// health RPC. Uses only the publishable key, which is public by design.
//
// env:
//   SUPABASE_URL          e.g. http://127.0.0.1:54321 or https://qxhpolktdfgcbxtfxgov.supabase.co   (required)
//   SUPABASE_KEY          publishable (or legacy anon) key                                          (required)
//   MAX_ROWS_PROBE        optional api view name, e.g. investment_tracks: asserts a 0-999 range returns <= MAX_ROWS
//   MAX_ROWS              default 200
//   MAX_ROWS_MIN_TOTAL    optional: also require the view's exact total to be greater than this (proves the cap bites)
//   CHECK_HEALTH_RPC      "1" to require POST /rest/v1/rpc/health (schema api) to answer 200 with a degraded boolean
//   CHECK_SIGNUP_REJECTED "1" to also POST /auth/v1/signup with a random address and require a 4xx
//                         (on a project with CAPTCHA the rejection may come from CAPTCHA first, so
//                         disable_signup=true in settings stays the primary assertion)
const url = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.SUPABASE_KEY ?? "";
if (!url || !key) {
  console.error("FAIL  SUPABASE_URL and SUPABASE_KEY are required (publishable key only)");
  process.exit(1);
}
const MAX_ROWS = Number(process.env.MAX_ROWS ?? 200);
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const problems = [];
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { problems.push(m); console.error(`FAIL  ${m}`); };
const timeout = () => AbortSignal.timeout(20_000);

// 1. Auth settings
try {
  const res = await fetch(`${url}/auth/v1/settings`, { headers, signal: timeout() });
  if (res.status !== 200) fail(`GET /auth/v1/settings -> ${res.status}`);
  else {
    const s = await res.json();
    if (s.disable_signup === true) pass("auth settings: disable_signup = true");
    else fail(`auth settings: disable_signup = ${JSON.stringify(s.disable_signup)} (signups must be off)`);
    const ext = s.external ?? {};
    // email is the only allowed provider (password + invite links). phone, anonymous and every social one stay off.
    const enabled = Object.entries(ext).filter(([k, v]) => v === true && k !== "email").map(([k]) => k);
    if (enabled.length) fail(`auth settings: external providers enabled: ${enabled.join(", ")}`);
    else pass(`auth settings: no external provider besides email (${Object.keys(ext).length} listed)`);
    // The email provider must stay ON: it is the only staff login path (password + TOTP, invite links).
    if (ext.email === true) pass("auth settings: email provider on (staff login path)");
    else fail("auth settings: email provider is off, so staff cannot log in");
    if (ext.anonymous_users === true || s.anonymous_users === true) fail("auth settings: anonymous sign-ins enabled");
    if (s.saml_enabled === true) fail("auth settings: SAML enabled");
  }
} catch (e) {
  fail(`GET /auth/v1/settings: ${e.message}`);
}

// 2. Optional: signup really rejected
if (process.env.CHECK_SIGNUP_REJECTED === "1") {
  try {
    const email = `ci-probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.invalid`;
    const res = await fetch(`${url}/auth/v1/signup`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: `Ci-${Math.random().toString(36).slice(2)}-Aa1!x` }),
      signal: timeout(),
    });
    const body = await res.text();
    if (res.status >= 400 && res.status < 500) pass(`signup with a random address rejected (${res.status})`);
    else fail(`signup with a random address -> ${res.status} ${body.slice(0, 120)}`);
  } catch (e) {
    fail(`POST /auth/v1/signup: ${e.message}`);
  }
}

// 3. Optional: max_rows cap on the api schema
const probe = process.env.MAX_ROWS_PROBE;
if (probe) {
  try {
    const res = await fetch(`${url}/rest/v1/${encodeURIComponent(probe)}?select=*`, {
      headers: { ...headers, "Accept-Profile": "api", Range: "0-999", "Range-Unit": "items", Prefer: "count=exact" },
      signal: timeout(),
    });
    if (res.status !== 200 && res.status !== 206) fail(`GET api.${probe} -> ${res.status}`);
    else {
      const rows = await res.json();
      const total = Number((res.headers.get("content-range") ?? "").split("/")[1]);
      if (Array.isArray(rows) && rows.length <= MAX_ROWS) pass(`api.${probe}: a 0-999 range returned ${rows.length} rows (cap ${MAX_ROWS}, total ${Number.isFinite(total) ? total : "?"})`);
      else fail(`api.${probe}: a 0-999 range returned ${Array.isArray(rows) ? rows.length : "non-array"} rows (cap ${MAX_ROWS})`);
      const minTotal = Number(process.env.MAX_ROWS_MIN_TOTAL ?? NaN);
      if (Number.isFinite(minTotal) && !(total > minTotal)) fail(`api.${probe}: total ${total} is not above ${minTotal}, so the cap is not proven`);
    }
  } catch (e) {
    fail(`GET api.${probe}: ${e.message}`);
  }
}

// 4. Optional: health RPC
if (process.env.CHECK_HEALTH_RPC === "1") {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/health`, {
      method: "POST",
      headers: { ...headers, "Content-Profile": "api", "Content-Type": "application/json" },
      body: "{}",
      signal: timeout(),
    });
    const body = await res.json().catch(() => null);
    if (res.status === 200 && body && typeof body.degraded === "boolean") pass(`rpc api.health ok (degraded=${body.degraded})`);
    else fail(`rpc api.health -> ${res.status} ${JSON.stringify(body)?.slice(0, 120)}`);
  } catch (e) {
    fail(`rpc api.health: ${e.message}`);
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s) against ${new URL(url).host}`);
  process.exit(1);
}
console.log(`OK    ${new URL(url).host}`);
