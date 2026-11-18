// health:  node scripts/health-check.mjs [baseUrl]    (default https://seeld.co.il)
// Read-only checks against a deployed site. Exit 1 when anything fails.
//  - key routes return 200 and (for content pages) contain an h1
//  - JS/CSS chunks referenced by the home page and one insurance page return the right content type,
//    not HTML (catches the stale cached chunk problem)
//  - sitemap.xml, llms.txt, robots.txt reachable
//  - TLS certificate valid for more than 14 days
import tls from "node:tls";

const BASE = (process.argv[2] ?? process.env.HEALTH_BASE_URL ?? "https://seeld.co.il").replace(/\/+$/, "");
const TLS_MIN_DAYS = 14;
const results = [];
const record = (ok, name, detail = "") => {
  results.push({ ok, name, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};

async function get(path, init = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000), headers: { "user-agent": "seeld-site-watch/1.0" }, ...init });
  return res;
}

const CONTENT_ROUTES = ["/", "/insurance/life", "/travel", "/blog", "/contact"];
const SHELL_ROUTES = ["/app/auth"]; // SPA shell, no prerendered h1 guaranteed

const pages = {};
for (const route of CONTENT_ROUTES) {
  try {
    const res = await get(route);
    const html = await res.text();
    pages[route] = html;
    record(res.status === 200, `route ${route} status`, String(res.status));
    record(/<h1[\s>]/i.test(html), `route ${route} has h1`);
  } catch (e) {
    record(false, `route ${route}`, e.message);
  }
}
for (const route of SHELL_ROUTES) {
  try {
    const res = await get(route);
    await res.arrayBuffer();
    record(res.status === 200, `route ${route} status`, String(res.status));
  } catch (e) {
    record(false, `route ${route}`, e.message);
  }
}

// Referenced assets of the home page and one insurance page.
function assetRefs(html) {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) refs.add(m[1]);
  return [...refs];
}
for (const route of ["/", "/insurance/life"]) {
  const html = pages[route];
  if (!html) continue;
  const refs = assetRefs(html);
  record(refs.length > 0, `assets referenced by ${route}`, `${refs.length} found`);
  for (const ref of refs) {
    try {
      const res = await get(ref);
      const ct = res.headers.get("content-type") ?? "";
      const body = await res.text();
      const isJs = ref.endsWith(".js");
      const isCss = ref.endsWith(".css");
      let ok = res.status === 200;
      let why = `${res.status} ${ct}`;
      if (isJs) ok = ok && /javascript|ecmascript/.test(ct) && !/^\s*<(!doctype|html)/i.test(body);
      if (isCss) ok = ok && /text\/css/.test(ct) && !/^\s*<(!doctype|html)/i.test(body);
      if (!isJs && !isCss) ok = ok && !/text\/html/.test(ct);
      record(ok, `asset ${ref} (${route})`, ok ? "" : why);
    } catch (e) {
      record(false, `asset ${ref} (${route})`, e.message);
    }
  }
}

for (const path of ["/sitemap.xml", "/llms.txt", "/robots.txt"]) {
  try {
    const res = await get(path);
    const body = await res.text();
    record(res.status === 200 && body.length > 20 && !/^\s*<!doctype html/i.test(body), `${path} reachable`, String(res.status));
  } catch (e) {
    record(false, `${path} reachable`, e.message);
  }
}

// Optional: build info written by scripts/build-info.mjs. Absent on older deploys: informational only.
try {
  const res = await get("/health.json");
  if (res.status === 200 && /json/.test(res.headers.get("content-type") ?? "")) {
    const j = await res.json();
    console.log(`INFO  health.json commit=${String(j.commit).slice(0, 8)} routes=${j.routes} builtAt=${j.builtAt}`);
  } else {
    console.log(`INFO  /health.json not served (status ${res.status}); expected until the next deploy ships build-info`);
  }
} catch (e) {
  console.log(`INFO  /health.json check skipped: ${e.message}`);
}

// Backend health (FOUNDATION v2.2 §13, IMPLEMENTATION-PLAN item 21). Only when HEALTH_URL is set (repository
// variable, set at cutover to https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health); unset = no change.
// FAILS unless the endpoint answers 200 with degraded === false (stuck outbox, dead rows in 24 h, alert pending
// > 30 min, no finished watchdog run in 30 min, or no answer). HEALTH_APIKEY (optional) = the publishable key.
if (process.env.HEALTH_URL) {
  try {
    const res = await fetch(process.env.HEALTH_URL, {
      headers: { "user-agent": "seeld-site-watch/1.0", ...(process.env.HEALTH_APIKEY ? { apikey: process.env.HEALTH_APIKEY } : {}) },
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.json().catch(() => null);
    record(res.status === 200 && body !== null && body.degraded === false, "backend health degraded=false", `status ${res.status}, degraded=${JSON.stringify(body?.degraded)}`);
  } catch (e) {
    record(false, "backend health degraded=false", e.message);
  }
}

// TLS expiry
await new Promise((resolveP) => {
  const u = new URL(BASE);
  if (u.protocol !== "https:") {
    record(true, "tls", "skipped (not https)");
    return resolveP();
  }
  const s = tls.connect({ host: u.hostname, port: Number(u.port) || 443, servername: u.hostname, timeout: 15_000 }, () => {
    const cert = s.getPeerCertificate();
    const days = Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000);
    record(s.authorized && days > TLS_MIN_DAYS, "tls certificate", `${days} days left, authorized=${s.authorized}`);
    s.end();
    resolveP();
  });
  s.on("error", (e) => {
    record(false, "tls certificate", e.message);
    resolveP();
  });
  s.on("timeout", () => {
    record(false, "tls certificate", "timeout");
    s.destroy();
    resolveP();
  });
});

const failed = results.filter((r) => !r.ok);
console.log(`\nhealth: ${results.length - failed.length}/${results.length} passed against ${BASE}`);
if (failed.length) {
  console.error("FAILED:\n" + failed.map((f) => `  - ${f.name} ${f.detail}`).join("\n"));
  process.exit(1);
}
