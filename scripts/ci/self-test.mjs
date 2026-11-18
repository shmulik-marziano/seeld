#!/usr/bin/env node
// Self-test for the CI checkers (the "throwaway PR" acceptance cases of IMPLEMENTATION-PLAN item 21, run as
// fixtures so they stay true): every bad fixture must FAIL, every good one must PASS, and the real repository
// must PASS. Writes only to the OS temp folder. Usage: node scripts/ci/self-test.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const scope = join(here, "check-secret-scope.mjs");
const cfg = join(here, "check-supabase-config.mjs");
const tmp = mkdtempSync(join(tmpdir(), "seeld-ci-selftest-"));
let failures = 0;

const run = (script, args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
function expect(name, result, wantPass) {
  const ok = (result.status === 0) === wantPass;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "BAD "} ${wantPass ? "pass" : "fail"}: ${name}${ok ? "" : `\n${result.stdout}${result.stderr}`}`);
}

// ---- check-secret-scope fixtures ----
const MIGRATE_OK = `name: m
on:
  workflow_dispatch:
jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: supabase db push --db-url "$U"
        env:
          U: \${{ secrets.SUPABASE_DB_URL }}
`;
const DUMP_OK_MAP = `name: d
on:
  schedule:
    - cron: "0 0 * * 0"
  workflow_dispatch:
jobs:
  dump:
    runs-on: ubuntu-latest
    environment:
      name: backup
    steps:
      - run: pg_dump "\${{ secrets.CONTENT_DUMP_DB_URL }}"
`;
const scopeCases = [
  ["migrate job with environment production", MIGRATE_OK, true],
  ["dump job with environment map name backup", DUMP_OK_MAP, true],
  ["DB secret without environment", MIGRATE_OK.replace("    environment: production\n", ""), false],
  ["DB secret with the wrong environment", MIGRATE_OK.replace("environment: production", "environment: staging"), false],
  ["dump secret in the production environment", DUMP_OK_MAP.replace("name: backup", "name: production"), false],
  ["bracket syntax secrets['SUPABASE_DB_URL'] without environment",
    MIGRATE_OK.replace("    environment: production\n", "").replace("secrets.SUPABASE_DB_URL", "secrets['SUPABASE_DB_URL']"), false],
  ["DB secret in a pull_request workflow even with environment", MIGRATE_OK.replace("  workflow_dispatch:", "  pull_request:"), false],
  ["DB secret in workflow-level env", `name: x
on: workflow_dispatch
env:
  U: \${{ secrets.SUPABASE_DB_URL }}
jobs:
  a:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo
`, false],
  ["unknown DB-like secret without environment", MIGRATE_OK.replace("    environment: production\n", "").replace("SUPABASE_DB_URL", "STAGING_DATABASE_URL"), false],
  ["secrets: inherit", `name: x
on: workflow_dispatch
jobs:
  call:
    uses: ./.github/workflows/other.yml
    secrets: inherit
`, false],
  ["reusable workflow passing the DB secret without environment", `name: x
on: workflow_dispatch
jobs:
  call:
    uses: ./.github/workflows/other.yml
    secrets:
      db: \${{ secrets.SUPABASE_DB_URL }}
`, false],
  ["pull_request_target trigger", `name: x
on:
  pull_request_target:
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - run: echo
`, false],
  ["pull_request_target in an inline list", `name: x
on: [push, pull_request_target]
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - run: echo
`, false],
  ["toJSON(secrets)", `name: x
on: push
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - run: echo '\${{ toJSON(secrets) }}'
`, false],
  ["SUPABASE_ACCESS_TOKEN secret", `name: x
on: workflow_dispatch
jobs:
  a:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo
        env:
          T: \${{ secrets.SUPABASE_ACCESS_TOKEN }}
`, false],
  ["a grep pattern that merely names SUPABASE_SERVICE_ROLE_KEY", `name: x
on: pull_request
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - run: grep -rEn 'SUPABASE_SERVICE_ROLE_KEY' src || true
`, true],
];
scopeCases.forEach(([name, yml, wantPass], i) => {
  const dir = join(tmp, `wf${i}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "w.yml"), yml);
  expect(`secret-scope: ${name}`, run(scope, [dir]), wantPass);
});
expect("secret-scope: the real .github/workflows", run(scope, [join(root, ".github", "workflows")]), true);

