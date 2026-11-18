#!/usr/bin/env node
// HTTP smoke of a deployed site (Vercel preview or production), read-only. Checks what vercel.json and the
// api/*.ts functions promise (IMPLEMENTATION-PLAN item 22, VERCEL-CICD research §1.5/§1.9):
//  - /, a content page and an app-shell route answer 200; an unknown route answers 404
//  - security headers present; CSP has no ipapi.co, allows seeld-site + Turnstile, and its Supabase origins match
//    the projects the deployed bundle calls (scripts/ci/lib/csp-cutover.mjs: Tokyo leaves the CSP in the same
//    deploy that moves VITE_* off Tokyo; CUTOVER_DONE=1 forbids any Tokyo reference)
//  - a real hashed asset is `immutable`; a MISSING /assets/ file is 404 and NOT cacheable for a year
//    (the 2026-11-17 incident: a cached immutable 404 for a chunk)
//  - /api/* return JSON and are CDN-cacheable (region printed when visible); /api/geo is private
//  - /api/* are NOT truncated (IMPLEMENTATION-PLAN item 22 "page in 200-row Range steps", the precondition of the
//    VITE_SUPABASE_URL cutover: seeld-site caps a response at 200 rows): /api/funds length equals
//    /api/fund-status totalFunds, no list is exactly a max_rows cap (200 or 1000), and /api/tracks and /api/board
//    hold more than 200 rows
// Usage: node scripts/ci/preview-smoke.mjs <baseUrl>
// env: VERCEL_AUTOMATION_BYPASS_SECRET (optional; sent as x-vercel-protection-bypass for protected previews)
//      CUTOVER_DONE=1 (optional; after the cutover)
import { bundleRefs, cspCutoverProblems } from "./lib/csp-cutover.mjs";

const BASE = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(BASE)) {
  console.error("usage: node scripts/ci/preview-smoke.mjs <baseUrl>");
  process.exit(2);
}
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = { "user-agent": "seeld-preview-smoke/1.0", ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}) };
const problems = [];
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { problems.push(m); console.log(`FAIL  ${m}`); };
const get = (path, init = {}) =>
  fetch(BASE + path, { redirect: "manual", headers, signal: AbortSignal.timeout(30_000), ...init });

const YEAR = 31536000;
const cachesLong = (cc) => /immutable/i.test(cc ?? "") || Number((cc ?? "").match(/max-age=(\d+)/)?.[1] ?? 0) >= 86400 * 30;

// 1. Pages
let homeHtml = "";
for (const [path, want] of [["/", 200], ["/insurance/life", 200], ["/app/auth", 200], [`/no-such-page-${Date.now()}`, 404]]) {
  try {
    const res = await get(path);
    const body = await res.text();
    if (path === "/") homeHtml = body;
    if (res.status === want) pass(`${path} -> ${res.status}`);
    else fail(`${path} -> ${res.status}, expected ${want}`);
  } catch (e) {
    fail(`${path}: ${e.message}`);
  }
}

// 2. Security headers + CSP on the home page
try {
  const res = await get("/");
  await res.arrayBuffer();
  const h = (k) => res.headers.get(k) ?? "";
  for (const k of ["strict-transport-security", "x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options"]) {
    if (h(k)) pass(`header ${k}`);
    else fail(`header ${k} missing`);
  }
  const csp = h("content-security-policy");
  if (!csp) fail("Content-Security-Policy missing");
  else {
    // Supabase projects the deployed JavaScript calls: the entry and the modulepreloads of the home page.
    const refs = new Set();
    const scripts = [...new Set([...homeHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]))];
    for (const js of scripts) {
      try {
        const r = await get(js);
        for (const ref of bundleRefs(await r.text())) refs.add(ref);
      } catch (e) {
        fail(`${js}: ${e.message}`);
      }
    }
    if (refs.size === 0) console.log(`NOTE  no *.supabase.co URL in ${scripts.length} home-page script(s); CSP-vs-bundle rules use an empty set`);
    const cspProblems = cspCutoverProblems({ csp, refs, cutoverDone: process.env.CUTOVER_DONE === "1" });
    if (cspProblems.length) cspProblems.forEach((p) => fail(`CSP: ${p}`));
    else pass(`CSP connect-src matches the bundle (calls ${[...refs].join(", ") || "none found"}), no ipapi.co`);
    for (const d of ["script-src", "frame-src"]) {
      if (new RegExp(`${d}[^;]*https://challenges\\.cloudflare\\.com`).test(csp)) pass(`CSP ${d} allows Turnstile`);
      else fail(`CSP ${d} lacks https://challenges.cloudflare.com`);
    }
  }
} catch (e) {
  fail(`headers: ${e.message}`);
}

