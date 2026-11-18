#!/usr/bin/env node
// Load the site's public reference data (export of Tokyo, C:/tmp/infra/migrate-site/data) into seeld-site.
// Re-runnable: every insert is INSERT ... ON CONFLICT DO UPDATE ... WHERE row IS DISTINCT (no-op on identical data,
// so updated_at triggers and audit rows are not touched on a re-run). Progress is logged to LOAD-LOG.md and
// finished steps are skipped (resume after a crash).
//
//   node scripts/load/load-site-data.mjs emit-sql  [--table a,b]  write SQL chunks to <workDir>/sql/<table>/NNN.sql + _post.sql
//   node scripts/load/load-site-data.mjs stage     [--table a,b]  write JSON chunks to <workDir>/stage and upload them to the
//                                                                 temporary public Storage bucket (env SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
//   node scripts/load/load-site-data.mjs pull-sql  request        print the SQL that makes Postgres fetch the staged chunks (pg_net)
//   node scripts/load/load-site-data.mjs pull-sql  ingest MIN MAX print the SQL that verifies + ingests responses MIN..MAX
//   node scripts/load/load-site-data.mjs apply     [--table a,b]  apply the SQL chunks through the Management API
//                                                                 (env SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF). Not exercised on 2026-11-18.
//   node scripts/load/load-site-data.mjs unstage                  delete the staged objects from the bucket
//   node scripts/load/load-site-data.mjs verify                   local canonical checksums -> <workDir>/verify/expected.json + checksums.sql
//
// Env (all optional): SITE_DATA_DIR, SITE_LOAD_WORKDIR, SITE_LOAD_LOG, LOAD_BUCKET (default tmp-load).
// Keys: only the publishable (anon) key is ever used here; the secret key is never needed.
import fs from 'node:fs';
import path from 'node:path';
import { ENV, BASE_TABLES, DERIVED, ALL, loadRows, chunks, chunkName, insertSqlValues, insertSqlFromResponses,
  POST_SQL, localChecksum, checksumSql, appendLog, doneSet, sha256 } from './lib/site-data.mjs';

const [, , cmd, ...rest] = process.argv;
const opt = (name, dflt) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : dflt; };
const tables = (opt('table', Object.keys(BASE_TABLES).join(','))).split(',').map(s => s.trim()).filter(Boolean);
for (const t of tables) if (!BASE_TABLES[t]) die(`unknown table ${t}; base tables: ${Object.keys(BASE_TABLES).join(', ')}`);

function die(msg) { console.error(msg); process.exit(1); }
function need(name) { const v = process.env[name]; if (!v) die(`missing env ${name}`); return v; }
const mkdir = p => fs.mkdirSync(p, { recursive: true });
const stageManifest = path.join(ENV.workDir, 'stage', 'manifest.json');
const headers = key => ({ apikey: key, Authorization: `Bearer ${key}` });

switch (cmd) {
  case 'emit-sql': emitSql(); break;
  case 'stage': await stage(); break;
  case 'pull-sql': pullSql(); break;
  case 'apply': await apply(); break;
  case 'unstage': await unstage(); break;
  case 'verify': verify(); break;
  default: die('usage: load-site-data.mjs emit-sql|stage|pull-sql|apply|unstage|verify [--table a,b]');
}

function emitSql() {
  const root = path.join(ENV.workDir, 'sql');
  for (const t of tables) {
    const spec = BASE_TABLES[t];
    const rows = loadRows(spec);
    const dir = path.join(root, t); mkdir(dir);
    const parts = chunks(rows, spec.chunk);
    parts.forEach((part, i) => fs.writeFileSync(path.join(dir, `${chunkName(i)}.sql`), insertSqlValues(spec, part)));
    console.log(`${t}: ${rows.length} rows -> ${parts.length} files in ${dir}`);
  }
  fs.writeFileSync(path.join(root, '_post.sql'), POST_SQL + '\n');
  console.log(`post-load SQL -> ${path.join(root, '_post.sql')}`);
}

