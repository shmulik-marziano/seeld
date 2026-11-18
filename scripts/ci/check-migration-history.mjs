#!/usr/bin/env node
// migrate.yml preflight: the production migration history must be a prefix-compatible subset of the repo,
// otherwise `supabase db push` refuses ("Remote migration versions not found in local migrations directory")
// or would need --include-all. Fails BEFORE any push, with the exact reconciliation commands to review.
// Usage: node scripts/ci/check-migration-history.mjs <remote.txt> [migrationsDir]
//   remote.txt = `psql -At -F '|' -c "select version, coalesce(name,'') from supabase_migrations.schema_migrations
//   order by version"` (one "version|name" per line). Prints no secret and needs none.
import { readFileSync, readdirSync } from "node:fs";

const [remotePath, dir = "supabase/migrations"] = process.argv.slice(2);
if (!remotePath) {
  console.error("usage: node scripts/ci/check-migration-history.mjs <remote.txt> [migrationsDir]");
  process.exit(2);
}
const remote = readFileSync(remotePath, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => {
    const [version, name = ""] = l.split("|");
    return { version: version.trim(), name: name.trim() };
  });
const local = readdirSync(dir)
  .filter((f) => /^\d{14}_[a-z0-9_]+\.sql$/.test(f))
  .map((f) => ({ version: f.slice(0, 14), name: f.slice(15, -4) }))
  .sort((a, b) => a.version.localeCompare(b.version));

const bad = remote.filter((r) => !/^\d{14}$/.test(r.version));
const localSet = new Set(local.map((l) => l.version));
const remoteSet = new Set(remote.map((r) => r.version));
const problems = [];
if (bad.length) problems.push(`unreadable remote version(s): ${bad.map((b) => JSON.stringify(b.version)).join(", ")}`);

// 1. Remote versions that the repo does not have.
for (const r of remote.filter((x) => /^\d{14}$/.test(x.version) && !localSet.has(x.version))) {
  const twin = local.find((l) => l.name === r.name && !remoteSet.has(l.version));
  problems.push(
    `production has ${r.version}_${r.name || "?"} but supabase/migrations does not.` +
      (twin
        ? ` The repo has the same name as ${twin.version}_${twin.name}.sql. ONLY if the SQL that ran in production is` +
          ` identical to that file: supabase migration repair --db-url "$SUPABASE_DB_URL" --status reverted ${r.version}` +
          ` && supabase migration repair --db-url "$SUPABASE_DB_URL" --status applied ${twin.version}.` +
          ` Otherwise rename the repo file to ${r.version}_${r.name}.sql (T0/coordinator decision).`
        : ` Add the file that ran (from the dashboard history) or mark it reverted after review.`),
  );
}

// 2. Pending local files dated before the newest production version: db push would refuse (out of order).
const maxRemote = remote.map((r) => r.version).filter((v) => /^\d{14}$/.test(v)).sort().at(-1) ?? "";
const pending = local.filter((l) => !remoteSet.has(l.version));
for (const p of pending.filter((x) => x.version < maxRemote)) {
  problems.push(`pending ${p.version}_${p.name}.sql is older than the newest production version ${maxRemote} (out of order; never use --include-all on production without review)`);
}

console.log(`production: ${remote.length} version(s), newest ${maxRemote || "none"}; repo: ${local.length}; pending: ${pending.length}`);
for (const p of pending) console.log(`  pending  ${p.version}_${p.name}.sql`);
if (problems.length) {
  for (const p of problems) console.log(`FAIL  ${p}`);
  process.exit(1);
}
console.log("PASS  production history is consistent with supabase/migrations");
