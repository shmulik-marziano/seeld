#!/usr/bin/env node
// CI (verify job, after the build): the Content-Security-Policy in vercel.json agrees with the Supabase project(s)
// the built bundle actually calls. Rules in scripts/ci/lib/csp-cutover.mjs. This turns the cutover checklist item
// "remove https:// and wss://lvifatyksqizwcutfbqp.supabase.co from the CSP in the same change that switches
// VITE_SUPABASE_URL" into a gate: a bundle off Tokyo with Tokyo still in the CSP fails, and so does a bundle that
// calls a project the CSP blocks.
// Usage: node scripts/ci/check-csp-bundle.mjs [--vercel vercel.json] [--dist dist]
// env: CUTOVER_DONE=1 (repository variable after the cutover) additionally forbids any Tokyo reference.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { bundleRefs, cspCutoverProblems } from "./lib/csp-cutover.mjs";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const vercelPath = arg("--vercel", "vercel.json");
const distDir = arg("--dist", "dist");

const vercel = JSON.parse(readFileSync(vercelPath, "utf8"));
const csps = [];
for (const block of vercel.headers ?? []) {
  for (const h of block.headers ?? []) {
    if (String(h.key).toLowerCase() === "content-security-policy") csps.push({ source: block.source, value: String(h.value) });
  }
}

if (!existsSync(distDir)) {
  console.error(`FAIL  ${distDir}/ not found (run the build first)`);
  process.exit(1);
}
const refs = new Set();
let files = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(m?js|html)$/.test(name)) {
      files++;
      for (const r of bundleRefs(readFileSync(p, "utf8"))) refs.add(r);
    }
  }
};
walk(distDir);

const problems = [];
if (csps.length === 0) problems.push(`${vercelPath}: no Content-Security-Policy header`);
if (refs.size === 0) problems.push(`no https://<ref>.supabase.co found in ${files} file(s) under ${distDir}/ (cannot check the CSP against the bundle)`);
for (const { source, value } of csps) {
  for (const p of cspCutoverProblems({ csp: value, refs, cutoverDone: process.env.CUTOVER_DONE === "1" })) problems.push(`${source}: ${p}`);
}

console.log(`bundle calls: ${[...refs].join(", ") || "(none)"}; CSP blocks: ${csps.length}; CUTOVER_DONE=${process.env.CUTOVER_DONE === "1" ? 1 : 0}`);
if (problems.length) {
  for (const p of problems) console.log(`FAIL  ${p}`);
  process.exit(1);
}
console.log("PASS  vercel.json CSP matches the bundle");