async function stage() {
  const url = need('SUPABASE_URL').replace(/\/$/, '');
  const key = need('SUPABASE_PUBLISHABLE_KEY');
  const done = doneSet();
  const manifest = fs.existsSync(stageManifest) ? JSON.parse(fs.readFileSync(stageManifest, 'utf8')) : {};
  for (const t of tables) {
    const spec = BASE_TABLES[t];
    const rows = loadRows(spec);
    const dir = path.join(ENV.workDir, 'stage', t); mkdir(dir);
    const parts = chunks(rows, spec.chunk);
    for (let i = 0; i < parts.length; i++) {
      const name = chunkName(i);
      const body = Buffer.from(JSON.stringify({ table: t, chunk: name, rows: parts[i] }), 'utf8');
      const sha = sha256(body);
      const file = path.join(dir, `${name}.json`);
      fs.writeFileSync(file, body);
      const objPath = `${t}/${name}.json`;
      manifest[`${t}/${name}`] = { table: t, chunk: name, rows: parts[i].length, bytes: body.length, sha256: sha,
        url: `${url}/storage/v1/object/public/${ENV.bucket}/${objPath}` };
      if (done.has(`stage ${t} ${name}`)) { console.log(`skip ${objPath} (done)`); continue; }
      let res = await fetch(`${url}/storage/v1/object/${ENV.bucket}/${objPath}`, { method: 'POST', headers: { ...headers(key), 'Content-Type': 'application/json' }, body });
      if (res.status === 409) {   // object exists from an interrupted run: replace it
        await fetch(`${url}/storage/v1/object/${ENV.bucket}`, { method: 'DELETE', headers: { ...headers(key), 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [objPath] }) });
        res = await fetch(`${url}/storage/v1/object/${ENV.bucket}/${objPath}`, { method: 'POST', headers: { ...headers(key), 'Content-Type': 'application/json' }, body });
      }
      if (!res.ok) die(`upload ${objPath} failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
      appendLog(`DONE stage ${t} ${name} sha256=${sha} rows=${parts[i].length} bytes=${body.length}`);
      console.log(`uploaded ${objPath} rows=${parts[i].length} bytes=${body.length}`);
    }
    fs.writeFileSync(stageManifest, JSON.stringify(manifest, null, 1));
  }
  console.log(`manifest -> ${stageManifest}`);
}

function pullSql() {
  const manifest = JSON.parse(fs.readFileSync(stageManifest, 'utf8'));
  const entries = Object.values(manifest).filter(e => tables.includes(e.table));
  const sub = rest[0];
  if (sub === 'request') {
    const vals = entries.map(e => `('${e.table}', '${e.chunk}', '${e.url}')`).join(',\n  ');
    console.log(`-- 1) ask pg_net to fetch every staged chunk (run once; returns table, chunk, request id)\n` +
      `select c.t, c.chunk, net.http_get(c.url, timeout_milliseconds => 120000) as request_id\nfrom (values\n  ${vals}\n) c(t, chunk, url);`);
    return;
  }
  if (sub === 'ingest') {
    const [min, max] = [rest[1], rest[2]].map(Number);
    if (!min || !max) die('usage: pull-sql ingest MIN_ID MAX_ID');
    const expected = entries.map(e => `('${e.table}', '${e.chunk}', '${e.sha256}')`).join(',\n  ');
    console.log(`-- 2) every response arrived, status 200, body sha256 equals the staged file (expect 0 rows back)\n` +
      `with want(t, chunk, sha) as (values\n  ${expected}\n),\n` +
      `got as (select id, status_code, timed_out, error_msg, content::jsonb ->> 'table' t, content::jsonb ->> 'chunk' chunk,\n` +
      `        encode(sha256(convert_to(content, 'UTF8')), 'hex') sha from net._http_response where id between ${min} and ${max} and content is not null)\n` +
      `select w.t, w.chunk, g.id, g.status_code, g.timed_out, g.error_msg, (g.sha = w.sha) sha_ok from want w left join got g using (t, chunk)\n` +
      `where g.id is null or g.status_code <> 200 or g.sha <> w.sha;\n`);
    for (const t of tables) console.log(`-- 3) ingest ${t}\n` + insertSqlFromResponses(t, BASE_TABLES[t], min, max));
    console.log(`-- 4) after all tables\n${POST_SQL}\n-- 5) drop the fetched bodies (pg_net would keep them 6h)\ndelete from net._http_response where id between ${min} and ${max};`);
    return;
  }
  die('usage: pull-sql request | pull-sql ingest MIN_ID MAX_ID');
}

// Management API path (same endpoint the Supabase MCP server uses). Needs a personal access token.
async function apply() {
  const token = need('SUPABASE_ACCESS_TOKEN');
  const ref = need('SUPABASE_PROJECT_REF');
  const done = doneSet();
  const run = async sql => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql }) });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 500)}`);
    return res.json();
  };
  for (const t of tables) {
    const spec = BASE_TABLES[t];
    const parts = chunks(loadRows(spec), spec.chunk);
    for (let i = 0; i < parts.length; i++) {
      const name = chunkName(i);
      if (done.has(`apply ${t} ${name}`)) { console.log(`skip ${t}/${name} (done)`); continue; }
      await run(insertSqlValues(spec, parts[i]));
      appendLog(`DONE apply ${t} ${name} rows=${parts[i].length}`);
      console.log(`applied ${t}/${name} rows=${parts[i].length}`);
    }
  }
  await run(POST_SQL);
  appendLog('post-load: sequence reset + content.refresh_fund_views() (apply mode)');
  console.log('post-load SQL applied');
}

async function unstage() {
  const url = need('SUPABASE_URL').replace(/\/$/, '');
  const key = need('SUPABASE_PUBLISHABLE_KEY');
  const manifest = JSON.parse(fs.readFileSync(stageManifest, 'utf8'));
  const prefixes = Object.values(manifest).map(e => `${e.table}/${e.chunk}.json`);
  const res = await fetch(`${url}/storage/v1/object/${ENV.bucket}`, { method: 'DELETE', headers: { ...headers(key), 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes }) });
  const txt = await res.text();
  if (!res.ok) die(`delete failed: ${res.status} ${txt.slice(0, 300)}`);
  const n = (() => { try { return JSON.parse(txt).length; } catch { return '?'; } })();
  appendLog(`unstage: deleted ${n} objects from bucket ${ENV.bucket}`);
  console.log(`deleted ${n} objects (asked for ${prefixes.length})`);
}

function verify() {
  const dir = path.join(ENV.workDir, 'verify'); mkdir(dir);
  const expected = {};
  const sqls = [];
  for (const [name, spec] of Object.entries(ALL)) {
    expected[name] = localChecksum(spec, loadRows(spec));
    sqls.push(checksumSql(name, spec));
    console.log(`${name.padEnd(18)} rows=${String(expected[name].rows).padStart(6)} sha256=${expected[name].sha256}`);
  }
  fs.writeFileSync(path.join(dir, 'expected.json'), JSON.stringify(expected, null, 1));
  fs.writeFileSync(path.join(dir, 'checksums.sql'), sqls.join('\nunion all\n') + ';\n');
  console.log(`-> ${path.join(dir, 'expected.json')}\n-> ${path.join(dir, 'checksums.sql')} (run in seeld-site, compare t/rows/sha256)`);
}
