#!/usr/bin/env node
// Secret-scope gate for GitHub workflows (FOUNDATION v2.2 §10/§12, ADR-44, review R2-B2 + rereview fixes).
// Usage: node scripts/ci/check-secret-scope.mjs [workflowsDir]   (default .github/workflows)
//
// Fails when:
//  1. a job references secrets.SUPABASE_DB_URL without `environment: production`, or
//     secrets.CONTENT_DUMP_DB_URL without `environment: backup`;
//  2. a job references any other database-URL-like secret (…DB_URL, DATABASE_URL, PGPASSWORD) without an
//     environment;
//  3. a workflow-level `env:` references a database secret (that would expose it to every job);
//  4. a workflow that uses a database secret can be triggered by pull_request, pull_request_target, push,
//     workflow_run, issue_comment or pull_request_review (DB secrets run only from workflow_dispatch/schedule);
//  5. `secrets: inherit` appears anywhere (a reusable workflow would receive every repository secret);
//  6. `toJSON(secrets)` appears anywhere (dumps every secret into a step);
//  7. any workflow is triggered by `pull_request_target` (runs fork code with repository secrets);
//  8. any workflow reads SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY as a secret or sets it as an env
//     key (not used in CI by design).
// Line-based YAML reading on purpose (no dependency); it understands the block styles used in this repo and
// fails closed on the patterns above wherever they appear.
import { readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const dir = process.argv[2] ?? join(process.cwd(), ".github", "workflows");
const REQUIRED_ENV = { SUPABASE_DB_URL: "production", CONTENT_DUMP_DB_URL: "backup" };
const DB_LIKE = /^(?:[A-Z0-9_]*DB_URL|[A-Z0-9_]*DATABASE_URL|PGPASSWORD)$/;
const FORBIDDEN_ANYWHERE = ["SUPABASE_ACCESS_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"];
const UNSAFE_TRIGGERS_FOR_DB = new Set([
  "pull_request", "pull_request_target", "push", "workflow_run", "issue_comment", "pull_request_review",
  "pull_request_review_comment",
]);

const problems = [];
const indentOf = (l) => l.length - l.trimStart().length;
const isBlank = (l) => l.trim() === "" || l.trim().startsWith("#");
const stripComment = (l) => l.replace(/\s+#.*$/, "");
const secretRefs = (text) => {
  const out = new Set();
  for (const m of text.matchAll(/secrets\s*\.\s*([A-Za-z0-9_]+)/g)) out.add(m[1]);
  for (const m of text.matchAll(/secrets\s*\[\s*['"]([A-Za-z0-9_]+)['"]\s*\]/g)) out.add(m[1]);
  return out;
};

function topLevelBlock(lines, key) {
  const re = new RegExp(`^["']?${key}["']?\\s*:(.*)$`);
  const start = lines.findIndex((l) => indentOf(l) === 0 && re.test(l));
  if (start < 0) return null;
  const inline = stripComment(lines[start].match(re)[1]).trim();
  let end = start + 1;
  while (end < lines.length && (isBlank(lines[end]) || indentOf(lines[end]) > 0)) end++;
  return { start, end, inline, body: lines.slice(start + 1, end) };
}

function triggersOf(lines) {
  const block = topLevelBlock(lines, "on") ?? topLevelBlock(lines, "true"); // YAML 1.1 reads `on` as true
  if (!block) return [];
  if (block.inline) {
    const v = block.inline.replace(/^\[|\]$/g, "");
    return v.split(",").map((s) => s.trim().replace(/['"]/g, "")).filter(Boolean);
  }
  const body = block.body.filter((l) => !isBlank(l));
  if (!body.length) return [];
  const ind = indentOf(body[0]);
  const out = [];
  for (const l of body) {
    if (indentOf(l) !== ind) continue;
    const t = l.trim();
    if (t.startsWith("- ")) out.push(t.slice(2).trim().replace(/['"]/g, ""));
    else {
      const m = t.match(/^["']?([A-Za-z_]+)["']?\s*:/);
      if (m) out.push(m[1]);
    }
  }
  return out;
}

function jobsOf(lines) {
  const block = topLevelBlock(lines, "jobs");
  if (!block) return [];
  const body = block.body;
  const first = body.find((l) => !isBlank(l));
  if (!first) return [];
  const jobIndent = indentOf(first);
  const jobs = [];
  let cur = null;
  body.forEach((l, i) => {
    if (!isBlank(l) && indentOf(l) === jobIndent) {
      const m = l.trim().match(/^["']?([A-Za-z0-9_\-]+)["']?\s*:/);
      if (m) {
        cur = { name: m[1], lines: [], line: block.start + 2 + i };
        jobs.push(cur);
        return;
      }
    }
    if (cur) cur.lines.push(l);
  });
  for (const job of jobs) {
    const content = job.lines.filter((l) => !isBlank(l));
    const childIndent = content.length ? indentOf(content[0]) : jobIndent + 2;
    job.environment = null;
    for (let i = 0; i < job.lines.length; i++) {
      const l = job.lines[i];
      if (isBlank(l) || indentOf(l) !== childIndent) continue;
      const m = stripComment(l).trim().match(/^environment\s*:\s*(.*)$/);
      if (!m) continue;
      if (m[1]) job.environment = m[1].replace(/['"]/g, "").trim();
      else {
        for (let j = i + 1; j < job.lines.length && (isBlank(job.lines[j]) || indentOf(job.lines[j]) > childIndent); j++) {
          const n = stripComment(job.lines[j]).trim().match(/^name\s*:\s*(.+)$/);
          if (n) job.environment = n[1].replace(/['"]/g, "").trim();
        }
      }
    }
  }
  return jobs;
}

let files;
try {
  files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort();
} catch (e) {
  console.error(`FAIL  cannot read ${dir}: ${e.message}`);
  process.exit(1);
}

for (const file of files) {
  const text = readFileSync(join(dir, file), "utf8");
  const lines = text.split(/\r?\n/);
  const where = basename(file);
  const triggers = triggersOf(lines);

  if (triggers.includes("pull_request_target") || /^\s*pull_request_target\s*:/m.test(text)) {
    problems.push(`${where}: pull_request_target trigger is forbidden`);
  }
  lines.forEach((l, i) => {
    const code = stripComment(l);
    if (/secrets\s*:\s*inherit\b/.test(code)) problems.push(`${where}:${i + 1}: 'secrets: inherit' is forbidden`);
    if (/toJSON\s*\(\s*secrets\s*\)/i.test(code)) problems.push(`${where}:${i + 1}: toJSON(secrets) is forbidden`);
    for (const name of FORBIDDEN_ANYWHERE) {
      // a secret reference, or an env/with key of that name (grep patterns that merely mention it are fine)
      if (secretRefs(code).has(name) || new RegExp(`^\\s*${name}\\s*:`).test(code)) {
        problems.push(`${where}:${i + 1}: ${name} must not be used in workflows`);
      }
    }
  });

  const wfEnv = topLevelBlock(lines, "env");
  if (wfEnv) {
    for (const name of secretRefs([wfEnv.inline, ...wfEnv.body].join("\n"))) {
      if (name in REQUIRED_ENV || DB_LIKE.test(name)) {
        problems.push(`${where}: workflow-level env references secrets.${name}; scope it to one environment job`);
      }
    }
  }

  let usesDbSecret = false;
  for (const job of jobsOf(lines)) {
    for (const name of secretRefs(job.lines.map(stripComment).join("\n"))) {
      if (name in REQUIRED_ENV) {
        usesDbSecret = true;
        if (job.environment !== REQUIRED_ENV[name]) {
          problems.push(`${where}: job '${job.name}' uses secrets.${name} without 'environment: ${REQUIRED_ENV[name]}' (found ${job.environment ?? "none"})`);
        }
      } else if (DB_LIKE.test(name)) {
        usesDbSecret = true;
        if (!job.environment) problems.push(`${where}: job '${job.name}' uses database secret secrets.${name} without an environment`);
      }
    }
  }
  if (usesDbSecret) {
    const bad = triggers.filter((t) => UNSAFE_TRIGGERS_FOR_DB.has(t));
    if (bad.length) problems.push(`${where}: uses a database secret but can be triggered by ${bad.join(", ")} (allowed: workflow_dispatch, schedule)`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`FAIL  ${p}`);
  console.error(`${problems.length} secret-scope problem(s) in ${dir}`);
  process.exit(1);
}
console.log(`PASS  ${files.length} workflow file(s) in ${dir}: database secrets are environment-scoped`);
