// size:check - bundle budget for the main entry chunk (the module script referenced by dist/index.html).
// Compares gzip size against scripts/bundle-baseline.json; fails when it grows more than 8%.
//   npm run size:check                 compare
//   npm run size:check -- --update     rewrite the baseline from the current dist (commit the result)
//   node scripts/size-check.mjs <distDir>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const update = args.includes("--update");
const DIST = resolve(args.find((a) => !a.startsWith("--")) ?? join(ROOT, "dist"));
const BASELINE = join(ROOT, "scripts", "bundle-baseline.json");
const MAX_GROWTH = 0.08;

const html = readFileSync(join(DIST, "index.html"), "utf8");
const m = /<script[^>]*type="module"[^>]*src="(\/assets\/[^"]+\.js)"/.exec(html) ?? /<script[^>]*src="(\/assets\/[^"]+\.js)"[^>]*type="module"/.exec(html);
if (!m) {
  console.error("size:check  could not find the main entry chunk in dist/index.html");
  process.exit(1);
}
const buf = readFileSync(join(DIST, m[1]));
const current = { entry: m[1].replace(/-[A-Za-z0-9_]{6,}\.js$/, ".js"), rawBytes: buf.length, gzipBytes: gzipSync(buf).length };

if (update || !existsSync(BASELINE)) {
  writeFileSync(BASELINE, JSON.stringify({ ...current, updatedAt: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
  console.log(`size:check  baseline written: ${current.gzipBytes} B gzip (${current.rawBytes} B raw)`);
  process.exit(0);
}

const base = JSON.parse(readFileSync(BASELINE, "utf8"));
const growth = (current.gzipBytes - base.gzipBytes) / base.gzipBytes;
const pct = (growth * 100).toFixed(2);
console.log(`size:check  entry=${m[1]}  gzip ${current.gzipBytes} B vs baseline ${base.gzipBytes} B  (${growth >= 0 ? "+" : ""}${pct}%, budget +${MAX_GROWTH * 100}%)`);
if (growth > MAX_GROWTH) {
  console.error("size:check  FAIL: main entry chunk grew beyond budget. Lazy-load the new code, or update the baseline deliberately with --update.");
  process.exit(1);
}
console.log("size:check  ok");