// ---- check-supabase-config fixtures ----
const realCfg = readFileSync(join(root, "supabase", "config.toml"), "utf8");
const cfgCases = [
  ["the real supabase/config.toml", realCfg, true],
  ["max_rows 1000", realCfg.replace("max_rows = 200", "max_rows = 1000"), false],
  ["jwt_expiry 3600", realCfg.replace("jwt_expiry = 900", "jwt_expiry = 3600"), false],
  ["signups on", realCfg.replace(/^enable_signup = false/m, "enable_signup = true"), false],
  ["email provider off", realCfg.replace(/(\[auth\.email\][\s\S]*?)enable_signup = true/, "$1enable_signup = false"), false],
  ["hook removed", realCfg.replace(/\[auth\.hook\.before_user_created\][\s\S]*?hook_before_user_created"\n/, ""), false],
  ["social login enabled", realCfg + "\n[auth.external.google]\nenabled = true\n", false],
  ["captcha secret as a literal", realCfg.replace('secret = "env(TURNSTILE_SECRET_KEY)"', 'secret = "0x4AAAAAAAexample"'), false],
  ["Tokyo function sync-tracks", realCfg + "\n[functions.sync-tracks]\nverify_jwt = false\n", false],
  ["staff-invite without JWT verification", realCfg.replace(/(\[functions\.staff-invite\][^\n]*\n)verify_jwt = true/, "$1verify_jwt = false"), false],
  ["schemas without staff", realCfg.replace('schemas = ["api", "staff"]', 'schemas = ["api"]'), false],
];
cfgCases.forEach(([name, text, wantPass], i) => {
  const p = join(tmp, `config${i}.toml`);
  writeFileSync(p, text);
  if (!wantPass && text === realCfg) { failures++; console.log(`BAD  fixture '${name}' did not change the file`); return; }
  expect(`config: ${name}`, run(cfg, [p]), wantPass);
});

// ---- check-csp-bundle fixtures (cutover gate) ----
const cspCheck = join(here, "check-csp-bundle.mjs");
const realVercel = readFileSync(join(root, "vercel.json"), "utf8");
const TOKYO_JS = 'const u="https://lvifatyksqizwcutfbqp.supabase.co";';
const SITE_JS = 'const u="https://qxhpolktdfgcbxtfxgov.supabase.co";';
const noTokyo = realVercel.replace(/ (https|wss):\/\/lvifatyksqizwcutfbqp\.supabase\.co/g, "");
const cspCases = [
  ["today: Tokyo bundle + CSP with Tokyo", realVercel, TOKYO_JS, {}, true],
  ["after cutover: seeld-site bundle + CSP without Tokyo", noTokyo, SITE_JS, {}, true],
  ["after cutover with CUTOVER_DONE=1", noTokyo, SITE_JS, { CUTOVER_DONE: "1" }, true],
  ["bundle moved off Tokyo but CSP still lists Tokyo", realVercel, SITE_JS, {}, false],
  ["CSP drops Tokyo while the bundle still calls it", noTokyo, TOKYO_JS, {}, false],
  ["CUTOVER_DONE=1 with Tokyo still in the CSP", realVercel, TOKYO_JS, { CUTOVER_DONE: "1" }, false],
  ["ipapi.co back in the CSP", realVercel.replace("connect-src 'self'", "connect-src 'self' https://ipapi.co"), TOKYO_JS, {}, false],
  ["bundle with no Supabase URL", realVercel, "console.log(1);", {}, false],
];
cspCases.forEach(([name, vj, js, env, wantPass], i) => {
  const d = join(tmp, `csp${i}`);
  mkdirSync(join(d, "dist", "assets"), { recursive: true });
  writeFileSync(join(d, "vercel.json"), vj);
  writeFileSync(join(d, "dist", "assets", "index-x.js"), js);
  const r = spawnSync(process.execPath, [cspCheck, "--vercel", join(d, "vercel.json"), "--dist", join(d, "dist")], {
    encoding: "utf8",
    env: { ...process.env, CUTOVER_DONE: "", ...env },
  });
  expect(`csp: ${name}`, r, wantPass);
});
if (noTokyo === realVercel || /lvifatyksqizwcutfbqp/.test(noTokyo)) { failures++; console.log("BAD  csp fixture did not remove Tokyo"); }

// ---- check-migration-history fixtures (migrate.yml preflight) ----
const hist = join(here, "check-migration-history.mjs");
const mdir = join(tmp, "migrations");
mkdirSync(mdir);
for (const f of ["20261118162452_foundation_extensions_schemas.sql", "20261119090000_seal_public_schema.sql", "20261119090100_core_agencies.sql"]) {
  writeFileSync(join(mdir, f), "select 1;\n");
}
const histCases = [
  ["production is a prefix of the repo", "20261118162452|foundation_extensions_schemas\n20261119090000|seal_public_schema\n", true],
  ["production equals the repo", "20261118162452|x\n20261119090000|x\n20261119090100|x\n", true],
  ["production has a version the repo lacks (the 20261118205154 case)", "20261118162452|x\n20261118205154|seal_public_schema\n", false],
  ["a pending file older than production's newest", "20261118162452|x\n20261119090100|core_agencies\n", false],
  ["garbage in the remote list", "20261118162452|x\nnot-a-version|y\n", false],
];
histCases.forEach(([name, text, wantPass], i) => {
  const p = join(tmp, `remote${i}.txt`);
  writeFileSync(p, text);
  expect(`history: ${name}`, run(hist, [p, mdir]), wantPass);
});

rmSync(tmp, { recursive: true, force: true });
if (failures) {
  console.error(`${failures} self-test case(s) wrong`);
  process.exit(1);
}
console.log("PASS  all CI checker self-tests");