// 3. Assets: a real chunk is immutable; a missing one is a non-cacheable 404
const asset = homeHtml.match(/\/assets\/[A-Za-z0-9._-]+\.js/)?.[0];
if (!asset) fail("no /assets/*.js reference found on the home page");
else {
  try {
    const res = await get(asset);
    await res.arrayBuffer();
    const cc = res.headers.get("cache-control") ?? "";
    if (res.status === 200 && /immutable/.test(cc) && cc.includes(`max-age=${YEAR}`)) pass(`${asset} -> 200 immutable`);
    else fail(`${asset} -> ${res.status} cache-control "${cc}"`);
    const ct = res.headers.get("content-type") ?? "";
    if (!/javascript/.test(ct)) fail(`${asset} content-type "${ct}"`);
  } catch (e) {
    fail(`${asset}: ${e.message}`);
  }
}
try {
  const missing = `/assets/ci-missing-${Date.now()}.js`;
  const res = await get(missing);
  await res.arrayBuffer();
  const cc = res.headers.get("cache-control") ?? "";
  if (res.status === 404 && !cachesLong(cc)) pass(`missing asset -> 404, cache-control "${cc}"`);
  else fail(`missing asset -> ${res.status}, cache-control "${cc}" (a 404 must not be cached long)`);
} catch (e) {
  fail(`missing asset: ${e.message}`);
}

// 4. API functions
const api = {};
for (const path of ["/api/tracks", "/api/funds", "/api/board", "/api/company-map", "/api/fund-status"]) {
  try {
    const res = await get(path);
    const text = await res.text();
    const cc = res.headers.get("cache-control") ?? "";
    const vid = res.headers.get("x-vercel-id") ?? "";
    let json = null;
    try { json = JSON.parse(text); } catch { /* reported below */ }
    if (res.status !== 200 || json === null) { fail(`${path} -> ${res.status} ${text.slice(0, 80)}`); continue; }
    api[path] = json;
    const size = Array.isArray(json) ? `${json.length} rows` : "object";
    // Vercel's CDN consumes s-maxage and hands the browser "public"; a success must never be private/no-store.
    if (/no-store|private/.test(cc)) fail(`${path} success response is not CDN-cacheable ("${cc}")`);
    // x-vercel-id is "<edge PoP>::<function region>::<id>" on a function run, "<edge PoP>::<id>" on a CDN hit,
    // so the region is informational only.
    if (vid && vid.split("::").length > 2 && !/fra1/.test(vid)) console.log(`NOTE  ${path} function region is not fra1 (x-vercel-id ${vid})`);
    pass(`${path} -> 200 JSON (${size}), ${cc}${vid ? `, ${vid.split("::").slice(0, 2).join("::")}` : ""}`);
  } catch (e) {
    fail(`${path}: ${e.message}`);
  }
}
// 5. No truncation (item 22 paging). A list of exactly 200 or 1000 rows is a PostgREST max_rows cap, not data.
const CAPS = new Set([200, 1000]);
const MIN_ROWS = { "/api/tracks": 200, "/api/board": 200 };
for (const [path, json] of Object.entries(api)) {
  if (!Array.isArray(json)) continue;
  if (CAPS.has(json.length)) fail(`${path} returned exactly ${json.length} rows: a max_rows cap, the handler must page (200-row Range steps)`);
  if (MIN_ROWS[path] !== undefined && json.length <= MIN_ROWS[path]) fail(`${path} returned ${json.length} rows (expected more than ${MIN_ROWS[path]}; truncated?)`);
}
const totalFunds = api["/api/fund-status"]?.totalFunds;
if (Array.isArray(api["/api/funds"]) && Number.isFinite(totalFunds) && totalFunds > 0) {
  const n = api["/api/funds"].length;
  if (n === totalFunds) pass(`/api/funds is complete (${n} = fund-status totalFunds)`);
  else fail(`/api/funds returned ${n} rows but fund-status totalFunds is ${totalFunds}: truncated, page it`);
}

try {
  const res = await get("/api/geo");
  const body = await res.json().catch(() => null);
  const cc = res.headers.get("cache-control") ?? "";
  if (res.status === 200 && body && "country" in body && /private/.test(cc) && /no-store/.test(cc)) pass(`/api/geo -> 200 private`);
  else fail(`/api/geo -> ${res.status} "${cc}"`);
} catch (e) {
  fail(`/api/geo: ${e.message}`);
}

if (problems.length) {
  console.log(`${problems.length} problem(s) on ${new URL(BASE).host}`);
  process.exit(1);
}
console.log(`OK    ${new URL(BASE).host}`);
