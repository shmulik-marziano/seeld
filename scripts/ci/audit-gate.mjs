#!/usr/bin/env node
// Ratchet over `npm audit --omit=dev`: fails on any high/critical advisory in production dependencies that is
// NOT listed in scripts/ci/audit-baseline.json. The baseline is the known debt on 2026-11-18 (npm reported
// 21 high + 1 critical packages = 39 advisory/package pairs, e.g. xlsx, zod, react-router; fixing them needs
// dependency upgrades outside the CI task).
// A plain `npm audit --audit-level=high` would keep CI red forever and deadlock branch protection.
//
// Usage:
//   node scripts/ci/audit-gate.mjs                    # gate (CI)
//   node scripts/ci/audit-gate.mjs --write-baseline   # rewrite the baseline after a deliberate review
// Advisories that disappear from the audit are reported so the baseline can shrink; they never fail.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, "audit-baseline.json");
const write = process.argv.includes("--write-baseline");

let raw;
try {
  raw = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["audit", "--omit=dev", "--json"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32",
  });
} catch (e) {
  raw = e.stdout; // npm audit exits 1 when it finds anything
}
let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error("FAIL  npm audit did not return JSON");
  process.exit(1);
}
if (report.error) {
  console.error(`FAIL  npm audit error: ${report.error.summary ?? JSON.stringify(report.error)}`);
  process.exit(1);
}

const found = new Map(); // advisory id -> {severity, package, title}
for (const [pkg, v] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of v.via ?? []) {
    if (typeof via !== "object" || !via.url) continue;
    if (via.severity !== "high" && via.severity !== "critical") continue;
    const id = via.url.split("/").pop();
    found.set(`${id}:${pkg}`, { id, package: pkg, severity: via.severity, title: via.title });
  }
}
const current = [...found.keys()].sort();

if (write) {
  writeFileSync(baselinePath, JSON.stringify({
    note: "Known high/critical production advisories accepted on review. Shrink this list; never grow it without a review.",
    generated: new Date().toISOString().slice(0, 10),
    advisories: current,
  }, null, 2) + "\n");
  console.log(`wrote ${current.length} advisories to ${baselinePath}`);
  process.exit(0);
}

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")).advisories ?? [] : [];
const known = new Set(baseline);
const fresh = current.filter((k) => !known.has(k));
const gone = baseline.filter((k) => !found.has(k));

for (const k of gone) console.log(`INFO  no longer reported (remove from the baseline): ${k}`);
console.log(`INFO  ${current.length} high/critical production advisories, ${current.length - fresh.length} in the baseline`);
if (fresh.length) {
  for (const k of fresh) {
    const a = found.get(k);
    console.error(`FAIL  new ${a.severity} advisory ${a.id} in ${a.package}: ${a.title}`);
  }
  process.exit(1);
}
console.log("PASS  no new high/critical advisory in production dependencies");
